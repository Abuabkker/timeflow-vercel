const supabase = require("../../lib/supabase");
const { verifyToken, cors } = require("../../lib/auth");
const { fullSession } = require("./today");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  // route: /api/sessions/break?action=start or ?action=end
  const action = req.query.action;

  try {
    const user  = await verifyToken(req);
    const today = new Date().toISOString().slice(0, 10);
    const { data: session } = await supabase.from("sessions").select("*").eq("user_id", user.id).eq("date", today).single();
    if (!session?.check_in || session.check_out) return res.status(400).json({ message: "Not clocked in" });

    if (action === "start") {
      const { data: open } = await supabase.from("breaks").select("id").eq("session_id", session.id).is("end_time", null);
      if (open?.length) return res.status(400).json({ message: "Break already active" });
      await supabase.from("breaks").insert({ session_id: session.id, start_time: new Date().toISOString() });
    } else if (action === "end") {
      const result = await supabase.from("breaks").update({ end_time: new Date().toISOString() }).eq("session_id", session.id).is("end_time", null);
      if (!result.count && result.count !== null) return res.status(400).json({ message: "No active break" });
    } else {
      return res.status(400).json({ message: "action must be start or end" });
    }

    res.json(await fullSession(session.id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
