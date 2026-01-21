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
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugAuth = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.debugAuth = functions.https.onCall(async (data, context) => {
    if (admin.apps.length === 0)
        admin.initializeApp();
    try {
        const user = await admin.auth().getUserByEmail('alex.mercer@example.com');
        return {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            disabled: user.disabled,
            metadata: user.metadata,
            providerData: user.providerData,
            tokensValidAfterTime: user.tokensValidAfterTime // Key for revocation
        };
    }
    catch (e) {
        return { error: e.message, code: e.code };
    }
});
//# sourceMappingURL=debugAuth.js.map