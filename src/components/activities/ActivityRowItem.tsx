import { format } from 'date-fns';
import {
    Phone,
    Mail,
    Calendar,
    StickyNote,
    ArrowRight,
    Star,
    Activity as ActivityIcon,
    Users,
    Coffee
} from 'lucide-react';
import type {
    Activity,
    ActivityDefinition,
    InterviewActivity,
    StageChangeActivity,
    CallActivity,
    EmailActivity
} from '../../types/activities';

// Map string icon names to Lucide components
const ICON_MAP: Record<string, any> = {
    'phone': Phone,
    'mail': Mail,
    'calendar': Calendar,
    'note': StickyNote,
    'users': Users,
    'coffee': Coffee,
    'default': ActivityIcon
};

interface ActivityRowItemProps {
    activity: Activity;
    definition?: ActivityDefinition;
    onClick?: (activity: Activity) => void;
}

export default function ActivityRowItem({ activity, definition, onClick }: ActivityRowItemProps) {
    const color = definition?.color || '#cbd5e1'; // default slate-300
    const IconComponent = definition?.icon && ICON_MAP[definition.icon] ? ICON_MAP[definition.icon] : ActivityIcon;

    // --- Dynamic Content Renderers ---

    const renderStageChange = (act: StageChangeActivity) => (
        <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="font-medium text-slate-500">{act.metadata.fromStage}</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-900">{act.metadata.toStage}</span>
        </div>
    );

    const renderInterview = (act: InterviewActivity) => (
        <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900 text-sm">{act.metadata.round}</span>
            {act.metadata.rating && (
                <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">
                    <Star className="w-3 h-3 fill-current" />
                    {act.metadata.rating}/5
                </div>
            )}
        </div>
    );

    const renderCall = (act: CallActivity) => (
        <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-900">{act.metadata.outcome || "Call"}</span>
            {act.metadata.durationMinutes && (
                <span className="text-slate-500 text-xs">• {act.metadata.durationMinutes}m</span>
            )}
        </div>
    );

    const renderEmail = (act: EmailActivity) => (
        <div className="flex items-center gap-2 text-sm">
            <span className={`text-xs px-1.5 py-0.5 rounded ${act.metadata.direction === 'inbound' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'} uppercase font-bold tracking-wide`}>
                {act.metadata.direction}
            </span>
            <span className="text-slate-700 truncate max-w-[300px]">{act.metadata.subject}</span>
        </div>
    );

    const renderDefault = (act: Activity) => (
        <span className="text-sm text-slate-600 italic">
            {(act as any).notes || "No details provided"}
        </span>
    );

    // --- Dynamic Field Renderer (Zone B) ---
    const renderDynamicFields = () => {
        if (!definition || !definition.fields || definition.fields.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-2 mt-1">
                {definition.fields.map(field => {
                    const val = (activity.metadata as any)?.[field.key];
                    if (val === undefined || val === null || val === '') return null;

                    // Skip Core Fields that are already rendered by specific renderers
                    if (['round', 'rating', 'interviewers', 'outcome', 'durationMinutes', 'subject', 'recipientEmail', 'direction', 'pipelineKey', 'fromStage', 'toStage'].includes(field.key)) {
                        return null;
                    }

                    if (field.type === 'boolean') {
                        return val ? (
                            <span key={field.key} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                                {field.label}
                            </span>
                        ) : null;
                    }

                    if (field.type === 'rating') {
                        return (
                            <div key={field.key} className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold border border-yellow-100">
                                <span className="text-[10px] uppercase tracking-wide opacity-75">{field.label}:</span>
                                <Star className="w-3 h-3 fill-current" />
                                {val}
                            </div>
                        );
                    }

                    // Default (Text, Select, Number)
                    return (
                        <div key={field.key} className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            <span className="font-semibold text-slate-500">{field.label}:</span>
                            <span className="font-medium text-slate-800">{String(val)}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // --- Main Render Switch ---

    const renderContent = () => {
        switch (activity.type) {
            case 'stage_change': return renderStageChange(activity as StageChangeActivity);
            case 'interview': return renderInterview(activity as InterviewActivity);
            case 'call': return renderCall(activity as CallActivity);
            case 'email': return renderEmail(activity as EmailActivity);
            default: return renderDefault(activity);
        }
    };

    return (
        <div
            onClick={() => onClick && onClick(activity)}
            className={`flex items-center gap-4 py-3 px-4 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
        >
            {/* Colored Stripe */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: color }}
            />

            {/* Time */}
            <div className="flex flex-col items-end w-16 shrink-0 pl-2">
                <span className="text-xs font-bold text-slate-700">
                    {format(activity.performedAt.toDate(), 'h:mm a')}
                </span>
            </div>

            {/* Icon */}
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-slate-500">
                <IconComponent className="w-4 h-4" style={{ color: color }} />
            </div>

            {/* Dynamic Content Zone */}
            <div className="flex-1 min-w-0">
                {renderContent()}
                {renderDynamicFields()}
            </div>

            {/* Associations (Context) - Simple version for now */}
            <div className="hidden sm:flex text-xs text-slate-400 gap-2">
                {/*  We could render chips here for Contact/Company if available */}
            </div>

        </div>
    );
}
