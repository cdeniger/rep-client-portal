
import React from 'react';
import type { StageChangeActivity } from '../../../types/activities';
import { ArrowRight, GitCommit } from 'lucide-react';

export default function StageChangeCard({ activity }: { activity: StageChangeActivity }) {
    const { fromStage, toStage, pipelineKey } = activity.metadata;

    return (
        <div className="relative flex items-center justify-center py-4">
            {/* Thread Line Extension */}
            <div className="absolute top-0 bottom-0 left-8 w-px bg-stone-200 -z-10"></div>

            <div className="bg-stone-50 border border-stone-200 rounded-full px-4 py-1.5 flex items-center gap-3 shadow-sm z-10 text-xs font-medium text-stone-600">
                <GitCommit size={14} className="text-stone-400" />
                <span>
                    Moved to <span className="text-stone-900 font-bold">{toStage}</span>
                </span>
                <span className="text-stone-400 text-[10px] uppercase">{pipelineKey?.replace('_', ' ')}</span>
                <span className="text-stone-300 ml-2">
                    {activity.performedAt?.toDate().toLocaleDateString()}
                </span>
            </div>
        </div>
    );
}
