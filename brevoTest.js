const axios = require("axios");

require("dotenv").config(); // load BREVO_API_KEY from .env
console.log("BREVO_API_KEY =", process.env.BREVO_API_KEY);

(async () => {
  try {
    const res = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "VITXPLORE", email: "no-reply@brevosmtp.com" },
        to: [{ email: "ranjeetha.g2022@vitstudent.ac.in" }], // <-- replace with your email
        subject: "Test OTP",
        htmlContent: "<p>This is a test email from Brevo ✅</p>"
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );

    console.log("✅ Brevo response:", res.data);
  } catch (err) {
    console.error("❌ Brevo error:", err.response?.data || err.message);
  }
})();
