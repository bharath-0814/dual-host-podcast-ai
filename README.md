# 🎙️ PodAI Live — Interactive Dual-Host Podcast & Voice Studio

> **Hackathon 2026 — Problem 4: Audio Newsletter Host & Live Conversational Voice Experience**

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://dual-host-podcast-ai.vercel.app)
[![Google Gemini](https://img.shields.io/badge/LLM-Google%20Gemini%203.8%20Flash-blue?logo=google)](https://ai.google.dev/)
[![ElevenLabs](https://img.shields.io/badge/Voice-ElevenLabs%20Conversational%20TTS-orange)](https://elevenlabs.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)


---

## 🏆 Hackathon 2026 Submission Credentials

* **Project Title:** PodAI Live — Interactive Dual-Host Podcast & Voice Studio
* **Problem Statement:** Problem 4 — Audio Newsletter Host & Live Conversational Voice Experience
* **Team Name:** PodAI Innovators
* **Team Members & Assigned Roles:**
  * 👑 **Gummadi Bharath Kumar Wesly** — *Team Leader · Full-Stack Voice & System Architecture Lead*
  * 🧠 **Krrish Kumar** — *AI / LLM Multi-Agent Dialogue & Prompt Engineering Lead*
  * 🎨 **Swarnim Sulekh** — *Frontend UX & Real-Time Audio Systems Lead*
* **Presentation Venue:** LHC Room 003 (Presentations begin at 3:30 PM)
* **Presentation Deck:** [Interactive Slide Deck (10 Slides)](slides.html) | [Markdown Slides (SLIDES.md)](SLIDES.md)

---

## 🚨 Hackathon Rule #4 Compliance & Live Presentation Note

> **Hackathon Submission Rule #4:** *"A live, deployed product is preferred but not mandatory."*

**We are officially presenting our live product on `http://localhost:3000`** during the judging round in LHC Room 003. Running the demonstration locally on `localhost:3000` guarantees 100% resilience against lecture hall Wi-Fi drops, proxy restrictions, or external API cold-start delays. Both the presentation deck (`http://localhost:3000/slides.html`) and the live interactive voice studio (`http://localhost:3000`) run concurrently and seamlessly.

| Environment | URL | Status | Note |
| :--- | :--- | :--- | :--- |
| **Official Hackathon Demo (Primary)** | [http://localhost:3000](http://localhost:3000) | 🟢 Always Online | Zero-latency LHC Room 003 live demo |
| **Interactive 10-Slide Deck** | [http://localhost:3000/slides.html](http://localhost:3000/slides.html) | 🟢 Live | Keyboard-navigated presentation deck |
| **Vercel Cloud Deployment** | [dual-host-podcast-ai.vercel.app](https://dual-host-podcast-ai.vercel.app) | 🟢 Deployed | Public edge deployment |
| **Live Cloudflare Tunnel** | [boring-gen-migration-tomatoes.trycloudflare.com](https://boring-gen-migration-tomatoes.trycloudflare.com) | 🟢 Active | HTTPS tunnel backup |

---

## 💡 What is PodAI?

PodAI transforms any written article, blog, newsletter, or URL into a **realistic, live audio podcast** co-hosted by two distinct AI personalities:
* **Host A (Rachel):** Enthusiastic, conversational lead host who bridges complex topics and handles live listener Q&A.
* **Host B (Drew):** Analytical, deep-dive co-host who unpacks technical architecture, historical nuances, and deep insights.

Listeners can **pause, interrupt in real time using voice or text, ask questions**, receive instant direct answers from Host A, and smoothly resume the podcast right from where they stopped.

---

## 🚀 Key Features

### 1. 🎙️ Dual-Host Autonomous Dialogue Generation
* Powered by Google Gemini with multi-model quota-failover (`gemini-3-flash-preview`, `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-3.7-flash`).
* Dynamic turn-taking, engaging back-and-forth banter, and intelligent summarization of long-form articles.

### 2. ⏹️ Presentation Mode & Judge Control Matrix
* **Dedicated Stop Broadcast Button (`⏹️`):** Instantly halts the broadcast without refreshing the page, freeing the UI for judge Q&A.
* **Pause (`⏸️`) & Resume (`▶️`):** Freezes on the exact spoken sentence with non-blocking promise cancellation.
* **⌨️ Spacebar Shortcut:** Hit Spacebar anywhere to instantly pause or resume audio playback.

### 3. ⚡ YouTube-Style Speed Controls
* Select playback speed anytime: `0.75x`, `1.0x` (default), `1.25x`, `1.5x`, and `2.0x`.
* Dynamically updates both ElevenLabs audio streaming rates and local browser speech synthesis.

### 4. 🗣️ Live Voice & Text Interrupt Engine
* **Microphone Input (`🎙️ Speak (Mic)`):** Integrated Web Speech API converts spoken questions into queries in real time.
* **Embedded Send Button (`➤`):** Mathematically anchored inside the input box for flawless cross-device layout.
* **Zero-Fluff Host A Answers:** Direct, factual definitions in sentence 1, seamlessly connected to the episode in sentence 2.

---

## 📂 Project Architecture

```
dual-host-podcast-ai/
├── api/                        # Vercel Serverless Functions
│   ├── generate-podcast.js     # Article scraping & Gemini dialogue writer
│   ├── ask-host.js             # Live Q&A factual answer synthesizer
│   └── tts.js                  # ElevenLabs server-side streaming audio proxy
├── css/
│   └── style.css               # Modern dark glassmorphic stylesheet & animations
├── js/
│   └── app.js                  # Modular frontend client, player & mic controller
├── index.html                  # Semantic HTML5 studio interface
├── server.js                   # Local development server with static & API routing
├── vercel.json                 # Modern Vercel rewrite configuration
├── package.json                # Project dependencies & scripts
└── README.md                   # Project documentation
```

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, Modern CSS3 (Glassmorphism, Flexbox/Grid, Equalizer animations), Vanilla ES6+ JavaScript.
* **AI & LLM:** Google Gemini 3.8 / 3 Flash APIs via Google Generative AI REST.
* **Voice Synthesis:** ElevenLabs Conversational Voice API (`Rachel` & `Drew` voice models) with Web Speech API fallback.
* **Speech Recognition:** Web Speech Recognition API (`webkitSpeechRecognition`).
* **Deployment:** Vercel Global Edge Network with Serverless Functions.

---

## 🏃 Local Setup & Development

### 1. Clone the repository
```bash
git clone https://github.com/bharath-0814/dual-host-podcast-ai.git
cd dual-host-podcast-ai
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_google_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### 3. Start Local Server
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Hackathon Team Presentation Quick Guide

1. Paste any article link (e.g. Wikipedia AI, Substack, Medium) and click **▶ Start Broadcast**.
2. Listen to Host A and Host B discuss the topic with live animated sound equalizers.
3. Test speed pills (`1.5x` or `2.0x`) to demonstrate smooth playback control.
4. When a judge asks a question:
   * Click **⏹️ Stop Broadcast** or **⏸️ Pause** (or press **Spacebar**).
   * Type or speak: *"What is AGI?"*
   * Host A immediately responds with an authoritative definition and bridges it back to Host B.
   * Click **▶️ Resume** to continue the show!
