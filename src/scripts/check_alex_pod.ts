
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

async function checkAlexData() {
    console.log('Searching for Alex Mercer engagements...');
    const snapshot = await getDocs(collection(db, 'engagements'));

    let found = false;
    snapshot.forEach(doc => {
        const data = doc.data();
        const str = JSON.stringify(data).toLowerCase();
        if (str.includes('alex mercer')) {
            console.log(`\nEngagement ID: ${doc.id}`);
            console.log(`Status: ${data.status}`);
            console.log('Profile Pod Info:');
            console.log(` - profile.pod: ${data.profile?.pod}`);
            console.log(` - profile.podId: ${data.profile?.podId}`);
            found = true;
        }
    });

    if (!found) {
        console.log('No engagement found for Alex Mercer.');
    }
}

checkAlexData().then(() => process.exit(0));
