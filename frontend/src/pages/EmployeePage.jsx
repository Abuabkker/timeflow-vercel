import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Sessions } from "../utils/api";
import { msToHMS, fmtTime, sessionWorkMs, taskElapsedMs, isOnBreak, isCheckedIn } from "../utils/helpers";

function TaskRow({ task, onStart, onPause, onComplete }) {
  const [elapsed, setElapsed] = useState(() => taskElapsedMs(task));
  const lastLog = task.logs?.[task.logs.length - 1];
  const running = !!(lastLog?.start_time && !lastLog?.end_time);

  useEffect(() => {
    if (!running) { setElapsed(taskElapsedMs(task)); return; }
    const t = setInterval(() => setElapsed(taskElapsedMs(task)), 1000);
    return () => clearInterval(t);
  }, [running, task]);

  const SC = { pending:"#94a3b8", running:"#6366f1", paused:"#f59e0b", completed:"#10b981" };
  const sc = SC[task.status] || "#94a3b8";

  return (
    <div style={{ background:"#f8fafc", border:`2px solid ${running?"#c7d2fe":"#e2e8f0"}`, borderRadius:14, padding:"13px 16px", display:"flex", alignItems:"center", gap:12, transition:"border-color 0.2s" }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:14, color:"#1e1b4b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{task.title}</div>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:sc }} />
          <span style={{ fontSize:11, color:sc, textTransform:"capitalize", fontWeight:600 }}>{task.status}</span>
          <span style={{ fontSize:11, color:"#94a3b8" }}>· {msToHMS(elapsed)}</span>
        </div>
      </div>
      {task.status !== "completed" ? (
        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
          {task.status !== "running" && <button onClick={onStart} style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:10, padding:"8px 12px", fontSize:12, fontWeight:700 }}>▶ Start</button>}
          {task.status === "running"  && <button onClick={onPause} style={{ background:"#fef3c7", color:"#d97706", border:"none", borderRadius:10, padding:"8px 12px", fontSize:12, fontWeight:700 }}>⏸ Pause</button>}
          <button onClick={onComplete} style={{ background:"#d1fae5", color:"#059669", border:"none", borderRadius:10, padding:"8px 12px", fontSize:12, fontWeight:700 }}>✓ Done</button>
        </div>
      ) : (
        <div style={{ background:"#d1fae5", color:"#059669", borderRadius:10, padding:"8px 12px", fontSize:12, fontWeight:700, flexShrink:0 }}>Completed</div>
      )}
    </div>
  );
}

export default function EmployeePage() {
  const { user, logout }           = useAuth();
  const [session,   setSession]    = useState(null);
  const [newTask,   setNewTask]    = useState("");
  const [loading,   setLoading]    = useState(true);
  const [actioning, setActioning]  = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    Sessions.today().then(r => setSession(r.data)).finally(() => setLoading(false));
    const t = setInterval(() => tick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const call = useCallback(async (fn) => {
    if (actioning) return;
    setActioning(true);
    try { const r = await fn(); setSession(r.data); }
    catch (e) { alert(e.response?.data?.message || "Error"); }
    finally { setActioning(false); }
  }, [actioning]);

  async function addTask() {
    if (!newTask.trim()) return;
    await call(() => Sessions.addTask(newTask.trim()));
    setNewTask("");
  }

  const checkedIn = isCheckedIn(session);
  const onBreak   = isOnBreak(session);
  const workMs    = sessionWorkMs(session);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:40, height:40, border:"4px solid #e2e8f0", borderTop:"4px solid #6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f0f4ff,#faf5ff)" }}>
      <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", height:64, padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontWeight:900, fontSize:20, letterSpacing:-0.5, color:"#1e1b4b" }}>TimeFlow</div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontWeight:700, fontSize:14 }}>{user.name}</div>
            <div style={{ fontSize:11, color:"#94a3b8" }}>{new Date().toLocaleDateString([],{weekday:"long",day:"2-digit",month:"long"})}</div>
          </div>
          <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>{user.avatar}</div>
          <button onClick={logout} style={{ background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:700 }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth:680, margin:"0 auto", padding:"24px 16px", display:"flex", flexDirection:"column", gap:18 }}>
        {/* Clock Card */}
        <div className="fade-in" style={{ background:"#fff", borderRadius:20, padding:24, boxShadow:"0 4px 20px rgba(99,102,241,0.08)", border:"1px solid #e2e8f0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16 }}>
            <div>
              <div style={{ fontSize:11, color:"#94a3b8", textTransform:"uppercase", letterSpacing:2, fontWeight:600 }}>Today's Work Time</div>
              <div style={{ fontSize:32, fontWeight:900, color:"#1e1b4b", letterSpacing:-1, marginTop:4 }}>{msToHMS(workMs)}</div>
              <div style={{ fontSize:13, color:"#94a3b8", marginTop:4 }}>
                {session?.check_in ? `In at ${fmtTime(session.check_in)}` : "Not clocked in yet"}
                {session?.check_out ? ` · Out at ${fmtTime(session.check_out)}` : ""}
              </div>
              {onBreak && <div style={{ marginTop:8, display:"inline-block", background:"#fef3c7", color:"#d97706", borderRadius:8, padding:"4px 10px", fontSize:12, fontWeight:700 }}>On Break</div>}
            </div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {!checkedIn && !session?.check_out && (
                <button disabled={actioning} onClick={() => call(Sessions.checkin)}
                  style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", border:"none", borderRadius:12, padding:"12px 24px", fontSize:14, fontWeight:700, boxShadow:"0 4px 14px rgba(99,102,241,0.4)", opacity:actioning?0.6:1 }}>Clock In</button>
              )}
              {checkedIn && !onBreak && (
                <>
                  <button disabled={actioning} onClick={() => call(Sessions.breakStart)}
                    style={{ background:"#fef3c7", color:"#d97706", border:"2px solid #fde68a", borderRadius:12, padding:"12px 18px", fontSize:13, fontWeight:700, opacity:actioning?0.6:1 }}>Take Break</button>
                  <button disabled={actioning} onClick={() => call(Sessions.checkout)}
                    style={{ background:"#fee2e2", color:"#dc2626", border:"2px solid #fecaca", borderRadius:12, padding:"12px 18px", fontSize:13, fontWeight:700, opacity:actioning?0.6:1 }}>Clock Out</button>
                </>
              )}
              {checkedIn && onBreak && (
                <button disabled={actioning} onClick={() => call(Sessions.breakEnd)}
                  style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", border:"none", borderRadius:12, padding:"12px 24px", fontSize:14, fontWeight:700, opacity:actioning?0.6:1 }}>Resume Work</button>
              )}
              {session?.check_out && <div style={{ background:"#d1fae5", color:"#059669", borderRadius:12, padding:"12px 18px", fontSize:13, fontWeight:700 }}>Clocked Out ✓</div>}
            </div>
          </div>
          {(session?.breaks||[]).length > 0 && (
            <div style={{ marginTop:16, padding:"12px 16px", background:"#fffbeb", borderRadius:12, border:"1px solid #fde68a" }}>
              <div style={{ fontSize:11, color:"#92400e", fontWeight:700, marginBottom:6 }}>Break History</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {session.breaks.map((b,i) => (
                  <span key={i} style={{ fontSize:11, color:"#b45309", background:"#fef3c7", borderRadius:6, padding:"3px 8px" }}>
                    Break {i+1}: {fmtTime(b.start_time)} → {b.end_time?fmtTime(b.end_time):"ongoing"}
                    {b.end_time?` (${msToHMS(new Date(b.end_time)-new Date(b.start_time))})` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tasks Card */}
        {(checkedIn || (session?.tasks||[]).length > 0) && (
          <div className="fade-in" style={{ background:"#fff", borderRadius:20, padding:24, boxShadow:"0 4px 20px rgba(99,102,241,0.08)", border:"1px solid #e2e8f0" }}>
            <div style={{ fontWeight:800, fontSize:16, color:"#1e1b4b", marginBottom:16 }}>Tasks</div>
            {checkedIn && !onBreak && !session?.check_out && (
              <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTask()}
                  placeholder="Add a new task…" style={{ flex:1, border:"2px solid #e2e8f0", borderRadius:12, padding:"12px 16px", fontSize:14, outline:"none" }} />
                <button onClick={addTask} disabled={actioning}
                  style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", border:"none", borderRadius:12, padding:"12px 18px", fontSize:14, fontWeight:700 }}>+ Add</button>
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {(session?.tasks||[]).length === 0 && <div style={{ color:"#cbd5e1", fontSize:14, textAlign:"center", padding:"20px 0" }}>No tasks yet. Add one above.</div>}
              {(session?.tasks||[]).map(t => (
                <TaskRow key={t.id} task={t}
                  onStart={()=>call(()=>Sessions.startTask(t.id))}
                  onPause={()=>call(()=>Sessions.pauseTask(t.id))}
                  onComplete={()=>call(()=>Sessions.completeTask(t.id))}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
