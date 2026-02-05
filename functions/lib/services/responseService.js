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
exports.sendResponseEmail = void 0;
const resend_1 = require("resend");
const functions = __importStar(require("firebase-functions/v1"));
// Initialize Resend
const resend = new resend_1.Resend(process.env.RESEND_API_KEY || ((_a = functions.config().resend) === null || _a === void 0 ? void 0 : _a.api_key));
const sendResponseEmail = async (options) => {
    try {
        const { to, subject, htmlBody, replyToName, replyToEmail } = options;
        const { data, error } = await resend.emails.send({
            from: `"${replyToName}" <hello@repteam.com>`, // Authorized domain sender
            to: [to],
            replyTo: replyToEmail, // Direct reply goes to the Rep
            bcc: [replyToEmail], // Advisor gets a copy for their records
            subject: subject,
            html: htmlBody,
        });
        if (error) {
            console.error("Error sending response email:", error);
            return { success: false, error };
        }
        console.log("Response email sent successfully:", data === null || data === void 0 ? void 0 : data.id);
        return { success: true, id: data === null || data === void 0 ? void 0 : data.id };
    }
    catch (err) {
        console.error("Exception in sendResponseEmail:", err);
        return { success: false, error: err };
    }
};
exports.sendResponseEmail = sendResponseEmail;
//# sourceMappingURL=responseService.js.map