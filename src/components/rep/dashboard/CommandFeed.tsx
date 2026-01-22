import { useNavigate } from 'react-router-dom';
import { AlertCircle, FileText, CheckCircle2, Clock } from 'lucide-react';

interface CommandFeedProps {
    pursuits: any[];
    pendingRecs: any[];
    onTriageClick: () => void;
}

export default function CommandFeed({ pursuits, pendingRecs, onTriageClick }: CommandFeedProps) {
    const navigate = useNavigate();

    // 1. Identify "High Urgency" Items
    const offers = pursuits.filter(p => p.stageId === 'offer_pending' || p.status === 'offer');
    const negotiations = pursuits.filter(p => p.stageId === 'engagement' && p.status === 'negotiating'); // Using existing status as fallback or specific logic
    const pendingRecommendations = pendingRecs.length;

    // 2. Identify "Stalled" Items (Mock logic: > 7 days since updated)
    // In real app, we'd check `p.updatedAt` vs now. For now, we mock one if empty for visuals, or filter real ones
    const stalledItems = pursuits.filter(p => {
        if (!p.updatedAt) return false;
        const diff = (new Date().getTime() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        return diff > 7 && !['placed', 'lost', 'passed'].includes(p.stageId);
    });

    return (
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm h-full flex flex-col">
            <div className="p-4 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Command Feed</h3>
                <div className="text-[10px] text-slate-400">
                    {offers.length + negotiations.length + (pendingRecommendations > 0 ? 1 : 0)} Urgent Items
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {/* 1. Offers (Critical) */}
                {offers.map(p => (
                    <div
                        key={p.id}
                        onClick={() => navigate(`/rep/client/${p.engagementId}`)}
                        className="bg-red-50 border border-red-100 p-3 rounded-sm cursor-pointer hover:border-red-200 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-1.5 text-red-600 font-bold text-[10px] uppercase tracking-wider">
                                <AlertCircle className="h-3 w-3" />
                                <span>Offer Pending</span>
                            </div>
                            <span className="text-[10px] text-red-400">Action Req.</span>
                        </div>
                        <div className="font-bold text-slate-700 text-xs mb-0.5">{p.company}</div>
                        <div className="text-[10px] text-slate-500">{p.role}</div>
                    </div>
                ))}

                {/* 2. Pending Recs (Urgent) */}
                {pendingRecommendations > 0 && (
                    <div
                        onClick={() => navigate('/rep/pending-recs')}
                        className="bg-orange-50 border border-orange-100 p-3 rounded-sm cursor-pointer hover:border-orange-200 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-1.5 text-orange-600 font-bold text-[10px] uppercase tracking-wider">
                                <FileText className="h-3 w-3" />
                                <span>Pending Approval</span>
                            </div>
                            <span className="text-[10px] text-orange-400">{pendingRecommendations} Items</span>
                        </div>
                        <div className="font-bold text-slate-700 text-xs mb-0.5">Job Recommendations</div>
                        <div className="text-[10px] text-slate-500">AI matches waiting for review</div>
                    </div>
                )}

                {/* 3. Stalled / Warnings */}
                {stalledItems.map(p => (
                    <div
                        key={p.id}
                        onClick={() => navigate(`/rep/client/${p.engagementId}`)}
                        className="bg-slate-50 border border-slate-200 p-3 rounded-sm cursor-pointer hover:border-slate-300 transition-colors opacity-80 hover:opacity-100"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                                <Clock className="h-3 w-3" />
                                <span>Stalled Activity</span>
                            </div>
                            <span className="text-[10px] text-slate-400">7+ Days</span>
                        </div>
                        <div className="font-bold text-slate-700 text-xs mb-0.5">{p.company}</div>
                        <div className="text-[10px] text-slate-500">No recent updates logged</div>
                    </div>
                ))}

                {/* Empty State */}
                {offers.length === 0 && pendingRecommendations === 0 && stalledItems.length === 0 && (
                    <div className="py-8 text-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-100 mx-auto mb-2" />
                        <div className="text-xs font-bold text-slate-400">All Clear</div>
                        <div className="text-[10px] text-slate-300 mt-1">No urgent blocking items.</div>
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                <button
                    onClick={onTriageClick}
                    className="w-full py-2 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-sm hover:border-slate-300 hover:text-slate-800 transition-colors"
                >
                    Open Triage View
                </button>
            </div>
        </div>
    );
}
