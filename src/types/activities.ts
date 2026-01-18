
import { Timestamp } from 'firebase/firestore';

// --- Activity Types ---
export type ActivityType =
    | 'interview'
    | 'stage_change'
    | 'call'
    | 'email'
    | 'note'
    | string; // For Admin-created custom types

// --- Associations ---
export interface ActivityAssociations {
    contactId?: string;
    companyId?: string;
    engagementId?: string;
    targetId?: string; // Links to JobTarget
    pursuitId?: string; // Links to JobPursuit
}

// --- Base Activity ---
export interface BaseActivity {
    id: string;
    ownerId: string; // The Rep/User who created/owns this activity
    createdAt: Timestamp;
    performedAt: Timestamp; // When the activity actually happened
    updatedAt: Timestamp;
    type: ActivityType;
    status: 'completed' | 'scheduled' | 'cancelled';
    notes?: string;
    associations: ActivityAssociations;
}

// --- Specific Activity Interfaces (Discriminated Union) ---

export interface InterviewActivity extends BaseActivity {
    type: 'interview';
    metadata: {
        round: string; // e.g., "Screening", "Technical", "Final"
        interviewers?: string[];
        rating?: number; // 1-5
        location?: string; // "Zoom", "Office", etc.
    };
}

export interface StageChangeActivity extends BaseActivity {
    type: 'stage_change';
    metadata: {
        pipelineKey: string; // "job_search" or "client_origination"
        fromStage: string;
        toStage: string;
    };
}

export interface CallActivity extends BaseActivity {
    type: 'call';
    metadata: {
        outcome?: string; // "Left Voicemail", "Connected", "Gatekeeper"
        durationMinutes?: number;
    };
}

export interface EmailActivity extends BaseActivity {
    type: 'email';
    metadata: {
        subject: string;
        recipientEmail?: string;
        direction: 'inbound' | 'outbound';
    };
}

export interface GenericActivity extends BaseActivity {
    type: string;
    metadata: Record<string, any>; // Flexible for admin-defined fields
}

// The Discriminated Union
export type Activity =
    | InterviewActivity
    | StageChangeActivity
    | CallActivity
    | EmailActivity
    | GenericActivity;


// --- Configuration Types ---

export interface ActivityFieldDefinition {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'boolean' | 'rating';
    required?: boolean;
    options?: string[]; // For 'select' type
    placeholder?: string;
}

export interface ActivityDefinition {
    id: string; // matches ActivityType (e.g., 'call', 'networking_lunch')
    label: string;
    isCore: boolean; // true if hardcoded in system (Zone A), false if fully dynamic
    icon?: string; // Material Icon name
    color?: string; // Hex code
    fields: ActivityFieldDefinition[]; // Zone B fields
}

export interface PipelineStage {
    id: string; // slug
    label: string;
    color: string;
    order: number;
}

export interface PipelineDefinition {
    id: string; // "job_search", "client_origination"
    label: string;
    stages: PipelineStage[];
}
