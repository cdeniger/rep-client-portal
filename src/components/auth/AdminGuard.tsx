import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// TODO: Move this to environment variable or Firestore config in production
const ALLOWED_ADMINS = [
    'alex.mercer@test.com',
    'clay.deniger@gmail.com', // Assuming this might be the dev
    'admin@rep.com',
    'admin@repteam.com'
];

export default function AdminGuard() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="p-10 text-center text-gray-500">Verifying Access...</div>;
    }

    if (!user || (!ALLOWED_ADMINS.includes(user.email || '') && !user.email?.endsWith('@rep.com'))) {
        console.warn(`Unauthorized Admin Access Attempt: ${user?.email}`);
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
