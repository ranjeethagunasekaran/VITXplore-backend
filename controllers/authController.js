const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const generateOtp = require("../utils/generateOtp");

// ==========================
// REGISTER
// ==========================
exports.register = async (req, res) => {
  try {
    console.log("➡️ Register API hit");

    const { name, email, password } = req.body;
    console.log("📩 Data:", name, email);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔐 Password hashed");

    const otp = generateOtp();
    console.log("🔢 OTP generated:", otp);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000,
      isVerified: false
    });

    await user.save();
    console.log("✅ User saved to DB");

    console.log("📤 Sending email via Brevo API...");

    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "VITXPLORE", email: "no-reply@vitxplore.com" },
        to: [{ email }],
        subject: "VITXPLORE OTP Verification",
        htmlContent: `<p>Your OTP is <b>${otp}</b></p>`
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );

    console.log("📧 Email sent successfully");

    res.json({ message: "OTP sent to email. Please verify." });

  } catch (err) {
    console.error("❌ REGISTER CRASH:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

// ==========================
// VERIFY OTP
// ==========================
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified)
      return res.json({ message: "Already verified" });

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "OTP verified successfully" });

  } catch (err) {
    res.status(500).json({ message: "OTP verification failed" });
  }
};

// ==========================
// LOGIN
// ==========================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User not found" });

    if (!user.isVerified)
      return res.status(400).json({ message: "Please complete OTP verification" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
};
