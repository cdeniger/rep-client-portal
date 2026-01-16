import type { DiagnosticReport } from '../../../types/schema';
import { Plus, Trash2 } from 'lucide-react';

interface CompFormProps {
    data: DiagnosticReport['pillars']['p6_comp'];
    onChange: (data: DiagnosticReport['pillars']['p6_comp']) => void;
}

export default function CompForm({ data, onChange }: CompFormProps) {

    // Trajectory
    const handleAddTrajectory = () => {
        onChange({
            ...data,
            trajectory: [...data.trajectory, { horizon: '', range: '', level: '', focus: '' }]
        });
    };
    const handleUpdateTrajectory = (index: number, field: string, value: any) => {
        const newTraj = [...data.trajectory];
        newTraj[index] = { ...newTraj[index], [field]: value };
        onChange({ ...data, trajectory: newTraj });
    };
    const handleRemoveTrajectory = (index: number) => {
        const newTraj = [...data.trajectory];
        newTraj.splice(index, 1);
        onChange({ ...data, trajectory: newTraj });
    };

    // Tradeoffs
    const handleAddTradeoff = () => {
        onChange({
            ...data,
            tradeoffs: [...data.tradeoffs, { criterion: '', preference: '', market_interaction: '', flag_label: '' }]
        });
    };
    const handleUpdateTradeoff = (index: number, field: string, value: any) => {
        const newTr = [...data.tradeoffs];
        newTr[index] = { ...newTr[index], [field]: value };
        onChange({ ...data, tradeoffs: newTr });
    };
    const handleRemoveTradeoff = (index: number) => {
        const newTr = [...data.tradeoffs];
        newTr.splice(index, 1);
        onChange({ ...data, tradeoffs: newTr });
    };


    return (
        <div className="space-y-8">
            {/* Trajectory */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-oxford-green text-lg">Compensation Trajectory</h3>
                    <button type="button" onClick={handleAddTrajectory} className="text-xs font-bold uppercase text-signal-orange flex items-center gap-1 hover:underline">
                        <Plus className="h-4 w-4" /> Add Horizon
                    </button>
                </div>
                {data.trajectory.map((traj, i) => (
                    <div key={i} className="bg-white p-4 border border-gray-200 rounded-sm shadow-sm relative group flex gap-4 items-end">
                        <button type="button" onClick={() => handleRemoveTrajectory(i)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                        <div className="flex-1">
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Horizon</label>
                            <input className="w-full p-2 border border-gray-200 rounded-sm text-sm" value={traj.horizon} onChange={e => handleUpdateTrajectory(i, 'horizon', e.target.value)} placeholder="e.g. Current" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Range</label>
                            <input className="w-full p-2 border border-gray-200 rounded-sm text-sm font-bold bg-green-50" value={traj.range} onChange={e => handleUpdateTrajectory(i, 'range', e.target.value)} />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Level</label>
                            <input className="w-full p-2 border border-gray-200 rounded-sm text-sm" value={traj.level} onChange={e => handleUpdateTrajectory(i, 'level', e.target.value)} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Tradeoffs */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-oxford-green text-lg">Tradeoffs</h3>
                    <button type="button" onClick={handleAddTradeoff} className="text-xs font-bold uppercase text-signal-orange flex items-center gap-1 hover:underline">
                        <Plus className="h-4 w-4" /> Add Tradeoff
                    </button>
                </div>
                {data.tradeoffs.map((tr, i) => (
                    <div key={i} className="bg-white p-4 border border-gray-200 rounded-sm shadow-sm relative group">
                        <button type="button" onClick={() => handleRemoveTradeoff(i)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                        <div className="grid gap-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Criterion</label>
                                    <input className="w-full p-2 border border-gray-200 rounded-sm text-sm font-bold" value={tr.criterion} onChange={e => handleUpdateTradeoff(i, 'criterion', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Preference</label>
                                    <input className="w-full p-2 border border-gray-200 rounded-sm text-sm" value={tr.preference} onChange={e => handleUpdateTradeoff(i, 'preference', e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Market Interaction</label>
                                <input className="w-full p-2 border border-gray-200 rounded-sm text-sm text-gray-500" value={tr.market_interaction} onChange={e => handleUpdateTradeoff(i, 'market_interaction', e.target.value)} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
