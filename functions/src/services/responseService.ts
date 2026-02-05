import { Resend } from 'resend';
import * as functions from 'firebase-functions/v1';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || functions.config().resend?.api_key);

export interface ResponseOptions {
    to: string;
    subject: string;
    htmlBody: string;
    replyToName: string;
    replyToEmail: string;
    applicationId: string;
}

export const sendResponseEmail = async (options: ResponseOptions): Promise<{ success: boolean; id?: string; error?: any }> => {
    try {
        const { to, subject, htmlBody, replyToName, replyToEmail } = options;

        const { data, error } = await resend.emails.send({
            from: `"${replyToName}" <hello@repteam.com>`, // Authorized domain sender
            to: [to],
            replyTo: replyToEmail, // Direct reply goes to the Rep
            bcc: [replyToEmail], // Advisor gets a copy for their records
            subject: subject,
            html: htmlBody,
        });

        if (error) {
            console.error("Error sending response email:", error);
            return { success: false, error };
        }

        console.log("Response email sent successfully:", data?.id);
        return { success: true, id: data?.id };
    } catch (err) {
        console.error("Exception in sendResponseEmail:", err);
        return { success: false, error: err };
    }
};
