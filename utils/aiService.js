const axios = require("axios");

const axios = require("axios");

async function analyzeContent(text, imageBase64) {
  try {
    const response = await axios.post(
      "https://ranjeethagunasekaran-vitxplore-ocr.hf.space/run/predict",
      {
        data: [text]   // Gradio expects data array
      }
    );

    return response.data;

  } catch (error) {
    console.error("AI request failed:", error.message);
    return null;
  }
}

function convertAIResponseToVector(aiResponse) {
  return aiResponse.data;
}

module.exports = { analyzeContent, convertAIResponseToVector };