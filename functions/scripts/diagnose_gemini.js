const https = require('https');

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ No GEMINI_API_KEY found in environment variables.");
    process.exit(1);
}

console.log(`🔍 Diagnosing API Key: ${API_KEY.substring(0, 10)}...`);

function makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `${path}?key=${API_KEY}`,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function diagnose() {
    console.log("\n--- TEST 1: List Models (v1beta) ---");
    try {
        const res = await makeRequest('/v1beta/models');
        if (res.statusCode === 200) {
            console.log("✅ Success! Available Models:");
            res.body.models.forEach(m => {
                if (m.name.includes('gemini')) console.log(`   - ${m.name}`);
            });
        } else {
            console.error(`❌ Failed (Status ${res.statusCode}):`, JSON.stringify(res.body, null, 2));
        }
    } catch (e) {
        console.error("❌ Network Error:", e.message);
    }

    console.log("\n--- TEST 2: List Models (v1alpha) ---");
    try {
        const res = await makeRequest('/v1alpha/models');
        if (res.statusCode === 200) {
            console.log("✅ Success! Available Models:");
            res.body.models.forEach(m => {
                if (m.name.includes('gemini')) console.log(`   - ${m.name}`);
            });
        } else {
            console.error(`❌ Failed (Status ${res.statusCode}):`, JSON.stringify(res.body, null, 2));
        }
    } catch (e) {
        console.error("❌ Network Error:", e.message);
    }

    console.log("\n--- TEST 3: Generate Content (gemini-1.5-flash) ---");
    try {
        const res = await makeRequest('/v1beta/models/gemini-1.5-flash:generateContent', 'POST', {
            contents: [{ parts: [{ text: "Hello, are you working?" }] }]
        });
        if (res.statusCode === 200) {
            console.log("✅ Generation SUCCESS!");
            console.log("Response:", res.body.candidates[0].content.parts[0].text);
        } else {
            console.error(`❌ Generation FAILED (Status ${res.statusCode}):`, JSON.stringify(res.body, null, 2));
        }
    } catch (e) {
        console.error("❌ Network Error:", e.message);
    }
}

diagnose();
