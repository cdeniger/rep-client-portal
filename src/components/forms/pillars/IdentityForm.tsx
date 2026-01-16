import type { DiagnosticReport } from '../../../types/schema';
import { Plus, Trash2 } from 'lucide-react';

interface IdentityFormProps {
    data: DiagnosticReport['pillars']['p1_identity'];
    onChange: (data: DiagnosticReport['pillars']['p1_identity']) => void;
}

export default function IdentityForm({ data, onChange }: IdentityFormProps) {

    const handleAddRead = () => {
        onChange({
            ...data,
            market_reads: [
                ...data.market_reads,
                { title: '', current_read: '', target_read: '', interpretation: '' }
            ]
        });
    };

    const handleRemoveRead = (index: number) => {
        const newReads = [...data.market_reads];
        newReads.splice(index, 1);
        onChange({ ...data, market_reads: newReads });
    };

    const handleUpdateRead = (index: number, field: keyof typeof data.market_reads[0], value: string) => {
        const newReads = [...data.market_reads];
        newReads[index] = { ...newReads[index], [field]: value };
        onChange({ ...data, market_reads: newReads });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-oxford-green text-lg">Market Identity</h3>
                <button
                    type="button"
                    onClick={handleAddRead}
                    className="text-xs font-bold uppercase text-signal-orange flex items-center gap-1 hover:underline"
                >
                    <Plus className="h-4 w-4" /> Add Read
                </button>
            </div>

            <div className="space-y-4">
                {data.market_reads.map((read, i) => (
                    <div key={i} className="bg-white p-4 border border-gray-200 rounded-sm shadow-sm relative group">
                        <button
                            type="button"
                            onClick={() => handleRemoveRead(i)}
                            className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="grid gap-3">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Title</label>
                                <input
                                    className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-oxford-green outline-none"
                                    value={read.title}
                                    onChange={e => handleUpdateRead(i, 'title', e.target.value)}
                                    placeholder="e.g. Seniority"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Current Read</label>
                                    <input
                                        className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-oxford-green outline-none bg-red-50"
                                        value={read.current_read}
                                        onChange={e => handleUpdateRead(i, 'current_read', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Target Read</label>
                                    <input
                                        className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-oxford-green outline-none bg-green-50"
                                        value={read.target_read}
                                        onChange={e => handleUpdateRead(i, 'target_read', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Interpretation</label>
                                <textarea
                                    rows={2}
                                    className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-oxford-green outline-none resize-none"
                                    value={read.interpretation}
                                    onChange={e => handleUpdateRead(i, 'interpretation', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
