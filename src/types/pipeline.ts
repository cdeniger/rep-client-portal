import { Timestamp } from 'firebase/firestore';

// --- Offer Details Interface (Refined) ---
export interface OfferDetails {
    baseSalary: number;
    targetBonus: number | string; // Supports fixed amount or percentage (e.g., "15%")
    equity: string; // e.g., "0.5%" or "10,000 RSUs"
    signOnBonus: number;
    relocation: number;
    status: 'verbal' | 'written' | 'accepted' | 'declined';
}

// --- Base Interfaces ---

export interface PipelineDefinition {
    id: string;
    label: string;
    category: 'sales' | 'delivery';
    stages: Stage[];
}

export interface Stage {
    id: string;
    label: string;
    color: string; // Hex or generic color name
    automationTrigger?: string; // Key for backend automation scripts
}

export interface PipelineItem {
    id: string;
    pipelineId: string;
    stageId: string;
    index: number; // Order within the stage
    createdAt: Timestamp | string;
    updatedAt: Timestamp | string;
}

// --- Polymorphic Item Extensions ---

// 1. Sales Pipeline Item (Lead)
export interface Lead extends PipelineItem {
    type: 'lead'; // Discriminator
    firstName: string;
    lastName: string;
    company: string;
    linkedinUrl: string;
    source: string;
    campaignId?: string;

    // Metrics
    fitScore: number;
    retainerAmount: number;
    estimatedComp: number;
}

// 2. Delivery Pipeline Item (Job Pursuit)
export interface JobPursuit extends PipelineItem {
    type: 'job_pursuit'; // Discriminator
    engagementId: string; // Link to Client
    companyName: string;
    roleTitle: string;

    // Metrics
    dealValue: number;
    interviewRound: string;
    offerDetails?: OfferDetails;
}

// --- Campaign Definition ---
export interface Campaign {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'paused' | 'completed' | 'draft';
}
