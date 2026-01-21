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
const admin = __importStar(require("firebase-admin"));
// Initialize Admin SDK (Auto-discovery in functions env)
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'rep-client-portal-firebase'
    });
}
const db = admin.firestore();
const auth = admin.auth();
async function restoreAlex() {
    console.log("🛠️ Restoring Alex Mercer...");
    const email = 'alex.mercer@example.com';
    const password = 'password123';
    let uid;
    // 1. Check Auth
    try {
        const user = await auth.getUserByEmail(email);
        console.log(`✅ Found existing Auth user: ${user.uid}`);
        uid = user.uid;
        // Reset Password
        await auth.updateUser(uid, {
            password: password,
            disabled: false
        });
        console.log("✅ Password reset to 'password123'.");
    }
    catch (e) {
        if (e.code === 'auth/user-not-found') {
            console.log("⚠️ User not found. Creating new...");
            const newUser = await auth.createUser({
                email,
                password,
                displayName: 'Alex Mercer',
                emailVerified: true
            });
            uid = newUser.uid;
            console.log(`✅ Created new Auth user: ${uid}`);
        }
        else {
            console.error("❌ Auth Error:", e);
            return;
        }
    }
    // 2. Ensure Firestore Profile
    if (uid) {
        const userRef = db.collection('users').doc(uid);
        const docSnap = await userRef.get();
        if (!docSnap.exists) {
            console.log("⚠️ Firestore profile missing. Re-creating...");
            await userRef.set({
                uid: uid,
                email: email,
                role: 'client',
                profile: {
                    name: 'Alex Mercer',
                    firstName: 'Alex',
                    lastName: 'Mercer',
                    status: 'searching',
                    pod: '04 (M. Ross)',
                    headline: 'Senior Product Manager',
                    bio_short: 'Product Leader'
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log("✅ Firestore profile restored.");
        }
        else {
            console.log("✅ Firestore profile exists.");
        }
    }
}
restoreAlex().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=restore_alex.js.map