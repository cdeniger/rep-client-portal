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
exports.runAtsSimulation = void 0;
const functions = __importStar(require("firebase-functions"));
const simulateAts_1 = require("../services/ats/simulateAts");
exports.runAtsSimulation = functions.runWith({
    timeoutSeconds: 300, // Parsing/Gemini can be slow
    memory: '1GB'
}).https.onCall(async (data, context) => {
    // 1. Auth Check (Optional for "Hook", but good for rate limiting)
    // if (!context.auth) { ... }
    var _a;
    // 2. data validation
    if (!data.targetRoleRaw || (!data.resumeText && !data.resumeBuffer && !data.resumeUrl)) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing job description or resume content (URL, text, or buffer required).');
    }
    try {
        const simulation = await (0, simulateAts_1.simulateAts)({
            targetRoleRaw: data.targetRoleRaw,
            resumeText: data.resumeText,
            resumeBuffer: data.resumeBuffer ? Buffer.from(data.resumeBuffer, 'base64') : undefined, // Handle Buffer from wire
            resumeUrl: data.resumeUrl,
            targetComp: data.targetComp, // New: Platinum Standard Context
            userId: data.userId || ((_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid),
            applicationId: data.applicationId,
            jobPursuitId: data.jobPursuitId
        });
        return simulation;
    }
    catch (error) {
        console.error("ATS Simulation Error:", error);
        throw new functions.https.HttpsError('internal', error.message || 'Simulation failed');
    }
});
//# sourceMappingURL=runAtsSimulation.js.map