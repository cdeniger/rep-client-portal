
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import type { Engagement, JobRecommendation, JobTarget } from '../types/schema';
import { Loader2, ArrowUpRight, Clock, HelpCircle, CheckCircle } from 'lucide-react';
import Modal from '../components/ui/Modal';

interface ExtendedRec extends JobRecommendation {
    target?: JobTarget;
}

export default function JobRecs() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<ExtendedRec[]>([]);
    const [selectedRec, setSelectedRec] = useState<ExtendedRec | null>(null);

    // Fetch Data
    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Get User's Engagement
            const engQuery = query(collection(db, 'engagements'), where('userId', '==', user.uid), where('status', '==', 'active'));
            const engSnap = await getDocs(engQuery);
            if (engSnap.empty) {
                setLoading(false);
                return;
            }
            const engagement = { id: engSnap.docs[0].id, ...engSnap.docs[0].data() } as Engagement;

            // 2. Get Recommendations
            const recQuery = query(collection(db, 'job_recommendations'), where('engagementId', '==', engagement.id));
            const recSnap = await getDocs(recQuery);
            const recs = recSnap.docs.map(d => ({ id: d.id, ...d.data() })) as JobRecommendation[];

            // 3. Get Targets
            // Optimization: Only fetch targets for the recs
            const targetIds = [...new Set(recs.map(r => r.targetId))];
            if (targetIds.length === 0) {
                setRecommendations([]);
                setLoading(false);
                return;
            }

            // For MVP, if list is small, fetch all targets or map parallel getDocs. 
            // Firestore 'in' query supports up to 10. Let's just fetch all targets for now as Client Portal load is low.
            const allTargetsSnap = await getDocs(collection(db, 'job_targets'));
            const allTargets = allTargetsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as JobTarget[];

            const extendedRecs = recs.map(r => ({
                ...r,
                target: allTargets.find(t => t.id === r.targetId)
            }));

            setRecommendations(extendedRecs);

        } catch (err) {
            console.error("Error fetching job recs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleAction = async (recId: string, action: 'pursue' | 'reject' | 'defer') => {
        try {
            if (action === 'pursue') {
                const rec = recommendations.find(r => r.id === recId);
                if (!rec || !rec.targetId || !rec.engagementId) return;

                // Create Pursuit
                // Create Pursuit
                if (!user) return;

                await addDoc(collection(db, 'job_pursuits'), {
                    targetId: rec.targetId,
                    userId: user.uid,
                    engagementId: rec.engagementId,

                    // Denormalized Display Fields (Crucial for Dashboard/Pipeline visibility)
                    company: rec.target?.company || 'Unknown Company',
                    role: rec.target?.role || 'Unknown Role',
                    financials: rec.target?.financials || { base: 0, bonus: 0, equity: '', rep_net_value: 0 },

                    stageId: 'outreach_execution', // Initial stage
                    stage_detail: 'Pursuit initiated from recommendations',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                // Update Rec Status
                await updateDoc(doc(db, 'job_recommendations', recId), { status: 'converted' });
            } else if (action === 'reject') {
                await updateDoc(doc(db, 'job_recommendations', recId), { status: 'rejected' });
            } else if (action === 'defer') {
                await updateDoc(doc(db, 'job_recommendations', recId), { status: 'deferred' });
            }

            // Simple re-fetch (or optimistic update)
            fetchData();
            if (selectedRec?.id === recId) setSelectedRec(null);

        } catch (err) {
            console.error("Action failed", err);
            alert("Action failed. Please try again.");
        }
    };


    const pendingRecs = recommendations.filter(r => r.status === 'pending_client');
    const deferredRecs = recommendations.filter(r => r.status === 'deferred');


    if (loading) return <div className="flex justify-center h-screen items-center"><Loader2 className="animate-spin text-oxford-green" /></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-oxford-green mb-2">Job Recommendations</h1>
                <p className="text-slate-500 text-lg">Curated opportunities for your review.</p>
            </div>

            {/* Pending Recs Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-slate-800">New Recommendations</h2>
                    <span className="bg-signal-orange text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingRecs.length}</span>
                </div>

                {pendingRecs.length === 0 ? (
                    <div className="p-8 bg-white border border-slate-200 rounded-sm text-center text-slate-400 italic">
                        No new recommendations at this time.
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {pendingRecs.map(rec => (
                            <div key={rec.id} className="bg-white border border-slate-200 rounded-sm shadow-sm hover:shadow-md transition-shadow p-6">
                                <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
                                    <div className="flex-1">
                                        <div className="mb-2">
                                            <h3 className="text-2xl font-bold text-oxford-green">{rec.target?.role}</h3>
                                            <p className="text-lg text-slate-600 font-medium">{rec.target?.company}</p>
                                        </div>

                                        {/* Rep Note */}
                                        <div className="bg-slate-50 border-l-4 border-signal-orange p-3 my-4 rounded-r-sm">
                                            <p className="text-sm text-slate-600 italic">
                                                <span className="font-bold not-italic text-oxford-green block text-xs uppercase mb-1">Rep Note</span>
                                                "{rec.rep_notes || rec.ai_rationale || "Strong match for your background."}"
                                            </p>
                                        </div>

                                        <div className="flex gap-4 text-xs font-mono text-slate-400 mt-2">
                                            <span>Match: {rec.ai_score ? `${rec.ai_score}%` : 'N/A'}</span>
                                            <span>Source: {rec.source}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 min-w-[180px]">
                                        <button
                                            onClick={() => handleAction(rec.id, 'pursue')}
                                            className="w-full py-3 bg-oxford-green text-white font-bold uppercase tracking-widest text-xs rounded-sm hover:bg-opacity-90 flex items-center justify-center gap-2"
                                        >
                                            Pursue <CheckCircle className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setSelectedRec(rec)}
                                            className="w-full py-3 border border-slate-200 text-oxford-green font-bold uppercase tracking-widest text-xs rounded-sm hover:bg-slate-50 flex items-center justify-center gap-2"
                                        >
                                            Tell Me More <HelpCircle className="h-4 w-4" />
                                        </button>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <button
                                                onClick={() => handleAction(rec.id, 'defer')}
                                                className="py-2 border border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[10px] rounded-sm hover:bg-slate-50"
                                            >
                                                Defer
                                            </button>
                                            <button
                                                onClick={() => handleAction(rec.id, 'reject')}
                                                className="py-2 border border-red-100 text-red-300 font-bold uppercase tracking-widest text-[10px] rounded-sm hover:bg-red-50 hover:text-red-500"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>


            {/* Deferred Section */}
            {deferredRecs.length > 0 && (
                <section className="pt-8 border-t border-slate-200">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                        <Clock className="h-5 w-5" /> Deferred
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {deferredRecs.map(rec => (
                            <div key={rec.id} className="bg-slate-50 p-4 rounded-sm border border-slate-200 flex flex-col justify-between">
                                <div className="mb-4">
                                    <h4 className="font-bold text-slate-700">{rec.target?.role}</h4>
                                    <p className="text-sm text-slate-500">{rec.target?.company}</p>
                                </div>
                                <button
                                    onClick={() => handleAction(rec.id, 'pursue')}
                                    className="w-full py-2 border border-oxford-green text-oxford-green text-xs font-bold uppercase rounded-sm hover:bg-oxford-green hover:text-white transition-colors"
                                >
                                    Reconsider
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}


            {/* Detail Modal */}
            <Modal isOpen={!!selectedRec} onClose={() => setSelectedRec(null)} title="Opportunity Details">
                <div className="space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                        <h2 className="text-2xl font-bold text-oxford-green">{selectedRec?.target?.role}</h2>
                        <div className="flex items-center gap-2 text-lg text-slate-600">
                            <span>{selectedRec?.target?.company}</span>
                            {selectedRec?.target?.website && (
                                <a href={selectedRec.target.website} target="_blank" rel="noreferrer" className="text-signal-orange hover:underline">
                                    <ArrowUpRight className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Description</h4>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {selectedRec?.target?.description || "No description available."}
                        </p>
                    </div>

                    {selectedRec?.target?.financials && (
                        <div className="bg-slate-50 p-4 rounded-sm">
                            <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Target Financials</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm font-mono text-slate-700">
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase">Base</div>
                                    ${selectedRec.target.financials.base?.toLocaleString() || 'N/A'}
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase">Bonus</div>
                                    ${selectedRec.target.financials.bonus?.toLocaleString() || 'N/A'}
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase">Equity</div>
                                    ${selectedRec.target.financials.equity?.toLocaleString() || 'N/A'}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-oxford-green/5 p-4 rounded-sm border border-oxford-green/10">
                        <h4 className="text-xs font-bold uppercase text-oxford-green mb-2">Why this fits</h4>
                        <p className="text-sm text-slate-700 italic">
                            "{selectedRec?.ai_rationale || selectedRec?.rep_notes || "Selected based on your profile preferences."}"
                        </p>
                    </div>


                    <div className="pt-6 flex gap-3">
                        <button
                            onClick={() => { if (selectedRec) handleAction(selectedRec.id, 'reject'); }}
                            className="flex-1 py-3 border border-red-200 text-red-400 font-bold uppercase text-xs rounded hover:bg-red-50"
                        >
                            Reject
                        </button>
                        <button
                            onClick={() => { if (selectedRec) handleAction(selectedRec.id, 'pursue'); }}
                            className="flex-[2] py-3 bg-oxford-green text-white font-bold uppercase text-xs rounded hover:opacity-90"
                        >
                            Pursue Opportunity
                        </button>
                    </div>

                </div>
            </Modal>
        </div>
    );
}
