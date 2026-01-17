import { X, Building2, Globe } from 'lucide-react';
import type { Company } from '../../types/schema';
import LocationManager from './LocationManager';

interface CompanyDrawerProps {
    company: Company | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function CompanyDrawer({ company, isOpen, onClose }: CompanyDrawerProps) {
    if (!company) return null;

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
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Company Details</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200/50 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto h-[calc(100vh-64px)]">

                    {/* Identity Header */}
                    <div className="flex items-start gap-4 mb-8">
                        <div className="h-14 w-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                            {company.logoUrl ? (
                                <img src={company.logoUrl} alt={company.name} className="h-full w-full object-contain rounded-lg" />
                            ) : (
                                <Building2 className="h-6 w-6" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-oxford-green mb-1">{company.name}</h1>
                            {company.domain && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Globe className="h-3 w-3" />
                                    <span>{company.domain}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <LocationManager company={company} />
                    </div>

                </div>
            </div>
        </>
    );
}
