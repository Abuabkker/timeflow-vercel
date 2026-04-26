const supabase   = require("../../lib/supabase");
const { verifyToken, cors } = require("../../lib/auth");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

function msToHM(ms) {
  if (!ms || ms < 0) return "0h 0m";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

async function buildReportData(month, year) {
  const pad  = n => String(n).padStart(2, "0");
  const from = `${year}-${pad(month)}-01`;
  const to   = `${year}-${pad(month)}-${new Date(year, month, 0).getDate()}`;

  const { data: employees } = await supabase.from("users")
    .select("id, name").eq("role", "employee").eq("is_active", true).order("name");

  const { data: sessions } = await supabase.from("sessions")
    .select("id, user_id, check_in, check_out").gte("date", from).lte("date", to);

  const sessionIds = (sessions || []).map(s => s.id);
  const { data: allBreaks } = sessionIds.length
    ? await supabase.from("breaks").select("*").in("session_id", sessionIds) : { data: [] };
  const { data: allTasks } = sessionIds.length
    ? await supabase.from("tasks").select("*").in("session_id", sessionIds) : { data: [] };
  const taskIds = (allTasks || []).map(t => t.id);
  const { data: allLogs } = taskIds.length
    ? await supabase.from("task_logs").select("*").in("task_id", taskIds) : { data: [] };

  const empReports = (employees || []).map(emp => {
    const empSessions = (sessions || []).filter(s => s.user_id === emp.id);
    let totalWorkMs = 0, totalBreakMs = 0;

    empSessions.forEach(s => {
      if (!s.check_in) return;
      const end = s.check_out ? new Date(s.check_out) : new Date();
      const breaks = (allBreaks || []).filter(b => b.session_id === s.id);
      const bMs = breaks.reduce((a, b) => a + ((b.end_time ? new Date(b.end_time) : new Date()) - new Date(b.start_time)), 0);
      totalBreakMs += bMs;
      totalWorkMs  += Math.max(0, end - new Date(s.check_in) - bMs);
    });

    const empTasks = (allTasks || []).filter(t => empSessions.find(s => s.id === t.session_id));
    const taskMap  = {};
    empTasks.forEach(t => {
      const logs = (allLogs || []).filter(l => l.task_id === t.id);
      const liveLog = logs.find(l => !l.end_time);
      const liveMs  = liveLog ? Date.now() - new Date(liveLog.start_time).getTime() : 0;
      const tMs     = (t.total_ms || 0) + liveMs;
      if (!taskMap[t.title]) taskMap[t.title] = { title: t.title, status: t.status, totalMs: 0 };
      taskMap[t.title].totalMs += tMs;
      if (t.status === "completed") taskMap[t.title].status = "completed";
    });

    return {
      userId: emp.id, name: emp.name,
      totalWorkMs, totalBreakMs,
      daysWorked: empSessions.filter(s => s.check_in).length,
      tasksTotal: empTasks.length,
      tasksCompleted: empTasks.filter(t => t.status === "completed").length,
      taskDetails: Object.values(taskMap),
    };
  });

  return { month, year, employees: empReports };
}

function generatePDF(data, companyName) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end",  () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    const W = doc.page.width;

    doc.rect(0, 0, W, 80).fill("#1e1b4b");
    doc.fillColor("#fff").fontSize(22).font("Helvetica-Bold").text(companyName || "TimeFlow", 50, 22);
    doc.fontSize(11).font("Helvetica").fillColor("#a5b4fc")
      .text(`Monthly Report  ·  ${MONTHS[data.month-1]} ${data.year}`, 50, 50);

    let y = 100;
    doc.fillColor("#1e1b4b").fontSize(13).font("Helvetica-Bold").text("Employee Summary", 50, y);
    y += 22;

    const COL = { name:50, days:200, work:270, brk:360, tasks:440, done:510 };
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#6366f1");
    ["EMPLOYEE","DAYS","WORK TIME","BREAK TIME","TASKS","DONE"].forEach((h, i) => doc.text(h, Object.values(COL)[i], y));
    y += 12;
    doc.moveTo(50, y).lineTo(555, y).strokeColor("#c7d2fe").lineWidth(1).stroke();
    y += 6;

    data.employees.forEach((emp, i) => {
      if (y > 720) { doc.addPage(); y = 50; }
      if (i % 2 === 0) doc.rect(45, y-2, 512, 18).fill("#f8fafc");
      doc.fillColor("#1e1b4b").fontSize(9).font("Helvetica");
      doc.text(emp.name, COL.name, y, { width: 145 });
      doc.text(String(emp.daysWorked), COL.days, y);
      doc.text(msToHM(emp.totalWorkMs), COL.work, y);
      doc.text(msToHM(emp.totalBreakMs), COL.brk, y);
      doc.text(String(emp.tasksTotal), COL.tasks, y);
      doc.fillColor("#059669").text(String(emp.tasksCompleted), COL.done, y);
      doc.fillColor("#1e1b4b");
      y += 20;
    });

    y += 24;
    doc.fillColor("#1e1b4b").fontSize(13).font("Helvetica-Bold").text("Task Breakdown", 50, y);
    y += 20;

    data.employees.forEach(emp => {
      if (!emp.taskDetails?.length) return;
      if (y > 700) { doc.addPage(); y = 50; }
      doc.rect(50, y, 505, 20).fill("#ede9fe");
      doc.fillColor("#4338ca").fontSize(10).font("Helvetica-Bold").text(emp.name, 58, y + 5);
      doc.fillColor("#6366f1").fontSize(9).font("Helvetica")
        .text(`${msToHM(emp.totalWorkMs)} worked  ·  ${emp.tasksCompleted}/${emp.tasksTotal} done`, 300, y + 6);
      y += 26;
      doc.fillColor("#94a3b8").fontSize(8).font("Helvetica-Bold");
      doc.text("TASK", 60, y); doc.text("TIME", 370, y); doc.text("STATUS", 460, y);
      y += 12;
      emp.taskDetails.forEach(t => {
        if (y > 745) { doc.addPage(); y = 50; }
        const sc = { completed:"#059669", running:"#6366f1", paused:"#d97706", pending:"#94a3b8" }[t.status] || "#94a3b8";
        doc.fillColor("#334155").fontSize(9).font("Helvetica").text(t.title, 60, y, { width: 295 });
        doc.text(msToHM(t.totalMs), 370, y);
        doc.fillColor(sc).text(t.status, 460, y);
        doc.fillColor("#334155");
        y += 16;
      });
      y += 14;
    });

    doc.fillColor("#94a3b8").fontSize(8).font("Helvetica")
      .text(`Generated by TimeFlow · ${new Date().toLocaleDateString("en-GB", {day:"2-digit",month:"long",year:"numeric"})}`,
        50, doc.page.height - 36, { align: "center", width: 505 });
    doc.end();
  });
}

async function sendEmail(pdfBuffer, month, year) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 587, secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({
    from: `"TimeFlow" <${process.env.EMAIL_USER}>`,
    to:   process.env.ADMIN_EMAIL,
    subject: `📊 Monthly Report — ${MONTHS[month-1]} ${year} | ${process.env.COMPANY_NAME || "TimeFlow"}`,
    html: `<div style="font-family:sans-serif;max-width:600px;">
      <div style="background:#1e1b4b;padding:32px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;">TimeFlow</h1>
        <p style="color:#a5b4fc;margin:8px 0 0;">Monthly Report Ready</p>
      </div>
      <div style="background:#f8fafc;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;">
        <h2 style="color:#1e1b4b;">${MONTHS[month-1]} ${year} Report</h2>
        <p style="color:#64748b;">Your monthly employee report for <strong>${process.env.COMPANY_NAME}</strong> is attached.</p>
      </div>
    </div>`,
    attachments: [{ filename: `TimeFlow_${MONTHS[month-1]}_${year}.pdf`, content: pdfBuffer, contentType: "application/pdf" }],
  });
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const user = await verifyToken(req);
    if (user.role !== "admin") return res.status(403).json({ message: "Admin only" });

    // GET /api/reports  — list
    if (req.method === "GET" && !req.query.month) {
      const { data } = await supabase.from("reports")
        .select("id, month, year, generated_at, email_sent, email_sent_at")
        .order("year", { ascending: false }).order("month", { ascending: false });
      return res.json(data || []);
    }

    // GET /api/reports?month=&year=  — get data
    if (req.method === "GET" && req.query.month) {
      const m = Number(req.query.month), y = Number(req.query.year);
      const { data } = await supabase.from("reports").select("data").eq("month", m).eq("year", y).single();
      if (data) return res.json(data.data);
      const reportData = await buildReportData(m, y);
      return res.json(reportData);
    }

    // GET /api/reports?month=&year=&pdf=1  — download PDF
    if (req.method === "GET" && req.query.pdf) {
      const m = Number(req.query.month), y = Number(req.query.year);
      const data = await buildReportData(m, y);
      const buf  = await generatePDF(data, process.env.COMPANY_NAME || "TimeFlow");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="TimeFlow_${MONTHS[m-1]}_${y}.pdf"`);
      return res.send(buf);
    }

    // POST /api/reports  — generate + email
    if (req.method === "POST") {
      const m = Number(req.body.month) || new Date().getMonth() + 1;
      const y = Number(req.body.year)  || new Date().getFullYear();
      const doEmail = req.body.sendEmail !== false;

      const data = await buildReportData(m, y);
      await supabase.from("reports").upsert({ month: m, year: y, data, generated_at: new Date().toISOString() }, { onConflict: "month,year" });

      if (doEmail && process.env.ADMIN_EMAIL) {
        try {
          const buf = await generatePDF(data, process.env.COMPANY_NAME || "TimeFlow");
          await sendEmail(buf, m, y);
          await supabase.from("reports").update({ email_sent: true, email_sent_at: new Date().toISOString() }).eq("month", m).eq("year", y);
        } catch (e) { console.error("Email failed:", e.message); }
      }
      return res.json({ message: `Report for ${m}/${y} generated${doEmail ? " and emailed" : ""}` });
    }

    res.status(405).json({ message: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
