const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Fetch user (only ID and name are needed)
    const user = await User.findById(decoded.id).select("_id name");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ Attach user info to request
    req.user = {
      id: user._id,
      name: user.name
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
};
