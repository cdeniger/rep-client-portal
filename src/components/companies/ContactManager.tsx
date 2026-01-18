import { useState } from 'react';
import { Plus, Mail, Phone, Linkedin, Trash2, Edit2, User } from 'lucide-react';
import { addDoc, updateDoc, deleteDoc, doc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Contact } from '../../types/schema';

interface ContactManagerProps {
    companyId: string;
    companyName: string;
    contacts: Contact[];
}

export default function ContactManager({ companyId, companyName, contacts }: ContactManagerProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Contact>>({ type: 'client' });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!formData.firstName || !formData.lastName) {
            alert("First and Last Name are required.");
            return;
        }

        setSaving(true);
        try {
            const contactData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                title: formData.title || '',
                email: formData.email || '',
                phone: formData.phone || '',
                linkedInUrl: formData.linkedInUrl || '',
                type: formData.type || 'client',
                companyId: companyId,
                // We could store companyName if we want denormalization, but relying on ID is cleaner for now
                createdAt: new Date() // Firestore timestamp usually handles this but good for local optimistic
            };

            if (editingId) {
                // Update existing
                // Remove createdAt from update
                const { createdAt, ...updates } = contactData;
                await updateDoc(doc(db, 'contacts', editingId), updates);
            } else {
                // Create new
                await addDoc(collection(db, 'contacts'), {
                    ...contactData,
                    createdAt: new Date()
                });
            }

            setIsAdding(false);
            setEditingId(null);
            setFormData({ type: 'client' });
        } catch (error) {
            console.error("Error saving contact:", error);
            alert("Failed to save contact.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this contact?")) return;
        try {
            await deleteDoc(doc(db, 'contacts', id));
        } catch (error) {
            console.error("Error deleting contact:", error);
        }
    };

    const startEdit = (contact: Contact) => {
        setFormData({
            firstName: contact.firstName,
            lastName: contact.lastName,
            title: contact.title,
            email: contact.email,
            phone: contact.phone,
            linkedInUrl: contact.linkedInUrl,
            type: contact.type
        });
        setEditingId(contact.id);
        setIsAdding(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">People</h3>
                {!isAdding && (
                    <button
                        type="button"
                        onClick={() => { setIsAdding(true); setFormData({ type: 'client' }); setEditingId(null); }}
                        className="text-xs font-bold text-oxford-green hover:underline flex items-center gap-1"
                    >
                        <Plus className="h-3 w-3" /> Add Contact
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            className="w-full p-2 text-sm border border-gray-200 rounded"
                            placeholder="First Name"
                            value={formData.firstName || ''}
                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            autoFocus
                        />
                        <input
                            className="w-full p-2 text-sm border border-gray-200 rounded"
                            placeholder="Last Name"
                            value={formData.lastName || ''}
                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        />
                    </div>

                    <input
                        className="w-full p-2 text-sm border border-gray-200 rounded"
                        placeholder="Title (e.g. VP of Engineering)"
                        value={formData.title || ''}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />

                    <div className="grid grid-cols-2 gap-2">
                        <input
                            className="w-full p-2 text-sm border border-gray-200 rounded"
                            placeholder="Email"
                            value={formData.email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                        <select
                            className="w-full p-2 text-sm border border-gray-200 rounded text-slate-600 bg-white"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                        >
                            <option value="client">Client</option>
                            <option value="hiring_manager">Hiring Manager</option>
                            <option value="vendor">Vendor</option>
                            <option value="influencer">Influencer</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <input
                            className="w-full p-2 text-sm border border-gray-200 rounded"
                            placeholder="Phone (Optional)"
                            value={formData.phone || ''}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                        <input
                            className="w-full p-2 text-sm border border-gray-200 rounded"
                            placeholder="LinkedIn URL (Optional)"
                            value={formData.linkedInUrl || ''}
                            onChange={e => setFormData({ ...formData, linkedInUrl: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => { setIsAdding(false); setEditingId(null); }}
                            className="px-3 py-1 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-3 py-1 text-xs font-bold bg-oxford-green text-white rounded hover:bg-opacity-90"
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : (editingId ? 'Update' : 'Add Person')}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {contacts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                        {contacts.map(contact => (
                            <div key={contact.id} className="group flex items-center gap-4 p-4 border border-slate-100 rounded hover:bg-slate-50 transition-colors relative">
                                {contact.avatar ? (
                                    <img src={contact.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold shrink-0">
                                        {contact.firstName[0]}{contact.lastName[0]}
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="font-bold text-slate-800 text-sm truncate">{contact.firstName} {contact.lastName}</div>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${contact.type === 'client' ? 'bg-orange-50 text-orange-600' :
                                                contact.type === 'hiring_manager' ? 'bg-blue-50 text-blue-600' :
                                                    'bg-slate-100 text-slate-500'
                                            }`}>
                                            {contact.type?.replace('_', ' ')}
                                        </span>
                                    </div>

                                    {/* Horizontal Info Row: Phone | Title | Email */}
                                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                        {contact.phone ? (
                                            <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-slate-700">
                                                <Phone className="h-3 w-3" />
                                                <span className="font-mono">{contact.phone}</span>
                                            </a>
                                        ) : (
                                            <span className="text-slate-300 italic">No Phone</span>
                                        )}

                                        <span className="text-slate-300">•</span>

                                        {contact.title ? (
                                            <span className="font-medium text-slate-600">{contact.title}</span>
                                        ) : (
                                            <span className="text-slate-300 italic">No Title</span>
                                        )}

                                        <span className="text-slate-300">•</span>

                                        {contact.email ? (
                                            <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-slate-700">
                                                <Mail className="h-3 w-3" />
                                                <span>{contact.email}</span>
                                            </a>
                                        ) : (
                                            <span className="text-slate-300 italic">No Email</span>
                                        )}

                                        {contact.linkedInUrl && (
                                            <>
                                                <span className="text-slate-300">•</span>
                                                <a href={contact.linkedInUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800">
                                                    <Linkedin className="h-3 w-3" />
                                                </a>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Edit/Delete Overlay */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    <button
                                        onClick={() => startEdit(contact)}
                                        className="p-1.5 text-gray-400 hover:text-oxford-green hover:bg-white rounded"
                                    >
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(contact.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    !isAdding && <div className="text-center py-12 text-slate-400 italic">No contacts associated with this company.</div>
                )}
            </div>
        </div>
    );
}
