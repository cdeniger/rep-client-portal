import { useNavigate } from 'react-router-dom';


interface MasterPipelineTableProps {
    engagements: any[];
    pursuits: any[];
}

export default function MasterPipelineTable({ engagements, pursuits }: MasterPipelineTableProps) {
    const navigate = useNavigate();

    // Helper to get client info
    const getClient = (engagementId: string) => {
        return engagements.find(e => e.id === engagementId) || {};
    };

    // Filter active and sort by value
    const activePursuits = pursuits
        .filter(p => !['placed', 'lost', 'passed', 'rejected'].includes(p.stageId))
        .sort((a, b) => (b.financials?.rep_net_value || 0) - (a.financials?.rep_net_value || 0))
        .slice(0, 7); // Top 7

    const formatCurrency = (val: number) => {
        if (!val) return '-';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
            notation: 'compact',
            compactDisplay: 'short'
        }).format(val);
    };

    const getStageBadge = (stageId: string) => {
        switch (stageId) {
            case 'offer_pending': return 'bg-yellow-100 text-yellow-800';
            case 'interview_loop': return 'bg-orange-100 text-orange-800';
            case 'engagement': return 'bg-purple-100 text-purple-800';
            case 'outreach_execution': return 'bg-blue-100 text-blue-800';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const getStageLabel = (stageId: string) => {
        return stageId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // Simple probability mapping based on stage
    const getProbability = (stageId: string) => {
        switch (stageId) {
            case 'offer_pending': return '90%';
            case 'interview_loop': return '60%';
            case 'engagement': return '30%';
            case 'outreach_execution': return '10%';
            default: return '5%';
        }
    };

    return (
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Active Job Pursuits</h3>
                <button
                    onClick={() => navigate('/rep/pipeline')}
                    className="text-[10px] uppercase font-bold text-signal-orange hover:text-orange-600"
                >
                    View All
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opportunity</th>
                            <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client</th>
                            <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stage</th>
                            <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Value</th>
                            <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Prob.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {activePursuits.map(pursuit => {
                            const client = getClient(pursuit.engagementId);
                            return (
                                <tr
                                    key={pursuit.id}
                                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                    onClick={() => navigate(`/rep/client/${client.id}`)}
                                >
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-700">{pursuit.company}</div>
                                        <div className="text-xs text-slate-400">{pursuit.role}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-oxford-green text-white flex items-center justify-center text-[10px] font-bold">
                                                {client.profile?.firstName?.[0] || '?'}
                                            </div>
                                            <div className="text-xs font-medium text-slate-600">
                                                {client.profile?.firstName}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStageBadge(pursuit.stageId)}`}>
                                            {getStageLabel(pursuit.stageId)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="font-mono text-xs text-slate-600">
                                            {formatCurrency(pursuit.financials?.rep_net_value)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="font-mono text-xs text-slate-500">
                                            {getProbability(pursuit.stageId)}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {activePursuits.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs italic">
                                    No active pursuits found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
