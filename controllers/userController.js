const User = require("../models/User");

// ✅ GET current user with followers & following count
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("name bio pic followers following"); // Include followers and following

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      name: user.name,
      bio: user.bio,
      pic: user.pic,
      followers: user.followers,
      following: user.following
    });
  } catch (err) {
    console.error("getUser error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ UPDATE bio
exports.updateBio = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { bio: req.body.bio },
      { new: true }
    );
    res.json({ bio: user.bio });
  } catch (err) {
    res.status(500).json({ error: "Failed to update bio" });
  }
};

// ✅ UPDATE pic
exports.updatePic = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { pic: req.body.pic },
      { new: true }
    );
    res.json({ pic: user.pic });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile picture" });
  }
};
