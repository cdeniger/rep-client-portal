import { useState } from 'react';
import type { DiagnosticReport } from '../../types/schema';
import IdentityForm from './pillars/IdentityForm';
import CapitalForm from './pillars/CapitalForm';
import MarketForm from './pillars/MarketForm';
import AssetsForm from './pillars/AssetsForm';
import PipelineForm from './pillars/PipelineForm';
import CompForm from './pillars/CompForm';
import ArchForm from './pillars/ArchForm';

interface DiagnosticFormProps {
    initialData: DiagnosticReport;
    onSubmit: (data: Partial<DiagnosticReport>) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

type Tab = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7';

export default function DiagnosticForm({ initialData, onSubmit, onCancel, isSubmitting }: DiagnosticFormProps) {
    const [activeTab, setActiveTab] = useState<Tab>('p1');
    const [reportData, setReportData] = useState<DiagnosticReport>(initialData);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(reportData);
    };

    const handlePillarUpdate = (pillarKey: keyof DiagnosticReport['pillars'], data: any) => {
        setReportData(prev => ({
            ...prev,
            pillars: {
                ...prev.pillars,
                [pillarKey]: data
            }
        }));
    };

    const tabs: { id: Tab; label: string }[] = [
        { id: 'p1', label: '1. Identity' },
        { id: 'p2', label: '2. Capital' },
        { id: 'p3', label: '3. Market' },
        { id: 'p4', label: '4. Assets' },
        { id: 'p5', label: '5. Pipeline' },
        { id: 'p6', label: '6. Comp' },
        { id: 'p7', label: '7. Arch' },
    ];

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-[80vh]">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        type="button"
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id
                                ? 'border-signal-orange text-oxford-green'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {activeTab === 'p1' && (
                    <IdentityForm
                        data={reportData.pillars.p1_identity}
                        onChange={(d) => handlePillarUpdate('p1_identity', d)}
                    />
                )}
                {activeTab === 'p2' && (
                    <CapitalForm
                        data={reportData.pillars.p2_capital}
                        onChange={(d) => handlePillarUpdate('p2_capital', d)}
                    />
                )}
                {activeTab === 'p3' && (
                    <MarketForm
                        data={reportData.pillars.p3_market}
                        onChange={(d) => handlePillarUpdate('p3_market', d)}
                    />
                )}
                {activeTab === 'p4' && (
                    <AssetsForm
                        data={reportData.pillars.p4_assets}
                        onChange={(d) => handlePillarUpdate('p4_assets', d)}
                    />
                )}
                {activeTab === 'p5' && (
                    <PipelineForm
                        data={reportData.pillars.p5_pipeline}
                        onChange={(d) => handlePillarUpdate('p5_pipeline', d)}
                    />
                )}
                {activeTab === 'p6' && (
                    <CompForm
                        data={reportData.pillars.p6_comp}
                        onChange={(d) => handlePillarUpdate('p6_comp', d)}
                    />
                )}
                {activeTab === 'p7' && (
                    <ArchForm
                        data={reportData.pillars.p7_architecture}
                        onChange={(d) => handlePillarUpdate('p7_architecture', d)}
                    />
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 bg-white flex gap-3">
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
                    {isSubmitting ? 'Update Report' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}
