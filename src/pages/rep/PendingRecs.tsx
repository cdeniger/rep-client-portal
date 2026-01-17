import { useState, useEffect } from 'react';
import { collection, query, getDocs, where, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Check, X, Eye, CheckSquare, Square, Loader2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import type { JobRecommendation, JobTarget, Engagement } from '../../types/schema';

interface ExtendedRec extends JobRecommendation {
    target?: JobTarget;
    clientName?: string;
    checked?: boolean;
    ai_score?: number;
    ai_rationale?: string;
}

export default function PendingRecs() {
    const [loading, setLoading] = useState(true);
    const [recs, setRecs] = useState<ExtendedRec[]>([]);
    const [selectedRec, setSelectedRec] = useState<ExtendedRec | null>(null);

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Pending Recommendations
            const recsSnap = await getDocs(query(collection(db, 'job_recommendations'), where('status', '==', 'pending_rep')));
            const rawRecs = recsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as JobRecommendation[];

            if (rawRecs.length === 0) {
                setRecs([]);
                setLoading(false);
                return;
            }

            // 2. Fetch Related Data (Targets & Engagements)
            // Ideally we'd optimize this, but for now fetch all needed is okay for MVP scale

            // Fetch Targets
            // Note: firestore 'in' query limit is 10. For scale, we might need to batch or fetch all.
            // Let's fetch all targets for simplicity if list is small, or batch. 
            // Given "Pending Rep" implies a queue, hopefully not thousands.
            // Actually, let's just fetch individual docs in parallel for the IDs we need or cache.
            // Simpler approach for MVP: Fetch all targets (cached?) or just map one by one.
            // Let's fetch all targets for now to avoid N queries if many recs point to same target.
            const targetsSnap = await getDocs(collection(db, 'job_targets'));
            const targetsMap = new Map(targetsSnap.docs.map(d => [d.id, { id: d.id, ...d.data() } as JobTarget]));

            // Fetch Engagements & Users to get Client Name
            // Engagement has userId. 
            const enggSnap = await getDocs(collection(db, 'engagements')); // Fetching all engagements
            const enggMap = new Map(enggSnap.docs.map(d => [d.id, d.data() as Engagement]));

            const usersSnap = await getDocs(collection(db, 'users'));
            const usersMap = new Map(usersSnap.docs.map(d => [d.id, d.data()]));

            // 3. Merge Data
            const merged = rawRecs.map(r => {
                const target = targetsMap.get(r.targetId);
                const engg = enggMap.get(r.engagementId);
                const user = engg ? usersMap.get(engg.userId) : null;
                const clientName = user ? (user.profile?.name || user.profile?.firstName + ' ' + user.profile?.lastName) : 'Unknown Client';

                return {
                    ...r,
                    target,
                    clientName,
                    checked: false
                };
            });

            setRecs(merged);

        } catch (err) {
            console.error("Error fetching pending recs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Actions
    const handleAction = async (recId: string, status: 'pending_client' | 'rejected') => {
        try {
            await updateDoc(doc(db, 'job_recommendations', recId), { status });
            // Optimistic update
            setRecs(prev => prev.filter(r => r.id !== recId));
        } catch (err) {
            console.error("Error updating rec", err);
            alert("Failed to update status");
        }
    };

    const handleBulkAction = async (clientId: string, status: 'pending_client' | 'rejected') => {
        const groupRecs = recs.filter(r => r.engagementId === clientId && r.checked);
        if (groupRecs.length === 0) return;

        if (!confirm(`Are you sure you want to ${status === 'pending_client' ? 'APPROVE' : 'REJECT'} ${groupRecs.length} recommendations?`)) return;

        try {
            const batch = writeBatch(db);
            groupRecs.forEach(r => {
                const ref = doc(db, 'job_recommendations', r.id);
                batch.update(ref, { status });
            });
            await batch.commit();

            // Optimistic Update
            const updatedIds = new Set(groupRecs.map(r => r.id));
            setRecs(prev => prev.filter(r => !updatedIds.has(r.id)));
        } catch (err) {
            console.error("Batch update failed", err);
            alert("Failed to perform bulk action");
        }
    };

    // Toggle Checkboxes
    const toggleCheck = (recId: string) => {
        setRecs(prev => prev.map(r => r.id === recId ? { ...r, checked: !r.checked } : r));
    };

    const toggleGroup = (engagementId: string, checked: boolean) => {
        setRecs(prev => prev.map(r => r.engagementId === engagementId ? { ...r, checked } : r));
    };

    // Grouping
    const grouped = recs.reduce((acc, rec) => {
        const key = rec.engagementId;
        if (!acc[key]) {
            acc[key] = {
                clientName: rec.clientName || 'Unknown',
                items: []
            };
        }
        acc[key].items.push(rec);
        return acc;
    }, {} as Record<string, { clientName: string, items: ExtendedRec[] }>);


    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" /></div>;

    return (
        <div className="space-y-8 p-6">
            <h1 className="text-2xl font-bold text-oxford-green">Pending Recommendations</h1>
            <p className="text-slate-500">Review and approve AI-generated matches before they are sent to clients.</p>

            {recs.length === 0 && (
                <div className="text-center py-12 bg-white rounded border border-slate-200 text-slate-400">
                    No pending match recommendations.
                </div>
            )}

            {Object.entries(grouped).map(([engId, group]) => {
                const allChecked = group.items.every(r => r.checked);
                const anyChecked = group.items.some(r => r.checked);

                return (
                    <div key={engId} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toggleGroup(engId, !allChecked)}
                                    className="text-slate-500 hover:text-oxford-green"
                                >
                                    {allChecked ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                                </button>
                                <h2 className="font-bold text-lg text-slate-800">{group.clientName}</h2>
                                <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{group.items.length}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    disabled={!anyChecked}
                                    onClick={() => handleBulkAction(engId, 'rejected')}
                                    className="px-3 py-1 bg-white border border-red-200 text-red-500 text-xs font-bold uppercase rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Reject Selected
                                </button>
                                <button
                                    disabled={!anyChecked}
                                    onClick={() => handleBulkAction(engId, 'pending_client')}
                                    className="px-3 py-1 bg-oxford-green text-white text-xs font-bold uppercase rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Approve Selected
                                </button>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {group.items.map(rec => (
                                <div key={rec.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
                                    <button
                                        onClick={() => toggleCheck(rec.id)}
                                        className="text-slate-400 hover:text-oxford-green"
                                    >
                                        {rec.checked ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                    </button>

                                    <div className="flex-1">
                                        <div className="flex items-baseline justify-between mb-1">
                                            <h3 className="font-bold text-slate-800">{rec.target?.role || 'Unknown Role'}</h3>
                                            <span className="text-xs font-mono text-slate-400">
                                                match: {rec.ai_score ? `${rec.ai_score}%` : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-600 mb-1">{rec.target?.company}</div>
                                        <div className="text-xs text-slate-500 line-clamp-1 italic">
                                            "{rec.ai_rationale || rec.rep_notes || 'No notes provided.'}"
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSelectedRec(rec)}
                                            className="p-2 text-slate-400 hover:text-oxford-green hover:bg-slate-100 rounded"
                                            title="View Details"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleAction(rec.id, 'rejected')}
                                            className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded"
                                            title="Reject"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleAction(rec.id, 'pending_client')}
                                            className="p-2 text-green-300 hover:text-green-600 hover:bg-green-50 rounded"
                                            title="Approve"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Detail Modal */}
            <Modal isOpen={!!selectedRec} onClose={() => setSelectedRec(null)} title="Recommendation Details">
                <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-bold text-oxford-green">{selectedRec?.target?.role}</h3>
                        <p className="text-lg text-slate-600">{selectedRec?.target?.company}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400">Match Score</label>
                            <div className="font-mono">{selectedRec?.ai_score || 'N/A'}%</div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400">Source</label>
                            <div className="capitalize">{selectedRec?.source}</div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 italic">
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1 not-italic">Rationale</label>
                        {selectedRec?.ai_rationale || selectedRec?.rep_notes || 'No rationale provided.'}
                    </div>

                    {selectedRec?.target?.financials && (
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Financials</label>
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-2 rounded">
                                <div>Base: ${selectedRec.target.financials.base?.toLocaleString()}</div>
                                <div>Bonus: ${selectedRec.target.financials.bonus?.toLocaleString()}</div>
                                <div>Equity: ${selectedRec.target.financials.equity?.toLocaleString()}</div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            className="flex-1 py-3 border border-red-200 text-red-500 font-bold uppercase text-xs rounded hover:bg-red-50"
                            onClick={() => {
                                if (selectedRec) handleAction(selectedRec.id, 'rejected');
                                setSelectedRec(null);
                            }}
                        >
                            Reject
                        </button>
                        <button
                            className="flex-1 py-3 bg-oxford-green text-white font-bold uppercase text-xs rounded hover:opacity-90"
                            onClick={() => {
                                if (selectedRec) handleAction(selectedRec.id, 'pending_client');
                                setSelectedRec(null);
                            }}
                        >
                            Approve
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
