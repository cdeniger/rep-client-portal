import { useMemo } from 'react';
import type { PipelineItem } from '../../types/pipeline';
import { PIPELINE_DEFS } from '../../config/pipelines';
import PipelineColumn from './PipelineColumn';

interface PipelineBoardProps {
    definitionId: string;
    items: PipelineItem[];
    onItemClick?: (item: PipelineItem) => void;
}

export default function PipelineBoard({ definitionId, items, onItemClick }: PipelineBoardProps) {
    const definition = PIPELINE_DEFS[definitionId];

    if (!definition) {
        return (
            <div className="p-8 text-center text-slate-400">
                Error: Pipeline definition "{definitionId}" not found.
            </div>
        );
    }

    // Group items by stageId for efficient rendering
    const itemsByStage = useMemo(() => {
        const groups: Record<string, PipelineItem[]> = {};
        definition.stages.forEach(stage => {
            groups[stage.id] = [];
        });

        items.forEach(item => {
            if (groups[item.stageId]) {
                groups[item.stageId].push(item);
            } else {
                // Fallback for orphaned items or mismatched stages
                console.warn(`Item ${item.id} has unknown stageId ${item.stageId}`);
            }
        });

        // Sort items by index
        Object.keys(groups).forEach(stageId => {
            groups[stageId].sort((a, b) => a.index - b.index);
        });

        return groups;
    }, [items, definition]);

    return (
        <div className="flex flex-col h-auto bg-slate-50/30">
            {/* Board Header - Simplified */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white">
                <h1 className="text-xl font-bold text-slate-800">{definition.label}</h1>
                <div className="text-sm text-slate-500 mt-1">
                    {items.length} Total Items
                </div>
            </div>

            {/* Scrolling Columns Container */}
            <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                <div className="flex h-auto items-start p-4 gap-4 min-w-max">
                    {definition.stages
                        .filter(stage => !['placed', 'closed_won'].includes(stage.id))
                        .map(stage => (
                            <PipelineColumn
                                key={stage.id}
                                stage={stage}
                                items={itemsByStage[stage.id] || []}
                                onItemClick={onItemClick}
                            />
                        ))}
                </div>
            </div>
        </div>
    );
}
