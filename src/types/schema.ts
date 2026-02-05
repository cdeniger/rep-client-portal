import { Timestamp } from 'firebase/firestore';
// Force HMR refresh

export type UserRole = 'client' | 'rep' | 'admin';

export interface Pod {
    id: string; // pod_1, pod_2
    name: string; // "FinTech", "Enterprise"
    createdAt?: Timestamp;
}

export interface UserProfile {
    uid: string;
    email: string;
    role: UserRole;
    requiresPasswordChange?: boolean; // Enforce password reset on first login
    profile: {
        name: string;
        firstName?: string;
        lastName?: string;
        status: 'searching' | 'negotiating' | 'placed' | 'active';
        podId?: string; // STABLE LINK
        pod: string; // Legacy / Display Name
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
    title?: string;
    email?: string;
    phone?: string;
    linkedInUrl?: string;
    type: 'client' | 'hiring_manager' | 'vendor' | 'influencer';
    avatar?: string;
    companyId?: string; // Link to the 'companies' collection
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
    filters: {
        hardConstraints: {
            minBase: number;
            minTotalComp: number;
            minLevel: number;
            maxCommuteMinutes: number;
            relocationWillingness: boolean;
        };
        softPreferences: {
            preferredIndustries: string[];
            avoidIndustries: string[];
            preferredFunctions: string[];
            workStyle: 'remote' | 'hybrid' | 'onsite';
        };
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



export interface CompanyLocation {
    id: string; // UUID
    nickname: string; // "NYC Midtown"
    address?: {
        street?: string;
        city: string;
        state?: string;
        zip?: string;
        country?: string;
    };
    mainPhone?: string;
    notes?: string;
}

export interface Company {
    id: string; // Auto-generated
    name: string; // "Stripe"
    name_lower: string; // "stripe" for case-insensitive search
    domain?: string; // "stripe.com" (auto-extracted)
    website?: string; // Full URL "https://stripe.com"
    logoUrl?: string;
    linkedInUrl?: string;

    // Classification
    type: 'target' | 'client' | 'vendor' | 'partner'; // Default: 'target'
    status: 'active' | 'inactive'; // Default: 'active'
    industry?: string;

    // Relationship
    accountOwnerId?: string; // Internal Rep User ID
    relationshipNotes?: string;

    createdAt: string;
    locations?: CompanyLocation[];
}

export interface JobTarget {
    id: string;
    company: string;
    locationId?: string; // Links to Company.locations[].id
    role: string;
    status: 'OPEN' | 'CLOSED';
    source: 'radar' | 'manual' | 'network';
    website?: string;
    description?: string;
    createdAt: string;
    financials?: {
        base: number;
        bonus: number;
        equity: string;
        rep_net_value: number;
    };
}

export interface JobPursuit {
    id: string;
    targetId: string;
    userId: string;
    engagementId?: string;
    companyId?: string; // Link to the 'companies' collection
    company: string; // Denormalized for easy display
    role: string;    // Denormalized for easy display
    stageId: 'target_locked' | 'outreach_execution' | 'engagement' | 'interview_loop' | 'offer_pending' | 'placed' | 'closed_lost' | 'closed_by_market';
    stage_detail: string;
    createdAt: string;
    updatedAt: string;
    financials?: { // Overrides target financials
        base: number;
        bonus: number;
        equity: string;
        rep_net_value: number;
    };
    locationId?: string;
}

export interface JobRecommendation {
    id: string;
    engagementId: string;
    targetId: string;
    status: 'pending_rep' | 'pending_client' | 'converted' | 'rejected' | 'deferred';
    source: 'manual' | 'AI';
    rep_notes: string;
    ai_score?: number;
    ai_rationale?: string;
    createdAt: string;
}

export interface Engagement {
    // --- Operational Core (Preserved) ---
    id: string;
    userId: string;
    repId?: string;
    status: 'active' | 'searching' | 'negotiating' | 'placed' | 'paused' | 'alumni';
    startDate?: string;
    isaPercentage?: number;
    monthlyRetainer?: number;
    assets?: Array<{
        name: string;
        url: string;
        type: 'pdf' | 'other';
        uploadedAt: string;
    }>;
    lastActivity?: string;

    // --- Profile: The Identity ---
    profile?: {
        // Legacy/Existing
        firstName?: string;
        lastName?: string;
        headline?: string;
        podId?: string; // STABLE LINK
        pod?: string;
        bio_short?: string;

        // Hydrated from IntakeResponse.profile
        currentTitle?: string;
        currentCompany?: string;
        industry?: string;
        experienceBand?: string;

        // Hydrated from IntakeResponse.marketIdentity
        marketIdentity?: {
            current: string;
            target: string;
            visibilityChannels: string[];
        };

        contactId?: string; // Link to "contacts" collection
    };

    // --- Strategy: The "Soft" Psychology ---
    // Now acts as a complete container for the "Soft" Intake sections
    strategy?: {
        // From IntakeResponse.trajectory
        trajectory?: {
            primaryArc: string;
            secondaryArc?: string;
            successMetrics: string[];
            negativeConstraints: string[];
        };

        // From IntakeResponse.horizon
        horizon?: {
            nextRoleDuration: string;
            payoffTiming: string;
            progressionLens: string;
        };

        // From IntakeResponse.ownership
        ownership?: {
            current: string[];
            nextLevelTarget: string;
            expansionPriority: string;
        };

        // From IntakeResponse.authority
        authority?: {
            currentMode: string;
            targetDomains: string[];
            failureTolerance: string;
        };

        // From IntakeResponse.comp
        comp?: {
            orientation: { primary: string }; // Strictly matched to Intake
            riskPosture: string;
            successSignals: string[];
        };
    };

    // --- Target Parameters: The "Hard" Deal Desk Numbers ---
    targetParameters?: {
        // From IntakeResponse.filters.hardConstraints
        minBase: number;
        minTotalComp: number;
        minLevel: number;
        maxCommuteMinutes: number;
        relocationWillingness: boolean;

        // From IntakeResponse.filters.softPreferences
        preferredIndustries: string[];
        avoidIndustries: string[];
        preferredFunctions: string[];
        workStyle: 'remote' | 'hybrid' | 'onsite';
    };
}

export interface Application {
    id: string; // Document ID
    fullName: string;
    email: string;
    phone?: string;
    linkedinUrl?: string;

    // Professional
    currentSalary?: string;
    targetComp?: string;
    experience?: string;
    employmentStatus?: string;
    resumeUrl?: string;

    // Motivation
    primaryMotivation?: string;
    idealTarget?: string;
    pipelineVelocity?: string;

    // Metadata
    status: 'new' | 'contacted' | 'archived';
    submittedAt: Timestamp;
}

export interface AtsScorecardLayer {
    score: number;
    flags: string[];
    description: string;
}

export interface AtsSimulation {
    id: string;
    userId?: string; // Optional for "Origination Hook" mode
    applicationId?: string; // Optional link to specific application
    jobPursuitId?: string; // Link to specific Job Pursuit for "Fine Tuning"

    // Inputs
    targetRoleRaw: string; // The Job Description
    resumeTextRaw: string; // The extracted text

    // The "Ugly Truth" (Parser Reality)
    parserView: {
        extractedName: string | null;
        extractedEmail: string | null;
        extractedPhone: string | null;
        extractedSkills: string[];
        // The "Fracture Test" - raw unformatted text dump
        rawTextDump: string;
        parsingConfidenceScore: number; // 0-100
    };

    // The logic Layers
    scorecard: {
        overallScore: number; // 0-100
        layers: {
            shadow_schema: AtsScorecardLayer;
            matrix_filtering: AtsScorecardLayer;
            version_control: AtsScorecardLayer;
            content_context: AtsScorecardLayer;
            compliance_gating: AtsScorecardLayer;
        };
        // Specific "Knock-out" issues that act as binary gates
        criticalFailures: string[];
    };

    createdAt: Timestamp;
}
