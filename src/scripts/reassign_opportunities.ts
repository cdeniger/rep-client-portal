import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// 1. Manually Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
            if (key && !key.startsWith('#')) {
                process.env[key] = value;
            }
        }
    });
}

// 2. Import Firebase (Dynamic)
const { db } = await import('../lib/firebase.ts');

const reassignOpportunities = async () => {
    console.log("Reassigning Opportunities to eng_user_alex_mercer...");
    try {
        const targetUserId = 'eng_user_alex_mercer';
        const batch = writeBatch(db);
        let count = 0;

        const snaps = await getDocs(collection(db, 'opportunities'));
        snaps.forEach(docSnap => {
            const data = docSnap.data();
            // Check for any variations of Alex IDs or the known Sample Copy
            if (
                (data.userId && data.userId.includes('alex') && data.userId !== targetUserId) ||
                (data.company === 'Sample Copy') ||
                (data.company === 'Stripe' && data.userId !== targetUserId)
            ) {
                console.log(`Reassigning [${docSnap.id}] from '${data.userId}' to '${targetUserId}'`);
                const ref = doc(db, 'opportunities', docSnap.id);
                batch.update(ref, { userId: targetUserId });
                count++;
            }
        });

        if (count > 0) {
            await batch.commit();
            console.log(`Successfully reassigned ${count} opportunities.`);
        } else {
            console.log("No opportunities needed reassignment.");
        }

        process.exit(0);

    } catch (error) {
        console.error("Reassignment Failed:", error);
        process.exit(1);
    }
};

reassignOpportunities();
