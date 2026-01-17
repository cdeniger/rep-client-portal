
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load env vars
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

// Config
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

async function checkEngagements() {
    console.log('--- Checking Engagements for Missing userId ---');
    const snap = await getDocs(collection(db, 'engagements'));

    let issueCount = 0;

    snap.docs.forEach(d => {
        const data = d.data();
        const name = data.profile?.firstName ? `${data.profile.firstName} ${data.profile.lastName}` : (data.profile?.headline || 'Unknown');

        console.log(`[${d.id}] ${name} -> userId: ${data.userId}`);

        if (!data.userId) {
            console.error(`\t>>> MISSING userId for ${d.id} (${name})`);
            issueCount++;
        }
    });

    console.log(`\nFound ${issueCount} issues.`);
}

checkEngagements().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
