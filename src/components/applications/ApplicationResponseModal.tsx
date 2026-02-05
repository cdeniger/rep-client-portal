import { useState } from 'react';
import { X, Send, AlertCircle, Loader, PanelRightClose, PanelRightOpen, Wand2, Sparkles } from 'lucide-react';
import { EmailComposer } from '../../components/email/EmailComposer';
import { ApplicationContextPanel } from './ApplicationContextPanel';
import { functions } from '../../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { useUserProfile } from '../../hooks/useUserProfile';
import type { Application } from '../../types/schema';
import clsx from 'clsx';

interface ApplicationResponseModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: Application;
}

export const ApplicationResponseModal = ({ isOpen, onClose, application }: ApplicationResponseModalProps) => {
    const { userProfile: profile } = useUserProfile();
    const [subject, setSubject] = useState(`Re: Your application to Rep.`);
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showContext, setShowContext] = useState(true);

    // AI State
    const [draftIntent, setDraftIntent] = useState<'connect' | 'clarify' | 'reject'>('connect');
    const [advisorName, setAdvisorName] = useState(profile?.profile?.name || 'Rep Advisor');
    const [advisorEmail, setAdvisorEmail] = useState(() => {
        const name = profile?.profile?.name;
        if (name === 'Jordan Wolf') return 'Jordan@repteam.com';
        if (name === 'Patrick Deniger') return 'Patrick@repteam.com';
        return 'team@repteam.com';
    });
    const [isDrafting, setIsDrafting] = useState(false);

    if (!isOpen) return null;

    const handleAutoDraft = async () => {
        setIsDrafting(true);
        setError('');

        try {
            const draftFn = httpsCallable(functions, 'generateApplicationDraft');
            const result: any = await draftFn({
                candidateName: application.fullName,
                role: '', // Application schema lacks currentRole
                company: '', // Application schema lacks currentCompany
                intent: draftIntent,
                advisorName: advisorName, // Use selected advisor

                // Context passthrough
                motivation: application.primaryMotivation,
                idealTarget: application.idealTarget,
                experience: application.experience,
                currentSalary: application.currentSalary,
                targetComp: application.targetComp,
                pipelineVelocity: application.pipelineVelocity,
                employmentStatus: application.employmentStatus
            });

            if (result.data.success && result.data.draft) {
                // Append Standardized Signature
                const signature = `
<br>
<p style="margin-bottom: 0px;">Best,</p>
<br>
<p style="margin-bottom: 0px;"><strong>${advisorName}</strong></p>
<p style="margin-bottom: 0px;">Rep. | Professionally Represented</p>
<p style="margin-bottom: 0px;"><a href="https://www.repteam.com" style="color: #4f46e5; text-decoration: none;">www.repteam.com</a></p>
`;
                setBody(result.data.draft + signature);
            }

        } catch (err: any) {
            console.error("AI Draft Failed:", err);
            setError("Failed to generate draft. Please try again.");
        } finally {
            setIsDrafting(false);
        }
    };

    const handleSend = async () => {
        setSending(true);
        setError('');

        try {
            const sendFn = httpsCallable(functions, 'sendApplicationResponse');
            await sendFn({
                applicationId: application.id,
                candidateEmail: application.email,
                subject,
                htmlBody: body,
                advisorName: advisorName, // Use the selected name for the actual email too? Or just AI? User asked for AI context.
                advisorEmail: advisorEmail || profile?.email
            });

            // ... (rest of handleSend)


            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false); // Reset for next time
            }, 2000);

        } catch (err: any) {
            console.error("Failed to send email:", err);
            setError(err.message || "Failed to send email. Please try again.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={clsx(
                "bg-white rounded-xl shadow-2xl flex flex-col max-h-[95vh] transition-all duration-300",
                showContext ? "w-[90vw] max-w-6xl" : "w-full max-w-2xl"
            )}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white rounded-t-xl z-10">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold text-slate-800">Reply to Candidate</h3>
                        <button
                            onClick={() => setShowContext(!showContext)}
                            className="text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1.5 text-xs font-medium border border-slate-200 rounded-md px-2 py-1"
                            title={showContext ? "Hide Context Panel" : "Show Candidate Details"}
                        >
                            {showContext ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                            {showContext ? "Hide Details" : "Show Details"}
                        </button>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Application Context (Collapsible) */}
                    <div className={clsx(
                        "transition-all duration-300 overflow-hidden bg-slate-50 border-r border-slate-200",
                        showContext ? "w-1/3 min-w-[320px] p-6 opacity-100" : "w-0 opacity-0 border-r-0"
                    )}>
                        <div className={clsx("min-w-[320px] h-full", !showContext && "hidden")}>
                            <ApplicationContextPanel application={application} />
                        </div>
                    </div>

                    {/* Right: Email Composer */}
                    <div className="flex-1 flex flex-col min-w-0 bg-white">
                        <div className="p-6 flex-1 overflow-y-auto space-y-4">

                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            {success ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-12">
                                    <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                        <Send size={32} />
                                    </div>
                                    <h4 className="text-2xl font-bold text-slate-800 mb-2">Email Sent!</h4>
                                    <p className="text-slate-500">The candidate has been notified successfully.</p>
                                </div>
                            ) : (
                                <>
                                    {/* AI Toolbar */}
                                    <div className="flex items-center justify-between bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-indigo-100 p-1.5 rounded-md text-indigo-600">
                                                <Wand2 size={16} />
                                            </div>
                                            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">AI Assistant</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Advisor Name/Selector */}
                                            {/* Advisor Name/Selector */}
                                            <select
                                                value={advisorName}
                                                onChange={(e) => {
                                                    const selected = e.target.value;
                                                    setAdvisorName(selected);
                                                    // Map specific emails if needed, otherwise defaults
                                                    if (selected === 'Jordan Wolf') setAdvisorEmail('Jordan@repteam.com');
                                                    else if (selected === 'Patrick Deniger') setAdvisorEmail('Patrick@repteam.com');
                                                    else setAdvisorEmail('team@repteam.com');
                                                }}
                                                className="text-xs border-indigo-200 rounded-md py-1.5 pl-2 pr-8 text-indigo-800 bg-white focus:ring-indigo-500 focus:border-indigo-500 min-w-[140px]"
                                                disabled={isDrafting}
                                            >
                                                <option value="Patrick Deniger">Patrick Deniger</option>
                                                <option value="Jordan Wolf">Jordan Wolf</option>
                                                <option value="Rep Team">Rep Team</option>
                                            </select>

                                            <select
                                                value={draftIntent}
                                                onChange={(e) => setDraftIntent(e.target.value as any)}
                                                className="text-xs border-indigo-200 rounded-md py-1.5 pl-2 pr-8 text-indigo-800 bg-white focus:ring-indigo-500 focus:border-indigo-500"
                                                disabled={isDrafting}
                                            >
                                                <option value="connect">Connect (Intro Call)</option>
                                                <option value="clarify">Clarify (Ask Info)</option>
                                                <option value="reject">Reject (Keep on File)</option>
                                            </select>

                                            <button
                                                onClick={handleAutoDraft}
                                                disabled={isDrafting}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md transition-all shadow-sm disabled:opacity-50"
                                            >
                                                {isDrafting ? <Loader className="animate-spin" size={12} /> : <Sparkles size={12} />}
                                                {isDrafting ? 'Drafting...' : 'Auto-Draft'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Metadata Fields */}
                                    <div className="grid gap-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm text-sm">
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-500 w-12 font-medium text-right text-xs uppercase tracking-wide">To:</span>
                                            <span className="text-slate-900 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                {application.fullName} &lt;{application.email}&gt;
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-500 w-12 font-medium text-right text-xs uppercase tracking-wide">Subj:</span>
                                            <input
                                                type="text"
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                                className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-slate-900 font-bold placeholder-slate-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Editor Area */}
                                    <div className="flex-1 flex flex-col min-h-[300px] relative">
                                        {isDrafting && (
                                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader className="animate-spin text-indigo-500" size={24} />
                                                    <span className="text-xs font-medium text-indigo-600">Consulting Elite Recruiter Agent...</span>
                                                </div>
                                            </div>
                                        )}
                                        <EmailComposer
                                            key={body} // Force re-render on AI draft
                                            initialContent={body}
                                            onUpdate={setBody}
                                            placeholder="Write your email here... Supports Markdown-style shortcuts."
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer Actions */}
                        {!success && (
                            <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 z-10 sticky bottom-0">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !body || !subject}
                                    className="flex items-center gap-2 px-6 py-2 bg-oxford-green hover:bg-[#0a1e15] text-white rounded-lg font-bold shadow-lg shadow-emerald-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sending ? <Loader className="animate-spin" size={16} /> : <Send size={16} />}
                                    {sending ? 'Sending...' : 'Send Email'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
