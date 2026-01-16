import { db } from '../lib/firebase';
import { collection, getDocs, where, query } from 'firebase/firestore';

const verifyData = async () => {
    console.log("Verifying Data...");
    try {
        const q = query(collection(db, 'engagements'), where('repId', '==', 'rep_jordan'));
        const snaps = await getDocs(q);
        console.log(`Found ${snaps.size} engagements for rep_jordan.`);

        if (snaps.size > 0) {
            const data = snaps.docs[0].data();
            console.log("Sample Data:", JSON.stringify(data, null, 2));
        } else {
            // Check if ANY engagements exist
            const all = await getDocs(collection(db, 'engagements'));
            console.log(`Total engagements in DB: ${all.size}`);
        }
        process.exit(0);
    } catch (error) {
        console.error("Verification Failed:", error);
        process.exit(1);
    }
};

verifyData();
