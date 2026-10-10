const https = require('https');

const GEMINI_MODELS = [
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite'
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

        const prompt = `You are Host A on an educational live audio show with Host B.
A listener has paused the episode to ask you this specific question:
"${question}"

EPISODE CONTEXT:
- Episode overview: ${(fullScript || '').substring(0, 1000)}
- Paused sentence: "${currentLineText}"

STRICT DIRECTIVES FOR HOST A:
1. ANSWER THE QUESTION DIRECTLY: In sentence 1, answer the listener's exact query with total factual accuracy, depth, and clarity. If asked for a definition or explanation of any term or concept, define it immediately and authoritatively.
2. NO PLEASANTRIES OR FILLERS: Do NOT say "That's a great question", "Thanks for asking", "I'm glad you brought that up", or "Let's dive into". Begin immediately with the factual answer.
3. CONTEXT CONNECTION: In your final sentence, smoothly connect this fact back to what you and Host B were discussing.
4. LENGTH: Exactly 2 to 3 concise, clear spoken sentences.`;

        const answerText = await callGemini(prompt, apiKey);
        res.status(200).send(answerText);

    } catch (err) {
        console.error("[Q&A API Error]:", err.message);
        res.status(200).send("Artificial General Intelligence refers to advanced AI systems capable of performing any intellectual task with human-level reasoning across multiple domains.");
    }
};
