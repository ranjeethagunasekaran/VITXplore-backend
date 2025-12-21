// routes/chatRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Chat = require("../models/Chat");

// Get chat history
router.get("/:userId", authMiddleware, async (req, res) => {
  const { userId } = req.params;
  const messages = await Chat.find({
    $or: [
      { senderId: req.user.id, receiverId: userId },
      { senderId: userId, receiverId: req.user.id }
    ]
  }).sort({ createdAt: 1 });
  res.json(messages);
});

// Send message
router.post("/send", authMiddleware, async (req, res) => {
  const { receiverId, text } = req.body;
  const message = await Chat.create({
    senderId: req.user.id,
    receiverId,
    text,
    senderName: req.user.username || req.user.name  // ✅ Store senderName
  });
  res.json(message);
});

module.exports = router;
