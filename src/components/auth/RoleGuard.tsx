import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import type { UserProfile } from '../../types/schema';

interface RoleGuardProps {
    allowedRoles: ('admin' | 'rep' | 'client')[];
    redirectPath?: string;
}

export default function RoleGuard({ allowedRoles, redirectPath = '/' }: RoleGuardProps) {
    const { user, loading: authLoading } = useAuth();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const location = useLocation();

    if (authLoading || profileLoading) {
        return <div className="flex justify-center items-center h-screen text-slate-400">Verifying Permissions...</div>;
    }

    if (!user || !userProfile) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const profile = userProfile as UserProfile;

    if (!allowedRoles.includes(profile.role)) {
        console.warn(`[RoleGuard] Access Denied: User ${profile.email} (Role: ${profile.role}) tried to access protected route (Allowed: ${allowedRoles.join(', ')}).`);
        console.log("Full Profile:", profile);
        return <Navigate to={redirectPath} replace />;
    }

    return <Outlet />;
}
