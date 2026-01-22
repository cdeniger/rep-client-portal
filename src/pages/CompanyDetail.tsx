import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocument } from '../hooks/useDocument';
import { useCollection } from '../hooks/useCollection';
import { where } from 'firebase/firestore';
import ActivityContextPanel from '../components/activities/ActivityContextPanel';
import ContactDrawer from '../components/rep/ContactDrawer';
import Modal from '../components/ui/Modal';

import {
    MapPin, Globe, Linkedin, Users, Briefcase,
    History, StickyNote, ChevronLeft, Edit, Plus
} from 'lucide-react';
import type { Contact, JobTarget, JobPursuit } from '../types/schema';
import CompanyDrawer from '../components/companies/CompanyDrawer';
import LinkContactModal from '../components/companies/LinkContactModal';
import LocationManager from '../components/companies/LocationManager';
import ContactManager from '../components/companies/ContactManager';

export default function CompanyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { document: company, loading, error } = useDocument('companies', id);
    const [activeTab, setActiveTab] = useState<'people' | 'locations' | 'history' | 'jobs' | 'notes'>('people');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // New Actions State
    const [isContactDrawerOpen, setIsContactDrawerOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);

    // Fetch Contacts (Always linked by companyId)
    const { data: contacts } = useCollection<Contact>(
        'contacts',
        where('companyId', '==', id)
    );

    // Fetch Job Targets (Linked by name for now, until Schema update)
    // We use the company name to find targets.
    const { data: jobTargets } = useCollection<JobTarget>(
        'job_targets',
        where('company', '==', company?.name || '___NON_EXISTENT_COMPANY___')
    );

    // Fetch Pursuits (Linked by companyId if possible, else match name? 
    // Schema says JobPursuit has companyId. We should rely on that if populated.)
    const { data: jobPursuits } = useCollection<JobPursuit>(
        'job_pursuits',
        where('companyId', '==', id)
    );

    if (loading) return <div className="p-12 text-center text-slate-400 font-mono">Loading Company Intelligence...</div>;
    if (error || !company) return <div className="p-12 text-center text-red-400 font-mono">Company not found.</div>;

    const isTarget = company.type === 'target' || !company.type; // Default to target
    const activePursuitsCount = jobPursuits ? jobPursuits.filter(p =>
        ['outreach', 'interviewing', 'offer', 'negotiating'].includes(p.stageId)
    ).length : 0;

    const showHeatmap = isTarget && activePursuitsCount > 0;

    return (
        <div className="space-y-6 pb-12 p-6">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4 border-b border-slate-700 pb-4">
                <button
                    onClick={() => navigate('/rep/companies')}
                    className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-oxford-green mb-1 flex items-center gap-3">
                        {company.logoUrl && (
                            <img src={company.logoUrl} alt="Logo" className="w-8 h-8 rounded object-contain bg-white" />
                        )}
                        {company.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
                        <span className="font-mono">ID: {company.id.slice(0, 8)}</span>
                        {company.industry && (
                            <>
                                <span>•</span>
                                <span>{company.industry}</span>
                            </>
                        )}
                        {company.website && (
                            <>
                                <span>•</span>
                                <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                                >
                                    <Globe className="h-3 w-3" />
                                    {new URL(company.website).hostname}
                                </a>
                            </>
                        )}
                    </div>
                </div>
                {/* Edit Button opens Drawer */}
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors"
                >
                    <Edit className="h-4 w-4" />
                    <span>Edit Company</span>
                </button>
            </div>

            <CompanyDrawer
                company={company}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            />

            <div className="grid grid-cols-12 gap-6">

                {/* SECTION A: SIDEBAR (30%) */}
                <aside className="col-span-12 lg:col-span-4 space-y-6">

                    {/* Core Info Card */}
                    <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm">
                        <div className="flex flex-col gap-4">
                            {/* Badges */}
                            <div className="flex gap-2">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${company.type === 'client' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                    company.type === 'partner' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                        company.type === 'vendor' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                            'bg-emerald-50 text-emerald-700 border-emerald-100' // target
                                    }`}>
                                    {company.type || 'TARGET'}
                                </span>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${company.status === 'inactive' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-green-50 text-green-700 border-green-100'
                                    }`}>
                                    {company.status || 'ACTIVE'}
                                </span>
                            </div>

                            {/* Locations */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Primary Location</div>
                                {company.locations && company.locations.length > 0 ? (
                                    <div className="flex items-start gap-2 text-sm text-slate-700">
                                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="font-semibold">{company.locations[0].nickname}</div>
                                            {company.locations[0].address?.city && (
                                                <div className="text-slate-500">{company.locations[0].address.city}, {company.locations[0].address.state}</div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-400 italic">No locations listed</div>
                                )}
                            </div>

                            {/* Account Owner (Placeholder logic until we have Users mapped) */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Account Owner</div>
                                {company.accountOwnerId ? (
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                            AO
                                        </div>
                                        <span>User {company.accountOwnerId.slice(0, 5)}...</span>
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-400 italic">Unassigned</div>
                                )}
                            </div>

                            {/* Socials */}
                            {company.linkedInUrl && (
                                <div className="pt-4 mt-2">
                                    <a
                                        href={company.linkedInUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-xs font-bold text-[#0077b5] hover:underline"
                                    >
                                        <Linkedin className="h-4 w-4" />
                                        <span>Company LinkedIn</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats or Relation Notes Preview */}
                    {company.relationshipNotes && (
                        <div className="bg-yellow-50 border border-yellow-100 rounded-sm p-4 text-sm text-yellow-900">
                            <h4 className="font-bold flex items-center gap-2 mb-2 text-[10px] uppercase tracking-wider text-yellow-700">
                                <StickyNote className="h-3 w-3" /> Relationship Context
                            </h4>
                            <p className="whitespace-pre-wrap leading-relaxed opacity-90">{company.relationshipNotes}</p>
                        </div>
                    )}

                </aside>

                {/* SECTION B: MAIN VIEW (70%) */}
                <main className="col-span-12 lg:col-span-8 space-y-6">

                    {/* WIDGET 1: Pursuit Heatmap (Conditional) */}
                    {showHeatmap && (
                        <div className="">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Briefcase className="h-4 w-4" /> Active Pursuits
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {jobPursuits?.filter(p => !['closed_lost', 'closed_by_market', 'placed'].includes(p.stageId)).map(pursuit => (
                                    <div key={pursuit.id} className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors cursor-pointer">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="text-xs text-slate-500 font-mono mb-1">Engagement ID: {pursuit.engagementId?.slice(0, 6)}...</div>
                                                <div className="font-bold text-slate-800">{pursuit.role}</div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${pursuit.stageId === 'offer_pending' ? 'bg-green-100 text-green-700' :
                                                pursuit.stageId === 'interview_loop' ? 'bg-blue-50 text-blue-600' :
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                {pursuit.stageId}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-400 mt-2">
                                            {pursuit.stage_detail || 'No stage details provided'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* WIDGET 2: Data Tabs */}
                    <div className="bg-white border border-slate-200 rounded-sm shadow-sm min-h-[400px]">
                        {/* Tabs Navigation */}
                        <div className="flex border-b border-slate-200">
                            <button
                                onClick={() => setActiveTab('people')}
                                className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'people' ? 'border-oxford-green text-oxford-green' : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Users className="h-4 w-4" /> People
                            </button>

                            <button
                                onClick={() => setActiveTab('locations')}
                                className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'locations' ? 'border-oxford-green text-oxford-green' : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <MapPin className="h-4 w-4" /> Locations
                            </button>

                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'border-oxford-green text-oxford-green' : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <History className="h-4 w-4" /> History
                            </button>

                            {/* Conditional Jobs Tab */}
                            {isTarget && (
                                <button
                                    onClick={() => setActiveTab('jobs')}
                                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'jobs' ? 'border-oxford-green text-oxford-green' : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <Briefcase className="h-4 w-4" /> Open Jobs <span className="bg-slate-100 text-slate-600 px-1.5 rounded-full text-[10px]">{jobTargets?.length || 0}</span>
                                </button>
                            )}

                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'notes' ? 'border-oxford-green text-oxford-green' : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <StickyNote className="h-4 w-4" /> Notes
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {/* PEOPLE TAB */}
                            {activeTab === 'people' && (
                                <div className="">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <Users className="h-4 w-4" /> Key Contacts
                                        </h3>
                                        <button
                                            onClick={() => setIsLinkModalOpen(true)}
                                            className="text-xs font-bold text-oxford-green bg-white border border-slate-200 px-3 py-1.5 rounded-sm shadow-sm hover:border-oxford-green hover:bg-slate-50 transition-all flex items-center gap-2"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add Contact
                                        </button>
                                    </div>
                                    <ContactManager
                                        companyId={company.id}
                                        contacts={contacts || []}
                                    />
                                </div>
                            )}

                            {/* LOCATIONS TAB */}
                            {activeTab === 'locations' && (
                                <div className="max-w-2xl">
                                    <LocationManager company={company} />
                                </div>
                            )}

                            {/* HISTORY / NOTES */}
                            {activeTab === 'history' && (
                                <div className="h-[600px]">
                                    <ActivityContextPanel
                                        entityType="company"
                                        entityId={company.id}
                                    />
                                </div>
                            )}

                            {/* JOBS TAB */}
                            {activeTab === 'jobs' && (
                                <div className="space-y-4">
                                    {jobTargets && jobTargets.length > 0 ? (
                                        <div className="divide-y divide-slate-100">
                                            {jobTargets.map(job => (
                                                <div key={job.id} className="py-3 flex items-center justify-between group">
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-sm">{job.role}</div>
                                                        <div className="text-xs text-slate-500">Source: {job.source}</div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {job.financials && (
                                                            <div className="text-xs font-mono text-slate-600">
                                                                ${(job.financials.base / 1000).toFixed(0)}k Base
                                                            </div>
                                                        )}
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${job.status === 'OPEN' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
                                                            }`}>
                                                            {job.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-slate-400 italic">
                                            No open job targets found.
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div className="prose prose-sm max-w-none text-slate-600">
                                    {company.relationshipNotes ? (
                                        <p className="whitespace-pre-wrap">{company.relationshipNotes}</p>
                                    ) : (
                                        <p className="italic text-slate-400">No extended notes available.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
            {/* Link Contact Modal (Step 1) */}
            <LinkContactModal
                company={company}
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onCreateNew={() => {
                    setIsLinkModalOpen(false);
                    setIsContactDrawerOpen(true);
                }}
                onContactLinked={() => {
                    // No-op, realtime update will show it
                }}
            />

            {/* Contact Creation Drawer (Step 2) */}
            <ContactDrawer
                contact={null} // Create Mode
                company={company} // Pre-link this company
                isOpen={isContactDrawerOpen}
                onClose={() => setIsContactDrawerOpen(false)}
            />

            {/* Create Job Target Modal */}
            <Modal
                isOpen={isJobModalOpen}
                onClose={() => setIsJobModalOpen(false)}
                title="New Job Target"
            >
                {/* Logic for Job Creation would go here. For now, placeholder or form */}
                <div className="p-6 text-center text-slate-500 italic">
                    Job Target Creation Form (Coming in Step 3)
                </div>
            </Modal>
        </div>
    );
}
