import React, { useState } from 'react';
import { X, ExternalLink, Calendar, DollarSign, Briefcase, User, FileText, Zap, Shield } from 'lucide-react';
import type { Application } from '../../types/schema';
import AtsSimulatorModal from '../ats/AtsSimulatorModal';

interface ApplicationDetailsModalProps {
    application: Application;
    isOpen: boolean;
    onClose: () => void;
}

const DetailSection = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: any }) => (
    <div className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
            <Icon size={14} className="text-gray-500" />
            {title}
        </h3>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            {children}
        </div>
    </div>
);

const Field = ({ label, value }: { label: string; value?: string }) => {
    if (!value) return null;
    return (
        <div className="mb-3 last:mb-0">
            <span className="text-gray-400 text-sm block mb-1">{label}</span>
            <span className="text-gray-100 font-medium">{value}</span>
        </div>
    );
};

export const ApplicationDetailsModal: React.FC<ApplicationDetailsModalProps> = ({ application, isOpen, onClose }) => {
    const [showAtsSimulator, setShowAtsSimulator] = useState(false);

    if (!isOpen) return null;

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        // Handle Firestore Timestamp or Date string
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0B1120] w-full max-w-2xl max-h-[90vh] rounded-xl border border-gray-700 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-[#0B1120]">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            {application.fullName}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${application.status === 'new'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                }`}>
                                {application.status.toUpperCase()}
                            </span>
                        </h2>
                        <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                            <Calendar size={12} />
                            Submitted {formatDate(application.submittedAt)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Contact Info */}
                        <DetailSection title="Contact Information" icon={User}>
                            <Field label="Email" value={application.email} />
                            <Field label="Phone" value={application.phone} />
                            {application.linkedinUrl && (
                                <div className="mt-3 pt-3 border-t border-gray-700/50">
                                    <a
                                        href={application.linkedinUrl.startsWith('http') ? application.linkedinUrl : `https://${application.linkedinUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1.5"
                                    >
                                        View LinkedIn Profile <ExternalLink size={12} />
                                    </a>
                                </div>
                            )}
                        </DetailSection>

                        {/* Professional Standing */}
                        <DetailSection title="Current Standing" icon={Briefcase}>
                            <Field label="Current Experience" value={application.experience} />
                            <Field label="Current Status" value={application.employmentStatus} />
                        </DetailSection>
                    </div>

                    {/* Financials */}
                    <DetailSection title="Compensation Expectations" icon={DollarSign}>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Current Salary" value={application.currentSalary} />
                            <Field label="Target Compensation" value={application.targetComp} />
                        </div>
                    </DetailSection>

                    {/* Motivation */}
                    <DetailSection title="Motivation & Velocity" icon={Zap}>
                        <Field label="Primary Motivation" value={application.primaryMotivation} />
                        <div className="mt-4">
                            <Field label="Pipeline Velocity" value={application.pipelineVelocity} />
                        </div>
                    </DetailSection>

                    {/* Ideal Target */}
                    {application.idealTarget && (
                        <DetailSection title="Ideal Job Target" icon={Briefcase}>
                            <div className="text-gray-100 font-medium whitespace-pre-wrap text-sm leading-relaxed">
                                {application.idealTarget}
                            </div>
                        </DetailSection>
                    )}

                    {/* Resume & Actions */}
                    <div className="mt-6 flex justify-between items-center pt-6 border-t border-gray-800">
                        <div>
                            {/* Placeholder for future left-side actions */}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowAtsSimulator(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-signal-orange text-gray-200 hover:text-white rounded-lg text-sm font-bold tracking-wide transition-all group"
                            >
                                <Shield size={16} className="text-gray-400 group-hover:text-signal-orange transition-colors" />
                                Run ATS Audit
                            </button>

                            {application.resumeUrl && (
                                <a
                                    href={application.resumeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-oxford-green hover:bg-opacity-90 border border-transparent rounded-lg text-sm font-bold text-white transition-all shadow-md hover:shadow-lg"
                                >
                                    <FileText size={16} />
                                    View PDF
                                </a>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* ATS Simulator Modal */}
            <AtsSimulatorModal
                isOpen={showAtsSimulator}
                onClose={() => setShowAtsSimulator(false)}
                application={application}
            />
        </div>
    );
};
