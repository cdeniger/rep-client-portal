import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDocument } from '../../hooks/useDocument';
import type { UserProfile } from '../../types/schema';

export default function AdminGuard() {
    const { user, loading: authLoading } = useAuth();
    const { document: userProfile, loading: profileLoading } = useDocument('users', user?.uid);

    if (authLoading || (user && profileLoading)) {
        return <div className="p-10 text-center text-gray-500">Verifying Admin Access...</div>;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    const profile = userProfile as UserProfile | null;

    if (!profile) {
        // If user exists but profile not yet loaded (race condition), wait.
        // If truly missing, useDocument should have returned null with loading=false from its own internal logic,
        // but let's be safe.
        return <div className="p-10 text-center text-gray-400">Loading Profile...</div>;
    }

    // Check for explicit 'admin' role in Firestore
    if (profile.role !== 'admin') {
        console.warn(`[AdminGuard] Unauthorized Admin Access Attempt: ${user.email} (Role: ${profile?.role})`);
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
