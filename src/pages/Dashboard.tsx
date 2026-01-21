import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDocument } from '../hooks/useFirestore';
import { useCollection } from '../hooks/useCollection';
import { where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile, JobPursuit, Engagement, JobRecommendation } from '../types/schema';
import { ArrowRight, Trophy, Target, Calendar, Edit2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import ProfileForm from '../components/forms/ProfileForm';

export default function Dashboard() {
    const { user } = useAuth();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Fetch User Profile
    const { data: userProfile, loading: profileLoading } = useDocument<UserProfile>('users', user?.uid || '');

    // 1. Fetch Active Engagement (Context Root)
    const { data: engagements } = useCollection<Engagement>(
        'engagements',
        where('userId', '==', user?.uid || '')
    );
    const activeEngagement = engagements.find(e => ['active', 'searching', 'negotiating'].includes(e.status));

    // 2. Fetch Job Pursuits (Scoped to Engagement) - ARCH UPDATE: Query by Engagement ID
    const { data: opportunities, loading: oppsLoading } = useCollection<JobPursuit>(
        'job_pursuits',
        where('engagementId', '==', activeEngagement?.id || 'no_op')
    );

    // 3. Fetch Recommendations (Scoped to Engagement)
    const { data: recommendations } = useCollection<JobRecommendation>(
        'job_recommendations',
        where('engagementId', '==', activeEngagement?.id || 'no_op')
    );

    if (profileLoading || oppsLoading) {
        return <div className="text-gray-400 text-sm animate-pulse">Loading Dashboard...</div>;
    }

    const handleUpdateProfile = async (data: Partial<UserProfile['profile']>) => {
        if (!user || !userProfile) return;
        setUpdating(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                profile: { ...userProfile.profile, ...data }
            });
            setIsEditOpen(false);
        } catch (err) {
            console.error(err);
            alert('Failed to update profile.');
        } finally {
            setUpdating(false);
        }
    };

    const activeOpps = opportunities.filter(o => ['interview_loop', 'offer_pending', 'target_locked', 'outreach_execution', 'engagement'].includes(o.stageId));
    const negotiatingOpps = opportunities.filter(o => o.stageId === 'offer_pending');

    // Recommendation Actions (Future Implementation)
    // const handleRecAction = async (recId: string, action: 'pursue' | 'reject' | 'defer') => { ... }

    const pendingRecs = recommendations.filter(r => r.status === 'pending_client');
    // const deferredRecs = recommendations.filter(r => r.status === 'deferred');



    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Welcome Header - Click to Edit */}
            <div className="flex justify-between items-end border-b border-gray-200 pb-6 group relative">
                <div
                    onClick={() => setIsEditOpen(true)}
                    className="cursor-pointer hover:bg-gray-50/50 -m-4 p-4 rounded-sm transition-colors w-full md:w-auto"
                >
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-oxford-green mb-1">
                            Good afternoon, {userProfile?.profile?.name?.split(' ')[0] || 'Client'}.
                        </h1>
                        <Edit2 className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-gray-500 text-sm">
                        {userProfile?.profile?.headline || 'Managing your career asset.'}
                    </p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Current Pod</div>
                    <div className="text-sm font-semibold text-oxford-green">{userProfile?.profile?.pod || 'Unassigned'}</div>
                </div>
            </div>


            {/* High Level Metrics */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Metric 1: Active Pipeline */}
                <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Active Pipeline</h3>
                        <Target className="text-signal-orange h-5 w-5" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-oxford-green">{activeOpps.length}</span>
                        <span className="text-sm text-gray-500">Live Opps</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                        {negotiatingOpps.length > 0 ? (
                            <span className="text-signal-orange font-bold">{negotiatingOpps.length} in Negotiation</span>
                        ) : (
                            <span>Focus: Converting First Rounds</span>
                        )}
                    </div>
                </div>

                {/* Metric 2: Avg Comp Value */}
                <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Avg. Comp Value</h3>
                        <Trophy className="text-oxford-green h-5 w-5 opacity-50" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-oxford-green">
                            ${activeOpps.length > 0
                                ? Math.round(activeOpps.reduce((acc, curr) => acc + (curr.financials?.base || 0) + (curr.financials?.bonus || 0), 0) / activeOpps.length).toLocaleString()
                                : 0}
                        </span>
                        <span className="text-sm text-gray-500">Est. Total Cash</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                        Across {activeOpps.length} active opportunities
                    </div>
                </div>

                {/* Metric 3: Strategy Sync */}
                {/* Metric 3: Job Recommendations Summary */}
                <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm bg-signal-orange/5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-oxford-green">Pending Recs</h3>
                        <Sparkles className="text-signal-orange h-5 w-5" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-oxford-green">{pendingRecs.length}</span>
                        <span className="text-sm text-gray-500">Awaiting Review</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                        Review your curated opportunities
                    </div>
                    <Link to="/recommendations" className="mt-4 block w-full py-2 bg-oxford-green text-white text-center text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-opacity-90">
                        View All
                    </Link>
                </div>
            </div>

            {/* Recent Activity / Pipeline Snapshot */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Pipeline Snapshot */}
                <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-oxford-green">Priority Opportunities</h3>
                        <Link to="/pipeline" className="text-xs font-bold text-signal-orange uppercase tracking-wide flex items-center gap-1 hover:text-opacity-80">
                            View All <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {activeOpps.length === 0 && <p className="text-sm text-gray-400 italic">No active opportunities.</p>}
                        {activeOpps.slice(0, 3).map(opp => (
                            <div key={opp.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-sm transition-colors border-b border-gray-50 last:border-0">
                                <div>
                                    <div className="font-bold text-oxford-green text-sm">{opp.company}</div>
                                    <div className="text-xs text-gray-500">{opp.role}</div>
                                </div>
                                <div className="text-right">
                                    <div className="inline-block px-2 py-1 bg-signal-orange/10 text-signal-orange text-[10px] uppercase font-bold tracking-wider rounded-sm">
                                        {opp.stageId?.replace('_', ' ')}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1">{opp.stage_detail}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions (Diagnostic) */}
                <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-oxford-green mb-4">Diagnostics</h3>
                    <p className="text-sm text-gray-600 mb-6">Your Rep. Diagnostic Report is ready. Review the 7-Pillar analysis of your career asset.</p>

                    <div className="space-y-3">
                        <Link to="/diagnostic" className="block w-full text-center py-3 border border-oxford-green text-oxford-green font-bold text-xs uppercase tracking-widest hover:bg-oxford-green hover:text-white transition-colors">
                            Read Diagnostic Report
                        </Link>
                        <button className="block w-full text-center py-3 border border-gray-200 text-gray-400 font-bold text-xs uppercase tracking-widest cursor-not-allowed">
                            Complete Intake (Completed)
                        </button>
                    </div>
                </div>

                {/* Next Sync (Moved) */}
                <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm bg-oxford-green/5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-oxford-green">Next Sync</h3>
                        <Calendar className="text-oxford-green h-5 w-5" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-oxford-green">Thursday, 2pm</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                        Topic: Offer Analysis (Stripe)
                    </div>
                    <button className="mt-4 w-full py-2 bg-oxford-green text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-opacity-90">
                        View Agenda
                    </button>
                </div>
            </div>




            {/* Edit Profile Modal */}
            <Modal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Edit Profile"
            >
                {userProfile && (
                    <ProfileForm
                        initialData={userProfile.profile}
                        onSubmit={handleUpdateProfile}
                        onCancel={() => setIsEditOpen(false)}
                        isSubmitting={updating}
                    />
                )}
            </Modal>
        </div >
    );
}
