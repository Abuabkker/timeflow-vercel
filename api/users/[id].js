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
    const user = await verifyToken(req);
    if (user.role !== "admin") return res.status(403).json({ message: "Admin only" });

    const id = req.query.id;

    // PUT — update
    if (req.method === "PUT") {
      const { name, pin, email } = req.body;

      const { data: existing } = await supabase
        .from("users").select("*").eq("id", id).single();
      if (!existing) return res.status(404).json({ message: "Not found" });

      const updates = {
        name:   name?.trim()  || existing.name,
        email:  email !== undefined ? email : existing.email,
        avatar: name?.trim()  ? makeAvatar(name) : existing.avatar,
      };

      if (pin) {
        if (!/^\d{4}$/.test(String(pin))) return res.status(400).json({ message: "PIN must be 4 digits" });
        updates.pin_hash = await bcrypt.hash(String(pin), 10);
      }

      const { data, error } = await supabase
        .from("users").update(updates).eq("id", id)
        .select("id, name, role, avatar, email, created_at").single();
      if (error) throw error;
      return res.json(data);
    }

    // DELETE — soft delete
    if (req.method === "DELETE") {
      if (String(id) === String(user.id))
        return res.status(400).json({ message: "Cannot delete your own account" });
      await supabase.from("users").update({ is_active: false }).eq("id", id);
      return res.json({ message: "User removed" });
    }

    res.status(405).json({ message: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
