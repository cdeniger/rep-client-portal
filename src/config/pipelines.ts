import type { PipelineDefinition } from '../types/pipeline';

export const PIPELINE_DEFS: Record<string, PipelineDefinition> = {
    sales_v1: {
        id: 'sales_v1',
        label: 'Sales Pipeline',
        category: 'sales',
        stages: [
            {
                id: 'new_lead',
                label: 'New Lead',
                color: 'gray',
                order: 0,
            },
            {
                id: 'enrichment_loop',
                label: 'Enrichment Loop',
                color: 'blue',
                automationTrigger: 'enrich_lead',
                order: 1,
            },
            {
                id: 'qualified_raw',
                label: 'Qualified Raw',
                color: 'purple',
                order: 2,
            },
            {
                id: 'call_scheduled',
                label: 'Call Scheduled',
                color: 'orange',
                order: 3,
            },
            {
                id: 'proposal',
                label: 'Proposal',
                color: 'yellow',
                order: 4,
            },
            {
                id: 'closed_won',
                label: 'Closed Won',
                color: 'green',
                automationTrigger: 'hydrate_client', // Triggers client hydration
                order: 5,
            },
        ],
    },
    delivery_v1: {
        id: 'delivery_v1',
        label: 'Job Pursuit Pipeline',
        category: 'delivery',
        stages: [
            {
                id: 'target_locked',
                label: 'Target Locked',
                color: 'gray',
                order: 0,
            },
            {
                id: 'outreach_execution',
                label: 'Outreach Execution',
                color: 'blue',
                order: 1,
            },
            {
                id: 'engagement',
                label: 'Engagement',
                color: 'purple',
                order: 2,
            },
            {
                id: 'interview_loop',
                label: 'Interview Loop',
                color: 'orange',
                automationTrigger: 'green_room_prep',
                order: 3,
            },
            {
                id: 'offer_pending',
                label: 'Offer Pending',
                color: 'yellow',
                order: 4,
            },

            {
                id: 'placed',
                label: 'Placed',
                color: 'green',
                automationTrigger: 'start_billing', // Triggers billing start
                order: 5,
            },
        ],
    },
};
