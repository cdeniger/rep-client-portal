import { seedRepData } from './seed';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const runSeed = async () => {
    console.log("Starting Seeding Process...");
    const REP_ID = 'rep_jordan';

    try {
        await seedRepData(REP_ID);
        console.log("Seeding Complete!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding Failed:", error);
        process.exit(1);
    }
};

runSeed();
