
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
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

async function debugAlexRelation() {
    console.log('1. Finding Alex User...');
    const usersSnap = await getDocs(collection(db, 'users'));
    let alexUser: any = null;

    usersSnap.forEach(doc => {
        const d = doc.data();
        if (d.email?.toLowerCase().includes('alex')) {
            alexUser = { id: doc.id, ...d };
            console.log(`Found User: ${doc.id} (${d.email})`);
        }
    });

    if (!alexUser) {
        console.log('Alex user not found.');
        return;
    }

    console.log('\n2. Finding Engagements for User ID:', alexUser.id);
    // Try query matches
    const engSnap = await getDocs(collection(db, 'engagements'));
    engSnap.forEach(doc => {
        const d = doc.data();
        if (d.userId === alexUser.id || d.userId === alexUser.uid || JSON.stringify(d).includes('Alex')) {
            console.log(`\n--- Engagement Found: ${doc.id} ---`);
            console.log(`UserId: ${d.userId}`);
            console.log(`RepId: ${d.repId}`);
            console.log(`Status: ${d.status}`);
            console.log(`Profile Name: ${d.profile?.firstName} ${d.profile?.lastName}`);
            console.log(`Pod: ${d.profile?.pod}`);
            console.log(`PodID: ${d.profile?.podId}`);
        }
    });
}

debugAlexRelation().then(() => process.exit(0));
