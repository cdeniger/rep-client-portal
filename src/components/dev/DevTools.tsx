import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { seedDatabase } from '../../scripts/seed';

export default function DevTools() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSeed = async () => {
        if (!user) return;
        if (!confirm('This will overwrite data for the current user. Continue?')) return;

        setLoading(true);
        try {
            await seedDatabase(user.uid);
            setMessage('Database seeded successfully!');
            alert('Database seeded successfully! Please refresh the page.');
        } catch (err: any) {
            console.error(err);
            setMessage(`Error: ${err.message}`);
            alert(`Seeding Failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-oxford-green text-bone p-4 rounded-sm shadow-lg border border-signal-orange">
                <h4 className="text-xs font-bold uppercase tracking-widest mb-2 text-signal-orange">Dev Tools</h4>

                {message && (
                    <div className="text-[10px] mb-2 text-white bg-white/10 p-1 rounded">
                        {message}
                    </div>
                )}

                <button
                    onClick={handleSeed}
                    disabled={loading}
                    className="text-xs bg-white text-oxford-green hover:bg-gray-200 px-3 py-1 rounded-sm font-bold uppercase disabled:opacity-50"
                >
                    {loading ? 'Seeding...' : 'Seed Data (Alex Mercer)'}
                </button>
            </div>
        </div>
    );
}
