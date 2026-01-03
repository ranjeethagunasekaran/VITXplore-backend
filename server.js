require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();

// ✅ Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ CORS (ALLOW ALL for deployment)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

// ✅ Routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require("./routes/chatRoutes");
const abuseRoute = require("./routes/abuseRoute");

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat', abuseRoute);

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err.message));

// ✅ Socket.IO Setup
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("chatMessage", (msg) => {
    io.emit("chatMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ✅ Flask model check (LOCAL ONLY)
async function checkModelServer() {
  if (process.env.NODE_ENV === "production") {
    console.log("⚠️ Skipping Flask model check in production");
    return;
  }

  try {
    const res = await axios.post("http://127.0.0.1:5050/api/chat/check-abuse", {
      message: "test"
    });
    console.log(`🤖 BERT model connected → ${res.data.source}`);
  } catch {
    console.warn("⚠️ Flask model not reachable locally");
  }
}

// ✅ Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await checkModelServer();
});

app.get("/envcheck", (req, res) => {
  res.json({
    EMAIL_USER: process.env.EMAIL_USER ? "✅" : "❌",
    EMAIL_PASS: process.env.EMAIL_PASS ? "✅" : "❌",
    JWT_SECRET: process.env.JWT_SECRET ? "✅" : "❌",
  });
});
