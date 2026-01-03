require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();

/* =======================
   ✅ Middleware
======================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  cors({
    origin: "*", // frontend hosted separately
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

/* =======================
   ✅ Routes
======================= */
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const abuseRoute = require("./routes/abuseRoute");

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/chat", abuseRoute);

/* =======================
   ✅ MongoDB
======================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) =>
    console.error("❌ MongoDB Connection Error:", err.message)
  );

/* =======================
   ✅ HTTP + Socket.IO
======================= */
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("chatMessage", (msg) => {
    io.emit("chatMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

/* =======================
   ✅ Flask ML check (LOCAL ONLY)
======================= */
async function checkModelServer() {
  if (process.env.NODE_ENV === "production") {
    console.log("⚠️ Skipping Flask model check in production");
    return;
  }

  try {
    await axios.post("http://127.0.0.1:5050/api/chat/check-abuse", {
      message: "test",
    });
    console.log("🤖 Flask BERT model connected");
  } catch {
    console.warn("⚠️ Flask model not reachable locally");
  }
}

/* =======================
   ✅ Start Server
======================= */
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, async () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  await checkModelServer();
});

/* =======================
   ✅ ENV DEBUG
======================= */
console.log(
  "EMAIL_USER:",
  process.env.EMAIL_USER ? "LOADED" : "MISSING"
);
console.log(
  "EMAIL_PASS:",
  process.env.EMAIL_PASS ? "LOADED" : "MISSING"
);
