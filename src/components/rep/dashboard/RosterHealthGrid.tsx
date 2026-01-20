import { useNavigate } from 'react-router-dom';
import { MessageSquare, Clock } from 'lucide-react';

interface RosterHealthGridProps {
    engagements: any[];
    pursuits: any[];
}

export default function RosterHealthGrid({ engagements, pursuits }: RosterHealthGridProps) {
    const navigate = useNavigate();

    // Helper to calculate "Time in Process"
    const getTimeInProcess = (startDate: string) => {
        if (!startDate) return 'N/A';
        const start = new Date(startDate);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return `Day ${diffDays}`;
    };

    // Helper to get last touch specific formatting
    const getLastTouch = (lastActivityDate: string) => {
        if (!lastActivityDate) return { text: 'N/A', isRed: false };
        const date = new Date(lastActivityDate);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return { text: 'Today', isRed: false };
        if (diffDays === 1) return { text: 'Yesterday', isRed: false };
        return {
            text: `${diffDays}d ago`,
            isRed: diffDays > 7
        };
    };

    // Helper to get pipeline coverage
    const getCoverage = (engagementId: string) => {
        const clientPursuits = pursuits.filter(p => p.engagementId === engagementId);
        const active = clientPursuits.filter(p => !['placed', 'lost', 'passed', 'rejected'].includes(p.stageId)).length;
        const stalled = clientPursuits.filter(p => {
            // Simple stalled logic: active but no update > 7 days (mock logic for now if updated isn't available, rely on count)
            return false;
        }).length;

        // Count offers specifically
        const offers = clientPursuits.filter(p => ['offer_pending', 'offer'].includes(p.stageId)).length;

        return { active, offers };
    };

    return (
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-4">
            <div className="border-b border-slate-100 pb-2 mb-4 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Roster Health</h3>
                <button
                    onClick={() => navigate('/rep/roster')}
                    className="text-[10px] uppercase font-bold text-signal-orange hover:text-orange-600"
                >
                    View Roster
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {engagements.map(engagement => {
                    const timeInProcess = getTimeInProcess(engagement.startDate);
                    const lastTouch = getLastTouch(engagement.lastActivity);
                    const coverage = getCoverage(engagement.id);

                    return (
                        <div
                            key={engagement.id}
                            onClick={() => navigate(`/rep/client/${engagement.id}`)}
                            className="bg-slate-50 border border-slate-200 rounded p-3 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-oxford-green text-white flex items-center justify-center font-bold text-xs">
                                        {engagement.profile?.firstName?.[0]}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-700 group-hover:text-oxford-green transition-colors">
                                            {engagement.profile?.firstName} {engagement.profile?.lastName}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                            {timeInProcess}
                                        </div>
                                    </div>
                                </div>
                                <button className="text-slate-300 hover:text-oxford-green transition-colors">
                                    <MessageSquare className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] mt-2 pt-2 border-t border-slate-200/50">
                                <div>
                                    <div className="text-slate-400 mb-0.5 uppercase tracking-wider font-bold text-[9px]">Coverage</div>
                                    <div className="font-bold text-slate-600">
                                        {coverage.active} Active {coverage.offers > 0 && <span className="text-emerald-600">/ {coverage.offers} Offer</span>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-slate-400 mb-0.5 uppercase tracking-wider font-bold text-[9px]">Last Touch</div>
                                    <div className={`font-bold ${lastTouch.isRed ? 'text-red-500' : 'text-slate-600'}`}>
                                        {lastTouch.text}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {engagements.length === 0 && (
                    <div className="col-span-full text-center py-6 text-slate-400 text-xs italic">
                        No active clients.
                    </div>
                )}
            </div>
        </div>
    );
}
