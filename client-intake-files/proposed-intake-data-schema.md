Rep. Optimized Intake → Pillar → BriefSchema Mapping Matrix
(Sections reordered for client clarity; Section 8 removed)
 
SECTION 1 — Professional Baseline (Lightweight Context)
(Used for inference + defaults, not narrative)
Question	Pillar(s)	BriefSchema Field
Current job title	P1, P2, P3, P6	profile.currentTitle
Current employer	P1, P3	profile.currentCompany
Industry / domain	P3, P6	profile.industry
Years of experience (range)	P2, P6	profile.experienceBand
Are you currently employed?	P5, P6	constraints.employmentStatus
 
SECTION 2 — Career Direction & Trajectory (Macro Intent)
(Client-facing early to set context)
Question	Pillar(s)	BriefSchema Field
Career evolution preference (ownership, exec, GM, etc.)	P1, P7	trajectory.primaryArc
Secondary trajectory (optional)	P7	trajectory.secondaryArc
Desired long-term evaluation outcomes	P7	trajectory.successMetrics[]
What NOT to optimize for	P1, P7	trajectory.negativeConstraints[]
 
SECTION 3 — Time Horizon & Decision Framing
(Anchors urgency, tradeoffs, and patience)
Question	Pillar(s)	BriefSchema Field
Ideal duration of next role	P5, P7	horizon.nextRoleDuration
When should next role “pay off”?	P6, P7	horizon.payoffTiming
Primary progression lens (title / scope / economics / freedom)	P1, P6, P7	horizon.progressionLens
 
SECTION 4 — Current Ownership & Desired Expansion
(Feeds ownership slope + dashboard)
Question	Pillar(s)	BriefSchema Field
What are you accountable for today?	P2, P7	ownership.current[]
What should you own at next level?	P2, P6, P7	ownership.nextLevelTarget
Ownership dimension to expand next	P2, P7	ownership.expansionPriority
 
SECTION 5 — Decision Authority & Risk Posture
(Differentiates IC vs owner-of-outcomes)
Question	Pillar(s)	BriefSchema Field
How decisions are made today	P1, P2, P7	authority.currentMode
Desired decision authority areas	P2, P7	authority.targetDomains[]
Comfort with visible failure	P2, P7	authority.failureTolerance
 
SECTION 6 — Compensation Orientation (Client Intent)
(Pairs with market-inferred comp data)
Question	Pillar(s)	BriefSchema Field
Near-term priority (earnings vs flexibility vs authority)	P6, P7	comp.orientation.primary
Comfort with non-linear comp	P6, P7	comp.riskPosture
Financial success signals (top 2)	P6, P7	comp.successSignals[]
 
SECTION 7 — Market Identity & Visibility
(Controls how the market should categorize the client)
Question	Pillar(s)	BriefSchema Field
How the market reads you today	P1, P4, P7	marketIdentity.current
Desired market identity (5 yrs)	P1, P7	marketIdentity.target
Interest in visibility (boards, writing, etc.)	P4, P7	marketIdentity.visibilityChannels[]
 
SECTION 8 — Optionality & Risk Guardrails
(Critical filters for opportunity evaluation)
Question	Pillar(s)	BriefSchema Field
Importance of multiple paths	P5, P7	optionality.importanceLevel
Acceptable risks	P5, P6, P7	optionality.acceptableRisks[]
Unacceptable risks	P5, P6, P7	optionality.blockers[]
 
SECTION 9 — Assets (Infer-First Inputs)
(No self-reporting; Rep analyzes)
Input	Pillar(s)	BriefSchema Field
LinkedIn profile URL	P1, P3, P4	assets.linkedinUrl
Resume upload	P2, P4	assets.resumeFile
 
What This Enables (System-Level)
With this mapping:
•	No duplicate questions
•	No premature commitment questions
•	Pillars 1–7 fully computable
•	Clear separation of:
o	Client intent
o	Market inference
o	Rep judgment
•	Clean BriefSchema contract that supports:
o	Rules engine
o	AI narrative layer
o	Dashboard updates
o	Ongoing stewardship
 
Key Design Win (Important)
You have successfully:
•	Removed sales friction from intake
•	Preserved architectural rigor
•	Positioned Rep. as a fiduciary guide, not a service menu
The client never has to say:
“Yes, I want long-term involvement.”
They experience it — and opt in naturally.
 

