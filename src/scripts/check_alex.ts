
import * as admin from 'firebase-admin';

const serviceAccount = require('../../service-account.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

async function checkAlex() {
    console.log("🔍 Checking Alex Mercer...");

    // 1. Check Auth
    let authUser;
    try {
        authUser = await admin.auth().getUserByEmail('alex.mercer@example.com');
        console.log(`✅ Auth User Found: ${authUser.uid}`);
        console.log(`   - Disabled: ${authUser.disabled}`);
    } catch (e: any) {
        console.log(`❌ Auth User Missing: ${e.code}`);
    }

    // 2. Check Firestore
    if (authUser) {
        const db = admin.firestore();
        const doc = await db.collection('users').doc(authUser.uid).get();
        if (doc.exists) {
            console.log(`✅ Firestore Profile Found: ${doc.data()?.role}`);
        } else {
            console.log(`❌ Firestore Profile Missing!`);
        }
    }
}

checkAlex().then(() => process.exit(0));
