import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { Application } from '../../../types/schema';
import { Search, Eye, Archive, CheckCircle, Inbox } from 'lucide-react';
import { ApplicationDetailsModal } from '../../../components/applications/ApplicationDetailsModal';

const Applications = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'archived'>('all');

    useEffect(() => {
        // Real-time listener for applications
        const q = query(
            collection(db, 'applications'),
            orderBy('submittedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const apps = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Application[];
            setApplications(apps);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching applications:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleStatusUpdate = async (appId: string, newStatus: 'new' | 'contacted' | 'archived') => {
        try {
            await updateDoc(doc(db, 'applications', appId), {
                status: newStatus
            });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const filteredApps = applications.filter(app => {
        const matchesSearch =
            app.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    if (loading) {
        return <div className="p-8 text-slate-400 font-mono">Loading applications...</div>;
    }

    return (
        <div className="space-y-4 p-6">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-oxford-green mb-1 flex items-center gap-2">
                        <Inbox className="h-5 w-5 text-signal-orange" />
                        Website Applications
                    </h2>
                    <p className="text-slate-500 text-xs uppercase tracking-wider">
                        Total Candidates: {filteredApps.length}
                    </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-sm py-2 pl-9 pr-4 text-xs text-slate-700 focus:border-oxford-green focus:outline-none placeholder:text-slate-400"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 pb-2">
                {(['all', 'new', 'contacted', 'archived'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${statusFilter === status
                            ? 'bg-oxford-green text-white border-oxford-green'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Data Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                            <th className="p-5">Candidate</th>
                            <th className="p-5">Status</th>
                            <th className="p-5">Experience</th>
                            <th className="p-5">Motivation</th>
                            <th className="p-5">Submitted</th>
                            <th className="p-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredApps.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-500 text-xs italic">
                                    No applications found.
                                </td>
                            </tr>
                        ) : (
                            filteredApps.map((app) => (
                                <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-oxford-green font-bold text-xs border border-slate-200">
                                                {app.fullName?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-sm group-hover:text-oxford-green transition-colors">{app.fullName}</div>
                                                <div className="text-xs text-slate-500">{app.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${app.status === 'new' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            app.status === 'contacted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                'bg-slate-50 text-slate-500 border-slate-200'
                                            }`}>
                                            {app.status || 'NEW'}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="text-sm font-medium text-slate-700">{app.currentSalary || '-'}</div>
                                        <div className="text-xs text-slate-500">{app.experience}</div>
                                    </td>
                                    <td className="p-5">
                                        <div className="max-w-[200px] truncate text-sm text-slate-600" title={app.primaryMotivation}>
                                            {app.primaryMotivation || '-'}
                                        </div>
                                    </td>
                                    <td className="p-5 text-xs text-slate-500 font-mono">
                                        {formatDate(app.submittedAt)}
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setSelectedApp(app)}
                                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>

                                            {app.status === 'new' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(app.id, 'contacted'); }}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                                    title="Mark Contacted"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}

                                            {app.status !== 'archived' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(app.id, 'archived'); }}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                    title="Archive"
                                                >
                                                    <Archive size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedApp && (
                <ApplicationDetailsModal
                    application={selectedApp}
                    isOpen={!!selectedApp}
                    onClose={() => setSelectedApp(null)}
                />
            )}
        </div>
    );
};

export default Applications;
