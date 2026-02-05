import React from 'react';
import { DollarSign, Briefcase, User, FileText, Zap } from 'lucide-react';
import type { Application } from '../../types/schema';

// Helper Components
const DetailSection = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: any }) => (
    <div className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Icon size={14} className="text-slate-500" />
            {title}
        </h3>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            {children}
        </div>
    </div>
);

const Field = ({ label, value }: { label: string; value?: string }) => {
    if (!value) return null;
    return (
        <div className="mb-3 last:mb-0">
            <span className="text-slate-500 text-xs block mb-1 uppercase tracking-wide">{label}</span>
            <span className="text-slate-800 font-medium text-sm">{value}</span>
        </div>
    );
};

export const ApplicationContextPanel = ({ application }: { application: Application }) => {
    return (
        <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
            {/* Header / Summary */}
            <div className="mb-6 pb-6 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-lg mb-1">{application.fullName}</h4>
                <div className="text-slate-500 text-sm flex items-center gap-2">
                    <Briefcase size={12} />
                    Candidate
                </div>
            </div>

            {/* Ideal Target - Priority Display */}
            {application.idealTarget && (
                <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-2">
                        <Briefcase size={14} />
                        Ideal Job Target
                    </h3>
                    <div className="bg-emerald-50/50 rounded-lg p-4 border border-emerald-100/50 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                        {application.idealTarget}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mb-8">
                {application.linkedinUrl && (
                    <a
                        href={application.linkedinUrl.startsWith('http') ? application.linkedinUrl : `https://${application.linkedinUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 rounded-md text-xs font-bold text-slate-600 transition-all shadow-sm"
                    >
                        <User size={14} />
                        LinkedIn
                    </a>
                )}
                {application.resumeUrl && (
                    <a
                        href={application.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:border-oxford-green hover:text-oxford-green rounded-md text-xs font-bold text-slate-600 transition-all shadow-sm"
                    >
                        <FileText size={14} />
                        Resume
                    </a>
                )}
            </div>

            <div className="space-y-6">
                <DetailSection title="Compensation" icon={DollarSign}>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Current" value={application.currentSalary} />
                        <Field label="Target" value={application.targetComp} />
                    </div>
                </DetailSection>

                <DetailSection title="Experience & Status" icon={Briefcase}>
                    <Field label="Years Experience" value={application.experience} />
                    <Field label="Employment Status" value={application.employmentStatus} />
                </DetailSection>

                <DetailSection title="Motivation" icon={Zap}>
                    <Field label="Primary Motivation" value={application.primaryMotivation} />
                    <Field label="Velocity" value={application.pipelineVelocity} />
                </DetailSection>

                <DetailSection title="Contact Info" icon={User}>
                    <Field label="Email" value={application.email} />
                    <Field label="Phone" value={application.phone} />
                </DetailSection>
            </div>
        </div>
    );
};
