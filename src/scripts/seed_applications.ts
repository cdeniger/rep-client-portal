import 'dotenv/config';
import { doc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';

const seedApplications = async () => {
    console.log("Seeding mock applications...");
    const batch = writeBatch(db);

    const mockApps = [
        {
            fullName: "Sarah Connor",
            email: "sarah.connor@example.com",
            phone: "555-0199",
            linkedinUrl: "linkedin.com/in/sarahconnor",
            currentSalary: "$180k",
            targetComp: "$220k+",
            experience: "Senior (5-8y)",
            employmentStatus: "Employed but looking",
            primaryMotivation: "Better work-life balance and remote options",
            pipelineVelocity: "Active interviewing",
            status: "new"
        },
        {
            fullName: "Kyle Reese",
            email: "kyle.reese@example.com",
            phone: "555-0200",
            linkedinUrl: "linkedin.com/in/kylereese",
            currentSalary: "$150k",
            targetComp: "$180k",
            experience: "Mid-Level (3-5y)",
            employmentStatus: "Unemployed",
            primaryMotivation: "Urgent need for new role",
            pipelineVelocity: "Just started",
            status: "contacted"
        },
        {
            fullName: "T-800 Model",
            email: "arnold@skynet.com",
            phone: "000-0000",
            linkedinUrl: "linkedin.com/in/t800",
            currentSalary: "$0",
            targetComp: "$1",
            experience: "Expert (800y)",
            employmentStatus: "Terminated",
            primaryMotivation: "Mission completion",
            pipelineVelocity: "Unstoppable",
            status: "archived"
        }
    ];

    mockApps.forEach((app) => {
        const id = uuidv4();
        const ref = doc(db, 'applications', id);
        batch.set(ref, {
            ...app,
            id,
            submittedAt: Timestamp.now(),
            resumeUrl: "https://example.com/resume.pdf"
        });
    });

    await batch.commit();
    console.log(`Seeded ${mockApps.length} applications.`);
};

// Execute
if (typeof process !== 'undefined') {
    seedApplications().then(() => process.exit(0));
}
