import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { JobPursuit, Company, CompanyLocation } from '../../types/schema';
import { Plus, MapPin } from 'lucide-react';
import ActivityContextPanel from '../activities/ActivityContextPanel';

interface OpportunityFormProps {
    initialData?: Partial<JobPursuit>;
    onSubmit: (data: Partial<JobPursuit> & { assignClientId?: string }) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    hideStatus?: boolean;
    clients?: any[];
}

export default function OpportunityForm({ initialData, onSubmit, onCancel, isSubmitting, hideStatus, clients }: OpportunityFormProps) {
    const [formData, setFormData] = useState<Partial<JobPursuit>>({
        company: '',
        role: '',
        stage_detail: '',
        stageId: 'target_locked',
        financials: { base: 0, bonus: 0, equity: '', rep_net_value: 0 },
        locationId: '', // New field
        ...initialData
    });

    const [assignClientId, setAssignClientId] = useState('');

    // Company Search State
    const [companySearch, setCompanySearch] = useState('');
    const [searchResults, setSearchResults] = useState<Company[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // New Location State
    const [isAddingLocation, setIsAddingLocation] = useState(false);
    const [newLocationName, setNewLocationName] = useState('');

    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
    const isEditMode = !!initialData?.id;


    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
            if (initialData.company) {
                setCompanySearch(initialData.company);
                // Try to find the company object if possible, to load locations
                // In a real app we might fetch it. For now, we rely on search.
                lookupCompany(initialData.company);
            }
        }
    }, [initialData]);

    // Simple search debounce could be added here
    useEffect(() => {
        if (companySearch.length > 1 && !selectedCompany) {
            searchCompanies(companySearch);
        } else {
            setSearchResults([]);
        }
    }, [companySearch]);

    const searchCompanies = async (term: string) => {
        // Simple case-insensitive prefix search (simulated with standard query for now)
        // In production, use a proper search index like Algolia or Typesense
        // Here we just fetch matching names by lowercase
        // Optimization: just use the simple query we have in other parts
        const q = query(
            collection(db, 'companies'),
            where('name_lower', '>=', term.toLowerCase()),
            where('name_lower', '<=', term.toLowerCase() + '\uf8ff')
        );
        const snaps = await getDocs(q);
        const results = snaps.docs.map(d => ({ id: d.id, ...d.data() } as Company));
        setSearchResults(results.slice(0, 5));
        setShowSuggestions(true);
    };

    const lookupCompany = async (name: string) => {
        const q = query(collection(db, 'companies'), where('name_lower', '==', name.toLowerCase()));
        const snaps = await getDocs(q);
        if (!snaps.empty) {
            setSelectedCompany({ id: snaps.docs[0].id, ...snaps.docs[0].data() } as Company);
        }
    }


    const handleCompanySelect = (company: Company) => {
        setFormData(prev => ({ ...prev, company: company.name, companyId: company.id }));
        setCompanySearch(company.name);
        setSelectedCompany(company);
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && showSuggestions && searchResults.length > 0) {
            e.preventDefault();
            handleCompanySelect(searchResults[0]);
        }
    };

    const handleAddNewLocation = async () => {
        if (!selectedCompany || !newLocationName) return;

        const newLoc: CompanyLocation = {
            id: uuidv4(),
            nickname: newLocationName,
            address: { city: newLocationName } // Approximation
        };

        const updatedLocations = [...(selectedCompany.locations || []), newLoc];

        // Optimistic Update
        setSelectedCompany({ ...selectedCompany, locations: updatedLocations });
        setFormData(prev => ({ ...prev, locationId: newLoc.id }));
        setIsAddingLocation(false);
        setNewLocationName('');

        // Persist
        try {
            await updateDoc(doc(db, 'companies', selectedCompany.id), {
                locations: updatedLocations
            });
        } catch (err) {
            console.error(err);
            alert('Failed to save location.');
        }
    }


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ ...formData, company: companySearch, assignClientId });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {isEditMode && (
                <div className="flex border-b border-gray-100 mb-4">
                    <button
                        type="button"
                        onClick={() => setActiveTab('details')}
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-oxford-green text-oxford-green' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Details
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-oxford-green text-oxford-green' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Activity History
                    </button>
                </div>
            )}

            <div className={activeTab === 'details' ? 'space-y-4' : 'hidden'}>

                {/* Company Field with Typeahead */}
                <div className="relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Company</label>
                    <div className="relative">
                        <input
                            required
                            className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-signal-orange outline-none"
                            placeholder="e.g. Acme Corp"
                            value={companySearch}
                            onChange={e => {
                                setCompanySearch(e.target.value);
                                if (selectedCompany && e.target.value !== selectedCompany.name) {
                                    setSelectedCompany(null); // Reset selection if edited
                                }
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            onKeyDown={handleKeyDown}
                        />
                        {showSuggestions && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg z-10 rounded-sm mt-1">
                                {searchResults.map(c => (
                                    <div
                                        key={c.id}
                                        className="p-2 hover:bg-gray-50 cursor-pointer text-sm font-medium flex items-center justify-between group"
                                        onClick={() => handleCompanySelect(c)}
                                    >
                                        <span>{c.name}</span>
                                        {c.locations && c.locations.length > 0 && (
                                            <span className="text-xs text-gray-400 font-normal">{c.locations.length} locs</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Location Select - Only if Company Selected */}
                {selectedCompany && (
                    <div className="bg-gray-50 p-3 rounded-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> Location
                            </label>
                            {!isAddingLocation && (
                                <button type="button" onClick={() => setIsAddingLocation(true)} className="text-[10px] text-oxford-green font-bold hover:underline flex items-center gap-1">
                                    <Plus className="h-3 w-3" /> New
                                </button>
                            )}
                        </div>

                        {isAddingLocation ? (
                            <div className="flex items-center gap-2">
                                <input
                                    className="flex-1 p-1.5 text-xs border border-gray-300 rounded-sm outline-none"
                                    placeholder="City or Office (e.g. London)"
                                    value={newLocationName}
                                    onChange={e => setNewLocationName(e.target.value)}
                                    autoFocus
                                />
                                <button type="button" onClick={handleAddNewLocation} className="text-xs font-bold text-white bg-oxford-green px-2 py-1.5 rounded-sm">Add</button>
                                <button type="button" onClick={() => setIsAddingLocation(false)} className="text-xs text-gray-500 hover:text-gray-700 px-1">Cancel</button>
                            </div>
                        ) : (
                            <select
                                className="w-full p-2 text-sm border border-gray-200 rounded-sm outline-none bg-white"
                                value={formData.locationId || ''}
                                onChange={e => setFormData({ ...formData, locationId: e.target.value })}
                            >
                                <option value="">-- No Specific Location --</option>
                                {selectedCompany.locations?.map(loc => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.nickname} {loc.address?.city && `(${loc.address.city})`}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Role Title</label>
                    <input
                        required
                        className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-signal-orange outline-none"
                        placeholder="e.g. Senior Director, Product"
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                    />
                </div>
                {!hideStatus && (
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Stage</label>
                        <select
                            className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-signal-orange outline-none bg-white"
                            value={formData.stageId}
                            onChange={e => setFormData({ ...formData, stageId: e.target.value as any })}
                        >
                            <option value="target_locked">Target Locked</option>
                            <option value="outreach_execution">Outreach Execution</option>
                            <option value="engagement">Engagement</option>
                            <option value="interview_loop">Interview Loop</option>
                            <option value="offer_pending">Offer Pending</option>

                            <option value="placed">Placed</option>
                            <option value="closed_lost">Closed Lost</option>
                            <option value="closed_by_market">Closed by Market</option>
                        </select>
                    </div>
                )}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Stage Detail</label>
                    <input
                        required
                        className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-signal-orange outline-none"
                        placeholder="e.g. Outreach sent via LinkedIn"
                        value={formData.stage_detail}
                        onChange={e => setFormData({ ...formData, stage_detail: e.target.value })}
                    />
                </div>

                {/* Financials Section (Optional) */}
                <div className="pt-4 border-t border-gray-100 mt-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-oxford-green mb-3">Financials (Est.)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Base Salary</label>
                            <input
                                type="number"
                                className="w-full p-2 border border-gray-200 rounded-sm text-sm outline-none"
                                value={formData.financials?.base || 0}
                                onChange={e => setFormData({
                                    ...formData,
                                    financials: { ...(formData.financials || { base: 0, bonus: 0, equity: '', rep_net_value: 0 }), base: parseInt(e.target.value) || 0 }
                                })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Rep Net Value</label>
                            <input
                                type="number"
                                className="w-full p-2 border border-gray-200 rounded-sm text-sm outline-none"
                                value={formData.financials?.rep_net_value || 0}
                                onChange={e => setFormData({
                                    ...formData,
                                    financials: { ...(formData.financials || { base: 0, bonus: 0, equity: '', rep_net_value: 0 }), rep_net_value: parseInt(e.target.value) || 0 }
                                })}
                            />
                        </div>
                    </div>
                </div>

                {/* Optional Assignment */}
                {clients && clients.length > 0 && (
                    <div className="pt-4 border-t border-gray-100 mt-4">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Assign to Client (Optional)</label>
                        <div className="text-[10px] text-gray-400 mb-2">Creating this will add it to the Global Inventory AND the Client's Pipeline.</div>
                        <select
                            className="w-full p-2 border border-blue-200 rounded-sm text-sm bg-blue-50 focus:border-signal-orange outline-none"
                            value={assignClientId}
                            onChange={e => setAssignClientId(e.target.value)}
                        >
                            <option value="">-- Add to Inventory Only --</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.profile?.firstName ? `${client.profile.firstName} ${client.profile.lastName}` : client.profile?.headline || 'Unknown Client'}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

            </div>

            {activeTab === 'history' && initialData?.id && (
                <div className="min-h-[400px]">
                    <ActivityContextPanel
                        entityType="pursuit"
                        entityId={initialData.id}
                        compactMode={true}
                    />
                </div>
            )}

            <div className="pt-4 flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 border border-gray-200 text-gray-500 font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-oxford-green text-white font-bold py-3 text-sm uppercase tracking-widest rounded-sm hover:bg-opacity-90 disabled:opacity-50"
                >
                    {isSubmitting ? 'Saving...' : 'Save Opportunity'}
                </button>
            </div>
        </form>
    );
}
