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

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newEngagement, setNewEngagement] = useState({
        firstName: '',
        lastName: '',
        headline: '',
        pod: 'FinTech',
        isaPercentage: 0.15,
        status: 'active',
        startDate: new Date().toISOString().split('T')[0], // Default to today YYYY-MM-DD
        bio_short: ''
    });
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateEngagement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsCreating(true);
        try {
            await addDoc(collection(db, 'engagements'), {
                repId: user.uid,
                status: newEngagement.status,
                isaPercentage: Number(newEngagement.isaPercentage),
                startDate: new Date(newEngagement.startDate).toISOString(),
                lastActivity: new Date().toISOString(),
                profile: {
                    firstName: newEngagement.firstName,
                    lastName: newEngagement.lastName,
                    headline: newEngagement.headline,
                    pod: newEngagement.pod,
                    bio_short: newEngagement.bio_short || "New client engagement.",
                    name: `${newEngagement.firstName} ${newEngagement.lastName}`,
                },
                financials: {
                    ltv: 0,
                    cac: 0,
                    margin: 0
                }
            });
            setIsAddModalOpen(false);
            setNewEngagement({
                firstName: '',
                lastName: '',
                headline: '',
                pod: 'FinTech',
                isaPercentage: 0.15,
                status: 'active',
                startDate: new Date().toISOString().split('T')[0],
                bio_short: ''
            });
        } catch (err) {
            console.error("Failed to create engagement", err);
            alert("Failed to create engagement.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-slate-700 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-oxford-green mb-1">Command Center</h2>
                    <p className="text-slate-400 text-xs uppercase tracking-wider">Portfolio Overview | Q1 2026</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-signal-orange text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-opacity-90"
                    >
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

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Engagement">
                <form onSubmit={handleCreateEngagement} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">First Name</label>
                            <input
                                required
                                placeholder="e.g. Jordan"
                                className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                value={newEngagement.firstName}
                                onChange={e => setNewEngagement({ ...newEngagement, firstName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Last Name</label>
                            <input
                                required
                                placeholder="e.g. Wolf"
                                className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                value={newEngagement.lastName}
                                onChange={e => setNewEngagement({ ...newEngagement, lastName: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Client Title / Headline</label>
                        <input
                            required
                            placeholder="e.g. Senior Engineer @ stealth"
                            className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                            value={newEngagement.headline}
                            onChange={e => setNewEngagement({ ...newEngagement, headline: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Status</label>
                            <select
                                className="w-full p-2 border border-slate-300 rounded-sm text-sm bg-white"
                                value={newEngagement.status}
                                onChange={e => setNewEngagement({ ...newEngagement, status: e.target.value })}
                            >
                                <option value="active">Active</option>
                                <option value="searching">Searching</option>
                                <option value="negotiating">Negotiating</option>
                                <option value="placed">Placed</option>
                                <option value="paused">Paused</option>
                                <option value="prospect">Prospect</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Start Date</label>
                            <input
                                type="date"
                                className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                value={newEngagement.startDate}
                                onChange={e => setNewEngagement({ ...newEngagement, startDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Pod</label>
                            <select
                                className="w-full p-2 border border-slate-300 rounded-sm text-sm bg-white"
                                value={newEngagement.pod}
                                onChange={e => setNewEngagement({ ...newEngagement, pod: e.target.value })}
                            >
                                <option value="FinTech">FinTech</option>
                                <option value="Crypto">Crypto</option>
                                <option value="Consumer">Consumer</option>
                                <option value="Enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">ISA %</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                value={newEngagement.isaPercentage}
                                onChange={e => setNewEngagement({ ...newEngagement, isaPercentage: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Short Bio / Notes</label>
                        <textarea
                            rows={3}
                            placeholder="Brief context..."
                            className="w-full p-2 border border-slate-300 rounded-sm text-sm resize-none"
                            value={newEngagement.bio_short}
                            onChange={e => setNewEngagement({ ...newEngagement, bio_short: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex gap-2">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="flex-1 py-2 border border-slate-300 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="flex-1 py-2 bg-signal-orange text-white font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-opacity-90"
                        >
                            {isCreating ? 'Creating...' : 'Create Engagement'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { where, addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Modal from '../../components/ui/Modal';

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
