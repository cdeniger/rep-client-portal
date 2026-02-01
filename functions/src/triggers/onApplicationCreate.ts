import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

export const onApplicationCreate = functions.firestore
    .document("applications/{applicationId}")
    .onCreate(async (snapshot, context) => {
        const data = snapshot.data();
        const applicationId = context.params.applicationId;

        console.log(`New application received: ${applicationId}`, data);

        // 1. Send Internal Notification (Log for now, replace with email service)
        console.log(`Sending notification to admins about applicant: ${data.fullName} (${data.email})`);

        // 2. Send Auto-Response to Applicant
        // In a real app, integrate Postmark/SendGrid here.
        // For now, we will just log the intent.
        console.log(`Queuing auto-response for ${data.email}`);

        // 3. Ensure status is 'new'
        if (!data.status) {
            await snapshot.ref.update({ status: "new" });
            console.log("Initialized status to 'new'");
        }

        return null;
    });
