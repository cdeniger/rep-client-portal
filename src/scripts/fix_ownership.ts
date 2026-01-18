
import { doc, updateDoc } from "firebase/firestore";
import { db } from '../lib/firebase';

async function fixOwnership() {
    console.log("Transferring ownership of 'eng_user_alex_mercer' to 'rep_jordan'...");

    // We assume the user is 'rep_jordan' based on previous context. 
    // If they are 'rep_admin', then the original seed would have worked.
    const newOwnerId = 'rep_jordan';
    const engId = 'eng_user_alex_mercer';

    try {
        const ref = doc(db, 'engagements', engId);
        await updateDoc(ref, {
            repId: newOwnerId
        });
        console.log(`Successfully transferred ${engId} to ${newOwnerId}.`);
    } catch (e) {
        console.error("Error updating document:", e);
    }
}

fixOwnership().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
