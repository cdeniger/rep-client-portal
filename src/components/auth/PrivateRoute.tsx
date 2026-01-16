import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PrivateRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bone">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-4 bg-signal-orange rounded-full mb-2"></div>
                    <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Loading Rep...</span>
                </div>
            </div>
        );
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
}
