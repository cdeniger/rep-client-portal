
import * as admin from 'firebase-admin';

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

    } catch (e: any) {
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
        } else {
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
        } else {
            console.log("✅ Firestore profile exists.");
        }
    }
}

restoreAlex().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
