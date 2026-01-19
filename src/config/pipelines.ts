import type { PipelineDefinition } from '../types/pipeline';

export const PIPELINE_DEFS: Record<string, PipelineDefinition> = {
    sales_v1: {
        id: 'sales_v1',
        label: 'Sales Pipeline',
        stages: [
            {
                id: 'new_lead',
                label: 'New Lead',
                color: 'gray',
            },
            {
                id: 'enrichment_loop',
                label: 'Enrichment Loop',
                color: 'blue',
                automationTrigger: 'enrich_lead',
            },
            {
                id: 'qualified_raw',
                label: 'Qualified Raw',
                color: 'purple',
            },
            {
                id: 'call_scheduled',
                label: 'Call Scheduled',
                color: 'orange',
            },
            {
                id: 'proposal',
                label: 'Proposal',
                color: 'yellow',
            },
            {
                id: 'closed_won',
                label: 'Closed Won',
                color: 'green',
                automationTrigger: 'hydrate_client', // Triggers client hydration
            },
        ],
    },
    delivery_v1: {
        id: 'delivery_v1',
        label: 'Delivery Pipeline',
        stages: [
            {
                id: 'target_locked',
                label: 'Target Locked',
                color: 'gray',
            },
            {
                id: 'outreach_execution',
                label: 'Outreach Execution',
                color: 'blue',
            },
            {
                id: 'engagement',
                label: 'Engagement',
                color: 'purple',
            },
            {
                id: 'interview_loop',
                label: 'Interview Loop',
                color: 'orange',
                automationTrigger: 'green_room_prep',
            },
            {
                id: 'offer_pending',
                label: 'Offer Pending',
                color: 'yellow',
            },
            {
                id: 'the_shadow',
                label: 'The Shadow',
                color: 'darkred',
            },
            {
                id: 'placed',
                label: 'Placed',
                color: 'green',
                automationTrigger: 'start_billing', // Triggers billing start
            },
        ],
    },
};
