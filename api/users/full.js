const supabase = require("../../lib/supabase");
const { verifyToken, cors } = require("../../lib/auth");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const user = await verifyToken(req);
    if (user.role !== "admin") return res.status(403).json({ message: "Admin only" });

    const { data, error } = await supabase
      .from("users")
      .select("id, name, role, avatar, email, is_active, created_at")
      .eq("is_active", true)
      .order("role", { ascending: false })
      .order("name");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
