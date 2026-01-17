import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { collection, getDocs } from 'firebase/firestore';

// 1. Manually Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

console.log(`Loading .env from: ${envPath}`);

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
            if (key && !key.startsWith('#')) {
                process.env[key] = value;
            }
        }
    });
}

// 2. Import Firebase (Dynamic)
const { db } = await import('../lib/firebase.ts');

const debugOpportunities = async () => {
    console.log("Debugging Opportunities...");
    try {
        const snaps = await getDocs(collection(db, 'opportunities'));
        console.log(`Found ${snaps.size} total opportunities.`);

        let found = 0;
        snaps.forEach(doc => {
            const data = doc.data();

            // Search for Sample Copy or Alex Mercer
            if (
                data.company === 'Sample Copy' ||
                (data.userId && data.userId.toLowerCase().includes('alex'))
            ) {
                console.log(`[${doc.id}] MATCH: Company: ${data.company}, Role: ${data.role}, Status: '${data.status}', UserID: '${data.userId}'`);
                found++;
            }
        });

        if (found === 0) {
            console.log("No opportunities found for 'Linear'.");
        }

        console.log("\nChecking for User Profile: eng_user_alex_mercer...");
        const { getDoc, doc } = await import('firebase/firestore');
        const userRef = doc(db, 'users', 'eng_user_alex_mercer');
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            console.log("User Profile FOUND:", JSON.stringify(userSnap.data().profile || {}, null, 2));
        } else {
            console.log("User Profile NOT found. If you switch logins, this user might have a blank profile.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Debug Failed:", error);
        process.exit(1);
    }
};

debugOpportunities();
