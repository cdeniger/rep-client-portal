import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useCollection } from '../../hooks/useCollection';
import Modal from '../ui/Modal';
import type { Engagement, IntakeResponse } from '../../types/schema';
import LinkContactModal from './client/LinkContactModal';
import { useDocument } from '../../hooks/useDocument';
import { User, Map, Target, Shield, DollarSign, CheckCircle, Contact as ContactIcon, Mail, Phone, Linkedin, ExternalLink, Link as LinkIcon, AlertCircle, RefreshCw } from 'lucide-react';

interface ClientMasterFileModalProps {
    isOpen: boolean;
    onClose: () => void;
    engagement: Engagement;
    initialTab?: 'profile' | 'parameters' | 'strategy';
}

type TabType = 'profile' | 'parameters' | 'strategy' | 'contact';

export default function ClientMasterFileModal({ isOpen, onClose, engagement, initialTab = 'profile' }: ClientMasterFileModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [isLoading, setIsLoading] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    // Fetch Linked Contact Data
    const { document: linkedContact } = useDocument(
        'contacts',
        engagement?.profile?.contactId || ''
    );

    // Fetch Pods
    const { data: pods } = useCollection<any>('pods');

    // Reset tab when opening
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    // --- State Management ---
    // We keep separate state for each tab's data to allow independent saving or unified saving. 
    // For simplicity and "save as you go" UX, we might want a global save, but given the disparate data, 
    // let's have a single "Save Changes" button that submits EVERYTHING dirty. 
    // Actually, distinct forms might be cleaner. Let's do a single oversized form state.

    const [formData, setFormData] = useState({
        // Operational / Profile
        status: 'active',
        startDate: '',
        isaPercentage: 0,
        monthlyRetainer: 0,
        pod: '',
        podId: '', // Added stable ID
        firstName: '',
        lastName: '',
        headline: '',
        bio_short: '',

        // Identity (Market)
        currentTitle: '',
        currentCompany: '',
        industry: '',
        experienceBand: '',

        // Deal Parameters
        minBase: 0,
        minTotalComp: 0,
        minLevel: 3,
        preferredFunctions: '', // Comma separated
        workStyle: 'hybrid',
        maxCommuteMinutes: 45,
        relocationWillingness: false,
        preferredIndustries: '', // Comma separated
        avoidIndustries: '', // Comma separated

        // Strategy (Placeholder/Basic)
        // Add basic strategy fields if they exist in schema, otherwise placeholder
        primaryArc: '',
        successMetrics: '' // Comma separated
    });

    // Hydration
    useEffect(() => {
        if (isOpen && engagement) {
            setFormData({
                // Operational
                status: engagement.status || 'active',
                startDate: engagement.startDate ? new Date(engagement.startDate).toISOString().split('T')[0] : '',
                isaPercentage: (engagement.isaPercentage || 0) * 100,
                monthlyRetainer: engagement.monthlyRetainer || 0,
                pod: engagement.profile?.pod || '',
                podId: engagement.profile?.podId || '', // Hydrate ID
                firstName: engagement.profile?.firstName || '',
                lastName: engagement.profile?.lastName || '',
                headline: engagement.profile?.headline || '',
                bio_short: engagement.profile?.bio_short || '',

                // Identify
                currentTitle: engagement.profile?.currentTitle || '',
                currentCompany: engagement.profile?.currentCompany || '',
                industry: engagement.profile?.industry || '',
                experienceBand: engagement.profile?.experienceBand || '',

                // Parameters
                minBase: engagement.targetParameters?.minBase || 0,
                minTotalComp: engagement.targetParameters?.minTotalComp || 0,
                minLevel: engagement.targetParameters?.minLevel || 3,
                preferredFunctions: (engagement.targetParameters?.preferredFunctions || []).join(', '),
                workStyle: engagement.targetParameters?.workStyle || 'hybrid',
                maxCommuteMinutes: engagement.targetParameters?.maxCommuteMinutes || 45,
                relocationWillingness: engagement.targetParameters?.relocationWillingness || false,
                preferredIndustries: (engagement.targetParameters?.preferredIndustries || []).join(', '),
                avoidIndustries: (engagement.targetParameters?.avoidIndustries || []).join(', '),

                // Strategy
                primaryArc: engagement.strategy?.trajectory?.primaryArc || '',
                successMetrics: (engagement.strategy?.trajectory?.successMetrics || []).join(', ')
            });
        }
    }, [isOpen, engagement]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const engRef = doc(db, 'engagements', engagement.id);

            // Helper to split comma strings
            const splitCsv = (str: string) => str.split(',').map(s => s.trim()).filter(s => s.length > 0);

            await updateDoc(engRef, {
                // Operational
                status: formData.status,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                isaPercentage: Number(formData.isaPercentage) / 100,
                monthlyRetainer: Number(formData.monthlyRetainer),
                'profile.pod': formData.pod,
                'profile.podId': formData.podId, // Save Stable ID
                'profile.headline': formData.headline,
                'profile.bio_short': formData.bio_short,

                // Identity
                'profile.currentTitle': formData.currentTitle,
                'profile.currentCompany': formData.currentCompany,
                'profile.industry': formData.industry,
                'profile.experienceBand': formData.experienceBand,

                // Parameters
                'targetParameters.minBase': Number(formData.minBase),
                'targetParameters.minTotalComp': Number(formData.minTotalComp),
                'targetParameters.minLevel': Number(formData.minLevel),
                'targetParameters.preferredFunctions': splitCsv(formData.preferredFunctions),
                'targetParameters.workStyle': formData.workStyle,
                'targetParameters.maxCommuteMinutes': Number(formData.maxCommuteMinutes),
                'targetParameters.relocationWillingness': formData.relocationWillingness,
                'targetParameters.preferredIndustries': splitCsv(formData.preferredIndustries),
                'targetParameters.avoidIndustries': splitCsv(formData.avoidIndustries),

                // Strategy
                'strategy.trajectory.primaryArc': formData.primaryArc,
                'strategy.trajectory.successMetrics': splitCsv(formData.successMetrics)
            });

            onClose();
        } catch (err) {
            console.error("Failed to save client master file:", err);
            alert("Failed to save changes. Check console.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetFromIntake = async () => {
        if (!engagement?.id || !engagement.userId) return;

        if (!window.confirm("WARNING: This will OVERWRITE current engagement data with the original Intake Submission. This cannot be undone. Are you sure?")) {
            return;
        }

        setIsLoading(true);
        try {
            // 1. Find the latest intake for this user
            const q = query(collection(db, 'intake_responses'), where('userId', '==', engagement.userId));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                alert("No Intake Submission found for this user.");
                setIsLoading(false);
                return;
            }

            // Assume the first one is the one we want (or sort by date if needed)
            const intakeDoc = snapshot.docs[0];
            const intakeData = intakeDoc.data() as IntakeResponse;

            // 2. Hydrate Logic (Strict Duplicate of Server-Side Trigger)
            // We update the local form state first, then save everything with handleSave or just direct update?
            // "Reset" usually implies resetting the DB record.
            // Let's update the DB directly as the original function did, then close or reload.
            // But wait, if we update the DB directly, the form state here might be stale if we don't close.
            // Better to update formData and let the user click "Save"? 
            // The original logic updated the doc directly. Let's do that for "Reset" semantics (hard reset).
            // AND we should probably close the modal or refetch. 
            // UseDocument hook in parent handles refetch. 

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
            onClose(); // Close to force refresh/reflect changes

        } catch (error) {
            console.error("Failed to reset from intake:", error);
            alert("Failed to reset data. Check console.");
        } finally {
            setIsLoading(false);
        }
    };

    const Tabs = () => (
        <div className="flex border-b border-slate-200 mb-6">
            <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'profile' ? 'border-oxford-green text-oxford-green' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                <User className="h-4 w-4" />
                Profile
            </button>
            <button
                onClick={() => setActiveTab('parameters')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'parameters' ? 'border-oxford-green text-oxford-green' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                <Target className="h-4 w-4" />
                Deal Params
            </button>
            <button
                onClick={() => setActiveTab('strategy')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'strategy' ? 'border-oxford-green text-oxford-green' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                <Map className="h-4 w-4" />
                Strategy
            </button>
            <button
                onClick={() => setActiveTab('contact')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'contact' ? 'border-oxford-green text-oxford-green' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                <ContactIcon className="h-4 w-4" />
                Contact
            </button>
        </div>
    );

    const clientName = engagement.profile?.firstName && engagement.profile?.lastName
        ? `${engagement.profile.firstName} ${engagement.profile.lastName}`
        : engagement.profile?.headline || 'Client';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Client File: ${clientName}`} maxWidth="max-w-4xl">
            <div className="h-[650px] flex flex-col">
                <Tabs />

                <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-1">
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            {/* Operational Section */}
                            <div className="bg-slate-50 p-4 rounded-sm border border-slate-100">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-2">Operational</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Status</label>
                                            <select
                                                className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                                value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            >
                                                <option value="active">Active</option>
                                                <option value="searching">Searching</option>
                                                <option value="negotiating">Negotiating</option>
                                                <option value="placed">Placed</option>
                                                <option value="paused">Paused</option>
                                                <option value="alumni">Alumni</option>
                                                <option value="dropped">Dropped</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">ISA Rate (%)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                                value={formData.isaPercentage}
                                                onChange={e => setFormData({ ...formData, isaPercentage: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Monthly Retainer ($)</label>
                                            <input
                                                type="number"
                                                className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                                value={formData.monthlyRetainer}
                                                onChange={e => setFormData({ ...formData, monthlyRetainer: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                                value={formData.startDate}
                                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Pod Assignment</label>
                                            <select
                                                className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                                value={formData.podId}
                                                onChange={e => {
                                                    const selectedId = e.target.value;
                                                    const selectedPod = pods?.find((p: any) => p.id === selectedId);
                                                    setFormData({
                                                        ...formData,
                                                        podId: selectedId,
                                                        pod: selectedPod?.name || '' // Update display label automatically
                                                    });
                                                }}
                                            >
                                                <option value="">-- Select Pod --</option>
                                                {pods?.map((p: any) => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                            <div className="text-[10px] text-slate-400 mt-1">
                                                ID: {formData.podId || 'None'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Section */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-100 pb-2">Public Profile</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Headline</label>
                                        <input
                                            className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                            value={formData.headline}
                                            onChange={e => setFormData({ ...formData, headline: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Current Company</label>
                                        <input
                                            className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                            value={formData.currentCompany}
                                            onChange={e => setFormData({ ...formData, currentCompany: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Bio / Notes</label>
                                    <textarea
                                        rows={3}
                                        className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                        value={formData.bio_short}
                                        onChange={e => setFormData({ ...formData, bio_short: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'parameters' && (
                        <div className="space-y-6">
                            {/* Money & Level */}
                            <div className="bg-emerald-50/50 p-4 rounded-sm border border-emerald-100">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-800 mb-4 border-b border-emerald-200 pb-2 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Compensation & Level
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">Min Base ($)</label>
                                        <input type="number" className="w-full p-2 border border-emerald-200 rounded-sm text-sm" value={formData.minBase} onChange={e => setFormData({ ...formData, minBase: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">Min Total ($)</label>
                                        <input type="number" className="w-full p-2 border border-emerald-200 rounded-sm text-sm" value={formData.minTotalComp} onChange={e => setFormData({ ...formData, minTotalComp: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">Min Anchor Level</label>
                                        <select className="w-full p-2 border border-emerald-200 rounded-sm text-sm bg-white" value={formData.minLevel} onChange={e => setFormData({ ...formData, minLevel: Number(e.target.value) })}>
                                            <option value={3}>Senior (IC3)</option>
                                            <option value={4}>Staff/Lead (IC4)</option>
                                            <option value={5}>Principal (IC5)</option>
                                            <option value={6}>Director+</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Role & Industry */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Target Functions</label>
                                    <input placeholder="Product, Engineering..." className="w-full p-2 border border-slate-300 rounded-sm text-sm" value={formData.preferredFunctions} onChange={e => setFormData({ ...formData, preferredFunctions: e.target.value })} />
                                    <p className="text-[10px] text-slate-400 mt-1">Comma separated</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Target Industries</label>
                                    <input placeholder="FinTech, AI..." className="w-full p-2 border border-slate-300 rounded-sm text-sm" value={formData.preferredIndustries} onChange={e => setFormData({ ...formData, preferredIndustries: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-red-500 mb-1">Excluded Industries</label>
                                <input placeholder="Gambling, AdTech..." className="w-full p-2 border border-red-200 rounded-sm text-sm bg-red-50/10" value={formData.avoidIndustries} onChange={e => setFormData({ ...formData, avoidIndustries: e.target.value })} />
                            </div>

                            {/* Logistics */}
                            <div className="bg-slate-50 p-4 rounded-sm border border-slate-200">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                                    <Map className="h-4 w-4" />
                                    Logistics
                                </h3>
                                <div className="grid grid-cols-3 gap-4 items-end">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Work Style</label>
                                        <select className="w-full p-2 border border-slate-300 rounded-sm text-sm" value={formData.workStyle} onChange={e => setFormData({ ...formData, workStyle: e.target.value })}>
                                            <option value="remote">Remote Only</option>
                                            <option value="hybrid">Hybrid</option>
                                            <option value="onsite">Onsite</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Max Commute (Min)</label>
                                        <input type="number" className="w-full p-2 border border-slate-300 rounded-sm text-sm" value={formData.maxCommuteMinutes} onChange={e => setFormData({ ...formData, maxCommuteMinutes: Number(e.target.value) })} />
                                    </div>
                                    <div className="flex items-center gap-2 pb-2">
                                        <input
                                            type="checkbox"
                                            id="reloc"
                                            className="h-4 w-4 text-oxford-green rounded border-slate-300"
                                            checked={formData.relocationWillingness}
                                            onChange={e => setFormData({ ...formData, relocationWillingness: e.target.checked })}
                                        />
                                        <label htmlFor="reloc" className="text-sm font-bold text-slate-700">Willing to Relocate</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'strategy' && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-8 text-center rounded border border-slate-200 border-dashed">
                                <div className="flex justify-center mb-2 text-slate-300">
                                    <Shield className="h-12 w-12" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 mb-2">Strategy Module</h3>
                                <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                                    Define the long-term career arc, success metrics, and authority positioning for this client.
                                </p>

                                <div className="text-left max-w-lg mx-auto space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Primary Trajectory Arc</label>
                                        <input
                                            placeholder="e.g. Founder Track -> VP Product"
                                            className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                            value={formData.primaryArc}
                                            onChange={e => setFormData({ ...formData, primaryArc: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Success Metrics (KPIs)</label>
                                        <textarea
                                            rows={3}
                                            placeholder="e.g. P&L Ownership, Team Size > 20, Public Speaking"
                                            className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                            value={formData.successMetrics}
                                            onChange={e => setFormData({ ...formData, successMetrics: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contact' && (
                        <div className="space-y-6">
                            {linkedContact ? (
                                <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-2xl mx-auto shadow-sm">
                                    <div className="flex items-start gap-6">
                                        {/* Avatar / Initials */}
                                        <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400 border border-slate-200 overflow-hidden shrink-0">
                                            {linkedContact.avatar ? (
                                                <img src={linkedContact.avatar} alt="Contact" className="h-full w-full object-cover" />
                                            ) : (
                                                <span>{(linkedContact.firstName?.[0] || '') + (linkedContact.lastName?.[0] || '')}</span>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-800">{linkedContact.firstName} {linkedContact.lastName}</h3>
                                                <div className="text-sm text-slate-500 font-medium flex items-center gap-2">
                                                    {linkedContact.title}
                                                    {linkedContact.companyId && <span className="text-slate-300">•</span>}
                                                    {/* We could fetch company name here if we had it, for now rely on denormalization if available or just title */}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 pt-2">
                                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                                    <Mail className="h-4 w-4 text-slate-400" />
                                                    {linkedContact.email ? (
                                                        <a href={`mailto:${linkedContact.email}`} className="hover:text-oxford-green hover:underline">
                                                            {linkedContact.email}
                                                        </a>
                                                    ) : <span className="text-slate-400 italic">No email</span>}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                                    <Phone className="h-4 w-4 text-slate-400" />
                                                    {linkedContact.phone ? (
                                                        <a href={`tel:${linkedContact.phone}`} className="hover:text-oxford-green hover:underline">
                                                            {linkedContact.phone}
                                                        </a>
                                                    ) : <span className="text-slate-400 italic">No phone</span>}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                                    <Linkedin className="h-4 w-4 text-slate-400" />
                                                    {linkedContact.linkedInUrl ? (
                                                        <a href={linkedContact.linkedInUrl} target="_blank" rel="noopener noreferrer" className="hover:text-oxford-green hover:underline flex items-center gap-1">
                                                            LinkedIn Profile <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    ) : <span className="text-slate-400 italic">No LinkedIn URL</span>}
                                                </div>
                                            </div>

                                            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                                                <div className="text-xs text-slate-400">
                                                    Linked on {new Date().toLocaleDateString()} {/* Placeholder for actual link date if we tracked it */}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsLinkModalOpen(true)}
                                                    className="text-xs text-oxford-green hover:underline font-bold"
                                                >
                                                    Change Linked Contact
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-slate-200 border-dashed rounded-lg text-center">
                                    <div className="bg-amber-100 p-4 rounded-full mb-4">
                                        <AlertCircle className="h-8 w-8 text-amber-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 mb-2">No Contact Linked</h3>
                                    <p className="text-slate-500 text-sm max-w-md mb-8">
                                        Link this engagement to a "Golden Source" contact record to sync emails, phone numbers, and social profiles.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setIsLinkModalOpen(true)}
                                        className="px-6 py-3 bg-amber-500 text-white font-bold text-sm uppercase tracking-widest rounded shadow-sm hover:bg-amber-600 transition-colors flex items-center gap-2"
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                        Link Golden Record
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </form>

                <div className="pt-4 mt-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 -mx-6 px-6 py-4 rounded-b-lg">
                    {/* Left Side: Danger Zone */}
                    <button
                        type="button"
                        onClick={handleResetFromIntake}
                        disabled={isLoading}
                        className="text-xs text-red-400 hover:text-red-600 font-bold uppercase tracking-widest flex items-center gap-2 transition-colors opacity-90 hover:opacity-100"
                        title="Overwrite all fields with original Intake Form data"
                    >
                        <RefreshCw className="h-3 w-3" />
                        Reset from Intake
                    </button>

                    {/* Right Side: Actions */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-slate-300 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="px-6 py-2 bg-oxford-green text-white font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-opacity-90 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4" />
                                    Save Master File
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            {/* Link Contact Modal */}
            <LinkContactModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                engagement={engagement}
                onLinkSuccess={() => {
                    // Start fresh or show toast
                    setIsLinkModalOpen(false);
                }}
            />
        </Modal>
    );
}
