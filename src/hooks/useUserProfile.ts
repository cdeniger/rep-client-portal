
import { useState, useEffect } from 'react';
import { doc, onSnapshot, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import type { UserProfile } from '../types/schema';

export function useUserProfile() {
    const { user, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        let unsubscribe: () => void = () => { };

        const resolveUser = async () => {
            setLoading(true);
            try {
                // 1. Try Direct UID Match
                const uidRef = doc(db, 'users', user.uid);

                // We use onSnapshot for the primary attempt to be reactive immediately if it exists
                // But we need to know if it *doesn't* exist to fallback.
                // A cleaner way for the fallback logic is to check existence once, then subscribe.

                // Check existence of direct UID doc
                // We can't use getDoc here inside the effect easily without unsubscribing previous
                // Let's rely on a reactive approach:

                // Actually, let's just do a specialized lookup logic:
                // If the user doc exists at user.uid, use it.
                // If NOT, search by email, then use THAT id.

                // First: Check if doc exists at UID (one-time check to determine WHICH ID to listen to)
                // Note: This adds a small delay but handles the edge case robustly.

                // Attempt to read it? 
                // Or easier: Just listen to UID. If it's empty, try to find by email.

                unsubscribe = onSnapshot(uidRef, async (snapshot) => {
                    if (snapshot.exists()) {
                        // Happy Path: Auth UID matches Firestore ID
                        setProfile({ ...snapshot.data(), id: snapshot.id } as unknown as UserProfile);
                        setLoading(false);
                    } else {
                        // Fallback: Doc at UID doesn't exist. Search by Email.
                        // Only do this once per user session ideally, or just on this mount.
                        try {
                            const q = query(collection(db, 'users'), where('email', '==', user.email));
                            const querySnap = await getDocs(q);

                            if (!querySnap.empty) {
                                // Found via Email
                                const foundDoc = querySnap.docs[0];
                                setProfile({ ...foundDoc.data(), id: foundDoc.id } as unknown as UserProfile);
                                // Important: If we found it by email, we should ideally subscribe to THIS ID instead.
                                // But nesting listeners is messy.
                                // For now, setting the data is enough for the Guard to pass.
                                // To be truly reactive, we'd need to switch the subscription.
                            } else {
                                setProfile(null); // Truly not found
                            }
                        } catch (err) {
                            console.error("Email lookup failed", err);
                            setError("Failed to lookup user profile");
                        }
                        setLoading(false);
                    }
                }, (err) => {
                    console.error("Profile subscription error", err);
                    setError(err.message);
                    setLoading(false);
                });

            } catch (err: any) {
                setError(err.message);
                setLoading(false);
            }
        };

        resolveUser();

        return () => {
            unsubscribe();
        };
    }, [user, authLoading]);

    return { userProfile: profile, loading, error };
}
