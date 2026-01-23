
import * as dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const EMAIL = 'jordan.wolf@rep.com';
const PASSWORD = 'password123';

async function resetJordanAuth() {
    console.log(`Attempting to sign in or create ${EMAIL}...`);

    try {
        await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
        console.log('✅ Successfully signed in as Jordan. Account exists and password is correct.');
    } catch (error: any) {
        console.log(`Login failed: ${error.code}. Attempting recovery...`);

        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            console.log('User not found. Creating new Auth user...');
            try {
                const cred = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD);
                console.log(`✅ Created new Auth user with UID: ${cred.user.uid}`);
            } catch (createError: any) {
                console.error('Failed to create user:', createError.message);
            }
        } else if (error.code === 'auth/wrong-password') {
            console.log('Wrong password. NOTE: Cannot reset password from client SDK without current password. You may need to delete the user in Firebase Console.');
        } else {
            console.error('Unexpected error:', error);
        }
    }
}

resetJordanAuth().then(() => process.exit(0));
