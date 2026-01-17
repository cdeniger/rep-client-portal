
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const loadEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) return {};
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env: Record<string, string> = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        });
        return env;
    } catch (e) {
        return {};
    }
};

const env = loadEnv();
const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
});
const db = getFirestore(app);

const readEngagement = async (id: string) => {
    console.log(`Reading Engagement: ${id}`);
    const snap = await getDoc(doc(db, 'engagements', id));
    if (snap.exists()) {
        console.log(JSON.stringify(snap.data(), null, 2));
    } else {
        console.log("Document not found.");
    }
    process.exit(0);
};

readEngagement('bZXcZX6MGfPDmXwMmk1T');
