
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from '../lib/firebase';

async function checkDuplicates() {
    console.log("Checking for duplicate Alex Mercer engagements...");

    const idsToCheck = [
        'eng_user_alex_mercer',
        'eng_eng_user_alex_mercer' // The suspicious one from the screenshot
    ];

    for (const id of idsToCheck) {
        console.log(`\n--- Checking ID: ${id} ---`);
        const ref = doc(db, 'engagements', id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            console.log("EXISTS!");
            const data = snap.data();
            console.log(`Profile Name: ${data.profile?.firstName} ${data.profile?.lastName}`);
            console.log(`Status: ${data.status}`);

            // Check linked pursuits
            const pursuitsQ = query(collection(db, 'job_pursuits'), where('engagementId', '==', id));
            const pursuits = await getDocs(pursuitsQ);
            console.log(`Job Pursuits Count: ${pursuits.size}`);

            // Check linked recs
            const recsQ = query(collection(db, 'job_recommendations'), where('engagementId', '==', id));
            const recs = await getDocs(recsQ);
            console.log(`Recommendations Count: ${recs.size}`);
        } else {
            console.log("DOES NOT EXIST.");
        }
    }
}

checkDuplicates().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
