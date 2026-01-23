import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { addDoc, collection, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { findOrCreateCompany } from '../lib/companies';
import type { JobPursuit } from '../types/schema';
import { Plus, Briefcase } from 'lucide-react';
import Modal from '../components/ui/Modal';
import OpportunityForm from '../components/forms/OpportunityForm';
import PipelineBoard from '../components/pipeline/PipelineBoard';

export default function Pipeline() {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOpp, setEditingOpp] = useState<JobPursuit | undefined>(undefined);
    const [processing, setProcessing] = useState(false);

    // 1. Fetch Active Engagement (Context Root)
    const { data: engagements } = useCollection<any>(
        'engagements',
        where('userId', '==', user?.uid || '')
    );
    const activeEngagement = engagements.find((e: any) => ['active', 'searching', 'negotiating', 'placed'].includes(e.status));

    // 2. Fetch Job Pursuits (Scoped to Engagement)
    const { data: opportunities, loading } = useCollection<any>(
        'job_pursuits',
        where('engagementId', '==', activeEngagement?.id || 'no_op')
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

                if (!activeEngagement) {
                    alert("No active engagement found. Cannot create opportunity.");
                    return;
                }

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
                    engagementId: activeEngagement.id,
                    // Note: We adhere to the rule that Engagement ID is the primary relationship key.

                    companyId: companyId, // Linked Company Record
                    company: data.company,
                    role: data.role,
                    stageId: data.stageId || 'target_locked',
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

    if (loading) return <div className="text-gray-400 text-sm animate-pulse">Loading Pipeline...</div>;

    return (
        <div className="w-full mx-auto p-6">
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

            {/* Kanban Board */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-auto min-h-[calc(100vh-200px)] flex flex-col">
                {opportunities.length > 0 ? (
                    <PipelineBoard
                        definitionId="delivery_v1"
                        items={opportunities.map((p: any) => ({
                            ...p,
                            type: 'job_pursuit',
                            companyName: p.company,
                            roleTitle: p.role,
                            dealValue: p.financials?.rep_net_value || 0,
                            index: 0 // Index sorting handles order within columns if needed
                        }))}
                        onItemClick={(item) => handleOpenEdit(item as unknown as JobPursuit)}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white">
                        <div className="p-4 bg-slate-50 rounded-full mb-4">
                            <Briefcase className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-2">No Active Pipeline</h3>
                        <p className="text-slate-500 max-w-sm mb-6">
                            You don't have any opportunities in your pipeline yet. Add one to get started.
                        </p>
                        <button
                            onClick={handleOpenAdd}
                            className="text-signal-orange font-bold text-sm uppercase tracking-widest hover:underline"
                        >
                            Create First Opportunity
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
