# Rep. Signal-Audit™ ATS Simulator: Forensic Engine

> **Service Location**: `functions/src/services/ats/simulateAts.ts`
> **Primary Trigger**: `runAtsSimulation` (Cloud Function)

## 🕵️‍♂️ Forensic Philosophy
This engine is NOT a standard "Resume Matcher". It is a **Forensic Auditor**.
Its purpose is to simulate the *hostile* environment of an Enterprise ATS (e.g., Workday, Taleo) and expose the "Shadow Schema"—the invisible failures that reject candidates before a human ever sees them.

**Core Principles:**
1.  **The Ugly Truth**: We use `pdf-parse` to extract raw text exactly as a machine sees it (often broken, scrambled, or missing). We show this raw text to the user to prove parsing fragility.
2.  **Deterministic + Semantic**: We combine Regex (Binary Pass/Fail) for compliance with LLM (Nuanced Understanding) for context.
3.  **Crash Proof**: The system assumes input is garbage and fails safely (defaulting to 0 instead of crashing).

---

## 🧠 Logic Layers (The Scorecard)

The engine evaluates every resume against 5 distinct layers:

### 1. Shadow Schema (Hidden Deal-breakers)
*   **Goal**: Detect missing "Private Fields" often used to silently filter candidates.
*   **Checks**: Salary Expectations, Relocation Willingness, Visa Status.
*   **Logic**: AI Analysis.
*   **Failure**: "Critical Signal Gap".

### 2. Matrix Filtering (Signal Locking)
*   **Goal**: Verify if the resume explicitly links the Target Role to the Target Location.
*   **Checks**: Does "Product Manager" appear near "London" (or the Target City)?
*   **Logic**: AI Analysis.
*   **Failure**: "Location Signal Weak".

### 3. Signal Freshness (Version Control)
*   **Goal**: Determine if the resume is generic or targeted for *this specific pursuit*.
*   **Checks**: Objective statement alignment, recent experience relevance.
*   **Logic**: AI Analysis.
*   **Failure**: "Generic/Stagnant Signal".

### 4. Context Audit (Cultural Fit)
*   **Goal**: Scan for "Soft Signal" keywords outside the skills list.
*   **Checks**: Mission alignment, leadership philosophy, cultural keywords.
*   **Logic**: AI Analysis.
*   **Failure**: "Cultural Mismatch".

### 5. Compliance Firewall (Syntax)
*   **Goal**: Rigid enforcement of data standards.
*   **Checks**:
    *   **Dates**: Must be `MM/dd/yyyy`.
    *   **Bad Patterns**: `Jan '22`, `1999` (Ambiguous).
*   **Logic**: **Deterministic Regex**.
*   **Failure**: "CRITICAL SYNTAX ERROR".

---

## 🔌 Integration Guide (How to Reuse)

The `simulateAts` function is designed for modular reuse. You can call it from any Cloud Function or Backend Service.

### Input Interface (`SimulationInput`)

```typescript
export interface SimulationInput {
    // 1. The Candidate Data (Provide ONE)
    resumeUrl?: string;       // Preferred: Public/Signed URL to PDF
    resumeBuffer?: Buffer;    // Backend: Raw File Buffer
    resumeText?: string;      // Fallback: Pasted Text

    // 2. The Benchmark
    targetRoleRaw: string;    // EITHER: A Role Title ("VP Sales") OR Full JD Text.
    targetComp?: string;      // Optional: Context for Platinum JD Generation (e.g. "$300k")

    // 3. Metadata (Optional)
    userId?: string;
    applicationId?: string;
    jobPursuitId?: string;
}
```

### Usage Pattern 1: Forensic Audit (Current)
*   **Input**: `resumeUrl` (from Application), `targetRoleRaw` (Role Title).
*   **Behavior**: System generates a "Platinum JD" for the title and audits the resume against it.

### Usage Pattern 2: Client Fit Analysis (Future)
*   **Input**: `resumeBuffer` (Client Upload), `targetRoleRaw` (Actual Job Description Text).
*   **Behavior**: System skips Platinum Generation (since JD length > 200 chars) and audits the resume against the *real* JD requirements.

---

## 📊 Output Schema (`AtsSimulation`)

The service returns a strongly-typed `AtsSimulation` object.

*   `parserView`:
    *   `rawTextDump`: The "Ugly Truth" string.
    *   `parsingConfidenceScore`: **Deterministic** (Name+Email+Phone+Skills = 100%).
*   `scorecard`:
    *   `overallScore`: Weighted 0-100.
    *   `layers`: Detailed breakdown of each check.
    *   `criticalFailures`: Array of specific "Knock-out" messages (e.g., "Missing Visa Status").

## 🛡️ Safety Mechanisms
1.  **Strict Validation**: `validateAiResult` ensures AI JSON is perfect. if AI fails, returns default "Missing" flags (Score: 0).
2.  **Universal PDF Parser**: Handles both `pdf-parse` v1 and v2 libraries automatically.
3.  **Prompt Lock**: The AI prompt is frozen to a "Pre-Polish" state to guarantee JSON structure stability.
