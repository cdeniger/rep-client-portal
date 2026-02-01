import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useDocument } from '../hooks/useDocument';
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
    Kanban,
    Menu,
    X,
    Inbox
} from 'lucide-react';
import Logo from '../components/ui/Logo';

export default function RepLayout() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const { document: userProfile } = useDocument('users', user?.uid);
    const isAdmin = userProfile?.role === 'admin';
    const [pendingCount, setPendingCount] = useState(0);
    const [applicationCount, setApplicationCount] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    // Listen for new applications
    useEffect(() => {
        const q = query(collection(db, 'applications'), where('status', '==', 'new'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setApplicationCount(snapshot.size);
        }, (error) => {
            console.error("Error listening to new applications:", error);
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

    const RepSidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
        <div className="flex flex-col h-full">
            <div className="px-4 mb-8 pt-4">
                <Logo subtitle="Internal" collapsed={false} />
            </div>

            <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
                <NavItem to="/rep" icon={Frame} label="Command Ctr" end onClick={onItemClick} />
                <NavItem to="/rep/roster" icon={Users} label="Client Roster" onClick={onItemClick} />
                <NavItem to="/rep/pending-recs" icon={Hexagon} label="Pending Recs" badge={pendingCount} onClick={onItemClick} />
                <NavItem to="/rep/pipeline" icon={List} label="Job Targets" onClick={onItemClick} />
                <NavItem to="/rep/deals" icon={DollarSign} label="Deal Desk" onClick={onItemClick} />
                <NavItem to="/rep/invoices" icon={FileText} label="Invoices" onClick={onItemClick} />

                <div className="pt-4 mt-4 border-t border-white/10">
                    <div className="px-3 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                        CRM Tools
                    </div>
                    <NavItem to="/rep/contacts" icon={Contact} label="Contacts" onClick={onItemClick} />
                    <NavItem to="/rep/companies" icon={Building2} label="Companies" onClick={onItemClick} />
                    <NavItem to="/rep/activities" icon={Activity} label="Activities" onClick={onItemClick} />
                    <NavItem to="/rep/sales-pipeline" icon={Kanban} label="Pipelines" onClick={onItemClick} />
                </div>

                <div className="pt-4 mt-4 border-t border-white/10">
                    <div className="px-3 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                        Origination
                    </div>
                    <NavItem to="/rep/applications" icon={Inbox} label="Applications" badge={applicationCount} onClick={onItemClick} />
                </div>

                {isAdmin && (
                    <div className="pt-4 mt-4 border-t border-white/10">
                        <div className="px-3 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                            Utilities
                        </div>
                        <NavItem to="/admin/activity-types" icon={List} label="Activity Config" onClick={onItemClick} />
                        <NavItem to="/admin/pipelines" icon={Kanban} label="Pipelines Config" onClick={onItemClick} />
                        <NavItem to="/admin/pods" icon={Users} label="Pod & Team Settings" onClick={onItemClick} />
                    </div>
                )}
            </nav>

            <div className="px-4 mt-auto">
                <div className="py-4 border-t border-white/10 mb-2">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                            JW
                        </div>
                        <div className="block">
                            <div className="text-white text-xs font-bold truncate">Jordan Wolf</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Senior Agent</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-full"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="block text-xs font-bold uppercase tracking-widest">Sign Out</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-bone text-oxford-green font-mono text-sm antialiased selection:bg-signal-orange selection:text-white">

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-oxford-green flex items-center justify-between px-4 z-40 border-b border-white/10 shadow-sm">
                <Logo subtitle="Internal" />
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="text-white p-2 hover:bg-white/10 rounded"
                >
                    <Menu className="h-6 w-6" />
                </button>
            </header>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Sidebar Container */}
                    <div className="relative flex w-64 flex-col h-full bg-oxford-green animate-in slide-in-from-left duration-200 shadow-xl border-r border-white/10">
                        <div className="relative h-full">
                            <RepSidebarContent onItemClick={() => setMobileMenuOpen(false)} />
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="absolute top-4 right-4 text-white hover:text-signal-orange transition-colors bg-black/20 p-1 rounded-full"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar - Fixed */}
            <aside className="hidden md:flex w-56 flex-shrink-0 bg-oxford-green border-r border-oxford-green/10 flex-col">
                <RepSidebarContent />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col bg-bone overflow-hidden pt-16 md:pt-0">
                <header className="hidden md:flex h-12 border-b border-gray-200 items-center justify-between px-6 bg-white/50 backdrop-blur-sm shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs uppercase tracking-widest font-bold text-oxford-green">System Online</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-500 text-xs font-mono">
                        <span>Server: US-East-1</span>
                        <span>Latency: 24ms</span>
                    </div>
                </header>

                <div className="flex-1 flex flex-col overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

function NavItem({ to, icon: Icon, label, end = false, badge, onClick }: { to: string, icon: any, label: string, end?: boolean, badge?: number, onClick?: () => void }) {
    return (
        <NavLink
            to={to}
            end={end}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-sm transition-all relative ${isActive
                    ? 'bg-signal-orange text-white border-r-2 border-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
            }
        >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="block text-xs font-bold uppercase tracking-widest flex-1">{label}</span>
            {badge !== undefined && badge > 0 && (
                <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold ${'bg-signal-orange text-white ring-1 ring-oxford-green'
                    }`}>
                    {badge}
                </span>
            )}
        </NavLink>
    );
}
