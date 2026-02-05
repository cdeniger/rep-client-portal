"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onApplicationCreate = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const emailService_1 = require("../services/emailService");
const internalNotification_1 = require("../templates/internalNotification");
const applicantAutoResponse_1 = require("../templates/applicantAutoResponse");
const advisors_1 = require("../config/advisors");
exports.onApplicationCreate = functions.firestore
    .document('applications/{applicationId}')
    .onCreate(async (snap, context) => {
    const application = snap.data();
    const applicationId = context.params.applicationId;
    console.log(`Processing new application: ${applicationId} for ${application.fullName}`);
    // 1. Assign Rep Advisor (Round Robin / Random)
    const advisor = (0, advisors_1.getActiveAdvisor)();
    console.log(`Assigned Advisor: ${advisor.name} (${advisor.email})`);
    // 2. Prepare Emails
    const internalHtml = (0, internalNotification_1.getInternalNotificationEmail)(application);
    const candidateHtml = (0, applicantAutoResponse_1.getApplicantAutoResponse)(application.fullName || 'Candidate', advisor);
    // 3. Send Internal Notification (To Admin)
    const internalEmailPromise = (0, emailService_1.sendEmail)({
        to: 'hello@repteam.com',
        subject: `[New Lead] ${application.fullName} via Website`,
        html: internalHtml
    });
    // 4. Send Acknowledgement (To Candidate) - FROM the Advisor
    const candidateEmailPromise = (0, emailService_1.sendEmail)({
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
    }
    catch (error) {
        console.error("Error in onApplicationCreate workflow:", error);
    }
});
//# sourceMappingURL=onApplicationCreate.js.map