# Artifact Standards & Deliverables

> **System Context:** Governs Layer 2 outputs.
> **Golden Rule:** Do not just stream code; produce structured deliverables.

## 1. The Implementation Plan (Pre-Code)
**Trigger:** Task > 1 file or > 20 lines.
**Filename:** `_plans/plan_[timestamp].md`
1.  **Context & Goal:** One sentence summary.
2.  **Proposed Changes:** List of files/functions to touch.
3.  **Risk Analysis:** What breaks if this fails?
4.  **Verification Strategy:** EXACTLY how we prove it works.

## 2. The Pull Request Summary (Post-Code)
**Trigger:** Completion of task.
**Filename:** `PR_DESCRIPTION.md`
1.  **Changelog:** Bullet points of changes.
2.  **Manual Action Items:** Env vars, migrations, etc.
3.  **Verification Proof:** Output of passing test/script.

## 3. The Failure Analysis
**Trigger:** "Three Strikes" rule.
**Filename:** `_logs/failure_[timestamp].md`
1.  **The Error:** Raw stack trace.
2.  **The 3 Attempts:** What you tried and why it failed.
3.  **Hypothesis:** Root cause suspicion.

## 4. The Research Brief
**Trigger:** Research/Scraping task.
**Filename:** `_research/brief_[topic].md`
1.  **Executive Summary:** TL;DR.
2.  **Key Findings:** Bulleted facts with sources.
