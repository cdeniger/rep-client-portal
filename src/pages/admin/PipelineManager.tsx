
import React, { useEffect, useState } from 'react';
import { AdminService } from '../../services/AdminService';
import type { PipelineDefinition, PipelineStage } from '../../types/activities';
import { Plus, Trash2, Save, MoveUp, MoveDown, RefreshCcw } from 'lucide-react';

export default function PipelineManager() {
    const [pipelines, setPipelines] = useState<PipelineDefinition[]>([]);
    const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load data
    useEffect(() => {
        loadPipelines();
    }, []);

    const loadPipelines = async () => {
        setLoading(true);
        try {
            const data = await AdminService.getPipelines();
            setPipelines(data);
            if (data.length > 0 && !selectedPipelineId) {
                setSelectedPipelineId(data[0].id);
            }
        } catch (error) {
            console.error("Failed to load pipelines", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSeedDefaults = async () => {
        if (!confirm("This will overwrite existing 'Job Search' and 'Client Origination' pipelines. Continue?")) return;
        setLoading(true);
        await AdminService.initializeDefaultPipelines();
        await loadPipelines();
    };

    const activePipeline = pipelines.find(p => p.id === selectedPipelineId);

    const updateStage = (stageId: string, updates: Partial<PipelineStage>) => {
        if (!activePipeline) return;
        const newStages = activePipeline.stages.map(s =>
            s.id === stageId ? { ...s, ...updates } : s
        );
        updatePipelineStages(newStages);
    };

    const addStage = () => {
        if (!activePipeline) return;
        const newStage: PipelineStage = {
            id: `stage_${Date.now()}`,
            label: 'New Stage',
            color: '#94a3b8',
            order: activePipeline.stages.length
        };
        updatePipelineStages([...activePipeline.stages, newStage]);
    };

    const removeStage = (stageId: string) => {
        if (!activePipeline) return;
        updatePipelineStages(activePipeline.stages.filter(s => s.id !== stageId));
    };

    const moveStage = (index: number, direction: 'up' | 'down') => {
        if (!activePipeline) return;
        const stages = [...activePipeline.stages];
        if (direction === 'up' && index > 0) {
            [stages[index], stages[index - 1]] = [stages[index - 1], stages[index]];
        } else if (direction === 'down' && index < stages.length - 1) {
            [stages[index], stages[index + 1]] = [stages[index + 1], stages[index]];
        }
        // Re-assign order
        const ordered = stages.map((s, i) => ({ ...s, order: i }));
        updatePipelineStages(ordered);
    };

    const updatePipelineStages = (stages: PipelineStage[]) => {
        setPipelines(prev => prev.map(p =>
            p.id === selectedPipelineId ? { ...p, stages } : p
        ));
    };

    const handleSave = async () => {
        if (!activePipeline) return;
        setSaving(true);
        try {
            await AdminService.savePipeline(activePipeline);
            alert('Pipeline saved successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-stone-500">Loading Configuration...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="flex justify-between items-end mb-8 border-b border-stone-200 pb-4">
                <div>
                    <h1 className="text-2xl font-serif text-stone-900">Pipeline Manager</h1>
                    <p className="text-stone-500 mt-2">Configure logic for your business processes.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSeedDefaults}
                        className="px-4 py-2 text-sm text-stone-600 bg-stone-100 hover:bg-stone-200 rounded flex items-center gap-2"
                    >
                        <RefreshCcw size={16} /> Reset Defaults
                    </button>
                    {activePipeline && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-12 gap-8">
                {/* Sidebar */}
                <div className="col-span-3">
                    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                        <div className="p-3 bg-stone-50 border-b border-stone-200 font-medium text-stone-600 text-xs uppercase tracking-wider">
                            Pipelines
                        </div>
                        {pipelines.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPipelineId(p.id)}
                                className={`w-full text-left px-4 py-3 text-sm border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors ${selectedPipelineId === p.id
                                    ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-l-blue-600'
                                    : 'text-stone-700 border-l-4 border-l-transparent'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                        {pipelines.length === 0 && (
                            <div className="p-4 text-sm text-stone-400 text-center">No pipelines found. Try resetting defaults.</div>
                        )}
                    </div>
                </div>

                {/* Main Editor */}
                <div className="col-span-9">
                    {activePipeline ? (
                        <div className="bg-white rounded-lg border border-stone-200 shadow-sm p-6">
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Pipeline Name</label>
                                <input
                                    type="text"
                                    value={activePipeline.label}
                                    onChange={(e) => setPipelines(prev => prev.map(p => p.id === activePipeline.id ? { ...p, label: e.target.value } : p))}
                                    className="text-xl font-medium text-stone-900 border-b border-stone-300 focus:border-blue-500 outline-none w-full py-1"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-medium text-stone-800">Stages</h3>
                                    <button
                                        onClick={addStage}
                                        className="text-xs flex items-center gap-1 text-blue-600 font-medium hover:text-blue-800"
                                    >
                                        <Plus size={14} /> Add Stage
                                    </button>
                                </div>

                                {activePipeline.stages.map((stage, idx) => (
                                    <div key={stage.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded border border-stone-200 group hover:border-blue-200 transition-all">
                                        <div className="flex flex-col gap-1 text-stone-400">
                                            <button
                                                onClick={() => moveStage(idx, 'up')}
                                                disabled={idx === 0}
                                                className="hover:text-blue-600 disabled:opacity-30"
                                            >
                                                <MoveUp size={14} />
                                            </button>
                                            <button
                                                onClick={() => moveStage(idx, 'down')}
                                                disabled={idx === activePipeline.stages.length - 1}
                                                className="hover:text-blue-600 disabled:opacity-30"
                                            >
                                                <MoveDown size={14} />
                                            </button>
                                        </div>

                                        <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center border border-black/10 shadow-sm transition-colors" style={{ backgroundColor: stage.color }}>
                                            <input
                                                type="color"
                                                value={stage.color}
                                                onChange={(e) => updateStage(stage.id, { color: e.target.value })}
                                                className="opacity-0 w-full h-full cursor-pointer"
                                                title="Change Color"
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={stage.label}
                                                onChange={(e) => updateStage(stage.id, { label: e.target.value })}
                                                className="w-full bg-transparent border-none outline-none font-medium text-stone-700 placeholder:text-stone-400 focus:text-blue-700"
                                                placeholder="Stage Name"
                                            />
                                            <div className="text-[10px] text-stone-400 font-mono">{stage.id}</div>
                                        </div>

                                        <button
                                            onClick={() => removeStage(stage.id)}
                                            className="text-stone-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400 bg-stone-50 rounded-lg border-2 border-dashed border-stone-200">
                            Select a pipeline to edit
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
