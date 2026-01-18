
import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase'; // Corrected path
import type { PipelineDefinition, ActivityDefinition } from '../types/activities';

const PIPELINES_COLLECTION = 'pipeline_definitions';
const ACTIVITY_DEFS_COLLECTION = 'activity_definitions';

export const AdminService = {
    // --- Pipelines ---
    async getPipelines(): Promise<PipelineDefinition[]> {
        const snapshot = await getDocs(collection(db, PIPELINES_COLLECTION));
        return snapshot.docs.map(d => d.data() as PipelineDefinition);
    },

    async savePipeline(pipeline: PipelineDefinition): Promise<void> {
        const ref = doc(db, PIPELINES_COLLECTION, pipeline.id);
        await setDoc(ref, pipeline);
    },

    async initializeDefaultPipelines() {
        const defaults: PipelineDefinition[] = [
            {
                id: 'job_search',
                label: 'Job Search',
                stages: [
                    { id: 'outreach', label: 'Outreach', color: '#64748b', order: 0 },
                    { id: 'interviewing', label: 'Interviewing', color: '#f59e0b', order: 1 },
                    { id: 'offer', label: 'Offer', color: '#10b981', order: 2 },
                    { id: 'negotiating', label: 'Negotiating', color: '#8b5cf6', order: 3 },
                    { id: 'closed', label: 'Closed', color: '#1e293b', order: 4 }
                ]
            },
            {
                id: 'client_origination',
                label: 'Client Origination',
                stages: [
                    { id: 'lead', label: 'Lead', color: '#94a3b8', order: 0 },
                    { id: 'meeting', label: 'Meeting', color: '#3b82f6', order: 1 },
                    { id: 'proposal', label: 'Proposal', color: '#f59e0b', order: 2 },
                    { id: 'signed', label: 'Signed', color: '#10b981', order: 3 }
                ]
            }
        ];

        for (const p of defaults) {
            await this.savePipeline(p);
        }
    },

    // --- Activity Definitions ---
    async getActivityDefinitions(): Promise<ActivityDefinition[]> {
        const snapshot = await getDocs(collection(db, ACTIVITY_DEFS_COLLECTION));
        return snapshot.docs.map(d => d.data() as ActivityDefinition);
    },

    async saveActivityDefinition(def: ActivityDefinition): Promise<void> {
        const ref = doc(db, ACTIVITY_DEFS_COLLECTION, def.id);
        await setDoc(ref, def);
    }
};
