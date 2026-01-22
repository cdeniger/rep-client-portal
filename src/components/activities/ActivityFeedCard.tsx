
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
    Coffee,
    Building2,
    User,
    Briefcase
} from 'lucide-react';
import type {
    Activity,
    ActivityDefinition,
    InterviewActivity,
    StageChangeActivity,
    CallActivity,
    EmailActivity
} from '../../types/activities';

// --- Icon Mapping ---
const ICON_MAP: Record<string, any> = {
    'phone': Phone,
    'mail': Mail,
    'calendar': Calendar,
    'note': StickyNote,
    'users': Users,
    'coffee': Coffee,
    'default': ActivityIcon
};

// --- Helper: Duration Formatter ---
const formatDuration = (minutes?: number) => {
    if (minutes === undefined || minutes === null || isNaN(minutes)) return null;
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// --- Helper: Outcome Badge Color ---
const getOutcomeColor = (outcome?: string) => {
    if (!outcome) return 'bg-slate-100 text-slate-600'; // Default
    const lower = outcome.toLowerCase();
    if (lower.includes('connected') || lower.includes('positive') || lower.includes('offer')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (lower.includes('voicemail') || lower.includes('no answer')) return 'bg-slate-100 text-slate-500 border-slate-200';
    if (lower.includes('rejected') || lower.includes('lost')) return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-blue-50 text-blue-700 border-blue-100';
};

interface ActivityFeedCardProps {
    activity: Activity;
    definition?: ActivityDefinition;
    isLastInGroup?: boolean; // For timeline connector styling
    onClick?: (activity: Activity) => void;
}

export default function ActivityFeedCard({ activity, definition, isLastInGroup, onClick }: ActivityFeedCardProps) {
    const color = definition?.color || '#94a3b8'; // default slate-400
    const IconComponent = definition?.icon && ICON_MAP[definition.icon] ? ICON_MAP[definition.icon] : ActivityIcon;

    // Safety check for NaN in duration

    // --- Content Renderers ---

    const renderHeader = () => {
        switch (activity.type) {
            case 'stage_change':
                const sc = activity as StageChangeActivity;
                return (
                    <div className="flex items-center flex-wrap gap-2">
                        <span className="font-semibold text-slate-600">{sc.metadata.fromStage}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {sc.metadata.toStage}
                        </span>
                    </div>
                );
            case 'call':
                const call = activity as CallActivity;
                const outcome = call.metadata.outcome;
                const duration = formatDuration(call.metadata.durationMinutes);

                return (
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Call Logged</span>
                        {outcome && (
                            <span className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded border ${getOutcomeColor(outcome)}`}>
                                {outcome}
                            </span>
                        )}
                        {duration && (
                            <span className="text-xs text-slate-400 font-medium ml-1">
                                • {duration}
                            </span>
                        )}
                    </div>
                );
            case 'interview':
                const interview = activity as InterviewActivity;
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Interview</span>
                        <span className="text-sm text-slate-500 font-medium px-2 py-0.5 bg-slate-50 rounded">
                            {interview.metadata.round}
                        </span>
                        {interview.metadata.rating && (
                            <div className="flex items-center gap-0.5 ml-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-3.5 h-3.5 ${i < (interview.metadata.rating || 0) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'email':
                const email = activity as EmailActivity;
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                            {email.metadata.direction === 'inbound' ? 'Email Received' : 'Email Sent'}
                        </span>
                        <span className="text-xs text-slate-400 truncate max-w-[200px]">
                            • {email.metadata.subject}
                        </span>
                    </div>
                );
            default:
                return (
                    <span className="font-bold text-slate-900">
                        {definition?.label || activity.type}
                    </span>
                );
        }
    };

    const renderContext = () => {
        // Use denormalized names if available, falling back to Generic chips
        const assoc = activity.associations || {};
        const hasContext = assoc.companyId || assoc.contactId || assoc.pursuitId || assoc.targetId;

        if (!hasContext) return null;

        return (
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                {assoc.contactId && (
                    <div className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer select-none">
                        <User className="w-3 h-3" />
                        <span>{assoc.contactName || 'Contact'}</span>
                    </div>
                )}

                {assoc.companyId && (
                    <div className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer select-none">
                        <Building2 className="w-3 h-3" />
                        <span>{assoc.companyName || 'Company'}</span>
                    </div>
                )}

                {(assoc.pursuitId || assoc.targetId) && (
                    <div className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer text-indigo-500 font-medium select-none">
                        <Briefcase className="w-3 h-3" />
                        <span>{assoc.pursuitTitle || assoc.targetTitle || 'Job Pursuit'}</span>
                    </div>
                )}
            </div>
        )
    }

    // --- Main Layout ---
    return (
        <div className="flex gap-4 group">
            {/* Timeline Spine */}
            <div className="flex flex-col items-center shrink-0 w-10 relative">
                {/* Icon Circle */}
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white relative z-10 shadow-sm transition-transform group-hover:scale-105"
                    style={{ borderColor: color, color: color }}
                >
                    <IconComponent className="w-5 h-5" />
                </div>
                {/* Vertical Line */}
                {!isLastInGroup && (
                    <div className="w-0.5 bg-slate-200 absolute top-10 bottom-[-16px] -z-0" />
                )}
            </div>

            {/* Card Body */}
            <div
                onClick={() => onClick && onClick(activity)}
                className={`flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4 transition-all hover:shadow-md hover:border-slate-300 ${onClick ? 'cursor-pointer' : ''} relative overflow-hidden`}
            >
                {/* Top Strip (Color Code) */}
                <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: color, opacity: 0.5 }} />

                <div className="ml-2">
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex flex-col">
                            {renderHeader()}
                            {renderContext()}
                        </div>
                        <span className="text-xs font-semibold text-slate-400 whitespace-nowrap ml-4">
                            {format(activity.performedAt.toDate(), 'h:mm a')}
                        </span>
                    </div>

                    {/* Notes / Body */}
                    {activity.notes && (
                        <div className="mt-3 text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-2 rounded border border-slate-100/50">
                            {activity.notes}
                        </div>
                    )}

                    {/* Dynamic Fields (if any significant ones remain) */}

                </div>

                {/* Hover Action visual cue */}
                {onClick && (
                    <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded">
                            Edit
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
