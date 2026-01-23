
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

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

async function checkDuplicates() {
    console.log('Checking for duplicate users by email...');
    const snapshot = await getDocs(collection(db, 'users'));

    const emailMap = new Map<string, any[]>();

    snapshot.forEach(doc => {
        const data = doc.data();
        const email = data.email;
        if (email) {
            const lowerEmail = email.toLowerCase();
            if (!emailMap.has(lowerEmail)) {
                emailMap.set(lowerEmail, []);
            }
            emailMap.get(lowerEmail)?.push({ id: doc.id, ...data });
        }
    });

    let found = false;
    emailMap.forEach((users, email) => {
        if (users.length > 1) {
            found = true;
            console.log(`\nDuplicate Email: ${email}`);
            users.forEach(u => {
                console.log(` - ID: ${u.id}, Role: ${u.role}, Name: ${u.profile?.name || u.name || 'N/A'}`);
            });
        }
    });

    if (!found) {
        console.log('No duplicate emails found in Firestore users collection.');
    }
}

checkDuplicates().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
