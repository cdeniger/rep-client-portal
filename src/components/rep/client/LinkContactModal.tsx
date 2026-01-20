import { useState, useEffect } from 'react';
import { Search, Link as LinkIcon, UserPlus, Check } from 'lucide-react';
import { collection, query, orderBy, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Modal from '../../ui/Modal';
import Fuse from 'fuse.js';
import type { Contact, Engagement } from '../../../types/schema';

interface LinkContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    engagement: Engagement;
    onLinkSuccess: () => void;
}

export default function LinkContactModal({ isOpen, onClose, engagement, onLinkSuccess }: LinkContactModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(false);
    const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [isLinking, setIsLinking] = useState(false);

    // Initial Fetch
    useEffect(() => {
        if (isOpen) {
            fetchContacts();
            setSearchQuery(engagement.profile?.lastName || ''); // Pre-fill search with client last name
        }
    }, [isOpen, engagement]);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Contact[];
            setContacts(list);
        } catch (error) {
            console.error("Error fetching contacts", error);
        } finally {
            setLoading(false);
        }
    };

    // Fuse Search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredContacts(contacts.slice(0, 5)); // Show recent 5 if empty
            return;
        }

        const fuse = new Fuse(contacts, {
            keys: ['firstName', 'lastName', 'email'],
            threshold: 0.4
        });
        setFilteredContacts(fuse.search(searchQuery).map(r => r.item));
    }, [contacts, searchQuery]);

    const handleLinkExisting = async () => {
        if (!selectedContactId || !engagement.id) return;
        setIsLinking(true);
        try {
            await updateDoc(doc(db, 'engagements', engagement.id), {
                'profile.contactId': selectedContactId
            });
            onLinkSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to link contact.");
        } finally {
            setIsLinking(false);
        }
    };

    const handleCreateAndLink = async () => {
        if (!engagement.id) return;
        setIsLinking(true);
        try {
            // Create Contact from Engagement Profile
            const newContactData = {
                firstName: engagement.profile?.firstName || 'Unknown',
                lastName: engagement.profile?.lastName || 'Client',
                type: 'client',
                createdAt: serverTimestamp(),
                // Best effort mapping
                title: engagement.profile?.currentTitle || engagement.profile?.headline,
            };

            const contactRef = await addDoc(collection(db, 'contacts'), newContactData);

            // Link it
            await updateDoc(doc(db, 'engagements', engagement.id), {
                'profile.contactId': contactRef.id
            });
            onLinkSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to create and link contact.");
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Link Identity Record">
            <div className="space-y-6">
                <p className="text-sm text-slate-500">
                    Connect this engagement to a "Golden Source" Contact record. This synchronizes their contact info and history.
                </p>

                {/* Search Mode */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            autoFocus
                            placeholder="Search contacts..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-sm text-sm"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-sm divide-y divide-slate-100">
                        {loading && <div className="p-4 text-center text-xs text-slate-400">Loading directory...</div>}

                        {!loading && filteredContacts.length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-400 italic">No matching contacts found.</div>
                        )}

                        {filteredContacts.map(contact => (
                            <div
                                key={contact.id}
                                onClick={() => setSelectedContactId(contact.id)}
                                className={`p-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors ${selectedContactId === contact.id ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''}`}
                            >
                                <div>
                                    <div className="text-sm font-bold text-slate-700">{contact.firstName} {contact.lastName}</div>
                                    <div className="text-xs text-slate-400">{contact.email || 'No email'} • {contact.type}</div>
                                </div>
                                {selectedContactId === contact.id && (
                                    <Check className="h-4 w-4 text-emerald-600" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center gap-4">
                    <button
                        onClick={handleCreateAndLink}
                        disabled={isLinking}
                        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-signal-orange uppercase tracking-wide px-2 py-1"
                    >
                        <UserPlus className="h-4 w-4" />
                        Create New "{engagement.profile?.firstName}"
                    </button>

                    <button
                        disabled={!selectedContactId || isLinking}
                        onClick={handleLinkExisting}
                        className="bg-oxford-green text-white px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-opacity-90 transition-all flex items-center gap-2"
                    >
                        <LinkIcon className="h-3 w-3" />
                        {isLinking ? 'Linking...' : 'Link Selected'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
