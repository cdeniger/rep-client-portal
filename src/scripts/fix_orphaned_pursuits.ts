
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, doc, updateDoc, writeBatch } from 'firebase/firestore';

const fixOrphans = async () => {
    console.log("Starting Orphan Fixer...");

    // 1. Find all job_pursuits without engagementId
    // Note: Firestore doesn't support 'where field is missing' natively in all SDKs easily,
    // so we might need to fetch all and filter in memory if the dataset is small (it is).
    const pursuitsSnap = await getDocs(collection(db, 'job_pursuits'));
    const orphans = pursuitsSnap.docs.filter(d => !d.data().engagementId || d.data().engagementId === 'orphaned');

    console.log(`Found ${orphans.length} potential orphans.`);

    if (orphans.length === 0) {
        console.log("No orphans found. Exiting.");
        process.exit(0);
    }

    const batch = writeBatch(db);
    let updateCount = 0;

    // Cache engagements to avoid N+1 queries
    const engagementCache: Record<string, string> = {};

    for (const pursuitDoc of orphans) {
        const data = pursuitDoc.data();
        const userId = data.userId;

        if (!userId) {
            console.warn(`Pursuit ${pursuitDoc.id} has no userId. Skipping.`);
            continue;
        }

        let engagementId = engagementCache[userId];

        if (!engagementId) {
            console.log(`Fetching engagement for user ${userId}...`);
            const engQuery = query(
                collection(db, 'engagements'),
                where('userId', '==', userId),
                where('status', 'in', ['active', 'searching', 'negotiating', 'placed'])
            );
            const engSnap = await getDocs(engQuery);
            if (!engSnap.empty) {
                engagementId = engSnap.docs[0].id;
                engagementCache[userId] = engagementId;
                console.log(`Found engagement ${engagementId} for user ${userId}.`);
            } else {
                console.error(`No active engagement found for user ${userId}. Skipping pursuit ${pursuitDoc.id}.`);
                continue;
            }
        }

        console.log(`Linking pursuit ${pursuitDoc.id} (${data.company}) to engagement ${engagementId}.`);
        batch.update(doc(db, 'job_pursuits', pursuitDoc.id), { engagementId: engagementId });
        updateCount++;
    }

    if (updateCount > 0) {
        await batch.commit();
        console.log(`Successfully fixed ${updateCount} orphaned pursuits.`);
    } else {
        console.log("No updates performed.");
    }

    process.exit(0);
};

fixOrphans().catch(console.error);
