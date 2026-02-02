
import 'dotenv/config';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';

const verifyEmailTrigger = async () => {
    console.log("Creating test application to trigger email...");

    const id = uuidv4();
    const testApp = {
        id,
        fullName: "Test Candidate",
        email: "clay@repteam.com", // Send to user for verification
        phone: "555-0123",
        linkedinUrl: "linkedin.com/in/testcandidate",
        currentSalary: "$100k",
        targetComp: "$120k",
        experience: "Test Level",
        employmentStatus: "Testing",
        primaryMotivation: "System Verification",
        pipelineVelocity: "Test Velocity",
        status: "new",
        submittedAt: Timestamp.now(),
        resumeUrl: "https://example.com/resume.pdf"
    };

    try {
        await setDoc(doc(db, 'applications', id), testApp);
        console.log(`✅ Test application created with ID: ${id}`);
        console.log(`Check your email (clay@repteam.com) for the confirmation.`);
        console.log(`Check admin@repteam.com (if accessible) for internal notification.`);
    } catch (error) {
        console.error("❌ Error creating test application:", error);
    }
};

// Execute
if (typeof process !== 'undefined') {
    verifyEmailTrigger().then(() => process.exit(0));
}
