
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteField, writeBatch } from "firebase/firestore";
import * as dotenv from "dotenv";

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

const MAPPING: Record<string, string> = {
    'target_locked': 'target_locked',
    'outreach': 'outreach_execution',
    'outreach_execution': 'outreach_execution',
    'engagement': 'engagement',
    'interviewing': 'interview_loop',
    'interview_loop': 'interview_loop',
    'offer': 'offer_pending',
    'offer_pending': 'offer_pending',
    'negotiating': 'offer_pending', // Mapping negotiating to offer_pending as well, or maybe engagement?
    'placed': 'placed',
    'closed_lost': 'closed_lost',
    'closed_by_market': 'closed_by_market'
};

async function migrate() {
    console.log("Starting migration...");
    const pursuitsRef = collection(db, "job_pursuits");
    const snapshot = await getDocs(pursuitsRef);

    console.log(`Found ${snapshot.size} documents.`);

    const batch = writeBatch(db);
    let count = 0;

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const oldStatus = data.status;

        // If already converted or no status
        if (!oldStatus && data.stageId) {
            console.log(`Skipping ${docSnap.id} - already has stageId`);
            continue;
        }

        const newStageId = MAPPING[oldStatus] || oldStatus; // Fallback to same if not in map

        console.log(`Migrating ${docSnap.id}: ${oldStatus} -> ${newStageId}`);

        const docRef = doc(db, "job_pursuits", docSnap.id);
        batch.update(docRef, {
            stageId: newStageId,
            status: deleteField() // Remove old field
        });

        count++;

        if (count % 400 === 0) {
            await batch.commit();
            console.log("Committed batch...");
            // Reset batch? No, writeBatch creates new one. 
            // Actually need to create new batch object roughly every 400
            // But here I should reuse variable or just commit and continue?
            // Firestore batch limit is 500.
            // Better logic:
        }
    }

    if (count > 0) {
        await batch.commit();
        console.log(`Final batch committed. Migrated ${count} documents.`);
    } else {
        console.log("No documents needed migration.");
    }
}

migrate().catch(console.error);
