const express = require('express');
const { register, login, verifyOtp } = require('../controllers/authController');
const authMiddleware = require("../middleware/authMiddleware");
const User = require('../models/User');

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);

router.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

module.exports = router;
