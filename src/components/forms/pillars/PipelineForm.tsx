import type { DiagnosticReport } from '../../../types/schema';
import { Plus, Trash2 } from 'lucide-react';

interface PipelineFormProps {
    data: DiagnosticReport['pillars']['p5_pipeline'];
    onChange: (data: DiagnosticReport['pillars']['p5_pipeline']) => void;
}

export default function PipelineForm({ data, onChange }: PipelineFormProps) {

    const handleAddChannel = () => {
        onChange({
            ...data,
            channels: [...data.channels, { name: '', status: '', best_for: '', tradeoffs: '' }]
        });
    };

    const handleUpdateChannel = (index: number, field: string, value: any) => {
        const newChannels = [...data.channels];
        newChannels[index] = { ...newChannels[index], [field]: value };
        onChange({ ...data, channels: newChannels });
    };
    const handleRemoveChannel = (index: number) => {
        const newChannels = [...data.channels];
        newChannels.splice(index, 1);
        onChange({ ...data, channels: newChannels });
    };

    const handleUpdateDimension = (field: string, value: string) => {
        onChange({
            ...data,
            dimensions: { ...data.dimensions, [field]: value }
        });
    };

    return (
        <div className="space-y-8">
            {/* Dimensions */}
            <div className="bg-white p-5 border border-gray-200 rounded-sm shadow-sm space-y-4">
                <h3 className="font-bold text-oxford-green">Execution Dimensions</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Intensity</label>
                        <select className="w-full p-2 border border-gray-200 rounded-sm text-sm" value={data.dimensions.intensity} onChange={e => handleUpdateDimension('intensity', e.target.value)}>
                            <option value="Passive">Passive</option>
                            <option value="Active">Active</option>
                            <option value="Aggressive">Aggressive</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Urgency Fit</label>
                        <select className="w-full p-2 border border-gray-200 rounded-sm text-sm" value={data.dimensions.urgency_fit} onChange={e => handleUpdateDimension('urgency_fit', e.target.value)}>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Access Path</label>
                        <select className="w-full p-2 border border-gray-200 rounded-sm text-sm" value={data.dimensions.access_path} onChange={e => handleUpdateDimension('access_path', e.target.value)}>
                            <option value="Inbound">Inbound</option>
                            <option value="Referral">Referral</option>
                            <option value="Direct">Direct</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Channels */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-oxford-green text-lg">Sourcing Channels</h3>
                    <button type="button" onClick={handleAddChannel} className="text-xs font-bold uppercase text-signal-orange flex items-center gap-1 hover:underline">
                        <Plus className="h-4 w-4" /> Add Channel
                    </button>
                </div>
                {data.channels.map((chan, i) => (
                    <div key={i} className="bg-white p-4 border border-gray-200 rounded-sm shadow-sm relative group">
                        <button type="button" onClick={() => handleRemoveChannel(i)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                        <div className="grid gap-3">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Channel Name</label>
                                    <input className="w-full p-2 border border-gray-200 rounded-sm text-sm font-bold" value={chan.name} onChange={e => handleUpdateChannel(i, 'name', e.target.value)} />
                                </div>
                                <div className="w-32">
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Health</label>
                                    <select className="w-full p-2 border border-gray-200 rounded-sm text-sm" value={chan.status} onChange={e => handleUpdateChannel(i, 'status', e.target.value)}>
                                        <option value="Optimal">Optimal</option>
                                        <option value="Good">Good</option>
                                        <option value="Underutilized">Underutilized</option>
                                        <option value="Broken">Broken</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Best For</label>
                                <input className="w-full p-2 border border-gray-200 rounded-sm text-sm" value={chan.best_for} onChange={e => handleUpdateChannel(i, 'best_for', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tradeoffs</label>
                                <input className="w-full p-2 border border-gray-200 rounded-sm text-sm text-gray-500" value={chan.tradeoffs} onChange={e => handleUpdateChannel(i, 'tradeoffs', e.target.value)} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
