import type { DiagnosticReport } from '../../../types/schema';

interface MarketFormProps {
    data: DiagnosticReport['pillars']['p3_market'];
    onChange: (data: DiagnosticReport['pillars']['p3_market']) => void;
}

export default function MarketForm({ data, onChange }: MarketFormProps) {

    const handleUpdateSegment = (segmentKey: string, value: any) => {
        onChange({
            ...data,
            segments: {
                ...data.segments,
                [segmentKey]: value
            }
        });
    };

    const options = ['primary', 'secondary', 'monitor', 'deprioritized'];
    const segments = ['early_stage', 'mid_market', 'institutional', 'regulated'];

    return (
        <div className="space-y-6">
            <h3 className="font-bold text-oxford-green text-lg">Market Fit</h3>
            <p className="text-sm text-gray-500">Categorize market segment fit specifically for this client.</p>

            <div className="grid gap-4">
                {segments.map(seg => (
                    <div key={seg} className="bg-white p-4 border border-gray-200 rounded-sm shadow-sm flex items-center justify-between">
                        <div className="font-bold text-oxford-green capitalize">{seg.replace('_', ' ')}</div>
                        <select
                            className="p-2 border border-gray-200 rounded-sm text-sm outline-none w-40 uppercase font-bold text-xs"
                            value={data.segments[seg] || 'monitor'}
                            onChange={e => handleUpdateSegment(seg, e.target.value)}
                        >
                            {options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
}
