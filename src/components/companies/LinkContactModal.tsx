import { useState, useEffect } from 'react';
import { Search, Plus, Building2, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Contact, Company } from '../../types/schema';

interface LinkContactModalProps {
    company: Company;
    isOpen: boolean;
    onClose: () => void;
    onCreateNew: (name: string) => void;
    onContactLinked: () => void;
}

export default function LinkContactModal({ company, isOpen, onClose, onCreateNew, onContactLinked }: LinkContactModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<(Contact & { companyName?: string })[]>([]);

    // Updated State for Client-Side Search
    const [allContacts, setAllContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [linking, setLinking] = useState(false);

    // Load All Contacts
    useEffect(() => {
        const load = async () => {
            try {
                const snap = await getDocs(collection(db, 'contacts'));
                setAllContacts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Contact)));
            } catch (e) { console.error(e); }
        };
        load();
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.length >= 2) {
                performSearch(searchTerm);
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const performSearch = async (term: string) => {
        setLoading(true);
        try {
            // Client side filter (Case Insensitive)
            const lower = term.toLowerCase();
            const matches = allContacts.filter(c => {
                const first = (c.firstName || '').toLowerCase();
                const last = (c.lastName || '').toLowerCase();
                const full = `${first} ${last}`;
                return first.includes(lower) || last.includes(lower) || full.includes(lower);
            });
            setResults(matches.slice(0, 50));
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLink = async () => {
        if (!selectedContact) return;
        setLinking(true);
        try {
            await updateDoc(doc(db, 'contacts', selectedContact.id), {
                companyId: company.id
            });
            onContactLinked();
            onClose();
        } catch (err) {
            console.error("Link failed", err);
            alert("Failed to link contact.");
        } finally {
            setLinking(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-oxford-green">Add Person to {company.name}</h2>
                        <p className="text-xs text-gray-500">Search for an existing contact or create a new one.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Search Field */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            autoFocus
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-oxford-green/20 focus:border-oxford-green outline-none transition-all placeholder:text-gray-300"
                            placeholder="Start typing a name (e.g. 'John')..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-oxford-green animate-spin" />}
                    </div>

                    {/* Results / Empty State */}
                    <div className="min-h-[200px] max-h-[300px] overflow-y-auto border border-gray-100 rounded-lg bg-gray-50/50 p-2">

                        {searchTerm.length < 2 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                                <Search className="h-8 w-8 mb-2 opacity-20" />
                                <span className="text-xs">Type at least 2 characters to search</span>
                            </div>
                        )}

                        {searchTerm.length >= 2 && results.length === 0 && !loading && (
                            <div className="flex flex-col items-center justify-center py-8">
                                <div className="text-sm text-gray-500 mb-4">No matching contacts found.</div>
                                <button
                                    onClick={() => onCreateNew(searchTerm)}
                                    className="flex items-center gap-2 bg-oxford-green text-white px-4 py-2 rounded-md text-sm font-bold shadow-sm hover:bg-opacity-90 transition-all"
                                >
                                    <Plus className="h-4 w-4" />
                                    Create new "{searchTerm}"
                                </button>
                            </div>
                        )}

                        {results.map(contact => (
                            <div
                                key={contact.id}
                                onClick={() => setSelectedContact(contact)}
                                className={`p-3 rounded-md mb-2 cursor-pointer transition-all border ${selectedContact?.id === contact.id
                                    ? 'bg-green-50 border-green-200 ring-1 ring-green-200'
                                    : 'bg-white border-transparent hover:border-gray-200 shadow-sm'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                                            {contact.firstName[0]}{contact.lastName[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800 text-sm">{contact.firstName} {contact.lastName}</div>
                                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                                {contact.title || 'No Title'}
                                                {contact.companyId && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-0.5 text-gray-500">
                                                            <Building2 className="h-3 w-3" />
                                                            Currently Linked
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {selectedContact?.id === contact.id && (
                                        <div className="text-green-600">
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Warning / Confirmation */}
                    {selectedContact && (
                        <div className="bg-amber-50 border border-amber-100 rounded-md p-3 flex gap-3 animate-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                            <div className="text-xs text-amber-800">
                                <div className="font-bold mb-0.5">Confirm Move</div>
                                {selectedContact.companyId ? (
                                    <span>
                                        This contact is currently linked to another company.
                                        Clicking <strong>Confirm Link</strong> will move them to <strong>{company.name}</strong>.
                                    </span>
                                ) : (
                                    <span>
                                        This contact is currently unassigned.
                                        Clicking <strong>Confirm Link</strong> will add them to <strong>{company.name}</strong>.
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleLink}
                        disabled={!selectedContact || linking}
                        className="px-6 py-2 bg-oxford-green text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {linking ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" /> Linking...
                            </span>
                        ) : 'Confirm Link'}
                    </button>
                </div>

            </div>
        </div>
    );
}
