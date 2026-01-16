import type { DiagnosticReport } from '../../../types/schema';
import { Plus, Trash2 } from 'lucide-react';

interface AssetsFormProps {
    data: DiagnosticReport['pillars']['p4_assets'];
    onChange: (data: DiagnosticReport['pillars']['p4_assets']) => void;
}

export default function AssetsForm({ data, onChange }: AssetsFormProps) {

    // Signals Management
    const handleAddSignal = () => {
        onChange({
            ...data,
            signals: [...data.signals, { title: '', asset_score: 0, rep_target_score: 0, status_label: 'Draft' }]
        });
    };

    const handleUpdateSignal = (index: number, field: string, value: any) => {
        const newSignals = [...data.signals];
        newSignals[index] = { ...newSignals[index], [field]: value };
        onChange({ ...data, signals: newSignals });
    };
    const handleRemoveSignal = (index: number) => {
        const newSignals = [...data.signals];
        newSignals.splice(index, 1);
        onChange({ ...data, signals: newSignals });
    };

    // Evidence Management
    const handleAddEvidence = () => {
        onChange({
            ...data,
            evidence: [...data.evidence, { section: '', current_signal: '', what_must_change: '', before_snippet: '', after_snippet: '' }]
        });
    };
    const handleUpdateEvidence = (index: number, field: string, value: any) => {
        const newEv = [...data.evidence];
        newEv[index] = { ...newEv[index], [field]: value };
        onChange({ ...data, evidence: newEv });
    };
    const handleRemoveEvidence = (index: number) => {
        const newEv = [...data.evidence];
        newEv.splice(index, 1);
        onChange({ ...data, evidence: newEv });
    };

    return (
        <div className="space-y-8">
            {/* Signals Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-oxford-green text-lg">Asset Signals</h3>
                    <button type="button" onClick={handleAddSignal} className="text-xs font-bold uppercase text-signal-orange flex items-center gap-1 hover:underline">
                        <Plus className="h-4 w-4" /> Add Signal
                    </button>
                </div>
                {data.signals.map((sig, i) => (
                    <div key={i} className="bg-white p-4 border border-gray-200 rounded-sm shadow-sm relative group">
                        <button type="button" onClick={() => handleRemoveSignal(i)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                        <div className="grid gap-3">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Asset Name</label>
                                <input className="w-full p-2 border border-gray-200 rounded-sm text-sm" value={sig.title} onChange={e => handleUpdateSignal(i, 'title', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Current (0-10)</label>
                                    <input type="number" className="w-full p-2 border border-gray-200 rounded-sm text-sm" value={sig.asset_score} onChange={e => handleUpdateSignal(i, 'asset_score', parseInt(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Target (0-10)</label>
                                    <input type="number" className="w-full p-2 border border-gray-200 rounded-sm text-sm" value={sig.rep_target_score} onChange={e => handleUpdateSignal(i, 'rep_target_score', parseInt(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Status</label>
                                    <input className="w-full p-2 border border-gray-200 rounded-sm text-sm" value={sig.status_label} onChange={e => handleUpdateSignal(i, 'status_label', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Evidence Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-oxford-green text-lg">Evidence of Change</h3>
                    <button type="button" onClick={handleAddEvidence} className="text-xs font-bold uppercase text-signal-orange flex items-center gap-1 hover:underline">
                        <Plus className="h-4 w-4" /> Add Evidence
                    </button>
                </div>
                {data.evidence.map((ev, i) => (
                    <div key={i} className="bg-white p-4 border border-gray-200 rounded-sm shadow-sm relative group">
                        <button type="button" onClick={() => handleRemoveEvidence(i)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>

                        <div className="space-y-3">
                            <input className="font-bold text-oxford-green w-full border-b border-transparent focus:border-oxford-green outline-none" placeholder="Section Name (e.g. Summary)" value={ev.section} onChange={e => handleUpdateEvidence(i, 'section', e.target.value)} />

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Before / Current Signal</label>
                                    <textarea rows={3} className="w-full p-2 border border-gray-200 rounded-sm text-xs bg-red-50" value={ev.before_snippet} onChange={e => handleUpdateEvidence(i, 'before_snippet', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">After / Target Signal</label>
                                    <textarea rows={3} className="w-full p-2 border border-gray-200 rounded-sm text-xs bg-green-50" value={ev.after_snippet} onChange={e => handleUpdateEvidence(i, 'after_snippet', e.target.value)} />
                                </div>
                            </div>

                            <input className="w-full p-2 border border-gray-200 rounded-sm text-xs text-gray-500 italic" placeholder="What must change logic..." value={ev.what_must_change} onChange={e => handleUpdateEvidence(i, 'what_must_change', e.target.value)} />

                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
