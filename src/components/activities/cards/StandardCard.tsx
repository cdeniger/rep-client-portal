
import React from 'react';
import type { Activity } from '../../../types/activities';
import { Phone, Mail, FileText } from 'lucide-react';

const ICONS: Record<string, React.ReactNode> = {
    call: <Phone size={16} />,
    email: <Mail size={16} />,
    note: <FileText size={16} />,
    default: <FileText size={16} />
};

export default function StandardCard({ activity }: { activity: Activity }) {
    const icon = ICONS[activity.type] || ICONS['default'];

    // Check for common metadata
    const meta = (activity as any).metadata || {};
    const hasMeta = Object.keys(meta).length > 0;

    return (
        <div className="flex gap-4 p-4 bg-white border border-stone-200 rounded-lg shadow-sm hover:border-stone-300 transition-colors">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500">
                {icon}
            </div>

            <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-stone-900 capitalize">
                        {activity.type}
                        {meta.outcome && <span className="ml-2 font-normal text-stone-500">- {meta.outcome}</span>}
                    </h4>
                    <span className="text-xs text-stone-400">
                        {activity.performedAt?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                </div>

                {activity.notes && (
                    <p className="text-sm text-stone-600 whitespace-pre-wrap">{activity.notes}</p>
                )}

                {hasMeta && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {Object.entries(meta).map(([key, val]) => {
                            if (key === 'outcome') return null; // handled in title
                            return (
                                <div key={key} className="px-2 py-1 bg-stone-50 rounded border border-stone-100 text-xs text-stone-500 font-mono">
                                    <span className="font-bold text-stone-400 mr-1">{key}:</span>
                                    {String(val)}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
