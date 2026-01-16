import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { addDoc, collection, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Radio, ArrowRight, TrendingUp, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

// Temporary interface until we add Signal to schema.ts fully or import it (it was in plan but maybe not in types yet)
interface Signal {
    id: string;
    source: string;
    type: 'funding' | 'departure' | 'tenure_risk';
    company: string;
    description: string;
    date: Timestamp;
    actionable: boolean;
    metadata?: any;
}

export default function Radar() {
    const { user } = useAuth();
    const [processing, setProcessing] = useState<string | null>(null);

    // In a real app we might filter by user preferences, for now grab all signals (seeded)
    const { data: signals, loading } = useCollection<Signal>('signals', orderBy('date', 'desc'));

    const handleTarget = async (signal: Signal) => {
        if (!user) return;
        setProcessing(signal.id);

        try {
            await addDoc(collection(db, 'opportunities'), {
                userId: user.uid,
                company: signal.company,
                role: 'Target Role via Radar', // Placeholder
                status: 'outreach',
                stage_detail: `Sourced from ${signal.source}: ${signal.type}`,
                source: 'radar',
                financials: { base: 0, bonus: 0, equity: '', rep_net_value: 0 }
            });
            // In a real app, we'd mark this signal as 'actioned' for this user to hide button
            alert(`Added ${signal.company} to your Pipeline.`);
        } catch (err) {
            console.error(err);
            alert('Failed to target.');
        } finally {
            setProcessing(null);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'funding': return <TrendingUp className="h-5 w-5 text-green-600" />;
            case 'departure': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
            default: return <Radio className="h-5 w-5 text-oxford-green" />;
        }
    };

    if (loading) return <div className="text-gray-400 text-sm animate-pulse">Scanning Market Signals...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-oxford-green mb-1">Rep Radar</h1>
                <p className="text-gray-500 text-sm">Real-time market intelligence acting as your scouting network.</p>
            </div>

            <div className="grid gap-4">
                {signals.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-sm">No signals detected yet. Try seeding the database.</div>
                )}

                {signals.map(signal => (
                    <div key={signal.id} className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                        <div className="shrink-0 pt-1">
                            <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center">
                                {getTypeIcon(signal.type)}
                            </div>
                        </div>

                        <div className="grow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-oxford-green text-lg">{signal.company}</h3>
                                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                        {signal.type.replace('_', ' ')} • {signal.source}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                    {signal.date?.toDate ? signal.date.toDate().toLocaleDateString() : 'Just now'}
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">{signal.description}</p>

                            {signal.actionable && (
                                <button
                                    onClick={() => handleTarget(signal)}
                                    disabled={processing === signal.id}
                                    className="text-xs font-bold bg-oxford-green text-white px-4 py-2 rounded-sm uppercase tracking-widest hover:bg-opacity-90 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processing === signal.id ? (
                                        'Processing...'
                                    ) : (
                                        <>Target This Opportunity <ArrowRight className="h-3 w-3" /></>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
