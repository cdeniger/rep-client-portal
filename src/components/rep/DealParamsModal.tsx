import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Modal from '../ui/Modal';
import type { Engagement } from '../../types/schema';

interface DealParamsModalProps {
    isOpen: boolean;
    onClose: () => void;
    engagement: Engagement; // We need the ID and current searchCriteria
}

export default function DealParamsModal({ isOpen, onClose, engagement }: DealParamsModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        minBase: 0,
        targetTotal: 0,
        minLevel: 3,
        primaryFunction: '',
        locationType: 'hybrid',
        targetLocations: '', // Comma separated string for editing
        excludedIndustries: '' // Comma separated string for editing
    });

    useEffect(() => {
        if (isOpen && engagement.searchCriteria) {
            setFormData({
                minBase: engagement.searchCriteria.minBase || 0,
                targetTotal: engagement.searchCriteria.targetTotal || 0,
                minLevel: engagement.searchCriteria.minLevel || 3,
                primaryFunction: engagement.searchCriteria.primaryFunction || '',
                locationType: engagement.searchCriteria.locationType || 'hybrid',
                targetLocations: (engagement.searchCriteria.targetLocations || []).join(', '),
                excludedIndustries: (engagement.searchCriteria.excludedIndustries || []).join(', ')
            });
        }
    }, [isOpen, engagement]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const engRef = doc(db, 'engagements', engagement.id);

            // Parse comma-separated strings back to arrays
            const targetLocationsArray = formData.targetLocations
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            const excludedIndustriesArray = formData.excludedIndustries
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            await updateDoc(engRef, {
                'searchCriteria.minBase': Number(formData.minBase),
                'searchCriteria.targetTotal': Number(formData.targetTotal),
                'searchCriteria.minLevel': Number(formData.minLevel),
                'searchCriteria.primaryFunction': formData.primaryFunction,
                'searchCriteria.locationType': formData.locationType,
                'searchCriteria.targetLocations': targetLocationsArray,
                'searchCriteria.excludedIndustries': excludedIndustriesArray
            });

            onClose();
        } catch (error) {
            console.error("Failed to update deal params:", error);
            alert("Failed to save deal parameters.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Deal Parameters">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Min Base Salary ($)
                        </label>
                        <input
                            type="number"
                            required
                            className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                            value={formData.minBase}
                            onChange={(e) => setFormData({ ...formData, minBase: Number(e.target.value) })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Target Total Comp ($)
                        </label>
                        <input
                            type="number"
                            required
                            className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                            value={formData.targetTotal}
                            onChange={(e) => setFormData({ ...formData, targetTotal: Number(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Min Level (Anchor)
                        </label>
                        <select
                            className="w-full p-2 border border-slate-300 rounded-sm text-sm bg-white"
                            value={formData.minLevel}
                            onChange={(e) => setFormData({ ...formData, minLevel: Number(e.target.value) })}
                        >
                            <option value={1}>IC3 (Senior)</option>
                            <option value={2}>IC4 / M1 (Lead/Mgr)</option>
                            <option value={3}>IC5 / M2 (Princ/Sr Mgr)</option>
                            <option value={4}>Director</option>
                            <option value={5}>VP / Head of</option>
                            <option value={6}>C-Suite</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Primary Function
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Product, Eng"
                            className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                            value={formData.primaryFunction}
                            onChange={(e) => setFormData({ ...formData, primaryFunction: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Location Mode
                    </label>
                    <select
                        className="w-full p-2 border border-slate-300 rounded-sm text-sm bg-white"
                        value={formData.locationType}
                        onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                    >
                        <option value="remote">Remote Only</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="onsite">Onsite</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Target Locations (Comma Separated)
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. New York, SF, London"
                        className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                        value={formData.targetLocations}
                        onChange={(e) => setFormData({ ...formData, targetLocations: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Excluded Industries (Comma Separated)
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Gambling, Tobacco, AdTech"
                        className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                        value={formData.excludedIndustries}
                        onChange={(e) => setFormData({ ...formData, excludedIndustries: e.target.value })}
                    />
                </div>

                <div className="pt-4 flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2 border border-slate-300 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 py-2 bg-oxford-green text-white font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-opacity-90 disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : 'Save Parameters'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
