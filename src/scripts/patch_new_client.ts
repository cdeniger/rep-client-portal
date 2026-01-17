
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
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

const patchNewClient = async () => {
    const engId = 'bZXcZX6MGfPDmXwMmk1T';
    console.log(`Patching Engagement: ${engId}`);

    const engRef = doc(db, 'engagements', engId);
    const engSnap = await getDoc(engRef);

    if (!engSnap.exists()) {
        console.error("Engagement not found!");
        process.exit(1);
    }

    // Create Dummy User/Contact IDs
    const userId = `user_${engId}`;
    const contactId = `contact_${engId}`;

    // 1. Create Contact Record (if missing)
    const contactRef = doc(db, 'contacts', contactId);
    await setDoc(contactRef, {
        id: contactId,
        userId: userId,
        firstName: 'New',
        lastName: 'Client',
        email: 'new.client@example.com',
        headline: 'Chief AI Architect',
        bio: 'Patched Record',
        createdAt: new Date().toISOString()
    });
    console.log(`Created Contact: ${contactId}`);

    // 2. Update Engagement
    await updateDoc(engRef, {
        userId: userId,
        contactId: contactId
    });
    console.log(`Updated Engagement with userId=${userId} and contactId=${contactId}`);

    process.exit(0);
};

patchNewClient();
