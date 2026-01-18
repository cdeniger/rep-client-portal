
import { doc, getDoc } from "firebase/firestore";
import { db } from '../lib/firebase';

async function checkRepIds() {
    console.log("Checking Rep IDs...");

    const ids = [
        'eng_user_alex_mercer',
        'eng_eng_user_alex_mercer'
    ];

    for (const id of ids) {
        const ref = doc(db, 'engagements', id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            console.log(`\nID: ${id}`);
            console.log(`Rep ID: ${snap.data().repId}`);
            console.log(`Status: ${snap.data().status}`);
        } else {
            console.log(`\nID: ${id} - NOT FOUND`);
        }
    }
}

checkRepIds().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
