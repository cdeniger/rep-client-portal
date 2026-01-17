import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDocument } from '../hooks/useFirestore';
import type { DiagnosticReport } from '../types/schema';
import { FileText, ArrowRight, Target, Layers, BarChart3, ShieldCheck, Map, CreditCard, Edit } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Modal from '../components/ui/Modal';
import DiagnosticForm from '../components/forms/DiagnosticForm';

export default function Diagnostic() {
    const { user } = useAuth();
    const { data: report, loading } = useDocument<DiagnosticReport>('diagnostic_reports', user?.uid);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    const handleUpdateReport = async (data: Partial<DiagnosticReport>) => {
        if (!report) return;
        setUpdating(true);
        try {
            // In real app, we'd use the actual ID. For now we might be using a mock ID or real one.
            // If report.id exists, update it.
            const reportRef = doc(db, 'diagnostic_reports', report.id);
            await updateDoc(reportRef, data);
            setIsEditOpen(false);
        } catch (err) {
            console.error(err);
            alert('Failed to update report.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="text-gray-400 text-sm animate-pulse">Loading Report...</div>;
    if (!report) return <div className="text-gray-500">No diagnostic report available.</div>;

    const { pillars } = report;

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            {/* Header */}
            <div className="border-b border-gray-200 pb-8 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-oxford-green text-white text-[10px] uppercase font-bold px-2 py-1 rounded-sm">Confidential</span>
                        <span className="text-gray-400 text-xs uppercase font-bold tracking-widest">
                            Generated {report.meta?.generatedAt ? new Date(report.meta.generatedAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold text-oxford-green mb-4">7-Pillar Career Audit</h1>
                    <p className="text-gray-600 max-w-2xl text-lg leading-relaxed">
                        A comprehensive diagnostic of your market value, asset strength, and strategic leverage points.
                    </p>
                </div>
                <button
                    onClick={() => setIsEditOpen(true)}
                    className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-signal-orange hover:text-black transition-colors"
                >
                    <Edit className="h-4 w-4" /> Edit Report
                </button>
            </div>

            {/* 1. Market Identity */}
            <section className="scroll-mt-20" id="identity">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-oxford-green text-white rounded-sm"><ShieldCheck className="h-6 w-6" /></div>
                    <h2 className="text-2xl font-bold text-oxford-green">1. Market Identity</h2>
                </div>
                <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                    <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 p-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                        <div className="col-span-3">Dimension</div>
                        <div className="col-span-3">Current Market Read</div>
                        <div className="col-span-3">Target Positioning</div>
                        <div className="col-span-3">Implication</div>
                    </div>
                    {pillars.p1_identity.market_reads.map((read, i) => (
                        <div key={i} className="grid grid-cols-12 p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                            <div className="col-span-3 font-bold text-oxford-green">{read.title}</div>
                            <div className="col-span-3 pr-4 text-gray-600">{read.current_read}</div>
                            <div className="col-span-3 pr-4 text-oxford-green font-medium">{read.target_read}</div>
                            <div className="col-span-3 text-sm text-gray-500 italic">{read.interpretation}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 2. Career Capital */}
            <section className="scroll-mt-20" id="capital">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-oxford-green text-white rounded-sm"><Layers className="h-6 w-6" /></div>
                    <h2 className="text-2xl font-bold text-oxford-green">2. Career Capital</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Scope Dial */}
                    <div className="md:col-span-1 bg-white p-6 border border-gray-200 rounded-sm shadow-sm flex flex-col justify-center items-center text-center">
                        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Scope Dial</div>
                        <div className="relative w-32 h-32 flex items-center justify-center border-4 border-gray-100 rounded-full mb-4">
                            <span className="text-3xl font-bold text-oxford-green">{pillars.p2_capital.scope_dial}%</span>
                        </div>
                        <p className="text-sm font-bold text-oxford-green">Ownership Weighted</p>
                        <p className="text-xs text-gray-500 mt-1">vs. Delivery Focused</p>
                    </div>

                    {/* Patterns */}
                    <div className="md:col-span-2 space-y-4">
                        {pillars.p2_capital.patterns.map((pat, i) => (
                            <div key={i} className="bg-white p-5 border border-gray-200 rounded-sm shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-oxford-green text-lg">{pat.pattern}</h4>
                                    <span className="bg-signal-orange text-white text-[10px] font-bold uppercase px-2 py-1 rounded-sm">Pattern Match</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                                    <div>
                                        <span className="block text-[10px] uppercase font-bold text-gray-400">Market Sees</span>
                                        <p className="text-gray-600">{pat.market_sees}</p>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] uppercase font-bold text-gray-400">Market Misses</span>
                                        <p className="text-gray-600">{pat.market_misses}</p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <span className="text-oxford-green font-bold text-xs uppercase tracking-wide">Rep. Clarification: </span>
                                    <span className="text-gray-600 text-sm italic">{pat.rep_clarification}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. Market Fit */}
            <section className="scroll-mt-20" id="market">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-oxford-green text-white rounded-sm"><Map className="h-6 w-6" /></div>
                    <h2 className="text-2xl font-bold text-oxford-green">3. Market Fit</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(pillars.p3_market.segments).map(([segment, status]) => (
                        <div key={segment} className={`p-4 border rounded-sm text-center ${status === 'primary' ? 'bg-oxford-green text-white border-oxford-green' : 'bg-white border-gray-200'}`}>
                            <div className="text-[10px] uppercase font-bold tracking-widest opacity-70 mb-1">Segment</div>
                            <div className="font-bold capitalize text-lg mb-2">{segment.replace('_', ' ')}</div>
                            <div className={`inline-block px-2 py-1 text-[10px] font-bold uppercase rounded-sm ${status === 'primary' ? 'bg-white text-oxford-green' : 'bg-gray-100 text-gray-500'}`}>
                                {status}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. Brand Assets */}
            <section className="scroll-mt-20" id="assets">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-oxford-green text-white rounded-sm"><FileText className="h-6 w-6" /></div>
                    <h2 className="text-2xl font-bold text-oxford-green">4. Brand Assets</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        {pillars.p4_assets.signals.map((sig, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-sm shadow-sm">
                                <div className="font-bold text-oxford-green">{sig.title}</div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase font-bold text-gray-400">Score</div>
                                        <div className="font-bold text-oxford-green">{sig.asset_score}/10</div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-gray-300" />
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase font-bold text-signal-orange">Target</div>
                                        <div className="font-bold text-signal-orange">{sig.rep_target_score}/10</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-gray-50 p-6 rounded-sm border border-gray-200">
                        <h4 className="font-bold text-oxford-green mb-4 border-b border-gray-200 pb-2">Evidence of Change</h4>
                        <div className="space-y-6">
                            {pillars.p4_assets.evidence.map((ev, i) => (
                                <div key={i}>
                                    <h5 className="font-bold text-sm text-gray-700 mb-2">{ev.section}</h5>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div className="p-3 bg-red-50 text-red-800 rounded-sm">
                                            <span className="block font-bold mb-1 opacity-50 uppercase text-[10px]">Before</span>
                                            "{ev.before_snippet}"
                                        </div>
                                        <div className="p-3 bg-green-50 text-green-900 rounded-sm">
                                            <span className="block font-bold mb-1 opacity-50 uppercase text-[10px]">After</span>
                                            "{ev.after_snippet}"
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 italic pl-2 border-l-2 border-signal-orange">{ev.what_must_change}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Pipeline Config */}
            <section className="scroll-mt-20" id="pipeline">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-oxford-green text-white rounded-sm"><Target className="h-6 w-6" /></div>
                    <h2 className="text-2xl font-bold text-oxford-green">5. Pipeline Config</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                    {Object.entries(pillars.p5_pipeline.dimensions).map(([key, val]) => (
                        <div key={key} className="bg-white p-4 border border-gray-200 rounded-sm text-center">
                            <div className="text-[10px] uppercase font-bold text-gray-400">{key.replace('_', ' ')}</div>
                            <div className="font-bold text-oxford-green text-xl mt-1">{val}</div>
                        </div>
                    ))}
                </div>
                <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 font-bold uppercase tracking-widest text-left">
                            <tr>
                                <th className="p-4">Channel</th>
                                <th className="p-4">Health</th>
                                <th className="p-4">Best For</th>
                                <th className="p-4">Tradeoffs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pillars.p5_pipeline.channels.map((chan, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="p-4 font-bold text-oxford-green">{chan.name}</td>
                                    <td className="p-4 text-gray-600">{chan.status}</td>
                                    <td className="p-4 text-gray-600">{chan.best_for}</td>
                                    <td className="p-4 text-gray-500 italic">{chan.tradeoffs}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 6. Compensation */}
            <section className="scroll-mt-20" id="comp">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-oxford-green text-white rounded-sm"><CreditCard className="h-6 w-6" /></div>
                    <h2 className="text-2xl font-bold text-oxford-green">6. Compensation</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white border border-gray-200 rounded-sm p-6">
                        <h4 className="font-bold text-oxford-green mb-4">Trajectory</h4>
                        <div className="space-y-4">
                            {pillars.p6_comp.trajectory.map((traj, i) => (
                                <div key={i} className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0">
                                    <div>
                                        <div className="text-xs uppercase font-bold text-gray-400">{traj.horizon}</div>
                                        <div className="font-bold text-oxford-green">{traj.level}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-signal-orange text-lg">{traj.range}</div>
                                        <div className="text-xs text-gray-500">{traj.focus}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-sm p-6">
                        <h4 className="font-bold text-oxford-green mb-4">Tradeoff Framework</h4>
                        <div className="space-y-4">
                            {pillars.p6_comp.tradeoffs.map((tr, i) => (
                                <div key={i} className="pb-4 border-b border-gray-100 last:border-0">
                                    <div className="flex justify-between font-bold text-sm mb-1">
                                        <span className="text-oxford-green">{tr.criterion}</span>
                                        <span className="text-gray-900">{tr.preference}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 italic">{tr.market_interaction}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. Architecture */}
            <section className="scroll-mt-20" id="arch">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-oxford-green text-white rounded-sm"><BarChart3 className="h-6 w-6" /></div>
                    <h2 className="text-2xl font-bold text-oxford-green">7. Architecture Dashboard</h2>
                </div>
                <div className="space-y-6">
                    {pillars.p7_architecture.dashboard.map((row, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                <h3 className="text-xl font-bold text-oxford-green">{row.dimension}</h3>
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="flex-1 md:flex-none">
                                        <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-signal-orange" style={{ width: `${row.progress_pct}%` }}></div>
                                        </div>
                                    </div>
                                    <span className="font-bold text-sm text-gray-600">{row.progress_pct}%</span>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-sm ${row.status === 'Achieved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                        {row.status}
                                    </span>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-gray-50 p-4 rounded-sm">
                                    <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Current State</span>
                                    <p className="font-medium text-gray-700 text-sm">{row.current_state}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-sm">
                                    <span className="block text-[10px] uppercase font-bold text-green-800/50 mb-1">Target State</span>
                                    <p className="font-bold text-green-900 text-sm">{row.target_state}</p>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Next Moves</span>
                                    <ul className="list-disc pl-4 text-sm text-gray-600 space-y-1">
                                        {row.next_moves.map((move, m) => (
                                            <li key={m}>{move}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Edit Diagnostic Report"
            >
                <DiagnosticForm
                    initialData={report}
                    onSubmit={handleUpdateReport}
                    onCancel={() => setIsEditOpen(false)}
                    isSubmitting={updating}
                />
            </Modal>
        </div>
    );
}
