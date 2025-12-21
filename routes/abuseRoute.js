const express = require("express");
const axios = require("axios");
const router = express.Router();

// POST /api/chat/check-abuse
router.post("/check-abuse", async (req, res) => {
  try {
    const response = await axios.post("http://127.0.0.1:5050/check-abuse", {
      message: req.body.message,
    });

    const data = response.data;

    // Log toxicity for backend debugging
    console.log(`🧠 BERT Model Result → isAbusive: ${data.isAbusive}, Score: ${data.score}, Source: ${data.source}`);

    // Forward the full result to frontend
    res.json({
      isAbusive: data.isAbusive,
      score: data.score,
      source: data.source,
    });

  } catch (err) {
    console.error("❌ Abuse model error:", err.message);
    // Fallback → treat as non-abusive (so chat isn't blocked)
    res.json({ isAbusive: false, score: 0.0, source: "error_fallback" });
  }
});

module.exports = router;
