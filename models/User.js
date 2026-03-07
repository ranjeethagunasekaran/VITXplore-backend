const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpiry: Date,

  bio: { type: String, default: "" },
  pic: { type: String, default: "default.png" },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // 🧠 ADD THIS
  domainVector: {
    type: [Number],
    default: [0, 0, 0, 0, 0]
  },
  dominantDomain: {
    type: String,
    default: "Unknown"
  }
});
module.exports = mongoose.model("User", userSchema);
