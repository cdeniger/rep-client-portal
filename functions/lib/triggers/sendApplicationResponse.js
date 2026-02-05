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
exports.sendApplicationResponse = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const responseService_1 = require("../services/responseService");
exports.sendApplicationResponse = functions.https.onCall(async (data, context) => {
    // 1. Validation
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { applicationId, candidateEmail, subject, htmlBody, advisorName, advisorEmail } = data;
    if (!applicationId || !candidateEmail || !subject || !htmlBody) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields (applicationId, candidateEmail, subject, htmlBody).');
    }
    // 2. Send Email
    const result = await (0, responseService_1.sendResponseEmail)({
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
    }
    catch (dbError) {
        console.error("Error updating Firestore after sending email:", dbError);
        // We still return success because the email DID go out, which is the critical part.
        return { success: true, warning: "Email sent but status update failed." };
    }
});
//# sourceMappingURL=sendApplicationResponse.js.map