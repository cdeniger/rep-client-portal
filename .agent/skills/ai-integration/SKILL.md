---
description: Official protocol for integrating Google Gemini AI into Antigravity projects. Prioritizes diagnostic verification over trial-and-error.
---

# AI Integration (Google Gemini)

This skill defines the **Mandatory Protocol** for adding AI capabilities to an Antigravity project. It solves the common "404 Model Not Found" and "API Version Mismatch" issues by enforcing a **Diagnostic First** approach.

> [!IMPORTANT]
> **Cardinal Rule:** NEVER write application code until you have empirically verified the API Key's access tier and available models using the diagnostic script.

## 1. The Protocol

### Step 1: Diagnose (Before You Build)
You must verify what the provided `GEMINI_API_KEY` *actually* allows.
1.  Run the diagnostic script: `node .agent/skills/ai-integration/scripts/diagnose_key.js`
2.  **Analyze Output**:
    *   **Tier Check**: Does it support `gemini-1.5` or only `gemini-2.0`?
    *   **Version Check**: Does it require simple `v1beta` or full `v1alpha`?
    *   **Permissions**: Does it allow `generateContent`?

### Step 2: Install (Modern Stack)
We ONLY use the modern Google GenAI SDK.
*   **Package**: `@google/genai` (NOT `@google/generative-ai`)
*   **Command**: `npm install @google/genai`

### Step 3: Implement (Robust Pattern)
Use the provided `aiService` template which includes:
*   **Version Pinning**: Logic to force `v1alpha` if needed.
*   **Model Fallback**: A robust list of model names (e.g., `['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest']`) to ensure high availability.
*   **Response Parsing**: Correct handling of the complex nested candidate objects in the new SDK.

## 2. Tech Stack Reference

| Component | Standard | Notes |
| :--- | :--- | :--- |
| **SDK** | `@google/genai` | The "Vanilla" Deepmind SDK. |
| **API Version** | `v1alpha` | Preferred for broadest model access (2.0+). |
| **Model** | `gemini-2.0-flash` | The current standard for high-speed tasks. |
| **Key Env Var** | `GEMINI_API_KEY` | Must be set in `.env` (local) and Secrets (Prod). |

## 3. Implementation Guide

### A. Run Diagnostic
```bash
# Ensure GEMINI_API_KEY is in your environment
node .agent/skills/ai-integration/scripts/diagnose_key.js
```

### B. Scaffold Service
Copy `.agent/skills/ai-integration/templates/aiService.ts` to `functions/src/services/aiService.ts`.

### C. Configure Service
Update the `modelsToTry` array in the service file based on your Diagnostic findings.
*   *If 1.5 is missing*: Remove it from the list.
*   *If 2.0 is available*: Promote it to the top.

## 4. Common Pitfalls
*   **Legacy SDK**: Do NOT use `@google/generative-ai`. It is deprecated for new features.
*   **The "Pro" Trap**: `gemini-1.5-pro` is often gated behind higher tiers. Use Flash for reliability unless Pro is verified.
*   **404 Errors**: Almost always mean "Wrong Model Name" or "Wrong API Version", not "Endpoint Down". Run the diagnostic!
