import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase'; // Ensure this points to your initialized functions instance
import { X, Check, ArrowRight, Loader2, Copy } from 'lucide-react';

interface CreateClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface FormData {
    // Identity
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    // Operations
    pod: string;
    monthlyRetainer: string;
    isaPercentage: string;
    startDate: string;
}

const INITIAL_DATA: FormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: { street: '', city: '', state: '', zip: '', country: '' },
    pod: 'Tech',
    monthlyRetainer: '5000',
    isaPercentage: '15',
    startDate: new Date().toISOString().split('T')[0]
};

const POD_OPTIONS = ['Tech', 'Finance', 'Healthcare', 'Legal', 'Sales', 'Marketing', 'Executive'];

export default function CreateClientModal({ isOpen, onClose, onSuccess }: CreateClientModalProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [data, setData] = useState<FormData>(INITIAL_DATA);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ tempPassword: string; clientId: string } | null>(null);

    if (!isOpen) return null;

    const updateData = (updates: Partial<FormData>) => setData(prev => ({ ...prev, ...updates }));
    const updateAddress = (updates: Partial<FormData['address']>) => setData(prev => ({ ...prev, address: { ...prev.address, ...updates } }));

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const provisionClient = httpsCallable(functions, 'provisionClient');
            const response = await provisionClient({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                pod: data.pod,
                monthlyRetainer: Number(data.monthlyRetainer),
                isaPercentage: Number(data.isaPercentage),
                startDate: data.startDate
            });

            const resData = response.data as any;
            if (resData.success) {
                setResult({
                    tempPassword: resData.tempPassword,
                    clientId: resData.clientId
                });
            } else {
                setError('Unknown error occurred.');
            }
        } catch (err: any) {
            console.error("Provisioning Error:", err);
            setError(err.message || 'Failed to provision client.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (result?.tempPassword) {
            navigator.clipboard.writeText(result.tempPassword);
            // Could add toast here
        }
    };

    // Success View
    if (result) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                    <div className="p-6 text-center">
                        <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Client Provisioned!</h2>
                        <p className="text-sm text-slate-500 mb-6">
                            The client <strong>{data.firstName} {data.lastName}</strong> has been successfully created.
                        </p>

                        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 text-left">
                            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
                                Temporary Password
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-white border border-amber-200 px-3 py-2 rounded text-lg font-mono text-slate-700">
                                    {result.tempPassword}
                                </code>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2 hover:bg-amber-100 rounded text-amber-700 transition-colors"
                                    title="Copy Password"
                                >
                                    <Copy className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="text-[10px] text-amber-700 mt-2 leading-relaxed">
                                <strong>IMPORTANT:</strong> This password is only shown once. Copy it now and send it to the client securely. They will be asked to change it upon login.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                onSuccess?.();
                                onClose();
                            }}
                            className="w-full py-2.5 bg-slate-900 text-white font-bold rounded hover:bg-slate-800 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Add New Client</h2>
                        <p className="text-xs text-slate-500 flex gap-2 mt-0.5">
                            <span className={step === 1 ? "text-oxford-green font-bold" : "text-slate-400"}>1. Identity</span>
                            <span className="text-slate-300">&bull;</span>
                            <span className={step === 2 ? "text-oxford-green font-bold" : "text-slate-400"}>2. Operations</span>
                            <span className="text-slate-300">&bull;</span>
                            <span className={step === 3 ? "text-oxford-green font-bold" : "text-slate-400"}>3. Review</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-oxford-green focus:outline-none"
                                        value={data.firstName}
                                        onChange={e => updateData({ firstName: e.target.value })}
                                        placeholder="Jane"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-oxford-green focus:outline-none"
                                        value={data.lastName}
                                        onChange={e => updateData({ lastName: e.target.value })}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                                <input
                                    type="email"
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-oxford-green focus:outline-none"
                                    value={data.email}
                                    onChange={e => updateData({ email: e.target.value })}
                                    placeholder="jane.doe@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone</label>
                                <input
                                    type="tel"
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-oxford-green focus:outline-none"
                                    value={data.phone}
                                    onChange={e => updateData({ phone: e.target.value })}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                            <div className="border-t border-slate-100 pt-4 mt-2">
                                <label className="block text-xs font-bold text-slate-700 mb-2">Address (Optional)</label>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-oxford-green focus:outline-none"
                                        value={data.address.street}
                                        onChange={e => updateAddress({ street: e.target.value })}
                                        placeholder="Street Address"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-oxford-green focus:outline-none"
                                            value={data.address.city}
                                            onChange={e => updateAddress({ city: e.target.value })}
                                            placeholder="City"
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-oxford-green focus:outline-none"
                                                value={data.address.state}
                                                onChange={e => updateAddress({ state: e.target.value })}
                                                placeholder="State"
                                            />
                                            <input
                                                type="text"
                                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-oxford-green focus:outline-none"
                                                value={data.address.zip}
                                                onChange={e => updateAddress({ zip: e.target.value })}
                                                placeholder="Zip"
                                            />
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-oxford-green focus:outline-none"
                                        value={data.address.country}
                                        onChange={e => updateAddress({ country: e.target.value })}
                                        placeholder="Country"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Industry Pod *</label>
                                <select
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-oxford-green focus:outline-none"
                                    value={data.pod}
                                    onChange={e => updateData({ pod: e.target.value })}
                                >
                                    {POD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Retainer ($)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                        <input
                                            type="number"
                                            className="w-full border border-slate-300 rounded pl-7 pr-3 py-2 text-sm focus:border-oxford-green focus:outline-none"
                                            value={data.monthlyRetainer}
                                            onChange={e => updateData({ monthlyRetainer: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">ISA Percentage (%)</label>
                                    <div className="relative">
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-oxford-green focus:outline-none"
                                            value={data.isaPercentage}
                                            onChange={e => updateData({ isaPercentage: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Engagement Start Date *</label>
                                <input
                                    type="date"
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-oxford-green focus:outline-none"
                                    value={data.startDate}
                                    onChange={e => updateData({ startDate: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 border border-slate-200 rounded p-4 text-sm">
                                <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Review Details</h3>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                                    <dt className="text-slate-500 text-xs uppercase">Client</dt>
                                    <dd className="font-medium text-slate-800">{data.firstName} {data.lastName}</dd>

                                    <dt className="text-slate-500 text-xs uppercase">Email</dt>
                                    <dd className="font-medium text-slate-800 break-all">{data.email}</dd>

                                    <dt className="text-slate-500 text-xs uppercase">Pod</dt>
                                    <dd className="font-medium text-slate-800">{data.pod}</dd>

                                    <dt className="text-slate-500 text-xs uppercase">Start Date</dt>
                                    <dd className="font-medium text-slate-800">{data.startDate}</dd>

                                    <dt className="text-slate-500 text-xs uppercase">Retainer</dt>
                                    <dd className="font-medium text-slate-800">${Number(data.monthlyRetainer).toLocaleString()}/mo</dd>

                                    <dt className="text-slate-500 text-xs uppercase">ISA</dt>
                                    <dd className="font-medium text-slate-800">{data.isaPercentage}%</dd>
                                </dl>
                            </div>
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                                    <strong>Error:</strong> {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between rounded-b-lg">
                    {step > 1 ? (
                        <button
                            onClick={() => setStep(prev => prev - 1 as any)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                            disabled={loading}
                        >
                            Back
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {step < 3 ? (
                        <button
                            onClick={() => {
                                if (step === 1) {
                                    if (!data.firstName || !data.lastName || !data.email) return; // Simple validation
                                }
                                setStep(prev => prev + 1 as any);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-oxford-green text-white text-sm font-bold rounded hover:bg-opacity-90 transition-opacity"
                        >
                            Next <ArrowRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-oxford-green text-white text-sm font-bold rounded hover:bg-opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {loading ? 'Provisioning...' : 'Provision Client'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
