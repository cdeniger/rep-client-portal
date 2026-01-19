import PipelineBoard from '../../components/pipeline/PipelineBoard';
import type { Lead } from '../../types/pipeline';
import { Timestamp } from 'firebase/firestore';

// Mock Timestamp for generic usage since we aren't pulling from Firestore yet
const now = Timestamp.now();

const MOCK_SALES_ITEMS: Lead[] = [
    {
        id: 'lead-1',
        pipelineId: 'sales_v1',
        stageId: 'new_lead',
        type: 'lead',
        index: 0,
        createdAt: now,
        updatedAt: now,
        firstName: 'John',
        lastName: 'Doe',
        company: 'Acme Corp',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        source: 'LinkedIn',
        fitScore: 45,
        retainerAmount: 0,
        estimatedComp: 150000,
    },
    {
        id: 'lead-2',
        pipelineId: 'sales_v1',
        stageId: 'qualified_raw',
        type: 'lead',
        index: 0,
        createdAt: now,
        updatedAt: now,
        firstName: 'Sarah',
        lastName: 'Connor',
        company: 'SkyNet Systems',
        linkedinUrl: 'https://linkedin.com/in/sarahconnor',
        source: 'Referral',
        fitScore: 95, // High fit score test
        retainerAmount: 5000,
        estimatedComp: 220000,
    },
    {
        id: 'lead-3',
        pipelineId: 'sales_v1',
        stageId: 'proposal',
        type: 'lead',
        index: 0,
        createdAt: now,
        updatedAt: now,
        firstName: 'Michael',
        lastName: 'Scott',
        company: 'Dunder Mifflin',
        linkedinUrl: '',
        source: 'Outbound',
        fitScore: 70,
        retainerAmount: 3000,
        estimatedComp: 120000,
    },
    {
        id: 'lead-4',
        pipelineId: 'sales_v1',
        stageId: 'closed_won',
        type: 'lead',
        index: 0,
        createdAt: now,
        updatedAt: now,
        firstName: 'Bruce',
        lastName: 'Wayne',
        company: 'Wayne Enterprises',
        linkedinUrl: 'https://linkedin.com/in/bwayne',
        source: 'Event',
        fitScore: 88,
        retainerAmount: 10000,
        estimatedComp: 500000,
    }
];

export default function SalesPipeline() {
    return (
        <div className="h-full flex flex-col">
            <PipelineBoard
                definitionId="sales_v1"
                items={MOCK_SALES_ITEMS}
            />
        </div>
    );
}
