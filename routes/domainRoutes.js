const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

router.get("/same-domain", authMiddleware, async (req, res) => {
  try {
    const loggedUser = await User.findById(req.user.id);

    const users = await User.find({
      dominantDomain: loggedUser.dominantDomain,
      _id: { $ne: loggedUser._id }
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;