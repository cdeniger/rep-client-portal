import 'dotenv/config';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '../lib/firebase';

const inspectCollection = async (colName: string) => {
    console.log(`Inspecting '${colName}' collection...`);
    try {
        const ref = collection(db, colName);
        const q = query(ref, limit(5));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log(`No documents found in '${colName}'.`);
        } else {
            console.log(`Found ${querySnapshot.size} documents in '${colName}':`);
            querySnapshot.forEach((doc) => {
                console.log(`[${colName}] ID: ${doc.id}`);
                console.log("Data:", JSON.stringify(doc.data(), null, 2));
            });
        }
    } catch (error) {
        console.error(`Error inspecting ${colName}:`, error);
    }
    console.log("---");
};

const runInspection = async () => {
    await inspectCollection('leads');
    await inspectCollection('applications');
    await inspectCollection('users'); // Verify connection to seeded DB
};

// Execute
if (typeof process !== 'undefined') {
    runInspection().then(() => process.exit(0));
}
