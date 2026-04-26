const { verifyToken, cors } = require("../../lib/auth");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const user = await verifyToken(req);
    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};
