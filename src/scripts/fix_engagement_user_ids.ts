
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const loadEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        console.log("Loading .env from", envPath);
        if (!fs.existsSync(envPath)) {
            console.warn("No .env file found");
            return {};
        }
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env: Record<string, string> = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, '');
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error("Error reading .env", e);
        return {};
    }
};

const env = loadEnv();
console.log("Project ID:", env.VITE_FIREBASE_PROJECT_ID);

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const fixEngagementUserIds = async () => {
    console.log("Starting data fix: Backfilling userId on Engagements...");
    try {
        const engCol = collection(db, 'engagements');
        const snap = await getDocs(engCol);

        let fixedCount = 0;
        let skipCount = 0;
        let errCount = 0;

        for (const d of snap.docs) {
            const data = d.data();
            if (data.userId) {
                skipCount++;
                continue;
            }

            console.log(`Processing ${d.id} (Missing userId)...`);

            if (!data.contactId) {
                console.error(`  -> SKIP: No contactId found on engagement ${d.id}`);
                errCount++;
                continue;
            }

            const contactRef = doc(db, 'contacts', data.contactId);
            const contactSnap = await getDoc(contactRef);

            if (!contactSnap.exists()) {
                console.error(`  -> SKIP: Contact ${data.contactId} not found for engagement ${d.id}`);
                errCount++;
                continue;
            }

            const contactData = contactSnap.data();
            const userId = contactData.userId;

            if (!userId) {
                console.error(`  -> SKIP: Contact ${data.contactId} has no userId`);
                errCount++;
                continue;
            }

            await updateDoc(d.ref, { userId: userId });
            console.log(`  -> FIXED: Set userId=${userId} for engagement ${d.id}`);
            fixedCount++;
        }

        console.log("\n--- Summary ---");
        console.log(`Total Scanned: ${snap.size}`);
        console.log(`Fixed: ${fixedCount}`);
        console.log(`Skipped (Already Valid): ${skipCount}`);
        console.log(`Errors (Unfixable): ${errCount}`);

    } catch (error) {
        console.error("Fix Failed:", error);
    }
    process.exit(0);
};

fixEngagementUserIds();
