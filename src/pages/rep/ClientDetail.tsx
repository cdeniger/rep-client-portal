import { useState, useEffect, useRef, Component, ReactNode, ErrorInfo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocument } from '../../hooks/useDocument';
import { useCollection } from '../../hooks/useCollection';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, where, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { ChevronLeft, Edit, Calendar, DollarSign, Briefcase, FileText, Download, ExternalLink, Loader2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import DealCard from '../../components/rep/DealCard';
import { lazy, Suspense } from 'react';

// Lazy load to prevent circular dependency crashes
const DealParamsModal = lazy(() => import('../../components/rep/DealParamsModal'));

// Simple Error Boundary for debugging
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: ErrorInfo) {
        console.error("DealParamsModal Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <p className="font-bold">DealParamsModal Failed to Load</p>
                    <pre className="text-xs mt-2 overflow-auto max-h-40">
                        {this.state.error?.toString()}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function ClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { document: engagement, loading, error } = useDocument('engagements', id);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch Opportunities for this client
    const { data: opportunities, loading: loadingOpps } = useCollection<any>(
        'opportunities',
        where('userId', '==', id)
    );

    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDealParamsModalOpen, setIsDealParamsModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        headline: '',
        pod: '',
        status: '',
        bio_short: '',
        isaPercentage: 0,
        startDate: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Initialize form when opening
    const handleOpenEdit = () => {
        if (!engagement) return;
        setEditForm({
            headline: engagement.profile?.headline || '',
            pod: engagement.profile?.pod || '',
            status: engagement.status || 'active',
            bio_short: engagement.profile?.bio_short || '',
            isaPercentage: (engagement.isaPercentage || 0) * 100, // Display as whole number (e.g. 15 for 15%)
            startDate: engagement.startDate ? new Date(engagement.startDate).toISOString().split('T')[0] : ''
        });
        setIsEditModalOpen(true);
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setIsSaving(true);
        try {
            const engRef = doc(db, 'engagements', id);
            await updateDoc(engRef, {
                status: editForm.status,
                'profile.headline': editForm.headline,
                'profile.pod': editForm.pod,
                'profile.bio_short': editForm.bio_short,
                isaPercentage: parseFloat(editForm.isaPercentage.toString()) / 100, // Convert back to decimal
                startDate: new Date(editForm.startDate).toISOString()
            });
            setIsEditModalOpen(false);
        } catch (err) {
            console.error("Failed to update profile", err);
            alert("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id) return;

        setIsUploading(true);
        try {
            // 1. Upload to Firebase Storage
            const timestamp = Date.now();
            const storagePath = `client_assets/${id}/${timestamp}_${file.name}`;
            const storageRef = ref(storage, storagePath);

            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // 2. Update Firestore Engagement Document
            const assetData = {
                name: file.name,
                url: downloadURL,
                type: file.type.includes('pdf') ? 'pdf' : 'other',
                uploadedAt: new Date().toISOString()
            };

            const engRef = doc(db, 'engagements', id);
            await updateDoc(engRef, {
                assets: arrayUnion(assetData)
            });

        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload file. Check console for details.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) return <div className="p-8 text-slate-500 font-mono">Loading Engagement...</div>;
    if (error || !engagement) return <div className="p-8 text-red-400 font-mono">Engagement not found.</div>;

    if (engagement.repId !== user?.uid) {
        return <div className="p-8 text-red-500 font-bold">Unauthorized Access</div>;
    }

    // Header Title Construction
    const startDate = engagement.startDate ? new Date(engagement.startDate).toLocaleDateString() : 'N/A';
    const headerTitle = engagement.profile?.firstName
        ? `${engagement.profile.firstName} ${engagement.profile.lastName} | ${startDate}`
        : `${engagement.profile?.headline || 'Client Detail'} | ${startDate}`;

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-700 pb-4">
                <button
                    onClick={() => navigate('/rep/roster')}
                    className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-oxford-green mb-1">{headerTitle}</h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
                        <span className="font-mono">ID: {engagement.id}</span>
                        <span>•</span>
                        <span>{engagement.profile?.pod || 'Unassigned'}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full ${engagement.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {engagement.status}
                        </span>
                        {engagement.profile?.headline && (
                            <>
                                <span>•</span>
                                <span>{engagement.profile.headline}</span>
                            </>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleOpenEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors"
                >
                    <Edit className="h-4 w-4" />
                    <span>Edit Client File</span>
                </button>
            </div >

            <div className="space-y-6">
                {/* Deal Parameters Card */}
                <DealCard engagement={engagement} onEdit={() => setIsDealParamsModalOpen(true)} />

                {/* Deal Params Edit Modal */}
                <ErrorBoundary>
                    <Suspense fallback={null}>
                        <DealParamsModal
                            isOpen={isDealParamsModalOpen}
                            onClose={() => setIsDealParamsModalOpen(false)}
                            engagement={engagement}
                        />
                    </Suspense>
                </ErrorBoundary>

                {/* Client Assets Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 h-fit">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
                        <span>Client Assets</span>
                        <span className="text-[10px] bg-slate-200 px-1.5 rounded text-slate-500">{engagement.assets?.length || 0}</span>
                    </h3>
                    <div className="space-y-2">
                        {engagement.assets && engagement.assets.length > 0 ? (
                            engagement.assets.map((asset: any, idx: number) => (
                                <AssetRow key={idx} name={asset.name} type={asset.type} url={asset.url} />
                            ))
                        ) : (
                            <div className="text-xs text-slate-400 italic text-center py-4">No assets uploaded.</div>
                        )}
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        />
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full mt-4 py-2 border border-dashed border-slate-300 rounded text-xs text-slate-400 hover:bg-white hover:text-slate-600 transition-colors flex items-center justify-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                            </>
                        ) : (
                            "+ Upload Asset"
                        )}
                    </button>
                </div>
            </div>

            {/* Mandate Opportunities Section */}
            <div className="border-t border-slate-200 pt-8">
                <h3 className="text-lg font-bold text-oxford-green mb-4">Mandate Opportunities</h3>
                <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
                    {loadingOpps ? (
                        <div className="p-8 text-center text-slate-400 text-sm">Loading opportunities...</div>
                    ) : (opportunities && opportunities.length > 0) ? (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="p-4 font-bold">Company</th>
                                    <th className="p-4 font-bold">Role</th>
                                    <th className="p-4 font-bold">Status</th>
                                    <th className="p-4 font-bold">Value (Net)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {opportunities.map((opp: any) => (
                                    <tr key={opp.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-4 font-bold text-slate-800">{opp.company}</td>
                                        <td className="p-4 text-sm text-slate-600">{opp.role}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${opp.status === 'offer' ? 'bg-green-100 text-green-700' :
                                                opp.status === 'interviewing' ? 'bg-blue-50 text-blue-600' :
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                {opp.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-mono text-slate-500">
                                            ${((opp.financials?.rep_net_value || 0) / 1000).toFixed(1)}k
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm italic">
                            No active opportunities for this client.
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Client Engagement">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">First Name (Read Only)</label>
                            <div className="relative">
                                <input
                                    readOnly
                                    className="w-full p-2 border border-slate-200 rounded-sm text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                                    value={engagement.profile?.firstName || ''}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                                    <span className="text-[10px] font-bold">LOCKED</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Last Name (Read Only)</label>
                            <div className="relative">
                                <input
                                    readOnly
                                    className="w-full p-2 border border-slate-200 rounded-sm text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                                    value={engagement.profile?.lastName || ''}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                                    <span className="text-[10px] font-bold">LOCKED</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Headline / Title</label>
                        <input
                            className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                            value={editForm.headline}
                            onChange={e => setEditForm({ ...editForm, headline: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Pod / Industry</label>
                            <select
                                className="w-full p-2 border border-slate-300 rounded-sm text-sm bg-white"
                                value={editForm.pod}
                                onChange={e => setEditForm({ ...editForm, pod: e.target.value })}
                            >
                                <option value="FinTech">FinTech</option>
                                <option value="Crypto">Crypto</option>
                                <option value="Consumer">Consumer</option>
                                <option value="Enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Status</label>
                            <select
                                className="w-full p-2 border border-slate-300 rounded-sm text-sm bg-white"
                                value={editForm.status}
                                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                            >
                                <option value="active">Active</option>
                                <option value="searching">Searching</option>
                                <option value="negotiating">Negotiating</option>
                                <option value="placed">Placed</option>
                                <option value="paused">Paused</option>
                                <option value="alumni">Alumni</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">ISA Rate (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                value={editForm.isaPercentage}
                                onChange={e => setEditForm({ ...editForm, isaPercentage: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Starte Date</label>
                            <input
                                type="date"
                                className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                value={editForm.startDate}
                                onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Bio / Notes Stub</label>
                        <textarea
                            rows={3}
                            className="w-full p-2 border border-slate-300 rounded-sm text-sm resize-none"
                            value={editForm.bio_short}
                            onChange={e => setEditForm({ ...editForm, bio_short: e.target.value })}
                        />
                    </div>
                    <div className="pt-4 flex gap-2">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="flex-1 py-2 border border-slate-300 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 py-2 bg-oxford-green text-white font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-opacity-90"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div >
    );
}

function MetricTile({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex items-center justify-between">
            <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{label}</div>
                <div className="text-lg font-bold text-oxford-green">{value}</div>
            </div>
            <div className="text-slate-300 p-2 bg-slate-50 rounded-full">
                {icon}
            </div>
        </div>
    );
}

function AssetRow({ name, type, url }: { name: string, type: 'pdf' | 'other', url: string }) {
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 hover:bg-white rounded border border-transparent hover:border-slate-100 transition-all group cursor-pointer decoration-0">
            <div className="flex items-center gap-2 overflow-hidden">
                {type === 'pdf' ? <FileText className="h-4 w-4 text-red-400 flex-shrink-0" /> : <ExternalLink className="h-4 w-4 text-blue-400 flex-shrink-0" />}
                <span className="text-xs text-slate-600 font-medium truncate">{name}</span>
            </div>
            <Download className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-500" />
        </a>
    );
}
