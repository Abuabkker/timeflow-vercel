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

    // upsert session
    const { data: existing } = await supabase.from("sessions").select("*").eq("user_id", user.id).eq("date", today).single();
    if (existing?.check_in) return res.status(400).json({ message: "Already checked in" });

    let sessionId;
    if (existing) {
      await supabase.from("sessions").update({ check_in: new Date().toISOString() }).eq("id", existing.id);
      sessionId = existing.id;
    } else {
      const { data } = await supabase.from("sessions")
        .insert({ user_id: user.id, date: today, check_in: new Date().toISOString() })
        .select("id").single();
      sessionId = data.id;
    }

    res.json(await fullSession(sessionId));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
