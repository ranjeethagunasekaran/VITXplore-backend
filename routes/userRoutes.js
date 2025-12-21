// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { updateBio, updatePic, getUser } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

// ✅ Protected Profile Routes
router.get("/me", authMiddleware, getUser);
router.post("/update-bio", authMiddleware, updateBio);
router.post("/update-pic", authMiddleware, updatePic);

// ✅ Get All Users (for Suggestions)
router.get("/users", authMiddleware, async (req, res) => {
  try {
 const currentUser = await User.findById(req.user.id);

const users = await User.find({
  _id: { $ne: req.user.id },
  name: { $exists: true, $ne: "" }
}).select("name pic bio followers following");

const usersWithFollowStatus = users.map(u => ({
  _id: u._id,
  name: u.name,
  pic: u.pic,
  bio: u.bio,
  isFollowing: currentUser.following.includes(u._id)
}));


   res.json(usersWithFollowStatus);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Follow / Unfollow Users
router.post("/follow/:id", authMiddleware, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) return res.status(404).json({ message: "User not found" });

    // If already following, unfollow
    if (currentUser.following.includes(userToFollow._id)) {
      currentUser.following = currentUser.following.filter(
        (uid) => uid.toString() !== userToFollow._id.toString()
      );
      userToFollow.followers = userToFollow.followers.filter(
        (uid) => uid.toString() !== currentUser._id.toString()
      );
      await currentUser.save();
      await userToFollow.save();
      return res.json({ message: "Unfollowed successfully" });
    }

    // Else follow
    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    await currentUser.save();
    await userToFollow.save();

    res.json({ message: "Followed successfully" });
  } catch (err) {
    console.error("Follow route error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
