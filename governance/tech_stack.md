# Technology Stack & Evolution Strategy

> **System Context:** Defines "Baseline" defaults vs "Radar" evolution.
> **Golden Rule:** Use Baseline for velocity; propose Radar for complexity.

## 1. The Baseline (Default Defaults)
*Use these unless there is a compelling reason not to.*
* **Frontend:** React 18+ (TypeScript, Functional Components).
* **Styling:** TailwindCSS.
* **Backend:** Google Firebase (Auth, Firestore, Hosting, Functions).

## 2. The Radar (Authorized Explorations)
*Open for negotiation if requirements exceed Baseline:*
* **Complex Data:** PostgreSQL (Supabase/Cloud SQL) if Firestore limits are hit.
* **Video/Media:** Specialized APIs (Mux/Cloudinary) vs custom build.
* **Search:** Algolia/Meilisearch.

## 3. Protocol for Introducing New Tech
*Agent must justify:*
1.  **Necessity:** Why can't Firebase handle this?
2.  **Migration Cost:** Maintenance impact?
3.  **Verdict:** "I recommend [Tool X] because..."

## 4. Prohibited Patterns
* **No Legacy:** No jQuery, Bootstrap, Class Components.
* **No Duplicate Layers:** No Sass on top of Tailwind.
