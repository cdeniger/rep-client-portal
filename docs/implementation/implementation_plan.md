# Implementation Plan: Enforce Strict Pipeline Engagement Container

## Problem
Job Pursuits created via the Client Portal are currently "orphaned" from the Engagement container because the client-side `Pipeline` component does not fetch or attach the `engagementId` during creation. This forces the Rep Dashboard to use loose `userId` matching, which violates the strict data model.

## User Objective
Ensure `engagementId` is always the container for `job_pursuits` and enforce this in the Rep Dashboard query.

## Steps

### 1. Fix Creation Logic (`Pipeline.tsx`)
- **Action**: Update `src/pages/Pipeline.tsx` to fetch the current user's active `engagement` on load.
- **Logic**: Use a `useCollection` query to find an engagement where `userId == current_user.uid` and status is one of logic `['active', 'searching', 'negotiating', 'placed']`.
- **Outcome**: When `handleSave` is called, the new `job_pursuit` will include the valid `engagementId`.

### 2. Backfill Existing Data
- **Action**: Create and run a one-off script `src/scripts/fix_orphaned_pursuits.ts`.
- **Logic**:
    1. Scan `job_pursuits` for records missing `engagementId`.
    2. For each, look up the `userId`.
    3. Find the valid Engagement for that user.
    4. Patch the `job_pursuit` with the correct `engagementId`.
- **Outcome**: The existing "Stripe" and "Anthropic" records will be properly containerized.

### 3. Enforce Strict Query (`ClientDetail.tsx`)
- **Action**: Revert the temporary `userId` query in `src/pages/rep/ClientDetail.tsx`.
- **Logic**: Return to `where('engagementId', '==', id)`.
- **Outcome**: The Rep Dashboard will correctly display the data because the data itself is now correct.

## Verification
- Confirm new opportunities created by Alex include `engagementId`.
- Confirm existing opportunities show up in Rep Dashboard under strict filtering.
