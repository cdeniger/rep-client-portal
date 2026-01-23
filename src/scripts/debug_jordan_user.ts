
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

async function findJordan() {
    console.log('Searching for users with "Jordan" in name or email...');
    const snapshot = await getDocs(collection(db, 'users'));

    let found = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        const str = JSON.stringify(data).toLowerCase();
        if (str.includes('jordan')) {
            console.log('\nFound matched user:');
            console.log(`ID: ${doc.id}`);
            console.log(`Email: ${data.email}`);
            console.log(`Role: ${data.role}`);
            console.log(`Name: ${data.profile?.name || data.name || 'N/A'}`);
            console.log('Full Data:', data);
            found++;
        }
    });

    if (found === 0) {
        console.log('No user found matching "Jordan".');
    }
}

findJordan().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
