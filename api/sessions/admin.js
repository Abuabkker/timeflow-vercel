const supabase = require("../../lib/supabase");
const { verifyToken, cors } = require("../../lib/auth");
const { fullSession } = require("./today");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).end();

  try {
    const user = await verifyToken(req);
    if (user.role !== "admin") return res.status(403).json({ message: "Admin only" });

    const { date } = req.query;   // ?date=YYYY-MM-DD
    const today    = date || new Date().toISOString().slice(0, 10);

    // Get all active employees
    const { data: employees } = await supabase
      .from("users")
      .select("id, name, avatar")
      .eq("role", "employee")
      .eq("is_active", true)
      .order("name");

    const result = await Promise.all((employees || []).map(async emp => {
      const { data: sess } = await supabase.from("sessions").select("id").eq("user_id", emp.id).eq("date", today).single();
      const session = sess ? await fullSession(sess.id) : null;
      return { user: emp, session };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
