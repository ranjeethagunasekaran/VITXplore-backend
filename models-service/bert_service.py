from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# ✅ Allow both frontend (5500) and backend (5000)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5000", "http://127.0.0.1:5500"]}})

# Load pre-trained model
MODEL_NAME = "unitary/toxic-bert"
print(f"🔄 Loading model: {MODEL_NAME}")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
model.eval()


# Common bad words fallback
BAD_WORDS = ["bitch", "fuck", "shit", "asshole", "bastard", "nonsense", "stupid", "idiot"]

def is_abusive_text(text):
    if not text.strip():
        return False, 0.0, "empty_text"

    # Quick manual bad-word check
    if any(word in text.lower() for word in BAD_WORDS):
        return True, 1.0, "manual_bad_word"

    # Model-based check
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.softmax(logits, dim=1)
        toxic_score = probs[0][1].item()  # Probability of "toxic" class
        is_abusive = toxic_score > 0.7  # You can tune this threshold

    return is_abusive, toxic_score, "model_predicted"

@app.route("/check-abuse", methods=["POST"])
def check_abuse():
    data = request.json
    message = data.get("message", "")

    abusive, score, source = is_abusive_text(message)

    print(f"🧠 [BERT] Text: '{message[:40]}...' | Score: {score:.3f} | Abusive: {abusive} | Source: {source}")

    return jsonify({
        "isAbusive": abusive,
        "score": round(score, 3),
        "source": source
    })

if __name__ == "__main__":
    print("✅ Abuse detection server running on port 5050")
    app.run(port=5050)
