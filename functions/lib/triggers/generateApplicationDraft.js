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
exports.generateApplicationDraftTrigger = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const aiService_1 = require("../services/aiService");
// Ensure we have an admin app initialized (usually done in index.ts, but safe to check)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
exports.generateApplicationDraftTrigger = functions.https.onCall(async (data, context) => {
    // 1. Auth Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    // Role Check (Optional: Enforce 'rep' or 'admin' role if strict RBAC is needed)
    // For now, any authenticated user (who is likely a Rep in this portal) can draft.
    // 2. Input Validation
    const { candidateName, role, company, intent, 
    // Optional context
    motivation, idealTarget, experience, currentSalary, targetComp, pipelineVelocity, employmentStatus, advisorName } = data;
    if (!candidateName || !intent) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields (candidateName, intent).');
    }
    // 3. Construct Context
    const draftContext = {
        candidateName,
        role: role || 'Candidate',
        company: company || 'Unknown',
        motivation,
        idealTarget,
        experience,
        currentSalary,
        targetComp,
        pipelineVelocity,
        employmentStatus
    };
    // 4. Call AI Service
    try {
        const draftHtml = await (0, aiService_1.generateApplicationDraft)(draftContext, intent, advisorName || 'Rep Advisor');
        return { success: true, draft: draftHtml };
    }
    catch (error) {
        console.error("AI Draft Error:", error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to generate draft.');
    }
});
//# sourceMappingURL=generateApplicationDraft.js.map