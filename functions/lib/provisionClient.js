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
exports.provisionClient = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.provisionClient = functions.https.onCall(async (data, context) => {
    // 0. Ensure Admin Initialization (Race Condition Fix)
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    const db = admin.firestore();
    // 1. Security & Validation
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { firstName, lastName, email, phone, address, pod, monthlyRetainer, isaPercentage, startDate } = data;
    if (!email || !firstName || !lastName || !pod || !startDate) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
    }
    try {
        // 2. Generate Temp Credentials
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        // 3. Create Auth User
        const userRecord = await admin.auth().createUser({
            email: email,
            password: tempPassword,
            displayName: `${firstName} ${lastName}`,
            disabled: false
        });
        const userId = userRecord.uid;
        const repId = context.auth.uid; // The caller is the Rep/Advisor
        // IDs for new documents
        const contactId = db.collection('contacts').doc().id;
        const engagementId = db.collection('engagements').doc().id;
        // 4. Prepare Batch Write
        const batch = db.batch();
        // A. Create User Profile
        const userRef = db.collection('users').doc(userId);
        batch.set(userRef, {
            uid: userId,
            email: email,
            role: 'client',
            requiresPasswordChange: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            profile: {
                firstName,
                lastName,
                name: `${firstName} ${lastName}`,
                status: 'searching',
                pod,
                headline: `Client in ${pod}`,
                bio_long: '',
                bio_short: '',
                pitch: '',
                repId: repId,
                contactId: contactId
            }
        });
        // B. Create Contact Record (Golden Source)
        const contactRef = db.collection('contacts').doc(contactId);
        batch.set(contactRef, {
            id: contactId,
            firstName,
            lastName,
            email,
            phone: phone || null,
            address: address || null,
            type: 'client',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            engagementId: engagementId // Back-link for convenience
        });
        // C. Create Engagement Record
        const engagementRef = db.collection('engagements').doc(engagementId);
        batch.set(engagementRef, {
            id: engagementId,
            userId: userId,
            repId: repId,
            status: 'active',
            startDate: startDate,
            monthlyRetainer: Number(monthlyRetainer) || 0,
            isaPercentage: Number(isaPercentage) || 0,
            profile: {
                firstName,
                lastName,
                headline: `Client in ${pod}`,
                pod,
                contactId: contactId
            },
            strategy: {},
            targetParameters: {},
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // 5. Commit Batch
        await batch.commit();
        console.log(`Successfully provisioned client: ${email} -> ${userId}`);
        // 6. Return Credentials to Rep
        return {
            success: true,
            clientId: engagementId,
            userId: userId,
            tempPassword: tempPassword
        };
    }
    catch (error) {
        console.error("Error provisioning client:", error);
        // Clean up Auth user if Firestore fails? 
        // For MVP, we'll just throw. Manual cleanup might be needed in edge cases.
        throw new functions.https.HttpsError('internal', error.message || 'Failed to provision client.');
    }
});
//# sourceMappingURL=provisionClient.js.map