
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
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

async function findDuplicates() {
    console.log("Searching for Engagements...");

    // Fetch all engagements to filter in mem (safest for ensuring we catch denormalized names)
    // Or query specifically for name if indexed. Let's just scan all for now, dataset is small.
    const snap = await getDocs(collection(db, 'engagements'));

    const alexes = snap.docs.filter(d => {
        const data = d.data();
        const p = data.profile || {};
        const name = (p.firstName + ' ' + p.lastName).toLowerCase();
        return name.includes('alex') && name.includes('mercer');
    });

    console.log(`Found ${alexes.length} records matching 'Alex Mercer':`);

    alexes.forEach(doc => {
        const d = doc.data();
        console.log("--------------------------------------------------");
        console.log(`ID: ${doc.id}`);
        console.log(`User ID (Auth): ${d.userId}`);
        console.log(`Contact ID: ${d.contactId}`);
        console.log(`Start Date: ${d.startDate}`);
        console.log(`Profile Name: ${d.profile?.firstName} ${d.profile?.lastName}`);
    });
}

findDuplicates();
