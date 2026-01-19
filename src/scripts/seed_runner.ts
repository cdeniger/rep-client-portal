import { seedRepData, seedClientData } from './seed';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const runSeed = async () => {
    console.log("Starting Seeding Process...");
    const REP_ID = 'rep_jordan';
    const CLIENT_ID = 'user_alex_mercer';

    try {
        await seedRepData(REP_ID);
        await seedClientData(CLIENT_ID);
        console.log("Seeding Complete!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding Failed:", error);
        process.exit(1);
    }
};

runSeed();
