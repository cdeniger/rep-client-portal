import { useState } from 'react';
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    // Password Change State
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pendingUid, setPendingUid] = useState<string | null>(null);

    const navigate = useNavigate();
    const { devLogin } = useAuth();


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            try {
                // Check Role & Status
                let userData;

                // 1. Try Direct Lookup (Standard)
                let userDoc = await getDoc(doc(db, 'users', user.uid));

                if (userDoc.exists()) {
                    userData = userDoc.data();
                } else {
                    // 2. Fallback: Lookup by Email (For Legacy/Manual/Seeded Accounts)
                    // This handles cases where Auth UID != Firestore Doc ID (e.g. 'rep_jordan')
                    const q = query(collection(db, 'users'), where('email', '==', user.email));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        userData = querySnapshot.docs[0].data();
                        console.log('User found via email fallback:', userData);
                    }
                }

                if (userData) {
                    // 1. Check for Forced Password Change
                    if (userData.requiresPasswordChange) {
                        setPendingUid(user.uid);
                        setShowPasswordChange(true);
                        return; // Stop redirection
                    }

                    // 2. Normal Routing
                    if (userData.role === 'rep' || userData.role === 'admin') {
                        navigate('/rep');
                        return;
                    }
                }
            } catch (dbError) {
                console.error("Error reading user profile:", dbError);
            }
            // Default fallback
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

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        try {
            if (auth.currentUser) {
                await updatePassword(auth.currentUser, newPassword);

                // Clear the flag in Firestore
                if (pendingUid) {
                    await updateDoc(doc(db, 'users', pendingUid), {
                        requiresPasswordChange: false
                    });
                }

                alert("Password updated successfully!");
                setShowPasswordChange(false);

                // Re-fetch role to decide where to go (or just assume standard flow)
                // For simplicity, re-trigger minimal routing check or just go to root/rep
                const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
                const userData = userDoc.data();
                if (userData?.role === 'rep') {
                    navigate('/rep');
                } else {
                    navigate('/');
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to update password. Please try again.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bone px-4">
            <div className="max-w-md w-full bg-white p-8 border border-gray-200 shadow-sm rounded-sm relative">
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
                            placeholder="alex.mercer@example.com"
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

                {/* Password Change Modal */}
                <Modal isOpen={showPasswordChange} onClose={() => { }} title="Security Update Required">
                    <form onSubmit={handlePasswordChange} className="space-y-4 pt-2">
                        <p className="text-sm text-slate-600">
                            Please set a new permanent password for your account.
                        </p>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                required
                                minLength={6}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-signal-orange text-white font-bold py-2 px-4 rounded-sm uppercase tracking-widest text-xs hover:bg-opacity-90"
                        >
                            Update Password & Login
                        </button>
                    </form>
                </Modal>

                {/* DEV CREDENTIALS (TEAM ACCESS) */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
                        Development Access
                    </p>
                    <div className="space-y-2">
                        <div
                            onClick={() => {
                                setEmail('jordan.wolf@rep.com');
                                setPassword('password123');
                            }}
                            className="group flex items-center justify-between p-2 rounded-sm border border-transparent hover:border-slate-200 hover:bg-slate-50 cursor-pointer transition-all"
                        >
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-oxford-green">Rep: Jordan Wolf</span>
                                <span className="text-[10px] text-slate-400 font-mono">jordan.wolf@rep.com <span className="text-slate-300">|</span> password123</span>
                            </div>
                            <span className="text-[10px] text-signal-orange opacity-0 group-hover:opacity-100 font-bold uppercase tracking-wider">
                                Fill
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div
                                onClick={() => {
                                    setEmail('alex.mercer@example.com');
                                    setPassword('password123');
                                }}
                                className="group flex-1 flex items-center justify-between p-2 rounded-sm border border-transparent hover:border-slate-200 hover:bg-slate-50 cursor-pointer transition-all"
                            >
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-oxford-green">Client: Alex Mercer</span>
                                    <span className="text-[10px] text-slate-400 font-mono">alex.mercer@example.com <span className="text-slate-300">|</span> password123</span>
                                </div>
                                <span className="text-[10px] text-signal-orange opacity-0 group-hover:opacity-100 font-bold uppercase tracking-wider">
                                    Fill
                                </span>
                            </div>
                        </div>
                        <div
                            onClick={() => {
                                devLogin('rep_patrick', 'patrick@repteam.com', 'admin', 'Patrick Deniger');
                                navigate('/rep');
                            }}
                            className="group flex flex-1 items-center justify-between p-2 rounded-sm border border-transparent hover:border-violet-200 hover:bg-violet-50 cursor-pointer transition-all"
                        >
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-violet-700">Admin: Patrick Deniger (DEV LOGIN)</span>
                                <span className="text-[10px] text-slate-400 font-mono">patrick@repteam.com <span className="text-slate-300">|</span> (Bypasses Auth)</span>
                            </div>
                            <span className="text-[10px] text-violet-500 opacity-0 group-hover:opacity-100 font-bold uppercase tracking-wider">
                                Login
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center text-xs text-gray-400">
                    <p>By invitation only.</p>
                </div>
            </div>
        </div>
    );
}
