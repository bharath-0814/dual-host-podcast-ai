const https = require('https');
const http = require('http');

const GEMINI_MODELS = [
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite'
];

function fetchUrl(targetUrl) {
    return new Promise((resolve, reject) => {
        const client = targetUrl.startsWith('https') ? https : http;
        client.get(targetUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } 
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

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
    throw new Error("All Gemini models exhausted.");
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
            // Buffer stream if body parser is not present
            body = await new Promise((resolve) => {
                let data = '';
                req.on('data', chunk => data += chunk);
                req.on('end', () => {
                    try { resolve(JSON.parse(data)); } catch (e) { resolve({}); }
                });
            });
        }

        const { article_url } = body;
        if (!article_url) {
            res.status(400).send("Missing article_url");
            return;
        }

        console.log("[Podcast API] Scraping:", article_url);
        let rawHtml = await fetchUrl(article_url);
        let cleanText = rawHtml.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
                               .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
                               .replace(/<[^>]+>/g, ' ')
                               .replace(/\s+/g, ' ')
                               .substring(0, 4000);

        const prompt = `You are a podcast scriptwriter. Rewrite the following article into an engaging, realistic dialogue script between Host A and Host B. Host A is enthusiastic and inquisitive, Host B is analytical and deep. Format each line starting with "Host A:" or "Host B:". Do not add stage directions. Article:\n\n${cleanText}`;

        const scriptText = await callGemini(prompt, apiKey);
        res.status(200).send(scriptText);

    } catch (err) {
        console.error("[Podcast API Error]:", err.message);
        res.status(500).send("Error generating podcast: " + err.message);
    }
};
