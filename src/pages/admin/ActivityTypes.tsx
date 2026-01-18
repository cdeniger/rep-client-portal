import { useState, useEffect } from 'react';
import { AdminService } from '../../services/AdminService';
import type { ActivityDefinition, ActivityFieldDefinition } from '../../types/activities';
import { Lock, Plus, Trash2, Save, X, Edit2 } from 'lucide-react';

const RESERVED_KEYS = [
    'round', 'rating', 'interviewers',
    'pipelineKey', 'fromStage', 'toStage',
    'outcome', 'durationMinutes',
    'subject', 'recipientEmail', 'direction'
];

export default function ActivityTypes() {
    const [definitions, setDefinitions] = useState<ActivityDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingDef, setEditingDef] = useState<ActivityDefinition | null>(null);
    const [isNew, setIsNew] = useState(false);

    useEffect(() => {
        loadDefinitions();
    }, []);

    const loadDefinitions = async () => {
        setLoading(true);
        try {
            const defs = await AdminService.getActivityDefinitions();
            // Defensive: ensure fields array exists to prevent crashes
            const safeDefs = defs.map(d => ({
                ...d,
                fields: d.fields || []
            }));
            setDefinitions(safeDefs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (def: ActivityDefinition) => {
        setEditingDef({
            ...def,
            fields: def.fields || []
        });
        setIsNew(false);
    };

    const handleCreate = () => {
        setEditingDef({
            id: '',
            label: '',
            isCore: false,
            color: '#64748b',
            fields: []
        });
        setIsNew(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDef) return;

        if (!editingDef.id) {
            alert("ID is required");
            return;
        }

        try {
            await AdminService.saveActivityDefinition(editingDef);
            setEditingDef(null);
            loadDefinitions();
        } catch (error) {
            console.error("Failed to save", error);
            alert("Failed to save definition");
        }
    };

    const addField = () => {
        if (!editingDef) return;
        const newField: ActivityFieldDefinition = {
            key: '',
            label: 'New Field',
            type: 'text',
            required: false
        };
        setEditingDef({
            ...editingDef,
            fields: [...editingDef.fields, newField]
        });
    };

    const updateField = (index: number, updates: Partial<ActivityFieldDefinition>) => {
        if (!editingDef) return;
        const newFields = [...editingDef.fields];

        // Validation check for key uniqueness and reserved words
        if (updates.key) {
            const key = updates.key;
            if (RESERVED_KEYS.includes(key)) {
                alert(`"${key}" is a reserved system key. Please use a different key.`);
                return;
            }
            // Check for duplicates within the current definition (excluding self)
            const isDuplicate = newFields.some((f, i) => i !== index && f.key === key);
            if (isDuplicate) {
                alert(`Key "${key}" is already used in this definition.`);
                return;
            }
        }

        newFields[index] = { ...newFields[index], ...updates };
        setEditingDef({ ...editingDef, fields: newFields });
    };

    const removeField = (index: number) => {
        if (!editingDef) return;
        const newFields = editingDef.fields.filter((_, i) => i !== index);
        setEditingDef({ ...editingDef, fields: newFields });
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Activity Types</h1>
                    <p className="text-slate-500">Manage system and custom activity definitions</p>
                </div>
                {!editingDef && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition-colors"
                    >
                        <Plus size={16} /> New Type
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LIST VIEW */}
                <div className="lg:col-span-1 space-y-4">
                    {definitions.map(def => (
                        <div
                            key={def.id}
                            onClick={() => handleEdit(def)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${editingDef?.id === def.id
                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                : 'border-slate-200 bg-white hover:border-blue-300'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: def.color || '#cbd5e1' }}
                                    />
                                    <span className="font-semibold text-slate-900">{def.label}</span>
                                </div>
                                {def.isCore && <span title="Core System Encrypted"><Lock size={14} className="text-slate-400" /></span>}
                            </div>
                            <div className="text-xs text-slate-500 font-mono bg-slate-100 inline-block px-2 py-1 rounded">
                                {def.id}
                            </div>
                        </div>
                    ))}
                </div>

                {/* EDITOR VIEW */}
                <div className="lg:col-span-2">
                    {editingDef ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    {isNew ? 'Create Definition' : 'Edit Definition'}
                                    {editingDef.isCore && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1"><Lock size={12} /> Core Locked</span>}
                                </h2>
                                <button onClick={() => setEditingDef(null)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                {/* Core Identity */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">ID (Key)</label>
                                        <input
                                            value={editingDef.id}
                                            onChange={e => setEditingDef({ ...editingDef, id: e.target.value })}
                                            disabled={!isNew} // Core or Existing IDs cannot be changed
                                            className="w-full p-2 border border-slate-300 rounded bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed font-mono text-sm"
                                            placeholder="e.g. lunch_meeting"
                                        />
                                        {editingDef.isCore && <p className="text-[10px] text-amber-600 mt-1">System ID cannot be changed</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Label</label>
                                        <input
                                            value={editingDef.label}
                                            onChange={e => setEditingDef({ ...editingDef, label: e.target.value })}
                                            className="w-full p-2 border border-slate-300 rounded text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Color (Hex)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={editingDef.color || '#cbd5e1'}
                                                onChange={e => setEditingDef({ ...editingDef, color: e.target.value })}
                                                className="h-9 w-9 p-0 border-0 rounded cursor-pointer"
                                            />
                                            <input
                                                value={editingDef.color}
                                                onChange={e => setEditingDef({ ...editingDef, color: e.target.value })}
                                                className="flex-1 p-2 border border-slate-300 rounded text-sm font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Icon (Lucide Name)</label>
                                        <input
                                            value={editingDef.icon || ''}
                                            onChange={e => setEditingDef({ ...editingDef, icon: e.target.value })}
                                            className="w-full p-2 border border-slate-300 rounded text-sm"
                                            placeholder="e.g. coffee"
                                        />
                                    </div>
                                </div>

                                {/* Zone B Fields Builder */}
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-slate-700">Custom Fields (Zone B)</h3>
                                        <button
                                            type="button"
                                            onClick={addField}
                                            className="text-xs bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1 rounded flex items-center gap-1 transition-colors"
                                        >
                                            <Plus size={12} /> Add Field
                                        </button>
                                    </div>

                                    <div className="p-4 space-y-4">
                                        {editingDef.fields.length === 0 && (
                                            <p className="text-center text-sm text-slate-400 italic py-4">No custom fields defined.</p>
                                        )}

                                        {editingDef.fields.map((field, idx) => (
                                            <div key={idx} className="flex gap-2 items-start bg-slate-50 p-3 rounded border border-slate-200">
                                                <div className="grid grid-cols-2 gap-2 flex-1">
                                                    <div>
                                                        <label className="text-[10px] text-slate-500 uppercase">Key</label>
                                                        <input
                                                            value={field.key}
                                                            onChange={e => updateField(idx, { key: e.target.value })}
                                                            className="w-full p-1.5 border border-slate-300 rounded text-sm font-mono"
                                                            placeholder="metadata_key"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-slate-500 uppercase">Label</label>
                                                        <input
                                                            value={field.label}
                                                            onChange={e => updateField(idx, { label: e.target.value })}
                                                            className="w-full p-1.5 border border-slate-300 rounded text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-slate-500 uppercase">Type</label>
                                                        <select
                                                            value={field.type}
                                                            onChange={e => updateField(idx, { type: e.target.value as ActivityFieldDefinition['type'] })}
                                                            className="w-full p-1.5 border border-slate-300 rounded text-sm"
                                                        >
                                                            <option value="text">Text</option>
                                                            <option value="number">Number</option>
                                                            <option value="date">Date</option>
                                                            <option value="boolean">Boolean</option>
                                                            <option value="select">Select Dropsown</option>
                                                        </select>
                                                    </div>

                                                    {field.type === 'select' && (
                                                        <div>
                                                            <label className="text-[10px] text-slate-500 uppercase">Options (Users, etc)</label>
                                                            <input
                                                                value={field.options?.join(', ') || ''}
                                                                onChange={e => updateField(idx, { options: e.target.value.split(',').map(s => s.trim()) })}
                                                                className="w-full p-1.5 border border-slate-300 rounded text-sm"
                                                                placeholder="Comma separated"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 pt-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={field.required}
                                                            onChange={e => updateField(idx, { required: e.target.checked })}
                                                            className="rounded text-slate-900"
                                                        />
                                                        <span className="text-xs text-slate-600">Required</span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeField(idx)}
                                                    className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded transition-colors mt-2"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-slate-100">
                                    <button
                                        type="submit"
                                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded shadow-sm hover:bg-black transition-colors font-medium"
                                    >
                                        <Save size={16} /> Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 border border-slate-200 border-dashed rounded-xl bg-slate-50/50 p-12">
                            <Edit2 size={48} className="mb-4 opacity-20" />
                            <p className="font-medium">Select an Activity Type to edit</p>
                            <p className="text-sm">or create a new one to extend the system</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
