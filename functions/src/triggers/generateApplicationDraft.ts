import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateApplicationDraft, DraftContext } from '../services/aiService';

// Ensure we have an admin app initialized (usually done in index.ts, but safe to check)
if (admin.apps.length === 0) {
    admin.initializeApp();
}

export const generateApplicationDraftTrigger = functions.https.onCall(async (data, context) => {
    // 1. Auth Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    // Role Check (Optional: Enforce 'rep' or 'admin' role if strict RBAC is needed)
    // For now, any authenticated user (who is likely a Rep in this portal) can draft.

    // 2. Input Validation
    const {
        candidateName,
        role,
        company,
        intent,
        // Optional context
        motivation,
        idealTarget,
        experience,
        currentSalary,
        targetComp,
        pipelineVelocity,
        employmentStatus,
        advisorName
    } = data;

    if (!candidateName || !intent) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields (candidateName, intent).');
    }

    // 3. Construct Context
    const draftContext: DraftContext = {
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
        const draftHtml = await generateApplicationDraft(
            draftContext,
            intent,
            advisorName || 'Rep Advisor'
        );

        return { success: true, draft: draftHtml };

    } catch (error: any) {
        console.error("AI Draft Error:", error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to generate draft.');
    }
});
