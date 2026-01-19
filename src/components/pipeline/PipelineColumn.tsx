import type { Stage, PipelineItem } from '../../types/pipeline';
import PipelineCard from './PipelineCard';

interface PipelineColumnProps {
    stage: Stage;
    items: PipelineItem[];
    onItemClick?: (item: PipelineItem) => void;
}

export default function PipelineColumn({ stage, items, onItemClick }: PipelineColumnProps) {
    // Determine header border color based on stage configuration or default
    // We can map generic color names to tailwind classes if needed, or use inline styles for custom hex
    const borderColorMap: Record<string, string> = {
        'gray': 'border-t-slate-400',
        'blue': 'border-t-blue-500',
        'purple': 'border-t-purple-500',
        'orange': 'border-t-orange-500',
        'yellow': 'border-t-yellow-500',
        'green': 'border-t-green-500',
        'darkred': 'border-t-red-800',
    };

    const headerBorderClass = borderColorMap[stage.color] || 'border-t-slate-300';

    return (
        <div className="flex flex-col h-full min-w-[260px] w-[260px] bg-slate-50/50 rounded-lg shrink-0">
            {/* Header */}
            <div className={`p-3 border-t-4 ${headerBorderClass} bg-white rounded-t-lg shadow-sm mb-2`}>
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-sm tracking-wide uppercase">
                        {stage.label}
                    </h3>
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {items.length}
                    </span>
                </div>
            </div>

            {/* Scrollable Card Area */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
                {items.map(item => (
                    <PipelineCard
                        key={item.id}
                        item={item}
                        color={stage.color} // Pass stage color map or raw string
                        onClick={onItemClick}
                    />
                ))}

                {items.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg m-2">
                        <span className="text-xs text-slate-400 font-medium">Empty Stage</span>
                    </div>
                )}
            </div>
        </div>
    );
}
