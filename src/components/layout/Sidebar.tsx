import { LayoutDashboard, Target, Radio, DollarSign, FileText, LogOut, ShieldAlert } from 'lucide-react';
import Logo from '../ui/Logo';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { useDocument } from '../../hooks/useFirestore';
import type { UserProfile } from '../../types/schema';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Pipeline', href: '/pipeline', icon: Target },
    { name: 'Rep Radar', href: '/radar', icon: Radio },
    { name: 'Financials', href: '/financials', icon: DollarSign },
    { name: 'Diagnostic', href: '/diagnostic', icon: FileText },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: userProfile } = useDocument<UserProfile>('users', user?.uid || 'guest');

    const isRep = userProfile?.role === 'rep';

    const handleSignOut = async () => {
        await signOut(auth);
        navigate('/login');
    };

    return (
        <div className="flex w-64 flex-col bg-oxford-green text-bone min-h-screen border-r border-oxford-green/10">
            <div className="flex h-16 shrink-0 items-center px-6 border-b border-white/10 justify-between">
                <Logo subtitle="Portal" />
                {isRep && (
                    <span className="bg-signal-orange text-white text-[10px] uppercase font-bold px-2 py-1 rounded-sm flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Internal
                    </span>
                )}
            </div>

            <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4 mt-8">
                <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                        <li>
                            <ul role="list" className="-mx-2 space-y-1">
                                {navigation.map((item) => (
                                    <li key={item.name}>
                                        <NavLink
                                            to={item.href}
                                            className={({ isActive }) =>
                                                `group flex gap-x-3 rounded-sm p-2 text-sm leading-6 font-semibold tracking-wide transition-colors ${isActive
                                                    ? 'bg-signal-orange text-white'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`
                                            }
                                        >
                                            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                            {item.name}
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
