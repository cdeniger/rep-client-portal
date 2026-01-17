import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { doc, updateDoc } from 'firebase/firestore';

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

const fixOpportunities = async () => {
    console.log("Fixing Opportunities...");
    try {
        // Hard wire 'inventory_rep_jordan_19' (found in debug output)
        const targetOppId = 'inventory_rep_jordan_19';
        const targetUserId = 'eng_user_alex_mercer';

        console.log(`Assigning ${targetOppId} to ${targetUserId}...`);

        await updateDoc(doc(db, 'opportunities', targetOppId), {
            userId: targetUserId,
            status: 'interviewing' // Ensure it shows as active/interviewing
        });

        console.log("Success! Opportunity hard wired.");
        process.exit(0);
    } catch (error) {
        console.error("Fix Failed:", error);
        process.exit(1);
    }
};

fixOpportunities();
