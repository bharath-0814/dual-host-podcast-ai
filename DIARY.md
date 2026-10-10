# HACKATHON PROJECT DIARY & CONTEXT HANDOVER

## Project Overview
- **Problem Statement:** Problem Statement 4 - Interactive Voice Podcast Host & Newsletter Reader
- **Deadline:** 1:30 PM today
- **Status:** 🏆 **100% COMPLETE & VERIFIED WORKING**
- **Target Architecture:**
  1. User enters article URL into frontend web app (`http://localhost:3002`).
  2. Automated local backend (`server.js`) scrapes article content.
  3. Google Gemini 3.8 Flash rewrites content into a 2-person conversational podcast dialogue (Host A & Host B).
  4. ElevenLabs API patches the Conversational AI Agent prompt with the summary.
  5. Frontend streams dual-host audio line-by-line (Host A = Female, Host B = Male) with live subtitles.
  6. User can click "INTERRUPT & ASK QUESTION" to pause the podcast and speak directly to the ElevenLabs Conversational AI Agent via microphone.

---

## Technical Details & Credentials
- **Project Directory:** `D:\hackathon 10 - 10 - 2026`
- **Active Backend Server:** `server.js` running on `http://localhost:3002`
- **Frontend URL:** `http://localhost:3002`
- **n8n Backup Workflow:** `workflow.json` (Pre-configured importable n8n workflow saved in project folder)
- **API Keys (`.env`):**
  - `GEMINI_API_KEY`: Google Gemini API Key (`gemini-flash-latest`)
  - `ELEVENLABS_API_KEY`: `sk_5a308e5383029f6f3e95f88da7bbf0c3e18d55102a91c6a1`
  - `ELEVENLABS_AGENT_ID`: `agent_9801m4hbn7x9f6prrznefq22v7at`

---

## Progress Bar (100% Complete)
- [x] **Frontend Web UI (`index.html`)**: Interactive UI with URL input, live subtitle streaming, dual-host voice player, and ElevenLabs widget integration.
- [x] **Web Scraper**: Automated HTTP scraper extracting clean article text.
- [x] **LLM Podcast Script Generator**: Gemini Flash generating Host A & Host B dialogue.
- [x] **ElevenLabs Agent Integration**: PATCH API endpoint updating agent prompt.
- [x] **Dual-Voice Audio Engine**: Dual voice playback (Rachel + Drew) with Web Speech API fallback for zero-latency, 100% unkillable playback.
- [x] **Standalone Server (`server.js`)**: Running on Port 3002, removing any manual n8n GUI dependencies.
- [x] **Final Verification**: Verified live in browser with Host A & Host B dynamic dialogue switching.
