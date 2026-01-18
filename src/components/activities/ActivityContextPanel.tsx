import ActivityTimeline from './ActivityTimeline';

interface ActivityContextPanelProps {
    entityType: 'engagement' | 'company' | 'contact' | 'pursuit';
    entityId: string;
    compactMode?: boolean;
}

export default function ActivityContextPanel({ entityType, entityId, compactMode = false }: ActivityContextPanelProps) {
    // Adapter logic: Map entityType to associationType expected by ActivityTimeline
    const getAssociationType = () => {
        switch (entityType) {
            case 'engagement': return 'engagementId';
            case 'company': return 'companyId';
            case 'contact': return 'contactId';
            case 'pursuit': return 'pursuitId';
            default: return 'engagementId';
        }
    };

    const type = getAssociationType();

    // Construct the associationData object dynamically based on known ID
    // Note: In a real scenario, we might want to pass more context if available, 
    // but for now, we simply pass the primary ID. The Modal inside Timeline handles hydration if needed or just logs against this ID.
    const associationData = {
        [type]: entityId
    };

    return (
        <div className={`flex flex-col h-full bg-white ${compactMode ? '' : 'border border-slate-200 rounded-sm shadow-sm overflow-hidden'}`}>
            <div className={`${compactMode ? 'min-h-[400px]' : 'h-[600px]'} flex flex-col`}>
                <ActivityTimeline
                    associationId={entityId}
                    associationType={type}
                    associationData={associationData}
                />
            </div>
        </div>
    );
}
