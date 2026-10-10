# 🎙️ PodAI Live — Hackathon 2026 Presentation Deck

---

## Slide 1: Title & Team Credentials (Mandatory Slide 1)
* **Project Title:** PodAI Live — Interactive Dual-Host Podcast & Voice Experience
* **Problem Statement:** Problem 4 — Audio Newsletter Host & Live Conversational Voice
* **Team Leader:** Bharath G
* **Team Name:** PodAI Innovators
* **Event:** AI Summit 2026 Hackathon (LHC Room 003)
* **Repository:** [https://github.com/bharath-0814/dual-host-podcast-ai](https://github.com/bharath-0814/dual-host-podcast-ai)

---

## Slide 2: The Problem
* **Passive Audio is Stale:** Traditional podcasts and text-to-speech audio newsletters are static, 1-way monologues with zero listener interaction.
* **Information Density Barrier:** Complex tech and business articles are overwhelming to read, yet standard audio players don't let listeners ask clarifying questions on the fly.
* **The Need:** An intelligent, dual-host conversational podcast that can be interrupted live via voice or text, providing instant, accurate answers before resuming discussion.

---

## Slide 3: The Solution — PodAI Live
* **Autonomous Dual-Host Dynamic:** Converts any article/newsletter URL into a realistic, natural back-and-forth dialogue between two specialized AI hosts:
  * **Host A (Rachel):** Inquisitive, conversational lead who engages the listener and answers queries.
  * **Host B (Drew):** Analytical, deep-dive co-host who breaks down technical depth.
* **Real-Time Voice Interruption:** Listeners can pause the episode anytime by speaking into their microphone or typing in the chat.
* **Context-Aware Live Q&A:** Host A answers the query with zero conversational fluff, defining the concept directly, then smoothly connects it back to the ongoing podcast.

---

## Slide 4: System Architecture
* **Frontend:** High-performance dark glassmorphic UI, responsive control matrix, animated sound equalizers, and subtitle teleprompter.
* **LLM Engine:** Google Gemini (with automated failover across `gemini-3-flash-preview`, `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-3.7-flash`).
* **Speech Synthesis:** Multi-tier voice architecture:
  * Tier 1: ElevenLabs Conversational Voice API (Rachel & Drew personas).
  * Tier 2: Resilient Web Speech API with pitch-modulated dual voices.
* **Speech Recognition:** Web Speech API for instant voice interruption.

---

## Slide 5: Autonomous Dialogue Generation
* **Instant URL Ingestion:** Parses online newsletters, Wikipedia, and technical blogs via fast summarization and scraping.
* **Scriptwriting Prompt Engine:** Automatically formats natural conversational turns, bantering, analogies, and questions between Host A and Host B without robotic repetition.
* **Zero Cold-Start Latency:** Generates realistic 8-12 turn scripts in under 2 seconds.

---

## Slide 6: Zero-Fluff Live Interruption & Q&A
* **The Innovation:** Unlike standard bots that ramble or evade questions, Host A follows strict factual grounding rules:
  1. **Immediate Factual Definition:** If asked *"What is AGI?"*, sentence 1 immediately defines Artificial General Intelligence accurately.
  2. **Contextual Episode Tie-In:** Sentence 2 cleanly links that definition back to what Host A and Host B were actively discussing.
  3. **Seamless Resumption:** The episode unpauses and continues right from the exact sentence where it left off.

---

## Slide 7: Presentation Mode & Judge Controls
* **Judge Q&A Interruption (`⏹️ Stop Broadcast`):** One-click button (and Spacebar hotkey) that instantly terminates audio playback with zero latency if a judge asks a question during presentation.
* **Pause (`⏸️`) & Resume (`▶️`):** Allows presenters to pause discussion, answer judge queries, and resume the episode without ever reloading the webpage.
* **Playback Speed Selector:** YouTube-style speed pills (`0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`) for rapid review.

---

## Slide 8: Technical Innovations & Resilience
* **Dual-Tier Offline/Online Fallback:** Works 100% reliably even in low-connectivity presentation environments by seamlessly switching between cloud serverless and client-side execution.
* **Chromium Speech Synthesis Keepalive:** Custom watchdog timer preventing browser speech engines from freezing on long lines.
* **Non-Blocking Promise Cancellation:** Guarantees instantaneous audio stopping upon user interruption.

---

## Slide 9: Business Value & Scalability
* **Newsletter Platforms:** Transform Substack, Beehiiv, and Medium posts into interactive daily shows with 10x listener engagement.
* **Corporate Learning & Onboarding:** Employees can listen to technical documentation and ask clarifying questions on confusing concepts in real time.
* **Accessibility:** Empowers visually impaired and audio-first learners to actively converse with written knowledge.

---

## Slide 10: Conclusion & Live Demonstration
* **Summary:** PodAI redefines audio newsletters from passive listening into an active, two-way conversational journey.
* **Production Status:** Fully functional, open-source, and deployed.
* **Public GitHub:** [https://github.com/bharath-0814/dual-host-podcast-ai](https://github.com/bharath-0814/dual-host-podcast-ai)
* **Live App:** [https://dual-host-podcast-ai.vercel.app](https://dual-host-podcast-ai.vercel.app)
* *Thank you! We are ready for live demonstration and Q&A.*
