// Consolidated imports
import { DollarSign, MapPin, Briefcase, TrendingUp, Target, Globe } from 'lucide-react';
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
    className?: string;
}

export default function DealCard({ engagement, onEdit, className = '' }: DealCardProps) {
    // Data Extraction with Fallbacks
    const params = engagement.targetParameters;
    const strategy = engagement.strategy;

    // Row 1: Hard Numbers
    const baseFloor = params?.minBase;
    const targetTC = params?.minTotalComp;

    // Row 2: Logistics
    const workStyle = params?.workStyle || 'N/A';
    const relocation = params?.relocationWillingness
        ? (typeof params.relocationWillingness === 'string' ? params.relocationWillingness : 'Open to Relocation')
        : 'No Relocation';

    // Row 3: Deal Strategy (Critical)
    const riskProfile = strategy?.comp?.riskPosture || 'N/A';
    const primaryArc = strategy?.trajectory?.primaryArc || 'N/A';

    // Row 4: Market Focus
    const targetSectors = params?.preferredIndustries || [];
    const sectorsDisplay = targetSectors.length > 0 ? targetSectors.join(', ') : 'Open / Generalist';

    // Footer: Exclusions
    const exclusions = params?.avoidIndustries || [];

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
        <div className={`bg-oxford-green border border-white/10 rounded-lg p-5 shadow-sm flex flex-col justify-between ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-signal-orange" />
                    Client Parameters
                </h3>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${getStatusColor(engagement.status)}`}>
                    {engagement.status}
                </span>
            </div>

            <div className="space-y-4 flex-1 flex flex-col">
                {/* 1. Hard Numbers */}
                <div className="p-3 bg-white/5 rounded border border-white/5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Base Floor</div>
                            <div className="text-white font-mono font-bold text-lg">
                                {baseFloor ? formatCurrency(baseFloor) : <span className="text-gray-500 text-sm">--</span>}
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Target TC</div>
                            <div className="text-emerald-400 font-mono font-bold text-lg">
                                {targetTC ? formatCurrency(targetTC) : <span className="text-gray-500 text-sm">--</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Logistics */}
                <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-3">
                    <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Work Style</div>
                            <div className="text-white text-sm font-medium capitalize truncate">
                                {workStyle}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Globe className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Relocation</div>
                            <div className="text-white text-sm font-medium truncate">
                                {relocation}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Deal Strategy - Vertical Stack */}
                <div className="border-b border-white/5">
                    {/* Risk Profile - Full Width & Wrapping */}
                    <div className="flex items-start gap-3 py-3 border-b border-white/5 border-dashed">
                        <Briefcase className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Risk Profile</div>
                            <div className="text-white text-sm font-medium capitalize leading-normal">
                                {riskProfile}
                            </div>
                        </div>
                    </div>

                    {/* Primary Arc - Full Width */}
                    <div className="flex items-start gap-3 py-3">
                        <TrendingUp className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Primary Arc</div>
                            <div className="text-white text-sm font-medium capitalize">
                                {primaryArc}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Market Focus */}
                <div className="flex items-start gap-3 pb-2">
                    <Target className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 overflow-hidden">
                        <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Target Sectors</div>
                        <div className="text-white text-sm font-medium leading-tight line-clamp-2">
                            {sectorsDisplay}
                        </div>
                    </div>
                </div>

                {/* Footer: Exclusions & Edit Action */}
                <div className="pt-2 flex items-end justify-between gap-4 mt-auto">
                    {/* Exclusions Left */}
                    <div className="flex-1 overflow-hidden">
                        {exclusions.length > 0 ? (
                            <div>
                                <div className="text-red-400 text-[10px] uppercase tracking-wider mb-1">Exclusions</div>
                                <div className="flex flex-wrap gap-1">
                                    {exclusions.map((ex, i) => (
                                        <span key={i} className="text-[10px] text-red-300 bg-red-900/20 px-1.5 py-0.5 rounded border border-red-900/30 whitespace-nowrap">
                                            {ex}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-600 text-[10px] italic">No active exclusions</div>
                        )}
                    </div>

                    {/* Edit Right */}
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="flex-shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white border border-slate-700 hover:bg-slate-800 rounded-sm transition-all"
                        >
                            Edit
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
