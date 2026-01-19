import React, { useEffect, useState } from 'react';
import { AdminService } from '../../services/AdminService';
import type { PipelineDefinition, Stage } from '../../types/pipeline';
import { Plus, Trash2, Save, MoveUp, MoveDown, Layout, DollarSign, Briefcase } from 'lucide-react';

export default function PipelineConfig() {
    const [pipelines, setPipelines] = useState<PipelineDefinition[]>([]);
    const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // New Pipeline Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPipeline, setNewPipeline] = useState<{ label: string; id: string; category: 'sales' | 'delivery' }>({
        label: '',
        id: '',
        category: 'sales'
    });

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

    const activePipeline = pipelines.find(p => p.id === selectedPipelineId);

    const updateStage = (stageId: string, updates: Partial<Stage>) => {
        if (!activePipeline) return;
        const newStages = activePipeline.stages.map(s =>
            s.id === stageId ? { ...s, ...updates } : s
        );
        updatePipelineStages(newStages);
    };

    const addStage = () => {
        if (!activePipeline) return;
        const newStage: Stage = {
            id: `stage_${Date.now()}`,
            label: 'New Stage',
            color: '#94a3b8'
        };
        updatePipelineStages([...activePipeline.stages, newStage]);
    };

    const removeStage = (stageId: string) => {
        if (!activePipeline) return;
        if (!confirm('Are you sure you want to remove this stage?')) return;
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
        updatePipelineStages(stages);
    };

    // ... [rest of the methods] ...
    const updatePipelineStages = (stages: Stage[]) => {
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

    const handleCreatePipeline = async () => {
        if (!newPipeline.label || !newPipeline.id) return;

        const pipeline: PipelineDefinition = {
            id: newPipeline.id.toLowerCase().replace(/\s+/g, '_'),
            label: newPipeline.label,
            category: newPipeline.category,
            stages: []
        };

        setSaving(true);
        try {
            await AdminService.savePipeline(pipeline);
            await loadPipelines();
            setSelectedPipelineId(pipeline.id);
            setShowAddModal(false);
            setNewPipeline({ label: '', id: '', category: 'sales' });
        } catch (e) {
            console.error(e);
            alert('Failed to create pipeline');
        } finally {
            setSaving(false);
        }
    };

    // Derived Visuals
    const getCategoryBadge = (category: 'sales' | 'delivery') => {
        if (category === 'sales') {
            return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200">Sales</span>;
        }
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-100 text-sky-700 border border-sky-200">Delivery</span>;
    };

    if (loading) return <div className="p-12 text-center text-stone-500">Loading Configuration...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="flex justify-between items-end mb-8 border-b border-stone-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pipeline Configuration</h1>
                    <p className="text-slate-500">Manage pipeline definitions and schema types.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 text-sm font-medium text-white bg-stone-800 hover:bg-stone-900 rounded shadow flex items-center gap-2"
                    >
                        <Plus size={16} /> New Pipeline
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
                    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm">
                        <div className="p-3 bg-stone-50 border-b border-stone-200 font-medium text-stone-600 text-xs uppercase tracking-wider">
                            Active Pipelines
                        </div>
                        {pipelines.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPipelineId(p.id)}
                                className={`w-full text-left px-4 py-3 text-sm border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors flex justify-between items-center group ${selectedPipelineId === p.id
                                    ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-l-blue-600'
                                    : 'text-stone-700 border-l-4 border-l-transparent'
                                    }`}
                            >
                                <span>{p.label}</span>
                                {getCategoryBadge(p.category)}
                            </button>
                        ))}
                        {pipelines.length === 0 && (
                            <div className="p-8 text-sm text-stone-400 text-center italic">
                                No pipelines found.<br />Sync defaults or create new.
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Editor */}
                <div className="col-span-9">
                    {activePipeline ? (
                        <div className="bg-white rounded-lg border border-stone-200 shadow-sm p-6">
                            <div className="mb-8 flex justify-between items-start">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Pipeline Name</label>
                                    <input
                                        type="text"
                                        value={activePipeline.label}
                                        onChange={(e) => setPipelines(prev => prev.map(p => p.id === activePipeline.id ? { ...p, label: e.target.value } : p))}
                                        className="text-2xl font-serif font-medium text-stone-900 border-b border-transparent focus:border-stone-300 outline-none w-full py-1 hover:border-stone-200 transition-colors"
                                    />
                                    <div className="flex items-center gap-4 mt-2 text-xs text-stone-500 font-mono">
                                        <span>ID: {activePipeline.id}</span>
                                        <span className="flex items-center gap-1">
                                            TYPE: <span className="font-bold uppercase">{activePipeline.category}</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-stone-50 p-3 rounded border border-stone-100 text-xs text-stone-500 max-w-[200px]">
                                    {activePipeline.category === 'sales'
                                        ? "Uses 'Lead' Schema. Optimized for high-volume prospect qualification."
                                        : "Uses 'Job Pursuit' Schema. Optimized for deep engagement tracking."
                                    }
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                                    <h3 className="font-medium text-stone-800 flex items-center gap-2">
                                        <Layout size={16} className="text-stone-400" /> Stages Configuration
                                    </h3>
                                    <button
                                        onClick={addStage}
                                        className="text-xs flex items-center gap-1 text-blue-600 font-medium hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                                    >
                                        <Plus size={14} /> Add Stage
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {activePipeline.stages.map((stage, idx) => (
                                        <div key={stage.id} className="flex items-center gap-3 p-3 bg-white hover:bg-stone-50 rounded border border-stone-200 group hover:border-blue-200 transition-all shadow-sm">
                                            <div className="flex flex-col gap-1 text-stone-300">
                                                <button
                                                    onClick={() => moveStage(idx, 'up')}
                                                    disabled={idx === 0}
                                                    className="hover:text-stone-600 disabled:opacity-30"
                                                >
                                                    <MoveUp size={14} />
                                                </button>
                                                <button
                                                    onClick={() => moveStage(idx, 'down')}
                                                    disabled={idx === activePipeline.stages.length - 1}
                                                    className="hover:text-stone-600 disabled:opacity-30"
                                                >
                                                    <MoveDown size={14} />
                                                </button>
                                            </div>

                                            <div className="w-10 h-10 rounded shrink-0 flex items-center justify-center border border-black/5 shadow-inner transition-colors" style={{ backgroundColor: stage.color }}>
                                                <input
                                                    type="color"
                                                    value={stage.color || '#94a3b8'}
                                                    onChange={(e) => updateStage(stage.id, { color: e.target.value })}
                                                    className="opacity-0 w-full h-full cursor-pointer"
                                                    title="Change Stage Color"
                                                />
                                            </div>

                                            <div className="flex-1 grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] uppercase text-stone-400 font-bold mb-0.5">Stage Name</label>
                                                    <input
                                                        type="text"
                                                        value={stage.label}
                                                        onChange={(e) => updateStage(stage.id, { label: e.target.value })}
                                                        className="w-full bg-transparent border-b border-transparent focus:border-stone-300 outline-none font-medium text-stone-700 placeholder:text-stone-400 focus:bg-white text-sm py-0.5"
                                                        placeholder="e.g. Discovery Call"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] uppercase text-stone-400 font-bold mb-0.5">Stage ID (Slug)</label>
                                                    <input
                                                        type="text"
                                                        value={stage.id}
                                                        disabled
                                                        className="w-full bg-stone-50 border-none outline-none font-mono text-xs text-stone-500 py-0.5 px-1 rounded cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => removeStage(stage.id)}
                                                className="text-stone-200 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded"
                                                title="Delete Stage"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {activePipeline.stages.length === 0 && (
                                        <div className="p-8 text-center text-stone-400 border-2 border-dashed border-stone-200 rounded-lg bg-stone-50/50">
                                            No stages defined. Add a stage to get started.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-96 flex flex-col items-center justify-center text-stone-400 bg-stone-50 rounded-lg border-2 border-dashed border-stone-200">
                            <Layout size={48} className="mb-4 text-stone-300" />
                            <p>Select a pipeline to configure</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Pipeline Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-stone-800">Create New Pipeline</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-600">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Pipeline Name</label>
                                <input
                                    type="text"
                                    value={newPipeline.label}
                                    onChange={(e) => setNewPipeline(prev => ({
                                        ...prev,
                                        label: e.target.value,
                                        id: e.target.value.toLowerCase().replace(/\s+/g, '_')
                                    }))}
                                    className="w-full border border-stone-300 rounded px-3 py-2 outline-none focus:border-stone-500 shadow-sm"
                                    placeholder="e.g. Sales Outreach"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Pipeline ID</label>
                                <input
                                    type="text"
                                    value={newPipeline.id}
                                    onChange={(e) => setNewPipeline(prev => ({ ...prev, id: e.target.value }))}
                                    className="w-full border border-stone-300 rounded px-3 py-2 outline-none focus:border-stone-500 font-mono text-sm bg-stone-50"
                                    placeholder="sales_outreach"
                                />
                                <p className="text-xs text-stone-400 mt-1">Unique slug identifier.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">Category (Schema Type)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setNewPipeline(prev => ({ ...prev, category: 'sales' }))}
                                        className={`p-4 rounded border-2 text-left transition-all ${newPipeline.category === 'sales'
                                            ? 'border-fuchsia-500 bg-fuchsia-50 ring-1 ring-fuchsia-500'
                                            : 'border-stone-200 hover:border-stone-300'}`}
                                    >
                                        <div className="font-bold text-stone-900 mb-1 flex items-center gap-2">
                                            <DollarSign size={16} className={newPipeline.category === 'sales' ? 'text-fuchsia-600' : 'text-stone-400'} />
                                            Sales
                                        </div>
                                        <div className="text-xs text-stone-500">Uses "Lead" schema. Best for high velocity.</div>
                                    </button>

                                    <button
                                        onClick={() => setNewPipeline(prev => ({ ...prev, category: 'delivery' }))}
                                        className={`p-4 rounded border-2 text-left transition-all ${newPipeline.category === 'delivery'
                                            ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-500'
                                            : 'border-stone-200 hover:border-stone-300'}`}
                                    >
                                        <div className="font-bold text-stone-900 mb-1 flex items-center gap-2">
                                            <Briefcase size={16} className={newPipeline.category === 'delivery' ? 'text-sky-600' : 'text-stone-400'} />
                                            Delivery
                                        </div>
                                        <div className="text-xs text-stone-500">Uses "Pursuit" schema. Best for client services.</div>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 text-stone-600 hover:text-stone-900 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreatePipeline}
                                className="px-6 py-2 bg-stone-900 hover:bg-black text-white rounded font-bold shadow-md transform active:scale-95 transition-all"
                            >
                                Create Pipeline
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
