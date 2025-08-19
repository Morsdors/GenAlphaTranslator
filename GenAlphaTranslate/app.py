from flask import Flask, render_template, request, jsonify
import requests
import os

app = Flask(__name__)


# Load API key from environment variable or hardcode for demo (not recommended for production)
# OPENROUTER_API_KEY = "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"
import os
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
# OPENROUTER_API_KEY = "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"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "qwen/qwen3-coder:free" 

# Helper: Build prompt based on direction/language
PROMPT_TEMPLATES = {
    ("en2genalpha", "en"): "Translate the following text into GenAlpha slang: {text}",
    ("genalpha2en", "en"): "Translate the following GenAlpha slang into standard English: {text}",
    ("pl2genalpha", "pl"): "Translate the following Polish text into GenAlpha slang (in Polish): {text}",
    ("genalpha2pl", "pl"): "Translate the following GenAlpha slang (in Polish) into standard Polish: {text}",
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
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    try:
        resp = requests.post(OPENROUTER_URL, headers=headers, json=payload)
        resp.raise_for_status()
        result = resp.json()
        translation = result["choices"][0]["message"]["content"]
        return jsonify({"translation": translation})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True) 