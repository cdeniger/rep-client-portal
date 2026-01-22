import { useState, useRef, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocument } from '../../hooks/useDocument';
import { useCollection } from '../../hooks/useCollection';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, where, getDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { ChevronLeft, Edit, Calendar, DollarSign, FileText, Upload, File, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import DealCard from '../../components/rep/DealCard';
import ClientMasterFileModal from '../../components/rep/ClientMasterFileModal';
import Modal from '../../components/ui/Modal';
import OpportunityForm from '../../components/forms/OpportunityForm';
import ActivityContextPanel from '../../components/activities/ActivityContextPanel';
import ActivityEditorModal from '../../components/rep/activities/ActivityEditorModal';
import LinkContactModal from '../../components/rep/client/LinkContactModal';

import PipelineBoard from '../../components/pipeline/PipelineBoard';

// MOCK_DELIVERY_ITEMS removed


export default function ClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { document: engagement, loading, error } = useDocument('engagements', id);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch Job Pursuits (Active Pipeline) for this Engagement
    const { data: pursuits } = useCollection<any>(
        'job_pursuits',
        where('engagementId', '==', id)
    );

    // Calculations
    const avgComp = useMemo(() => {
        if (!pursuits || pursuits.length === 0) return 0;
        const totalBase = pursuits.reduce((acc: number, pursuit: any) => acc + (pursuit.financials?.base || 0), 0);
        return totalBase / pursuits.length;
    }, [pursuits]);

    const projectedISA = useMemo(() => {
        if (!pursuits || !engagement) return 0;
        return pursuits.reduce((acc: number, pursuit: any) => {
            // Only count active pursuits
            if (['offer_pending', 'interview_loop', 'engagement'].includes(pursuit.stageId)) {
                const base = pursuit.financials?.base || 0;
                const isaPct = engagement.isaPercentage || 0;
                return acc + (base * isaPct);
            }
            return acc;
        }, 0);
    }, [pursuits, engagement]);

    const lastTouch = useMemo(() => {
        if (!engagement?.lastActivity) return 'N/A';
        const date = new Date(engagement.lastActivity);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHrs < 1) return 'Just now';
        if (diffHrs < 24) return `${diffHrs}h Ago`;
        const diffDays = Math.floor(diffHrs / 24);
        return `${diffDays}d Ago`;
    }, [engagement]);

    const formatCurrency = (val: number) => {
        if (val === 0) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 1,
            notation: "compact",
            compactDisplay: "short"
        }).format(val);
    };

    // Master File Edit State
    const [isMasterFileOpen, setIsMasterFileOpen] = useState(false);
    const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

    // Fetch Linked Contact if exists
    const { document: linkedContact } = useDocument(
        'contacts',
        engagement?.profile?.contactId || ''
    );
    const [masterFileTab, setMasterFileTab] = useState<'profile' | 'parameters' | 'strategy'>('profile');
    const [isUploading, setIsUploading] = useState(false);

    const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

    // Edit Pursuit State
    const [editingPursuit, setEditingPursuit] = useState<any | null>(null);
    const [isUpdatingPursuit, setIsUpdatingPursuit] = useState(false);

    const handleUpdatePursuit = async (data: any) => {
        if (!editingPursuit?.id) return;
        setIsUpdatingPursuit(true);
        try {
            const docRef = doc(db, 'job_pursuits', editingPursuit.id);
            // Remove helper fields used for UI form if they exist
            const { assignClientId, ...cleanData } = data;

            await updateDoc(docRef, {
                ...cleanData,
                updatedAt: new Date().toISOString()
            });

            setEditingPursuit(null);
        } catch (error) {
            console.error("Failed to update pursuit:", error);
            alert("Failed to update opportunity.");
        } finally {
            setIsUpdatingPursuit(false);
        }
    };

    const openMasterFile = (tab: 'profile' | 'parameters' | 'strategy') => {
        setMasterFileTab(tab);
        setIsMasterFileOpen(true);
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



    // Duplicate Detection Logic
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [correctId, setCorrectId] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        if (id.startsWith('eng_eng_')) {
            const potentialId = id.replace('eng_eng_', 'eng_');
            const checkExists = async () => {
                const docRef = doc(db, 'engagements', potentialId);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setIsDuplicate(true);
                    setCorrectId(potentialId);
                }
            };
            checkExists();
        }
    }, [id]);

    if (loading) return <div className="p-8 text-slate-500 font-mono">Loading Engagement...</div>;
    if (error || !engagement) return <div className="p-8 text-red-400 font-mono">Engagement not found.</div>;

    if (engagement.repId !== user?.uid) {
        return (
            <div className="p-12 flex flex-col items-center justify-center h-full">
                <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
                    <h2 className="text-xl font-bold text-red-700 mb-2">Unauthorized Access</h2>
                    <p className="text-sm text-red-600 mb-6">
                        You do not have permission to view this client record.
                    </p>

                    <div className="bg-white p-4 rounded border border-red-100 text-left text-xs font-mono text-slate-500 mb-6 space-y-1">
                        <div><strong className="text-slate-700">User ID:</strong> {user?.uid}</div>
                        <div><strong className="text-slate-700">Record Owner:</strong> {engagement.repId}</div>
                        <div><strong className="text-slate-700">Record ID:</strong> {id}</div>
                    </div>

                    <button
                        onClick={async () => {
                            if (!id || !user) return;
                            try {
                                await updateDoc(doc(db, 'engagements', id), { repId: user.uid });
                                window.location.reload();
                            } catch (e) {
                                alert("Failed to claim record.");
                            }
                        }}
                        className="w-full px-4 py-2 bg-red-600 text-white font-bold uppercase text-xs tracking-wider rounded shadow-sm hover:bg-red-700 transition-colors"
                    >
                        Claim Record Ownership
                    </button>
                    <p className="text-[10px] text-red-400 mt-2">
                        *This action will re-assign this client to you.
                    </p>
                </div>
            </div>
        );
    }

    // Header Title Construction
    const startDate = engagement.startDate ? new Date(engagement.startDate).toLocaleDateString() : 'N/A';
    const headerTitle = engagement.profile?.firstName
        ? `${engagement.profile.firstName} ${engagement.profile.lastName} | ${startDate}`
        : `${engagement.profile?.headline || 'Client Detail'} | ${startDate}`;

    return (
        <div className="space-y-6 pb-12 p-6">

            {/* Duplicate Warning Banner */}
            {isDuplicate && correctId && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 rounded-r shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="text-amber-500">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-amber-800">Potential Duplicate Record Detected</h3>
                            <p className="text-xs text-amber-700">
                                You are viewing a record with a malformed ID (`{id}`). A corrected record (`{correctId}`) was found which likely contains your missing data.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(`/rep/client/${correctId}`)}
                        className="px-4 py-2 bg-amber-100 text-amber-800 text-xs font-bold uppercase rounded hover:bg-amber-200 transition-colors border border-amber-200"
                    >
                        Switch to Correct Record
                    </button>
                </div>
            )}
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4 mb-6">
                <button
                    onClick={() => navigate('/rep/roster')}
                    className="p-2 -ml-2 text-slate-400 hover:text-oxford-green rounded-full hover:bg-slate-100 transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-oxford-green mb-1">{headerTitle}</h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
                        <span className="font-mono">ID: {engagement.id.slice(0, 8)}</span>
                        <span>•</span>
                        <span>{engagement.profile?.pod || 'Unassigned'}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full ${engagement.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {engagement.status}
                        </span>
                        <span>•</span>
                        {/* Contact Link Badge */}
                        <button
                            onClick={() => setIsLinkModalOpen(true)}
                            className={`flex items-center gap-1 hover:underline ${engagement.profile?.contactId ? 'text-emerald-600 font-bold' : 'text-amber-500'}`}
                        >
                            {engagement.profile?.contactId ? (
                                <>
                                    <CheckCircle2 className="h-3 w-3" />
                                    {linkedContact ? linkedContact.firstName : 'Linked'}
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="h-3 w-3" />
                                    Link Identity
                                </>
                            )}
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Schedule Meeting Button */}
                    <button
                        onClick={() => setIsActivityModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-oxford-green text-white hover:bg-opacity-90 border border-transparent rounded-sm text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
                    >
                        <Calendar className="h-4 w-4" />
                        <span>Schedule</span>
                    </button>

                    {/* Master File Button */}
                    <button
                        onClick={() => openMasterFile('profile')}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-oxford-green hover:bg-slate-50 border border-slate-200 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
                    >
                        <Edit className="h-4 w-4" />
                        <span>Master File</span>
                    </button>
                </div>
            </div>

            {/* TABS HEADER */}
            <div className="flex items-center gap-6 border-b border-slate-700/50 mb-6">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'overview' ? 'border-signal-orange text-oxford-green' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'history' ? 'border-signal-orange text-oxford-green' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                >
                    History
                </button>
            </div>

            {activeTab === 'overview' ? (
                <div className="space-y-8 animate-fadeIn">
                    {/* HEADS UP DISPLAY (Header Grid) */}
                    <div className="grid grid-cols-12 gap-6 h-auto lg:h-[500px]">
                        {/* LEFT: Metrics Grid (Cols 1-8) */}
                        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-4 h-full">
                            {/* Row 1 */}
                            <MetricTile
                                label="Time in Process"
                                value={(() => {
                                    if (!engagement.startDate) return 'N/A';
                                    const start = new Date(engagement.startDate);
                                    const now = new Date();
                                    const diffTime = Math.abs(now.getTime() - start.getTime());
                                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                    return `${diffDays} Day${diffDays !== 1 ? 's' : ''}`;
                                })()}
                                icon={<Calendar className="h-4 w-4" />}
                            />

                            <div
                                onClick={() => setIsAssetsModalOpen(true)}
                                className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex flex-col justify-between relative group hover:border-slate-300 transition-colors cursor-pointer"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Client Assets</div>
                                    <div className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold">{engagement.assets?.length || 0}</div>
                                </div>
                                <div className="text-lg font-bold text-oxford-green flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-slate-400" />
                                    <span>{engagement.assets?.length || 0} Files</span>
                                </div>
                                <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Manage Assets</span>
                                </div>
                            </div>

                            {/* Row 2 */}
                            <MetricTile
                                label="Projected ISA"
                                value={formatCurrency(projectedISA)}
                                icon={<DollarSign className="h-4 w-4" />}
                            />

                            <div className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-colors group">
                                <div className="flex justify-between items-start">
                                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Activity Nexus</div>
                                    <div className="h-2 w-2 rounded-full bg-signal-orange animate-pulse"></div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 mb-1">Suggested Next Action:</div>
                                    <div className="text-sm font-bold text-oxford-green flex items-center gap-2">
                                        Strategy Call <ChevronLeft className="h-4 w-4 rotate-180" />
                                    </div>
                                </div>
                            </div>

                            {/* Row 3 */}
                            <MetricTile
                                label="Avg Opp. Comp"
                                value={formatCurrency(avgComp)}
                                icon={<DollarSign className="h-4 w-4" />}
                            />

                            <div className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex flex-col justify-between">
                                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Pipeline Pulse</div>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-bold text-oxford-green">{pursuits?.length || 0}</span>
                                    <span className="text-xs font-bold text-slate-400 mb-1.5">Active</span>
                                    <span className="text-slate-200 text-xl font-light">/</span>
                                    <span className="text-xl font-bold text-green-600">{pursuits?.filter((p: any) => p.status === 'offer').length || 0}</span>
                                    <span className="text-xs font-bold text-green-600/70 mb-1.5">Offer</span>
                                </div>
                            </div>

                            {/* Row 4 */}
                            <MetricTile
                                label="Last Touch"
                                value={lastTouch}
                                icon={<Calendar className="h-4 w-4" />}
                            />

                            <div className="bg-red-50 border border-red-100 p-4 rounded-sm shadow-sm flex flex-col justify-between">
                                <div className="text-[10px] uppercase tracking-widest text-red-400 font-bold flex items-center gap-2">
                                    Stalled Alerts <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                </div>
                                <div className="text-sm font-bold text-red-800">
                                    2 Opps &gt; 5 Days
                                </div>
                                <div className="text-[10px] text-red-400 underline cursor-pointer">View Stalled Items</div>
                            </div>
                        </div>

                        {/* RIGHT: Parameters Card (Cols 9-12) */}
                        <div className="col-span-12 lg:col-span-4 h-full">
                            <div className="h-full">
                                <DealCard engagement={engagement} onEdit={() => openMasterFile('parameters')} className="h-full flex flex-col" />
                            </div>
                        </div>
                    </div>

                    {/* PIPELINE BOARD (Full Width) */}
                    <div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg">
                            <PipelineBoard
                                definitionId="delivery_v1"
                                items={(pursuits || []).map((p: any) => ({
                                    ...p,
                                    stageId: p.stageId,
                                    id: p.id,
                                    index: p.index || 0,
                                    type: 'job_pursuit',
                                    companyName: p.company,
                                    roleTitle: p.role,
                                    dealValue: p.financials?.rep_net_value || 0,
                                }))}
                                onItemClick={(item) => setEditingPursuit(item)}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                /* HISTORY TAB */
                <div className="animate-fadeIn">
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 lg:col-span-8">
                            <ActivityContextPanel
                                entityType="engagement"
                                entityId={id || ''}
                            />
                        </div>
                        <div className="col-span-12 lg:col-span-4">
                            <div className="bg-slate-50 border border-slate-200 rounded p-6 text-center text-slate-400 text-sm italic">
                                Additional historical context or analytics could go here.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Master File Modal */}
            {engagement && (
                <ClientMasterFileModal
                    isOpen={isMasterFileOpen}
                    onClose={() => setIsMasterFileOpen(false)}
                    engagement={engagement}
                    initialTab={masterFileTab}
                />
            )}

            {/* Activity Editor Modal */}
            <ActivityEditorModal
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                engagementID={id}
                ownerID={user?.uid}
            />

            {/* Client Assets Modal */}
            <Modal
                isOpen={isAssetsModalOpen}
                onClose={() => setIsAssetsModalOpen(false)}
                title="Client Assets"
            >
                <div className="space-y-4">
                    {/* Hidden Input (Moved here) */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    />

                    {/* File List */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {engagement?.assets && engagement.assets.length > 0 ? (
                            engagement.assets.map((asset: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-sm hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-white rounded border border-slate-200 text-slate-400">
                                            <File className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-slate-700 truncate">{asset.name}</div>
                                            <div className="text-[10px] text-slate-400">
                                                Uploaded {new Date(asset.uploadedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={asset.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-slate-400 hover:text-oxford-green hover:bg-white rounded transition-colors"
                                        title="Download / View"
                                    >
                                        <Download className="h-4 w-4" />
                                    </a>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-sm italic border-2 border-dashed border-slate-200 rounded-lg">
                                No assets uploaded yet.
                            </div>
                        )}
                    </div>

                    {/* Upload Action */}
                    <div className="pt-4 border-t border-slate-100">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full py-3 bg-oxford-green text-white font-bold uppercase text-xs tracking-widest rounded-sm hover:bg-opacity-90 flex items-center justify-center gap-2"
                        >
                            {isUploading ? (
                                <span>Uploading...</span>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4" />
                                    <span>Upload Document</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Opportunity Modal */}
            <Modal
                isOpen={!!editingPursuit}
                onClose={() => setEditingPursuit(null)}
                title="Edit Opportunity"
            >
                <OpportunityForm
                    initialData={editingPursuit}
                    onSubmit={handleUpdatePursuit}
                    onCancel={() => setEditingPursuit(null)}
                    isSubmitting={isUpdatingPursuit}
                    hideStatus={false} // Allow changing stage here
                />
            </Modal>

            {/* Link Contact Modal */}
            {engagement && (
                <LinkContactModal
                    isOpen={isLinkModalOpen}
                    onClose={() => setIsLinkModalOpen(false)}
                    engagement={engagement}
                    onLinkSuccess={() => {
                        // Optional: Show toast or handle post-link actions
                    }}
                />
            )}
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


