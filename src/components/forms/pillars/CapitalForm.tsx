import type { DiagnosticReport } from '../../../types/schema';
import { Plus, Trash2 } from 'lucide-react';

interface CapitalFormProps {
    data: DiagnosticReport['pillars']['p2_capital'];
    onChange: (data: DiagnosticReport['pillars']['p2_capital']) => void;
}

export default function CapitalForm({ data, onChange }: CapitalFormProps) {

    const handleAddPattern = () => {
        onChange({
            ...data,
            patterns: [
                ...data.patterns,
                { pattern: '', market_sees: '', market_misses: '', rep_clarification: '' }
            ]
        });
    };

    const handleRemovePattern = (index: number) => {
        const newPatterns = [...data.patterns];
        newPatterns.splice(index, 1);
        onChange({ ...data, patterns: newPatterns });
    };

    const handleUpdatePattern = (index: number, field: keyof typeof data.patterns[0], value: string) => {
        const newPatterns = [...data.patterns];
        newPatterns[index] = { ...newPatterns[index], [field]: value };
        onChange({ ...data, patterns: newPatterns });
    };

    return (
        <div className="space-y-8">
            {/* Scope Dial */}
            <div className="bg-white p-5 border border-gray-200 rounded-sm shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-oxford-green">Scope Dial</h3>
                    <span className="text-2xl font-bold text-signal-orange">{data.scope_dial}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={data.scope_dial}
                    onChange={e => onChange({ ...data, scope_dial: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-signal-orange"
                />
                <div className="flex justify-between text-xs text-gray-400 uppercase font-bold mt-2">
                    <span>Delivery</span>
                    <span>Ownership</span>
                </div>
            </div>

            {/* Patterns */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-oxford-green text-lg">Career Patterns</h3>
                    <button
                        type="button"
                        onClick={handleAddPattern}
                        className="text-xs font-bold uppercase text-signal-orange flex items-center gap-1 hover:underline"
                    >
                        <Plus className="h-4 w-4" /> Add Pattern
                    </button>
                </div>

                {data.patterns.map((pat, i) => (
                    <div key={i} className="bg-white p-4 border border-gray-200 rounded-sm shadow-sm relative group">
                        <button
                            type="button"
                            onClick={() => handleRemovePattern(i)}
                            className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="grid gap-3">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Pattern Name</label>
                                <input
                                    className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-oxford-green outline-none"
                                    value={pat.pattern}
                                    onChange={e => handleUpdatePattern(i, 'pattern', e.target.value)}
                                    placeholder="e.g. Scale"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Market Sees</label>
                                    <textarea
                                        rows={2}
                                        className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-oxford-green outline-none resize-none"
                                        value={pat.market_sees}
                                        onChange={e => handleUpdatePattern(i, 'market_sees', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Market Misses</label>
                                    <textarea
                                        rows={2}
                                        className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-oxford-green outline-none resize-none"
                                        value={pat.market_misses}
                                        onChange={e => handleUpdatePattern(i, 'market_misses', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Rep Clarification</label>
                                <input
                                    className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-oxford-green outline-none bg-oxford-green/5 text-oxford-green font-medium"
                                    value={pat.rep_clarification}
                                    onChange={e => handleUpdatePattern(i, 'rep_clarification', e.target.value)}
                                    placeholder="How we frame this..."
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
