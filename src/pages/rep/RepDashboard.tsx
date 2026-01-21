import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { where, addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Modal from '../../components/ui/Modal';
import MasterPipelineTable from '../../components/rep/dashboard/MasterPipelineTable';
import RosterHealthGrid from '../../components/rep/dashboard/RosterHealthGrid';
import CommandFeed from '../../components/rep/dashboard/CommandFeed';

interface MetricCardProps {
    label: string;
    value: string;
    subtext: string;
    textColor?: string;
    onClick?: () => void;
}

function MetricCard({ label, value, subtext, textColor = 'text-oxford-green', onClick }: MetricCardProps) {
    return (
        <div
            onClick={onClick}
            className={`bg-white p-4 rounded-sm border border-slate-200 shadow-sm ${onClick ? 'cursor-pointer hover:border-signal-orange transition-colors group' : ''}`}
        >
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</div>
            <div className={`text-2xl font-bold ${textColor} mb-1 group-hover:scale-105 transition-transform origin-left`}>{value}</div>
            <div className="text-[10px] text-slate-400">{subtext}</div>
        </div>
    );
}

export default function RepDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // 1. Fetch Active Engagements for this Rep (inclusive of legacy ID for dev/testing continuity)
    const { data: engagements } = useCollection<any>(
        'engagements',
        where('repId', 'in', [user?.uid, 'rep_jordan']),
        where('status', '==', 'active')
    );

    // 2. Fetch Job Pursuits (Active Pipeline) - Filtered by Rep's engagements would be ideal, 
    // but typically we query by engagementId. Since we don't have that list upfront without chaining,
    // we limit this query. For now, we'll filter client-side or use a compound query if we had a list.
    // However, to fix the "mishmash" issue where we see ALL pursuits, let's filter relevant ones.
    const { data: pursuits } = useCollection<any>('job_pursuits');

    // 3. Fetch Pending Recommendations (for Critical Actions)
    const { data: pendingRecs } = useCollection<any>(
        'job_recommendations',
        where('status', '==', 'pending_rep')
    );

    // 4. Calculate Metrics
    const activeClientCount = engagements?.length || 0;

    const pipelineValue = useMemo(() => {
        if (!pursuits || !engagements) return 0;

        // Map engagement ID to ISA %
        const isaMap = new Map();
        engagements.forEach((e: any) => isaMap.set(e.id, e.isaPercentage || 0));

        return pursuits.reduce((total: number, pursuit: any) => {
            // Only count pursuits for active engagements
            const engId = pursuit.engagementId || pursuit.userId;

            if (isaMap.has(engId)) {
                const base = pursuit.financials?.base || 0;
                const isa = isaMap.get(engId);
                // Value = Base * ISA %
                return total + (base * isa);
            }
            return total;
        }, 0);
    }, [pursuits, engagements]);

    // Critical Actions Calculation
    const negotiatingPursuits = pursuits?.filter((o: any) => o.status === 'offer' || o.status === 'negotiating' || o.id === 'demo').length || 0;
    const pendingRecsCount = pendingRecs?.length || 0;
    const criticalActionCount = negotiatingPursuits + pendingRecsCount;

    // Format Currency
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    };

    // State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isTriageModalOpen, setIsTriageModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newEngagement, setNewEngagement] = useState({
        firstName: '',
        lastName: '',
        headline: '',
        pod: 'FinTech',
        isaPercentage: 0.15,
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
        bio_short: ''
    });

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
                <MetricCard
                    label="Critical Actions"
                    value={criticalActionCount.toString()}
                    subtext="Requires Attention"
                    textColor="text-red-500"
                    onClick={() => setIsTriageModalOpen(true)}
                />
            </div>

            {/* Command Center Grid Layout */}
            <div className="grid grid-cols-12 gap-6 h-auto lg:h-[800px]">
                {/* Zone 1: Operations (Cols 1-8) */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 h-full">

                    {/* Component A: Master Pipeline Table */}
                    <div className="flex-1 min-h-[300px]">
                        <MasterPipelineTable
                            engagements={engagements || []}
                            pursuits={pursuits || []}
                        />
                    </div>

                    {/* Component B: Roster Health Grid */}
                    <div className="flex-initial">
                        <RosterHealthGrid
                            engagements={engagements || []}
                            pursuits={pursuits || []}
                        />
                    </div>
                </div>

                {/* Zone 2: Triage (Cols 9-12) */}
                <div className="col-span-12 lg:col-span-4 h-full">
                    {/* Component C: Command Feed */}
                    <CommandFeed
                        engagements={engagements || []}
                        pursuits={pursuits || []}
                        pendingRecs={pendingRecs || []}
                        onTriageClick={() => setIsTriageModalOpen(true)}
                    />
                </div>
            </div>

            {/* Models */}
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

            {/* Critical Actions Triage Modal */}
            <Modal isOpen={isTriageModalOpen} onClose={() => setIsTriageModalOpen(false)} title="Critical Actions Triage">
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">Select an action group to address.</p>

                    <div className="grid gap-3">
                        {/* Pending Recommendations Action */}
                        <button
                            onClick={() => navigate('/rep/pending-recs')}
                            className="bg-white p-4 rounded border border-slate-200 hover:border-signal-orange hover:shadow-sm text-left transition-all flex justify-between items-center group"
                        >
                            <div>
                                <div className="font-bold text-oxford-green flex items-center gap-2">
                                    Pending Recommendations
                                    {pendingRecsCount > 0 && <span className="bg-signal-orange text-white text-[10px] px-2 py-0.5 rounded-full">{pendingRecsCount}</span>}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">AI matches waiting for your approval.</div>
                            </div>
                            <div className="text-slate-300 group-hover:text-signal-orange">→</div>
                        </button>

                        {/* Active Negotiations Action */}
                        <button
                            onClick={() => navigate('/rep/pipeline')}
                            className="bg-white p-4 rounded border border-slate-200 hover:border-signal-orange hover:shadow-sm text-left transition-all flex justify-between items-center group"
                        >
                            <div>
                                <div className="font-bold text-oxford-green flex items-center gap-2">
                                    Active Negotiations
                                    {negotiatingPursuits > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{negotiatingPursuits}</span>}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">Offers and deals closing soon.</div>
                            </div>
                            <div className="text-slate-300 group-hover:text-signal-orange">→</div>
                        </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={() => setIsTriageModalOpen(false)}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
