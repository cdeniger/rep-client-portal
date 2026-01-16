import { useParams, useNavigate } from 'react-router-dom';
import { useDocument } from '../../hooks/useDocument';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, Edit, Calendar, DollarSign, Briefcase } from 'lucide-react';

export default function ClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // We expect 'id' to be the Engagement ID (eng_...)
    const { document: engagement, loading, error } = useDocument('engagements', id);

    if (loading) return <div className="p-8 text-slate-500 font-mono">Loading Engagement...</div>;
    if (error || !engagement) return <div className="p-8 text-red-400 font-mono">Engagement not found.</div>;

    // RBAC check
    if (engagement.repId !== user?.uid) {
        return <div className="p-8 text-red-500 font-bold">Unauthorized Access</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-700 pb-4">
                <button
                    onClick={() => navigate('/rep/roster')}
                    className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-oxford-green mb-1">{engagement.profile?.headline || 'Client Detail'}</h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
                        <span className="font-mono">ID: {engagement.id}</span>
                        <span>•</span>
                        <span>{engagement.profile?.pod || 'Unassigned'}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full ${engagement.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {engagement.status}
                        </span>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors">
                    <Edit className="h-4 w-4" />
                    <span>Edit Profile</span>
                </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main: Metrics & Notes */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                        <MetricTile label="ISA Rate" value={`${(engagement.isaPercentage * 100).toFixed(0)}%`} icon={<DollarSign className="h-4 w-4" />} />
                        <MetricTile label="Start Date" value={new Date(engagement.startDate).toLocaleDateString()} icon={<Calendar className="h-4 w-4" />} />
                        <MetricTile label="Pipeline" value="3 Active" icon={<Briefcase className="h-4 w-4" />} />
                    </div>

                    {/* Internal Notes Stub */}
                    <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm min-h-[300px]">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">
                            Internal Notes
                        </h3>
                        <textarea
                            placeholder="Add internal notes about this client strategy..."
                            className="w-full h-full min-h-[200px] bg-transparent border-0 focus:ring-0 text-sm text-slate-700 placeholder:text-slate-400 resize-none"
                        />
                    </div>
                </div>

                {/* Sidebar: Activity */}
                <div className="bg-slate-50 border border-slate-200 rounded-sm p-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                        Recent Activity
                    </h3>
                    <div className="text-xs text-slate-400 italic text-center py-8">
                        No recent activity.
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricTile({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex items-center justify-between">
            <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{label}</div>
                <div className="text-lg font-bold text-oxford-green">{value}</div>
            </div>
            <div className="text-slate-300 p-2 bg-slate-50 rounded-full">
                {icon}
            </div>
        </div>
    );
}
