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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateAts = void 0;
const genai_1 = require("@google/genai");
const functions = __importStar(require("firebase-functions"));
const pdfParseLib = require('pdf-parse');
const pdf = (typeof pdfParseLib === 'function' ? pdfParseLib : pdfParseLib.default);
const crypto = __importStar(require("crypto"));
const admin = __importStar(require("firebase-admin"));
// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY || ((_a = functions.config().gemini) === null || _a === void 0 ? void 0 : _a.key);
const genAI = apiKey ? new genai_1.GoogleGenAI({
    apiKey,
    apiVersion: 'v1alpha'
}) : null;
// Helper: Generate Platinum JD
const generatePlatinumJd = async (title, targetComp) => {
    var _a, _b, _c, _d, _e;
    if (!genAI)
        return title;
    if (title.length > 200)
        return title;
    const compContext = targetComp ? `TARGET COMPENSATION: ${targetComp}` : "TARGET LEVEL: Top 1% of Market";
    const prompt = `
    You are an Expert Headhunter for Fortune 500 companies.
    Create a "Platinum Standard" Job Description for the following role title.
    
    ROLE TITLE: "${title}"
    ${compContext}

    INSTRUCTIONS:
    1. Write a ruthless, high-performance Job Description that justifies the target compensation.
    2. Focus on STRATEGIC IMPACT, P&L OWNERSHIP, and LEADERSHIP PHILOSOPHY.
    3. Include hard-to-fake requirements (e.g., "Scaled revenue from X to Y", "Managed teams of 50+").
    4. Do generic "responsibilities" - use "Key Challenges" and "Performance Outcomes".
    5. The goal is to set a "High Bar" to audit an aspiring candidate against.

    OUTPUT:
    Full Job Description Text Only.
    `;
    try {
        const result = await genAI.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ parts: [{ text: prompt }] }]
        });
        const text = (_e = (_d = (_c = (_b = (_a = result.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text;
        return text || title;
    }
    catch (e) {
        console.error("Platinum JD Generation Failed", e);
        return title;
    }
};
const simulateAts = async (input) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    if (!genAI) {
        throw new Error("AI Service not configured (Missing API Key)");
    }
    // 0. The Platinum Hook
    let effectiveJd = input.targetRoleRaw;
    let isSyntheticJd = false;
    if (input.targetRoleRaw.length < 200) {
        console.log(`Generating Platinum JD for title: ${input.targetRoleRaw}`);
        effectiveJd = await generatePlatinumJd(input.targetRoleRaw, input.targetComp);
        isSyntheticJd = true;
    }
    // 1. Extract Text
    let rawText = input.resumeText || "";
    let bufferToParse = input.resumeBuffer;
    if (!bufferToParse && !rawText && input.resumeUrl) {
        try {
            console.log(`Fetching resume from: ${(_a = input.resumeUrl) === null || _a === void 0 ? void 0 : _a.slice(0, 50)}...`);
            const response = await fetch(input.resumeUrl);
            const contentType = response.headers.get("content-type");
            const contentLength = response.headers.get("content-length");
            console.log(`Debug Fetch: Type=${contentType}, Length=${contentLength}`);
            if (!response.ok)
                throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            bufferToParse = Buffer.from(arrayBuffer);
            if (bufferToParse.length > 4) {
                const header = bufferToParse.subarray(0, 5).toString();
                console.log(`Buffer Header: ${header}`);
            }
        }
        catch (e) {
            console.error("Remote PDF Fetch Failed", e);
            rawText = `CRITICAL FAILURE: Could not download/verify resume from URL.\nError: ${e.message}\nURL: ${input.resumeUrl}`;
        }
    }
    if (bufferToParse) {
        try {
            // Dynamic Resolution (Inline)
            let parser = pdf;
            if (typeof parser !== 'function') {
                if (typeof pdfParseLib === 'function')
                    parser = pdfParseLib;
                else if (pdfParseLib && typeof pdfParseLib.default === 'function')
                    parser = pdfParseLib.default;
                else if (pdfParseLib && typeof pdfParseLib.PDFParse === 'function')
                    parser = pdfParseLib.PDFParse;
            }
            let data;
            // V2 API
            try {
                if (typeof parser === 'function' && parser.prototype && parser.prototype.getText) {
                    // @ts-ignore
                    const instance = new parser({ data: bufferToParse });
                    data = await instance.getText();
                }
                else {
                    try {
                        // @ts-ignore
                        const instance = new parser({ data: bufferToParse });
                        if (typeof instance.getText === 'function') {
                            data = await instance.getText();
                        }
                    }
                    catch (ignore) { }
                }
            }
            catch (ignore) { }
            // V1 API Fallback
            if (!data || !data.text) {
                try {
                    data = await parser(bufferToParse);
                }
                catch (err) {
                    if (err.message && err.message.includes("Class constructors")) {
                        const instance = new parser(bufferToParse);
                        data = await instance;
                    }
                    else {
                        throw err;
                    }
                }
            }
            rawText = (data === null || data === void 0 ? void 0 : data.text) || "";
        }
        catch (e) {
            console.error("PDF Parse Failed", e);
            rawText = `CRITICAL FAILURE: Could not parse PDF structure.\nError: ${e.message}`;
        }
    }
    if (!rawText)
        rawText = "";
    if (!rawText.trim()) {
        console.warn("PDF Parsed successfully but returned no text.");
        rawText = `[FORENSIC ALERT] NO PARSABLE TEXT FOUND.\n\nPossible Causes:\n1. Scanned Image-only PDF.\n2. Security restrictions.\n3. Non-standard font encoding.\n\nATS Result: REJECT (Blank Applicant)`;
    }
    // 2. Compliance Gating
    const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/;
    const badDatePatterns = [
        /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4}\b/i,
        /\b\d{1,2}-\d{1,2}-\d{2,4}\b/,
    ];
    const complianceFlags = [];
    let complianceScore = 100;
    if (!datePattern.test(rawText)) {
        complianceFlags.push("CRITICAL: No standard MM/dd/yyyy dates found.");
        complianceScore = 0;
    }
    let badDateCount = 0;
    badDatePatterns.forEach(p => {
        if (p.test(rawText))
            badDateCount++;
    });
    if (badDateCount > 0) {
        complianceFlags.push(`Found ${badDateCount} non-compliant date formats.`);
        complianceScore -= (badDateCount * 20);
    }
    if (complianceScore < 0)
        complianceScore = 0;
    const complianceLayer = {
        score: complianceScore,
        flags: complianceFlags,
        description: "Syntax Firewall Check (Strict MM/dd/yyyy)"
    };
    // 3. AI Analysis
    const prompt = `
    You are an Enterprise ATS Simulator. Audit this candidate.

    JOB DESCRIPTION ${isSyntheticJd ? '(SYNTHETIC PLATINUM STANDARD)' : ''}:
    ${effectiveJd.slice(0, 3000)}

    RESUME TEXT:
    ${rawText.slice(0, 5000)}

    PERFORM AUDIT LAYERS:
    1. Shadow Schema (Hidden Deal-breakers): Salary, Relocation, Visa. Score 0-100.
    2. Matrix Filtering (Role/Location Lock): Does resume confirm explicit location match? Score 0-100.
    3. Signal Freshness: Generic vs Targeted? Score 0-100.
    4. Context Audit: Cultural keywords? Score 0-100.
    5. Entity Extraction (The Parser View):
        - Extract what you think are the: Name, Email, Phone, Top 5 Hard Skills.

    OUTPUT RAW JSON ONLY (No Markdown):
    {
        "shadow_schema": { "score": number, "flags": string[] },
        "matrix_filtering": { "score": number, "flags": string[] },
        "version_control": { "score": number, "flags": string[] },
        "content_context": { "score": number, "flags": string[] },
        "extracted_entities": {
            "name": string | null,
            "email": string | null,
            "phone": string | null,
            "skills": string[]
        },
        "confidence_score": number
    }
    `;
    const modelsToTry = ["gemini-2.0-flash-exp", "gemini-2.0-flash", "gemini-1.5-pro-latest", "gemini-pro"];
    let aiResult = null;
    for (const model of modelsToTry) {
        try {
            console.log(`Attempting AI Analysis with model: ${model}`);
            const result = await genAI.models.generateContent({
                model: model,
                contents: [{ parts: [{ text: prompt }] }],
                config: { responseMimeType: 'application/json' }
            });
            const candidate = (_b = result.candidates) === null || _b === void 0 ? void 0 : _b[0];
            const textResponse = (_e = (_d = (_c = candidate === null || candidate === void 0 ? void 0 : candidate.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text;
            if (textResponse) {
                console.log(`AI Raw Response (${model}):`, textResponse.slice(0, 200));
                const cleanedJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                aiResult = JSON.parse(cleanedJson);
                break;
            }
            else {
                console.warn(`Model ${model} returned no text. FinishReason: ${candidate === null || candidate === void 0 ? void 0 : candidate.finishReason}`);
            }
        }
        catch (e) {
            console.warn(`Model ${model} failed: ${e.message}`);
        }
    }
    // --- HARDENING: INLINE VALIDATION ---
    const fallbackLayer = { score: 0, flags: ["AI Analysis Failed"], description: "Analysis Error" };
    if (!aiResult || typeof aiResult !== 'object') {
        console.error("AI Simulation Failed or returned non-object.");
        aiResult = {};
    }
    const safeAiResult = Object.assign({}, aiResult);
    // Ensure all layers exist to prevent undefined.score crashes
    if (!((_f = safeAiResult.shadow_schema) === null || _f === void 0 ? void 0 : _f.score) && ((_g = safeAiResult.shadow_schema) === null || _g === void 0 ? void 0 : _g.score) !== 0)
        safeAiResult.shadow_schema = Object.assign(Object.assign({}, fallbackLayer), { description: "Private Field Gap Analysis" });
    if (!((_h = safeAiResult.matrix_filtering) === null || _h === void 0 ? void 0 : _h.score) && ((_j = safeAiResult.matrix_filtering) === null || _j === void 0 ? void 0 : _j.score) !== 0)
        safeAiResult.matrix_filtering = Object.assign(Object.assign({}, fallbackLayer), { description: "Location/Dept Signal Lock" });
    if (!((_k = safeAiResult.version_control) === null || _k === void 0 ? void 0 : _k.score) && ((_l = safeAiResult.version_control) === null || _l === void 0 ? void 0 : _l.score) !== 0)
        safeAiResult.version_control = Object.assign(Object.assign({}, fallbackLayer), { description: "Stagnant Signal Risk" });
    if (!((_m = safeAiResult.content_context) === null || _m === void 0 ? void 0 : _m.score) && ((_o = safeAiResult.content_context) === null || _o === void 0 ? void 0 : _o.score) !== 0)
        safeAiResult.content_context = Object.assign(Object.assign({}, fallbackLayer), { description: "Full Content Context Audit" });
    if (!safeAiResult.extracted_entities)
        safeAiResult.extracted_entities = { name: null, email: null, skills: [] };
    const overallScore = Math.round(((safeAiResult.shadow_schema.score || 0) * 0.3) +
        ((safeAiResult.matrix_filtering.score || 0) * 0.2) +
        ((safeAiResult.version_control.score || 0) * 0.1) +
        ((safeAiResult.content_context.score || 0) * 0.1) +
        ((complianceLayer.score || 0) * 0.3));
    // --- DETERMINISTIC CONFIDENCE CALCULATION (Safe Repair) ---
    // Override AI hallucinated score with actual data presence check
    let calculatedConfidence = 0;
    if ((_p = safeAiResult.extracted_entities) === null || _p === void 0 ? void 0 : _p.name)
        calculatedConfidence += 30;
    if ((_q = safeAiResult.extracted_entities) === null || _q === void 0 ? void 0 : _q.email)
        calculatedConfidence += 30;
    if ((_r = safeAiResult.extracted_entities) === null || _r === void 0 ? void 0 : _r.phone)
        calculatedConfidence += 20;
    if (((_s = safeAiResult.extracted_entities) === null || _s === void 0 ? void 0 : _s.skills) && safeAiResult.extracted_entities.skills.length > 0)
        calculatedConfidence += 20;
    const simulation = {
        id: crypto.randomUUID(),
        userId: input.userId,
        applicationId: input.applicationId,
        jobPursuitId: input.jobPursuitId,
        targetRoleRaw: input.targetRoleRaw,
        resumeTextRaw: rawText,
        parserView: {
            extractedName: safeAiResult.extracted_entities.name,
            extractedEmail: safeAiResult.extracted_entities.email,
            extractedPhone: safeAiResult.extracted_entities.phone,
            extractedSkills: safeAiResult.extracted_entities.skills || [],
            rawTextDump: rawText,
            parsingConfidenceScore: calculatedConfidence // Use deterministic score
        },
        scorecard: {
            overallScore: overallScore,
            layers: {
                shadow_schema: safeAiResult.shadow_schema,
                matrix_filtering: safeAiResult.matrix_filtering,
                version_control: safeAiResult.version_control,
                content_context: safeAiResult.content_context,
                compliance_gating: complianceLayer
            },
            criticalFailures: [...complianceLayer.flags]
        },
        createdAt: admin.firestore.Timestamp.now()
    };
    console.log("Used Effective JD:", effectiveJd.slice(0, 100));
    return simulation;
};
exports.simulateAts = simulateAts;
//# sourceMappingURL=simulateAts.js.map