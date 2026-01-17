import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { devLogin } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/');
        } catch (err: any) {
            console.error(err);
            // Auto-fallback for dev convenience if config is missing
            if (err.code === 'auth/configuration-not-found' || err.code === 'auth/invalid-api-key') {
                if (confirm('Firebase Auth Failed (Config Missing). Enter Dev Mode?')) {
                    devLogin();
                    navigate('/');
                    return;
                }
            }
            setError(err.message || 'Failed to sign in');
        }
    };

    const handleDevLogin = async (uid: string, email: string, role: 'client' | 'rep', name: string) => {
        try {
            const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('firebase/auth');
            try {
                // Try real auth first (best effort)
                await signInWithEmailAndPassword(auth, email, 'password123');
            } catch (e: any) {
                if (e.code === 'auth/user-not-found') {
                    await createUserWithEmailAndPassword(auth, email, 'password123');
                } else {
                    throw e; // Throw to trigger fallback
                }
            }
            if (role === 'rep') {
                navigate('/rep');
            } else {
                navigate('/');
            }
        } catch (e: any) {
            console.warn("Firebase Auth failed/missing, falling back to mock user.", e);
            devLogin(uid, email, role, name);
            if (role === 'rep') {
                navigate('/rep');
            } else {
                navigate('/');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bone px-4">
            <div className="max-w-md w-full bg-white p-8 border border-gray-200 shadow-sm rounded-sm">
                <h2 className="text-2xl font-bold text-oxford-green mb-6 text-center tracking-tight">Access Rep. Portal</h2>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 text-sm mb-4 rounded-sm border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:border-signal-orange transition-colors text-sm"
                            placeholder="client@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:border-signal-orange transition-colors text-sm"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-oxford-green text-white font-bold py-3 px-4 rounded-sm hover:bg-opacity-90 transition-opacity uppercase tracking-widest text-xs"
                    >
                        Sign In
                    </button>
                </form>

                {/* DEV ONLY BUTTONS */}
                <div className="mt-4 space-y-2">
                    <button
                        onClick={async () => {
                            // Client: Alex Mercer
                            await handleDevLogin('eng_user_alex_mercer', 'alex.mercer@example.com', 'client', 'Alex Mercer');
                            // Auto-seed disabled to persist edits
                            /* 
                            try {
                                const { seedClientData } = await import('../scripts/seed');
                                await seedClientData('client_alex');
                                console.log('Auto-seeded client data');
                            } catch (e) { console.error('Auto-seed failed', e) }
                            */
                        }}
                        className="w-full bg-gray-100 text-oxford-green font-bold py-2 px-4 rounded-sm uppercase tracking-widest text-[10px] hover:bg-gray-200 border border-gray-300"
                    >
                        [DEV] Login as Client (Alex Mercer)
                    </button>

                    <button
                        onClick={async () => {
                            // Rep: Jordan Wolf
                            await handleDevLogin('rep_jordan', 'jordan.rep@example.com', 'rep', 'Jordan Wolf');
                            // Auto-seed for convenience (DISABLED to prevent data overwrite)
                            /*
                            try {
                                const { seedRepData } = await import('../scripts/seed');
                                await seedRepData('rep_jordan');
                                console.log('Auto-seeded rep data');
                            } catch (e) { console.error('Auto-seed failed', e) }
                            */
                        }}
                        className="w-full bg-oxford-green/10 text-oxford-green font-bold py-2 px-4 rounded-sm uppercase tracking-widest text-[10px] hover:bg-oxford-green/20 border border-oxford-green/20"
                    >
                        [DEV] Login as Rep (Internal User)
                    </button>
                </div>

                <div className="mt-6 text-center text-xs text-gray-400">
                    <p>By invitation only.</p>
                </div>
            </div>
        </div >
    );
}
