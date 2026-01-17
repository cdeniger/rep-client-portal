import * as fs from 'fs';
import * as path from 'path';

// 1. Manually Load .env (Copied from seed scripts)
console.log("Current working directory:", process.cwd());
try {
    const envPath = path.join(process.cwd(), '.env');
    console.log("Loading .env from:", envPath);
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                let val = value.trim();
                // Remove quotes if present
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                process.env[key.trim()] = val;
            }
        });
        console.log("Loaded .env file successfully.");
    } else {
        console.warn(".env file not found.");
    }
} catch (e) {
    console.warn("Could not load .env file manually.", e);
}

// 2. Main Test Logic (Async to allow dynamic imports)
async function testCompanyLogic() {
    console.log("Starting Company Logic Test...");

    try {
        // Dynamic Import to ensure env vars are set before firebase initializes
        const { findOrCreateCompany } = await import('../lib/companies.ts');
        const { db } = await import('../lib/firebase.ts');
        const { getDoc, doc } = await import('firebase/firestore');

        // Test 1: Create new
        const name1 = "Test Corp " + Date.now();
        console.log(`1. Testing creation of '${name1}'...`);
        const id1 = await findOrCreateCompany(name1);
        console.log(`   -> Created ID: ${id1}`);

        // Verify it exists in DB
        const doc1 = await getDoc(doc(db, 'companies', id1));
        if (!doc1.exists()) {
            throw new Error(`Failed to find created doc ${id1}`);
        }
        console.log(`   -> Verified in DB:`, doc1.data());

        // Test 2: Find existing (exact)
        console.log(`2. Testing retrieval of '${name1}' (exact match)...`);
        const id2 = await findOrCreateCompany(name1);
        if (id1 === id2) {
            console.log(`   -> SUCCESS: Returned same ID ${id2}`);
        } else {
            console.error(`   -> FAIL: Returned different ID ${id2}`);
        }

        // Test 3: Find existing (case-insensitive)
        const nameLower = name1.toLowerCase();
        console.log(`3. Testing retrieval of '${nameLower}' (case-insensitive)...`);
        const id3 = await findOrCreateCompany(nameLower);
        if (id1 === id3) {
            console.log(`   -> SUCCESS: Returned same ID ${id3}`);
        } else {
            console.error(`   -> FAIL: Returned different ID ${id3}`);
        }

    } catch (error) {
        console.error("Test Failed:", error);
        process.exit(1);
    } finally {
        console.log("Test Complete.");
        process.exit(0);
    }
}

testCompanyLogic();
