import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { where, addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { findOrCreateCompany } from '../lib/companies';
import type { JobPursuit } from '../types/schema';
import { Plus, Building, Briefcase, DollarSign, Edit2 } from 'lucide-react';
import Modal from '../components/ui/Modal';
import OpportunityForm from '../components/forms/OpportunityForm';

export default function Pipeline() {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOpp, setEditingOpp] = useState<JobPursuit | undefined>(undefined);
    const [processing, setProcessing] = useState(false);

    // Fetch Job Pursuits (Active Pipeline)
    const { data: opportunities, loading } = useCollection<any>(
        'job_pursuits',
        where('userId', '==', user?.uid || '')
    );

    const handleOpenAdd = () => {
        setEditingOpp(undefined);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (opp: JobPursuit) => {
        setEditingOpp(opp);
        setIsModalOpen(true);
    };

    const handleSave = async (data: Partial<JobPursuit>) => {
        if (!user) return;
        setProcessing(true);
        try {
            if (editingOpp) {
                // Edit Mode - Update the Pursuit
                const oppRef = doc(db, 'job_pursuits', editingOpp.id);
                await updateDoc(oppRef, data);
            } else {
                // Create Mode - Dual Creation Pattern

                // 1. Find or Create Company
                const companyId = await findOrCreateCompany(data.company || 'Unknown');

                // 2. Create Job Target (Market Inventory)
                const targetRef = await addDoc(collection(db, 'job_targets'), {
                    company: data.company,
                    role: data.role,
                    stage_detail: data.stage_detail,
                    financials: data.financials,
                    source: 'manual',
                    status: 'OPEN',
                    createdAt: new Date().toISOString(),
                });

                // 3. Create Job Pursuit (Client Application)
                await addDoc(collection(db, 'job_pursuits'), {
                    targetId: targetRef.id,
                    userId: user.uid,
                    // Note: We don't have engagementId easily available here in the Client view 
                    // without fetching it first. For now, we rely on the Rep to "claim" or "link" it later,
                    // OR we should ideally fetch the client's generic engagement ID. 
                    // However, for the "My Pipeline" view, userId is sufficient for visibility.
                    // To follow strict schema, we should try to find the engagementId.

                    companyId: companyId, // Linked Company Record
                    company: data.company,
                    role: data.role,
                    status: data.status || 'outreach',
                    stage_detail: data.stage_detail,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    financials: data.financials || { base: 0, bonus: 0, equity: '', rep_net_value: 0 }
                });
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
            alert('Failed to save opportunity.');
        } finally {
            setProcessing(false);
        }
    };

    const statusGroups = [
        { id: 'negotiating', label: 'Negotiating', color: 'bg-signal-orange' },
        { id: 'offer', label: 'Offer Received', color: 'bg-green-500' },
        { id: 'interviewing', label: 'Active Interviewing', color: 'bg-blue-500' },
        { id: 'outreach', label: 'Outreach / Early', color: 'bg-gray-400' },
    ];

    if (loading) return <div className="text-gray-400 text-sm animate-pulse">Loading Pipeline...</div>;

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-oxford-green mb-1">Pipeline</h1>
                    <p className="text-gray-500 text-sm">Manage your active opportunities.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="bg-oxford-green text-white px-4 py-2 rounded-sm font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-opacity-90 transition-opacity"
                >
                    <Plus className="h-4 w-4" />
                    Add Opportunity
                </button>
            </div>

            {/* Grouped List */}
            <div className="space-y-8">
                {statusGroups.map(group => {
                    const groupOpps = opportunities.filter(o => o.status === group.id);
                    if (groupOpps.length === 0) return null;

                    return (
                        <div key={group.id}>
                            <div className="flex items-center gap-2 mb-4">
                                <div className={`h-2 w-2 rounded-full ${group.color}`}></div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">{group.label}</h3>
                                <span className="text-xs text-gray-400">({groupOpps.length})</span>
                            </div>

                            <div className="grid gap-4">
                                {groupOpps.map(opp => (
                                    <div
                                        key={opp.id}
                                        onClick={() => handleOpenEdit(opp)}
                                        className="bg-white p-4 rounded-sm border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-signal-orange cursor-pointer group transition-all"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="bg-gray-50 p-2 rounded-sm group-hover:bg-orange-50 transition-colors">
                                                <Building className="h-5 w-5 text-gray-400 group-hover:text-signal-orange" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-oxford-green text-lg group-hover:text-signal-orange transition-colors">{opp.company}</h4>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Briefcase className="h-3 w-3" />
                                                    {opp.role}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Current Stage</div>
                                                <div className="text-sm font-medium text-oxford-green">{opp.stage_detail}</div>
                                            </div>
                                            {opp.financials && opp.financials.base > 0 && (
                                                <div className="text-right pl-6 border-l border-gray-100 hidden sm:block">
                                                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Est. Value</div>
                                                    <div className="text-sm font-bold text-oxford-green flex items-center justify-end gap-1">
                                                        <DollarSign className="h-3 w-3" />
                                                        {(opp.financials.rep_net_value / 1000).toFixed(0)}k
                                                    </div>
                                                </div>
                                            )}
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2">
                                                <Edit2 className="h-4 w-4 text-gray-300" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {opportunities.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 rounded-sm border border-dashed border-gray-300">
                        <p className="text-gray-500 mb-4">No opportunities tracked yet.</p>
                        <button
                            onClick={handleOpenAdd}
                            className="text-signal-orange font-bold text-sm uppercase tracking-widest hover:underline"
                        >
                            Add your first opportunity
                        </button>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingOpp ? `Edit ${editingOpp.company}` : "Add New Opportunity"}
            >
                <OpportunityForm
                    initialData={editingOpp}
                    onSubmit={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                    isSubmitting={processing}
                />
            </Modal>
        </div>
    );
}
