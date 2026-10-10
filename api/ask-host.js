const https = require('https');

const GEMINI_MODELS = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.7-flash'
];

function executeGeminiRequest(modelName, promptText, apiKey) {
    return new Promise((resolve, reject) => {
        const reqUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const bodyData = JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
        });

        const req = https.request(reqUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyData)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) {
                        return reject(new Error(parsed.error.message));
                    }
                    if (parsed.candidates && parsed.candidates[0].content.parts[0].text) {
                        resolve(parsed.candidates[0].content.parts[0].text);
                    } else {
                        reject(new Error("Empty response from Gemini"));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(bodyData);
        req.end();
    });
}

async function callGemini(promptText, apiKey) {
    for (let modelName of GEMINI_MODELS) {
        try {
            const text = await executeGeminiRequest(modelName, promptText, apiKey);
            console.log(`[Gemini] Success using ${modelName}`);
            return text;
        } catch (err) {
            console.warn(`[Gemini] Model ${modelName} failed (${err.message}), trying next...`);
        }
    }
    return "Host B and I were just breaking down that core concept! Let's resume the episode and dive deeper into it.";
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).send("Method Not Allowed");
        return;
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_KEY || '';
        if (!apiKey) {
            res.status(500).send("GEMINI_API_KEY is not configured in environment variables.");
            return;
        }

        let body = req.body;
        if (typeof body === 'string') {
            body = JSON.parse(body);
        } else if (!body) {
            body = await new Promise((resolve) => {
                let data = '';
                req.on('data', chunk => data += chunk);
                req.on('end', () => {
                    try { resolve(JSON.parse(data)); } catch (e) { resolve({}); }
                });
            });
        }

        const { question, currentSpeaker, currentLineText, fullScript } = body;
        console.log(`[Q&A API] Listener asked: "${question}" (Paused at: ${currentSpeaker}: "${currentLineText}")`);

        const prompt = `You are Host A, co-host of an insightful podcast with Host B.
A listener just paused the episode to ask you a question or clarify a topic.

LISTENER'S QUERY:
"${question}"

CONTEXT OF WHERE YOU WERE PAUSED:
- Speaking co-host: ${currentSpeaker}
- Last line spoken: "${currentLineText}"
- Podcast discussion overview:
${(fullScript || '').substring(0, 2000)}

STRICT RULES FOR HOST A:
1. START DIRECTLY WITH THE ANSWER: Do NOT use conversational fluff, meta-commentary, or pleasantries (never say "Thanks for jumping in", "That's a great question", "You've hit on the perfect point", "Are you asking if...", or "Oh I love that"). Start immediately with the factual definition or clear explanation.
2. ACCURATE DEFINITION: If the listener asks about a concept (like "What is AGI?", "What does that mean?", "It's still not the answer for what is AGI", or any terminology), state the authoritative, crystal-clear definition right away (e.g. Artificial General Intelligence, or AGI, refers to an AI system that can understand, learn, and perform any intellectual task that a human can do).
3. CONNECT TO THE EPISODE: In your final sentence, smoothly tie that concept back to what you and Host B were just discussing.
4. LENGTH: Exactly 2 to 3 concise, highly informative, natural sentences.`;

        const answerText = await callGemini(prompt, apiKey);
        res.status(200).send(answerText);

    } catch (err) {
        console.error("[Q&A API Error]:", err.message);
        res.status(500).send("Host A: That's a great question about what Host B and I were saying! Let's resume the episode to see how it unfolds.");
    }
};
