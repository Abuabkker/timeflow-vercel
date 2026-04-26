const supabase = require("../../lib/supabase");
const { verifyToken, cors } = require("../../lib/auth");
const { fullSession } = require("./today");

async function getTaskWithAuth(taskId, userId) {
  const { data: task } = await supabase
    .from("tasks")
    .select("*, sessions(user_id)")
    .eq("id", taskId)
    .single();
  if (!task) throw new Error("Task not found");
  if (task.sessions.user_id !== userId) throw new Error("Forbidden");
  return task;
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const user  = await verifyToken(req);
    const today = new Date().toISOString().slice(0, 10);
    const action = req.query.action;  // start | pause | complete
    const taskId = req.query.taskId;

    // POST with no taskId = add new task
    if (req.method === "POST" && !taskId) {
      const { title } = req.body;
      if (!title?.trim()) return res.status(400).json({ message: "title required" });

      // get or create session
      let { data: session } = await supabase.from("sessions").select("id").eq("user_id", user.id).eq("date", today).single();
      if (!session) {
        const { data } = await supabase.from("sessions").insert({ user_id: user.id, date: today }).select("id").single();
        session = data;
      }
      await supabase.from("tasks").insert({ session_id: session.id, title: title.trim() });
      return res.json(await fullSession(session.id));
    }

    // PATCH actions on existing task
    if (req.method === "PATCH" && taskId && action) {
      const task = await getTaskWithAuth(taskId, user.id);
      const now  = new Date().toISOString();

      if (action === "start") {
        await supabase.from("task_logs").insert({ task_id: task.id, start_time: now });
        await supabase.from("tasks").update({ status: "running" }).eq("id", task.id);
      }

      if (action === "pause") {
        const { data: log } = await supabase.from("task_logs").select("*").eq("task_id", task.id).is("end_time", null).order("start_time", { ascending: false }).limit(1).single();
        if (log) {
          const ms = Date.now() - new Date(log.start_time).getTime();
          await supabase.from("task_logs").update({ end_time: now }).eq("id", log.id);
          await supabase.from("tasks").update({ total_ms: (task.total_ms || 0) + ms, status: "paused" }).eq("id", task.id);
        } else {
          await supabase.from("tasks").update({ status: "paused" }).eq("id", task.id);
        }
      }

      if (action === "complete") {
        const { data: log } = await supabase.from("task_logs").select("*").eq("task_id", task.id).is("end_time", null).order("start_time", { ascending: false }).limit(1).single();
        if (log) {
          const ms = Date.now() - new Date(log.start_time).getTime();
          await supabase.from("task_logs").update({ end_time: now }).eq("id", log.id);
          await supabase.from("tasks").update({ total_ms: (task.total_ms || 0) + ms, status: "completed" }).eq("id", task.id);
        } else {
          await supabase.from("tasks").update({ status: "completed" }).eq("id", task.id);
        }
      }

      return res.json(await fullSession(task.session_id));
    }

    res.status(400).json({ message: "Invalid request" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
