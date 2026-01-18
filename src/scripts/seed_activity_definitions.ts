import fs from 'fs';
import path from 'path';
import { doc, writeBatch } from 'firebase/firestore';

// Manually load .env for script execution
const loadEnv = () => {
    try {
        // Assuming we run from project root
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envFile = fs.readFileSync(envPath, 'utf8');
            envFile.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, ''); // Remove quotes
                }
            });
        }
    } catch (e) {
        console.warn("Could not load .env file", e);
    }
}
loadEnv();

import { db } from '../lib/firebase';
import type { ActivityDefinition } from '../types/activities';

const seedActivityDefinitions = async () => {
    const batch = writeBatch(db);

    const definitions: ActivityDefinition[] = [
        {
            id: 'interview',
            label: 'Client Interview',
            isCore: true,
            color: 'purple',
            icon: 'star',
            fields: [] // Core fields handled in JSX
        },
        {
            id: 'call',
            label: 'Log Call',
            isCore: true,
            color: 'blue',
            icon: 'phone',
            fields: [] // Core fields handled in JSX
        },
        {
            id: 'stage_change',
            label: 'Pipeline Event',
            isCore: true,
            color: 'green',
            fields: [] // Core fields handled in JSX
        },
        {
            id: 'email',
            label: 'Email',
            isCore: true,
            color: 'slate',
            icon: 'mail',
            fields: [] // Core fields handled in JSX
        },
        {
            id: 'note',
            label: 'Note',
            isCore: true,
            color: 'amber',
            icon: 'sticky-note', // Map "note" to StickyNote in IconMap if needed, keeping simple string here
            fields: []
        }
    ];

    console.log(`Seeding ${definitions.length} Activity Definitions...`);

    definitions.forEach(def => {
        const ref = doc(db, 'activity_definitions', def.id);
        batch.set(ref, def);
    });

    await batch.commit();
    console.log('Successfully seeded Activity Definitions.');
};

// Execute if run directly
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    seedActivityDefinitions()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("Seeding Failed:", error);
            process.exit(1);
        });
}

export default seedActivityDefinitions;
