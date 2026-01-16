import { useState, useMemo } from 'react';
import { useCollection } from '../../hooks/useCollection';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { where } from 'firebase/firestore';
import {
    Search,
    Filter,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    ArrowUp,
    ArrowDown
} from 'lucide-react';

export default function Roster() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<'name' | 'status' | 'pod'>('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const ITEMS_PER_PAGE = 15;

    // Fetch ONLY Active Engagements for this Rep (RBAC)
    const { data: engagements, loading, error } = useCollection<any>(
        'engagements',
        where('repId', '==', user?.uid)
    );

    if (error) console.error("Roster Query Error:", error);

    // Filter & Sort Logic
    const filteredClients = useMemo(() => {
        if (!engagements) return [];
        let result = engagements.filter(e => {
            const matchesSearch = (e.profile?.headline || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || e.status?.toLowerCase() === statusFilter.toLowerCase();
            return matchesSearch && matchesStatus;
        });

        result.sort((a, b) => {
            const valA = (a.profile?.[sortField] || '').toLowerCase();
            const valB = (b.profile?.[sortField] || '').toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [engagements, searchTerm, statusFilter, sortField, sortDir]);

    // Pagination
    const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
    const paginatedClients = filteredClients.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleSort = (field: 'name' | 'status' | 'pod') => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    if (loading) return <div className="p-8 text-slate-500 font-mono">Loading Roster...</div>;

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'active', label: 'Active' },
        { id: 'searching', label: 'Searching' },
        { id: 'negotiating', label: 'Negotiating' },
        { id: 'placed', label: 'Placed' },
        { id: 'paused', label: 'Paused' },
    ];

    return (
        <div className="space-y-4">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">Client Roster</h2>
                    <p className="text-slate-400 text-xs uppercase tracking-wider">
                        Total Assets: {filteredClients.length}
                    </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by Name or Headline..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-sm py-2 pl-9 pr-4 text-xs text-white focus:border-signal-orange focus:outline-none placeholder:text-slate-600"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 pb-2">
                {filters.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setStatusFilter(f.id)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${statusFilter === f.id
                                ? 'bg-oxford-green text-white border-oxford-green'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Data Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-sm overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900 border-b border-slate-700 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                            <th className="p-5 cursor-pointer hover:text-white group transition-colors" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-2">
                                    Client / Profile
                                    <SortIcon field="name" currentField={sortField} dir={sortDir} />
                                </div>
                            </th>
                            <th className="p-5 cursor-pointer hover:text-white group transition-colors" onClick={() => handleSort('pod')}>
                                <div className="flex items-center gap-2">
                                    Industry Pod
                                    <SortIcon field="pod" currentField={sortField} dir={sortDir} />
                                </div>
                            </th>
                            <th className="p-5 cursor-pointer hover:text-white group transition-colors" onClick={() => handleSort('status')}>
                                <div className="flex items-center gap-2">
                                    Status
                                    <SortIcon field="status" currentField={sortField} dir={sortDir} />
                                </div>
                            </th>
                            <th className="p-5">Last Activity</th>
                            <th className="p-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/40">
                        {paginatedClients.map((client: any) => (
                            <tr
                                key={client.id}
                                onClick={() => navigate(`/rep/client/${client.id}`)}
                                className="hover:bg-slate-700/40 transition-colors group cursor-pointer"
                            >
                                <td className="p-5">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar Placeholder */}
                                        <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs border border-slate-600">
                                            {client.profile?.headline?.substring(0, 2).toUpperCase() || 'CL'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm group-hover:text-signal-orange transition-colors">
                                                {client.profile?.headline || 'Unknown Client'}
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                Contract #{client.id.slice(-6)}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-300 font-medium">
                                        {client.profile?.pod || 'General'}
                                    </div>
                                </td>
                                <td className="p-5">
                                    <StatusBadge status={client.status} />
                                </td>
                                <td className="p-5">
                                    <span className="text-xs text-slate-400">2h ago</span>
                                </td>
                                <td className="p-5 text-right">
                                    <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-full transition-all">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paginatedClients.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500 text-xs italic">
                                    No clients found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer / Pagination */}
            <div className="flex justify-between items-center pt-2">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Showing {paginatedClients.length} of {filteredClients.length}
                </div>
                <div className="flex gap-1">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="p-1 rounded-sm border border-slate-700 bg-slate-800 text-slate-400 disabled:opacity-50 hover:text-white"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="p-1 rounded-sm border border-slate-700 bg-slate-800 text-slate-400 disabled:opacity-50 hover:text-white"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        searching: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        recruiting: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        placed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        alumni: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        prospect: 'bg-slate-700/30 text-slate-400 border-slate-600'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${styles[status] || styles.prospect}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-current opacity-50'}`}></span>
            {status}
        </span>
    );
}

function SortIcon({ field, currentField, dir }: { field: string, currentField: string, dir: 'asc' | 'desc' }) {
    if (field !== currentField) return <ArrowDown className="h-3 w-3 text-slate-700" />;
    return dir === 'asc'
        ? <ArrowUp className="h-3 w-3 text-signal-orange" />
        : <ArrowDown className="h-3 w-3 text-signal-orange" />;
}
