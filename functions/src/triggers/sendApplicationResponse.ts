import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { sendResponseEmail } from '../services/responseService';

export const sendApplicationResponse = functions.https.onCall(async (data, context) => {
    // 1. Validation
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { applicationId, candidateEmail, subject, htmlBody, advisorName, advisorEmail } = data;

    if (!applicationId || !candidateEmail || !subject || !htmlBody) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields (applicationId, candidateEmail, subject, htmlBody).');
    }

    // 2. Send Email
    const result = await sendResponseEmail({
        to: candidateEmail,
        subject: subject,
        htmlBody: htmlBody,
        replyToName: advisorName || 'Rep Advisor',
        replyToEmail: advisorEmail || context.auth.token.email || 'hello@repteam.com',
        applicationId: applicationId
    });

    if (!result.success) {
        throw new functions.https.HttpsError('internal', 'Failed to send email via provider.');
    }

    // 3. Log Activity & Update Status
    try {
        const db = admin.firestore();
        const appRef = db.collection('applications').doc(applicationId);

        await appRef.update({
            status: 'contacted',
            lastContactedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Optional: We could log a detailed "activity" record here if we had an ActivityService 
        // accessible in this scope, or just rely on the updated status.

        return { success: true, message: "Email sent and application updated." };

    } catch (dbError) {
        console.error("Error updating Firestore after sending email:", dbError);
        // We still return success because the email DID go out, which is the critical part.
        return { success: true, warning: "Email sent but status update failed." };
    }
});
