import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import {
    Frame,
    Users,
    List,
    DollarSign,
    FileText,
    LogOut,
    Hexagon,
    Contact,
    Building2,
    Activity,
    Kanban
} from 'lucide-react';
import Logo from '../components/ui/Logo';

export default function RepLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [pendingCount, setPendingCount] = useState(0);

    // Listen for global pending_rep recommendations
    useEffect(() => {
        const q = query(collection(db, 'job_recommendations'), where('status', '==', 'pending_rep'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPendingCount(snapshot.size);
        }, (error) => {
            console.error("Error listening to pending recs:", error);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flex h-screen bg-bone text-oxford-green font-mono text-sm antialiased selection:bg-signal-orange selection:text-white">
            {/* Sidebar - Dense & Dark (Oxford Green) */}
            <aside className="w-16 md:w-56 flex-shrink-0 bg-oxford-green border-r border-oxford-green/10 flex flex-col pt-4 pb-4">
                <div className="px-4 mb-8">
                    <Logo subtitle="Internal" collapsed={false} />
                </div>

                <nav className="flex-1 px-2 space-y-1">
                    <NavItem to="/rep" icon={Frame} label="Command Ctr" end />
                    <NavItem to="/rep/roster" icon={Users} label="Client Roster" />
                    <NavItem to="/rep/pending-recs" icon={Hexagon} label="Pending Recs" badge={pendingCount} />
                    <NavItem to="/rep/pipeline" icon={List} label="Job Targets" />
                    <NavItem to="/rep/deals" icon={DollarSign} label="Deal Desk" />
                    <NavItem to="/rep/invoices" icon={FileText} label="Invoices" />

                    <div className="pt-4 mt-4 border-t border-white/10">
                        <div className="px-3 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden md:block">
                            CRM Tools
                        </div>
                        <NavItem to="/rep/contacts" icon={Contact} label="Contacts" />
                        <NavItem to="/rep/companies" icon={Building2} label="Companies" />
                        <NavItem to="/rep/activities" icon={Activity} label="Activities" />
                        <NavItem to="/rep/sales-pipeline" icon={Kanban} label="Pipelines" />
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/10">
                        <div className="px-3 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden md:block">
                            Utilities
                        </div>
                        <NavItem to="/admin/activity-types" icon={List} label="Activity Config" />
                        <NavItem to="/admin/pipelines" icon={Kanban} label="Pipelines Config" />
                    </div>
                </nav>

                <div className="px-4 mt-auto">
                    <div className="py-4 border-t border-white/10 mb-2">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                                JW
                            </div>
                            <div className="hidden md:block">
                                <div className="text-white text-xs font-bold truncate">Jordan Wolf</div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Senior Agent</div>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-full"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden md:inline text-xs font-bold uppercase tracking-widest">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto bg-bone">
                <header className="h-12 border-b border-gray-200 flex items-center justify-between px-6 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs uppercase tracking-widest font-bold text-oxford-green">System Online</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-500 text-xs font-mono">
                        <span>Server: US-East-1</span>
                        <span>Latency: 24ms</span>
                    </div>
                </header>

                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

function NavItem({ to, icon: Icon, label, end = false, badge }: { to: string, icon: any, label: string, end?: boolean, badge?: number }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-sm transition-all relative ${isActive
                    ? 'bg-signal-orange text-white border-r-2 border-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
            }
        >
            <Icon className="h-4 w-4" />
            <span className="hidden md:block text-xs font-bold uppercase tracking-widest flex-1">{label}</span>
            {badge !== undefined && badge > 0 && (
                <span className={`hidden md:flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                    // If active (Orange BG), make badge White with Orange Text. Else Orange with White Text.
                    // But we can't easily read 'isActive' here without moving this logic inside the render prop or using specific classes.
                    // simpler: Just use a contrasting color. If active is Orange, White badge looks good.
                    // If inactive (Dark Green), Orange badge looks good.
                    // We can rely on CSS cascade or just pick a color that works on both or use NavLink render prop properly?
                    // Let's use NavLink render prop for clean class logic? No, className string is easier.
                    // Let's assume Orange Badge on Dark, and White Badge on Orange?
                    // Actually, let's just use White text on Red/Orange background.
                    // If row is active (Orange), Red badge might clash.
                    // Let's try: Inactive -> Orange Badge. Active -> White Badge (Text Orange).
                    // I will stick to a fixed Orange Badge for now to match client portal, unless it looks bad.
                    'bg-signal-orange text-white ring-1 ring-oxford-green' // Ring helps separation
                    }`}>
                    {badge}
                </span>
            )}
        </NavLink>
    );
}
