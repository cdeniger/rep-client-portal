
import React from 'react';
import type { Activity } from '../../types/activities';
import InterviewCard from './cards/InterviewCard';
import StageChangeCard from './cards/StageChangeCard';
import StandardCard from './cards/StandardCard';

interface ActivityCardFactoryProps {
    activity: Activity;
    onEdit?: (activity: Activity) => void;
}

export default function ActivityCardFactory({ activity, onEdit }: ActivityCardFactoryProps) {
    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onEdit) onEdit(activity);
    };

    let content: React.ReactNode;

    switch (activity.type) {
        case 'interview':
            content = <InterviewCard activity={activity as any} />;
            break;
        case 'stage_change':
            // Stage Change is often specific visual, but we might wrap it differently 
            // if we want it to handle edit cleanly. For now, render direct.
            content = <StageChangeCard activity={activity as any} />;
            break;
        default:
            content = <StandardCard activity={activity} />;
            break;
    }

    // Wrap in interactive container if editable
    if (onEdit) {
        return (
            <div onClick={handleEdit} className="cursor-pointer group relative">
                {content}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-xs bg-white border border-stone-200 px-2 py-1 rounded shadow-sm hover:bg-stone-50 text-stone-500">
                        Edit
                    </button>
                </div>
            </div>
        );
    }

    return <>{content}</>;
}
