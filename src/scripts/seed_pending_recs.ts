import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual .env parsing since dotenv might not be installed in this context
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedPendingRecs = async () => {
    try {
        console.log('Fetching users and targets...');
        const usersSnap = await getDocs(collection(db, 'users'));
        const targetsSnap = await getDocs(collection(db, 'job_targets'));
        const engagementsSnap = await getDocs(collection(db, 'engagements'));

        if (targetsSnap.empty || engagementsSnap.empty) {
            console.error('No targets or engagements found. Run seed script first.');
            return;
        }

        const targets = targetsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const engagements = engagementsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Find a suitable target and engagement
        const target = targets[0];
        const engagement = engagements[0];

        if (!target || !engagement) {
            console.error('No valid target or engagement found.');
            return;
        }

        console.log(`Creating pending AI recommendation for Target: ${target.role} -> Engagement: ${engagement.id}`);

        await addDoc(collection(db, 'job_recommendations'), {
            targetId: target.id,
            engagementId: engagement.id,
            status: 'pending_rep', // This is the key status for the Pending Recs screen
            source: 'AI',
            ai_score: 87,
            ai_rationale: 'Strong match with candidate\'s background in distributed systems and leadership experience.',
            createdAt: new Date().toISOString()
        });

        await addDoc(collection(db, 'job_recommendations'), {
            targetId: targets[1]?.id || target.id,
            engagementId: engagement.id,
            status: 'pending_rep',
            source: 'AI',
            ai_score: 92,
            ai_rationale: 'Perfect alignment with compensation expectations and career growth goals.',
            createdAt: new Date().toISOString()
        });

        console.log('Successfully created pending recommendations.');
    } catch (error) {
        console.error('Error seeding pending recs:', error);
    }
};

seedPendingRecs();
