import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, isToday, isYesterday } from 'date-fns';
import { Filter, Plus } from 'lucide-react';
import type { Activity, ActivityDefinition } from '../types/activities';
import ActivityRowItem from '../components/activities/ActivityRowItem';
import LogActivityModal from '../components/activities/LogActivityModal';
import { useAuth } from '../context/AuthContext';

export default function Activities() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [definitions, setDefinitions] = useState<ActivityDefinition[]>([]);
    const [filterType, setFilterType] = useState<string | 'all'>('all');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuth();

    // 1. Fetch Definitions
    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'activity_definitions'), (snap) => {
            const defs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityDefinition));
            setDefinitions(defs);
        });
        return () => unsub();
    }, []);

    // 2. Fetch Activities
    useEffect(() => {
        const q = query(
            collection(db, 'activities'),
            orderBy('performedAt', 'desc')
        );

        const unsub = onSnapshot(q, (snap) => {
            const acts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Activity));
            setActivities(acts);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    // 3. Filter Logic
    const filteredActivities = useMemo(() => {
        if (filterType === 'all') return activities;
        return activities.filter(a => a.type === filterType);
    }, [activities, filterType]);


    // Better sort keys logic:
    // Ideally we iterate the sorted activities and build the groups array in order.
    // Correct approach to maintain strict order:

    const orderedGroups = useMemo(() => {
        const groupsMap = new Map<string, Activity[]>();

        filteredActivities.forEach(act => {
            const date = act.performedAt.toDate();
            let key = format(date, 'MMMM d, yyyy');
            if (isToday(date)) key = 'Today';
            else if (isYesterday(date)) key = 'Yesterday';

            if (!groupsMap.has(key)) groupsMap.set(key, []);
            groupsMap.get(key)!.push(act);
        });

        return Array.from(groupsMap.entries());
    }, [filteredActivities]);


    if (loading) return <div className="p-8 text-slate-400">Loading feed...</div>;

    return (
        <div className="flex h-screen flex-col bg-slate-50">
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Activity Feed</h1>
                    <p className="text-xs text-slate-500">Real-time business events across all pipelines</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-md text-sm font-bold transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Log Activity</span>
                </button>
            </div>

            {/* Smart Filter Bar */}
            <div className="shrink-0 bg-white px-6 py-3 border-b border-slate-200 overflow-x-auto">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filterType === 'all'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        All Activity
                    </button>
                    {definitions.map(def => (
                        <button
                            key={def.id}
                            onClick={() => setFilterType(def.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${filterType === def.id
                                ? 'ring-2 ring-slate-900 ring-offset-1 bg-white text-slate-900' // Selected Style (could vary) 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            style={filterType === def.id ? { borderColor: def.color, color: def.color, backgroundColor: '#fff' } : {}}
                        >
                            {/* Using a dot for color indicator */}
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: def.color || '#cbd5e1' }} />
                            {def.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Feed */}
            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
                <div className="mx-auto max-w-3xl flex flex-col gap-6">
                    {orderedGroups.map(([dateLabel, groupActs]) => (
                        <div key={dateLabel} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="sticky top-0 z-10 py-2 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    {dateLabel}
                                </span>
                            </div>
                            <div className="flex flex-col gap-3">
                                {groupActs.map(act => (
                                    <ActivityRowItem
                                        key={act.id}
                                        activity={act}
                                        definition={definitions.find(d => d.id === act.type)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {orderedGroups.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Filter className="w-12 h-12 text-slate-200 mb-4" />
                            <p>No activities found matching this filter.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {user && (
                <LogActivityModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    associations={{}} // General log, no specific associations pre-filled
                    currentUser={{ uid: user.uid, email: user.email || '' }}
                />
            )}
        </div>
    );
}
