import { useState, useEffect } from 'react';
import type { Opportunity } from '../../types/schema';

interface OpportunityFormProps {
    initialData?: Partial<Opportunity>;
    onSubmit: (data: Partial<Opportunity>) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

export default function OpportunityForm({ initialData, onSubmit, onCancel, isSubmitting }: OpportunityFormProps) {
    const [formData, setFormData] = useState<Partial<Opportunity>>({
        company: '',
        role: '',
        stage_detail: '',
        status: 'outreach', // Default
        financials: { base: 0, bonus: 0, equity: '', rep_net_value: 0 },
        ...initialData
    });

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Company</label>
                <input
                    required
                    className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-signal-orange outline-none"
                    placeholder="e.g. Acme Corp"
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                />
            </div>
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Role Title</label>
                <input
                    required
                    className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-signal-orange outline-none"
                    placeholder="e.g. Senior Director, Product"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                />
            </div>
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Status</label>
                <select
                    className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-signal-orange outline-none bg-white"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                >
                    <option value="outreach">Outreach</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offer">Offer Received</option>
                    <option value="negotiating">Negotiating</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Stage Detail</label>
                <input
                    required
                    className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-signal-orange outline-none"
                    placeholder="e.g. Outreach sent via LinkedIn"
                    value={formData.stage_detail}
                    onChange={e => setFormData({ ...formData, stage_detail: e.target.value })}
                />
            </div>

            {/* Financials Section (Optional) */}
            <div className="pt-4 border-t border-gray-100 mt-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-oxford-green mb-3">Financials (Est.)</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Base Salary</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-gray-200 rounded-sm text-sm outline-none"
                            value={formData.financials?.base || 0}
                            onChange={e => setFormData({
                                ...formData,
                                financials: { ...(formData.financials || { base: 0, bonus: 0, equity: '', rep_net_value: 0 }), base: parseInt(e.target.value) || 0 }
                            })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Rep Net Value</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-gray-200 rounded-sm text-sm outline-none"
                            value={formData.financials?.rep_net_value || 0}
                            onChange={e => setFormData({
                                ...formData,
                                financials: { ...(formData.financials || { base: 0, bonus: 0, equity: '', rep_net_value: 0 }), rep_net_value: parseInt(e.target.value) || 0 }
                            })}
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4 flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 border border-gray-200 text-gray-500 font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-oxford-green text-white font-bold py-3 text-sm uppercase tracking-widest rounded-sm hover:bg-opacity-90 disabled:opacity-50"
                >
                    {isSubmitting ? 'Saving...' : 'Save Opportunity'}
                </button>
            </div>
        </form>
    );
}
