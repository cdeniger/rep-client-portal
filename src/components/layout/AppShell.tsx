import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Logo from '../ui/Logo';

export default function AppShell() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen bg-bone">

            {/* Mobile Header - Visible only on small screens */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-oxford-green flex items-center justify-between px-6 z-40 border-b border-white/10 shadow-sm">
                <Logo subtitle="Portal" />
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="text-white p-1 hover:bg-white/10 rounded"
                >
                    <Menu className="h-6 w-6" />
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Sidebar Container */}
                    <div className="relative flex w-64 flex-col h-full animate-in slide-in-from-left duration-200 shadow-xl">
                        <Sidebar onItemClick={() => setMobileMenuOpen(false)} />

                        {/* Close Button Overlay */}
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="absolute top-5 right-4 text-white hover:text-signal-orange transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar - Fixed */}
            <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
                <Sidebar />
            </div>

            {/* Main Content - Added responsive padding/margins */}
            <div className="flex flex-1 flex-col md:pl-64 h-full overflow-hidden pt-16 md:pt-0 transition-all">
                <main className="flex-1 overflow-y-auto py-6 px-4 md:py-8 md:px-12">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
