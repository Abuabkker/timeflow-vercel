import { useState, useEffect } from "react";
import { Sessions } from "../../utils/api";
import { msToHMS, msToHM, fmtTime, sessionWorkMs, taskElapsedMs, isOnBreak, isCheckedIn, statusBadge, todayKey } from "../../utils/helpers";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px 20px", boxShadow: "0 4px 16px rgba(0,0,0,0.05)", borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 30, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

export default function AdminOverview() {
  const [data,     setData]     = useState([]);
  const [date,     setDate]     = useState(todayKey());
  const [loading,  setLoading]  = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await Sessions.admin(date);
      setData(r.data);
    } catch { setData([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [date]);

  // Auto-refresh every 30s when viewing today
  useEffect(() => {
    if (date !== todayKey()) return;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [date]);

  const working    = data.filter(d => isCheckedIn(d) && !isOnBreak(d)).length;
  const onBreakCnt = data.filter(d => isOnBreak(d)).length;
  const outCnt     = data.filter(d => d.check_out).length;

  return (
    <div style={{ padding: "28px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1e1b4b", letterSpacing: -0.5 }}>Live Overview</h1>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>Real-time employee status</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ border: "2px solid #e2e8f0", background: "#fff", borderRadius: 10, padding: "9px 14px", fontSize: 13, outline: "none", color: "#1e1b4b" }} />
          <button onClick={load} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700 }}>
            Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Employees" value={data.length}  color="#6366f1" />
        <StatCard label="Working Now"     value={working}      color="#059669" />
        <StatCard label="On Break"        value={onBreakCnt}   color="#d97706" />
        <StatCard label="Clocked Out"     value={outCnt}       color="#dc2626" />
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <div style={{ width: 36, height: 36, border: "4px solid #e2e8f0", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {!loading && data.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 20, padding: "48px 24px", textAlign: "center", color: "#cbd5e1", border: "2px dashed #e2e8f0" }}>
          <CalendarMonthIcon sx={{ fontSize: 48, marginBottom: 1, color: "#cbd5e1" }} />
          <div style={{ fontWeight: 700 }}>No activity found for this date</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.map(({ user, ...session }) => {
          const badge      = statusBadge(session);
          const workMs     = sessionWorkMs(session);
          const tasks      = session.tasks || [];
          const doneTasks  = tasks.filter(t => t.status === "completed").length;

          return (
            <div key={session.id} style={{ background: "#fff", borderRadius: 20, padding: 22, boxShadow: "0 4px 16px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {user?.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1e1b4b" }}>{user?.name}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, background: badge.bg, color: badge.color, borderRadius: 8, padding: "3px 10px", fontWeight: 700 }}>{badge.label}</span>
                      {session.check_in  && <span style={{ fontSize: 12, color: "#94a3b8" }}>In: {fmtTime(session.check_in)}</span>}
                      {session.check_out && <span style={{ fontSize: 12, color: "#94a3b8" }}>Out: {fmtTime(session.check_out)}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 900, fontSize: 22, color: "#1e1b4b" }}>{msToHMS(workMs)}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{tasks.length} tasks · {doneTasks} completed</div>
                </div>
              </div>

              {/* Breaks */}
              {(session.breaks || []).length > 0 && (
                <div style={{ marginTop: 14, padding: "10px 14px", background: "#fffbeb", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#b45309", fontWeight: 700, marginBottom: 4 }}>BREAKS</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {session.breaks.map((b, i) => (
                      <span key={i} style={{ fontSize: 11, color: "#b45309", background: "#fef3c7", borderRadius: 6, padding: "3px 8px" }}>
                        Break {i+1}: {fmtTime(b.start_time)} → {b.end_time ? fmtTime(b.end_time) : "ongoing"}
                        {b.end_time ? ` (${msToHMS(new Date(b.end_time) - new Date(b.start_time))})` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {tasks.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Tasks</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {tasks.map(t => {
                      const TC = { pending:"#94a3b8", running:"#6366f1", paused:"#f59e0b", completed:"#10b981" };
                      const elapsed = taskElapsedMs(t);
                      return (
                        <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: TC[t.status] || "#94a3b8", flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{t.title}</span>
                          </div>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: TC[t.status], fontWeight: 700, textTransform: "capitalize" }}>{t.status}</span>
                            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{msToHMS(elapsed)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!session.check_in && (
                <div style={{ marginTop: 14, textAlign: "center", color: "#cbd5e1", fontSize: 13 }}>No activity on this date</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
