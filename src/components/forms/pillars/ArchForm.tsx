import type { DiagnosticReport } from '../../../types/schema';
import { Plus, Trash2 } from 'lucide-react';

interface ArchFormProps {
    data: DiagnosticReport['pillars']['p7_architecture'];
    onChange: (data: DiagnosticReport['pillars']['p7_architecture']) => void;
}

export default function ArchForm({ data, onChange }: ArchFormProps) {

    const handleAddRow = () => {
        onChange({
            ...data,
            dashboard: [...data.dashboard, { dimension: '', current_state: '', target_state: '', status: 'Pending', progress_pct: 0, next_moves: [] }]
        });
    };

    const handleUpdateRow = (index: number, field: string, value: any) => {
        const newDash = [...data.dashboard];
        newDash[index] = { ...newDash[index], [field]: value };
        onChange({ ...data, dashboard: newDash });
    };
    const handleRemoveRow = (index: number) => {
        const newDash = [...data.dashboard];
        newDash.splice(index, 1);
        onChange({ ...data, dashboard: newDash });
    };

    const handleNextMoves = (index: number, value: string) => {
        // Split by newline to create array
        const moves = value.split('\n').filter(s => s.trim().length > 0);
        handleUpdateRow(index, 'next_moves', moves);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-oxford-green text-lg">Architecture Dashboard</h3>
                <button type="button" onClick={handleAddRow} className="text-xs font-bold uppercase text-signal-orange flex items-center gap-1 hover:underline">
                    <Plus className="h-4 w-4" /> Add Dimension
                </button>
            </div>

            <div className="space-y-4">
                {data.dashboard.map((row, i) => (
                    <div key={i} className="bg-white p-4 border border-gray-200 rounded-sm shadow-sm relative group">
                        <button type="button" onClick={() => handleRemoveRow(i)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>

                        <div className="grid gap-4">
                            <input className="font-bold text-oxford-green text-lg w-full border-b border-transparent focus:border-oxford-green outline-none" placeholder="Dimension Name" value={row.dimension} onChange={e => handleUpdateRow(i, 'dimension', e.target.value)} />

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Current State</label>
                                    <input className="w-full p-2 border border-gray-200 rounded-sm text-sm" value={row.current_state} onChange={e => handleUpdateRow(i, 'current_state', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Target State</label>
                                    <input className="w-full p-2 border border-gray-200 rounded-sm text-sm" value={row.target_state} onChange={e => handleUpdateRow(i, 'target_state', e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Status</label>
                                    <select className="w-full p-2 border border-gray-200 rounded-sm text-sm" value={row.status} onChange={e => handleUpdateRow(i, 'status', e.target.value)}>
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Achieved">Achieved</option>
                                        <option value="Blocked">Blocked</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Progress %</label>
                                    <input type="number" className="w-full p-2 border border-gray-200 rounded-sm text-sm" value={row.progress_pct} onChange={e => handleUpdateRow(i, 'progress_pct', parseInt(e.target.value))} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Next Moves (One per line)</label>
                                <textarea rows={3} className="w-full p-2 border border-gray-200 rounded-sm text-sm font-mono bg-gray-50" value={row.next_moves.join('\n')} onChange={e => handleNextMoves(i, e.target.value)} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
