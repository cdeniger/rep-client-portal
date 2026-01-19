
import {
    collection,
    doc,
    getDocs,
    setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { PipelineDefinition } from '../types/pipeline';
import type { ActivityDefinition } from '../types/activities';

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
