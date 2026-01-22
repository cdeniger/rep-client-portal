import { useState, useEffect } from 'react';
import { X, Calendar, Video, Clock, CheckCircle2, Save } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { BaseActivity } from '../../types/activities';

interface MeetingDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    meeting: BaseActivity | null;
}

export default function MeetingDrawer({ isOpen, onClose, meeting }: MeetingDrawerProps) {
    if (!isOpen || !meeting) return null;

    // Type guard / extraction for metadata
    const metadata = (meeting as any).metadata || {};
    const agenda = (metadata.agenda || []) as any[];
    const title = metadata.title || 'Scheduled Meeting';
    const videoLink = metadata.videoLink;
    const date = meeting.performedAt ? new Date(meeting.performedAt.toMillis()) : new Date();

    const [clientNotes, setClientNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    useEffect(() => {
        if (metadata.clientNotes) {
            setClientNotes(metadata.clientNotes);
        } else {
            setClientNotes('');
        }
    }, [meeting, metadata.clientNotes]);

    const handleSaveNotes = async () => {
        if (!meeting) return;
        setIsSaving(true);
        try {
            const activityRef = doc(db, 'activities', meeting.id);
            // Deep merge logic depends on updateDoc behavior with dot notation for nested fields
            // keeping it simple with metadata replacement or specific field update
            // Since metadata is an object, best to update "metadata.clientNotes" specifically if possible,
            // or merge manually. Firestore supports "metadata.clientNotes": value
            await updateDoc(activityRef, {
                "metadata.clientNotes": clientNotes
            });
            setLastSaved(new Date());
        } catch (error) {
            console.error("Error saving notes:", error);
            alert("Failed to save notes.");
        } finally {
            setIsSaving(false);
        }
    };

    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity animate-in fade-in"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-oxford-green/10">

                {/* Header */}
                <div className="p-6 bg-oxford-green text-white">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur">
                            <Calendar className="h-6 w-6 text-signal-orange" />
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/50 hover:text-white transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <h2 className="text-xl font-bold font-mono mb-1">{title}</h2>
                    <div className="flex items-center gap-2 text-white/70 text-sm font-mono">
                        <Clock className="h-4 w-4" />
                        {formattedDate} • {formattedTime}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-bone">

                    {/* Action Button */}
                    <div className="mb-8">
                        {videoLink ? (
                            <a
                                href={videoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-oxford-green text-oxford-green font-bold uppercase tracking-widest text-sm rounded hover:bg-oxford-green hover:text-white transition-all shadow-sm group"
                            >
                                <Video className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                Join Video Call
                            </a>
                        ) : (
                            <div className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 border-2 border-gray-200 text-gray-400 font-bold uppercase tracking-widest text-sm rounded cursor-not-allowed">
                                <Video className="h-4 w-4" />
                                No Video Link
                            </div>
                        )}
                        <p className="text-center text-[10px] text-gray-400 mt-2 font-mono uppercase tracking-wider">
                            Link becomes active 5 mins before
                        </p>
                    </div>

                    {/* Agenda List */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-px bg-gray-200 flex-1"></div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Agenda</span>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                            {agenda.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm italic">
                                    No specific agenda items listed.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {agenda.map((item: any, idx: number) => (
                                        <div key={idx} className="p-4 flex gap-3 hover:bg-gray-50 transition-colors">
                                            <span className="font-mono text-signal-orange font-bold text-xs pt-0.5">
                                                {(idx + 1).toString().padStart(2, '0')}
                                            </span>
                                            <div>
                                                <div className="text-sm font-bold text-oxford-green">{item.topic}</div>
                                                {item.contextId && (
                                                    <div className="mt-1 text-xs text-blue-500 underline cursor-pointer">
                                                        View Related Context
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Prep Notes / Input */}
                    <div className="mt-8">
                        <div className="flex justify-between items-end mb-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Your Notes
                            </label>
                            {lastSaved && (
                                <span className="text-[10px] text-emerald-600 font-mono flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Saved {lastSaved.toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <textarea
                                className="w-full h-32 p-3 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-oxford-green/20 outline-none resize-none bg-white pr-24"
                                placeholder="Add your own questions or notes for the call. These are saved automatically."
                                value={clientNotes}
                                onChange={(e) => setClientNotes(e.target.value)}
                            />
                            <button
                                onClick={handleSaveNotes}
                                disabled={isSaving}
                                className="absolute bottom-3 right-3 px-3 py-1.5 bg-oxford-green text-white text-xs font-bold uppercase rounded hover:bg-opacity-90 transition-opacity flex items-center gap-1"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                                {!isSaving && <Save className="h-3 w-3" />}
                            </button>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-t border-gray-100 text-[10px] text-gray-400 text-center font-mono">
                    REP. INTERNAL • SYNC ID: {meeting.id.slice(0, 8)}
                </div>

            </div>
        </>
    );
}
