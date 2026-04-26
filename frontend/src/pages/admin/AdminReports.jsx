import { useState, useEffect } from "react";
import { Reports } from "../../utils/api";
import { msToHM, MONTHS } from "../../utils/helpers";

export default function AdminReports() {
  const [reports,    setReports]    = useState([]);
  const [selected,   setSelected]   = useState(null);  // { month, year }
  const [detail,     setDetail]     = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [detailLoad, setDetailLoad] = useState(false);
  const [genMonth,   setGenMonth]   = useState(new Date().getMonth() + 1);
  const [genYear,    setGenYear]    = useState(new Date().getFullYear());
  const [toast,      setToast]      = useState("");

  useEffect(() => { loadList(); }, []);

  async function loadList() {
    setLoading(true);
    try { const r = await Reports.list(); setReports(r.data); }
    finally { setLoading(false); }
  }

  async function loadDetail(month, year) {
    setSelected({ month, year });
    setDetail(null);
    setDetailLoad(true);
    try { const r = await api.get(`/reports/${year}/${month}`); setDetail(r.data); }
    finally { setDetailLoad(false); }
  }

  async function generate() {
    setGenerating(true);
    try {
      await Reports.generate(genMonth, genYear, true);
      showToast("✅ Report generated and emailed!");
      loadList();
      loadDetail(genMonth, genYear);
    } catch (e) {
      showToast("❌ " + (e.response?.data?.message || "Error"));
    } finally { setGenerating(false); }
  }

  function downloadPDF() {
    if (!selected) return;
    const token = localStorage.getItem("tf_token");
    const url   = Reports.pdfUrl(selected.month, selected.year);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `TimeFlow_${MONTHS[selected.month-1]}_${selected.year}.pdf`;
        a.click();
      });
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  const years = [];
  for (let y = new Date().getFullYear(); y >= new Date().getFullYear() - 3; y--) years.push(y);

  return (
    <div style={{ padding: "28px 28px", position: "relative" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, background: "#1e1b4b", color: "#fff", borderRadius: 12, padding: "14px 20px", fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1e1b4b", letterSpacing: -0.5 }}>Monthly Reports</h1>
        <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>Generate, view and download PDF reports. Auto-sent on the 1st of each month.</div>
      </div>

      {/* Generate Panel */}
      <div style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)", borderRadius: 20, padding: "24px 28px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>Generate Report</div>
          <div style={{ fontSize: 13, color: "#a5b4fc", marginTop: 2 }}>Build a report for any month and email it to admin.</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={genMonth} onChange={e => setGenMonth(Number(e.target.value))}
            style={{ border: "1px solid #4338ca", background: "#312e81", color: "#e0e7ff", borderRadius: 10, padding: "9px 14px", fontSize: 13, outline: "none" }}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={genYear} onChange={e => setGenYear(Number(e.target.value))}
            style={{ border: "1px solid #4338ca", background: "#312e81", color: "#e0e7ff", borderRadius: 10, padding: "9px 14px", fontSize: 13, outline: "none" }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={generate} disabled={generating}
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, opacity: generating ? 0.6 : 1 }}>
            {generating ? "Generating…" : "Generate & Email"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>
        {/* Report List */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Saved Reports</div>
          {loading && <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>Loading…</div>}
          {!loading && reports.length === 0 && <div style={{ textAlign: "center", padding: "24px", color: "#cbd5e1", fontSize: 13 }}>No reports yet</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {reports.map(r => (
              <button key={r.id} onClick={() => loadDetail(r.month, r.year)}
                style={{ background: selected?.month === r.month && selected?.year === r.year ? "#ede9fe" : "#f8fafc",
                         border: `2px solid ${selected?.month === r.month && selected?.year === r.year ? "#c7d2fe" : "#e2e8f0"}`,
                         borderRadius: 12, padding: "12px 14px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1b4b" }}>{MONTHS[r.month-1]} {r.year}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: r.email_sent ? "#059669" : "#94a3b8" }}>
                    {r.email_sent ? "✅ Emailed" : "Not emailed"}
                  </span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    · {new Date(r.generated_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Report Detail */}
        <div>
          {!selected && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "48px 24px", textAlign: "center", color: "#cbd5e1", border: "2px dashed #e2e8f0" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
              <div style={{ fontWeight: 700 }}>Select a report or generate a new one</div>
            </div>
          )}

          {selected && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18, color: "#1e1b4b" }}>{MONTHS[selected.month-1]} {selected.year}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>Full employee time & task breakdown</div>
                </div>
                <button onClick={downloadPDF} style={{ background: "#1e1b4b", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  ⬇ Download PDF
                </button>
              </div>

              {detailLoad && <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Loading…</div>}

              {detail && (
                <>
                  {/* Summary table */}
                  <div style={{ overflowX: "auto", marginBottom: 28 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          {["Employee","Days","Work Time","Break Time","Tasks","Completed"].map(h => (
                            <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.employees?.map((emp, i) => (
                          <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1e1b4b" }}>{emp.name}</td>
                            <td style={{ padding: "12px 14px", color: "#64748b" }}>{emp.daysWorked}</td>
                            <td style={{ padding: "12px 14px", fontWeight: 600, color: "#6366f1" }}>{msToHM(emp.totalWorkMs)}</td>
                            <td style={{ padding: "12px 14px", color: "#d97706" }}>{msToHM(emp.totalBreakMs)}</td>
                            <td style={{ padding: "12px 14px", color: "#64748b" }}>{emp.tasksTotal}</td>
                            <td style={{ padding: "12px 14px" }}><span style={{ background: "#d1fae5", color: "#059669", borderRadius: 6, padding: "3px 10px", fontWeight: 700 }}>{emp.tasksCompleted}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Per-employee task breakdown */}
                  {detail.employees?.map((emp, i) => emp.taskDetails?.length > 0 && (
                    <div key={i} style={{ marginBottom: 20 }}>
                      <div style={{ background: "#ede9fe", borderRadius: 10, padding: "10px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, color: "#4338ca", fontSize: 14 }}>{emp.name}</span>
                        <span style={{ fontSize: 12, color: "#6366f1" }}>{msToHM(emp.totalWorkMs)} worked · {emp.tasksCompleted}/{emp.tasksTotal} done</span>
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr>
                            {["Task","Time Spent","Status"].map(h => (
                              <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {emp.taskDetails.map((t, j) => {
                            const TC = { completed:"#059669", running:"#6366f1", paused:"#f59e0b", pending:"#94a3b8" };
                            return (
                              <tr key={j} style={{ borderTop: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "10px 14px", color: "#334155" }}>{t.title}</td>
                                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e1b4b" }}>{msToHM(t.totalMs)}</td>
                                <td style={{ padding: "10px 14px" }}>
                                  <span style={{ color: TC[t.status] || "#94a3b8", fontWeight: 700, textTransform: "capitalize" }}>{t.status}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
