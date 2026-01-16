import { CreditCard, Download, Check } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useDocument } from '../hooks/useFirestore';
import { useCollection } from '../hooks/useCollection';
import { where } from 'firebase/firestore';

export default function Financials() {
    const { user } = useAuth();

    // Fetch Subscription
    const { data: subData, loading: subLoading } = useDocument<any>('financial_subscriptions', `sub_${user?.uid}`);

    // Fetch Invoices
    const { data: invoicesData, loading: invLoading } = useCollection<any>('invoices', where('userId', '==', user?.uid || ''));

    const subscription = subData ? {
        plan: 'Retainer (Monthly)',
        status: subData.status,
        amount: subData.amount || 0,
        nextBilling: subData.currentPeriodEnd ? new Date(subData.currentPeriodEnd.seconds * 1000).toLocaleDateString() : 'N/A',
        paymentMethod: 'Visa ending in 4242' // Mock for now until Stripe
    } : null;

    const invoices = (invoicesData || []).map(inv => ({
        id: inv.id,
        date: inv.date,
        amount: inv.amount,
        status: inv.status
    }));

    if (subLoading || invLoading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Financials...</div>;

    if (!subscription) return <div className="p-8 text-center">No active subscription found. Please contact your Rep.</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-oxford-green mb-1">Financials</h1>
                <p className="text-gray-500 text-sm">Manage your subscription and billing history.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Current Plan */}
                <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Current Plan</h3>
                            <div className="text-2xl font-bold text-oxford-green">{subscription.plan}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span className="text-sm font-medium text-green-700 uppercase tracking-wide">Active</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-oxford-green">${subscription.amount.toLocaleString()}</div>
                            <div className="text-xs text-gray-400">/ month</div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Payment Method</h4>
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">{subscription.paymentMethod}</span>
                            </div>
                            <button className="text-xs text-signal-orange font-bold uppercase tracking-wider hover:underline">Update</button>
                        </div>
                    </div>

                    <div className="text-xs text-gray-400 text-center">
                        Next billing date: <strong>{subscription.nextBilling}</strong>
                    </div>
                </div>

                {/* Invoice History */}
                <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Billing History</h3>
                    <div className="space-y-4">
                        {invoices.map(inv => (
                            <div key={inv.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-sm transition-colors border-b border-gray-50 last:border-0">
                                <div>
                                    <div className="font-bold text-oxford-green text-sm">{inv.date}</div>
                                    <div className="text-xs text-gray-400 uppercase tracking-wider">Rep. Retainer</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-gray-700">${inv.amount.toLocaleString()}</span>
                                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-sm">
                                        <Check className="h-3 w-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Paid</span>
                                    </div>
                                    <button className="text-gray-400 hover:text-oxford-green">
                                        <Download className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="mt-6 w-full py-2 border border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-gray-50">
                        View All Invoices
                    </button>
                </div>
            </div>
        </div>
    );
}
