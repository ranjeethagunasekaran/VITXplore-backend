from fastapi import FastAPI
from pydantic import BaseModel
import torch
import clip
from PIL import Image
import base64
import io
import pytesseract

# ✅ Tesseract path
pytesseract.pytesseract.tesseract_cmd = r"D:\Program Files\Tesseract-OCR\tesseract.exe"

app = FastAPI()

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

domain_prompts = [
    "Web development, frontend, backend, HTML, CSS, JavaScript, React, Node.js",
    "Artificial intelligence, deep learning, neural networks, AI research",
    "Machine learning, supervised learning, models, training data",
    "Cybersecurity, ethical hacking, network security, penetration testing",
    "Data science, data analysis, statistics, Python analytics"
]

class PostInput(BaseModel):
    text: str
    image_base64: str | None = None


def extract_main_domain(text):
    if not text:
        return "General"
    return text.split(",")[0].strip().title()


@app.post("/predict")
async def predict_domain(data: PostInput):

    combined_text = (data.text or "").strip()
    image_features = None

    # ✅ IMAGE + OCR
    if data.image_base64:
        try:
            image_bytes = base64.b64decode(data.image_base64.split(",")[-1])
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

            extracted_text = pytesseract.image_to_string(image)
            combined_text += " " + extracted_text

            processed_image = preprocess(image).unsqueeze(0).to(device)
            image_features = model.encode_image(processed_image)
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)

        except Exception as e:
            print("Image error:", e)

    # ✅ CLEAN + LIMIT TEXT (VERY IMPORTANT)
    combined_text = combined_text.replace("\n", " ").strip()

    if not combined_text:
        combined_text = "general content"

    combined_text = combined_text[:100]

    # ✅ ENCODE PROMPTS
    text_inputs = clip.tokenize(domain_prompts).to(device)
    text_features_domain = model.encode_text(text_inputs)
    text_features_domain = text_features_domain / text_features_domain.norm(dim=-1, keepdim=True)

    # ✅ ENCODE USER TEXT (SAFE)
    text_features_post = model.encode_text(
        clip.tokenize([combined_text], truncate=True).to(device)
    )
    text_features_post = text_features_post / text_features_post.norm(dim=-1, keepdim=True)

    text_similarity = (text_features_post @ text_features_domain.T)

    # ✅ COMBINE IMAGE + TEXT
    if image_features is not None:
        image_similarity = (image_features @ text_features_domain.T)
        similarity = (text_similarity + image_similarity) / 2
    else:
        similarity = text_similarity

    similarity = similarity.softmax(dim=-1)

    scores = similarity[0].tolist()
    max_index = scores.index(max(scores))

    raw_domain = domain_prompts[max_index]
    final_domain = extract_main_domain(raw_domain)

    return {
        "domain_vector": scores,
        "dominant_domain": final_domain
    }