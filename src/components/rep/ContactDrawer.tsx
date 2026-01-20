import { useState, useEffect } from 'react';
import { X, Mail, Phone, Linkedin, Building2, Calendar, User, Edit2, Save, Trash2 } from 'lucide-react';
import { doc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Contact, Company } from '../../types/schema';

interface ContactDrawerProps {
    contact: Contact | null;
    company?: Company;
    isOpen: boolean;
    onClose: () => void;
}

export default function ContactDrawer({ contact, company, isOpen, onClose }: ContactDrawerProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Contact>>({});
    const [saving, setSaving] = useState(false);

    const isCreateMode = !contact;

    // Reset state when contact changes or drawer opens
    useEffect(() => {
        if (contact) {
            setFormData({
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                phone: contact.phone,
                linkedInUrl: contact.linkedInUrl,
                type: contact.type
            });
            setIsEditing(false);
        } else if (isOpen) {
            // Create Mode
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                linkedInUrl: '',
                type: 'client'
            });
            setIsEditing(true);
        }
    }, [contact, isOpen]);

    // if (!contact) return null; // Logic handled by isOpen now

    const handleSave = async () => {
        setSaving(true);
        // Sanitize data: Firestore rejects 'undefined' values
        const updates = Object.fromEntries(
            Object.entries(formData).filter(([_, v]) => v !== undefined)
        );

        try {
            if (isCreateMode) {
                await addDoc(collection(db, 'contacts'), {
                    ...updates,
                    createdAt: serverTimestamp()
                });
                onClose();
            } else if (contact?.id) {
                await updateDoc(doc(db, 'contacts', contact.id), updates);
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Error saving contact:", error);
            alert("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!contact?.id) return;
        if (!window.confirm("Are you sure you want to delete this contact? This cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, 'contacts', contact.id));
            onClose();
        } catch (error) {
            console.error("Error deleting contact:", error);
            alert("Failed to delete contact.");
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div className={`fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">
                            {isCreateMode ? 'New Contact' : isEditing ? 'Editing Contact' : 'Contact Details'}
                        </h2>
                        {!isCreateMode && isEditing && (
                            <button
                                onClick={handleDelete}
                                className="text-red-400 hover:text-red-600 transition-colors p-1"
                                title="Delete Contact"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {isEditing || isCreateMode ? (
                            <>
                                {!isCreateMode && (
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    className="bg-oxford-green text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-sm hover:bg-oxford-green/90 transition-all flex items-center gap-1.5"
                                    disabled={saving}
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-md text-xs font-bold shadow-sm hover:border-gray-300 hover:text-gray-800 transition-all flex items-center gap-1.5"
                                >
                                    <Edit2 className="h-3.5 w-3.5" /> Edit
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-200/50 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto h-[calc(100vh-64px)]">

                    {/* Identity Header */}
                    <div className="flex items-start gap-5 mb-8">
                        <div className="h-16 w-16 rounded-full bg-oxford-green text-white flex items-center justify-center text-xl font-bold shrink-0">
                            {(!isCreateMode && contact?.avatar) ? (
                                <img src={contact.avatar} alt={contact.firstName} className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <span>{(formData.firstName?.[0] || '?')}{(formData.lastName?.[0] || '?')}</span>
                            )}
                        </div>
                        <div className="flex-1">
                            {isEditing ? (
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={formData.firstName || ''}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded text-sm font-bold text-oxford-green focus:ring-1 focus:ring-oxford-green focus:border-oxford-green"
                                        placeholder="First Name"
                                    />
                                    <input
                                        type="text"
                                        value={formData.lastName || ''}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded text-sm font-bold text-oxford-green focus:ring-1 focus:ring-oxford-green focus:border-oxford-green"
                                        placeholder="Last Name"
                                    />
                                </div>
                            ) : (
                                <h1 className="text-2xl font-bold text-oxford-green mb-1">
                                    {contact?.firstName} {contact?.lastName}
                                </h1>
                            )}

                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                {isEditing ? (
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as Contact['type'] })}
                                        className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded p-1 focus:ring-oxford-green focus:border-oxford-green"
                                    >
                                        <option value="client">Client</option>
                                        <option value="hiring_manager">Hiring Manager</option>
                                        <option value="vendor">Vendor</option>
                                        <option value="influencer">Influencer</option>
                                    </select>
                                ) : (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${contact?.type === 'client' ? 'bg-signal-orange/10 text-signal-orange border-signal-orange/20' :
                                        contact?.type === 'hiring_manager' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                            'bg-gray-100 text-gray-600 border-gray-200'
                                        }`}>
                                        {contact?.type?.replace('_', ' ') || 'Unknown'}
                                    </span>
                                )}

                                {company && (
                                    <span className="flex items-center gap-1">
                                        at <Building2 className="h-3 w-3" /> <span className="font-semibold text-oxford-green">{company.name}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions / Contact Info */}
                    <div className="grid grid-cols-1 gap-4 mb-8">
                        {/* Email */}
                        <div className={`p-4 rounded-lg border ${isEditing ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'} flex items-center gap-4 transition-colors`}>
                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                                <Mail className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Email Address</div>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-transparent border-b border-gray-300 focus:border-oxford-green focus:ring-0 px-0 py-0.5 text-sm font-medium text-oxford-green placeholder:text-gray-300"
                                        placeholder="email@example.com"
                                    />
                                ) : (
                                    <div className="text-sm font-medium text-oxford-green truncate">{contact?.email || '--'}</div>
                                )}
                            </div>
                        </div>

                        {/* Phone */}
                        <div className={`p-4 rounded-lg border ${isEditing ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'} flex items-center gap-4 transition-colors`}>
                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                                <Phone className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Phone</div>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={formData.phone || ''}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-transparent border-b border-gray-300 focus:border-oxford-green focus:ring-0 px-0 py-0.5 text-sm font-medium text-oxford-green placeholder:text-gray-300"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                ) : (
                                    <div className="text-sm font-medium text-oxford-green truncate">{contact?.phone || '--'}</div>
                                )}
                            </div>
                        </div>

                        {/* LinkedIn */}
                        <div className={`p-4 rounded-lg border ${isEditing ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'} flex items-center gap-4 transition-colors`}>
                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                                <Linkedin className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">LinkedIn</div>
                                {isEditing ? (
                                    <input
                                        type="url"
                                        value={formData.linkedInUrl || ''}
                                        onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
                                        className="w-full bg-transparent border-b border-gray-300 focus:border-oxford-green focus:ring-0 px-0 py-0.5 text-sm font-medium text-oxford-green placeholder:text-gray-300"
                                        placeholder="https://linkedin.com/in/..."
                                    />
                                ) : (
                                    <div className="text-sm font-medium text-oxford-green truncate">
                                        {contact?.linkedInUrl ? (
                                            <a href={contact.linkedInUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">
                                                View Profile
                                            </a>
                                        ) : '--'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="border-t border-gray-100 pt-6">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                            <span className="flex items-center gap-2"><Calendar className="h-3 w-3" /> Added</span>
                            <span>{contact?.createdAt && typeof contact.createdAt.toDate === 'function' ? contact.createdAt.toDate().toLocaleDateString() : 'New Contact'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                            <span className="flex items-center gap-2"><User className="h-3 w-3" /> ID</span>
                            <span className="font-mono">{contact?.id ? contact.id.slice(0, 8) + '...' : 'Generating...'}</span>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
