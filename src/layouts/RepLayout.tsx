import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Frame,
    Users,
    List,
    DollarSign,
    FileText,
    LogOut,
    Hexagon
} from 'lucide-react';

export default function RepLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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
                <div className="flex items-center gap-3 px-4 mb-8">
                    <div className="h-8 w-8 bg-signal-orange rounded-sm flex items-center justify-center flex-shrink-0">
                        <Hexagon className="h-5 w-5 text-white" fill="currentColor" />
                    </div>
                    <div className="hidden md:block">
                        <h1 className="font-bold text-xs uppercase tracking-widest text-white leading-tight">Rep.</h1>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Internal</span>
                    </div>
                </div>

                <nav className="flex-1 px-2 space-y-1">
                    <NavItem to="/rep" icon={Frame} label="Command Ctr" end />
                    <NavItem to="/rep/roster" icon={Users} label="Roster" />
                    <NavItem to="/rep/pipeline" icon={List} label="Global Pipe" />
                    <NavItem to="/rep/deals" icon={DollarSign} label="Deal Desk" />
                    <NavItem to="/rep/invoices" icon={FileText} label="Invoices" />
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

function NavItem({ to, icon: Icon, label, end = false }: { to: string, icon: any, label: string, end?: boolean }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2 rounded-sm transition-all
        ${isActive
                    ? 'bg-signal-orange text-white border-r-2 border-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'}
      `}
        >
            <Icon className="h-4 w-4" />
            <span className="hidden md:block text-xs font-bold uppercase tracking-widest">{label}</span>
        </NavLink>
    );
}
