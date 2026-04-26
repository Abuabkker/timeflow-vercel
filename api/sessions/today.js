const supabase = require("../../lib/supabase");
const { verifyToken, cors } = require("../../lib/auth");

async function fullSession(sessionId) {
  const { data: session } = await supabase.from("sessions").select("*").eq("id", sessionId).single();
  if (!session) return null;
  const { data: breaks } = await supabase.from("breaks").select("*").eq("session_id", sessionId).order("start_time");
  const { data: tasks  } = await supabase.from("tasks").select("*").eq("session_id", sessionId).order("created_at");
  const tasksWithLogs = await Promise.all((tasks || []).map(async t => {
    const { data: logs } = await supabase.from("task_logs").select("*").eq("task_id", t.id).order("start_time");
    return { ...t, logs: logs || [] };
  }));
  return { ...session, breaks: breaks || [], tasks: tasksWithLogs };
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const user  = await verifyToken(req);
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from("sessions").select("id").eq("user_id", user.id).eq("date", today).single();
    if (!data) return res.json(null);
    res.json(await fullSession(data.id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.fullSession = fullSession;
