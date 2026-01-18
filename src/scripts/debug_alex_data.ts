
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

// Initialize Firebase (using environment variables if available, or just relying on the default config handling in lib if I could import it, but pure node script is safer here)
// Actually, I can just use the project's lib/firebase if I run it via ts-node within the project context, but I'll try to keep it self-contained or use the existing config.
// Let's rely on the existing src/lib/firebase.ts but I need to handle the environment variables mock since I am running in a script not vite.

// Simpler approach: Use the existing `src/scripts/seed.ts` style which seems to work in the environment.
// Actually, I will just create a new script file that imports from '../lib/firebase' and runs the query.

import { db } from '../lib/firebase';

async function listAlexData() {
    console.log("Searching for engagement with profile.name 'Alex Mercer'...");

    // 1. Find the Engagement
    // Note: profile is a map, so we can't easily query subfields without an index if we don't know the exact ID.
    // But we know from recent context it might be 'eng_eng_user_alex_mercer' or just 'eng_user_alex_mercer'.
    // Let's list all engagements and filter in memory to be sure.
    const engSnap = await getDocs(collection(db, 'engagements'));
    const alexEngs = engSnap.docs.filter(d => {
        const data = d.data();
        const p = data.profile || {};
        const name = `${p.firstName} ${p.lastName}`;
        const headline = p.headline;
        return name.includes('Alex Mercer') || (headline && headline.includes('Alex Mercer'));
    });

    console.log(`Found ${alexEngs.length} engagements for Alex Mercer.`);

    for (const doc of alexEngs) {
        const engId = doc.id;
        console.log(`\n=== Engagement ID: ${engId} ===`);
        console.log("Data:", JSON.stringify(doc.data(), null, 2));

        // 2. Check Job Pursuits
        console.log(`\nChecking job_pursuits for engagementId: ${engId}...`);
        const pursuitsQ = query(collection(db, 'job_pursuits'), where('engagementId', '==', engId));
        const pursuitsSnap = await getDocs(pursuitsQ);
        console.log(`Found ${pursuitsSnap.size} job_pursuits.`);
        pursuitsSnap.forEach(p => console.log(` - Pursuit ${p.id}: ${p.data().role} @ ${p.data().company}`));

        // 3. Check Job Recommendations (Pending Recs)
        console.log(`\nChecking job_recommendations for engagementId: ${engId}...`);
        const recsQ = query(collection(db, 'job_recommendations'), where('engagementId', '==', engId));
        const recsSnap = await getDocs(recsQ);
        console.log(`Found ${recsSnap.size} job_recommendations.`);
        recsSnap.forEach(r => console.log(` - Rec ${r.id}: Target ${r.data().targetId}`));
    }
}

listAlexData().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
