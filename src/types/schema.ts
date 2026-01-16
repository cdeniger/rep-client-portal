import { Timestamp } from 'firebase/firestore';
// Force HMR refresh

export type UserRole = 'client' | 'rep' | 'admin';

export interface UserProfile {
    uid: string;
    email: string;
    role: UserRole;
    profile: {
        name: string;
        firstName?: string;
        lastName?: string;
        status: 'searching' | 'negotiating' | 'placed';
        pod: string;
        headline: string;
        bio_long: string;
        bio_short: string;
        pitch: string;
        repId?: string; // Link to the Rep who manages this client
        contactId?: string; // Link to the Golden Source Contact Record
    };
}

export interface Contact {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    linkedInUrl?: string;
    createdAt: Timestamp;
}

export interface IntakeResponse {
    id: string;
    userId: string;
    status: 'draft' | 'completed';
    profile: {
        currentTitle: string;
        currentCompany: string;
        industry: string;
        experienceBand: string;
    };
    trajectory: {
        primaryArc: string;
        secondaryArc?: string;
        successMetrics: string[];
        negativeConstraints: string[];
    };
    horizon: {
        nextRoleDuration: string;
        payoffTiming: string;
        progressionLens: string;
    };
    ownership: {
        current: string[];
        nextLevelTarget: string;
        expansionPriority: string;
    };
    authority: {
        currentMode: string;
        targetDomains: string[];
        failureTolerance: string;
    };
    comp: {
        orientation: { primary: string };
        riskPosture: string;
        successSignals: string[];
    };
    marketIdentity: {
        current: string;
        target: string;
        visibilityChannels: string[];
    };
    assets: {
        linkedinUrl: string;
        resumeFile?: string;
        uploadedAt?: Timestamp;
    };
}

// Placeholder for full Diagnostic Report types if needed
export interface DiagnosticReport {
    id: string;
    userId: string;
    intakeId: string;
    status: 'generating' | 'review_required' | 'published';
    meta: {
        generatedAt: Timestamp;
        rep_reviewer_id?: string;
    };
    pillars: {
        p1_identity: {
            market_reads: { title: string; current_read: string; target_read: string; interpretation: string }[];
        };
        p2_capital: {
            patterns: { pattern: string; market_sees: string; market_misses: string; rep_clarification: string }[];
            scope_dial: number; // 0-100
        };
        p3_market: {
            segments: Record<string, 'primary' | 'secondary' | 'monitor' | 'deprioritized'>;
        };
        p4_assets: {
            signals: { title: string; asset_score: number; rep_target_score: number; status_label: string }[];
            evidence: { section: string; current_signal: string; what_must_change: string; before_snippet: string; after_snippet: string }[];
        };
        p5_pipeline: {
            channels: { name: string; status: string; best_for: string; tradeoffs: string }[];
            dimensions: { intensity: string; urgency_fit: string; access_path: string };
        };
        p6_comp: {
            trajectory: { horizon: string; range: string; level: string; focus: string }[];
            tradeoffs: { criterion: string; preference: string; market_interaction: string; flag_label: string }[];
        };
        p7_architecture: {
            dashboard: { dimension: string; current_state: string; target_state: string; status: string; progress_pct: number; next_moves: string[] }[];
        };
    };
}

export interface Opportunity {
    id: string;
    userId?: string; // Optional: If null/undefined, it is "Unassigned" (Inventory)
    company: string;
    role: string;
    status: 'outreach' | 'interviewing' | 'offer' | 'negotiating';
    stage_detail: string;
    source: 'manual' | 'radar' | 'network';
    financials?: {
        base: number;
        bonus: number;
        equity: string;
        rep_net_value: number;
    };
}

export interface Engagement {
    id: string;
    userId: string;
    repId?: string;
    status: 'active' | 'searching' | 'negotiating' | 'placed' | 'paused' | 'alumni';
    startDate?: string;
    isaPercentage?: number;
    profile?: {
        firstName?: string;
        lastName?: string;
        headline?: string;
        pod?: string;
        bio_short?: string;
    };
    assets?: Array<{
        name: string;
        url: string;
        type: 'pdf' | 'other';
        uploadedAt: string;
    }>;
    searchCriteria?: {
        minBase?: number;
        targetTotal?: number;
        minLevel?: number;
        primaryFunction?: string;
        locationType?: string;
        targetLocations?: string[];
        excludedIndustries?: string[];
        minEquity?: string;
        dealStructure?: string;
    };
}
