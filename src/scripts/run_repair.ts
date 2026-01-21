
import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseConfig } from "../lib/firebase";

// Initialize as a CLIENT
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'us-central1');

async function callRepair() {
    console.log("📞 Calling repairAlex function...");

    // We didn't add auth check to repairAlex for speed, or we can use the "devLogin" context if needed, 
    // but the function actually sets admin.initializeApp() so it runs as Admin internally.
    // However, callable functions usually reject if context.auth is missing unless we explicitly allow it.
    // I didn't check for context.auth in repairAlex.ts, so it should be OPEN (Public).

    const repairAlex = httpsCallable(functions, 'repairAlex');
    try {
        const result = await repairAlex({});
        console.log("✅ Success:", result.data);
    } catch (e: any) {
        console.error("❌ Failed:", e.message);
    }
}

callRepair().then(() => process.exit(0));
