import { Timestamp } from 'firebase-admin/firestore';

export interface AtsScorecardLayer {
    score: number;
    flags: string[];
    description: string;
}

export interface AtsSimulation {
    id: string;
    userId?: string;
    applicationId?: string;
    jobPursuitId?: string;

    // Inputs
    targetRoleRaw: string;
    resumeTextRaw: string;

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
