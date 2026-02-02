"use strict";
// import { Application } from '../../types/schema'; // specific import unavailable in functions scope without shared workspace
// Using explicit any to avoid build failure, or we could duplicate the interface.
// For now, we trust the payload structure matches.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInternalNotificationEmail = void 0;
const getInternalNotificationEmail = (application) => {
    const { fullName, email, phone, currentSalary, targetComp, primaryMotivation, experience, linkedinUrl } = application;
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
        .header { background-color: #0F2A1D; padding: 15px; border-radius: 8px 8px 0 0; color: white; }
        .content { padding: 20px; }
        .field { margin-bottom: 12px; }
        .label { font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 4px; }
        .value { font-size: 16px; color: #111; font-weight: 500; }
        .highlight { color: #D84315; font-weight: bold; }
        .footer { margin-top: 20px; font-size: 12px; color: #888; text-align: center; border-top: 1px solid #f0f0f0; padding-top: 10px; }
        a { color: #0F2A1D; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin:0;">New Candidate Application</h2>
        </div>
        <div class="content">
            <p>A new candidate has applied via the website.</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                <div class="field">
                    <span class="label">Name</span>
                    <span class="value">${fullName}</span>
                </div>
                <div class="field">
                    <span class="label">Email</span>
                    <span class="value"><a href="mailto:${email}">${email}</a></span>
                </div>
                ${phone ? `
                <div class="field">
                    <span class="label">Phone</span>
                    <span class="value">${phone}</span>
                </div>` : ''}
                ${linkedinUrl ? `
                <div class="field">
                    <span class="label">LinkedIn</span>
                    <span class="value"><a href="${linkedinUrl}">View Profile</a></span>
                </div>` : ''}
            </div>

            <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 25px;">Profile Snapshot</h3>
            
            <div class="field">
                <span class="label">Current Compensation</span>
                <span class="value">${currentSalary || 'N/A'}</span>
            </div>
             <div class="field">
                <span class="label">Target Compensation</span>
                <span class="value highlight">${targetComp || 'N/A'}</span>
            </div>
            
            <div class="field">
                <span class="label">Primary Motivation</span>
                <span class="value">${primaryMotivation || 'N/A'}</span>
            </div>

             <div class="field">
                <span class="label">Experience</span>
                <span class="value">${experience || 'N/A'}</span>
            </div>

            <div style="margin-top: 30px; text-align: center;">
                <a href="https://rep-portal.web.app/rep/applications" style="background-color: #0F2A1D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View in Portal</a>
            </div>
        </div>
        <div class="footer">
            Rep Client Portal Automation
        </div>
    </div>
</body>
</html>
    `;
};
exports.getInternalNotificationEmail = getInternalNotificationEmail;
//# sourceMappingURL=internalNotification.js.map