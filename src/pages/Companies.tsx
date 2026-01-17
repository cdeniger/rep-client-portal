import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { Company } from '../types/schema';
import { Search, Building2, MapPin, Plus } from 'lucide-react';
import CompanyDrawer from '../components/companies/CompanyDrawer';

export default function Companies() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

    // Derive selected company from live list to ensure updates (like new locations) are reflected
    const selectedCompany = companies.find(c => c.id === selectedCompanyId) || null;

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'companies'), orderBy('name', 'asc'));
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Company[];
            setCompanies(list);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleCreateCompany = async () => {
        const name = window.prompt("Enter company name:");
        if (!name) return;

        try {
            // Use shared logic to check for duplicates and ensure consistent data structure
            const { findOrCreateCompany } = await import('../lib/companies');
            const companyId = await findOrCreateCompany(name);
            setSelectedCompanyId(companyId);
        } catch (error) {
            console.error("Error creating company:", error);
            alert("Failed to create company");
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.24))]">
            {/* Header */}
            <div className="flex flex-col gap-6 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-oxford-green font-display">Companies</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage partner organizations and office locations.</p>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-between gap-4 bg-white p-1 rounded-lg border border-gray-200 shadow-sm transition-all md:w-1/2 flex-1">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search companies..."
                                className="w-full pl-10 pr-4 py-2 text-sm bg-transparent border-none focus:ring-0 placeholder:text-gray-400"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleCreateCompany}
                        className="flex items-center gap-2 px-4 py-2 bg-oxford-green text-white text-sm font-bold rounded-lg hover:bg-opacity-90 transition-colors shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Create Company
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-hidden rounded-lg bg-white border border-gray-200 shadow-sm flex flex-col">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10">
                    <div className="col-span-6">Company Name</div>
                    <div className="col-span-3">Locations</div>
                    <div className="col-span-3">Date Added</div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Loading companies...</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredCompanies.map(company => (
                                <div
                                    key={company.id}
                                    onClick={() => setSelectedCompanyId(company.id)}
                                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 cursor-pointer transition-colors group"
                                >
                                    <div className="col-span-6 flex items-center gap-3">
                                        <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                            {company.logoUrl ? <img src={company.logoUrl} className="h-full w-full object-contain" /> : <Building2 className="h-4 w-4" />}
                                        </div>
                                        <span className="font-bold text-sm text-oxford-green">{company.name}</span>
                                    </div>
                                    <div className="col-span-3 flex items-center gap-1 text-sm text-gray-500">
                                        <MapPin className="h-3 w-3 text-gray-400" />
                                        <span>{company.locations?.length || 0}</span>
                                    </div>
                                    <div className="col-span-3 text-xs text-gray-400">
                                        {new Date(company.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CompanyDrawer
                company={selectedCompany}
                isOpen={!!selectedCompany}
                onClose={() => setSelectedCompanyId(null)}
            />
        </div>
    );
}
