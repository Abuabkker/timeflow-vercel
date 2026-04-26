export function msToHMS(ms) {
  if (!ms || ms < 0) return "0m 0s";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${sec}s`;
}

export function msToHM(ms) {
  if (!ms || ms < 0) return "0h 0m";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export function fmtTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function sessionWorkMs(session) {
  if (!session?.check_in) return 0;
  const end = session.check_out ? new Date(session.check_out) : new Date();
  const breakMs = (session.breaks || []).reduce((acc, b) => {
    const e = b.end_time ? new Date(b.end_time) : new Date();
    return acc + (e - new Date(b.start_time));
  }, 0);
  return Math.max(0, end - new Date(session.check_in) - breakMs);
}

export function taskElapsedMs(task) {
  let ms = Number(task.total_ms) || 0;
  const lastLog = task.logs?.[task.logs.length - 1];
  if (lastLog && lastLog.start_time && !lastLog.end_time) {
    ms += Date.now() - new Date(lastLog.start_time).getTime();
  }
  return ms;
}

export function isOnBreak(session) {
  return !!(session?.breaks?.find(b => !b.end_time));
}

export function isCheckedIn(session) {
  return !!(session?.check_in && !session?.check_out);
}

export function statusBadge(session) {
  if (!session?.check_in)  return { label: "Not In",      color: "#94a3b8", bg: "#f1f5f9" };
  if (session.check_out)   return { label: "Clocked Out", color: "#059669", bg: "#d1fae5" };
  if (isOnBreak(session))  return { label: "On Break",    color: "#d97706", bg: "#fef3c7" };
  return                          { label: "Working",     color: "#6366f1", bg: "#ede9fe" };
}

export const MONTHS = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];
