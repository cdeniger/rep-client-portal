
import { Resend } from 'resend';
import * as functions from 'firebase-functions';

// Initialize Resend with API Key from Firebase Config
// Config commands: firebase functions:config:set resend.api_key="re_123..."
const resend = new Resend(functions.config().resend?.api_key || process.env.RESEND_API_KEY);

interface SendEmailOptions {
    to: string;
    from?: string; // Optional override
    replyTo?: string; // Critical for Rep Advisor workflow
    subject: string;
    html: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
    try {
        // Validation: Verify API Key exists
        if (!functions.config().resend?.api_key && !process.env.RESEND_API_KEY) {
            console.error("Resend API Key is missing. Email will not be sent.");
            return false;
        }

        const { data, error } = await resend.emails.send({
            from: options.from || 'Rep Client Portal <hello@repteam.com>', // MUST be a verified domain
            to: [options.to],
            replyTo: options.replyTo,
            subject: options.subject,
            html: options.html,
        });

        if (error) {
            console.error("Error sending email via Resend:", error);
            return false;
        }

        console.log("Email sent successfully:", data?.id);
        return true;
    } catch (error) {
        console.error("Exception in emailService:", error);
        return false;
    }
};
