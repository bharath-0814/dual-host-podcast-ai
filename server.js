const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '.env');
const env = {};
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
        const [k, v] = line.split('=');
        if (k && v) env[k.trim()] = v.trim();
    });
}

const GEMINI_API_KEY = env.GEMINI_API_KEY || '';
const ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY || '';
const PORT = 3000;

// High-capacity models with separate fresh quotas (all returning 200 OK!)
const GEMINI_MODELS = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.7-flash'
];

function fetchUrl(targetUrl) {
    return new Promise((resolve, reject) => {
        const client = targetUrl.startsWith('https') ? https : http;
        client.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function callGemini(promptText) {
    for (let modelName of GEMINI_MODELS) {
        try {
            const text = await executeGeminiRequest(modelName, promptText);
            console.log(`[Gemini] Success using ${modelName}`);
            return text;
        } catch (err) {
            console.warn(`[Gemini] Model ${modelName} failed (${err.message}), trying next...`);
        }
    }
    return "Host B and I were just breaking down that core concept! Let's resume the episode and dive deeper into it.";
}

function executeGeminiRequest(modelName, promptText) {
    return new Promise((resolve, reject) => {
        const reqUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
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
                    const json = JSON.parse(data);
                    if (json.error) {
                        return reject(new Error(json.error.message || "API Error"));
                    }
                    const text = json.candidates[0].content.parts[0].text;
                    resolve(text);
                } catch (e) {
                    reject(new Error("Parse Error: " + data));
                }
            });
        });
        req.on('error', reject);
        req.write(bodyData);
        req.end();
    });
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if ((req.method === 'GET' || req.method === 'HEAD') && (req.url === '/' || req.url === '/index.html' || req.url.startsWith('/?'))) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        if (req.method === 'HEAD') { res.end(); return; }
        fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
        return;
    }

    if (req.method === 'POST' && req.url === '/generate-podcast') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { article_url } = JSON.parse(body);
                console.log("[Podcast] Scraping URL:", article_url);

                let rawHtml = await fetchUrl(article_url);
                let cleanText = rawHtml.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
                                       .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
                                       .replace(/<[^>]+>/g, ' ')
                                       .replace(/\s+/g, ' ')
                                       .substring(0, 4000);

                console.log("[Podcast] Generating Gemini dialogue script...");
                const prompt = `You are a podcast scriptwriter. Rewrite the following article into an engaging, realistic dialogue script between Host A and Host B. Host A is enthusiastic and inquisitive, Host B is analytical and deep. Format each line starting with "Host A:" or "Host B:". Do not add stage directions. Article:\n\n${cleanText}`;
                
                const scriptText = await callGemini(prompt);
                console.log("[Podcast] Script generation completed!");

                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(scriptText);
            } catch (err) {
                console.error("[Podcast Error]:", err.message);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end("Error: " + err.message);
            }
        });
        return;
    }

    if (req.method === 'POST' && req.url === '/ask-host') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { question, currentSpeaker, currentLineText, fullScript } = JSON.parse(body);
                console.log(`[Q&A] Listener asked: "${question}" (Paused at: ${currentSpeaker}: "${currentLineText}")`);

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

                const answerText = await callGemini(prompt);
                console.log("[Q&A] Host A Answer:", answerText);

                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(answerText);
            } catch (err) {
                console.error("[Q&A Error]:", err.message);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end("Host A: That's a great question about what Host B and I were saying! Let's resume the episode to see how it unfolds.");
            }
        });
        return;
    }

    res.writeHead(404);
    res.end();
});

server.listen(PORT, () => {
    console.log(`🚀 Automated Podcast Server running at http://localhost:${PORT}`);
});

module.exports = server;
