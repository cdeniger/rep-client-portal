export default function RepDashboard() {
    const { user } = useAuth();

    // 1. Fetch Active Engagements for this Rep
    const { data: engagements } = useCollection<any>(
        'engagements',
        where('repId', '==', user?.uid),
        where('status', '==', 'active')
    );

    // 2. Fetch Opportunities for this Rep (denormalized repId query for speed, or filter client-side)
    // NOTE: Ideally we query opportunities where 'repId' == user.uid, if we added that to schema.
    // Since we didn't explicitly add repId to Opps in the last schema update (only engagementId),
    // we might need to fetch all opps and filter, OR rely on a composite index if we add repId back.
    // Let's rely on fetching ALL opps for now (prototype scale) or just mock the aggregation to save reads.
    // Actually, let's just fetch opps linked to these engagements.
    // For MVP/Prototype: Fetching all opportunities is okay if < 1000 docs.
    const { data: opportunities } = useCollection<any>('opportunities');

    // 3. Calculate Metrics
    const activeClientCount = engagements?.length || 0;

    const pipelineValue = useMemo(() => {
        if (!opportunities || !engagements) return 0;

        // Map engagement ID to ISA %
        const isaMap = new Map();
        engagements.forEach(e => isaMap.set(e.id, e.isaPercentage || 0));

        return opportunities.reduce((total, opp) => {
            // Only count opps for active engagements
            if (isaMap.has(opp.engagementId)) {
                const base = opp.financials?.base || 0;
                const isa = isaMap.get(opp.engagementId);
                // Value = Base * ISA %
                return total + (base * isa);
            }
            return total;
        }, 0);
    }, [opportunities, engagements]);

    // Format Currency
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-slate-700 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-oxford-green mb-1">Command Center</h2>
                    <p className="text-slate-400 text-xs uppercase tracking-wider">Portfolio Overview | Q1 2026</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-signal-orange text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-opacity-90">
                        + Add Engagement
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard label="Active Engagements" value={activeClientCount.toString()} subtext="Career Search" />
                <MetricCard label="Pipeline Value" value={formatCurrency(pipelineValue)} subtext="Base * ISA %" />
                <MetricCard label="Proj. Commission" value={formatCurrency(pipelineValue * 0.4)} subtext="Est. 40% Realization" textColor="text-emerald-600" />
                <MetricCard label="Critical Actions" value="3" subtext="Requires Attention" textColor="text-red-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Triage Feed */}
                <div className="lg:col-span-2 bg-white rounded-sm border border-slate-200 p-4 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">
                        Triage Feed
                    </h3>
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-sm flex justify-between items-center group hover:border-slate-300 transition-colors cursor-pointer">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                        <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider">High Urgency</span>
                                    </div>
                                    <div className="text-sm font-bold text-slate-800">Offer Expiring: Alex Mercer @ Stripe</div>
                                </div>
                                <div className="text-slate-400 text-xs">Expires in 24h</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Wins */}
                <div className="bg-white rounded-sm border border-slate-200 p-4 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">
                        Recent Momentum
                    </h3>
                    <div className="space-y-4">
                        <div className="text-center py-8 text-slate-400 italic text-xs">
                            No recent wins recorded.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { where } from 'firebase/firestore';

// ... RepDashboard component ... 

function MetricCard({ label, value, subtext, textColor = 'text-oxford-green' }: { label: string, value: string, subtext: string, textColor?: string }) {
    return (
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</div>
            <div className={`text-2xl font-bold ${textColor} mb-1`}>{value}</div>
            <div className="text-[10px] text-slate-400">{subtext}</div>
        </div>
    );
}
