import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { Search, Filter, Briefcase, List as ListIcon, Kanban } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';

export default function GlobalPipeline() {
    const [activeTab, setActiveTab] = useState<'inventory' | 'pipeline'>('inventory');
    const [loading, setLoading] = useState(true);
    const [inventory, setInventory] = useState<any[]>([]);
    const [pipeline, setPipeline] = useState<any[]>([]);

    // Assignment State
    const [selectedOpp, setSelectedOpp] = useState<any | null>(null);
    const [clients, setClients] = useState<any[]>([]); // Using 'any' for speed, ideally UserProfile
    const [assignClientId, setAssignClientId] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        fetchOpportunities();
        fetchClients();
    }, []);

    const fetchClients = async () => {
        // Fetch engagements as proxy for clients list
        const snap = await getDocs(query(collection(db, 'engagements')));
        // Ensure ID is captured even if missing in data fields
        setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOpp || !assignClientId) return;
        setIsAssigning(true);
        try {
            await updateDoc(doc(db, 'opportunities', selectedOpp.id), {
                userId: assignClientId,
                status: 'interviewing'
            });
            await fetchOpportunities();
            setSelectedOpp(null);
            setAssignClientId('');
        } catch (err) {
            console.error("Failed to assign", err);
        } finally {
            setIsAssigning(false);
        }
    };

    const fetchOpportunities = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'opportunities'));
            const allOpps = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

            setInventory(allOpps.filter(o => !o.userId));
            setPipeline(allOpps.filter(o => o.userId));
        } catch (error) {
            console.error("Failed to fetch opportunities", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-oxford-green">Job Opportunity Pipeline</h1>
                    <p className="text-slate-500 text-sm">Manage open market inventory and active client deals.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'inventory' ? 'bg-white shadow text-oxford-green' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <ListIcon className="h-4 w-4" />
                        Inventory ({inventory.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('pipeline')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'pipeline' ? 'bg-white shadow text-oxford-green' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Kanban className="h-4 w-4" />
                        Active Pipeline ({pipeline.length})
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-lg min-h-[500px]">
                    {activeTab === 'inventory' ? (
                        <InventoryTable data={inventory} onAssign={setSelectedOpp} />
                    ) : (
                        <PipelineBoard data={pipeline} />
                    )}
                </div>
            )}

            {/* Assignment Modal */}
            <Modal isOpen={!!selectedOpp} onClose={() => setSelectedOpp(null)} title={`Assign Opportunity`}>
                <form onSubmit={handleAssign} className="space-y-4">
                    <div>
                        <div className="text-xs text-slate-500 mb-4 font-mono">
                            {selectedOpp?.role} @ {selectedOpp?.company}
                        </div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Select Client</label>
                        <select
                            className="w-full p-2 border border-slate-300 rounded-sm text-sm bg-white"
                            value={assignClientId}
                            onChange={(e) => setAssignClientId(e.target.value)}
                            required
                        >
                            <option value="">-- Choose a Client --</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id?.replace?.('eng_', '').replace?.('mock_client_', '') || client.id}>
                                    {/* Using firstName/lastName from denormalized profile */}
                                    {client.profile?.firstName ? `${client.profile.firstName} ${client.profile.lastName}` : client.profile?.headline || 'Unknown Client'}
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-2">
                            * Assigning will move this to the Active Pipeline board as 'Interviewing'.
                        </p>
                    </div>
                    <div className="pt-4 flex gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedOpp(null)}
                            className="flex-1 py-2 border border-slate-300 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isAssigning}
                            className="flex-1 py-2 bg-oxford-green text-white font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-opacity-90"
                        >
                            {isAssigning ? 'Assigning...' : 'Confirm'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function InventoryTable({ data, onAssign }: { data: any[], onAssign: (opp: any) => void }) {
    return (
        <div className="p-4">
            <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search roles, companies..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-oxford-green"
                    />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md text-slate-600 text-sm hover:bg-slate-50">
                    <Filter className="h-4 w-4" />
                    Filters
                </button>
            </div>

            <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                        <th className="font-bold p-3">Role</th>
                        <th className="font-bold p-3">Company</th>
                        <th className="font-bold p-3">Comp Range</th>
                        <th className="font-bold p-3">Source</th>
                        <th className="font-bold p-3">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {data.map(opp => (
                        <tr key={opp.id} className="hover:bg-slate-50 group">
                            <td className="p-3 font-medium text-slate-700">{opp.role}</td>
                            <td className="p-3 text-slate-600">{opp.company}</td>
                            <td className="p-3 text-slate-500 font-mono text-xs">
                                ${((opp.financials?.base || 0) / 1000).toFixed(0)}k Base
                            </td>
                            <td className="p-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                                    {opp.source}
                                </span>
                            </td>
                            <td className="p-3">
                                <button
                                    onClick={() => onAssign(opp)}
                                    className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-oxford-green text-white text-xs font-bold rounded shadow-sm hover:bg-opacity-90 transition-all"
                                >
                                    Assign
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function PipelineBoard({ data }: { data: any[] }) {
    const active = data.filter(o => o.status === 'interviewing' || o.status === 'negotiating');
    const offers = data.filter(o => o.status === 'offer');

    return (
        <div className="p-6 grid grid-cols-2 gap-8">
            <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center justify-between">
                    <span>In Progress</span>
                    <span className="bg-slate-100 px-2 rounded-full text-xs">{active.length}</span>
                </h3>
                <div className="space-y-3">
                    {active.map(opp => (
                        <PipelineCard key={opp.id} opp={opp} />
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-green-600 mb-4 flex items-center justify-between">
                    <span>Offers / Closed</span>
                    <span className="bg-green-50 px-2 rounded-full text-xs">{offers.length}</span>
                </h3>
                <div className="space-y-3">
                    {offers.map(opp => (
                        <PipelineCard key={opp.id} opp={opp} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function PipelineCard({ opp }: { opp: any }) {
    return (
        <div className="bg-white border border-slate-200 rounded p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="font-bold text-slate-800">{opp.company}</div>
                    <div className="text-xs text-slate-500">{opp.role}</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${opp.status === 'offer' ? 'bg-green-500' : 'bg-blue-400'}`} />
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                <div className="text-xs font-mono text-slate-400">
                    ID: {opp.userId ? opp.userId.slice(0, 8) : 'Unassigned'}
                </div>
                <div className="text-xs font-bold text-oxford-green">
                    ${((opp.financials?.rep_net_value || 0) / 1000).toFixed(1)}k Net
                </div>
            </div>
        </div>
    )
}
