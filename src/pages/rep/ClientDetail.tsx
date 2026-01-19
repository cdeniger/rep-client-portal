import { useState, useRef, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocument } from '../../hooks/useDocument';
import { useCollection } from '../../hooks/useCollection';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, where, arrayUnion, getDoc, query, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { ChevronLeft, Edit, Calendar, DollarSign, FileText, Download, ExternalLink, Loader2, Database } from 'lucide-react';
import DealCard from '../../components/rep/DealCard';
import ClientMasterFileModal from '../../components/rep/ClientMasterFileModal';
import ActivityContextPanel from '../../components/activities/ActivityContextPanel';
import type { Engagement, JobRecommendation, IntakeResponse } from '../../types/schema';
import type { JobPursuit } from '../../types/pipeline';
import PipelineBoard from '../../components/pipeline/PipelineBoard';
import { Timestamp } from 'firebase/firestore';

const MOCK_DELIVERY_ITEMS: JobPursuit[] = [
    {
        id: 'mock_1',
        pipelineId: 'delivery_v1',
        stageId: 'interview_loop',
        index: 0,
        type: 'job_pursuit',
        engagementId: 'mock_eng_1',
        companyName: 'Stripe',
        roleTitle: 'CTO',
        dealValue: 450000,
        interviewRound: 'Final Round',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    },
    {
        id: 'mock_2',
        pipelineId: 'delivery_v1',
        stageId: 'target_locked',
        index: 1,
        type: 'job_pursuit',
        engagementId: 'mock_eng_1',
        companyName: 'Google',
        roleTitle: 'VP Engineering',
        dealValue: 520000,
        interviewRound: 'N/A',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    },
    {
        id: 'mock_3',
        pipelineId: 'delivery_v1',
        stageId: 'the_shadow',
        index: 2,
        type: 'job_pursuit',
        engagementId: 'mock_eng_1',
        companyName: 'Anthropic',
        roleTitle: 'Head of AI',
        dealValue: 600000,
        interviewRound: 'Negotiation',
        offerDetails: {
            baseSalary: 350000,
            targetBonus: "20%",
            equity: "0.25%",
            signOnBonus: 50000,
            relocation: 0,
            status: 'verbal'
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    }
];


export default function ClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { document: engagement, loading, error } = useDocument('engagements', id);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch Job Pursuits (Active Pipeline) for this Engagement
    const { data: pursuits, loading: loadingPursuits } = useCollection<any>(
        'job_pursuits',
        where('engagementId', '==', id)
    );

    // Fetch Pending Recommendations
    const { data: recommendations, loading: loadingRecs } = useCollection<any>(
        'job_recommendations',
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
            if (['offer', 'negotiating', 'interviewing'].includes(pursuit.status)) {
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
    const [masterFileTab, setMasterFileTab] = useState<'profile' | 'parameters' | 'strategy'>('profile');
    const [isUploading, setIsUploading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'job_hunt'>('job_hunt');

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

    const handleResetFromIntake = async () => {
        if (!engagement?.id || !engagement.userId) return;

        if (!window.confirm("WARNING: This will OVERWRITE current engagement data with the original Intake Submission. This cannot be undone. Are you sure?")) {
            return;
        }

        setIsResetting(true);
        try {
            // 1. Find the latest intake for this user
            const q = query(collection(db, 'intake_responses'), where('userId', '==', engagement.userId)); // Might need ordering if multiple
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                alert("No Intake Submission found for this user.");
                setIsResetting(false);
                return;
            }

            // Assume the first one is the one we want (or sort by date if needed)
            // In a real scenario, we might want to order by createdAt desc
            const intakeDoc = snapshot.docs[0];
            const intakeData = intakeDoc.data() as IntakeResponse;

            // 2. Hydrate Logic (Strict Duplicate of Server-Side Trigger)
            const updates = {
                // Profile Mapping
                'profile.currentTitle': intakeData.profile?.currentTitle || '',
                'profile.currentCompany': intakeData.profile?.currentCompany || '',
                'profile.industry': intakeData.profile?.industry || '',
                'profile.experienceBand': intakeData.profile?.experienceBand || '',
                'profile.marketIdentity': intakeData.marketIdentity || {},

                // Strategy Mapping (Direct copy of buckets)
                'strategy.trajectory': intakeData.trajectory || {},
                'strategy.horizon': intakeData.horizon || {},
                'strategy.ownership': intakeData.ownership || {},
                'strategy.authority': intakeData.authority || {},
                'strategy.comp': intakeData.comp || {},

                // Target Parameters (Hard & Soft Constraints)
                // Hard Constraints
                'targetParameters.minBase': intakeData.filters?.hardConstraints?.minBase || 0,
                'targetParameters.minTotalComp': intakeData.filters?.hardConstraints?.minTotalComp || 0,
                'targetParameters.minLevel': intakeData.filters?.hardConstraints?.minLevel || 3,
                'targetParameters.maxCommuteMinutes': intakeData.filters?.hardConstraints?.maxCommuteMinutes || 45,
                'targetParameters.relocationWillingness': intakeData.filters?.hardConstraints?.relocationWillingness || false,

                // Soft Preferences
                'targetParameters.preferredIndustries': intakeData.filters?.softPreferences?.preferredIndustries || [],
                'targetParameters.avoidIndustries': intakeData.filters?.softPreferences?.avoidIndustries || [],
                'targetParameters.preferredFunctions': intakeData.filters?.softPreferences?.preferredFunctions || [],
                'targetParameters.workStyle': intakeData.filters?.softPreferences?.workStyle || 'hybrid',
            };

            await updateDoc(doc(db, 'engagements', engagement.id), updates);
            alert("Engagement successfully reset from Intake data.");

        } catch (error) {
            console.error("Failed to reset from intake:", error);
            alert("Failed to reset data. Check console.");
        } finally {
            setIsResetting(false);
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
        <div className="space-y-6 pb-12">

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
                    onClick={() => openMasterFile('profile')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors"
                >
                    <Edit className="h-4 w-4" />
                    <span>Edit Client File</span>
                </button>
                <button
                    onClick={handleResetFromIntake}
                    disabled={isResetting}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-red-400 hover:bg-slate-800 hover:text-red-300 border border-slate-700/50 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors"
                    title="Reset data from original Intake Form"
                >
                    <Database className="h-4 w-4" />
                    <span>{isResetting ? 'Resetting...' : 'Reset from Intake'}</span>
                </button>
            </div >

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Metrics & Assets & Pursuits (2 cols wide on large screens) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Top Row: Metrics & Assets */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
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
                                icon={<Calendar className="h-5 w-5" />}
                            />
                            <MetricTile
                                label="Avg Opportunity Comp"
                                value={formatCurrency(avgComp)}
                                icon={<DollarSign className="h-5 w-5" />}
                            />
                            <MetricTile
                                label="Projected ISA Value"
                                value={formatCurrency(projectedISA)}
                                icon={<DollarSign className="h-5 w-5" />}
                            />
                            <MetricTile
                                label="Last Touch"
                                value={lastTouch}
                                icon={<Calendar className="h-5 w-5" />}
                            />
                        </div>

                        {/* Client Assets */}
                        <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 h-full flex flex-col justify-between">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center justify-between">
                                    <span>Client Assets</span>
                                    <span className="text-[10px] bg-slate-200 px-1.5 rounded text-slate-500">{engagement.assets?.length || 0}</span>
                                </h3>
                                <div className="space-y-1">
                                    {engagement.assets && engagement.assets.length > 0 ? (
                                        engagement.assets.slice(0, 5).map((asset: any, idx: number) => {
                                            if (!asset) return null;
                                            return (
                                                <AssetRow key={idx} name={asset.name || 'Unknown'} type={asset.type} url={asset.url} />
                                            );
                                        })
                                    ) : (
                                        <div className="text-xs text-slate-400 italic">No assets uploaded.</div>
                                    )}
                                    {engagement.assets && engagement.assets.length > 5 && (
                                        <div className="text-[10px] text-slate-400 pl-2">+{engagement.assets.length - 5} more</div>
                                    )}
                                </div>

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
                                className="w-full mt-4 py-2 border border-dashed border-slate-300 rounded text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-600 transition-colors flex items-center justify-center gap-2"
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



                    {/* Main Content Tabs */}
                    <div className="border-t border-slate-200 pt-6">
                        <div className="flex items-center gap-6 border-b border-slate-200 mb-6">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`pb-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'overview' ? 'border-signal-orange text-oxford-green' : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('job_hunt')}
                                className={`pb-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'job_hunt' ? 'border-signal-orange text-oxford-green' : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                Job Hunt <span className="ml-1 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px]">{MOCK_DELIVERY_ITEMS.length}</span>
                            </button>
                        </div>

                        {activeTab === 'overview' ? (
                            <div className="space-y-8 animate-fadeIn">
                                {/* Original Job Pursuits Table */}
                                <div>
                                    <h3 className="text-lg font-bold text-oxford-green mb-4">Active Pursuits</h3>
                                    <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
                                        {loadingPursuits ? (
                                            <div className="p-8 text-center text-slate-400 text-sm">Loading pursuits...</div>
                                        ) : (pursuits && pursuits.length > 0) ? (
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
                                                    {pursuits.map((pursuit: any) => (
                                                        <tr key={pursuit.id} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="p-4 font-bold text-slate-800">{pursuit.company}</td>
                                                            <td className="p-4 text-sm text-slate-600">{pursuit.role}</td>
                                                            <td className="p-4">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${pursuit.status === 'offer' ? 'bg-green-100 text-green-700' :
                                                                    pursuit.status === 'interviewing' ? 'bg-blue-50 text-blue-600' :
                                                                        'bg-slate-100 text-slate-500'
                                                                    }`}>
                                                                    {pursuit.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-sm font-mono text-slate-500">
                                                                ${((pursuit.financials?.rep_net_value || 0) / 1000).toFixed(1)}k
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="p-8 text-center text-slate-400 text-sm italic">
                                                No active job pursuits for this client.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pending Client Actions (Recommendations) */}
                                {(loadingRecs || (recommendations && recommendations.filter((r: any) => r.status === 'pending_client').length > 0)) && (
                                    <div>
                                        <h3 className="text-lg font-bold text-oxford-green mb-4">Pending Client Actions</h3>
                                        {loadingRecs ? (
                                            <div className="text-sm text-slate-400">Loading recommendations...</div>
                                        ) : (
                                            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
                                                <table className="w-full text-left">
                                                    <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500">
                                                        <tr>
                                                            <th className="p-4 font-bold">Company</th>
                                                            <th className="p-4 font-bold">Role</th>
                                                            <th className="p-4 font-bold">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {recommendations.filter((rec: any) => rec.status === 'pending_client').map((rec: any) => (
                                                            <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                                                                <td className="p-4 font-bold text-slate-800">{rec.target?.company || 'Unknown'}</td>
                                                                <td className="p-4 text-sm text-slate-600">{rec.target?.role || 'Unknown'}</td>
                                                                <td className="p-4">
                                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                                                        Pending Client
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-[600px] bg-slate-50 border border-slate-200 rounded-lg overflow-hidden animate-fadeIn">
                                <PipelineBoard
                                    definitionId="delivery_v1"
                                    items={MOCK_DELIVERY_ITEMS}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Deal Parameters & Activities (1 col wide, full height) */}
                <div className="space-y-6">
                    <DealCard engagement={engagement} onEdit={() => openMasterFile('parameters')} />

                    {/* Activity Context Panel */}
                    <div className="h-[600px]">
                        <ActivityContextPanel
                            entityType="engagement"
                            entityId={id || ''}
                        />
                    </div>
                </div>
            </div>

            {/* Master File Modal */}
            {engagement && (
                <ClientMasterFileModal
                    isOpen={isMasterFileOpen}
                    onClose={() => setIsMasterFileOpen(false)}
                    engagement={engagement}
                    initialTab={masterFileTab}
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
