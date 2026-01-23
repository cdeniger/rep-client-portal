import 'dotenv/config';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile, IntakeResponse } from '../types/schema';

export const seedPods = async () => {
    console.log("Seeding Pods Structure...");
    const batch = writeBatch(db);

    const pods = [
        { id: 'pod_1', name: 'Pod 1' },
        { id: 'pod_2', name: 'Pod 2' },
        { id: 'pod_3', name: 'Pod 3' },
        { id: 'pod_4', name: 'Pod 4' }
    ];

    pods.forEach(pod => {
        const ref = doc(db, 'pods', pod.id);
        batch.set(ref, {
            id: pod.id,
            name: pod.name,
            createdAt: new Date().toISOString()
        });
    });

    await batch.commit();
    console.log("Seeded 4 Stable Pods.");
};

export const seedClientData = async (uid: string) => {
    if (!uid) throw new Error("No User ID provided for seeding.");
    const batch = writeBatch(db);
    // ... rest of function ...


    // 1. Seed User Profile (Client: Alex Mercer)
    const userRef = doc(db, 'users', uid);
    const userData: UserProfile = {
        uid,
        email: 'alex.mercer@example.com',
        role: 'client',
        profile: {
            name: 'Alex Mercer',
            status: 'searching',
            podId: 'pod_1',
            pod: 'Pod 1',
            headline: 'Senior Product Manager @ FinTech',
            bio_long: 'Senior PM with 7 years experience in payments infrastructure...',
            bio_short: 'Product Leader in Payments',
            pitch: 'I build payments infrastructure that scales.'
        }
    };
    batch.set(userRef, userData);

    // 2. Seed Intake Response
    const intakeRef = doc(db, 'intake_responses', `intake_${uid}`);
    const intakeData: IntakeResponse = {
        id: `intake_${uid}`,
        userId: uid,
        status: 'completed',
        profile: {
            currentTitle: 'Senior Product Manager',
            currentCompany: 'Acme Pay',
            industry: 'FinTech',
            experienceBand: '11-15'
        },
        trajectory: {
            primaryArc: 'Executive leadership (VP / C-suite track)',
            successMetrics: ['Revenue growth', 'Strategic direction'],
            negativeConstraints: ['People management']
        },
        horizon: {
            nextRoleDuration: '3-5 years',
            payoffTiming: 'Within 2-3 years',
            progressionLens: 'Scope progression'
        },
        ownership: {
            current: ['Strategic roadmap', 'Regulatory / risk exposure'],
            nextLevelTarget: 'Full business line or function',
            expansionPriority: 'Financial outcomes'
        },
        authority: {
            currentMode: 'I recommend; others decide',
            targetDomains: ['Hiring / firing', 'Budget allocation'],
            failureTolerance: 'Comfortable with support'
        },
        comp: {
            orientation: { primary: 'Maximizing total earnings' },
            riskPosture: 'Comfortable with equity-heavy upside',
            successSignals: ['Net worth milestones']
        },
        marketIdentity: {
            current: 'Strong executor',
            target: 'Trusted executive',
            visibilityChannels: ['Advisory roles']
        },
        assets: {
            linkedinUrl: 'https://linkedin.com/in/alexmercer',
            resumeFile: 'resume_v1.pdf'
        },
        filters: {
            hardConstraints: {
                minBase: 0,
                minTotalComp: 0,
                minLevel: 3,
                maxCommuteMinutes: 45,
                relocationWillingness: false
            },
            softPreferences: {
                preferredIndustries: [],
                avoidIndustries: [],
                preferredFunctions: [],
                workStyle: 'hybrid'
            }
        }
    };
    batch.set(intakeRef, intakeData);

    // 3. Seed Opportunities
    // Fix: Use specific IDs so we don't duplicate on re-seed
    const oppsRef = doc(db, 'opportunities', `opp_${uid}_1`);
    const oppData1: any = {
        id: `opp_${uid}_1`,
        userId: uid,
        engagementId: `eng_${uid}`, // Linked to the Engagement we create later
        company: 'Stripe',
        role: 'Product Lead, Issuing',
        status: 'interviewing',
        stage_detail: 'Onsite Scheduled',
        source: 'network',
        financials: { base: 240000, bonus: 40000, equity: '$1.2M / 4y', rep_net_value: 1200000 }
    };
    batch.set(oppsRef, oppData1);

    // 4. Seed Diagnostic Report
    // NOTE: In a real app, the ID might just be the UID or auto-gen. Using report_{uid} for simplicity.
    const diagRef = doc(db, 'diagnostic_reports', uid); // Using UID as ID for easier lookup in dev
    // @ts-ignore
    const now = new Date();

    const diagData: any = {
        id: uid,
        userId: uid,
        intakeId: `intake_${uid}`,
        status: 'published',
        meta: {
            generatedAt: now,
            rep_reviewer_id: 'rep_001'
        },
        pillars: {
            p1_identity: {
                market_reads: [
                    { title: "Seniority", current_read: "Senior Executor", target_read: "Strategic Leader", interpretation: "Market sees you as the person who fixes things, not the one who designs the future." },
                    { title: "Domain", current_read: "Payments Infra", target_read: "FinTech Generalist", interpretation: "You are pigeonholed in backend rails." }
                ]
            },
            p2_capital: {
                patterns: [
                    { pattern: "Scale", market_sees: "Managed $10M P&L", market_misses: "Orchestrated $50M merger", rep_clarification: "Highlight the M&A role in the bio." }
                ],
                scope_dial: 75
            },
            p3_market: {
                segments: {
                    early_stage: "deprioritized",
                    mid_market: "primary",
                    institutional: "monitor",
                    regulated: "secondary"
                }
            },
            p4_assets: {
                signals: [
                    { title: "LinkedIn Optimization", asset_score: 6, rep_target_score: 9, status_label: "Needs Work" },
                    { title: "Resume Narrative", asset_score: 8, rep_target_score: 10, status_label: "Strong" }
                ],
                evidence: []
            },
            p5_pipeline: {
                channels: [
                    { name: "Executive Search", status: "Active", best_for: "C-Level roles", tradeoffs: "Slow process" },
                    { name: "VC Network", status: "Warm", best_for: "Series B/C", tradeoffs: "High variation" }
                ],
                dimensions: { intensity: "Medium", urgency_fit: "High", access_path: "Network-led" }
            },
            p6_comp: {
                trajectory: [
                    { horizon: "Year 1", range: "$250k - $300k", level: "L7", focus: "Cash" },
                    { horizon: "Year 3", range: "$400k - $600k", level: "VP", focus: "Equity" }
                ],
                tradeoffs: []
            },
            p7_architecture: {
                dashboard: [
                    { dimension: "Network", current_state: "Siloed", target_state: "Broad", status: "In Progress", progress_pct: 40, next_moves: ["Attend FinTech Week", "Reconnect with ex-Stripe"] }
                ]
            }
        }
    };
    batch.set(diagRef, diagData);

    // 5. Seed Financials (Subscription & Invoices)
    const subRef = doc(db, 'financial_subscriptions', `sub_${uid}`);
    batch.set(subRef, {
        id: `sub_${uid}`,
        userId: uid,
        planId: 'monthly-retainer',
        status: 'active',
        amount: 500, // Fixed: Storing as raw dollars (500) to match invoice format and user request
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1))
    });

    // Seed Invoices (Historical)
    const invoices = [
        { id: 'inv_1', date: '2023-10-01', amount: 500, status: 'paid' },
        { id: 'inv_2', date: '2023-11-01', amount: 500, status: 'paid' },
        { id: 'inv_3', date: '2023-12-01', amount: 500, status: 'paid' },
        { id: 'inv_4', date: '2024-01-01', amount: 500, status: 'paid' }
    ];

    invoices.forEach((inv, idx) => {
        const invRef = doc(db, 'invoices', `inv_${uid}_${idx}`);
        batch.set(invRef, {
            ...inv,
            userId: uid,
            description: 'Monthly Retainer'
        });
    });

    // 6. Seed Engagement (CRITICAL FIX: Link to Rep)
    const engId = `eng_${uid}`; // eng_eng_user_alex_mercer
    const contactId = `contact_${uid}`;
    const companyId = `comp_${uid}_stripe`;

    // A. Contact
    const contactRef = doc(db, 'contacts', contactId);
    batch.set(contactRef, {
        id: contactId,
        userId: uid,
        currentCompanyId: companyId,
        firstName: 'Alex',
        lastName: 'Mercer',
        email: 'alex.mercer@example.com',
        headline: userData.profile.headline,
        bio: userData.profile.bio_short,
        phone: '555-0100',
        linkedInUrl: 'https://linkedin.com/in/alexmercer',
        avatarUrl: null
    });

    // B. Company (Stripe)
    const compRef = doc(db, 'companies', companyId);
    batch.set(compRef, {
        id: companyId,
        name: 'Stripe',
        domain: 'stripe.com',
        logoUrl: null
    });

    // C. Engagement
    const engRef = doc(db, 'engagements', engId);
    batch.set(engRef, {
        id: engId,
        contactId: contactId,
        repId: 'rep_jordan', // LINKED TO JORDAN WOLF
        userId: uid, // LINKED TO ALEX MERCER (Critical for Dashboard)
        status: 'active',
        startDate: new Date().toISOString(),
        isaPercentage: 0.15,
        profile: {
            headline: userData.profile.headline,
            pod: userData.profile.pod,
            bio_short: userData.profile.bio_short,
            firstName: 'Alex',
            lastName: 'Mercer'
        },
        targetParameters: {
            minBase: 250000,
            minTotalComp: 400000,
            minLevel: 6,
            maxCommuteMinutes: 45,
            relocationWillingness: false,
            preferredIndustries: ['FinTech', 'SaaS'],
            avoidIndustries: ['AdTech'],
            preferredFunctions: ['Product Management'],
            workStyle: 'hybrid'
        },
        strategy: {
            trajectory: {
                primaryArc: 'Executive leadership (VP / C-suite track)',
                successMetrics: ['Revenue growth'],
                negativeConstraints: ['People management']
            },
            comp: {
                orientation: { primary: 'Maximizing total earnings' },
                riskPosture: 'Comfortable with equity-heavy upside',
                successSignals: ['Net worth milestones']
            }
        }
    });

    await batch.commit();
    console.log("Client data seeded for:", uid);
};

export const seedAdminData = async () => {
    const uid = 'rep_admin';
    console.log(`Starting Admin Seeding for: ${uid}`);
    const batch = writeBatch(db);

    // 1. Seed Admin User
    const userRef = doc(db, 'users', uid);
    batch.set(userRef, {
        uid,
        email: 'admin@repteam.com',
        role: 'admin', // Role 'admin' for full access
        profile: {
            name: 'Admin User',
            firstName: 'Admin',
            lastName: 'User',
            status: 'active',
            podId: 'pod_admin',
            pod: 'Admin', // Admin has access to everything, but we can tag them
            headline: 'System Administrator',
            bio_long: 'System Administrator',
            bio_short: 'Admin',
            pitch: 'Admin',
            contactId: `contact_${uid}`
        }
    });

    // 2. Seed Admin Contact Info
    const contactRef = doc(db, 'contacts', `contact_${uid}`);
    batch.set(contactRef, {
        id: `contact_${uid}`,
        userId: uid,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@repteam.com',
        headline: 'System Administrator',
        bio: 'Internal Admin User',
        avatarUrl: null
    });

    await batch.commit();
    console.log("Admin User Seeded.");
};

export const seedRepData = async (uid: string) => {
    if (!uid) throw new Error("No User ID provided for seeding.");
    const batch = writeBatch(db);

    console.log(`Starting CRM Seeding for Rep: ${uid}`);

    // 1. Seed Rep User (Jordan Wolf)
    const repUserRef = doc(db, 'users', uid);
    batch.set(repUserRef, {
        uid,
        email: 'jordan.wolf@rep.com',
        role: 'rep',
        profile: {
            name: 'Jordan Wolf',
            firstName: 'Jordan',
            lastName: 'Wolf',
            status: 'active',
            podId: 'pod_1', // LINKED TO POD 1
            pod: 'Pod 1',
            headline: 'Senior Talent Agent',
            bio_long: 'Top performing agent with 10 years in tech placements.',
            bio_short: 'Senior Talent Agent',
            pitch: 'I find the best talent.',
            contactId: `contact_${uid}`
        }
    });

    // 2. Seed Rep Contact Info
    const repContactRef = doc(db, 'contacts', `contact_${uid}`);
    batch.set(repContactRef, {
        id: `contact_${uid}`,
        userId: uid,
        firstName: 'Jordan',
        lastName: 'Wolf',
        email: 'jordan.wolf@rep.com',
        headline: 'Senior Talent Agent',
        bio: 'Top performing agent with 10 years in tech placements.',
        avatarUrl: null
    });

    console.log("Seeded Rep Identity.");

    console.log("Seeded Rep Identity.");

    // 4. Seed Inventory (Unassigned Opportunities)
    console.log("Seeding Inventory (Unassigned Opportunities)...");
    const inventoryCompanies = ["Stripe", "Airbnb", "Netflix", "Databricks", "OpenAI", "Anthropic", "Rippling", "Linear", "Retool", "Notion"];
    const inventoryRoles = ["Staff Engineer", "Senior EM", "Product Lead", "Head of Engineering", "Principal PM", "Founding Engineer"];

    for (let j = 0; j < 50; j++) {
        const invId = `inventory_${uid}_${j}`;
        const company = inventoryCompanies[Math.floor(Math.random() * inventoryCompanies.length)];
        const role = inventoryRoles[Math.floor(Math.random() * inventoryRoles.length)];

        const invRef = doc(db, 'opportunities', invId);
        batch.set(invRef, {
            id: invId,
            company: company,
            role: role,
            status: 'outreach', // Default for inventory
            stage_detail: 'Headcount Identified',
            source: 'radar',
            financials: {
                base: 200000 + Math.floor(Math.random() * 100000),
                bonus: 20000 + Math.floor(Math.random() * 50000),
                equity: "0.1%",
                rep_net_value: 15000
            },
            // No userId = Unassigned
        });
    }
    console.log("Seeded 50 Inventory items.");

    await batch.commit();
    console.log(`Seeded Rep ${uid} data (No Mock Clients)`);
};

export const seedNewRepAdmin = async () => {
    const uid = 'rep_patrick';
    console.log(`Starting Rep Admin Seeding for: ${uid}`);
    const batch = writeBatch(db);

    // 1. Seed Rep User (Patrick Deniger)
    const userRef = doc(db, 'users', uid);
    batch.set(userRef, {
        uid,
        email: 'patrick@repteam.com', // Updated email
        role: 'admin', // Requested as "Rep Admin", interpreting as role=admin
        profile: {
            name: 'Patrick Deniger',
            firstName: 'Patrick',
            lastName: 'Deniger',
            status: 'active',
            podId: 'unassigned', // Explicitly unassigned as requested
            pod: 'Unassigned',
            headline: 'Rep Admin',
            bio_long: 'Rep Admin',
            bio_short: 'Admin',
            pitch: 'Admin',
            contactId: `contact_${uid}`
        }
    });

    // 2. Seed Contact Info
    const contactRef = doc(db, 'contacts', `contact_${uid}`);
    batch.set(contactRef, {
        id: `contact_${uid}`,
        userId: uid,
        firstName: 'Patrick',
        lastName: 'Deniger',
        email: 'patrick@repteam.com', // Updated email
        headline: 'Rep Admin',
        bio: 'Rep Admin',
        avatarUrl: null
    });

    await batch.commit();
    console.log("Seeded Patrick Deniger as Rep Admin.");
};

// Default export for backward compatibility if needed, but preferred to be explicit
export const seedDatabase = seedClientData;

// Execute Seeding
// @ts-ignore
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    Promise.all([
        seedPods(),
        seedRepData('rep_jordan'),
        seedAdminData(),
        seedRepData('rep_admin'),
        seedClientData('user_alex_mercer'),
        seedNewRepAdmin()
    ])
        .then(() => {
            console.log("Seeding Complete.");
            // @ts-ignore
            process.exit(0);
        })
        .catch((error) => {
            console.error("Seeding Failed:", error);
            // @ts-ignore
            process.exit(1);
        });
}
