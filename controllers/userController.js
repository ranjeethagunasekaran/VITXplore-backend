const User = require("../models/User");


// ===============================
// ✅ Get Logged In User
// ===============================
const getUser = async (req, res) => {
  try {
    console.log("Logged in user ID:", req.user.id);

    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User from DB:", user.name);

    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// ===============================
// ✅ Update Bio
// ===============================
const updateBio = async (req, res) => {
  try {
    const { bio } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { bio },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    console.error("Update bio error:", err);
    res.status(500).json({ message: "Failed to update bio" });
  }
};


// ===============================
// ✅ Update Profile Picture
// ===============================
const updatePic = async (req, res) => {
  try {
    const { pic } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { pic },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    console.error("Update pic error:", err);
    res.status(500).json({ message: "Failed to update profile picture" });
  }
};


// ===============================
// ✅ Get Similar Users (AI Domain Matching)
// ===============================
const getSimilarUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    if (!currentUser || !currentUser.domainVector) {
      return res.status(400).json({ message: "Domain vector not found" });
    }

    const users = await User.find({
      _id: { $ne: req.user.id },
      domainVector: { $exists: true }
    }).select("name pic bio domainVector dominantDomain");

    // Cosine similarity function
    function cosineSimilarity(a, b) {
      const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      return normA && normB ? dot / (normA * normB) : 0;
    }

    const scoredUsers = users.map(u => ({
      _id: u._id,
      name: u.name,
      pic: u.pic,
      bio: u.bio,
      dominantDomain: u.dominantDomain,
      similarity: cosineSimilarity(
        currentUser.domainVector,
        u.domainVector
      )
    }));

    const topUsers = scoredUsers
      .filter(u => u.similarity > 0.7)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    res.json(topUsers);

  } catch (err) {
    console.error("Similar users error:", err);
    res.status(500).json({ message: "Failed to fetch similar users" });
  }
};


// ===============================
// ✅ Proper Exports
// ===============================
module.exports = {
  getUser,
  updateBio,
  updatePic,
  getSimilarUsers
};

