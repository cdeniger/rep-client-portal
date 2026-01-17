import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// 1. Manually Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

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

const migrateAlex = async () => {
    console.log("Migrating/Seeding User Profile for eng_user_alex_mercer...");
    try {
        const targetUid = 'eng_user_alex_mercer';
        const sourceUid = 'client_alex';

        // 1. Check if Target User exists
        const targetRef = doc(db, 'users', targetUid);
        const targetSnap = await getDoc(targetRef);

        if (targetSnap.exists()) {
            console.log("Target user profile already exists. Skipping clone.");
        } else {
            console.log(`Cloning profile from ${sourceUid}...`);
            const sourceRef = doc(db, 'users', sourceUid);
            const sourceSnap = await getDoc(sourceRef);

            if (sourceSnap.exists()) {
                const data = sourceSnap.data();
                // Update UID field
                data.uid = targetUid;
                // Save to new ID
                await setDoc(targetRef, data);
                console.log("Success: User Profile cloned.");
            } else {
                console.error("Source user (client_alex) not found! Cannot clone.");
                // Fallback seed
                const fallbackData = {
                    uid: targetUid,
                    email: 'alex.mercer@rep.com',
                    role: 'client',
                    profile: {
                        name: 'Alex Mercer',
                        headline: 'Senior Product Manager',
                        pod: 'FinTech'
                    }
                };
                await setDoc(targetRef, fallbackData);
                console.log("Created fallback user profile.");
            }
        }

        process.exit(0);

    } catch (error) {
        console.error("Migration Failed:", error);
        process.exit(1);
    }
};

migrateAlex();
