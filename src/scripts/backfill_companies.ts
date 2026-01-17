
import * as fs from 'fs';
import * as path from 'path';

// Load .env
try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                let val = value.trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                process.env[key.trim()] = val;
            }
        });
        console.log("Loaded .env file successfully.");
    }
} catch (e) {
    console.warn("Could not load .env file manually.", e);
}

async function backfillCompanies() {
    console.log("Starting Company Backfill...");
    try {
        const { db } = await import('../lib/firebase.ts');
        const { collection, getDocs, doc, updateDoc } = await import('firebase/firestore');

        const snapshot = await getDocs(collection(db, 'companies'));
        console.log(`Fetched ${snapshot.size} companies.`);

        let updatedCount = 0;

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const name = data.name;
            const currentLower = data.name_lower;
            const expectedLower = name.trim().toLowerCase();

            if (!currentLower || currentLower !== expectedLower) {
                console.log(`Updating ${name} (${docSnap.id}) -> name_lower: ${expectedLower}`);
                await updateDoc(doc(db, 'companies', docSnap.id), {
                    name_lower: expectedLower
                });
                updatedCount++;
            }
        }

        console.log(`Backfill complete. Updated ${updatedCount} companies.`);

    } catch (error) {
        console.error("Backfill Failed:", error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

backfillCompanies();
