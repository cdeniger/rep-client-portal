import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';


interface AuthContextType {
    user: FirebaseUser | null;
    loading: boolean;
    devLogin: (uid?: string, email?: string, role?: 'client' | 'rep' | 'admin', name?: string) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, devLogin: () => { }, logout: async () => { } });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Safety check if auth failed to initialize in lib/firebase.ts
        if (!auth) {
            console.error("Firebase Auth not initialized. App may malfunction.");
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else if (!user) {
                // Only explicitly set to null if we don't have a user (preserves mock user if set)
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const devLogin = (
        userId = 'dev_user_mock',
        userEmail = 'dev@example.com',
        userRole: 'client' | 'rep' | 'admin' = 'client',
        displayName = 'Dev User'
    ) => {
        console.log(`Activating Dev Mode Bypass for ${userId} (${userRole})...`);
        const mockUser = {
            uid: userId,
            email: userEmail,
            displayName: displayName,
            emailVerified: true,
            isAnonymous: false,
            metadata: {},
            providerData: [],
            refreshToken: '',
            tenantId: null,
            delete: async () => { },
            getIdToken: async () => 'mock_token',
            getIdTokenResult: async () => ({
                token: 'mock',
                claims: { role: userRole }, // Mock custom claim
                authTime: '',
                domStr: '',
                expirationTime: '',
                issuedAtTime: '',
                signInProvider: '',
                signInSecondFactor: '',
                loading: false
            }),
            reload: async () => { },
            toJSON: () => ({}),
            phoneNumber: null,
            photoURL: null,
            providerId: 'firebase',
        } as unknown as FirebaseUser;

        // HACK: Store role in a way the app can verify if it checks object properties (rare) or context
        // Ideally we'd wrap this user object, but for now we rely on the component using the UID to fetch the Firestore doc which HAS the role.
        setUser(mockUser);
        setLoading(false);
    };

    const logout = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error("Logout failed", error);
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, devLogin, logout }}>
            {/* 
              Safe Render: If loading is stuck (e.g. auth check never returns), 
              we might want to render children anyway after a timeout, or a spinner.
              For now, we'll trust loading=false is set by the useEffect above.
             */}
            {!loading && children}
        </AuthContext.Provider>
    );
};
