import { GoogleGenAI } from '@google/genai';
import * as functions from 'firebase-functions';

// --- CONFIGURATION ---
// 1. Get Key from standard locations
const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.key;

// 2. Initialize SDK
// CRITICAL: Force 'v1alpha' for broadest compatibility with newer keys/models.
const genAI = apiKey ? new GoogleGenAI({
    apiKey,
    apiVersion: 'v1alpha'
}) : null;

// Standard types for your application (Customize as needed)
export interface AIRequestOptions {
    temperature?: number;
    maxOutputTokens?: number;
}

/**
 * Universal Gemini Generator
 * Resilient function to generate text using a fallback list of verified models.
 */
export const generateGeminiContent = async (
    prompt: string,
    options: AIRequestOptions = { temperature: 0.7, maxOutputTokens: 500 }
): Promise<string> => {
    if (!genAI) {
        throw new Error("AI Service not configured: Missing GEMINI_API_KEY.");
    }

    // --- MODEL STRATEGY ---
    // Update this list based on the output of `diagnose_key.js`.
    // Order matters: First one that works wins.
    const modelsToTry = [
        "gemini-2.0-flash",       // High speed, v2 engine (Preferred)
        "gemini-2.5-flash",       // Bleeding edge
        "gemini-1.5-flash",       // Stable legacy
        "gemini-flash-latest"     // Fallback alias
    ];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`AI Service: Attempting generation with model '${modelName}'...`);

            const response = await genAI.models.generateContent({
                model: modelName,
                contents: [{
                    parts: [{ text: prompt }]
                }],
                config: {
                    temperature: options.temperature,
                    maxOutputTokens: options.maxOutputTokens,
                }
            });

            // --- RESPONSE PARSING ---
            // The @google/genai SDK v1alpha returns a direct response object.
            // Be careful with differences between v1beta and v1alpha structures.

            // Validation: Ensure candidates exist
            if (!response.candidates || response.candidates.length === 0) {
                throw new Error("Empty candidates array in response");
            }

            const candidate = response.candidates[0];

            // Validation: Ensure content exists
            if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
                // Sometimes safety settings block content, check finishReason if possible
                throw new Error(`No content parts. Finish Reason: ${candidate.finishReason || 'Unknown'}`);
            }

            let text = candidate.content.parts[0].text || "";

            // --- CLEANUP ---
            // Remove markdown code fences if present (common for code/html gen)
            text = text.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim();

            if (!text) throw new Error("Parsed text is empty");

            // Success!
            return text;

        } catch (error: any) {
            console.warn(`AI Service: Failed with model '${modelName}': ${error.message}`);
            lastError = error;

            // Stop on fatal auth errors, but continue on 404/Overload
            if (error.message.includes("API_KEY_INVALID")) {
                throw error;
            }

            // Try next model...
        }
    }

    // If we get here, all models failed.
    throw new Error(`AI Generation failed after trying ${modelsToTry.length} models. Last error: ${lastError?.message}`);
};
