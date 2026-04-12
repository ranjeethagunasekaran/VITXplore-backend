const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

function normalizeDomain(domain) {
  if (!domain) return "";

  return domain
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isSimilarDomain(a, b) {
  if (!a || !b) return false;

  return a.includes(b) || b.includes(a);
}

router.get("/same-domain", authMiddleware, async (req, res) => {
  try {
    const loggedUser = await User.findById(req.user.id);
    if (!loggedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const allUsers = await User.find({ _id: { $ne: loggedUser._id } });

    const loggedDomain = normalizeDomain(loggedUser.dominantDomain);

    console.log("Logged domain:", loggedDomain);

    const similarUsers = allUsers.filter(user => {
      const userDomain = normalizeDomain(user.dominantDomain);

      console.log("Comparing:", loggedDomain, "vs", userDomain);

      return isSimilarDomain(loggedDomain, userDomain);
    });

    console.log("✅ Similar users:", similarUsers.map(u => u.name));

    res.json(similarUsers);

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;