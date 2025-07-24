# GenAlpha Translator

Slay the translation game fr fr 💀✨ (GenAlpha ↺)

A modern, AI-powered web app that translates between Standard English, Polish, and GenAlpha slang. Built with Flask, OpenRouter (Qwen 3 235B LLM), and a stylish dark UI.

## Features
- Translate between Standard English ↔ GenAlpha slang
- Translate between Polish ↔ GenAlpha slang
- Two-way translation with a single click
- Modern, dark-mode UI with custom illustrations
- Secure backend (your API key is never exposed)

## Demo
![screenshot](static/genAlpha%20girl%20translate.png)

## Setup
1. **Clone the repo:**
   ```sh
   git clone https://github.com/Morsdors/GenAlphaTranslator.git
   cd GenAlphaTranslator
   ```
2. **Install dependencies:**
   ```sh
   pip install -r requirements.txt
   ```
3. **Run the app:**
   ```sh
   python app.py
   ```
4. **Open in your browser:**
   [http://127.0.0.1:5000/](http://127.0.0.1:5000/)

## Deployment
- You can deploy the app for free on platforms like Render, Railway, or Fly.io.
- For Netlify, you must host the backend elsewhere (see project Q&A for details).

## Project Structure
```
GenAlphaTranslate/
├── app.py
├── requirements.txt
├── .gitignore
├── README.md
├── static/
│   ├── style.css
│   ├── script.js
│   ├── genAlpha girl translate.png
│   └── Boomer man translate.png
└── templates/
    └── index.html
```

## Credits
- Created by **Dorota Solarska** with Cursor
- Powered by **Qwen 3 235B LLM** via OpenRouter
- UI inspired by GenAlpha and Boomer culture

---

> Slay the translation game, fr fr! 💀✨ 