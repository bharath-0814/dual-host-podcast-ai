# 🎙️ PodAI Live — Hackathon 2026 Official Presentation Deck (10 Slides)

> **AI Summit 2026 Hackathon · LHC Room 003**  
> **Problem Statement 4: Audio Newsletter Host & Live Conversational Voice Experience**

---

## Slide 1: Title & Team Credentials (Mandatory Slide 1)
* **Project Title:** PodAI Live — Interactive Dual-Host Podcast & Voice Experience
* **Problem Statement:** Problem 4 — Audio Newsletter Host & Live Conversational Voice Experience
* **Team Name:** PodAI Innovators
* **Team Members & Assigned Roles:**
  * 👑 **Gummadi Bharath Kumar Wesly** — *Team Lead · Full-Stack & Voice Architecture Lead*
  * 🧠 **Krrish Kumar** — *AI / LLM Dialogue & Multi-Agent Prompt Engineering Lead*
  * 🎨 **Swarnim Sulekh** — *Frontend UX & Real-Time Audio Systems Lead*
* **Live Presentation Venue:** LHC Room 003 (Presented Live on Localhost)
* **GitHub Repository:** [https://github.com/bharath-0814/dual-host-podcast-ai](https://github.com/bharath-0814/dual-host-podcast-ai)

---

## Slide 2: The Problem
* **Passive Audio is Stale:** Standard text-to-speech audio newsletters are static, 1-way robotic monologues with zero listener interaction.
* **Information Overload:** Complex technical papers and newsletters are hard to absorb when listeners cannot ask clarifying questions on confusing concepts.
* **The Missing Link:** A natural dual-host format where listeners can pause, interrupt in real time using voice or text, get authoritative answers, and resume seamlessly.

---

## Slide 3: The Solution — PodAI Live
* **Autonomous Dual-Host Dynamic:** Converts any article/newsletter URL into a realistic, natural back-and-forth dialogue between two specialized AI hosts:
  * **Host A (Rachel):** Inquisitive, engaging lead host who leads discussion and handles live listener Q&A.
  * **Host B (Drew):** Analytical, deep-dive co-host who unpacks technical depth and architecture.
* **Real-Time Voice Interruption:** Listeners can pause the episode anytime by speaking into their microphone or typing in the chat.
* **Context-Aware Live Q&A:** Host A defines the concept directly without fluff, connects it back to Host B, and smoothly resumes the episode.

---

## Slide 4: System Architecture
* **Frontend:** High-performance dark glassmorphic UI, responsive control matrix, animated sound equalizers, and subtitle teleprompter.
* **LLM Engine:** Google Gemini with automated quota-failover across 4 flash models for zero-delay script generation.
* **Speech Synthesis:** Multi-tier voice architecture (ElevenLabs Conversational Voice API + Resilient Web Speech API with pitch modulation).
* **Speech Recognition:** Web Speech Recognition API (`webkitSpeechRecognition`) for instant listener speech-to-text.

---

## Slide 5: Autonomous Dialogue Generation
* **Instant URL Ingestion:** Parses online newsletters, Wikipedia, and blogs via fast 150ms REST summarization.
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
* **Zero-Latency Localhost Execution:** Guaranteed 100% reliability in lecture halls with zero reliance on cloud cold starts or external firewalls.
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
* **Presentation Mode:** Presented Live on `http://localhost:3000` in LHC Room 003.
* **Public GitHub:** [https://github.com/bharath-0814/dual-host-podcast-ai](https://github.com/bharath-0814/dual-host-podcast-ai)
* **Team:** Gummadi Bharath Kumar Wesly · Krrish Kumar · Swarnim Sulekh
* *Thank you! We are ready for live demonstration and judges' Q&A.*
