# Plan: Activity Feed UI Enhancement (Scalable)

## Objective
Upgrade the "Activity Feed" to a **rich, contextual timeline** while solving the "1000+ records" scalability issue. The page must transition from a "load all" approach to a **Search-First & Paginated** architecture, ensuring performance and usability.

## 1. Scalability & Data Architecture (New)
The current `onSnapshot` loads the entire database. We will replace this with a performant Query System.
-   **Default State**: Load the most recent **50 activities** only.
-   **Pagination**: Implement an "Infinite Scroll" or "Load More" mechanism acting on a Firestore Cursor (`startAfter`).
-   **Server-Side Filters**: Move filtering logic from the client to the database queries to reduce bandwidth.
    -   **Type Filter**: Directly query `where('type', '==', selectedType)`.
    -   **Context Filters**: Add specific lookups for "Filter by Company" or "Filter by Contact" (utilizing the `associations` map).

## 2. Robust Search & Filter Bar
Replace the simple toggle buttons with a comprehensive **Control Panel**.
-   **Search Input**: A text input to filter the *visible* timeline instantly (Client-side) OR, if feasible, perform specific value lookups.
-   **Advanced Filters**:
    -   **Type**: Dropdown/Pills for Activity Type (Call, Email, etc.).
    -   **Entity**: "Related To" autocomplete (Find specific Company/Contact).
    -   **Date**: "Last 7 Days", "Last 30 Days", "Custom Range".

## 3. UI/UX: "Rich Activity Cards" (Retained)
Move to the "Timeline Card" architecture to display density without clutter.
-   **Header**: **Activity Type** + **Outcome** (e.g., "Connected Call").
-   **Sub-header**: Context (e.g., "with **Alex Mercer** • **Linear**").
    -   *Action*: We will assume `associations` contains IDs. We will attempt to fetch display names or fallback to a "View Context" generic label if names aren't denormalized on the activity record.
-   **Visuals**:
    -   Timeline Spine (Vertical line connecting sessions).
    -   Outcome Badges (Green for Success, Gray for Neutral).
    -   Rich Metadata (Star ratings, Duration).

## 4. Technical Refactoring
-   **`ActivityService.ts`**: Add `getGlobalActivityFeed({ limit, lastDoc, filters })` to handle the complex query construction.
-   **`Activities.tsx`**: 
    -   Remove full collection listener.
    -   Implement the new "Control Panel" state (Filter/Search).
    -   Implement the "Load More" handler.
-   **`ActivityRowItem.tsx`**: Refactor into the new Card design.

## Implementation Steps
1.  **Refactor `ActivityRowItem` UI**: First, make the *existing* data look good (Rich Cards, Badges, Fixed NaN bugs).
2.  **Upgrade Data Layer (`Activities.tsx`)**: Replace the massive `onSnapshot` with a paginated `Query` hook.
3.  **Build Search/Filter UI**: Add the controls to drive the new query hook.

## Approval
This plan addresses the UI polish AND the data scalability/search requirements. Proceed?
