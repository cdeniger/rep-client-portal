
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendEmail } from '../services/emailService';
import { getInternalNotificationEmail } from '../templates/internalNotification';
import { getApplicantAutoResponse } from '../templates/applicantAutoResponse';
import { getActiveAdvisor } from '../config/advisors';

export const onApplicationCreate = functions.firestore
    .document('applications/{applicationId}')
    .onCreate(async (snap, context) => {
        const application = snap.data();
        const applicationId = context.params.applicationId;

        console.log(`Processing new application: ${applicationId} for ${application.fullName}`);

        // 1. Assign Rep Advisor (Round Robin / Random)
        const advisor = getActiveAdvisor();
        console.log(`Assigned Advisor: ${advisor.name} (${advisor.email})`);

        // 2. Prepare Emails
        const internalHtml = getInternalNotificationEmail(application);
        const candidateHtml = getApplicantAutoResponse(application.fullName || 'Candidate', advisor);

        // 3. Send Internal Notification (To Admin)
        const internalEmailPromise = sendEmail({
            to: 'hello@repteam.com',
            subject: `[New Lead] ${application.fullName} via Website`,
            html: internalHtml
        });

        // 4. Send Acknowledgement (To Candidate) - FROM the Advisor
        const candidateEmailPromise = sendEmail({
            to: application.email,
            from: `"${advisor.name}" <hello@repteam.com>`, // authenticated sender, but friendly name
            replyTo: advisor.email, // replies go directly to the Rep
            subject: `Re: Your application to Rep.`, // "Re:" implies personal follow-up
            html: candidateHtml
        });

        try {
            await Promise.all([internalEmailPromise, candidateEmailPromise]);
            console.log("Emails sent successfully.");

            // 5. Update Status & Metadata
            await snap.ref.update({
                status: 'new', // Ensure initialized
                assignedAdvisorId: advisor.id,
                emailStats: {
                    sentAt: admin.firestore.FieldValue.serverTimestamp(),
                    advisorAssigned: advisor.email
                }
            });

        } catch (error) {
            console.error("Error in onApplicationCreate workflow:", error);
        }
    });
