import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import type { AtsSimulation, AtsScorecardLayer } from '../../types/schema';
import { AlertCircle, XCircle, Shield, Eye, FileText, ChevronDown, ChevronUp, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Application } from '../../types/schema';

interface AtsSimulatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    application?: Application; // Optional Context
    userId?: string;
}

export default function AtsSimulatorModal({ isOpen, onClose, application, userId }: AtsSimulatorModalProps) {
    const [targetRoleRaw, setTargetRoleRaw] = useState('');
    const [resumeTextRaw, setResumeTextRaw] = useState('');
    const [resumeSource, setResumeSource] = useState<'text' | 'pdf_url'>('text');
    const [loading, setLoading] = useState(false);
    const [simulation, setSimulation] = useState<AtsSimulation | null>(null);
    const [error, setError] = useState('');
    const [showFullRawText, setShowFullRawText] = useState(false);

    // Pre-fill from Context
    React.useEffect(() => {
        if (application?.idealTarget) {
            setTargetRoleRaw(application.idealTarget);
        }
        if (application?.resumeUrl) {
            setResumeSource('pdf_url');
        }
    }, [application]);

    const runSimulation = async () => {
        setLoading(true);
        setError('');
        setSimulation(null);
        setShowFullRawText(false);

        try {
            const runSim = httpsCallable(functions, 'runAtsSimulation');
            const payload: any = {
                targetRoleRaw: targetRoleRaw,
                userId: userId,
                applicationId: application?.id,
                targetComp: application?.targetComp || application?.currentSalary
            };

            if (resumeSource === 'pdf_url' && application?.resumeUrl) {
                payload.resumeUrl = application.resumeUrl;
            } else {
                if (!resumeTextRaw.trim()) throw new Error("Resume content is missing.");
                payload.resumeText = resumeTextRaw;
            }
            const result = await runSim(payload);
            setSimulation(result.data as AtsSimulation);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Simulation Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Rep. Signal-Audit™ ATS Simulator"
            maxWidth="max-w-7xl"
        >
            <div className="flex flex-col h-[80vh]">
                {!simulation && (
                    <div className="grid grid-cols-2 gap-4 mb-4 shrink-0 transition-all duration-300">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Target Job Description</label>
                            <textarea
                                className="w-full h-24 p-2 text-xs bg-gray-50 border border-gray-200 rounded font-mono focus:border-signal-orange outline-none resize-none"
                                placeholder="Paste the full job description here..."
                                value={targetRoleRaw}
                                onChange={(e) => setTargetRoleRaw(e.target.value)}
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-bold uppercase text-gray-400">Resume Content</label>
                                {application?.resumeUrl && (
                                    <button
                                        onClick={() => setResumeSource(prev => prev === 'pdf_url' ? 'text' : 'pdf_url')}
                                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                                    >
                                        {resumeSource === 'pdf_url' ? 'Switch to Manual Paste' : 'Use Attached PDF'}
                                    </button>
                                )}
                            </div>

                            {resumeSource === 'pdf_url' ? (
                                <div className="w-full h-24 p-4 text-xs bg-blue-900/10 border border-blue-500/30 rounded font-mono text-blue-300 flex flex-col items-center justify-center gap-2">
                                    <FileText className="w-6 h-6 text-blue-400" />
                                    <span>PDF LINKED: {application?.resumeUrl?.split('/').pop()?.split('?')[0].slice(0, 30)}...</span>
                                    <span className="text-gray-500 text-[10px]">Server will ingest directly</span>
                                </div>
                            ) : (
                                <textarea
                                    className="w-full h-24 p-2 text-xs bg-gray-50 border border-gray-200 rounded font-mono focus:border-signal-orange outline-none resize-none"
                                    placeholder="Paste the resume content here..."
                                    value={resumeTextRaw}
                                    onChange={(e) => setResumeTextRaw(e.target.value)}
                                />
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-end mb-4 shrink-0">
                    {!simulation && (
                        <button
                            onClick={runSimulation}
                            disabled={loading}
                            className="bg-oxford-green text-white px-6 py-2 rounded text-sm font-bold tracking-wide hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? 'ANALYZING...' : 'RUN FORENSIC AUDIT'}
                            {!loading && <Shield className="w-4 h-4" />}
                        </button>
                    )}
                    {simulation && (
                        <button
                            onClick={() => setSimulation(null)}
                            className="text-xs text-gray-400 hover:text-gray-600 underline"
                        >
                            Start New Simulation
                        </button>
                    )}
                </div>

                {error && (
                    <div className="p-3 mb-4 bg-red-50 text-red-700 text-sm border border-red-100 rounded flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {/* Results Area */}
                {simulation ? (
                    <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                        {/* LEFT: THE UGLY TRUTH */}
                        <div className="col-span-12 md:col-span-5 flex flex-col min-h-0 border border-gray-800 rounded-md overflow-hidden bg-black shadow-lg">
                            <div className="bg-gray-900 text-white p-3 flex justify-between items-center shrink-0 border-b border-gray-800">
                                <h4 className="font-mono text-xs tracking-widest flex items-center gap-2 text-gray-400 uppercase">
                                    <Eye className="w-4 h-4 text-signal-orange" />
                                    Forensic Parser View
                                </h4>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${simulation.parserView.parsingConfidenceScore > 80 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    }`}>
                                    PDF Extraction Confidence: {simulation.parserView.parsingConfidenceScore}%
                                </span>
                            </div>

                            {/* Extracted Entities Header */}
                            <div className="p-4 bg-gray-900/50 border-b border-gray-800 text-xs text-gray-300 font-mono grid grid-cols-2 gap-y-2">
                                <div>
                                    <span className="text-gray-500 block mb-0.5 text-[10px]">DETECTED NAME</span>
                                    <span className="text-white">{simulation.parserView.extractedName || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block mb-0.5 text-[10px]">DETECTED EMAIL</span>
                                    <span className="text-white">{simulation.parserView.extractedEmail || 'N/A'}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-gray-500 block mb-0.5 text-[10px]">DETECTED SKILLS (Top 5)</span>
                                    <div className="flex flex-wrap gap-1">
                                        {simulation.parserView.extractedSkills.slice(0, 5).map((s, i) => (
                                            <span key={i} className="bg-gray-800 px-1.5 py-0.5 rounded text-[10px] text-gray-300">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Raw Text Dump */}
                            <div className="relative flex-1 bg-black p-4 font-mono text-[10px] text-green-500/80 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                {showFullRawText
                                    ? simulation.parserView.rawTextDump
                                    : simulation.parserView.rawTextDump.slice(0, 800)
                                }
                                {!showFullRawText && simulation.parserView.rawTextDump.length > 800 && (
                                    <>
                                        ...
                                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                                    </>
                                )}
                            </div>

                            {/* Toggle Button */}
                            {simulation.parserView.rawTextDump.length > 800 && (
                                <button
                                    onClick={() => setShowFullRawText(!showFullRawText)}
                                    className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-gray-400 text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-1 border-t border-gray-800 transition-colors"
                                >
                                    {showFullRawText ? (
                                        <>Collapse <ChevronUp className="w-3 h-3" /></>
                                    ) : (
                                        <>View Full Raw Trace <ChevronDown className="w-3 h-3" /></>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* RIGHT: SCORECARD LAYERS */}
                        <div className="col-span-12 md:col-span-7 flex flex-col min-h-0 overflow-y-auto pr-2">
                            {/* OVERALL HEADER */}
                            <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                                <div className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 ${simulation.scorecard.overallScore > 80 ? 'border-green-100 text-green-600' :
                                        simulation.scorecard.overallScore > 50 ? 'border-yellow-100 text-yellow-600' :
                                            'border-red-100 text-red-600'
                                    }`}>
                                    <span className="text-2xl font-bold leading-none">{simulation.scorecard.overallScore}</span>
                                    <span className="text-xs font-medium text-gray-400 mt-1">/ 100</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 text-lg">Detailed Audit Report</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {simulation.scorecard.overallScore > 85 ? 'This resume is highly optimized for enterprise systems.' :
                                            simulation.scorecard.overallScore > 60 ? 'Contains structural gaps that may trigger auto-rejection.' :
                                                'Critical syntax errors detected. Immediate revision required.'}
                                    </p>
                                </div>
                            </div>

                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Logic Layer Breakdown</h4>

                            {/* LAYER 1: SHADOW SCHEMA */}
                            <ScorecardRow
                                title="Hidden Requirements Check"
                                subtitle="Scans for private fields often used to silently filter candidates (Salary, Relocation, Visa)."
                                layer={simulation.scorecard.layers.shadow_schema}
                            />

                            {/* LAYER 2: MATRIX FILTERING */}
                            <ScorecardRow
                                title="Role & Location Alignment"
                                subtitle="Verifies if the resume explicitly links the target role to the specific location/division."
                                layer={simulation.scorecard.layers.matrix_filtering}
                            />

                            {/* LAYER 3: VERSION CONTROL */}
                            <ScorecardRow
                                title="Update Impact Analysis"
                                subtitle="Determines if recent edits are substantial enough to trigger a 'New Application' event."
                                layer={simulation.scorecard.layers.version_control}
                            />

                            {/* LAYER 4: CONTEXT AUDIT */}
                            <ScorecardRow
                                title="Soft Skills & Culture Fit"
                                subtitle="Analyses intro/outro text for mission-aligned keywords beyond standard hard skills."
                                layer={simulation.scorecard.layers.content_context}
                            />

                            {/* LAYER 5: COMPLIANCE GATING */}
                            <ScorecardRow
                                title="Format Compliance Firewall"
                                subtitle="Strict regex check for standard data formats (Dates, Phones, Email)."
                                layer={simulation.scorecard.layers.compliance_gating}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-100 rounded-lg bg-gray-50/50">
                        <Shield className="w-12 h-12 mb-2 opacity-50 text-gray-300" />
                        <p className="text-sm font-medium text-gray-400">Ready to audit.</p>
                        <p className="text-xs text-gray-400">Paste content above or attach PDF.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
}

function ScorecardRow({ title, subtitle, layer }: { title: string, subtitle: string, layer: AtsScorecardLayer }) {
    const isPass = layer.score >= 80;
    const isWarn = layer.score >= 50 && layer.score < 80;

    return (
        <div className="mb-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 transition-colors group">
            <div className="p-4 flex items-start gap-4">
                <div className={`mt - 1 p - 1.5 rounded - full shrink - 0 ${isPass ? 'bg-green-100 text-green-700' :
                    isWarn ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                    } `}>
                    {isPass ? <CheckCircle className="w-4 h-4" /> :
                        isWarn ? <AlertTriangle className="w-4 h-4" /> :
                            <XCircle className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-gray-900 text-sm truncate pr-2">{title}</h4>
                        <span className={`text - [10px] font - bold px - 2 py - 0.5 rounded uppercase tracking - wide shrink - 0 ${isPass ? 'bg-green-50 text-green-700 border border-green-100' :
                            isWarn ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                                'bg-red-50 text-red-700 border border-red-100'
                            } `}>
                            {isPass ? 'PASS' : isWarn ? 'WARNING' : 'CRITICAL FAIL'}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 leading-relaxed">{subtitle}</p>

                    {/* Flags Section */}
                    {layer.flags.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                            <ul className="space-y-1.5">
                                {layer.flags.map((flag, idx) => (
                                    <li key={idx} className="text-xs text-red-600 flex items-start gap-2 bg-red-50/50 p-1.5 rounded">
                                        <div className="mt-0.5 w-1 h-1 bg-red-500 rounded-full shrink-0" />
                                        <span className="leading-snug">{flag}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
