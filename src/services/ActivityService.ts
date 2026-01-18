
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    query,
    where,
    getDocs,
    Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Activity, ActivityAssociations } from '../types/activities';
import { AdminService } from './AdminService';

const ACTIVITIES_COLLECTION = 'activities';

export const ActivityService = {

    async logActivity(
        type: string,
        baseData: Partial<Activity>,
        associations: ActivityAssociations
    ): Promise<string> {

        // Prepare payload
        const now = Timestamp.now();
        const payload: any = {
            ...baseData,
            type,
            associations,
            createdAt: now,
            updatedAt: now,
            // ownerId should be set by context, but we might pass it in baseData
            status: baseData.status || 'completed'
        };

        // If performedAt is missing, use now
        if (!payload.performedAt) {
            payload.performedAt = now;
        }

        const docRef = await addDoc(collection(db, ACTIVITIES_COLLECTION), payload);
        return docRef.id;
    },

    async updateActivity(id: string, updates: Partial<Activity>): Promise<void> {
        const ref = doc(db, ACTIVITIES_COLLECTION, id);
        const payload = {
            ...updates,
            updatedAt: Timestamp.now()
        };
        await updateDoc(ref, payload);
    },

    async getActivitiesForTarget(
        associationId: string,
        associationType: 'contactId' | 'companyId' | 'engagementId' | 'pursuitId'
    ): Promise<Activity[]> {
        const q = query(
            collection(db, ACTIVITIES_COLLECTION),
            where(`associations.${associationType}`, '==', associationId)
        );

        const snapshot = await getDocs(q);
        const activities = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Activity));

        // Client-side sort to be robust against missing composite indexes
        return activities.sort((a, b) => {
            const timeA = a.performedAt?.toMillis() || 0;
            const timeB = b.performedAt?.toMillis() || 0;
            return timeB - timeA; // Descending
        });
    },

    // Helper to get definitions for the UI
    getDefinitions: AdminService.getActivityDefinitions,
    getPipelines: AdminService.getPipelines
};
