const supabase = require("../../lib/supabase");
const { verifyToken, cors } = require("../../lib/auth");
const { fullSession } = require("./today");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();
  try {
    const user  = await verifyToken(req);
    const today = new Date().toISOString().slice(0, 10);
    const { data: session } = await supabase.from("sessions").select("*").eq("user_id", user.id).eq("date", today).single();
    if (!session?.check_in) return res.status(400).json({ message: "Not checked in" });
    if (session.check_out)  return res.status(400).json({ message: "Already checked out" });

    const now = new Date().toISOString();
    // close open break
    await supabase.from("breaks").update({ end_time: now }).eq("session_id", session.id).is("end_time", null);
    // pause running tasks
    const { data: runningTasks } = await supabase.from("tasks").select("id").eq("session_id", session.id).eq("status", "running");
    for (const t of (runningTasks || [])) {
      const { data: log } = await supabase.from("task_logs").select("*").eq("task_id", t.id).is("end_time", null).order("start_time", { ascending: false }).limit(1).single();
      if (log) {
        const ms = Date.now() - new Date(log.start_time).getTime();
        await supabase.from("task_logs").update({ end_time: now }).eq("id", log.id);
        const { data: task } = await supabase.from("tasks").select("total_ms").eq("id", t.id).single();
        await supabase.from("tasks").update({ total_ms: (task.total_ms || 0) + ms, status: "paused" }).eq("id", t.id);
      }
    }
    await supabase.from("sessions").update({ check_out: now }).eq("id", session.id);
    res.json(await fullSession(session.id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
