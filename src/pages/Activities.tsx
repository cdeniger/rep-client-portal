
import { useState, useEffect, useMemo } from 'react';
import {
    collection,
    query,
    orderBy,
    limit,
    startAfter,
    getDocs,
    where,
    Timestamp,
    QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, isToday, isYesterday, startOfDay, subDays } from 'date-fns';
import {
    Filter,
    Plus,
    Search,
    Loader2,
    SlidersHorizontal,
    RefreshCw
} from 'lucide-react';
import type { Activity, ActivityDefinition } from '../types/activities';
import ActivityFeedCard from '../components/activities/ActivityFeedCard';
import LogActivityModal from '../components/activities/LogActivityModal';
import { useAuth } from '../context/AuthContext';

// --- Constants ---
const PAGE_SIZE = 50;

export default function Activities() {
    // Data State
    const [activities, setActivities] = useState<Activity[]>([]);
    const [definitions, setDefinitions] = useState<ActivityDefinition[]>([]);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Filter State
    const [searchQuery, setSearchQuery] = useState(''); // Client-side quick filter
    const [selectedType, setSelectedType] = useState<string | 'all'>('all');
    const [dateRange, setDateRange] = useState<'all' | '7days' | '30days'>('all');

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | undefined>(undefined);
    const { user } = useAuth();

    // 1. Initial Load: Definitions
    useEffect(() => {
        const fetchDefs = async () => {
            const snap = await getDocs(collection(db, 'activity_definitions'));
            const defs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityDefinition));
            setDefinitions(defs);
        };
        fetchDefs();
    }, []);

    // 2. Fetch Activities (Reset vs Append)
    const fetchActivities = async (isLoadMore = false) => {
        if (isLoadMore) setLoadingMore(true);
        else setLoading(true);

        try {
            const constraints: QueryConstraint[] = [
                orderBy('performedAt', 'desc'),
                limit(PAGE_SIZE)
            ];

            // Apply Server Filters
            if (selectedType !== 'all') {
                constraints.push(where('type', '==', selectedType));
            }

            if (dateRange !== 'all') {
                const now = new Date();
                const days = dateRange === '7days' ? 7 : 30;
                const startDate = subDays(startOfDay(now), days);
                constraints.push(where('performedAt', '>=', Timestamp.fromDate(startDate)));
            }

            // Pagination
            if (isLoadMore && lastDoc) {
                constraints.push(startAfter(lastDoc));
            }

            const q = query(collection(db, 'activities'), ...constraints);
            const snap = await getDocs(q);

            const newActs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Activity));
            const lastVisible = snap.docs[snap.docs.length - 1];

            if (isLoadMore) {
                setActivities(prev => [...prev, ...newActs]);
            } else {
                setActivities(newActs);
            }

            setLastDoc(lastVisible);
            setHasMore(snap.docs.length === PAGE_SIZE);

        } catch (err) {
            console.error("Error fetching activities:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Trigger Fetch on Filter Change
    useEffect(() => {
        setLastDoc(null);
        setHasMore(true);
        // Debounce or immediate? Immediate for these filters is fine
        fetchActivities(false);
    }, [selectedType, dateRange]);

    // 3. Client-Side Search Filtering
    // Ideally we'd do server search, but Firestore is limited. 
    // We filter the *view* of the fetched data.
    const displayedActivities = useMemo(() => {
        if (!searchQuery.trim()) return activities;
        const lower = searchQuery.toLowerCase();
        return activities.filter(a =>
            (a.notes && a.notes.toLowerCase().includes(lower)) ||
            ((a.metadata as any)?.subject && (a.metadata as any).subject.toLowerCase().includes(lower)) ||
            a.type.includes(lower)
        );
    }, [activities, searchQuery]);

    // 4. Grouping Logic (Preserved)
    const orderedGroups = useMemo(() => {
        const groupsMap = new Map<string, Activity[]>();

        displayedActivities.forEach(act => {
            const date = act.performedAt.toDate();
            let key = format(date, 'MMMM d, yyyy');
            if (isToday(date)) key = 'Today';
            else if (isYesterday(date)) key = 'Yesterday';

            if (!groupsMap.has(key)) groupsMap.set(key, []);
            groupsMap.get(key)!.push(act);
        });

        return Array.from(groupsMap.entries());
    }, [displayedActivities]);


    const handleEdit = (activity: Activity) => {
        setEditingActivity(activity);
        setIsModalOpen(true);
    };

    const handleReload = () => {
        fetchActivities(false);
    }

    return (
        <div className="flex h-screen flex-col bg-slate-50">
            {/* --- Premium Header --- */}
            <div className="flex flex-col shrink-0 bg-white border-b border-slate-200 shadow-sm z-20">
                <div className="flex h-16 items-center justify-between px-6">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Activity Stream</h1>
                        <p className="text-xs text-slate-500 font-medium">Real-time business interaction timeline</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleReload}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                            title="Refresh Feed"
                        >
                            <RefreshCw size={18} />
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all hover:shadow md:px-5"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Log Interaction</span>
                        </button>
                    </div>
                </div>

                {/* --- Control Panel (Search & filters) --- */}
                <div className="px-6 py-4 flex flex-col md:flex-row gap-4 items-center bg-slate-50/50 border-t border-slate-100">

                    {/* Search Input */}
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Data Search (Client-side)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                        />
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full scrollbar-hide pb-1 md:pb-0">
                        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200 mr-2 shrink-0">
                            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Filters</span>
                        </div>

                        {/* Date Preset */}
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value as any)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none cursor-pointer"
                        >
                            <option value="all">All Time</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                        </select>

                        {/* Type Toggle (All) */}
                        <button
                            onClick={() => setSelectedType('all')}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${selectedType === 'all'
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            All Types
                        </button>

                        {/* Dynamic Type Toggles */}
                        {definitions.map(def => (
                            <button
                                key={def.id}
                                onClick={() => setSelectedType(def.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${selectedType === def.id
                                    ? 'bg-white text-slate-900 border-slate-900 ring-1 ring-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: def.color || '#cbd5e1' }}
                                />
                                {def.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Main Feed Area --- */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-hide bg-slate-50">
                <div className="mx-auto max-w-4xl flex flex-col gap-8 pb-20">

                    {loading && activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                            <p className="text-slate-400 text-sm">Hydrating timeline...</p>
                        </div>
                    ) : (
                        <>
                            {orderedGroups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <Filter className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-slate-900 font-medium mb-1">No activities found</h3>
                                    <p className="text-sm max-w-xs text-center">Try adjusting your filters or date range.</p>
                                </div>
                            ) : (
                                orderedGroups.map(([dateLabel, groupActs]) => (
                                    <div key={dateLabel} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="sticky top-0 z-10 py-3 mb-4 bg-slate-50/95 backdrop-blur-sm border-b border-slate-100 w-full">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                                                {dateLabel}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            {groupActs.map((act, idx) => (
                                                <ActivityFeedCard
                                                    key={act.id}
                                                    activity={act}
                                                    definition={definitions.find(d => d.id === act.type)}
                                                    onClick={handleEdit}
                                                    isLastInGroup={idx === groupActs.length - 1}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Load More Trigger */}
                            {hasMore && orderedGroups.length > 0 && (
                                <div className="flex justify-center pt-8">
                                    <button
                                        onClick={() => fetchActivities(true)}
                                        disabled={loadingMore}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-full shadow-sm hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all"
                                    >
                                        {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {loadingMore ? 'Loading History...' : 'Load Older Activities'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* --- Log Modal --- */}
            {user && (
                <LogActivityModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingActivity(undefined);
                        if (!editingActivity) {
                            // If we just created a new one, refresh the feed to show it at top
                            fetchActivities(false);
                        }
                    }}
                    associations={editingActivity?.associations || {}}
                    currentUser={{ uid: user.uid, email: user.email || '' }}
                    initialData={editingActivity}
                />
            )}
        </div>
    );
}
