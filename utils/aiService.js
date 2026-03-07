const axios = require("axios");

async function analyzeContent(text, imageBase64) {
    const response = await axios.post("http://127.0.0.1:8000/predict", {
        text: text,
        image_base64: imageBase64 || null
    });

    return response.data;
}

function convertAIResponseToVector(aiResponse) {
    return aiResponse.domain_vector;
}

module.exports = { analyzeContent, convertAIResponseToVector };