import { PIPELINE_DEFS } from '../../config/pipelines';
import React, { useState } from 'react';
import PipelineBoard from '../../components/pipeline/PipelineBoard';
import type { Lead } from '../../types/pipeline';
import { Timestamp } from 'firebase/firestore';
import Modal from '../../components/ui/Modal';

// Mock Timestamp for generic usage since we aren't pulling from Firestore yet
const now = Timestamp.now();

const MOCK_SALES_ITEMS: Lead[] = [
    {
        id: 'lead-1',
        pipelineId: 'sales_v1',
        stageId: 'new_lead',
        type: 'lead',
        index: 0,
        createdAt: now,
        updatedAt: now,
        firstName: 'John',
        lastName: 'Doe',
        company: 'Acme Corp',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        source: 'LinkedIn',
        fitScore: 45,
        retainerAmount: 0,
        estimatedComp: 150000,
    },
    {
        id: 'lead-2',
        pipelineId: 'sales_v1',
        stageId: 'qualified_raw',
        type: 'lead',
        index: 0,
        createdAt: now,
        updatedAt: now,
        firstName: 'Sarah',
        lastName: 'Connor',
        company: 'SkyNet Systems',
        linkedinUrl: 'https://linkedin.com/in/sarahconnor',
        source: 'Referral',
        fitScore: 95, // High fit score test
        retainerAmount: 5000,
        estimatedComp: 220000,
    },
    {
        id: 'lead-3',
        pipelineId: 'sales_v1',
        stageId: 'proposal',
        type: 'lead',
        index: 0,
        createdAt: now,
        updatedAt: now,
        firstName: 'Michael',
        lastName: 'Scott',
        company: 'Dunder Mifflin',
        linkedinUrl: '',
        source: 'Outbound',
        fitScore: 70,
        retainerAmount: 3000,
        estimatedComp: 120000,
    },
    {
        id: 'lead-4',
        pipelineId: 'sales_v1',
        stageId: 'closed_won',
        type: 'lead',
        index: 0,
        createdAt: now,
        updatedAt: now,
        firstName: 'Bruce',
        lastName: 'Wayne',
        company: 'Wayne Enterprises',
        linkedinUrl: 'https://linkedin.com/in/bwayne',
        source: 'Event',
        fitScore: 88,
        retainerAmount: 10000,
        estimatedComp: 500000,
    }
];

export default function SalesPipeline() {
    const [items, setItems] = useState<Lead[]>(MOCK_SALES_ITEMS);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    const handleItemClick = (item: any) => {
        // Only handle Leads for now
        if (item.type === 'lead') {
            setSelectedLead(item as Lead);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLead) return;

        setItems(prev => prev.map(item =>
            item.id === selectedLead.id ? selectedLead : item
        ));
        setSelectedLead(null);
    };

    const handleChange = (field: keyof Lead, value: any) => {
        if (!selectedLead) return;
        setSelectedLead({ ...selectedLead, [field]: value });
    };

    return (
        <div className="h-full flex flex-col">
            <PipelineBoard
                definitionId="sales_v1"
                items={items}
                onItemClick={handleItemClick}
            />

            <Modal
                isOpen={!!selectedLead}
                onClose={() => setSelectedLead(null)}
                title="Edit Lead"
            >
                {selectedLead && (
                    <form onSubmit={handleSave} className="space-y-4">
                        {/* Status / Stage Selection */}
                        <div className="bg-slate-50 p-3 rounded border border-slate-200 mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pipeline Status</label>
                            <select
                                value={selectedLead.stageId}
                                onChange={e => handleChange('stageId', e.target.value)}
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none bg-white font-medium text-slate-700"
                            >
                                {PIPELINE_DEFS.sales_v1.stages.map(stage => (
                                    <option key={stage.id} value={stage.id}>
                                        {stage.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">First Name</label>
                                <input
                                    type="text"
                                    value={selectedLead.firstName}
                                    onChange={e => handleChange('firstName', e.target.value)}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Last Name</label>
                                <input
                                    type="text"
                                    value={selectedLead.lastName}
                                    onChange={e => handleChange('lastName', e.target.value)}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company</label>
                            <input
                                type="text"
                                value={selectedLead.company}
                                onChange={e => handleChange('company', e.target.value)}
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">LinkedIn URL</label>
                            <input
                                type="text"
                                value={selectedLead.linkedinUrl}
                                onChange={e => handleChange('linkedinUrl', e.target.value)}
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Source</label>
                                <input
                                    type="text"
                                    value={selectedLead.source}
                                    onChange={e => handleChange('source', e.target.value)}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Retainer ($)</label>
                                <input
                                    type="number"
                                    value={selectedLead.retainerAmount}
                                    onChange={e => handleChange('retainerAmount', parseInt(e.target.value) || 0)}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fit Score</label>
                                <input
                                    type="number"
                                    value={selectedLead.fitScore}
                                    onChange={e => handleChange('fitScore', parseInt(e.target.value) || 0)}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Est. Comp ($)</label>
                                <input
                                    type="number"
                                    value={selectedLead.estimatedComp}
                                    onChange={e => handleChange('estimatedComp', parseInt(e.target.value) || 0)}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                            <button
                                type="button"
                                onClick={() => setSelectedLead(null)}
                                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
