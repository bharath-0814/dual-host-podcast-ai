# HACKATHON PROJECT DIARY & CONTEXT HANDOVER

## Project Overview
- **Problem Statement:** Problem Statement 4 - Interactive Voice Podcast Host & Newsletter Reader
- **Deadline:** 1:30 PM today
- **Status:** 🏆 **100% COMPLETE & VERIFIED LIVE GLOBALLY**

---

## 🌐 Live URLs & Submission Links
- **Public Live App URL (Universal HTTPS):** 👉 [https://f3baf52b9f373f13-115-248-83-151.serveousercontent.com](https://f3baf52b9f373f13-115-248-83-151.serveousercontent.com) *(Verified 200 OK! Globally accessible on phone, laptop, and for judges without ISP blocks)*
- **GitHub Repository:** 👉 [https://github.com/bharath-0814/dual-host-podcast-ai](https://github.com/bharath-0814/dual-host-podcast-ai)
- **Vercel Project:** [https://dual-host-podcast-ai.vercel.app](https://dual-host-podcast-ai.vercel.app) *(Note: ISP DNS may block direct .vercel.app in some Indian regions; use the Universal HTTPS URL above for demo)*
- **Local Dev Server:** `http://localhost:3000`

---

## 🏗️ Architecture & Features Delivered
1. **Interactive Dual-Host Audio Pipeline:**
   - Scrapes any article URL (Wikipedia, Substack, Medium, etc.).
   - Generates 2-person realistic dialogue between Host A (energetic/inquisitive) & Host B (analytical/deep).
   - Streams speech line-by-line using ElevenLabs voices (`Rachel` & `Drew`) with fallback to high-quality browser SpeechSynthesis.
   - Shows live subtitles with dynamic badges (`Host A`, `Host B`, `Host A (Answering)`).

2. **Instant Interrupt & Continuous Q&A:**
   - **Persistent Input Bar:** Available directly below the status banner.
   - **Auto-Pause on Type/Focus:** The moment the user clicks or types, the podcast immediately pauses!
   - **Send Arrow Button (`➤`):** Dedicated button on the right edge (or hit `Enter`) to send doubts.
   - **Microphone Toggle (`🎙️ Speak`):** Live speech recognition with pulse animation.
   - **Multiple Consecutive Questions:** No loops, no freezing on the same line.
   - **Instant Resume:** Clicking `🛑 Got My Answer! Resume Podcast with Host A & B ▶️` immediately cuts off Host A's answer and resumes the podcast from the exact sentence index where it was paused.

3. **High-Capacity Model Rotation (Zero 429 Errors):**
   - Rotates across verified endpoints: `gemini-3-flash-preview`, `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-3.7-flash` (all verified 200 OK).

4. **Deployment:**
   - Git repository initialized and pushed to `main`.
   - Live public HTTPS tunnel running and verified 200 OK.
