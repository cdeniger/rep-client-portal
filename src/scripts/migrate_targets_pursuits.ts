import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Manually load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');
console.log("Loading .env from:", envPath);

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    console.log("Env file found. First 50 chars:", envConfig.substring(0, 50));
    envConfig.split('\n').forEach(line => {
        const [key, rawValue] = line.split('=');
        if (key && rawValue) {
            let value = rawValue.trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key.trim()] = value;
        }
    });
    console.log("VITE_FIREBASE_API_KEY loaded:", process.env.VITE_FIREBASE_API_KEY ? "YES (masked)" : "NO");
} else {
    console.warn("WARNING: No .env file found at", envPath);
}

// Dynamic imports will be used inside migrate() to respect env loading order
// import { db } from '../lib/firebase';
// import { collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';

const migrate = async () => {
    // Import dependencies after env is set
    const { db, auth } = await import('../lib/firebase');
    const { collection, getDocs, addDoc, doc, getDoc } = await import('firebase/firestore');
    const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import('firebase/auth');

    console.log("Starting Migration: Opportunities -> Targets & Pursuits");

    try {
        console.log("Authenticating as temp user...");
        const email = `migration_${Date.now()}@example.com`;
        const password = 'TemporaryPassword123!';
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log(`Created and authenticated as ${email}`);
        } catch (e: any) {
            console.log("Creation failed, trying sign in... " + e.message);
            // Verify if we can sign in (unlikely for random email but good practice)
        }


        const oppsSnap = await getDocs(collection(db, 'opportunities'));
        const total = oppsSnap.size;
        console.log(`Found ${total} legacy opportunities.`);

        let processed = 0;
        let targetsCreated = 0;
        let pursuitsCreated = 0;

        for (const oppDoc of oppsSnap.docs) {
            const opp = oppDoc.data();
            console.log(`Processing ${opp.company} - ${opp.role}...`);

            // 1. Create Job Target
            // We create a target for EVERY opportunity to ensure no data loss. 
            // Deduplication can happen later.
            const targetData = {
                company: opp.company || 'Unknown Company',
                role: opp.role || 'Unknown Role',
                financials: opp.financials || {},
                status: 'OPEN', // Default key assumption: All active things are OPEN
                source: opp.source || 'manual',
                createdAt: opp.createdAt || new Date().toISOString(),
                legacyIds: [oppDoc.id] // Keep trace
            };

            const targetRef = await addDoc(collection(db, 'job_targets'), targetData);
            targetsCreated++;

            // 2. Create Job Pursuit if assigned
            // Note: In current app, opportunity.userId holds the Engagement ID (based on GlobalPipeline logic)
            // We will verify this by checking if the ID exists in 'engagements' collection, 
            // else we put it in userId field or handle it.
            // 2. Create Job Pursuit if assigned
            const linkId = opp.userId || opp.engagementId;
            if (linkId) {
                const pursuitData: any = {
                    targetId: targetRef.id,
                    userId: linkId, // Default to linkId as fallback
                    engagementId: null,
                    company: opp.company,
                    role: opp.role,
                    status: opp.status || 'outreach',
                    stage_detail: opp.stage_detail || '',
                    createdAt: opp.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    financials: opp.financials || {}
                };

                try {
                    // Try to resolve generic linkId to User/Engagement
                    const engSnap = await getDoc(doc(db, 'engagements', linkId));
                    if (engSnap.exists()) {
                        const engData = engSnap.data();
                        pursuitData.engagementId = linkId;

                        // Try to find User ID on Engagement
                        if (engData.userId) {
                            pursuitData.userId = engData.userId;
                        } else if (engData.contactId) {
                            // Try Contact
                            const contactSnap = await getDoc(doc(db, 'contacts', engData.contactId));
                            if (contactSnap.exists() && contactSnap.data().userId) {
                                pursuitData.userId = contactSnap.data().userId;
                            }
                        }
                    } else {
                        // It might be a direct User ID (e.g. active client)
                        // Verify if user exists? Or just trust it.
                    }

                    console.log(`   -> Pursuit for User: ${pursuitData.userId} (Eng: ${pursuitData.engagementId})`);

                    // Filter undefined explicitly
                    if (pursuitData.userId === undefined) {
                        pursuitData.userId = 'unknown_user';
                    }

                    await addDoc(collection(db, 'job_pursuits'), pursuitData);
                    pursuitsCreated++;

                } catch (e) {
                    console.warn(`   -> Error processing pursuit for ${linkId}`, e);
                }
            }

            processed++;
        }

        console.log("-----------------------------------");
        console.log("Migration Complete.");
        console.log(`Processed: ${processed}/${total}`);
        console.log(`Targets Created: ${targetsCreated}`);
        console.log(`Pursuits Created: ${pursuitsCreated}`);

    } catch (error) {
        console.error("Migration Fatal Error:", error);
    }
    process.exit(0);
};

migrate();
