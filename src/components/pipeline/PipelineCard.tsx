import { Building2, Linkedin, DollarSign } from 'lucide-react';
import type { PipelineItem, Lead, JobPursuit } from '../../types/pipeline';

interface PipelineCardProps {
    item: PipelineItem;
    color: string; // The stage color from config, passed down for borders/accents if needed
    onClick?: (item: PipelineItem) => void;
}

// Map generic config colors to specific Tailwind-like hex values for the stripe
const COLOR_MAP: Record<string, string> = {
    'gray': '#94a3b8', // slate-400
    'blue': '#3b82f6', // blue-500
    'purple': '#a855f7', // purple-500
    'orange': '#f97316', // orange-500
    'yellow': '#eab308', // yellow-500
    'green': '#22c55e', // green-500
    'darkred': '#991b1b', // red-800
};

export default function PipelineCard({ item, color, onClick }: PipelineCardProps) {
    const isLead = (item: PipelineItem): item is Lead => (item as Lead).type === 'lead';
    const isJob = (item: PipelineItem): item is JobPursuit => (item as JobPursuit).type === 'job_pursuit';

    const stripeColor = COLOR_MAP[color] || color;

    const renderLeadContent = (lead: Lead) => (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{lead.firstName} {lead.lastName}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{lead.company}</span>
                    </div>
                </div>
                {/* Fit Score Badge */}
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${lead.fitScore >= 80 ? 'bg-green-100 text-green-700' :
                    lead.fitScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-600'
                    }`}>
                    {lead.fitScore}
                </div>
            </div>

            <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide text-slate-600">
                        {lead.source}
                    </span>
                </div>
                {lead.linkedinUrl && (
                    <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                )}
            </div>
        </div>
    );

    const renderJobContent = (job: JobPursuit) => (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{job.roleTitle}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate max-w-[140px]">{job.companyName}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-50">
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                    <DollarSign className="w-3 h-3 text-slate-400" />
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 3 }).format(job.dealValue)}
                </div>
                {job.offerDetails && (
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${job.offerDetails.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        'bg-blue-50 text-blue-600'
                        }`}>
                        {job.offerDetails.status}
                    </span>
                )}
            </div>
            {/* If no offer yet, show current interview round */}
            {!job.offerDetails && job.interviewRound && (
                <div className="text-[10px] text-slate-400 font-medium">
                    Round: {job.interviewRound}
                </div>
            )}
        </div>
    );

    return (
        <div
            onClick={() => onClick && onClick(item)}
            className={`
                group relative bg-white rounded-lg border border-slate-200 shadow-sm p-3 
                hover:shadow-md hover:border-slate-300 transition-all cursor-pointer overflow-hidden
            `}
        >
            <div
                className="absolute left-0 top-0 bottom-0 w-1 transition-colors"
                style={{ backgroundColor: stripeColor }}
            />

            <div className="pl-2">
                {isLead(item) && renderLeadContent(item)}
                {isJob(item) && renderJobContent(item)}

                <div className="mt-2 flex justify-end">
                    <span className="text-[10px] text-slate-300">
                        {/* Fallback for createdAt timestamp logic needed depending on if it is Firestore Timestamp or string */}
                        {/* Assuming string for now or robust check in real app */}
                        updated just now
                    </span>
                </div>
            </div>
        </div>
    );
}
