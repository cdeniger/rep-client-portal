import { useState, useMemo } from 'react';
import { useCollection } from '../../hooks/useCollection';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { where } from 'firebase/firestore';
import {
    Search,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    UserPlus
} from 'lucide-react';
import CreateClientModal from '../../components/clients/CreateClientModal';

export default function Roster() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<'name' | 'status' | 'pod'>('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const ITEMS_PER_PAGE = 15;

    // Fetch ONLY Active Engagements for this Rep (RBAC) - Including legacy ID for continuity
    const { data: engagements, loading, error } = useCollection<any>(
        'engagements',
        where('repId', 'in', [user?.uid, 'rep_jordan'])
    );

    if (error) console.error("Roster Query Error:", error);

    // Filter & Sort Logic
    const filteredClients = useMemo(() => {
        if (!engagements) return [];
        let result = engagements.filter(e => {
            const term = searchTerm.toLowerCase();
            const firstName = (e.profile?.firstName || '').toLowerCase();
            const lastName = (e.profile?.lastName || '').toLowerCase();
            const fullName = `${firstName} ${lastName}`;
            const headline = (e.profile?.headline || '').toLowerCase();

            const matchesSearch =
                firstName.includes(term) ||
                lastName.includes(term) ||
                fullName.includes(term) ||
                headline.includes(term);

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-oxford-green mb-1">Client Roster</h2>
                    <p className="text-slate-500 text-xs uppercase tracking-wider">
                        Total Assets: {filteredClients.length}
                    </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Name or Headline..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-sm py-2 pl-9 pr-4 text-xs text-slate-700 focus:border-oxford-green focus:outline-none placeholder:text-slate-400"
                        />
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-oxford-green text-white px-4 py-2 rounded-sm text-xs font-bold hover:bg-opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
                    >
                        <UserPlus className="h-4 w-4" />
                        Add Client
                    </button>
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
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Data Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                            <th className="p-5 cursor-pointer hover:text-slate-700 group transition-colors" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-2">
                                    Client / Profile
                                    <SortIcon field="name" currentField={sortField} dir={sortDir} />
                                </div>
                            </th>
                            <th className="p-5 cursor-pointer hover:text-slate-700 group transition-colors" onClick={() => handleSort('pod')}>
                                <div className="flex items-center gap-2">
                                    Industry Pod
                                    <SortIcon field="pod" currentField={sortField} dir={sortDir} />
                                </div>
                            </th>
                            <th className="p-5 cursor-pointer hover:text-slate-700 group transition-colors" onClick={() => handleSort('status')}>
                                <div className="flex items-center gap-2">
                                    Status
                                    <SortIcon field="status" currentField={sortField} dir={sortDir} />
                                </div>
                            </th>
                            <th className="p-5">Last Activity</th>
                            <th className="p-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedClients.map((client: any) => (
                            <tr
                                key={client.id}
                                onClick={() => navigate(`/rep/client/${client.id}`)}
                                className="hover:bg-slate-50 transition-colors group cursor-pointer"
                            >
                                <td className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-oxford-green font-bold text-xs border border-slate-200">
                                            {client.profile?.firstName
                                                ? (client.profile.firstName[0] + (client.profile.lastName?.[0] || '')).toUpperCase()
                                                : (client.profile?.headline?.substring(0, 2).toUpperCase() || 'CL')
                                            }
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm group-hover:text-oxford-green transition-colors">
                                                {client.profile?.firstName
                                                    ? `${client.profile.firstName} ${client.profile.lastName}`
                                                    : (client.profile?.headline || 'Unknown Client')
                                                }
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                {client.profile?.firstName
                                                    ? client.profile.headline
                                                    : `Contract #${client.id.slice(-6)}`
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
                                        {client.profile?.pod || 'General'}
                                    </div>
                                </td>
                                <td className="p-5">
                                    <StatusBadge status={client.status} />
                                </td>
                                <td className="p-5">
                                    <span className="text-xs text-slate-500">
                                        {client.lastActivity ? (() => {
                                            const date = new Date(client.lastActivity);
                                            const now = new Date();
                                            const diffMs = now.getTime() - date.getTime();
                                            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                                            if (diffHrs < 1) return 'Just now';
                                            if (diffHrs < 24) return `${diffHrs}h ago`;
                                            const diffDays = Math.floor(diffHrs / 24);
                                            return `${diffDays}d ago`;
                                        })() : 'N/A'}
                                    </span>
                                </td>
                                <td className="p-5 text-right">
                                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
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
                        className="p-1 rounded-sm border border-slate-200 bg-white text-slate-400 disabled:opacity-50 hover:text-oxford-green"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="p-1 rounded-sm border border-slate-200 bg-white text-slate-400 disabled:opacity-50 hover:text-oxford-green"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
            <CreateClientModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    // Refresh data or show toast (optional, useCollection updates automatically if realtime)
                }}
            />
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        searching: 'bg-blue-50 text-blue-700 border-blue-200',
        recruiting: 'bg-purple-50 text-purple-700 border-purple-200',
        placed: 'bg-slate-100 text-slate-600 border-slate-200',
        alumni: 'bg-slate-100 text-slate-600 border-slate-200',
        paused: 'bg-amber-50 text-amber-700 border-amber-200',
        prospect: 'bg-slate-50 text-slate-500 border-slate-200'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${styles[status] || styles.prospect}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-current opacity-50'}`}></span>
            {status}
        </span>
    );
}

function SortIcon({ field, currentField, dir }: { field: string, currentField: string, dir: 'asc' | 'desc' }) {
    if (field !== currentField) return <ArrowDown className="h-3 w-3 text-slate-400" />;
    return dir === 'asc'
        ? <ArrowUp className="h-3 w-3 text-signal-orange" />
        : <ArrowDown className="h-3 w-3 text-signal-orange" />;
}
