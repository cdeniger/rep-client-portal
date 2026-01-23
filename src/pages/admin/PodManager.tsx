import { useState } from 'react';
import { useCollection } from '../../hooks/useCollection';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Check, Edit2, Shield, Users, Loader2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
// import { UserProfile } from '../../types/schema'; // Temporarily disabled for build fix
// Helper for roles
const roles = [
    { id: 'rep', label: 'Rep' },
    { id: 'admin', label: 'Admin' },
];

export default function PodManager() {
    // 1. Fetch Data
    const { data: pods, loading: podsLoading } = useCollection<any>('pods');
    const { data: users, loading: usersLoading } = useCollection<any>('users');

    // 2. State
    const [editingPodId, setEditingPodId] = useState<string | null>(null);
    const [podNameEdit, setPodNameEdit] = useState('');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // 3. Handlers
    const handleEditPod = (pod: any) => {
        setEditingPodId(pod.id);
        setPodNameEdit(pod.name);
    };

    const handleSavePodName = async () => {
        if (!editingPodId) return;
        try {
            await updateDoc(doc(db, 'pods', editingPodId), { name: podNameEdit });
            setEditingPodId(null);
        } catch (err) {
            console.error(err);
            alert("Failed to update Pod name.");
        }
    };

    const handleUserUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setIsSaving(true);

        try {
            // Find pod name for display redundancy
            const podName = pods.find((p: any) => p.id === selectedUser.profile.podId)?.name || '';

            await updateDoc(doc(db, 'users', selectedUser.uid), {
                role: selectedUser.role,
                'profile.podId': selectedUser.profile.podId,
                'profile.pod': podName // Keep legacy display field synced
            });
            setSelectedUser(null);
        } catch (err) {
            console.error(err);
            alert("Failed to update user.");
        } finally {
            setIsSaving(false);
        }
    };

    if (podsLoading || usersLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" /></div>;

    // Filter only internal users
    const internalUsers = users.filter((u: any) => u.role === 'rep' || u.role === 'admin');

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-oxford-green">Pod & Team Settings</h1>
                <p className="text-slate-500 text-sm">Manage organizational structure and user permissions.</p>
            </div>

            {/* Pod Management Section */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Pod Configuration
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {pods.map((pod: any) => (
                        <div key={pod.id} className="border border-slate-100 bg-slate-50 p-4 rounded-md relative group">
                            <div className="text-xs font-mono text-slate-400 mb-1">{pod.id}</div>
                            {editingPodId === pod.id ? (
                                <div className="flex gap-2">
                                    <input
                                        className="w-full p-1 text-sm border border-slate-300 rounded"
                                        value={podNameEdit}
                                        onChange={(e) => setPodNameEdit(e.target.value)}
                                        autoFocus
                                    />
                                    <button onClick={handleSavePodName} className="p-1 bg-green-500 text-white rounded hover:bg-green-600">
                                        <Check className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center">
                                    <div className="font-bold text-lg text-oxford-green">{pod.name}</div>
                                    <button onClick={() => handleEditPod(pod)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-oxford-green transition-all">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                            <div className="mt-2 text-xs text-slate-500">
                                {internalUsers.filter((u: any) => u.profile?.podId === pod.id).length} Members assigned
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Team Management Section */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Team Access Control
                    </h2>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Assigned Pod</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {internalUsers.map((user: any) => (
                            <tr key={user.uid} className="hover:bg-slate-50">
                                <td className="p-4">
                                    <div className="font-bold text-slate-800">{user.profile?.name || user.email}</div>
                                    <div className="text-xs text-slate-500">{user.email}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        {user.profile?.podId ? (
                                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                                {pods.find((p: any) => p.id === user.profile.podId)?.name || user.profile.podId}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-red-400 italic">Unassigned</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => setSelectedUser(user)}
                                        className="text-slate-400 hover:text-oxford-green font-bold text-xs uppercase tracking-wider mr-3"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (confirm("Delete this user implementation? (Firestore Doc Only)")) {
                                                try {
                                                    const { deleteDoc, doc } = await import('firebase/firestore');
                                                    await deleteDoc(doc(db, 'users', user.uid));
                                                } catch (e) {
                                                    console.error(e);
                                                    alert("Delete failed");
                                                }
                                            }
                                        }}
                                        className="text-red-300 hover:text-red-500 font-bold text-xs uppercase tracking-wider"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit User Modal */}
            <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Edit Team Member">
                {selectedUser && (
                    <form onSubmit={handleUserUpdate} className="space-y-4">
                        <div className="p-3 bg-slate-50 rounded mb-4 text-sm">
                            <span className="font-bold">{selectedUser.profile?.name || 'Unnamed User'}</span>
                            <br />
                            <span className="text-slate-500">{selectedUser.email}</span>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">System Role</label>
                            <select
                                className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                value={selectedUser.role}
                                onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as any })}
                            >
                                {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Pod Assignment</label>
                            <select
                                className="w-full p-2 border border-slate-300 rounded-sm text-sm"
                                value={selectedUser.profile?.podId || ''}
                                onChange={(e) => setSelectedUser({
                                    ...selectedUser,
                                    profile: { ...(selectedUser.profile || {}), podId: e.target.value }
                                })}
                            >
                                <option value="">-- No Assignment --</option>
                                {pods.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                                ))}
                                {/* Admin Override Option */}
                                <option value="pod_admin">Admin (All Access)</option>
                            </select>
                        </div>

                        <div className="pt-4 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedUser(null)}
                                className="flex-1 py-2 border border-slate-300 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 py-2 bg-oxford-green text-white font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-opacity-90"
                            >
                                {isSaving ? 'Saving...' : 'Update Member'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
