# Agent Skills Registry & Execution Protocols

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
