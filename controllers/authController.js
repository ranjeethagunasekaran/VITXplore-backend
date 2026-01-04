const User = require('../models/User');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require("jsonwebtoken");
const generateOtp = require('../utils/generateOtp');

// ✅ Email Transporter
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // MUST be false for port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});


// ✅ Register Controller
exports.register = async (req, res) => {
  try {
    console.log("➡️ Register API hit");

    const { name, email, password } = req.body;
    console.log("📩 Data:", name, email);

    const existingUser = await User.findOne({ email });
    console.log("🔍 User checked");

    if (existingUser) {
      console.log("⚠️ User already exists");
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
      otpExpiry: Date.now() + 10 * 60 * 1000
    });

    await user.save();
    console.log("✅ User saved to DB");

    console.log("📤 Sending email...");
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "VITXPLORE OTP Verification",
      text: `Your OTP is ${otp}`
    });

    console.log("📧 Email sent successfully");

    res.json({ message: "OTP sent to email. Please verify." });

  } catch (err) {
    console.error("❌ REGISTER CRASH:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

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


// ✅ Login Controller

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

  if (user.isVerified !== true) {
  return res.status(400).json({
    message: "Please complete OTP verification"
  });
}


    // 3️⃣ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 4️⃣ Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 5️⃣ Send response
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
