import { GoogleGenAI } from '@google/genai';
import * as functions from 'firebase-functions';

// Initialize Gemini
// Note: We expect GEMINI_API_KEY to be set in the environment or via functions config
const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.key;

// New SDK Initialization
const genAI = apiKey ? new GoogleGenAI({
    apiKey,
    apiVersion: 'v1alpha' // Force v1alpha as v1beta seems to return 404 for this key/project
}) : null;

export interface DraftContext {
    candidateName: string;
    role?: string;
    company?: string;
    motivation?: string;
    idealTarget?: string;
    experience?: string;
    currentSalary?: string;
    targetComp?: string;
    pipelineVelocity?: string;
    employmentStatus?: string;
}

export type DraftIntent = 'connect' | 'reject' | 'clarify';

export const generateApplicationDraft = async (
    context: DraftContext,
    intent: DraftIntent,
    advisorName: string
): Promise<string> => {
    if (!genAI) {
        throw new Error("AI Service not configured (Missing API Key)");
    }

    // Construct the Prompt
    let prompt = `Act as a senior agent at Rep, an elite talent brokerage for high-finance professionals.
Write a short, personal email to ${context.candidateName} on behalf of ${advisorName}.

CANDIDATE CONTEXT:
- Name: ${context.candidateName}
- Motivation: ${context.motivation || 'Standard Application'}
- Ideal Target: ${context.idealTarget || 'Not specified'}
- Experience: ${context.experience || 'Not specified'}
`;

    // Conditional Additions
    if (context.role && context.company) {
        prompt += `- Current Role: ${context.role} at ${context.company}\n`;
    }
    if (context.currentSalary || context.targetComp) {
        prompt += `- Compensation: ${context.currentSalary || '?'} -> ${context.targetComp || '?'}\n`;
    }
    if (context.pipelineVelocity) {
        prompt += `- Velocity: ${context.pipelineVelocity}\n`;
    }
    if (context.employmentStatus) {
        prompt += `- Status: ${context.employmentStatus}\n`;
    }

    prompt += `
YOUR GOAL (${intent.toUpperCase()}):
`;

    // Intent Specifics
    switch (intent) {
        case 'connect':
            prompt += `[Connect]: Acknowledge their strong background. Propose a strictly brief intro chat. Assume a Calendly link will be added later.\n`;
            break;
        case 'reject':
            prompt += `[Reject]: Thank them, but state we don't have a match for their Ideal Target right now. Keep it professional and door-open for future.\n`;
            break;
        case 'clarify':
            prompt += `[Clarify]: Express interest but ask specifically for their Resume or clarification on their Ideal Target. Be direct.\n`;
            break;
    }

    prompt += `
GUIDELINES:
1. Tone: Professional, high-status, slightly informal (peer-to-peer), and concise.
2. Structure: 
   - Acknowledge where they are (Status/Motivation).
   - Pivot to Rep's value prop (ORDER MATTERS):
     1. FIRST: We bring you access to new, off-market PE/Hedge Fund roles.
     2. SECOND: We ALSO help you better navigate opportunities you are *already tracking*.
   - Call to Action (Intro call).
3. MISSING DATA RULES:
   - If 'Current Company' or 'Role' is NOT provided in context, DO NOT mention their current employment. Focus on their experience level or motivation.
   - NEVER use placeholders.
   - If 'Ideal Target' is generic, focus on "Finance Leadership" or "Investment Roles".
4. PERSONA RULES:
   - Do NOT introduce yourself by name in the body if signed with the same name.
   - Write as the specified Advisor (${advisorName}).
5. ANTI-ROBOTIC RULE:
   - Do NOT simply plug in the variables. Don't say "I see your motivation is X". Instead, synthesize it: "It sounds like you're looking for a move that offers X..."
   - Flow naturally.

CONSTRAINTS:
- Be concise (<150 words).
- No "I hope this finds you well".
- Do NOT include a sign-off or signature (e.g., skip "Best," and the name). We will append this programmatically.
- Output ONLY HTML paragraphs (<p>).
- Add strict spacing: Use <p style="margin-bottom: 16px;"> for every paragraph to ensure separation.
- Output ONLY the email body HTML.
`;

    // VERIFIED MODELS for New SDK (Diagnostic Confirmed)
    const modelsToTry = [
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-flash-latest"
    ];

    for (const modelName of modelsToTry) {
        try {
            console.log(`Attempting generation with NEW SDK(v1alpha) & model: ${modelName} `);

            const response = await genAI.models.generateContent({
                model: modelName,
                contents: [{
                    parts: [{ text: prompt }]
                }],
                config: {
                    temperature: 0.7,
                    maxOutputTokens: 500,
                }
            });

            // Parse response: The new SDK returns 'GenerateContentResponse' directly.
            // It does not have .response wrapper or .text() method.
            let text = "";
            if (response.candidates && response.candidates.length > 0) {
                const candidate = response.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    text = candidate.content.parts[0].text || "";
                }
            } else {
                console.log("Full Response Object:", JSON.stringify(response));
                throw new Error("Empty response from AI");
            }

            // Basic cleanup if the model outputs markdown code blocks
            if (text) {
                text = text.replace(/```html/g, '').replace(/```/g, '').trim();
                return text;
            } else {
                throw new Error("Empty text in response");
            }

        } catch (error: any) {
            console.error(`Gemini Generation Error (${modelName}):`, error.message);

            // If this was the last model, throw the error
            if (modelName === modelsToTry[modelsToTry.length - 1]) {
                throw new Error("Failed to generate draft. Please try again.");
            }
            // Otherwise loop
            continue;
        }
    }
    return ""; // Should not reach here
};
