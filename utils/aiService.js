const axios = require("axios");

async function analyzeContent(text) {
  try {

    const response = await axios.post(
      "https://vitxplore-ml.onrender.com/predict",
      { text }
    );

    return response.data;

  } catch (error) {
    console.error("ML API error:", error.message);
    return null;
  }
}

module.exports = { analyzeContent };
