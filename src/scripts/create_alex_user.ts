
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp, collection, addDoc, writeBatch } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Manual Env Load
console.log("Current working directory:", process.cwd());
try {
    const envPath = path.join(process.cwd(), '.env');
    console.log("Looking for .env at:", envPath);
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
    console.log("Loaded .env file successfully.");
} catch (e) {
    console.warn("Could not load .env file manually. Relying on process.env.", e);
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
const auth = getAuth(app);
const db = getFirestore(app);

const EMAIL = "alex.mercer@test.com"; // Customized for testing
const PASSWORD = "Password123!"; // Simple password

async function createAlexMercer() {
    console.log(`Creating user: ${EMAIL}...`);
    let uid = '';

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD);
        uid = userCredential.user.uid;
        console.log(`Successfully created Auth User. UID: ${uid}`);
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            console.log("User already exists. Skipping Auth creation. You might need to check your Firebase Console for the UID if you don't know it.");
            // Ideally we'd login here to get UID, but for safety in this script, let's just warn.
            // For now, let's assume if it exists, we might fail to populate unless we know the UID.
            // Let's try to login to get the UID.
            try {
                // @ts-ignore
                const { signInWithEmailAndPassword } = await import('firebase/auth');
                const loginCred = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
                uid = loginCred.user.uid;
                console.log(`Logged in existing user. UID: ${uid}`);
            } catch (loginErr) {
                console.error("Could not login to existing user. Exiting.", loginErr);
                process.exit(1);
            }
        } else {
            console.error("Auth Error:", error);
            process.exit(1);
        }
    }

    if (!uid) return;

    console.log(`Seeding Firestore data for UID: ${uid}`);
    const batch = writeBatch(db);
    const now = new Date();

    // 1. User Profile
    const userRef = doc(db, 'users', uid);
    batch.set(userRef, {
        uid,
        email: EMAIL,
        role: 'client',
        profile: {
            name: 'Alex Mercer',
            firstName: 'Alex',
            lastName: 'Mercer',
            status: 'searching', // Active status
            pod: 'FinTech',
            headline: 'Senior Product Manager',
            bio_short: 'Product Leader in Payments',
            repId: 'rep_jordan', // Hardcoded link to main Rep
            contactId: `contact_${uid}`
        }
    }, { merge: true });

    // 2. Contact
    const contactRef = doc(db, 'contacts', `contact_${uid}`);
    batch.set(contactRef, {
        id: `contact_${uid}`,
        userId: uid,
        firstName: 'Alex',
        lastName: 'Mercer',
        email: EMAIL,
        headline: 'Senior Product Manager',
        createdAt: now.toISOString()
    }, { merge: true });

    // 3. Engagement (The Business Record)
    // ID Format: eng_user_{uid} to match convention
    const engId = `eng_user_${uid}`;
    const engRef = doc(db, 'engagements', engId);
    batch.set(engRef, {
        id: engId,
        userId: uid,
        contactId: `contact_${uid}`,
        repId: 'rep_jordan',
        status: 'active',
        startDate: now.toISOString(),
        isaPercentage: 0.15,
        profile: {
            firstName: 'Alex',
            lastName: 'Mercer',
            headline: 'Senior Product Manager',
            pod: 'FinTech',
            bio_short: 'Product Leader in Payments'
        }
    }, { merge: true });

    // 4. Job Targets & Pursuits (Seeding Pipeline)
    // Create one sample "Active" pursuit
    const targetRef = doc(collection(db, 'job_targets'));
    batch.set(targetRef, {
        company: 'Stripe',
        role: 'Product Lead, Issuing',
        status: 'OPEN',
        source: 'manual',
        financials: { base: 240000, bonus: 40000, equity: '0.1%', rep_net_value: 36000 },
        createdAt: now.toISOString()
    });

    const pursuitRef = doc(collection(db, 'job_pursuits'));
    batch.set(pursuitRef, {
        targetId: targetRef.id,
        userId: uid,
        engagementId: engId,
        company: 'Stripe',
        role: 'Product Lead, Issuing',
        status: 'interviewing',
        stage_detail: 'Onsite Scheduled',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        financials: { base: 240000, bonus: 40000, equity: '0.1%', rep_net_value: 36000 }
    });

    await batch.commit();
    console.log("Success! User configured.");
    console.log("Email:", EMAIL);
    console.log("Password:", PASSWORD);
}

createAlexMercer();
