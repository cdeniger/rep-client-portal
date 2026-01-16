# Debugging & Error Resolution Protocol

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
