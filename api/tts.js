const https = require('https');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
        const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY || process.env.XI_API_KEY || '';
        if (!apiKey) {
            res.status(400).send("No ElevenLabs API key found in environment variables");
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

        const { text, voiceId } = body;
        if (!text || !voiceId) {
            res.status(400).send("Missing text or voiceId");
            return;
        }

        const postData = JSON.stringify({
            text,
            model_id: "eleven_monolingual_v1",
            voice_settings: { stability: 0.5, similarity_boost: 0.5 }
        });

        const ttsReq = https.request(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (ttsRes) => {
            res.writeHead(ttsRes.statusCode, { 'Content-Type': 'audio/mpeg' });
            ttsRes.pipe(res);
        });

        ttsReq.on('error', (err) => {
            console.error("[TTS API Error]:", err.message);
            res.status(500).send(err.message);
        });

        ttsReq.write(postData);
        ttsReq.end();

    } catch (err) {
        console.error("[TTS API Error]:", err.message);
        res.status(500).send(err.message);
    }
};
