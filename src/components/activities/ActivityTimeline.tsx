
import React, { useEffect, useState } from 'react';
import { ActivityService } from '../../services/ActivityService';
import type { Activity, ActivityAssociations } from '../../types/activities';
import ActivityCardFactory from './ActivityCardFactory';
import LogActivityModal from './LogActivityModal';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ActivityTimelineProps {
    associationId: string;
    associationType: 'contactId' | 'companyId' | 'engagementId' | 'pursuitId';
    associationData: ActivityAssociations; // Full object for new activities
}

export default function ActivityTimeline({ associationId, associationType, associationData }: ActivityTimelineProps) {
    const { user } = useAuth();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | undefined>(undefined);

    useEffect(() => {
        loadActivities();
    }, [associationId]);

    const loadActivities = async () => {
        setLoading(true);
        try {
            const data = await ActivityService.getActivitiesForTarget(associationId, associationType);
            setActivities(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (activity: Activity) => {
        setEditingActivity(activity);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingActivity(undefined);
        loadActivities(); // Refresh
    };

    if (!user) return null;

    return (
        <div className="h-full flex flex-col bg-stone-50/50">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-stone-200 bg-white">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Activity Timeline</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1 text-xs font-medium text-white bg-stone-900 px-3 py-1.5 rounded hover:bg-black transition-colors"
                >
                    <Plus size={14} /> Log Activity
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-stone-400 text-sm">Loading activities...</div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-12 text-stone-400 text-sm border-2 border-dashed border-stone-200 rounded-lg">
                        No activities yet. Log one to get started.
                    </div>
                ) : (
                    <div className="relative space-y-4 before:content-[''] before:absolute before:left-8 before:top-4 before:bottom-4 before:w-px before:bg-stone-200 before:-z-10">
                        {activities.map(activity => (
                            <div key={activity.id} className="relative z-10 pl-0">
                                <ActivityCardFactory activity={activity} onEdit={handleEdit} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <LogActivityModal
                isOpen={isModalOpen}
                onClose={handleClose}
                associations={associationData}
                initialData={editingActivity}
                currentUser={{ uid: user.uid, email: user.email || '' }}
            />
        </div>
    );
}
