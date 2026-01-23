import { useState, useEffect } from 'react';
import { LayoutDashboard, Target, Radio, DollarSign, FileText, LogOut, ShieldAlert, Sparkles } from 'lucide-react';
import Logo from '../ui/Logo';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth, db } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useDocument } from '../../hooks/useFirestore';
import type { UserProfile } from '../../types/schema';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: "Job Rec's", href: '/recommendations', icon: Sparkles },
    { name: 'Pipeline', href: '/pipeline', icon: Target },
    { name: 'Rep Radar', href: '/radar', icon: Radio },
    { name: 'Financials', href: '/financials', icon: DollarSign },
    { name: 'Diagnostic', href: '/diagnostic', icon: FileText },
];

export default function Sidebar({ onItemClick }: { onItemClick?: () => void }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: userProfile } = useDocument<UserProfile>('users', user?.uid || 'guest');

    const isRep = userProfile?.role === 'rep';
    const [pendingCount, setPendingCount] = useState(0);

    // Listen for pending recommendations (Client only)
    useEffect(() => {
        if (!user || isRep) return;

        let unsubRecs = () => { };

        const setupListener = async () => {
            // 1. Get Engagement
            const engQuery = query(collection(db, 'engagements'), where('userId', '==', user.uid), where('status', '==', 'active'));
            const engSnap = await getDocs(engQuery);

            if (!engSnap.empty) {
                const engagementId = engSnap.docs[0].id;
                // 2. Listen to Recs
                const recQuery = query(
                    collection(db, 'job_recommendations'),
                    where('engagementId', '==', engagementId),
                    where('status', '==', 'pending_client')
                );

                unsubRecs = onSnapshot(recQuery, (snap) => {
                    setPendingCount(snap.size);
                });
            }
        };

        setupListener();

        return () => unsubRecs();
    }, [user, isRep]);

    const handleSignOut = async () => {
        await signOut(auth);
        navigate('/login');
    };

    return (
        <div className="flex w-64 flex-col bg-oxford-green text-bone h-full border-r border-oxford-green/10">
            <div className="flex h-16 shrink-0 items-center px-6 border-b border-white/10 justify-between">
                <Logo subtitle="Client Portal" />
                {isRep && (
                    <span className="bg-signal-orange text-white text-[10px] uppercase font-bold px-2 py-1 rounded-sm flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Internal
                    </span>
                )}
            </div>

            <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-24 md:pb-4 mt-8">
                <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                        <li>
                            <ul role="list" className="-mx-2 space-y-1">
                                {navigation.map((item) => (
                                    <li key={item.name}>
                                        <NavLink
                                            to={item.href}
                                            onClick={onItemClick} // Close mobile menu on click
                                            className={({ isActive }) =>
                                                `group flex gap-x-3 rounded-sm p-2 text-sm leading-6 font-semibold tracking-wide transition-colors ${isActive
                                                    ? 'bg-signal-orange text-white'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`
                                            }
                                        >
                                            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                            {item.name}
                                            {item.name === "Job Rec's" && pendingCount > 0 && (
                                                <span className="ml-auto bg-signal-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    {pendingCount}
                                                </span>
                                            )}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </li>

                        <li className="mt-auto">
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); handleSignOut(); }}
                                className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-white/5 hover:text-white"
                            >
                                <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                                Sign Out
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
}
