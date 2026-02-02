
import { Advisor } from '../config/advisors';

export const getApplicantAutoResponse = (candidateName: string, advisor: Advisor) => {
    // Extract first name for friendliness
    const firstName = candidateName.split(' ')[0];

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; }
        .wrapper { background-color: #ffffff; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; }
        .content { font-size: 16px; color: #333333; margin-bottom: 40px; }
        .signature-block { border-top: 1px solid #e5e5e5; padding-top: 30px; margin-top: 40px; }
        .advisor-name { font-weight: bold; font-size: 16px; color: #0F2A1D; display: block; margin-bottom: 4px; }
        .brand-line { font-weight: bold; font-size: 16px; color: #0F2A1D; display: block; margin-bottom: 4px; }
        .website-link { font-weight: bold; font-size: 16px; color: #0F2A1D; text-decoration: none; display: block; }
        a { color: #0F2A1D; text-decoration: none; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="content">
                <p>Hi ${firstName},</p>
                
                <p>Thanks for applying to Rep. I've received your profile and will be reviewing it shortly.</p>
                
                <p>We take a very tailored approach to representation, so I want to make sure I give your background the attention it deserves. If your experience aligns with our current client roster and hiring partners, I’ll reach out directly to schedule a brief intro call.</p>
                
                <p>You can expect to hear from me or a member of my team within the next 48 hours.</p>

                <p>Best,</p>
            </div>

            <div class="signature-block">
                <span class="advisor-name">${advisor.name}</span>
                <span class="brand-line">Rep. | Professionally Represented</span>
                <a href="https://www.repteam.com" class="website-link">www.repteam.com</a>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};
