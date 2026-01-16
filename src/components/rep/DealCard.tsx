import { ExternalLink, DollarSign, MapPin, Briefcase } from 'lucide-react';
import type { Engagement } from '../../types/schema';

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
        notation: 'compact',
        compactDisplay: 'short'
    }).format(amount);
};

interface DealCardProps {
    engagement: Engagement;
    onEdit?: () => void;
}

export default function DealCard({ engagement, onEdit }: DealCardProps) {
    // Fallback if data is missing (graceful degradation)
    const criteria = engagement.searchCriteria || {
        minBase: 0,
        targetTotal: 0,
        locationType: 'Not Set',
        targetLocations: [],
        primaryFunction: 'Not Set',
        minLevel: 0,
        excludedIndustries: []
    };

    // Derived Status Color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'negotiating': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'placed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    return (
        <div className="bg-oxford-green border border-white/10 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-signal-orange" />
                    Deal Parameters
                </h3>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${getStatusColor(engagement.status)}`}>
                    {engagement.status}
                </span>
            </div>

            <div className="space-y-4">
                {/* 1. Commercials */}
                <div className="p-3 bg-white/5 rounded border border-white/5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Base Floor</div>
                            <div className="text-white font-mono font-bold text-lg">
                                {(criteria.minBase ?? 0) > 0 ? formatCurrency(criteria.minBase ?? 0) : <span className="text-gray-500 text-sm">--</span>}
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Target TC</div>
                            <div className="text-emerald-400 font-mono font-bold text-lg">
                                {(criteria.targetTotal ?? 0) > 0 ? formatCurrency(criteria.targetTotal ?? 0) : <span className="text-gray-500 text-sm">--</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Logistics & Scope Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Logistics</div>
                            <div className="text-white text-sm font-medium">
                                <span className="capitalize">{criteria.locationType}</span>
                                {criteria.targetLocations && criteria.targetLocations.length > 0 && (
                                    <div className="text-gray-400 text-xs mt-0.5">
                                        {criteria.targetLocations.join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Briefcase className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Target Scope</div>
                            <div className="text-white text-sm font-medium capitalize">
                                {criteria.primaryFunction} &bull; L{criteria.minLevel}+
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Exclusions & Edit Action */}
                <div className="pt-4 border-t border-white/5 flex items-end justify-between gap-4">
                    {/* Exclusions Left */}
                    <div className="flex-1">
                        {criteria.excludedIndustries && criteria.excludedIndustries.length > 0 ? (
                            <div>
                                <div className="text-red-400 text-[10px] uppercase tracking-wider mb-1">Exclusions</div>
                                <div className="flex flex-wrap gap-1">
                                    {criteria.excludedIndustries.map((ex, i) => (
                                        <span key={i} className="text-[10px] text-red-300 bg-red-900/20 px-1.5 py-0.5 rounded border border-red-900/30">
                                            {ex}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // Placeholder if no exclusions, to keep layout stable or empty
                            <div className="text-gray-500 text-[10px] italic">No exclusions</div>
                        )}
                    </div>

                    {/* Edit Right */}
                    <button
                        onClick={onEdit}
                        className="flex-shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white border border-slate-700 hover:bg-slate-800 rounded-sm transition-all"
                    >
                        Edit Parameters
                    </button>
                </div>
            </div>
        </div>
    );
}
