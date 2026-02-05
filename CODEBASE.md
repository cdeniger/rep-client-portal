# 🗺️ Project Codebase Map
> **Last Updated:** Wed Feb  4 21:47:44 MST 2026
> **Auto-Generated:** Do not edit manually. Run `.agent/scripts/update_map.py` to refresh.

## 🏗️ high-Level Structure
- **`/src`**: Frontend Application (React/Vite)
- **`/functions`**: Backend Logic (Firebase Cloud Functions)
- **`/.agent`**: AI Configuration & Governance

## 📂 Complete File Tree
```plaintext
├── .agent
│   ├── .shared
│   │   └── ui-ux-pro-max
│   │       ├── data
│   │       │   ├── charts.csv
│   │       │   ├── colors.csv
│   │       │   ├── icons.csv
│   │       │   ├── landing.csv
│   │       │   ├── products.csv
│   │       │   ├── prompts.csv
│   │       │   ├── react-performance.csv
│   │       │   ├── stacks
│   │       │   │   ├── flutter.csv
│   │       │   │   ├── html-tailwind.csv
│   │       │   │   ├── jetpack-compose.csv
│   │       │   │   ├── nextjs.csv
│   │       │   │   ├── nuxt-ui.csv
│   │       │   │   ├── nuxtjs.csv
│   │       │   │   ├── react-native.csv
│   │       │   │   ├── react.csv
│   │       │   │   ├── shadcn.csv
│   │       │   │   ├── svelte.csv
│   │       │   │   ├── swiftui.csv
│   │       │   │   └── vue.csv
│   │       │   ├── styles.csv
│   │       │   ├── typography.csv
│   │       │   ├── ui-reasoning.csv
│   │       │   ├── ux-guidelines.csv
│   │       │   └── web-interface.csv
│   │       └── scripts
│   │           ├── core.py (.py)
│   │           ├── design_system.py (.py)
│   │           └── search.py (.py)
│   ├── ARCHITECTURE.md
│   ├── agents
│   │   ├── backend-specialist.md
│   │   ├── code-archaeologist.md
│   │   ├── database-architect.md
│   │   ├── debugger.md
│   │   ├── devops-engineer.md
│   │   ├── documentation-writer.md
│   │   ├── explorer-agent.md
│   │   ├── frontend-specialist.md
│   │   ├── game-developer.md
│   │   ├── mobile-developer.md
│   │   ├── orchestrator.md
│   │   ├── penetration-tester.md
│   │   ├── performance-optimizer.md
│   │   ├── product-manager.md
│   │   ├── product-owner.md
│   │   ├── project-planner.md
│   │   ├── qa-automation-engineer.md
│   │   ├── security-auditor.md
│   │   ├── seo-specialist.md
│   │   └── test-engineer.md
│   ├── mcp_config.json
│   ├── rules
│   │   └── GEMINI.md 🔑
│   ├── scripts
│   │   ├── auto_preview.py (.py)
│   │   ├── checklist.py (.py)
│   │   ├── session_manager.py (.py)
│   │   ├── update_map.py (.py)
│   │   └── verify_all.py (.py)
│   ├── skills
│   │   ├── ai-integration
│   │   │   ├── SKILL.md
│   │   │   ├── scripts
│   │   │   │   └── diagnose_key.js (.js)
│   │   │   └── templates
│   │   │       └── aiService.ts (.ts)
│   │   ├── api-patterns
│   │   │   ├── SKILL.md
│   │   │   ├── api-style.md
│   │   │   ├── auth.md
│   │   │   ├── documentation.md
│   │   │   ├── graphql.md
│   │   │   ├── rate-limiting.md
│   │   │   ├── response.md
│   │   │   ├── rest.md
│   │   │   ├── scripts
│   │   │   │   └── api_validator.py (.py)
│   │   │   ├── security-testing.md
│   │   │   ├── trpc.md
│   │   │   └── versioning.md
│   │   ├── app-builder
│   │   │   ├── SKILL.md
│   │   │   ├── agent-coordination.md
│   │   │   ├── feature-building.md
│   │   │   ├── project-detection.md
│   │   │   ├── scaffolding.md
│   │   │   ├── tech-stack.md
│   │   │   └── templates
│   │   │       ├── SKILL.md
│   │   │       ├── astro-static
│   │   │       │   └── TEMPLATE.md
│   │   │       ├── chrome-extension
│   │   │       │   └── TEMPLATE.md
│   │   │       ├── cli-tool
│   │   │       │   └── TEMPLATE.md
│   │   │       ├── electron-desktop
│   │   │       │   └── TEMPLATE.md
│   │   │       ├── express-api
│   │   │       │   └── TEMPLATE.md
│   │   │       ├── flutter-app
│   │   │       │   └── TEMPLATE.md
│   │   │       ├── monorepo-turborepo
│   │   │       │   └── TEMPLATE.md
│   │   │       ├── nextjs-fullstack
│   │   │       │   └── TEMPLATE.md
│   │   │       ├── nextjs-saas
│   │   │       │   └── TEMPLATE.md
│   │   │       ├── nextjs-static
│   │   │       │   └── TEMPLATE.md
│   │   │       ├── nuxt-app
│   │   │       │   └── TEMPLATE.md
│   │   │       ├── python-fastapi
│   │   │       │   └── TEMPLATE.md
│   │   │       └── react-native-app
│   │   │           └── TEMPLATE.md
│   │   ├── architecture
│   │   │   ├── SKILL.md
│   │   │   ├── context-discovery.md
│   │   │   ├── examples.md
│   │   │   ├── pattern-selection.md
│   │   │   ├── patterns-reference.md
│   │   │   └── trade-off-analysis.md
│   │   ├── bash-linux
│   │   │   └── SKILL.md
│   │   ├── behavioral-modes
│   │   │   └── SKILL.md
│   │   ├── brainstorming
│   │   │   ├── SKILL.md
│   │   │   └── dynamic-questioning.md
│   │   ├── clean-code
│   │   │   └── SKILL.md
│   │   ├── code-review-checklist
│   │   │   └── SKILL.md
│   │   ├── database-design
│   │   │   ├── SKILL.md
│   │   │   ├── database-selection.md
│   │   │   ├── indexing.md
│   │   │   ├── migrations.md
│   │   │   ├── optimization.md
│   │   │   ├── orm-selection.md
│   │   │   ├── schema-design.md
│   │   │   └── scripts
│   │   │       └── schema_validator.py (.py)
│   │   ├── deployment-procedures
│   │   │   └── SKILL.md
│   │   ├── doc.md
│   │   ├── documentation-templates
│   │   │   └── SKILL.md
│   │   ├── frontend-design
│   │   │   ├── SKILL.md
│   │   │   ├── animation-guide.md
│   │   │   ├── color-system.md
│   │   │   ├── decision-trees.md
│   │   │   ├── motion-graphics.md
│   │   │   ├── scripts
│   │   │   │   ├── accessibility_checker.py (.py)
│   │   │   │   └── ux_audit.py (.py)
│   │   │   ├── typography-system.md
│   │   │   ├── ux-psychology.md
│   │   │   └── visual-effects.md
│   │   ├── game-development
│   │   │   ├── 2d-games
│   │   │   │   └── SKILL.md
│   │   │   ├── 3d-games
│   │   │   │   └── SKILL.md
│   │   │   ├── SKILL.md
│   │   │   ├── game-art
│   │   │   │   └── SKILL.md
│   │   │   ├── game-audio
│   │   │   │   └── SKILL.md
│   │   │   ├── game-design
│   │   │   │   └── SKILL.md
│   │   │   ├── mobile-games
│   │   │   │   └── SKILL.md
│   │   │   ├── multiplayer
│   │   │   │   └── SKILL.md
│   │   │   ├── pc-games
│   │   │   │   └── SKILL.md
│   │   │   ├── vr-ar
│   │   │   │   └── SKILL.md
│   │   │   └── web-games
│   │   │       └── SKILL.md
│   │   ├── geo-fundamentals
│   │   │   ├── SKILL.md
│   │   │   └── scripts
│   │   │       └── geo_checker.py (.py)
│   │   ├── i18n-localization
│   │   │   ├── SKILL.md
│   │   │   └── scripts
│   │   │       └── i18n_checker.py (.py)
│   │   ├── intelligent-routing
│   │   │   └── SKILL.md
│   │   ├── lint-and-validate
│   │   │   ├── SKILL.md
│   │   │   └── scripts
│   │   │       ├── lint_runner.py (.py)
│   │   │       └── type_coverage.py (.py)
│   │   ├── mcp-builder
│   │   │   └── SKILL.md
│   │   ├── mobile-design
│   │   │   ├── SKILL.md
│   │   │   ├── decision-trees.md
│   │   │   ├── mobile-backend.md
│   │   │   ├── mobile-color-system.md
│   │   │   ├── mobile-debugging.md
│   │   │   ├── mobile-design-thinking.md
│   │   │   ├── mobile-navigation.md
│   │   │   ├── mobile-performance.md
│   │   │   ├── mobile-testing.md
│   │   │   ├── mobile-typography.md
│   │   │   ├── platform-android.md
│   │   │   ├── platform-ios.md
│   │   │   ├── scripts
│   │   │   │   └── mobile_audit.py (.py)
│   │   │   └── touch-psychology.md
│   │   ├── nextjs-react-expert
│   │   │   ├── 1-async-eliminating-waterfalls.md
│   │   │   ├── 2-bundle-bundle-size-optimization.md
│   │   │   ├── 3-server-server-side-performance.md
│   │   │   ├── 4-client-client-side-data-fetching.md
│   │   │   ├── 5-rerender-re-render-optimization.md
│   │   │   ├── 6-rendering-rendering-performance.md
│   │   │   ├── 7-js-javascript-performance.md
│   │   │   ├── 8-advanced-advanced-patterns.md
│   │   │   ├── SKILL.md
│   │   │   └── scripts
│   │   │       ├── convert_rules.py (.py)
│   │   │       └── react_performance_checker.py (.py)
│   │   ├── nodejs-best-practices
│   │   │   └── SKILL.md
│   │   ├── parallel-agents
│   │   │   └── SKILL.md
│   │   ├── performance-profiling
│   │   │   ├── SKILL.md
│   │   │   └── scripts
│   │   │       └── lighthouse_audit.py (.py)
│   │   ├── plan-writing
│   │   │   └── SKILL.md
│   │   ├── powershell-windows
│   │   │   └── SKILL.md
│   │   ├── python-patterns
│   │   │   └── SKILL.md
│   │   ├── red-team-tactics
│   │   │   └── SKILL.md
│   │   ├── seo-fundamentals
│   │   │   ├── SKILL.md
│   │   │   └── scripts
│   │   │       └── seo_checker.py (.py)
│   │   ├── server-management
│   │   │   └── SKILL.md
│   │   ├── systematic-debugging
│   │   │   └── SKILL.md
│   │   ├── tailwind-patterns
│   │   │   └── SKILL.md
│   │   ├── tdd-workflow
│   │   │   └── SKILL.md
│   │   ├── testing-patterns
│   │   │   ├── SKILL.md
│   │   │   └── scripts
│   │   │       └── test_runner.py (.py)
│   │   ├── vulnerability-scanner
│   │   │   ├── SKILL.md
│   │   │   ├── checklists.md
│   │   │   └── scripts
│   │   │       └── security_scan.py (.py)
│   │   ├── web-design-guidelines
│   │   │   └── SKILL.md
│   │   └── webapp-testing
│   │       ├── SKILL.md
│   │       └── scripts
│   │           └── playwright_runner.py (.py)
│   └── workflows
│       ├── brainstorm.md
│       ├── create.md
│       ├── debug.md
│       ├── deploy.md
│       ├── enhance.md
│       ├── orchestrate.md
│       ├── plan.md
│       ├── preview.md
│       ├── status.md
│       ├── test.md
│       └── ui-ux-pro-max.md
├── .antigravityignore
├── .cursorrules
├── .env
├── README.md
├── _archive
│   └── legacy_system
│       ├── agents.md
│       ├── execution
│       │   ├── data
│       │   │   ├── fetch_url.py (.py)
│       │   │   └── optimize_images.py (.py)
│       │   ├── ops
│       │   │   ├── check_env.py (.py)
│       │   │   └── firebase_deploy.py (.py)
│       │   └── react
│       │       ├── new_component.py (.py)
│       │       └── run_tests.py (.py)
│       └── governance
│           ├── artifacts.md
│           ├── debugging.md
│           ├── skills.md
│           └── tech_stack.md
├── _logs
│   └── prototype-background
│       ├── CRM Structure Notes
│       │   └── ActivitiesStructureNotes.md
│       ├── ClientPortal.txt
│       ├── Screenshot 2026-01-15 at 5.58.59 PM.png
│       ├── Screenshot 2026-01-15 at 5.59.11 PM.png
│       ├── Screenshot 2026-01-15 at 5.59.17 PM.png
│       ├── Screenshot 2026-01-15 at 5.59.28 PM.png
│       ├── Screenshot 2026-01-15 at 5.59.33 PM.png
│       ├── Screenshot 2026-01-15 at 5.59.40 PM.png
│       ├── Screenshot 2026-01-15 at 5.59.46 PM.png
│       └── Screenshot 2026-01-15 at 5.59.54 PM.png
├── bootstrap_antigravity.py (.py)
├── cors.json
├── docs
│   ├── business_plan
│   │   └── bizplan
│   ├── client_intake
│   │   ├── intake-questionaire.md
│   │   ├── proposed-intake-data-schema.md
│   │   └── react_code
│   └── implementation
│       ├── implementation_plan.md
│       └── implementation_plan_activities.md
├── eslint.config.js (.js)
├── firebase.json 🔑
├── firestore.indexes.json
├── firestore.rules 🔑
├── functions
│   ├── .env
│   ├── .env.example
│   ├── lib
│   │   ├── config
│   │   │   ├── advisors.js (.js)
│   │   │   └── advisors.js.map
│   │   ├── debugAuth.js (.js)
│   │   ├── debugAuth.js.map
│   │   ├── index.js (.js)
│   │   ├── index.js.map
│   │   ├── provisionClient.js (.js)
│   │   ├── provisionClient.js.map
│   │   ├── repairAlex.js (.js)
│   │   ├── repairAlex.js.map
│   │   ├── restore_alex.js (.js)
│   │   ├── restore_alex.js.map
│   │   ├── services
│   │   │   ├── aiService.js (.js)
│   │   │   ├── aiService.js.map
│   │   │   ├── ats
│   │   │   │   ├── simulateAts.js (.js)
│   │   │   │   └── simulateAts.js.map
│   │   │   ├── emailService.js (.js)
│   │   │   ├── emailService.js.map
│   │   │   ├── responseService.js (.js)
│   │   │   ├── responseService.js.map
│   │   │   ├── stripeService.js (.js)
│   │   │   └── stripeService.js.map
│   │   ├── templates
│   │   │   ├── applicantAutoResponse.js (.js)
│   │   │   ├── applicantAutoResponse.js.map
│   │   │   ├── internalNotification.js (.js)
│   │   │   └── internalNotification.js.map
│   │   ├── test-pdf.js (.js)
│   │   ├── test-pdf.js.map
│   │   ├── triggers
│   │   │   ├── generateApplicationDraft.js (.js)
│   │   │   ├── generateApplicationDraft.js.map
│   │   │   ├── onApplicationCreate.js (.js)
│   │   │   ├── onApplicationCreate.js.map
│   │   │   ├── onClientPlaced.js (.js)
│   │   │   ├── onClientPlaced.js.map
│   │   │   ├── onIntakeCreated.js (.js)
│   │   │   ├── onIntakeCreated.js.map
│   │   │   ├── runAtsSimulation.js (.js)
│   │   │   ├── runAtsSimulation.js.map
│   │   │   ├── sendApplicationResponse.js (.js)
│   │   │   └── sendApplicationResponse.js.map
│   │   └── types
│   │       ├── schema.js (.js)
│   │       └── schema.js.map
│   ├── package.json
│   ├── package.json.bak
│   ├── scripts
│   │   └── diagnose_gemini.js (.js)
│   ├── src
│   │   ├── config
│   │   │   └── advisors.ts (.ts)
│   │   ├── index.ts (.ts)
│   │   ├── provisionClient.ts (.ts)
│   │   ├── restore_alex.ts (.ts)
│   │   ├── services
│   │   │   ├── aiService.ts (.ts)
│   │   │   ├── ats
│   │   │   │   ├── README.md
│   │   │   │   └── simulateAts.ts (.ts)
│   │   │   ├── emailService.ts (.ts)
│   │   │   ├── responseService.ts (.ts)
│   │   │   └── stripeService.ts (.ts)
│   │   ├── templates
│   │   │   ├── applicantAutoResponse.ts (.ts)
│   │   │   └── internalNotification.ts (.ts)
│   │   ├── test-pdf.js (.js)
│   │   ├── triggers
│   │   │   ├── generateApplicationDraft.ts (.ts)
│   │   │   ├── onApplicationCreate.ts (.ts)
│   │   │   ├── onClientPlaced.ts (.ts)
│   │   │   ├── onIntakeCreated.ts (.ts)
│   │   │   ├── runAtsSimulation.ts (.ts)
│   │   │   └── sendApplicationResponse.ts (.ts)
│   │   └── types
│   │       └── schema.ts 🔑 (.ts)
│   └── tsconfig.json
├── health_related_resume25.pdf
├── index.html
├── package.json
├── postcss.config.js (.js)
├── public
│   ├── assets
│   │   └── rep-logo.png
│   └── vite.svg
├── src
│   ├── App.css
│   ├── App.tsx 🔑 (.tsx)
│   ├── assets
│   │   └── react.svg
│   ├── components
│   │   ├── activities
│   │   │   ├── ActivityCardFactory.tsx (.tsx)
│   │   │   ├── ActivityContextPanel.tsx (.tsx)
│   │   │   ├── ActivityFeedCard.tsx (.tsx)
│   │   │   ├── ActivityTimeline.tsx (.tsx)
│   │   │   ├── LogActivityModal.tsx (.tsx)
│   │   │   └── cards
│   │   │       ├── InterviewCard.tsx (.tsx)
│   │   │       ├── StageChangeCard.tsx (.tsx)
│   │   │       └── StandardCard.tsx (.tsx)
│   │   ├── applications
│   │   │   ├── ApplicationContextPanel.tsx (.tsx)
│   │   │   ├── ApplicationDetailsModal.tsx (.tsx)
│   │   │   └── ApplicationResponseModal.tsx (.tsx)
│   │   ├── ats
│   │   │   └── AtsSimulatorModal.tsx (.tsx)
│   │   ├── auth
│   │   │   ├── AdminGuard.tsx (.tsx)
│   │   │   ├── PrivateRoute.tsx (.tsx)
│   │   │   └── RoleGuard.tsx (.tsx)
│   │   ├── client
│   │   │   └── MeetingDrawer.tsx (.tsx)
│   │   ├── clients
│   │   │   └── CreateClientModal.tsx (.tsx)
│   │   ├── companies
│   │   │   ├── CompanyDrawer.tsx (.tsx)
│   │   │   ├── ContactManager.tsx (.tsx)
│   │   │   ├── LinkContactModal.tsx (.tsx)
│   │   │   └── LocationManager.tsx (.tsx)
│   │   ├── dev
│   │   │   └── DevTools.tsx (.tsx)
│   │   ├── email
│   │   │   └── EmailComposer.tsx (.tsx)
│   │   ├── forms
│   │   │   ├── DiagnosticForm.tsx (.tsx)
│   │   │   ├── OpportunityForm.tsx (.tsx)
│   │   │   ├── ProfileForm.tsx (.tsx)
│   │   │   └── pillars
│   │   │       ├── ArchForm.tsx (.tsx)
│   │   │       ├── AssetsForm.tsx (.tsx)
│   │   │       ├── CapitalForm.tsx (.tsx)
│   │   │       ├── CompForm.tsx (.tsx)
│   │   │       ├── IdentityForm.tsx (.tsx)
│   │   │       ├── MarketForm.tsx (.tsx)
│   │   │       └── PipelineForm.tsx (.tsx)
│   │   ├── layout
│   │   │   ├── AppShell.tsx (.tsx)
│   │   │   └── Sidebar.tsx (.tsx)
│   │   ├── pipeline
│   │   │   ├── PipelineBoard.tsx (.tsx)
│   │   │   ├── PipelineCard.tsx (.tsx)
│   │   │   └── PipelineColumn.tsx (.tsx)
│   │   ├── rep
│   │   │   ├── ClientMasterFileModal.tsx (.tsx)
│   │   │   ├── ContactDrawer.tsx (.tsx)
│   │   │   ├── DealCard.tsx (.tsx)
│   │   │   ├── activities
│   │   │   │   └── ActivityEditorModal.tsx (.tsx)
│   │   │   ├── client
│   │   │   │   └── LinkContactModal.tsx (.tsx)
│   │   │   └── dashboard
│   │   │       ├── CommandFeed.tsx (.tsx)
│   │   │       ├── MasterPipelineTable.tsx (.tsx)
│   │   │       └── RosterHealthGrid.tsx (.tsx)
│   │   └── ui
│   │       ├── Logo.tsx (.tsx)
│   │       └── Modal.tsx (.tsx)
│   ├── config
│   │   └── pipelines.ts (.ts)
│   ├── context
│   │   └── AuthContext.tsx (.tsx)
│   ├── hooks
│   │   ├── useCollection.ts (.ts)
│   │   ├── useDocument.ts (.ts)
│   │   ├── useFirestore.ts (.ts)
│   │   ├── useRepScope.ts (.ts)
│   │   └── useUserProfile.ts (.ts)
│   ├── index.css
│   ├── layouts
│   │   └── RepLayout.tsx (.tsx)
│   ├── lib
│   │   ├── companies.ts (.ts)
│   │   └── firebase.ts (.ts)
│   ├── main.tsx (.tsx)
│   ├── pages
│   │   ├── Activities.tsx (.tsx)
│   │   ├── Companies.tsx (.tsx)
│   │   ├── CompanyDetail.tsx (.tsx)
│   │   ├── Contacts.tsx (.tsx)
│   │   ├── Dashboard.tsx (.tsx)
│   │   ├── Diagnostic.tsx (.tsx)
│   │   ├── Financials.tsx (.tsx)
│   │   ├── JobRecs.tsx (.tsx)
│   │   ├── LoginPage.tsx (.tsx)
│   │   ├── Pipeline.tsx (.tsx)
│   │   ├── Radar.tsx (.tsx)
│   │   ├── admin
│   │   │   ├── ActivityDefinitionBuilder.tsx (.tsx)
│   │   │   ├── ActivityTypes.tsx (.tsx)
│   │   │   ├── PipelineConfig.tsx (.tsx)
│   │   │   ├── PipelineManager.tsx (.tsx)
│   │   │   └── PodManager.tsx (.tsx)
│   │   ├── internal
│   │   │   └── SalesPipeline.tsx (.tsx)
│   │   └── rep
│   │       ├── ClientDetail.tsx (.tsx)
│   │       ├── GlobalPipeline.tsx (.tsx)
│   │       ├── PendingRecs.tsx (.tsx)
│   │       ├── RepDashboard.tsx (.tsx)
│   │       ├── Roster.tsx (.tsx)
│   │       └── applications
│   │           └── Applications.tsx (.tsx)
│   ├── scripts
│   │   ├── inspect_leads.ts (.ts)
│   │   ├── seed.ts (.ts)
│   │   ├── seed_activity_definitions.ts (.ts)
│   │   ├── seed_applications.ts (.ts)
│   │   └── verify_email_trigger.ts (.ts)
│   ├── services
│   │   ├── ActivityService.ts (.ts)
│   │   └── AdminService.ts (.ts)
│   └── types
│       ├── activities.ts (.ts)
│       ├── pipeline.ts (.ts)
│       └── schema.ts 🔑 (.ts)
├── tailwind.config.js (.js)
├── test_isolation
│   └── .agent
│       └── skills
│           └── unique-skill.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts (.ts)
```