import { useState } from 'react';
import { Plus, MapPin, Trash2, Edit2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { Company, CompanyLocation } from '../../types/schema';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface LocationManagerProps {
    company: Company;
}

export default function LocationManager({ company }: LocationManagerProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<CompanyLocation>>({});

    const handleSave = async () => {
        if (!formData.nickname) {
            return;
        }

        const newLocation: CompanyLocation = {
            id: editingId || uuidv4(),
            nickname: formData.nickname || '',
            mainPhone: formData.mainPhone || '',
            notes: formData.notes || '',
            address: {
                city: formData.address?.city || '',
                street: formData.address?.street || '',
                state: formData.address?.state || '',
                country: formData.address?.country || '',
                zip: formData.address?.zip || ''
            }
        };

        const currentLocations = company.locations || [];
        let updatedLocations;

        if (editingId) {
            updatedLocations = currentLocations.map(loc => loc.id === editingId ? newLocation : loc);
        } else {
            updatedLocations = [...currentLocations, newLocation];
        }

        try {
            await updateDoc(doc(db, 'companies', company.id), {
                locations: updatedLocations
            });
            setIsAdding(false);
            setEditingId(null);
            setFormData({});
        } catch (error) {
            console.error("Error saving location:", error);
            alert("Failed to save location.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this location?")) return;
        const updatedLocations = (company.locations || []).filter(loc => loc.id !== id);
        try {
            await updateDoc(doc(db, 'companies', company.id), {
                locations: updatedLocations
            });
        } catch (error) {
            console.error("Error deleting location:", error);
        }
    };

    const startEdit = (loc: CompanyLocation) => {
        setFormData(loc);
        setEditingId(loc.id);
        setIsAdding(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Locations</h3>
                {!isAdding && (
                    <button
                        type="button"
                        onClick={() => { setIsAdding(true); setFormData({}); setEditingId(null); }}
                        className="text-xs font-bold text-oxford-green hover:underline flex items-center gap-1"
                    >
                        <Plus className="h-3 w-3" /> Add Location
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-3">
                    <input
                        className="w-full p-2 text-sm border border-gray-200 rounded"
                        placeholder="Nickname (e.g. NYC HQ)"
                        value={formData.nickname || ''}
                        onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                        autoFocus
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            className="w-full p-2 text-sm border border-gray-200 rounded"
                            placeholder="City"
                            value={formData.address?.city || ''}
                            onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } as any })}
                        />
                        <input
                            className="w-full p-2 text-sm border border-gray-200 rounded"
                            placeholder="State"
                            value={formData.address?.state || ''}
                            onChange={e => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } as any })}
                        />
                    </div>
                    <input
                        className="w-full p-2 text-sm border border-gray-200 rounded"
                        placeholder="Street Address (Optional)"
                        value={formData.address?.street || ''}
                        onChange={e => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } as any })}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => { setIsAdding(false); setEditingId(null); }}
                            className="px-3 py-1 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-3 py-1 text-xs font-bold bg-oxford-green text-white rounded hover:bg-opacity-90"
                        >
                            {editingId ? 'Update' : 'Add'}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {company.locations?.map(loc => (
                    <div key={loc.id} className="group flex items-start justify-between p-3 bg-white border border-gray-100 rounded hover:border-gray-300 transition-colors">
                        <div>
                            <div className="font-bold text-sm text-oxford-green flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                {loc.nickname}
                            </div>
                            <div className="text-xs text-gray-500 ml-5">
                                {[loc.address?.street, loc.address?.city, loc.address?.state].filter(Boolean).join(', ')}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => startEdit(loc)}
                                className="p-1 text-gray-400 hover:text-oxford-green"
                            >
                                <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                                onClick={() => handleDelete(loc.id)}
                                className="p-1 text-gray-400 hover:text-red-500"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
