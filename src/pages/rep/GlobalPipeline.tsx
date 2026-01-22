import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { findOrCreateCompany } from '../../lib/companies';
import { Search, Filter, Briefcase, List as ListIcon, Kanban, Loader2, CheckSquare, Square } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import OpportunityForm from '../../components/forms/OpportunityForm';

export default function GlobalPipeline() {
    const [activeTab, setActiveTab] = useState<'inventory' | 'pipeline'>('inventory');
    const [loading, setLoading] = useState(true);
    const [inventory, setInventory] = useState<any[]>([]);
    const [pipeline, setPipeline] = useState<any[]>([]);

    // Assignment State
    const [selectedOpp, setSelectedOpp] = useState<any | null>(null);
    const [suggestTarget, setSuggestTarget] = useState<any | null>(null);
    const [clients, setClients] = useState<any[]>([]); // Using 'any' for speed, ideally UserProfile
    const [assignClientId, setAssignClientId] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    // Suggestion State
    const [suggestClientId, setSuggestClientId] = useState('');
    const [suggestNote, setSuggestNote] = useState('');
    const [isSuggesting, setIsSuggesting] = useState(false);

    // Helper state for bulk suggest modal opening
    // We treat 'suggestTarget === null' but 'inventory.some(c => c.checked)' as a bulk context if needed
    // But to open the modal we need a trigger. Let's use a specific state for clarity or reuse suggestTarget?
    // Let's use a boolean flag for "Bulk Suggest Mode" if suggestTarget is null.
    const [isBulkSuggestOpen, setIsBulkSuggestOpen] = useState(false);

    // Create State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchData();
        fetchClients();
    }, []);

    const fetchClients = async () => {
        // Fetch engagements as proxy for clients list
        const snap = await getDocs(query(collection(db, 'engagements')));
        // Ensure ID is captured even if missing in data fields
        setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOpp || !assignClientId) return;
        setIsAssigning(true);
        try {
            // Find the full client object to get the real userId (auth ID) from the engagement ID
            const assignedClient = clients.find(c => c.id === assignClientId);
            const realUserId = assignedClient?.userId;

            if (!realUserId) {
                console.error("Could not find user ID for engagement", assignClientId);
                alert("Error: Could not find user ID for selected client.");
                return;
            }

            // New Logic: Create a Job Pursuit linked to the Target
            // The Target remains OPEN in the inventory (shared market data)

            // Find/Create Company
            const companyId = await findOrCreateCompany(selectedOpp.company || 'Unknown');

            await addDoc(collection(db, 'job_pursuits'), {
                targetId: selectedOpp.id,
                userId: realUserId, // The Auth/User Profile ID
                engagementId: assignClientId, // The Business Engagement ID (Critical for ClientDetail views)
                companyId: companyId,
                company: selectedOpp.company,
                role: selectedOpp.role,
                stageId: 'interview_loop', // Default start stage for assignment
                stage_detail: 'Responded to Outreach',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                financials: selectedOpp.financials || {}
            });

            await fetchData();
            setSelectedOpp(null);
            setAssignClientId('');
        } catch (err) {
            console.error("Failed to assign", err);
        } finally {
            setIsAssigning(false);
        }
    };

    const handleSuggest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!suggestClientId) return;

        // Determine items to suggest: either specific target or all checked items
        let targetsToSuggest = [];
        if (suggestTarget) {
            targetsToSuggest = [suggestTarget];
        } else {
            targetsToSuggest = inventory.filter(t => t.checked);
        }

        if (targetsToSuggest.length === 0) return;

        setIsSuggesting(true);
        try {
            const batch = writeBatch(db);
            const now = new Date().toISOString();

            targetsToSuggest.forEach(target => {
                const docRef = doc(collection(db, 'job_recommendations'));
                batch.set(docRef, {
                    targetId: target.id,
                    engagementId: suggestClientId,
                    status: 'pending_rep',
                    source: 'manual',
                    rep_notes: suggestNote, // Same note for all
                    createdAt: now,
                });
            });

            await batch.commit();

            alert(`Successfully recommended ${targetsToSuggest.length} opportunities!`);

            // Reset UI
            setSuggestTarget(null);
            setIsBulkSuggestOpen(false);
            setSuggestClientId('');
            setSuggestNote('');

            // Clear checks
            setInventory(prev => prev.map(t => ({ ...t, checked: false })));

        } catch (err) {
            console.error("Failed to suggest", err);
            alert("Failed to send recommendations.");
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleCreateOpportunity = async (data: any) => {
        setIsCreating(true);
        try {
            // New Logic: Create a Job Target (Inventory Item)
            const targetRef = await addDoc(collection(db, 'job_targets'), {
                company: data.company,
                role: data.role,
                stage_detail: data.stage_detail,
                financials: data.financials,
                source: 'manual',
                status: 'OPEN',
                createdAt: new Date().toISOString(),
            });

            // Dual Creation: If client assigned, create Pursuit immediately
            if (data.assignClientId) {
                // Find the full client object to get the real userId (auth ID) from the engagement ID
                const assignedClient = clients.find(c => c.id === data.assignClientId);
                const realUserId = assignedClient?.userId;

                if (realUserId) {
                    const companyId = await findOrCreateCompany(data.company || 'Unknown');

                    await addDoc(collection(db, 'job_pursuits'), {
                        targetId: targetRef.id,
                        userId: realUserId,
                        engagementId: data.assignClientId,
                        companyId: companyId,
                        company: data.company,
                        role: data.role,
                        stageId: 'outreach_execution',
                        stage_detail: data.stage_detail,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        financials: data.financials || {}
                    });
                } else {
                    console.error("Could not find user ID for engagement during dual creation", data.assignClientId);
                }
            }

            await fetchData();
            setIsCreateModalOpen(false);
        } catch (err) {
            console.error("Failed to create opportunity", err);
            alert("Failed to create opportunity");
        } finally {
            setIsCreating(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Inventory (Job Targets)
            const targetsSnap = await getDocs(query(collection(db, 'job_targets')));
            const targets = targetsSnap.docs.map(d => ({ id: d.id, ...d.data(), checked: false })) as any[];

            // 2. Fetch Pipeline (Job Pursuits)
            const pursuitsSnap = await getDocs(collection(db, 'job_pursuits'));
            const pursuits = pursuitsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

            setInventory(targets.filter(t => t.status === 'OPEN'));
            setPipeline(pursuits);
        } catch (error) {
            console.error("Failed to fetch pipeline data", error);
        } finally {
            setLoading(false);
        }
    };

    // Toggle Check Logic
    const toggleCheck = (id: string) => {
        setInventory(prev => prev.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const toggleSelectAll = () => {
        const allChecked = inventory.every(i => i.checked);
        setInventory(prev => prev.map(i => ({ ...i, checked: !allChecked })));
    };

    const checkedCount = inventory.filter(i => i.checked).length;

    // Determine title for suggest modal
    const suggestModalTitle = suggestTarget
        ? `Suggest Opportunity`
        : `Suggest ${checkedCount} Opportunities`;

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-oxford-green">Open Job Targets</h1>
                    <p className="text-slate-500 text-sm">Manage open market inventory and active client deals.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 bg-signal-orange text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-opacity-90 flex items-center gap-2"
                    >
                        <Briefcase className="h-4 w-4" />
                        + Add Job Opportunity
                    </button>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'inventory' ? 'bg-white shadow text-oxford-green' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <ListIcon className="h-4 w-4" />
                            Inventory ({inventory.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('pipeline')}
                            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'pipeline' ? 'bg-white shadow text-oxford-green' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Kanban className="h-4 w-4" />
                            Active Pipeline ({pipeline.length})
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-lg min-h-[500px]">
                    {activeTab === 'inventory' ? (
                        <InventoryTable
                            data={inventory}
                            onAssign={setSelectedOpp}
                            onSuggest={setSuggestTarget}
                            onCheck={toggleCheck}
                            onSelectAll={toggleSelectAll}
                            checkedCount={checkedCount}
                            openSuggestModal={() => setIsBulkSuggestOpen(true)}
                        />
                    ) : (
                        <PipelineBoard data={pipeline} />
                    )}
                </div>
            )}

            {/* Assignment Modal */}
            <Modal isOpen={!!selectedOpp} onClose={() => setSelectedOpp(null)} title={`Assign Opportunity`}>
                <form onSubmit={handleAssign} className="space-y-4">
                    <div>
                        <div className="text-xs text-slate-500 mb-4 font-mono">
                            {selectedOpp?.role} @ {selectedOpp?.company}
                        </div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Select Client</label>
                        <select
                            className="w-full p-2 border border-slate-300 rounded-sm text-sm bg-white"
                            value={assignClientId}
                            onChange={(e) => setAssignClientId(e.target.value)}
                            required
                        >
                            <option value="">-- Choose a Client --</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {/* Using firstName/lastName from denormalized profile */}
                                    {client.profile?.firstName ? `${client.profile.firstName} ${client.profile.lastName}` : client.profile?.headline || 'Unknown Client'}
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-2">
                            * Assigning will move this to the Active Pipeline board as 'Interviewing'.
                        </p>
                    </div>
                    <div className="pt-4 flex gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedOpp(null)}
                            className="flex-1 py-2 border border-slate-300 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isAssigning}
                            className="flex-1 py-2 bg-oxford-green text-white font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-opacity-90"
                        >
                            {isAssigning ? 'Assigning...' : 'Confirm'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Suggestion Modal */}
            <Modal
                isOpen={!!suggestTarget || isBulkSuggestOpen}
                onClose={() => { setSuggestTarget(null); setIsBulkSuggestOpen(false); }}
                title={suggestModalTitle}
            >
                <form onSubmit={handleSuggest} className="space-y-4">
                    <div>
                        {suggestTarget && (
                            <div className="text-xs text-slate-500 mb-4 font-mono">
                                Recommending: {suggestTarget.role} @ {suggestTarget.company}
                            </div>
                        )}
                        {!suggestTarget && checkedCount > 0 && (
                            <div className="text-xs text-slate-500 mb-4 font-mono">
                                Recommending {checkedCount} Opportunities
                            </div>
                        )}

                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Select Client</label>
                        <select
                            className="w-full p-2 border border-slate-300 rounded-sm text-sm bg-white mb-4"
                            value={suggestClientId}
                            onChange={(e) => setSuggestClientId(e.target.value)}
                            required
                        >
                            <option value="">-- Choose a Client --</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.profile?.firstName ? `${client.profile.firstName} ${client.profile.lastName}` : client.profile?.headline || 'Unknown Client'}
                                </option>
                            ))}
                        </select>

                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Personal Note</label>
                        <textarea
                            className="w-full p-2 border border-slate-300 rounded-sm text-sm bg-white h-24"
                            placeholder="Why is this a good fit?"
                            value={suggestNote}
                            onChange={(e) => setSuggestNote(e.target.value)}
                        />
                    </div>
                    <div className="pt-4 flex gap-2">
                        <button
                            type="button"
                            onClick={() => { setSuggestTarget(null); setIsBulkSuggestOpen(false); }}
                            className="flex-1 py-2 border border-slate-300 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSuggesting}
                            className="flex-1 py-2 bg-signal-orange text-white font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-opacity-90"
                        >
                            {isSuggesting ? 'Sending...' : 'Send Suggestion'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Create Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add Job Opportunity">
                <OpportunityForm
                    onSubmit={handleCreateOpportunity}
                    onCancel={() => setIsCreateModalOpen(false)}
                    isSubmitting={isCreating}
                    hideStatus={true}
                    clients={clients}
                />
            </Modal>

        </div >
    );
}

function InventoryTable({
    data,
    onAssign,
    onSuggest,
    onCheck,
    onSelectAll,
    checkedCount,
    openSuggestModal
}: {
    data: any[],
    onAssign: (opp: any) => void,
    onSuggest: (opp: any) => void,
    onCheck: (id: string) => void,
    onSelectAll: () => void,
    checkedCount: number,
    openSuggestModal: () => void
}) {
    return (
        <div className="p-4">
            <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search roles, companies..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-oxford-green"
                    />
                </div>
                {checkedCount > 0 && (
                    <button
                        onClick={openSuggestModal}
                        className="flex items-center gap-2 px-4 py-2 bg-oxford-green text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-opacity-90 animate-in fade-in slide-in-from-right-4"
                    >
                        Suggest Selected ({checkedCount})
                    </button>
                )}
                <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md text-slate-600 text-sm hover:bg-slate-50">
                    <Filter className="h-4 w-4" />
                    Filters
                </button>
            </div>

            <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                        <th className="p-3 w-10">
                            <button onClick={onSelectAll} className="text-slate-400 hover:text-oxford-green">
                                {data.length > 0 && data.every(d => d.checked) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                            </button>
                        </th>
                        <th className="font-bold p-3">Role</th>
                        <th className="font-bold p-3">Company</th>
                        <th className="font-bold p-3">Comp Range</th>
                        <th className="font-bold p-3">Source</th>
                        <th className="font-bold p-3">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {data.map(opp => (
                        <tr key={opp.id} className={`hover:bg-slate-50 group ${opp.checked ? 'bg-slate-50' : ''}`}>
                            <td className="p-3">
                                <button onClick={() => onCheck(opp.id)} className="text-slate-400 hover:text-oxford-green">
                                    {opp.checked ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                </button>
                            </td>
                            <td className="p-3 font-medium text-slate-700">{opp.role}</td>
                            <td className="p-3 text-slate-600">{opp.company}</td>
                            <td className="p-3 text-slate-500 font-mono text-xs">
                                ${((opp.financials?.base || 0) / 1000).toFixed(0)}k Base
                            </td>
                            <td className="p-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                                    {opp.source}
                                </span>
                            </td>
                            <td className="p-3">
                                <button
                                    onClick={() => onAssign(opp)}
                                    className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-oxford-green text-white text-xs font-bold rounded shadow-sm hover:bg-opacity-90 transition-all"
                                >
                                    Assign
                                </button>
                                <button
                                    onClick={() => onSuggest(opp)}
                                    className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded shadow-sm hover:bg-slate-50 transition-all ml-2"
                                >
                                    Suggest
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function PipelineBoard({ data }: { data: any[] }) {
    const active = data.filter(o => ['target_locked', 'outreach_execution', 'engagement', 'interview_loop'].includes(o.stageId));
    const offers = data.filter(o => ['offer_pending', 'placed'].includes(o.stageId));

    return (
        <div className="p-6 grid grid-cols-2 gap-8">
            <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center justify-between">
                    <span>In Progress</span>
                    <span className="bg-slate-100 px-2 rounded-full text-xs">{active.length}</span>
                </h3>
                <div className="space-y-3">
                    {active.map(opp => (
                        <PipelineCard key={opp.id} opp={opp} />
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-green-600 mb-4 flex items-center justify-between">
                    <span>Offers / Closed</span>
                    <span className="bg-green-50 px-2 rounded-full text-xs">{offers.length}</span>
                </h3>
                <div className="space-y-3">
                    {offers.map(opp => (
                        <PipelineCard key={opp.id} opp={opp} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function PipelineCard({ opp }: { opp: any }) {
    return (
        <div className="bg-white border border-slate-200 rounded p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="font-bold text-slate-800">{opp.company}</div>
                    <div className="text-xs text-slate-500">{opp.role}</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${opp.stageId === 'offer_pending' ? 'bg-green-500' : 'bg-blue-400'}`} />
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                <div className="text-xs font-mono text-slate-400">
                    ID: {opp.engagementId ? opp.engagementId.replace('eng_user_', '').slice(0, 8) : opp.userId ? opp.userId.slice(0, 8) : 'Unassigned'}
                </div>
                <div className="text-xs font-bold text-oxford-green">
                    ${((opp.financials?.rep_net_value || 0) / 1000).toFixed(1)}k Net
                </div>
            </div>
        </div>
    )
}
