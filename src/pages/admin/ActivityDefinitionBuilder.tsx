import { useEffect, useState } from 'react';
import { AdminService } from '../../services/AdminService';
import type { ActivityDefinition, ActivityFieldDefinition } from '../../types/activities';
import { Plus, Save, Trash2, Edit2 } from 'lucide-react';

const CORE_TYPES = ['interview', 'call', 'stage_change', 'email', 'note'];

export default function ActivityDefinitionBuilder() {
    const [definitions, setDefinitions] = useState<ActivityDefinition[]>([]);
    const [selectedDefId, setSelectedDefId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // For creating/editing fields
    const [editingField, setEditingField] = useState<Partial<ActivityFieldDefinition> | null>(null);
    const [isNewField, setIsNewField] = useState(false);

    useEffect(() => {
        loadDefinitions();
    }, []);

    const loadDefinitions = async () => {
        setLoading(true);
        try {
            const stored = await AdminService.getActivityDefinitions();
            // Merge with core types if they don't exist in DB yet
            const merged = [...stored];

            CORE_TYPES.forEach(coreType => {
                if (!merged.find(d => d.id === coreType)) {
                    merged.push({
                        id: coreType,
                        label: coreType.charAt(0).toUpperCase() + coreType.slice(1),
                        isCore: true,
                        fields: []
                    });
                }
            });

            setDefinitions(merged);
            if (merged.length > 0 && !selectedDefId) setSelectedDefId(merged[0].id);

        } catch (error) {
            console.error("Failed to load definitions", error);
        } finally {
            setLoading(false);
        }
    };

    const activeDef = definitions.find(d => d.id === selectedDefId);

    const handleSaveDefinition = async () => {
        if (!activeDef) return;
        try {
            await AdminService.saveActivityDefinition(activeDef);
            alert('Definition saved!');
        } catch (e) {
            console.error(e);
            alert('Failed to save');
        }
    };

    const handleAddField = () => {
        setEditingField({
            key: '',
            label: '',
            type: 'text'
        });
        setIsNewField(true);
    };

    const handleSaveField = () => {
        if (!activeDef || !editingField || !editingField.key || !editingField.label) return;

        const newField = editingField as ActivityFieldDefinition;

        // Auto-generate key if empty (simple sanitization)
        if (!newField.key) {
            newField.key = newField.label.toLowerCase().replace(/\s+/g, '_');
        }

        let newFields = [...activeDef.fields];
        if (isNewField) {
            newFields.push(newField);
        } else {
            newFields = newFields.map(f => f.key === newField.key ? newField : f);
        }

        const updatedDef = { ...activeDef, fields: newFields };
        setDefinitions(prev => prev.map(d => d.id === activeDef.id ? updatedDef : d));
        setEditingField(null);
    };

    const removeField = (key: string) => {
        if (!activeDef) return;
        if (!confirm("Delete this field?")) return;
        const newFields = activeDef.fields.filter(f => f.key !== key);
        setDefinitions(prev => prev.map(d => d.id === activeDef.id ? { ...d, fields: newFields } : d));
    };

    const createCustomType = () => {
        const name = prompt("Enter name for new Activity Type:");
        if (!name) return;
        const id = name.toLowerCase().replace(/\s+/g, '_');

        if (definitions.find(d => d.id === id)) {
            alert("Type already exists");
            return;
        }

        const newDef: ActivityDefinition = {
            id,
            label: name,
            isCore: false,
            fields: []
        };
        setDefinitions(prev => [...prev, newDef]);
        setSelectedDefId(id);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="flex justify-between items-end mb-8 border-b border-stone-200 pb-4">
                <div>
                    <h1 className="text-2xl font-serif text-stone-900">Activity Definitions</h1>
                    <p className="text-stone-500 mt-2">Manage custom types and extra fields.</p>
                </div>
                <button
                    onClick={handleSaveDefinition}
                    className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow flex items-center gap-2"
                >
                    <Save size={16} /> Save Changes
                </button>
            </header>

            <div className="grid grid-cols-12 gap-8">
                {/* Sidebar */}
                <div className="col-span-3">
                    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden mb-4">
                        <div className="p-3 bg-stone-50 border-b border-stone-200 font-medium text-stone-600 text-xs uppercase tracking-wider">
                            Activity Types
                        </div>
                        {definitions.map(d => (
                            <button
                                key={d.id}
                                onClick={() => { setSelectedDefId(d.id); setEditingField(null); }}
                                className={`w-full text-left px-4 py-3 text-sm border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors flex justify-between items-center ${selectedDefId === d.id
                                    ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-l-blue-600'
                                    : 'text-stone-700 border-l-4 border-l-transparent'
                                    }`}
                            >
                                <span>{d.label}</span>
                                {d.isCore && <span className="text-[10px] bg-stone-200 text-stone-600 px-1 rounded">CORE</span>}
                            </button>
                        ))}
                    </div>
                    <button onClick={createCustomType} className="w-full py-2 text-sm border-2 border-dashed border-stone-300 text-stone-500 rounded hover:border-blue-400 hover:text-blue-500 transition-colors">
                        + Create Custom Type
                    </button>
                </div>

                {/* Main Content */}
                <div className="col-span-9">
                    {activeDef ? (
                        <div className="bg-white rounded-lg border border-stone-200 shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-medium text-stone-800 flex items-center gap-2">
                                    {activeDef.label}
                                    <span className="text-sm font-normal text-stone-400 font-mono">({activeDef.id})</span>
                                </h2>
                                {!activeDef.isCore && (
                                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">Custom Type</span>
                                )}
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Custom Fields</h3>
                                    <button onClick={handleAddField} className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:text-blue-800">
                                        <Plus size={14} /> Add Field
                                    </button>
                                </div>

                                {activeDef.fields.length === 0 && (
                                    <div className="p-4 bg-stone-50 text-stone-400 text-sm text-center rounded border border-stone-100">
                                        No custom fields configured.
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {activeDef.fields.map((field) => (
                                        <div key={field.key} className="flex items-center justify-between p-3 bg-white border border-stone-200 rounded hover:border-blue-200 group">
                                            <div>
                                                <div className="font-medium text-stone-800">{field.label}</div>
                                                <div className="text-xs text-stone-400 font-mono flex gap-2">
                                                    <span>{field.key}</span>
                                                    <span className="text-stone-300">•</span>
                                                    <span>{field.type}</span>
                                                    {field.required && <span className="text-red-400">• Required</span>}
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setEditingField(field); setIsNewField(false); }}
                                                    className="p-1 text-stone-400 hover:text-blue-600"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => removeField(field.key)}
                                                    className="p-1 text-stone-400 hover:text-red-600"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Field Editor Modal/Inline */}
                            {editingField && (
                                <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-100">
                                    <h4 className="text-sm font-bold text-blue-900 mb-3">{isNewField ? 'Add New Field' : 'Edit Field'}</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-xs uppercase text-blue-500 font-bold mb-1">Label</label>
                                            <input
                                                className="w-full px-2 py-1 border border-blue-200 rounded text-sm"
                                                value={editingField.label}
                                                onChange={e => setEditingField({ ...editingField, label: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase text-blue-500 font-bold mb-1">Key (auto-generated if empty)</label>
                                            <input
                                                className="w-full px-2 py-1 border border-blue-200 rounded text-sm font-mono"
                                                value={editingField.key}
                                                disabled={!isNewField}
                                                onChange={e => setEditingField({ ...editingField, key: e.target.value })}
                                                placeholder="e.g. budget_amount"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase text-blue-500 font-bold mb-1">Type</label>
                                            <select
                                                className="w-full px-2 py-1 border border-blue-200 rounded text-sm"
                                                value={editingField.type}
                                                onChange={e => setEditingField({ ...editingField, type: e.target.value as any })}
                                            >
                                                <option value="text">Text</option>
                                                <option value="number">Number</option>
                                                <option value="boolean">Checkbox</option>
                                                <option value="date">Date</option>
                                                <option value="select">Dropdown</option>
                                                <option value="rating">Rating</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center">
                                            <label className="flex items-center gap-2 text-sm text-blue-800 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={editingField.required || false}
                                                    onChange={e => setEditingField({ ...editingField, required: e.target.checked })}
                                                />
                                                Required Field
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setEditingField(null)}
                                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveField}
                                            className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded shadow-sm"
                                        >
                                            {isNewField ? 'Add Field' : 'Update Field'}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400 bg-stone-50 rounded-lg border-2 border-dashed border-stone-200">
                            Select an activity type to configure
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
