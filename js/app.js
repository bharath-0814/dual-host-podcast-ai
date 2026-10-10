/**
 * PodAI Live — Interactive Dual-Host Podcast & Voice Studio
 * Bulletproof Frontend Controller with Multi-Tier Voice Engine
 */

const serverUrl = window.location.origin;
const GEMINI_CLIENT_KEY = window.GEMINI_API_KEY || "";
const GEMINI_MODELS = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.7-flash'
];

// ElevenLabs Voice IDs
const voices = {
    "Host A": "21m00Tcm4TlvDq8ikWAM", // Rachel (Female Lead Host)
    "Host B": "29vD33N1CtxCmqQRPOHJ"  // Drew (Male Co-Host)
};

// Global App & Playback State
let currentAudio = null;
let activeAudioResolver = null;
let globalScriptData = [];
let rawFullScript = "";
let currentLineIndex = 0;
let isInterrupted = false;
let isAnswering = false;
let isBroadcastRunning = false;
let isPaused = false;
let recognition = null;
let isListeningMic = false;
let currentPlaybackSpeed = 1.0;

// Ensure browser voices are loaded early
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

/**
 * YouTube-style Playback Speed Controller
 */
function setPlaybackSpeed(speed) {
    currentPlaybackSpeed = parseFloat(speed) || 1.0;
    document.querySelectorAll('.btn-speed').forEach(btn => {
        btn.classList.toggle('active', parseFloat(btn.dataset.speed) === currentPlaybackSpeed);
    });
    if (currentAudio) {
        try {
            currentAudio.playbackRate = currentPlaybackSpeed;
        } catch (e) {}
    }
    // If browser speech synthesis is currently active, instantly restart the current line at the new rate
    if ('speechSynthesis' in window && window.speechSynthesis.speaking && isBroadcastRunning && !isPaused && !isInterrupted) {
        const line = globalScriptData[currentLineIndex];
        if (line) {
            try {
                window.speechSynthesis.cancel();
                speakTextRobust(line.text, line.speaker === "Host A", currentPlaybackSpeed);
            } catch (e) {}
        }
    }
}

/**
 * Updates UI action buttons according to playback state
 */
function updateBroadcastControlsUI(state) {
    const genBtn = document.getElementById('gen-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const stopBtn = document.getElementById('stop-btn');
    const stagePauseBtn = document.getElementById('stage-pause-btn');
    const stageStopBtn = document.getElementById('stage-stop-btn');

    if (state === 'playing') {
        genBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-flex';
        resumeBtn.style.display = 'none';
        stopBtn.style.display = 'inline-flex';
        if (stagePauseBtn) stagePauseBtn.innerText = "⏸️ Pause";
        if (stageStopBtn) stageStopBtn.style.display = 'inline-flex';
    } else if (state === 'paused') {
        genBtn.style.display = 'none';
        pauseBtn.style.display = 'none';
        resumeBtn.style.display = 'inline-flex';
        stopBtn.style.display = 'inline-flex';
        if (stagePauseBtn) stagePauseBtn.innerText = "▶️ Resume";
        if (stageStopBtn) stageStopBtn.style.display = 'inline-flex';
    } else { // idle or stopped
        genBtn.style.display = 'inline-flex';
        genBtn.disabled = false;
        pauseBtn.style.display = 'none';
        resumeBtn.style.display = 'none';
        stopBtn.style.display = 'none';
        if (stageStopBtn) stageStopBtn.style.display = 'none';
    }
}

/**
 * Pause broadcast for judge questions
 */
function pauseBroadcast() {
    if (!isBroadcastRunning && !currentAudio && (!window.speechSynthesis || !window.speechSynthesis.speaking)) return;
    isInterrupted = true;
    isPaused = true;
    stopAllAudio();
    updateBroadcastControlsUI('paused');

    const consoleEl = document.getElementById('interrupt-console');
    consoleEl.style.display = 'block';
    consoleEl.classList.add('active');
    document.getElementById('console-status').innerHTML = "<span>⏸️</span> <b>Broadcast Paused for Judge Questions!</b> Ask question below or click Resume:";
    document.getElementById('btn-resume').style.display = 'block';
    
    const statusMsg = document.getElementById('status-message');
    statusMsg.innerText = `⏸️ Broadcast paused at Line ${currentLineIndex + 1} of ${globalScriptData.length}. Ready for questions.`;
    statusMsg.style.color = "#fbbf24";
}

/**
 * Resume podcast from paused line
 */
function resumeBroadcast() {
    if (globalScriptData.length === 0) return;
    stopAllAudio();
    isInterrupted = false;
    isPaused = false;
    isAnswering = false;
    isBroadcastRunning = true;
    updateBroadcastControlsUI('playing');

    const consoleEl = document.getElementById('interrupt-console');
    consoleEl.classList.remove('active');
    document.getElementById('btn-resume').style.display = 'none';
    document.getElementById('console-status').innerHTML = "<span>▶️</span> Resuming podcast discussion...";
    
    const statusMsg = document.getElementById('status-message');
    statusMsg.innerText = "✨ Broadcast Live! Listening to Host A & Host B.";
    statusMsg.style.color = "#34d399";

    playScript(currentLineIndex);
}

/**
 * Stop broadcast completely without reloading page
 */
function stopBroadcast() {
    stopAllAudio();
    isBroadcastRunning = false;
    isInterrupted = true;
    isPaused = false;
    isAnswering = false;
    currentLineIndex = 0;

    resetHostCards();
    updateBroadcastControlsUI('idle');

    const badge = document.getElementById('current-badge');
    if (badge) {
        badge.innerText = "⏹️ Stopped";
        badge.className = "current-badge badge-ans";
    }
    document.getElementById('current-text').innerText = "Broadcast stopped by presenter. Ready to ask questions or start again.";
    
    const statusMsg = document.getElementById('status-message');
    statusMsg.innerText = "⏹️ Broadcast stopped. You can ask questions to Host A below or click Start Broadcast.";
    statusMsg.style.color = "#f87171";

    document.getElementById('btn-resume').style.display = 'none';
    document.getElementById('interrupt-console').classList.remove('active');
}

function toggleStagePause() {
    if (isPaused) {
        resumeBroadcast();
    } else {
        pauseBroadcast();
    }
}

/**
 * Calls Gemini directly with model quota failover
 */
async function callGeminiDirect(promptText) {
    for (const model of GEMINI_MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_CLIENT_KEY}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.candidates && data.candidates[0].content.parts[0].text) {
                    return data.candidates[0].content.parts[0].text;
                }
            }
        } catch (e) {
            console.warn(`Gemini direct model ${model} failed, trying next...`);
        }
    }
    throw new Error("Gemini direct generation unavailable.");
}

/**
 * Fast article text extractor
 */
async function extractContent(input) {
    input = input.trim();
    if (!input.startsWith('http://') && !input.startsWith('https://')) {
        return input; // Direct topic or text
    }

    // Fast Wikipedia summary API (returns in 150ms!)
    if (input.includes('wikipedia.org/wiki/')) {
        try {
            const pageName = input.split('/wiki/')[1].split('#')[0].split('?')[0];
            const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageName)}`);
            if (wikiRes.ok) {
                const data = await wikiRes.json();
                return `${data.title}: ${data.extract || data.description}`;
            }
        } catch (e) {}
    }

    // Try server extraction
    try {
        const sRes = await fetch(`${serverUrl}/api/generate-podcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ article_url: input })
        });
        if (sRes.ok) {
            const text = await sRes.text();
            if (text.length > 50) return text;
        }
    } catch (e) {}

    return `The article discusses developments in ${input.replace(/^https?:\/\//, '').split('/')[0]}.`;
}

/**
 * Main Generator
 */
async function generatePodcast() {
    stopAllAudio();
    isInterrupted = false;
    isPaused = false;
    isAnswering = false;
    currentLineIndex = 0;
    globalScriptData = [];
    
    const inputVal = document.getElementById('article-url').value;
    const statusMsg = document.getElementById('status-message');
    const genBtn = document.getElementById('gen-btn');
    genBtn.disabled = true;

    statusMsg.style.color = "#38bdf8";
    statusMsg.innerText = "⏳ Synthesizing dialogue between Host A & Host B via Gemini...";
    
    try {
        let scriptText = "";

        // 1. Try server endpoint first
        try {
            const response = await fetch(`${serverUrl}/api/generate-podcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ article_url: inputVal })
            });
            if (response.ok) {
                scriptText = await response.text();
            }
        } catch (e) {}

        // 2. Client fallback direct generation
        if (!scriptText || scriptText.length < 50 || scriptText.startsWith("Error")) {
            console.log("Using instant direct Gemini script generator...");
            const cleanContent = await extractContent(inputVal);
            const prompt = `You are a podcast scriptwriter. Create a realistic, conversational 8 to 12 line dialogue script between Host A (Rachel - enthusiastic, inquisitive) and Host B (Drew - analytical, deep dive) discussing this topic:\n\n${cleanContent}\n\nStrict format: Each line must begin with "Host A:" or "Host B:". No stage directions.`;
            scriptText = await callGeminiDirect(prompt);
        }

        rawFullScript = scriptText;
        globalScriptData = parseTextScript(rawFullScript);

        if (globalScriptData.length === 0) {
            // Robust fallback dialogue in case parsing missed tags
            globalScriptData = [
                { speaker: "Host A", text: "Welcome back to the studio everyone! Today we are breaking down breakthroughs in artificial intelligence and automation." },
                { speaker: "Host B", text: "That is right, Host A. The rate of technological progress in foundation models and neural reasoning is moving at an unbelievable pace." },
                { speaker: "Host A", text: "Exactly! And for everyone listening live, feel free to pause and interrupt with any questions as we break this down!" },
                { speaker: "Host B", text: "Let us dive straight into how these architectures are transforming our everyday workflows." }
            ];
        }

        statusMsg.innerText = "✨ Broadcast Live! Listening to Host A & Host B.";
        statusMsg.style.color = "#34d399";
        document.getElementById('interrupt-console').style.display = 'block';
        document.getElementById('stage-box').style.display = 'block';

        playScript(0);

    } catch (error) {
        console.error("Error:", error);
        statusMsg.innerText = "Error: " + error.message;
        statusMsg.style.color = "#f87171";
        updateBroadcastControlsUI('idle');
    }
}

/**
 * Parses raw dialogue into lines
 */
function parseTextScript(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    const result = [];
    let currentHost = "Host A";

    for (const line of lines) {
        if (line.startsWith('{') || line.startsWith('}')) continue;

        const lower = line.toLowerCase();
        if (lower.includes("host b")) currentHost = "Host B";
        else if (lower.includes("host a")) currentHost = "Host A";

        const dialogue = line.replace(/\*\*Host [AB]:?\*\*/gi, '')
                           .replace(/Host [AB]:?/gi, '')
                           .replace(/\*/g, '')
                           .trim();

        if (dialogue.length > 3) {
            result.push({ speaker: currentHost, text: dialogue });
            currentHost = (currentHost === "Host A") ? "Host B" : "Host A";
        }
    }
    return result;
}

/**
 * Bulletproof Chromium & Cross-Browser Speech Synthesis
 * Solves Chromium pause bug, missing onend events, and empty voice arrays.
 */
function speakTextRobust(text, isFemale, speed) {
    return new Promise((resolve) => {
        if (!('speechSynthesis' in window)) {
            setTimeout(resolve, 1500);
            return;
        }

        try {
            window.speechSynthesis.cancel();
            window.speechSynthesis.resume();
        } catch (e) {}

        const effectiveRate = Math.min(2.0, Math.max(0.5, parseFloat(speed || currentPlaybackSpeed || 1.0)));
        const u = new SpeechSynthesisUtterance(text);
        u.rate = effectiveRate;
        u.pitch = isFemale ? 1.15 : 0.95;

        const allVoices = window.speechSynthesis.getVoices();
        if (allVoices.length > 0) {
            if (isFemale) {
                u.voice = allVoices.find(v => v.name.includes("Female") || v.name.includes("Zira") || v.name.includes("Samantha") || v.name.includes("Google UK English Female")) || allVoices[0];
            } else {
                u.voice = allVoices.find(v => v.name.includes("Male") || v.name.includes("David") || v.name.includes("Alex") || v.name.includes("Google UK English Male")) || allVoices[1] || allVoices[0];
            }
        }

        let finished = false;
        const done = () => {
            if (!finished) {
                finished = true;
                clearInterval(keepAlive);
                clearTimeout(safetyTimer);
                activeAudioResolver = null;
                resolve();
            }
        };

        activeAudioResolver = done;
        u.onend = done;
        u.onerror = (e) => {
            console.warn("Speech error, continuing...", e);
            done();
        };

        // Chromium keepalive workaround for long utterances
        const keepAlive = setInterval(() => {
            if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }
        }, 1500);

        // Safety timeout so it NEVER freezes (scaled dynamically by speech rate)
        const wordCount = text.split(' ').length;
        const maxTimeMs = Math.max(2000, ((wordCount / (2.2 * effectiveRate)) * 1000) + 2500);
        const safetyTimer = setTimeout(done, maxTimeMs);

        try {
            window.speechSynthesis.speak(u);
        } catch (e) {
            done();
        }
    });
}

/**
 * Sequential player through episode dialogue
 */
async function playScript(startIndex) {
    isBroadcastRunning = true;
    updateBroadcastControlsUI('playing');

    for (let i = startIndex; i < globalScriptData.length; i++) {
        if (isInterrupted || isPaused || !isBroadcastRunning) {
            currentLineIndex = i;
            break;
        }

        currentLineIndex = i;
        const line = globalScriptData[i];
        const isHostA = (line.speaker === "Host A");

        updateStageSpeaker(line.speaker, i + 1, globalScriptData.length);
        document.getElementById('current-text').innerText = `"${line.text}"`;

        // Speak using robust synthesis engine
        await speakTextRobust(line.text, isHostA, currentPlaybackSpeed);
    }

    if (!isInterrupted && !isPaused && isBroadcastRunning) {
        isBroadcastRunning = false;
        resetHostCards();
        document.getElementById('current-badge').innerText = "📻 Ended";
        document.getElementById('current-badge').className = "current-badge badge-ans";
        document.getElementById('current-text').innerText = "Episode finished. Enter a new article to start another broadcast.";
        updateBroadcastControlsUI('idle');
    }
}

function updateStageSpeaker(speaker, current, total) {
    const badge = document.getElementById('current-badge');
    const counter = document.getElementById('stage-counter');
    badge.innerText = speaker;
    badge.className = 'current-badge ' + (speaker === 'Host A' ? 'badge-a' : (speaker === 'Host B' ? 'badge-b' : 'badge-ans'));
    counter.innerText = `Line ${current} of ${total}`;

    const cardA = document.getElementById('card-host-a');
    const cardB = document.getElementById('card-host-b');

    if (speaker === 'Host A') {
        cardA.className = 'host-pill active host-a-active';
        cardB.className = 'host-pill';
    } else if (speaker === 'Host B') {
        cardB.className = 'host-pill active host-b-active';
        cardA.className = 'host-pill';
    } else {
        cardA.className = 'host-pill active host-a-active';
        cardB.className = 'host-pill';
    }
}

function resetHostCards() {
    document.getElementById('card-host-a').className = 'host-pill';
    document.getElementById('card-host-b').className = 'host-pill';
}

function pauseOnInputFocus() {
    if (isBroadcastRunning && !isInterrupted && !isAnswering && globalScriptData.length > 0) {
        pauseBroadcast();
    }
}

function handleInputKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        submitQuestion();
    }
}

/**
 * Microphone Voice Interruption Toggle
 */
function toggleMicListen() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser. Please type your question!");
        return;
    }

    if (isListeningMic && recognition) {
        recognition.stop();
        return;
    }

    pauseBroadcast();

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    const micBtn = document.getElementById('mic-btn');
    micBtn.classList.add('listening');
    micBtn.innerText = "🛑 Listening...";
    document.getElementById('console-status').innerHTML = "<span>🎙️</span> Listening to your voice... Speak now!";
    isListeningMic = true;

    recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        document.getElementById('question-input').value = text;
        document.getElementById('console-status').innerHTML = `<span>🗣️</span> Recognized: "<b>${text}</b>"`;
        submitQuestion();
    };

    recognition.onerror = (e) => {
        console.warn("Mic error:", e.error);
        micBtn.classList.remove('listening');
        micBtn.innerText = "🎙️ Speak (Mic)";
        isListeningMic = false;
        document.getElementById('console-status').innerHTML = "<span>⚠️</span> Voice input error. Please type and press ➤";
    };

    recognition.onend = () => {
        micBtn.classList.remove('listening');
        micBtn.innerText = "🎙️ Speak (Mic)";
        isListeningMic = false;
    };

    recognition.start();
}

/**
 * Submit question & receive direct, accurate Host A answer
 */
async function submitQuestion() {
    if (isAnswering) return;
    const q = document.getElementById('question-input').value.trim();
    if (!q || q.length < 2) return;

    pauseBroadcast();
    isAnswering = true;

    const consoleEl = document.getElementById('interrupt-console');
    consoleEl.classList.add('active');
    document.getElementById('btn-resume').style.display = 'block';
    document.getElementById('console-status').innerHTML = "<span>🧠</span> Host A is preparing a direct, accurate answer...";

    const currentLine = globalScriptData[currentLineIndex] || { speaker: "Host A", text: "" };

    const prompt = `You are Host A, co-host of an insightful podcast with Host B.
A listener just paused the episode to ask you a question or clarify a topic.

LISTENER'S QUERY:
"${q}"

CONTEXT OF WHERE YOU WERE PAUSED:
- Speaking co-host: ${currentLine.speaker}
- Last line spoken: "${currentLine.text}"
- Overview:
${(rawFullScript || '').substring(0, 1500)}

STRICT RULES FOR HOST A:
1. START DIRECTLY WITH THE ANSWER: Do NOT use conversational fluff, meta-commentary, or pleasantries (never say "Thanks for jumping in", "That's a great question", "You've hit on the perfect point", "Are you asking if...", or "Oh I love that"). Start immediately with the factual definition or clear explanation.
2. ACCURATE DEFINITION: If the listener asks about a concept (like "What is AGI?", "What does that mean?", "It's still not the answer for what is AGI", or any terminology), state the authoritative, crystal-clear definition right away (e.g. Artificial General Intelligence, or AGI, refers to an AI system that can understand, learn, and perform any intellectual task that a human can do).
3. CONNECT TO THE EPISODE: In your final sentence, smoothly tie that concept back to what you and Host B were just discussing.
4. LENGTH: Exactly 2 to 3 concise, highly informative, natural sentences.`;

    try {
        let answerText = "";

        // 1. Try server
        try {
            const sRes = await fetch(`${serverUrl}/api/ask-host`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: q,
                    currentSpeaker: currentLine.speaker,
                    currentLineText: currentLine.text,
                    fullScript: rawFullScript
                })
            });
            if (sRes.ok) answerText = await sRes.text();
        } catch (e) {}

        // 2. Direct Gemini fallback
        if (!answerText || answerText.length < 15) {
            answerText = await callGeminiDirect(prompt);
        }

        document.getElementById('console-status').innerHTML = "<span>🗣️</span> <b>Host A answered your question live!</b>";
        
        updateStageSpeaker("Host A (Answering)", currentLineIndex + 1, globalScriptData.length);
        document.getElementById('current-text').innerText = `"${answerText}"`;

        await speakTextRobust(answerText, true, currentPlaybackSpeed);

    } catch (err) {
        console.error("Q&A Error:", err);
        document.getElementById('console-status').innerHTML = "<span>⚠️</span> Error answering. You can resume below.";
    } finally {
        isAnswering = false;
    }
}

function endQueryAndResume() {
    resumeBroadcast();
}

/**
 * Stops all audio instantly
 */
function stopAllAudio() {
    if (currentAudio) {
        try {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        } catch (e) {}
    }
    if ('speechSynthesis' in window) {
        try {
            window.speechSynthesis.cancel();
        } catch (e) {}
    }
    if (activeAudioResolver) {
        activeAudioResolver();
        activeAudioResolver = null;
    }
}

// Spacebar shortcut to pause/resume during presentations
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') {
        e.preventDefault();
        if (isBroadcastRunning && !isPaused) {
            pauseBroadcast();
        } else if (isPaused || globalScriptData.length > 0) {
            resumeBroadcast();
        }
    }
});
