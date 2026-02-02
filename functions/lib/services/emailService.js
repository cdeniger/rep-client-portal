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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const resend_1 = require("resend");
const functions = __importStar(require("firebase-functions"));
// Initialize Resend with API Key from Firebase Config
// Config commands: firebase functions:config:set resend.api_key="re_123..."
const resend = new resend_1.Resend(((_a = functions.config().resend) === null || _a === void 0 ? void 0 : _a.api_key) || process.env.RESEND_API_KEY);
const sendEmail = async (options) => {
    var _a;
    try {
        // Validation: Verify API Key exists
        if (!((_a = functions.config().resend) === null || _a === void 0 ? void 0 : _a.api_key) && !process.env.RESEND_API_KEY) {
            console.error("Resend API Key is missing. Email will not be sent.");
            return false;
        }
        const { data, error } = await resend.emails.send({
            from: options.from || 'Rep Client Portal <hello@repteam.com>',
            to: [options.to],
            replyTo: options.replyTo,
            subject: options.subject,
            html: options.html,
        });
        if (error) {
            console.error("Error sending email via Resend:", error);
            return false;
        }
        console.log("Email sent successfully:", data === null || data === void 0 ? void 0 : data.id);
        return true;
    }
    catch (error) {
        console.error("Exception in emailService:", error);
        return false;
    }
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=emailService.js.map