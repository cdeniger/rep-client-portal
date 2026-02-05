const https = require('https');

// 1. Get Key
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ CRTICAL ERROR: No GEMINI_API_KEY found in environment variables.");
    console.error("   Please export GEMINI_API_KEY='your_key' and try again.");
    process.exit(1);
}

console.log(`🔍 PROBING API KEY: ${API_KEY.substring(0, 5)}...${API_KEY.substring(API_KEY.length - 4)}`);
console.log("---------------------------------------------------------------");

// Minimal Request Helper (No Dependencies)
function makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `${path}?key=${API_KEY}`,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: data }); // Fallback for non-JSON
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// The Suite
async function diagnose() {
    let supportedModels = [];

    // TEST A: Check v1beta (Standard)
    process.stdout.write("1. Testing 'v1beta' endpoint... ");
    try {
        const res = await makeRequest('/v1beta/models');
        if (res.statusCode === 200 && res.body.models) {
            console.log("✅ OK");
            const geminis = res.body.models.filter(m => m.name.includes('gemini'));
            console.log(`   Found ${geminis.length} Gemini models.`);
        } else {
            console.log("❌ FAILED");
            console.log(`   Status: ${res.statusCode}`, res.body.error?.message || "");
        }
    } catch (e) { console.log("❌ NETWORK ERROR"); }

    // TEST B: Check v1alpha (Developer/Bleeding Edge)
    process.stdout.write("2. Testing 'v1alpha' endpoint... ");
    try {
        const res = await makeRequest('/v1alpha/models');
        if (res.statusCode === 200 && res.body.models) {
            console.log("✅ OK");
            const models = res.body.models
                .filter(m => m.name.includes('gemini'))
                .map(m => m.name.replace('models/', ''));

            supportedModels = models;

            console.log("   --- VERIFIED AVAILABLE MODELS ---");
            // Group by series
            const v2 = models.filter(m => m.includes('2.0') || m.includes('2.5'));
            const v15 = models.filter(m => m.includes('1.5'));

            if (v2.length) console.log(`   v2.x Series: ${v2.join(', ')}`);
            if (v15.length) console.log(`   v1.5 Series: ${v15.join(', ')}`);
            console.log("   ---------------------------------");

        } else {
            console.log("❌ FAILED");
            console.log(`   Status: ${res.statusCode}`, res.body.error?.message || "");
        }
    } catch (e) { console.log("❌ NETWORK ERROR"); }

    // TEST C: Generation Test (Write Check)
    // Pick the best available model
    const targetModel = supportedModels.find(m => m.includes('gemini-2.0-flash'))
        || supportedModels.find(m => m.includes('gemini-1.5-flash'))
        || "gemini-1.5-flash";

    console.log(`3. Deployment Test (Model: ${targetModel})...`);
    try {
        const res = await makeRequest(`/v1beta/models/${targetModel}:generateContent`, 'POST', {
            contents: [{ parts: [{ text: "ping" }] }]
        });

        if (res.statusCode === 200) {
            console.log("   ✅ GENERATION SUCCESSFUL!");
            try {
                const txt = res.body.candidates[0].content.parts[0].text;
                console.log(`   Response: "${txt.trim().substring(0, 50)}..."`);
            } catch (err) {
                console.log("   (Response format unexpected, but status 200 OK)");
            }
        } else {
            console.log("   ❌ GENERATION FAILED");
            console.log(`   ${JSON.stringify(res.body.error, null, 2)}`);
        }
    } catch (e) {
        console.error("   ❌ NETWORK ERROR during generation");
    }
}

diagnose();
