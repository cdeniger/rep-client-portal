# Implementation Plan - Client Detail "Control Center" Refactor

## Objective
Refactor `src/pages/rep/ClientDetail.tsx` into a high-density "Heads Up Display" layout, consolidating metrics, parameters, and the pipeline board into a single main view ("Overview") and moving the activity timeline to a separate tab ("History").

## Proposed Changes

### 1. Layout Restructuring (`src/pages/rep/ClientDetail.tsx`)

*   **Remove Existing Grid**: Remove the top-level `grid-cols-1 lg:grid-cols-3` layout that splits the page into Main Content vs Sidebar.
*   **New "Header" Section (Top)**:
    *   Implement a 12-column grid container (`grid grid-cols-12 gap-6`).
    *   **Metrics Area (Cols 1-8)**: A wrapper div (`col-span-12 lg:col-span-8`).
        *   Inside this wrapper, create a sub-grid: `grid grid-cols-2 gap-4` containing 8 tiles.
        *   **Row 1**: Time in Process | Client Assets (Condensed)
        *   **Row 2**: Projected ISA | Activity Nexus (Mock)
        *   **Row 3**: Avg Opp. Comp | Pipeline Pulse (Mock)
        *   **Row 4**: Last Touch | Stalled Alerts (Mock)
    *   **Parameters Area (Cols 9-12)**: A wrapper div (`col-span-12 lg:col-span-4 flex flex-col`).
        *   Render `<DealCard />` here.
        *   **Constraint**: container must allow `DealCard` to be `h-full` to match the metrics grid height.

### 2. Tab Architecture Update
*   **State**: Update `activeTab` to allow `'overview' | 'history'`. Default to `'overview'`.
*   **"Overview" Tab Content**:
    *   Renders the **Header Section** (Metrics + DealCard).
    *   Renders the `<PipelineBoard />` immediately below, consuming full width.
*   **"History" Tab Content**:
    *   Renders `<ActivityContextPanel />` (moved from the old right sidebar).

### 3. Mock Components & Data
*   Create inline mock components or render logic for the new requested cards:
    *   **Activity Nexus**: "Next: Strategy Call" button.
    *   **Pipeline Pulse**: "3 Active / 1 Offer" stat display.
    *   **Stalled Alerts**: "2 Opps > 5 Days" alert display.
*   **Client Assets**: Update to a condensed "4 Files" display style instead of the list.

## Verification
*   **Layout Check**: Verify the top section uses a 2:1 ratio (approx) between Metrics and Parameters.
*   **Height Check**: Verify `DealCard` stretches to match the height of the metric grid.
*   **Full Width**: Verify `PipelineBoard` is full width (no right sidebar).
*   **Tabs**: Verify switching between "Overview" (Dashboard) and "History" (Timeline).
