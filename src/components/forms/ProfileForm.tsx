import { useState } from 'react';
import type { UserProfile } from '../../types/schema';

interface ProfileFormProps {
    initialData: UserProfile['profile'];
    onSubmit: (data: Partial<UserProfile['profile']>) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

export default function ProfileForm({ initialData, onSubmit, onCancel, isSubmitting }: ProfileFormProps) {
    const [formData, setFormData] = useState(initialData);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Full Name</label>
                <input
                    required
                    className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-signal-orange outline-none"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
            </div>
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Headline</label>
                <input
                    required
                    className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-signal-orange outline-none"
                    placeholder="e.g. Senior Product Manager"
                    value={formData.headline}
                    onChange={e => setFormData({ ...formData, headline: e.target.value })}
                />
            </div>
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Short Bio</label>
                <textarea
                    required
                    rows={3}
                    className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-signal-orange outline-none resize-none"
                    placeholder="Brief professional summary..."
                    value={formData.bio_short}
                    onChange={e => setFormData({ ...formData, bio_short: e.target.value })}
                />
            </div>
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Elevator Pitch</label>
                <textarea
                    required
                    rows={2}
                    className="w-full p-2 border border-gray-200 rounded-sm text-sm focus:border-signal-orange outline-none resize-none"
                    value={formData.pitch}
                    onChange={e => setFormData({ ...formData, pitch: e.target.value })}
                />
            </div>

            <div className="pt-4 flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 border border-gray-200 text-gray-500 font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-oxford-green text-white font-bold py-3 text-sm uppercase tracking-widest rounded-sm hover:bg-opacity-90 disabled:opacity-50"
                >
                    {isSubmitting ? 'Saving...' : 'Update Profile'}
                </button>
            </div>
        </form>
    );
}
