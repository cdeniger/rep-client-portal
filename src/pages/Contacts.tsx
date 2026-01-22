import { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { Contact, Company } from '../types/schema';
import { Search, Plus, Building2, Users, ListFilter } from 'lucide-react';
import Fuse from 'fuse.js';
import ContactDrawer from '../components/rep/ContactDrawer';

// Extended Contact type with joined Company data
interface EnrichedContact extends Contact {
    companyName?: string;
    companyLogo?: string;
}

const CONTACT_TYPES = [
    { id: 'all', label: 'All Contacts' },
    { id: 'client', label: 'Clients' },
    { id: 'hiring_manager', label: 'Hiring Managers' },
    { id: 'vendor', label: 'Vendors' },
    { id: 'influencer', label: 'Influencers' },
];

export default function Contacts() {
    // Data State
    const [rawContacts, setRawContacts] = useState<Contact[]>([]);
    const [companies, setCompanies] = useState<Record<string, Company>>({});
    const [loading, setLoading] = useState(true);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [groupByCompany, setGroupByCompany] = useState(false);
    const [selectedContact, setSelectedContact] = useState<EnrichedContact | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Fetch Data
    useEffect(() => {
        setLoading(true);
        // 1. Fetch Companies
        const unsubCompanies = onSnapshot(collection(db, 'companies'), (snap) => {
            const compMap: Record<string, Company> = {};
            snap.docs.forEach(doc => {
                compMap[doc.id] = { id: doc.id, ...doc.data() } as Company;
            });
            setCompanies(compMap);
        });

        // 2. Fetch Contacts
        const q = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
        const unsubContacts = onSnapshot(q, (snap) => {
            const contactList = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Contact[];
            setRawContacts(contactList);
            setLoading(false); // Contacts loaded
        });

        return () => {
            unsubCompanies();
            unsubContacts();
        };
    }, []);

    // Derived Data
    const enrichedContacts = useMemo(() => {
        return rawContacts.map(c => ({
            ...c,
            companyName: c.companyId ? companies[c.companyId]?.name : undefined,
            companyLogo: c.companyId ? companies[c.companyId]?.logoUrl : undefined // Future proof
        }));
    }, [rawContacts, companies]);

    // Search & Filter Logic
    const filteredContacts = useMemo(() => {
        let result = enrichedContacts;

        // 1. Type Filter
        if (activeFilter !== 'all') {
            result = result.filter(c => c.type === activeFilter);
        }

        // 2. Fuzzy Search
        if (searchQuery.trim()) {
            const fuse = new Fuse(result, {
                keys: ['firstName', 'lastName', 'email', 'companyName'],
                threshold: 0.3, // Forgive typos
                distance: 100,
            });
            result = fuse.search(searchQuery).map(res => res.item);
        }

        return result;
    }, [enrichedContacts, activeFilter, searchQuery]);

    // Grouping Logic
    const groupedContacts = useMemo(() => {
        if (!groupByCompany) return null;

        const groups: Record<string, EnrichedContact[]> = {};
        filteredContacts.forEach(contact => {
            const key = contact.companyName || 'No Company';
            if (!groups[key]) groups[key] = [];
            groups[key].push(contact);
        });

        // Sort keys (companies) A-Z, putting 'No Company' last
        return Object.keys(groups).sort((a, b) => {
            if (a === 'No Company') return 1;
            if (b === 'No Company') return -1;
            return a.localeCompare(b);
        }).map(companyName => ({
            companyName,
            contacts: groups[companyName]
        }));

    }, [filteredContacts, groupByCompany]);


    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.24))] p-6"> {/* Full height minus header/padding approx */}

            {/* --- Header --- */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-oxford-green font-display">Global Contacts</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage network relationships across all entities.</p>
                    </div>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-oxford-green text-white px-4 py-2 rounded-md text-sm font-bold shadow-sm hover:bg-oxford-green/90 transition-all flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> Add Contact
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-4 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    {/* Search */}
                    <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or company (fuzzy)..."
                            className="w-full pl-10 pr-4 py-2 text-sm bg-transparent border-none focus:ring-0 placeholder:text-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-px bg-gray-200"></div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-2">
                        {CONTACT_TYPES.map(type => (
                            <button
                                key={type.id}
                                onClick={() => setActiveFilter(type.id)}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeFilter === type.id
                                    ? 'bg-oxford-green text-white shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-px bg-gray-200"></div>

                    {/* View Options */}
                    <div className="flex items-center gap-2 pr-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">View:</span>
                        <button
                            onClick={() => setGroupByCompany(!groupByCompany)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${groupByCompany
                                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {groupByCompany ? <Building2 className="h-3.5 w-3.5" /> : <ListFilter className="h-3.5 w-3.5" />}
                            {groupByCompany ? 'Grouped by Company' : 'Flat List'}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Main Data Table / List --- */}
            <div className="flex-1 overflow-hidden rounded-lg bg-white border border-gray-200 shadow-sm flex flex-col">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10">
                    <div className="col-span-3">Name</div>
                    <div className="col-span-2">Role</div>
                    <div className="col-span-3">Company</div>
                    <div className="col-span-2">Email</div>
                    <div className="col-span-2">Phone</div>
                </div>

                {/* Table Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Loading contacts...</div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300"><Users className="h-6 w-6" /></div>
                            <p className="text-gray-500 font-medium">No contacts found.</p>
                            <p className="text-gray-400 text-xs">Try adjusting your search or filters.</p>
                        </div>
                    ) : groupByCompany ? (
                        // Grouped View
                        <div className="divide-y divide-gray-100">
                            {groupedContacts?.map(group => (
                                <div key={group.companyName}>
                                    <div className="px-6 py-2 bg-gray-50/50 border-y border-gray-100 flex items-center gap-2">
                                        <Building2 className="h-3 w-3 text-gray-400" />
                                        <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">{group.companyName}</span>
                                        <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{group.contacts.length}</span>
                                    </div>
                                    <div>
                                        {group.contacts.map(contact => (
                                            <ContactRow
                                                key={contact.id}
                                                contact={contact}
                                                onClick={() => setSelectedContact(contact)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Flat View
                        <div className="divide-y divide-gray-100">
                            {filteredContacts.map(contact => (
                                <ContactRow
                                    key={contact.id}
                                    contact={contact}
                                    onClick={() => setSelectedContact(contact)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- Drawer --- */}
            <ContactDrawer
                contact={selectedContact}
                company={selectedContact?.companyId && companies[selectedContact.companyId] ? companies[selectedContact.companyId] : undefined}
                isOpen={!!selectedContact || isCreateOpen}
                onClose={() => {
                    setSelectedContact(null);
                    setIsCreateOpen(false);
                }}
            />

        </div>
    );
}

// Subcomponent for efficient rendering
function ContactRow({ contact, onClick }: { contact: EnrichedContact; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 cursor-pointer transition-colors group"
        >
            {/* Name */}
            <div className="col-span-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-oxford-green/10 text-oxford-green flex items-center justify-center text-xs font-bold shrink-0">
                    {contact.avatar ? (
                        <img src={contact.avatar} alt={contact.firstName} className="h-full w-full rounded-full object-cover" />
                    ) : (
                        <span>{(contact.firstName?.[0] || '?')}{(contact.lastName?.[0] || '?')}</span>
                    )}
                </div>
                <div>
                    <div className="font-bold text-sm text-oxford-green group-hover:text-signal-orange transition-colors">
                        {contact.firstName} {contact.lastName}
                    </div>
                </div>
            </div>

            {/* Role Badge */}
            <div className="col-span-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${contact.type === 'client' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                    contact.type === 'hiring_manager' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        contact.type === 'vendor' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                            contact.type === 'influencer' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                                'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                    {contact.type?.replace('_', ' ') || 'Unknown'}
                </span>
            </div>

            {/* Company */}
            <div className="col-span-3">
                {contact.companyName ? (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-oxford-green hover:underline decoration-1 underline-offset-2 transition-all">
                        <Building2 className="h-3 w-3 text-gray-400" />
                        {contact.companyName}
                    </div>
                ) : (
                    <span className="text-gray-300 text-xs italic">--</span>
                )}
            </div>

            {/* Email */}
            <div className="col-span-2 text-sm text-gray-500 truncate font-mono text-xs">
                {contact.email || '--'}
            </div>

            {/* Phone */}
            <div className="col-span-2 text-sm text-gray-500 truncate font-mono text-xs">
                {contact.phone ? formatPhoneNumber(contact.phone) : '--'}
            </div>
        </div>
    );
}

function formatPhoneNumber(phone: string) {
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phone;
}
