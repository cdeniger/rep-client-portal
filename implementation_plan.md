# Implementation Plan - Job Pursuit Pipeline (Client Detail)

## Objective
Implement the "Job Hunt" pipeline visualization within the `ClientDetail` page using the polymorphic `PipelineBoard` architecture.

## Proposed Changes

### 1. Update `src/pages/rep/ClientDetail.tsx`

*   **Import Components**:
    *   `PipelineBoard` from `../../components/pipeline/PipelineBoard`
    *   `JobPursuit` type from `../../types/pipeline`
    *   `Timestamp` from `firebase/firestore` (for mock data)

*   **Create Mock Data (`MOCK_DELIVERY_ITEMS`)**:
    *   Create 3 `JobPursuit` items as requested:
        1.  **CTO @ Stripe**: Stage `interview_loop`, Deal Value $450k, Role "CTO".
        2.  **VP Engineering @ Google**: Stage `target_locked`, Deal Value $520k, Role "VP Engineering".
        3.  **Head of AI @ Anthropic**: Stage `the_shadow`, Deal Value $600k, Role "Head of AI".

*   **UI Updates**:
    *   Locate the existing "Tabs" or "Section" switching logic (Profile, Strategy, etc.).
    *   Add a new Tab/Section option: **"Job Hunt"**.
    *   Render the `PipelineBoard` when this tab is active:
        ```tsx
        <div className="h-[600px] bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
             <PipelineBoard 
                 definitionId="delivery_v1"
                 items={MOCK_DELIVERY_ITEMS}
             />
        </div>
        ```

### 2. Verification
*   **Visual Check**: Verify "Job Hunt" tab appears in Client Detail.
*   **Polymorphic Check**: Confirm cards render "Deal Value" and "Role Title" (JobPursuit schema) instead of Lead metrics.
*   **Stage Check**: Confirm items appear in 'Target Locked', 'Interview Loop', and 'The Shadow'.
