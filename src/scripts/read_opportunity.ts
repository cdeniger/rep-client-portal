import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load .env manually
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

async function verifyOpportunity() {
    const oppId = 'inventory_rep_jordan_19';
    console.log(`Checking Opportunity: ${oppId}...`);
    try {
        const docRef = doc(db, 'opportunities', oppId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('Document Data:', JSON.stringify(data, null, 2));
            console.log('------------------------------------------------');
            console.log('userId:', data.userId);
            console.log('company:', data.company);
            console.log('------------------------------------------------');
        } else {
            console.error('No such document!');
        }
    } catch (error) {
        console.error('Error getting document:', error);
    }
}

verifyOpportunity();
