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
exports.repairAlex = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.repairAlex = functions.https.onCall(async (data, context) => {
    // Ensure Admin Init
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    const auth = admin.auth();
    const db = admin.firestore();
    const email = 'alex.mercer@example.com';
    const password = 'password123';
    try {
        console.log("Attempting repair for:", email);
        // 1. Try to find existing Auth user
        try {
            const user = await auth.getUserByEmail(email);
            console.log("Found existing auth user:", user.uid);
            await auth.updateUser(user.uid, {
                password: password,
                disabled: false
            });
            return { success: true, message: `Reset password for EXISTING user ${user.uid}` };
        }
        catch (e) {
            if (e.code !== 'auth/user-not-found')
                throw e;
            console.log("User not found in Auth. Proceeding to recreation...");
        }
        // 2. Not found in Auth? Find in Firestore to Keep UID Sync
        // Check both root-level profile (if flattened) or nested profile
        // Schema says: UserProfile -> profile.email
        let targetUid;
        // Strategy A: Check by profile.email
        const profileQuery = await db.collection('users')
            .where('profile.email', '==', email)
            .limit(1)
            .get();
        if (!profileQuery.empty) {
            targetUid = profileQuery.docs[0].id;
            console.log("Found matching Firestore doc:", targetUid);
        }
        else {
            // Strategy B: Check if 'email' is at root (legacy/dev data)
            const rootQuery = await db.collection('users')
                .where('email', '==', email)
                .limit(1)
                .get();
            if (!rootQuery.empty) {
                targetUid = rootQuery.docs[0].id;
                console.log("Found matching Firestore doc (root email):", targetUid);
            }
        }
        // 3. If still no UID, check if we provided one in seed (hardcoded assumption)
        // or generate new.
        if (!targetUid) {
            console.log("No Firestore doc found. Creating BRAND NEW user.");
            targetUid = 'user_' + Date.now();
        }
        // 4. Create Auth User
        console.log("Creating Auth user with UID:", targetUid);
        await auth.createUser({
            uid: targetUid,
            email: email,
            password: password,
            displayName: 'Alex Mercer',
            disabled: false,
            emailVerified: true
        });
        // 5. Ensure Firestore exists (Heal Data)
        await db.collection('users').doc(targetUid).set({
            uid: targetUid,
            email: email,
            role: 'client',
            requiresPasswordChange: false,
            profile: {
                firstName: 'Alex',
                lastName: 'Mercer',
                email: email,
                status: 'searching',
                pod: 'Engineering',
                headline: 'Senior Full Stack Engineer',
                bio_short: 'Product-minded engineer.',
                bio_long: 'Detailed background...',
                pitch: 'I build things.'
            }
        }, { merge: true });
        return { success: true, message: `RECREATED user ${email} with UID ${targetUid}` };
    }
    catch (e) {
        console.error("Repair failed:", e);
        throw new functions.https.HttpsError('internal', e.message);
    }
});
//# sourceMappingURL=repairAlex.js.map