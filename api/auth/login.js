const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const supabase = require("../../lib/supabase");
const { cors } = require("../../lib/auth");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const { userId, pin } = req.body;
    if (!userId || !pin) return res.status(400).json({ message: "userId and pin required" });

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .eq("is_active", true)
      .single();

    if (error || !user) return res.status(401).json({ message: "User not found" });

    const ok = await bcrypt.compare(String(pin), user.pin_hash);
    if (!ok) return res.status(401).json({ message: "Incorrect PIN" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    const { pin_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
