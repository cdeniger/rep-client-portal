import { useState, useEffect } from 'react';
import { where, QueryConstraint } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from './useUserProfile';
import type { UserProfile } from '../types/schema';

export const useRepScope = () => {
    const { user } = useAuth();
    const { userProfile, loading: profileLoading } = useUserProfile();

    // Default to blocking access until permissions are verified
    const [scope, setScope] = useState<QueryConstraint | null>(where('_id', '==', 'LOADING_BLOCK'));
    const [pod, setPod] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profileLoading) return;

        if (!user || !userProfile) {
            setLoading(false);
            return;
        }

        const profile = userProfile as UserProfile;

        // Admin: No Filter
        if (profile.role === 'admin') {
            setScope(null); // No filter = Access All
            setPod('Admin');
            setLoading(false);
            return;
        }

        // Rep: Filter by Pod ID (Stable)
        if (profile.role === 'rep') {
            const userPodId = profile.profile?.podId;
            if (userPodId) {
                // Returns where('profile.podId', '==', user.podId)
                setScope(where('profile.podId', '==', userPodId));
                setPod(profile.profile.pod || userPodId); // Fallback to ID if name missing
            } else {
                console.warn(`Rep ${user.uid} has no podId assigned. Defaulting to empty scope.`);
                setScope(where('profile.podId', '==', 'UNASSIGNED_VOID'));
            }
            setLoading(false);
            return;
        }

        // Client: Block
        // We use a query that is guaranteed to return nothing for safety
        setScope(where('profile.podId', '==', 'NO_ACCESS'));
        setLoading(false);

    }, [user, userProfile, profileLoading]);

    return { scope, pod, loading, userProfile };
};
