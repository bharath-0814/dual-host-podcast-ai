/**
 * PodAI Live — Interactive Dual-Host Podcast & Newsletter Platform
 * Handles Gemini Dialogue streaming, ElevenLabs voice synthesis,
 * live voice/chat interruptions, speed controls, and presentation management.
 */

const serverUrl = window.location.origin;

// Voice profiles for dual hosts
const voices = {
    "Host A": "21m00Tcm4TlvDq8ikWAM", // Rachel (Female - Lead Host)
    "Host B": "29vD33N1CtxCmqQRPOHJ"  // Drew (Male - Analytical Co-Host)
};

// Global playback & presentation state
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

/**
 * YouTube-style playback speed controller
 * @param {number} speed - e.g. 0.75, 1.0, 1.25, 1.5, 2.0
 */
function setPlaybackSpeed(speed) {
    currentPlaybackSpeed = speed;
    document.querySelectorAll('.btn-speed').forEach(btn => {
        btn.classList.toggle('active', parseFloat(btn.dataset.speed) === speed);
    });
    if (currentAudio) {
        currentAudio.playbackRate = currentPlaybackSpeed;
    }
}

/**
 * Updates UI control buttons according to broadcast state
 * @param {'playing'|'paused'|'idle'} state
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
 * Pauses broadcast immediately for presenter or judge questions
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
    document.getElementById('console-status').innerHTML = "<span>⏸️</span> <b>Broadcast Paused for Judge Questions!</b> Ask query below or click Resume:";
    document.getElementById('btn-resume').style.display = 'block';
    
    const statusMsg = document.getElementById('status-message');
    statusMsg.innerText = `⏸️ Broadcast paused at Line ${currentLineIndex + 1} of ${globalScriptData.length}. Ready for questions.`;
    statusMsg.style.color = "#fbbf24";
}

/**
 * Resumes podcast from paused position
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
 * Completely stops broadcast session without reloading the page
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

/**
 * Subtitle header pause/resume toggle
 */
function toggleStagePause() {
    if (isPaused) {
        resumeBroadcast();
    } else {
        pauseBroadcast();
    }
}

/**
 * Main generator entrypoint
 */
async function generatePodcast() {
    stopAllAudio();
    isInterrupted = false;
    isPaused = false;
    isAnswering = false;
    currentLineIndex = 0;
    globalScriptData = [];
    
    const url = document.getElementById('article-url').value;
    const statusMsg = document.getElementById('status-message');
    const genBtn = document.getElementById('gen-btn');
    genBtn.disabled = true;

    statusMsg.style.color = "#38bdf8";
    statusMsg.innerText = "⏳ Extracting content & writing dual-host dialogue via Gemini...";
    
    try {
        const response = await fetch(`${serverUrl}/api/generate-podcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ article_url: url })
        }).catch(() => {
            // Fallback to legacy path if rewrite not supported
            return fetch(`${serverUrl}/generate-podcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ article_url: url })
            });
        });
        
        rawFullScript = await response.text();
        globalScriptData = parseTextScript(rawFullScript);

        if (globalScriptData.length === 0) throw new Error("No script dialogue lines could be parsed.");

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
 * Parses Gemini raw text into structured host dialogue turns
 */
function parseTextScript(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    const result = [];
    let currentHost = "Host A";

    for (let line of lines) {
        if (line.startsWith('{') || line.startsWith('}')) continue;

        const lower = line.toLowerCase();
        if (lower.includes("host b")) currentHost = "Host B";
        else if (lower.includes("host a")) currentHost = "Host A";

        let dialogue = line.replace(/\*\*Host [AB]:?\*\*/gi, '')
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
 * Sequential audio player through dialogue script
 * @param {number} startIndex
 */
async function playScript(startIndex) {
    const apiKey = document.getElementById('api-key').value.trim();
    isBroadcastRunning = true;
    updateBroadcastControlsUI('playing');

    for (let i = startIndex; i < globalScriptData.length; i++) {
        if (isInterrupted || isPaused || !isBroadcastRunning) {
            currentLineIndex = i; // Save exact line index where paused
            break;
        }

        currentLineIndex = i;
        const line = globalScriptData[i];
        const voiceId = voices[line.speaker] || voices["Host A"];
        
        updateStageSpeaker(line.speaker, i + 1, globalScriptData.length);
        document.getElementById('current-text').innerText = `"${line.text}"`;

        let played = false;
        
        // 1. Try server-side ElevenLabs streaming proxy
        try {
            const ttsResponse = await fetch(`${serverUrl}/api/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: line.text, voiceId })
            }).catch(() => {
                return fetch(`${serverUrl}/tts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: line.text, voiceId })
                });
            });

            if (ttsResponse.ok) {
                const blob = await ttsResponse.blob();
                currentAudio = new Audio(URL.createObjectURL(blob));
                currentAudio.playbackRate = currentPlaybackSpeed;
                await new Promise((resolve) => {
                    activeAudioResolver = resolve;
                    currentAudio.onended = () => { activeAudioResolver = null; resolve(); };
                    currentAudio.onerror = () => { activeAudioResolver = null; resolve(); };
                    currentAudio.play().catch(() => { activeAudioResolver = null; resolve(); });
                });
                played = true;
            }
        } catch (e) {}

        // 2. Direct ElevenLabs Client Fallback
        if (!played && apiKey) {
            try {
                const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                    method: 'POST',
                    headers: {
                        'xi-api-key': apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: line.text,
                        model_id: "eleven_monolingual_v1",
                        voice_settings: { stability: 0.5, similarity_boost: 0.5 }
                    })
                });

                if (ttsResponse.ok) {
                    const blob = await ttsResponse.blob();
                    currentAudio = new Audio(URL.createObjectURL(blob));
                    currentAudio.playbackRate = currentPlaybackSpeed;
                    await new Promise((resolve) => {
                        activeAudioResolver = resolve;
                        currentAudio.onended = () => { activeAudioResolver = null; resolve(); };
                        currentAudio.onerror = () => { activeAudioResolver = null; resolve(); };
                        currentAudio.play().catch(() => { activeAudioResolver = null; resolve(); });
                    });
                    played = true;
                }
            } catch (e) {}
        }

        // 3. Web Speech API browser fallback
        if (!played && !isInterrupted && !isPaused && isBroadcastRunning && 'speechSynthesis' in window) {
            await new Promise((resolve) => {
                activeAudioResolver = resolve;
                const u = new SpeechSynthesisUtterance(line.text);
                const av = window.speechSynthesis.getVoices();
                u.voice = (line.speaker === "Host A") 
                    ? (av.find(v => v.name.includes("Female") || v.name.includes("Zira")) || av[0]) 
                    : (av.find(v => v.name.includes("Male") || v.name.includes("David")) || av[1] || av[0]);
                u.rate = currentPlaybackSpeed;
                u.onend = () => { activeAudioResolver = null; resolve(); };
                u.onerror = () => { activeAudioResolver = null; resolve(); };
                window.speechSynthesis.speak(u);
            });
        }
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

/**
 * Updates UI host cards and stage headers
 */
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
 * Mic speech recognition toggle
 */
function toggleMicListen() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Speech recognition not supported in this browser. Please type your question!");
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
 * Submits query to Host A and speaks synthesized response
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

    try {
        const response = await fetch(`${serverUrl}/api/ask-host`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: q,
                currentSpeaker: currentLine.speaker,
                currentLineText: currentLine.text,
                fullScript: rawFullScript
            })
        }).catch(() => {
            return fetch(`${serverUrl}/ask-host`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: q,
                    currentSpeaker: currentLine.speaker,
                    currentLineText: currentLine.text,
                    fullScript: rawFullScript
                })
            });
        });

        const answerText = await response.text();
        document.getElementById('console-status').innerHTML = "<span>🗣️</span> <b>Host A answered your question live!</b>";
        
        await speakHostAnswer("Host A (Answering)", answerText);

    } catch (err) {
        console.error("Q&A Error:", err);
        document.getElementById('console-status').innerHTML = "<span>⚠️</span> Error answering question. You can resume below.";
    } finally {
        isAnswering = false;
    }
}

/**
 * Speaks Host A's live answer
 */
async function speakHostAnswer(speaker, text) {
    const apiKey = document.getElementById('api-key').value.trim();
    const voiceId = voices["Host A"];

    updateStageSpeaker(speaker, currentLineIndex + 1, globalScriptData.length);
    document.getElementById('current-text').innerText = `"${text}"`;

    let played = false;

    // 1. Try server-side TTS
    try {
        const res = await fetch(`${serverUrl}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voiceId })
        }).catch(() => {
            return fetch(`${serverUrl}/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voiceId })
            });
        });

        if (res.ok) {
            const blob = await res.blob();
            currentAudio = new Audio(URL.createObjectURL(blob));
            currentAudio.playbackRate = currentPlaybackSpeed;
            await new Promise((resolve) => {
                activeAudioResolver = resolve;
                currentAudio.onended = () => { activeAudioResolver = null; resolve(); };
                currentAudio.onerror = () => { activeAudioResolver = null; resolve(); };
                currentAudio.play().catch(() => { activeAudioResolver = null; resolve(); });
            });
            played = true;
        }
    } catch (e) {}

    // 2. Direct ElevenLabs Client Fallback
    if (!played && apiKey) {
        try {
            const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, model_id: "eleven_monolingual_v1", voice_settings: { stability: 0.5, similarity_boost: 0.5 } })
            });
            if (res.ok) {
                const blob = await res.blob();
                currentAudio = new Audio(URL.createObjectURL(blob));
                currentAudio.playbackRate = currentPlaybackSpeed;
                await new Promise((resolve) => {
                    activeAudioResolver = resolve;
                    currentAudio.onended = () => { activeAudioResolver = null; resolve(); };
                    currentAudio.onerror = () => { activeAudioResolver = null; resolve(); };
                    currentAudio.play().catch(() => { activeAudioResolver = null; resolve(); });
                });
                played = true;
            }
        } catch (e) {}
    }

    // 3. Web Speech API browser fallback
    if (!played && 'speechSynthesis' in window) {
        await new Promise((resolve) => {
            activeAudioResolver = resolve;
            const u = new SpeechSynthesisUtterance(text);
            u.voice = window.speechSynthesis.getVoices().find(v => v.name.includes("Female") || v.name.includes("Zira")) || window.speechSynthesis.getVoices()[0];
            u.rate = currentPlaybackSpeed;
            u.onend = () => { activeAudioResolver = null; resolve(); };
            u.onerror = () => { activeAudioResolver = null; resolve(); };
            window.speechSynthesis.speak(u);
        });
    }
}

function endQueryAndResume() {
    resumeBroadcast();
}

/**
 * Cancels all active sound instantly
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

// Spacebar hotkey to pause or resume playback during presentations
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
