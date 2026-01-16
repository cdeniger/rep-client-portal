import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppShell() {
    return (
        <div className="flex h-screen bg-bone">
            {/* Sidebar - Fixed */}
            <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col md:pl-64 h-full overflow-hidden">
                <main className="flex-1 overflow-y-auto py-8 px-8 md:px-12">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
