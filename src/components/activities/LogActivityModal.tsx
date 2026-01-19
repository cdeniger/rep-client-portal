
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityService } from '../../services/ActivityService';
import type { ActivityDefinition, ActivityAssociations, Activity, PipelineDefinition } from '../../types/activities';
import { X, Save, Star, Clock } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface LogActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    associations: ActivityAssociations; // e.g., { contactId: "123" }
    initialData?: Activity; // If provided, we are in EDIT mode
    currentUser: { uid: string; email: string }; // We need this for ownerId
}

export default function LogActivityModal({ isOpen, onClose, associations, initialData, currentUser }: LogActivityModalProps) {
    const [definitions, setDefinitions] = useState<ActivityDefinition[]>([]);
    const [pipelines, setPipelines] = useState<PipelineDefinition[]>([]);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, watch, reset } = useForm({
        defaultValues: {
            type: initialData?.type || 'call',
            notes: initialData?.notes || '',
            performedAtDate: initialData?.performedAt?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            status: initialData?.status || 'completed',
            // Flat metadata for easier form handling, we reconstruct on submit
            metadata: initialData && 'metadata' in initialData ? initialData.metadata : {}
        }
    });

    const selectedType = watch('type');
    const selectedDef = definitions.find(d => d.id === selectedType);
    const isEditMode = !!initialData;

    useEffect(() => {
        if (isOpen) {
            loadConfig();
            if (initialData) {
                // Reset form with initial data
                const dateVal = initialData.performedAt?.toDate().toISOString().split('T')[0];
                reset({
                    type: initialData.type,
                    notes: initialData.notes,
                    performedAtDate: dateVal,
                    status: initialData.status,
                    metadata: (initialData as any).metadata || {}
                });
            } else {
                reset({
                    type: 'call',
                    notes: '',
                    performedAtDate: new Date().toISOString().split('T')[0],
                    status: 'completed',
                    metadata: {}
                });
            }
        }
    }, [isOpen, initialData]);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const [defs, pipes] = await Promise.all([
                ActivityService.getDefinitions(),
                ActivityService.getPipelines()
            ]);

            // Ensure core types exist in definitions for UI rendering if not in DB
            const coreTypes = ['interview', 'call', 'stage_change', 'email', 'note'];

            // Defensive: Ensure all loaded definitions have fields array
            const safeDefs = defs.map(d => ({ ...d, fields: d.fields || [] }));

            const mergedDefs = [...safeDefs];
            coreTypes.forEach(ct => {
                if (!mergedDefs.find(d => d.id === ct)) {
                    mergedDefs.push({ id: ct, label: ct.charAt(0).toUpperCase() + ct.slice(1), isCore: true, fields: [] });
                }
            });

            setDefinitions(mergedDefs);
            setPipelines(pipes);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const performedAt = Timestamp.fromDate(new Date(data.performedAtDate));
            const currentDef = definitions.find(d => d.id === data.type);

            // Clean metadata: filters out fields that don't belong to the current type
            // This prevents stale data from persisting if user switches types in the modal
            const cleanMetadata: Record<string, any> = {};

            // 1. Preserve Zone A (Core) fields relevant to this type
            if (data.type === 'interview') {
                cleanMetadata.round = data.metadata.round;
                cleanMetadata.rating = data.metadata.rating;
                cleanMetadata.interviewers = data.metadata.interviewers;
            } else if (data.type === 'stage_change') {
                cleanMetadata.pipelineKey = data.metadata.pipelineKey;
                cleanMetadata.toStage = data.metadata.toStage;
            } else if (data.type === 'email') {
                cleanMetadata.subject = data.metadata.subject;
                cleanMetadata.recipientEmail = data.metadata.recipientEmail;
                cleanMetadata.direction = data.metadata.direction;
            } else if (data.type === 'call') {
                cleanMetadata.outcome = data.metadata.outcome;
                cleanMetadata.durationMinutes = data.metadata.durationMinutes;
            }

            // 2. Preserve Zone B (Dynamic) fields defined in the configuration
            if (currentDef && currentDef.fields) {
                currentDef.fields.forEach(field => {
                    let val = data.metadata[field.key];

                    // Sanitize Numbers: "NaN" or empty string -> null
                    if (field.type === 'number') {
                        if (val === '' || val === null || val === undefined || isNaN(Number(val))) {
                            val = null;
                        } else {
                            val = Number(val);
                        }
                    }

                    if (val !== undefined) {
                        cleanMetadata[field.key] = val;
                    }
                });
            }

            // Structure payload properly
            const payload = {
                ownerId: currentUser.uid,
                type: data.type,
                notes: data.notes,
                status: data.status,
                performedAt,
                metadata: cleanMetadata, // Use cleaned metadata
                associations // Ensure associations are attached
            };

            if (isEditMode && initialData) {
                await ActivityService.updateActivity(initialData.id, payload);
            } else {
                await ActivityService.logActivity(data.type, payload, associations);
            }

            onClose();
            // Optional: trigger refresh callback
        } catch (e) {
            console.error("Failed to log activity", e);
            alert("Error saving activity");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                    <h2 className="text-lg font-serif text-stone-900">
                        {isEditMode ? 'Edit Activity' : 'Log Activity'}
                    </h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form id="activity-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        {/* Top Row: Type & Date */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Type</label>
                                <select
                                    {...register('type')}
                                    className="w-full p-2 border border-stone-300 rounded focus:border-blue-500 outline-none"
                                >
                                    {definitions.map(d => (
                                        <option key={d.id} value={d.id}>{d.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Date</label>
                                <input
                                    type="date"
                                    {...register('performedAtDate')}
                                    className="w-full p-2 border border-stone-300 rounded focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Zone A: Core Logic */}
                        {selectedType === 'interview' && (
                            <div className="p-4 bg-amber-50 rounded border border-amber-100 space-y-4">
                                <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                                    <Star size={14} /> Interview Details
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-amber-900 mb-1">Round</label>
                                        <select
                                            {...register('metadata.round')}
                                            className="w-full p-2 bg-white border border-amber-200 rounded text-sm"
                                        >
                                            <option value="Screening">Recruiter Screen</option>
                                            <option value="Hiring Manager">Hiring Manager</option>
                                            <option value="Technical">Technical / Case</option>
                                            <option value="Panel">Panel / Onsite</option>
                                            <option value="Final">Final Round</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-amber-900 mb-1">Rating (1-5)</label>
                                        <input
                                            type="number" min="1" max="5"
                                            {...register('metadata.rating', { valueAsNumber: true })}
                                            className="w-full p-2 bg-white border border-amber-200 rounded text-sm"
                                            placeholder="5"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs text-amber-900 mb-1">Interviewers (comma separated)</label>
                                        <input
                                            type="text"
                                            {...register('metadata.interviewers')} // Store as string for simple input, convert in service if robust
                                            className="w-full p-2 bg-white border border-amber-200 rounded text-sm"
                                            placeholder="e.g. Sarah Jones, Mike Ross"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedType === 'stage_change' && (
                            <div className="p-4 bg-blue-50 rounded border border-blue-100 space-y-4">
                                <h3 className="text-sm font-bold text-blue-800">Pipeline Move</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-blue-900 mb-1">Pipeline</label>
                                        <select
                                            {...register('metadata.pipelineKey')}
                                            className="w-full p-2 bg-white border border-blue-200 rounded text-sm"
                                        >
                                            {pipelines.map(p => (
                                                <option key={p.id} value={p.id}>{p.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-blue-900 mb-1">New Stage</label>
                                        <input
                                            type="text"
                                            {...register('metadata.toStage')}
                                            className="w-full p-2 bg-white border border-blue-200 rounded text-sm"
                                            placeholder="e.g. Offer"
                                        />
                                        {/* Advanced: Use definitions to populate dropdown */}
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedType === 'call' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Outcome</label>
                                    <select
                                        {...register('metadata.outcome')}
                                        className="w-full p-2 border border-stone-300 rounded text-sm"
                                    >
                                        <option value="Connected">Connected</option>
                                        <option value="Voicemail">Left Voicemail</option>
                                        <option value="Gatekeeper">Gatekeeper</option>
                                        <option value="No Answer">No Answer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Duration (min)</label>
                                    <div className="relative">
                                        <Clock size={14} className="absolute left-2 top-3 text-stone-400" />
                                        <input
                                            type="number"
                                            {...register('metadata.durationMinutes', { valueAsNumber: true })}
                                            className="w-full indent-6 p-2 border border-stone-300 rounded text-sm"
                                            placeholder="15"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Zone B: Dynamic Fields */}
                        {selectedDef && selectedDef.fields.length > 0 && (
                            <div className="p-4 bg-stone-50 rounded border border-stone-200 space-y-3">
                                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Additional Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedDef.fields.map(field => (
                                        <div key={field.key} className={field.type === 'text' ? 'col-span-2' : ''}>
                                            <label className="block text-xs text-stone-700 mb-1">{field.label}</label>

                                            {field.type === 'select' ? (
                                                <select
                                                    {...register(`metadata.${field.key}`, { required: field.required })}
                                                    className="w-full p-2 bg-white border border-stone-300 rounded text-sm"
                                                >
                                                    <option value="">Select...</option>
                                                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            ) : field.type === 'boolean' ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        {...register(`metadata.${field.key}`)}
                                                        className="h-4 w-4 text-blue-600 rounded"
                                                    />
                                                    <span className="text-sm text-stone-600">Yes</span>
                                                </div>
                                            ) : (
                                                <input
                                                    type={field.type === 'number' ? 'number' : 'text'}
                                                    {...register(`metadata.${field.key}`, { required: field.required })}
                                                    className="w-full p-2 bg-white border border-stone-300 rounded text-sm"
                                                    placeholder={field.placeholder}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Common: Notes */}
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Notes</label>
                            <textarea
                                {...register('notes')}
                                className="w-full p-3 border border-stone-300 rounded h-24 text-sm focus:border-blue-500 outline-none resize-none"
                                placeholder="Details about this interaction..."
                            ></textarea>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-stone-600 hover:text-stone-900 text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        form="activity-form"
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-stone-900 text-white rounded shadow-sm hover:bg-black text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : <><Save size={16} /> Save Activity</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
