const bcrypt   = require("bcryptjs");
const supabase = require("../../lib/supabase");
const { verifyToken, cors } = require("../../lib/auth");

function makeAvatar(name) {
  const p = name.trim().split(" ").filter(Boolean);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // GET — public list for login screen
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, role, avatar")
        .eq("is_active", true)
        .order("role", { ascending: false })
        .order("name");
      if (error) throw error;
      return res.json(data);
    }

    // POST — create employee (admin only)
    if (req.method === "POST") {
      const user = await verifyToken(req);
      if (user.role !== "admin") return res.status(403).json({ message: "Admin only" });

      const { name, pin, email = "" } = req.body;
      if (!name?.trim() || !pin) return res.status(400).json({ message: "name and pin required" });
      if (!/^\d{4}$/.test(String(pin))) return res.status(400).json({ message: "PIN must be 4 digits" });

      const pin_hash = await bcrypt.hash(String(pin), 10);
      const avatar   = makeAvatar(name);

      const { data, error } = await supabase
        .from("users")
        .insert({ name: name.trim(), pin_hash, role: "employee", avatar, email })
        .select("id, name, role, avatar, email, created_at")
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    res.status(405).json({ message: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
