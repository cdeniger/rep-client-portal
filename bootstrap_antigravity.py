import os

# --- Configuration: The Content of our Governance Files ---

AGENTS_MD = """# Agent Instructions & Operating System

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
"""

SKILLS_MD = """# Agent Skills Registry & Execution Protocols

> **System Context:** This registry connects Layer 2 (Orchestration) to Layer 3 (Execution).
> **Golden Rule:** Agents must prefer these deterministic scripts over manual file manipulation whenever possible.

## 1. Skill Registry

Before attempting a task, scan this table. If a tool exists, **use it**.

| Category | Skill Name | Script Path | Trigger Condition | Inputs |
| :--- | :--- | :--- | :--- | :--- |
| **DevOps** | **Firebase Deploy** | `execution/ops/firebase_deploy.py` | User says "ship it," "deploy to staging." | `--target` (preview/prod), `--comment` |
| **DevOps** | **Env Validator** | `execution/ops/check_env.py` | Start of session or after pulling repo. | None |
| **React** | **Component Scaffold** | `execution/react/new_component.py` | "Create a new [Name] component." | `--name`, `--props`, `--path` |
| **React** | **Test Runner** | `execution/react/run_tests.py` | After any logic change to `src/`. | `--file` (specific test) or `--all` |
| **Data** | **Research Scraper** | `execution/data/fetch_url.py` | User provides a URL for research. | `--url`, `--format` (markdown/json) |
| **Data** | **Asset Optimizer** | `execution/data/optimize_images.py` | User uploads raw images. | `--input_dir`, `--output_dir` |

## 2. Execution Protocols

### A. Input Standards
* **Sanitization:** Strip trailing whitespace and quotes from arguments.
* **Pathing:** Use absolute paths or paths relative to the project root (`./`).
* **Secrets:** **NEVER** pass API keys as CLI args. Read from `os.environ`.

### B. Output Handling
* **Success:** If `exit_code == 0`, parse `stdout` (JSON) to confirm result.
* **Failure:** If `exit_code != 0`, read `stderr`.
    * *Self-Correction:* If missing dependency, try `pip install` once.
    * *Escalation:* If script fails twice, generate `bug_report.md`.

### C. Protocol for New Capabilities (The "Growth" Clause)
If the current Skills Registry is insufficient:

1.  **Search:** Check if a standard library or API exists fitting the Tech Stack.
2.  **Draft:** Create a *generalized* script in `execution/drafts/`.
3.  **Justify:** Explain:
    * "I created a new tool: `generate_video.py`."
    * "Why: Capability was missing."
    * "Complexity Check: Adds no heavy dependencies."
4.  **Wait:** Do not use until approved or moved to `execution/ops/`.

## 3. Tech Stack Constraints
* **Frontend:** React 18+, Tailwind CSS, TypeScript.
* **Backend:** Firebase Functions or Python (FastAPI).
"""

DEBUGGING_MD = """# Debugging & Error Resolution Protocol

> **System Context:** Governs Layer 2 handling of Layer 3 failures.
> **Golden Rule:** Never apply a "blind fix." Prove the bug exists first.

## 1. The Core Loop: "Reproduce, Fix, Verify"

### Step 1: Analyze & Isolate
* **Read the Trace:** Identify the exact line number.
* **Categorize:** Syntax, Logic, or Environment error?

### Step 2: The "Reproduction" Constraint
* **For Logic Errors:** Before changing code, create a **minimal reproduction case**.
    * *React:* Write a failing test using `execution/react/run_tests.py`.
    * *Python:* Write a script in `execution/drafts/repro_issue.py`.

### Step 3: Implement & Verify
* Apply fix -> Run repro case -> If pass, delete repro case.

## 2. Common Failure Scenarios
* **Import Error:** Check `package.json` before `npm install`.
* **Firebase Permission:** Check `firestore.rules` and Auth token.
* **React Minified Error:** Switch to dev build for trace.

## 3. The "Three Strikes" Rule
If you fail to fix an error **3 times**:
1.  **STOP.**
2.  **Revert** to original state.
3.  **Report** with a Failure Analysis Artifact (`bug_report.md`).
4.  **Ask** for help.
"""

ARTIFACTS_MD = """# Artifact Standards & Deliverables

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
"""

TECH_STACK_MD = """# Technology Stack & Evolution Strategy

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
"""

# --- Execution ---

def create_file(path, content):
    # Create directory if it doesn't exist
    directory = os.path.dirname(path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory)
    
    # Write the file
    with open(path, 'w') as f:
        f.write(content)
    print(f"✅ Created: {path}")

def touch_file(path):
    create_file(path, "# Placeholder for agent execution script")

def main():
    print("🚀 Initializing Antigravity Governance Environment...")
    
    # 1. Create Core Governance Files
    create_file("agents.md", AGENTS_MD)
    create_file("governance/skills.md", SKILLS_MD)
    create_file("governance/debugging.md", DEBUGGING_MD)
    create_file("governance/artifacts.md", ARTIFACTS_MD)
    create_file("governance/tech_stack.md", TECH_STACK_MD)
    
    # 2. Create Artifact Directories (so agents know where to put them)
    os.makedirs("_plans", exist_ok=True)
    os.makedirs("_logs", exist_ok=True)
    os.makedirs("_research", exist_ok=True)
    print("✅ Created Artifact folders: _plans/, _logs/, _research/")

    # 3. Bootstrap Execution Layer (Create Empty Placeholders)
    # This ensures the agent sees the file paths exist, even if empty.
    touch_file("execution/ops/firebase_deploy.py")
    touch_file("execution/ops/check_env.py")
    touch_file("execution/react/new_component.py")
    touch_file("execution/react/run_tests.py")
    touch_file("execution/data/fetch_url.py")
    touch_file("execution/data/optimize_images.py")
    
    # Create drafts folder for "Growth Clause"
    os.makedirs("execution/drafts", exist_ok=True)
    print("✅ Created Execution folders: execution/ [ops, react, data, drafts]")

    print("\n✨ Environment Ready! You can now delete this script.")

if __name__ == "__main__":
    main()