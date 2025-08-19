from flask import Flask, render_template, request, jsonify
import requests
import os

app = Flask(__name__)

# Load API key from environment variable
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODELS = [
    "qwen/qwen3-coder:free",
    "moonshotai/kimi-k2:free",
    "google/gemma-3n-e2b-it:free",
]

# Helper: Build prompt based on direction/language
PROMPT_TEMPLATES = {
    ("en2genalpha", "en"): "Mind that your answer is going to appear directly as a translation in a GenAlpha translator. Translate the following text directly into GenAlpha slang, answer with ONLY the translation as if you were a person speaking, please don't give me a breakdown of the answer nor any additional intro.  Keep your answer the same amount of sentences as the given text: {text}",
    ("genalpha2en", "en"): "Mind that your answer is going to appear directly as a translation in a GenAlpha translator. Translate the following GenAlpha slang into standard English, answer with ONLY the translation as if you were a person speaking, please don't give me a breakdown of the answer nor any additional intro.  Keep your answer the same amount of sentences as the given text: {text}",
    ("pl2genalpha", "pl"): "Mind that your answer is going to appear directly as a translation in a GenAlpha translator. Translate the following Polish text into GenAlpha slang (in Polish), answer with ONLY the translation as if you were a person speaking, please don't give me a breakdown of the answer nor any additional intro.  Keep your answer the same amount of sentences as the given text: {text}",
    ("genalpha2pl", "pl"): "Mind that your answer is going to appear directly as a translation in a GenAlpha translator. Translate the following GenAlpha slang (in Polish) into standard Polish, answer with ONLY the translation as if you were a person speaking, please don't give me a breakdown of the answer nor any additional intro.  Keep your answer the same amount of sentences as the given text: {text}",
}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/translate", methods=["POST"])
def translate():
    data = request.json
    text = data.get("text", "")
    direction = data.get("direction", "en2genalpha")
    language = data.get("language", "en")
    prompt = PROMPT_TEMPLATES.get((direction, language), PROMPT_TEMPLATES[("en2genalpha", "en")]).format(text=text)

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    last_error_text = None
    last_status = None

    for model in MODELS:
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
        try:
            resp = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=60)
            if resp.ok:
                result = resp.json()
                translation = result["choices"][0]["message"]["content"]
                return jsonify({"translation": translation, "model": model})
            else:
                last_status = resp.status_code
                last_error_text = resp.text
                if last_status == 404 or last_status == 429 or (500 <= last_status < 600):
                    continue
                return jsonify({"error": f"Upstream error: {last_error_text}"}), last_status
        except Exception as e:
            last_error_text = str(e)
            last_status = 500
            continue

    return jsonify({"error": f"Upstream error after fallbacks: {last_error_text or 'unknown'}"}), last_status or 500

if __name__ == "__main__":
    app.run(debug=True) 