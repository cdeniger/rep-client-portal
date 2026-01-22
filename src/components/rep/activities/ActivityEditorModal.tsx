import { useState } from 'react';
import { X, Plus, Link, FileText } from 'lucide-react';
import { addDoc, collection, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

import { useAuth } from '../../../context/AuthContext';
import { useCollection } from '../../../hooks/useCollection';
import { where } from 'firebase/firestore';

interface ActivityEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Context props to pre-fill associations
    engagementID?: string;
    ownerID?: string;
    onActivityCreated?: () => void;
}

// Minimal Agenda Item Interface
interface AgendaItem {
    id: string;
    topic: string;
    completed: boolean;
    contextId?: string;
    contextType?: 'job_pursuit' | 'asset';
    contextLabel?: string;
    source: 'manual' | 'template';
}

const TEMPLATES: Record<string, string[]> = {
    'Weekly Sync': [
        'Pipeline Review (Active Pursuits)',
        'Blockers & Risks',
        'Upcoming Interviews',
        'Action Items from last week'
    ],
    'Strategy Kickoff': [
        'Confirm Search Criteria',
        'Review Target Company List',
        'Timeline & Expectations',
        'NEXT: Outreach Strategy'
    ],
    'Offer Analysis': [
        'Review Offer Details',
        'Benchmarking vs Market',
        'Equity Analysis',
        'Counter-Strategy Formulation'
    ]
};

export default function ActivityEditorModal({ isOpen, onClose, engagementID, ownerID, onActivityCreated }: ActivityEditorModalProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('14:00'); // Default 2pm
    const [videoLink, setVideoLink] = useState('');
    const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
    const [newItemText, setNewItemText] = useState('');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isVisibleToClient, setIsVisibleToClient] = useState(true);

    // Fetch Pursuits for Context Linking
    const { data: pursuits } = useCollection<any>(
        'job_pursuits',
        where('engagementId', '==', engagementID || 'NEVER')
    );

    if (!isOpen) return null;

    const handleLoadTemplate = (templateName: string) => {
        const items = TEMPLATES[templateName].map((text) => ({
            id: crypto.randomUUID(),
            topic: text,
            completed: false,
            source: 'template' as const
        }));
        setAgendaItems(items);
        setTitle(`${templateName} - ${new Date().toLocaleDateString()}`);
    };

    const handleAddAgendaItem = () => {
        if (!newItemText.trim()) return;
        setAgendaItems(prev => [...prev, {
            id: crypto.randomUUID(),
            topic: newItemText,
            completed: false,
            source: 'manual'
        }]);
        setNewItemText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAddAgendaItem();
    };

    const handleSubmit = async () => {
        if (!title || !user) return;
        setIsSaving(true);
        try {
            // Construct the Activity Object
            // We use 'meeting' as a custom type or standard if we update the schema later.
            // For now, mapping to BaseActivity structure + metadata injection.

            const activityData: any = {
                type: 'meeting',
                status: 'scheduled',
                ownerId: ownerID || user.uid,
                createdAt: Timestamp.now(),
                performedAt: Timestamp.fromDate(new Date(`${date}T${time}`)),
                updatedAt: Timestamp.now(),
                // Use the title as the main "Note" header or internal field?
                // We'll store title in metadata for meetings
                metadata: {
                    title: title,
                    agenda: agendaItems, // Store structured agenda
                    isVisibleToClient: isVisibleToClient,
                    videoLink: videoLink
                },
                notes: notes, // Internal rep notes? Or shared?
                associations: {
                    engagementId: engagementID
                }
            };

            await addDoc(collection(db, 'activities'), activityData);

            // Update Engagement Last Activity for "Last Touch" Card
            if (engagementID) {
                const engRef = doc(db, 'engagements', engagementID);
                await updateDoc(engRef, {
                    lastActivity: Timestamp.now().toDate().toISOString()
                });
            }

            if (onActivityCreated) onActivityCreated();
            onClose();

        } catch (e) {
            console.error(e);
            alert("Failed to create meeting.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-oxford-green">Schedule Meeting</h2>
                        <div className="text-xs text-slate-500">Prepare agenda and set context.</div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* 1. Basics */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Meeting Title</label>
                                <input
                                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm font-semibold focus:ring-2 focus:ring-oxford-green/20 outline-none"
                                    placeholder="e.g. Weekly Pipeline Sync"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-oxford-green/20 outline-none"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time</label>
                                    <input
                                        type="time"
                                        className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-oxford-green/20 outline-none"
                                        value={time}
                                        onChange={e => setTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
                                <Link className="h-3 w-3" />
                                Video Link
                            </label>
                            <input
                                className="w-full px-3 py-2 border border-slate-200 rounded text-sm font-mono text-slate-600 focus:ring-2 focus:ring-oxford-green/20 outline-none"
                                placeholder="https://zoom.us/j/..."
                                value={videoLink}
                                onChange={e => setVideoLink(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* 2. Agenda Builder */}
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/30">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Agenda & Topics
                            </h3>

                            {/* Template Selector */}
                            <select
                                className="text-xs border-none bg-white shadow-sm rounded px-2 py-1 text-slate-600 focus:ring-0 cursor-pointer"
                                onChange={(e) => {
                                    if (e.target.value) handleLoadTemplate(e.target.value);
                                }}
                                defaultValue=""
                            >
                                <option value="" disabled>Load Template...</option>
                                {Object.keys(TEMPLATES).map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        {/* List */}
                        <div className="space-y-2 mb-3">
                            {agendaItems.map((item, idx) => (
                                <div key={item.id} className="flex items-center gap-3 bg-white p-2 border border-slate-100 rounded shadow-sm group">
                                    <span className="text-slate-300 font-mono text-xs">{idx + 1}.</span>
                                    <span className="flex-1 text-sm text-slate-700">{item.topic}</span>
                                    {item.source === 'template' && (
                                        <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 rounded border border-slate-100">Template</span>
                                    )}
                                    {item.contextId ? (
                                        <div className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100">
                                            <Link className="h-3 w-3" />
                                            <span className="truncate max-w-[150px]">{item.contextLabel}</span>
                                            <button
                                                onClick={() => setAgendaItems(prev => prev.map(i => i.id === item.id ? { ...i, contextId: undefined, contextLabel: undefined, contextType: undefined } : i))}
                                                className="hover:text-blue-800 ml-1"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative group/link">
                                            <button className="text-slate-300 hover:text-blue-500 transition-colors" title="Link Context">
                                                <Link className="h-4 w-4" />
                                            </button>
                                            {/* Simple Hover/Focus Dropdown for Context Selection */}
                                            {/* In a real modal, this hover menu might clip. using a native select appearing on click is safer/easier. */}
                                            <select
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => {
                                                    const pid = e.target.value;
                                                    const p = pursuits?.find((x: any) => x.id === pid);
                                                    if (p) {
                                                        setAgendaItems(prev => prev.map(i => i.id === item.id ? {
                                                            ...i,
                                                            contextId: p.id,
                                                            contextType: 'job_pursuit',
                                                            contextLabel: `${p.role} @ ${p.company}`
                                                        } : i));
                                                    }
                                                }}
                                                value=""
                                            >
                                                <option value="" disabled>Link to...</option>
                                                <optgroup label="Job Pursuits">
                                                    {pursuits?.map((p: any) => (
                                                        <option key={p.id} value={p.id}>{p.role} @ {p.company}</option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setAgendaItems(prev => prev.filter(i => i.id !== item.id))}
                                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {agendaItems.length === 0 && (
                                <div className="text-center py-6 text-slate-400 text-sm italic border-2 border-dashed border-slate-200 rounded">
                                    No agenda items yet. Load a template or add manually.
                                </div>
                            )}
                        </div>

                        {/* Input Row */}
                        <div className="flex gap-2">
                            <input
                                className="flex-1 px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-oxford-green/20 outline-none"
                                placeholder="Add discussion topic..."
                                value={newItemText}
                                onChange={e => setNewItemText(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <button
                                onClick={handleAddAgendaItem}
                                className="px-3 py-2 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* 3. Visibility & Notes */}
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-8">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Internal Notes (Private)</label>
                            <textarea
                                className="w-full h-24 px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-oxford-green/20 outline-none resize-none"
                                placeholder="Private prep notes..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                        <div className="col-span-4 space-y-4">
                            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded">
                                <input
                                    type="checkbox"
                                    id="visibility"
                                    checked={isVisibleToClient}
                                    onChange={e => setIsVisibleToClient(e.target.checked)}
                                    className="mt-1"
                                />
                                <div>
                                    <label htmlFor="visibility" className="block text-sm font-bold text-blue-900">Visible to Client</label>
                                    <p className="text-xs text-blue-700 leading-tight mt-1">
                                        If checked, specific agenda items will appear on their dashboard.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || !title}
                        className="px-6 py-2 bg-oxford-green text-white font-bold rounded shadow-sm hover:bg-opacity-90 disabled:opacity-50 transition-all text-xs uppercase tracking-wider flex items-center gap-2"
                    >
                        {isSaving ? 'Scheduling...' : 'Schedule Meeting'}
                    </button>
                </div>

            </div>
        </div>
    );
}
