
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Manual Env Load
try {
    const envPath = path.join(process.cwd(), '.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            let val = value.trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            process.env[key.trim()] = val;
        }
    });
} catch (e) {
    console.warn("Could not load .env file manually.", e);
}

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteLegacyOpportunities() {
    console.log("Starting deletion of legacy 'opportunities' collection...");

    const snapshot = await getDocs(collection(db, 'opportunities'));
    console.log(`Found ${snapshot.size} documents to delete.`);

    if (snapshot.size === 0) {
        console.log("Collection is already empty.");
        return;
    }

    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((d) => {
        batch.delete(d.ref);
        count++;
    });

    await batch.commit();
    console.log(`Successfully deleted ${count} legacy opportunities.`);
}

deleteLegacyOpportunities();
