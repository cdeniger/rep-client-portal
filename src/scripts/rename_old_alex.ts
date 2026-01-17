
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, writeBatch } from 'firebase/firestore';
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

async function renameOldAlex() {
    console.log("Renaming 'eng_user_alex_mercer' to Tom Smith...");
    const batch = writeBatch(db);

    const OLD_ENG_ID = "eng_user_alex_mercer";
    const OLD_CONTACT_ID = "contact_user_alex_mercer";
    const OLD_USER_ID = "user_alex_mercer";

    // 1. Update Engagement (Profile Snapshot)
    const engRef = doc(db, 'engagements', OLD_ENG_ID);
    batch.update(engRef, {
        'profile.firstName': 'Tom',
        'profile.lastName': 'Smith',
        'profile.headline': 'Senior Director @ Legacy Corp', // Changed headline to differentiate
        'profile.bio_short': 'Renamed from Duplicate Alex Mercer'
    });

    // 2. Update Contact (Golden Source)
    const contactRef = doc(db, 'contacts', OLD_CONTACT_ID);
    batch.update(contactRef, {
        firstName: 'Tom',
        lastName: 'Smith',
        email: 'tom.smith@example.com' // Differentiate email
    });

    // 3. Update User (Auth Placeholder)
    const userRef = doc(db, 'users', OLD_USER_ID);
    // Note: This user might fail if it doesn't exist, but typically seed created it.
    // Using set with merge is safer for potential missing docs, but we'll try update first.
    // Actually, let's use set with merge for safety.
    batch.set(userRef, {
        email: 'tom.smith@example.com',
        profile: {
            name: 'Tom Smith',
            firstName: 'Tom',
            lastName: 'Smith',
            headline: 'Senior Director @ Legacy Corp'
        }
    }, { merge: true });

    await batch.commit();
    console.log("Successfully renamed old profile to Tom Smith.");
}

renameOldAlex();
