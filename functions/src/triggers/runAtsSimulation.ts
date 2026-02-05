import * as functions from 'firebase-functions';
import { simulateAts } from '../services/ats/simulateAts';

export const runAtsSimulation = functions.runWith({
    timeoutSeconds: 300, // Parsing/Gemini can be slow
    memory: '1GB'
}).https.onCall(async (data, context) => {
    // 1. Auth Check (Optional for "Hook", but good for rate limiting)
    // if (!context.auth) { ... }

    // 2. data validation
    if (!data.targetRoleRaw || (!data.resumeText && !data.resumeBuffer && !data.resumeUrl)) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing job description or resume content (URL, text, or buffer required).');
    }

    try {
        const simulation = await simulateAts({
            targetRoleRaw: data.targetRoleRaw,
            resumeText: data.resumeText,
            resumeBuffer: data.resumeBuffer ? Buffer.from(data.resumeBuffer, 'base64') : undefined, // Handle Buffer from wire
            resumeUrl: data.resumeUrl,
            targetComp: data.targetComp, // New: Platinum Standard Context
            userId: data.userId || context.auth?.uid,
            applicationId: data.applicationId,
            jobPursuitId: data.jobPursuitId
        });

        return simulation;

    } catch (error: any) {
        console.error("ATS Simulation Error:", error);
        throw new functions.https.HttpsError('internal', error.message || 'Simulation failed');
    }
});
