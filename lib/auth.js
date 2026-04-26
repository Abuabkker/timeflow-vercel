const jwt = require("jsonwebtoken");
const supabase = require("./supabase");

async function verifyToken(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new Error("No token");
  const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
  const { data, error } = await supabase
    .from("users")
    .select("id, name, role, avatar, email, is_active")
    .eq("id", decoded.id)
    .single();
  if (error || !data || !data.is_active) throw new Error("User not found");
  return data;
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

module.exports = { verifyToken, cors };
