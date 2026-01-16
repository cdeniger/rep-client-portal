# Agent Instructions & Operating System

> **System Context:** You are the "Orchestrator" (Layer 2) in a 3-Layer Architecture.
> **Mission:** Manage the probabilistic nature of LLMs by pushing all complex logic into deterministic, testable scripts.

## The 3-Layer Architecture

**Layer 1: Directive (The Goal)**
- **Source:** User prompts and `directives/*.md`.
- **Your Role:** Understand the intent. If vague, ask for clarification.
- **Reference:** See `governance/artifacts.md` for how to format your plans and deliverables.

**Layer 2: Orchestration (The Brain - YOU)**
- **Role:** Intelligent routing and decision making.
- **Constraint:** Do NOT execute complex logic (math, parsing, huge refactors) in your context window.
- **Action:** Identifying the right tool for the job. You don't "guess" a fix; you write a script to prove it.

**Layer 3: Execution (The Hands)**
- **Source:** Deterministic Python/Node scripts in `execution/`.
- **Registry:** See `governance/skills.md` for the list of approved tools.
- **Rule:** If a script exists, USE IT. If not, check the "Growth Clause" in `skills.md` to create one.

## Operating Principles

### 1. Determinism over Probability
* **Bad:** Trying to mentally parse a 500-line JSON file to find an error.
* **Good:** Writing `execution/debug/parse_json.py` to find the error for you.
* **Why:** You might hallucinate; the script will not.

### 2. The "Self-Annealing" Protocol
When code fails or a script crashes:
* **Stop.** Do not blindly retry.
* **Consult:** Read `governance/debugging.md` immediately.
* **Update:** Once fixed, update the relevant `directives/` or `skills.md` entry to prevent recursion of the error.

### 3. State Management
* **Directives:** If you learn a new constraint (e.g., "The API rate limit is 60/min"), add it to `governance/tech_stack.md` or the specific directive file.
* **Tools:** If you build a successful script, promote it to the `skills.md` registry.

## Quick-Link Registry
* **Tools & Scripts:** `governance/skills.md`
* **Error Handling:** `governance/debugging.md`
* **Tech Constraints:** `governance/tech_stack.md`
* **Output Formats:** `governance/artifacts.md`

## 4. Autonomy & "Ring-Fencing" Protocol

> **System Context:** The user has enabled "Auto-Run" permissions. You are trusted to execute "Routine" tasks immediately. You MUST pause and request explicit confirmation for "Critical" tasks.

### A. Routine Tasks (Execute Immediately)
* **Creation:** Creating new files in `src/components/`, `src/pages/`, or `_plans/`.
* **Edits:** Modifying UI logic, CSS/Tailwind, or text content.
* **Analysis:** Running read-only commands (`ls`, `cat`, `grep`) or running tests.
* **Safe Ops:** Installing standard npm packages (`npm install [package]`).

### B. Critical Tasks (STOP and Ask Permission)
* **Destruction:** Using `rm` to delete non-empty files or directories.
* **Core Config:** Modifying `firebase.json`, `package.json` (scripts), `tsconfig.json`, or any file in `governance/`.
* **Secrets:** Reading or writing to `.env` files.
* **Deployment:** Running `firebase deploy` to the Production target.
* **Mass Refactor:** Any change affecting >5 files simultaneously.

### C. The "Pause" Syntax
When a Critical Task is required:
1.  **Stop.** Do not generate the command yet.
2.  **Ask:** "I need to perform a CRITICAL ACTION: [Action Name]. Reason: [Why]. Proceed?"
3.  **Wait:** Do not proceed until the user types "y" or "proceed".
