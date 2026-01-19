import { collection, doc, writeBatch, getDocs, deleteDoc, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile, IntakeResponse, Engagement } from '../types/schema';

/**
 * THE NUCLEAR OPTION
 * Wipes all core collections and reseeds a single "Golden Record" for Alex Mercer.
 */

const TARGET_COLLECTIONS = [
    'users',
    'engagements',
    'companies',
    'contacts',
    'opportunities',
    'job_pursuits',
    'job_recommendations',
    'intake_responses',
    'financial_subscriptions',
    'invoices',
    'diagnostic_reports'
];

async function wipeDatabase() {
    console.log("⚠️ STARTING DATABASE WIPE...");

    for (const colName of TARGET_COLLECTIONS) {
        process.stdout.write(`   Cleaning ${colName}... `);
        const q = query(collection(db, colName));
        const snapshot = await getDocs(q);

        const batch = writeBatch(db);
        let count = 0;

        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
            count++;
        });

        await batch.commit();
        console.log(`Deleted ${count} docs.`);
    }
    console.log("✅ DATABASE WIPED.");
}

async function seedGoldenRecord() {
    console.log("🌱 SEEDING GOLDEN RECORD (Alex Mercer)...");
    const batch = writeBatch(db);
    const now = new Date();

    // --- IDs ---
    const uid = 'user_alex_mercer';
    const repId = 'rep_admin';
    const engId = `eng_${uid}`;
    const intakeId = `intake_${uid}`;
    const contactId = `contact_${uid}`;
    const companyId_stripe = `comp_stripe`;
    const companyId_target = `comp_target`;
    const companyId_anthropic = `comp_anthropic`;

    // 1. Admin/Rep User (so we can log in to view)
    const adminRef = doc(db, 'users', repId);
    batch.set(adminRef, {
        uid: repId,
        email: 'admin@repteam.com',
        role: 'rep',
        profile: {
            name: "Admin Rep",
            status: "active",
            headline: "Super Admin",
            bio_short: "System Admin",
            firstName: "Admin",
            lastName: "User"
        }
    });

    // 2. Client User (Alex Mercer)
    const userRef = doc(db, 'users', uid);
    batch.set(userRef, {
        uid,
        email: 'alex.mercer@example.com',
        role: 'client',
        profile: {
            name: 'Alex Mercer',
            status: 'searching', // Matches "Active Pipeline" context
            pod: '04 (M. Ross)',
            headline: 'Senior Product Manager @ FinTech',
            bio_long: 'Senior PM with 7 years experience in payments infrastructure...',
            bio_short: 'Product Leader in Payments',
            pitch: 'I build payments infrastructure that scales.',
            repId: repId,
            contactId: contactId
        }
    });

    // 3. Contact Record
    const contactRef = doc(db, 'contacts', contactId);
    batch.set(contactRef, {
        id: contactId,
        userId: uid,
        firstName: 'Alex',
        lastName: 'Mercer',
        email: 'alex.mercer@example.com',
        type: 'client',
        companyId: companyId_stripe, // Current company
        createdAt: now
    });

    // 4. Companies
    // A. Stripe (Current)
    const compStripeRef = doc(db, 'companies', companyId_stripe);
    batch.set(compStripeRef, { id: companyId_stripe, name: 'Stripe', domain: 'stripe.com', type: 'target', status: 'active', createdAt: now.toISOString() });

    // B. Target (Pending Rec)
    const compTargetRef = doc(db, 'companies', companyId_target);
    batch.set(compTargetRef, { id: companyId_target, name: 'Target Corp', domain: 'target.com', type: 'target', status: 'active', createdAt: now.toISOString() });

    // C. Anthropic (Pending Rec)
    const compAnthropicRef = doc(db, 'companies', companyId_anthropic);
    batch.set(compAnthropicRef, { id: companyId_anthropic, name: 'Anthropic', domain: 'anthropic.com', type: 'target', status: 'active', createdAt: now.toISOString() });


    // 5. Intake Response (The Source of Truth)
    const intakeRef = doc(db, 'intake_responses', intakeId);
    const intakeData: IntakeResponse = {
        id: intakeId,
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
            secondaryArc: 'Founder',
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
            resumeFile: 'resume_v1.pdf',

        },
        filters: { // Although legacy, Intake still has it structurally if we follow original type, but our new Schema uses buckets.
            hardConstraints: {
                minBase: 220000,
                minTotalComp: 350000,
                minLevel: 6,
                maxCommuteMinutes: 45,
                relocationWillingness: true
            },
            softPreferences: {
                preferredIndustries: ['FinTech', 'Crypto', 'AI'],
                avoidIndustries: ['AdTech', 'Gaming'],
                preferredFunctions: ['Product', 'Strategy'],
                workStyle: 'hybrid'
            }
        }
    };
    batch.set(intakeRef, intakeData);


    // 6. Client Engagement (The Master Container)
    const engRef = doc(db, 'engagements', engId);
    const engagementData: Engagement = {
        id: engId,
        userId: uid,
        repId: repId,
        status: 'active',
        startDate: new Date(now.getTime() - (86400000 * 30)).toISOString(), // Started 30 days ago
        isaPercentage: 0.15,
        assets: [],

        // --- Semantic Buckets (Hydrated) ---
        profile: {
            firstName: 'Alex',
            lastName: 'Mercer',
            headline: 'Senior Product Manager @ FinTech',
            pod: '04 (M. Ross)',
            bio_short: 'Product Leader in Payments',

            // From Intake
            currentTitle: intakeData.profile.currentTitle,
            currentCompany: intakeData.profile.currentCompany,
            industry: intakeData.profile.industry,
            experienceBand: intakeData.profile.experienceBand,
            marketIdentity: intakeData.marketIdentity
        },

        strategy: {
            trajectory: intakeData.trajectory,
            horizon: intakeData.horizon,
            ownership: intakeData.ownership,
            authority: intakeData.authority,
            comp: {
                orientation: intakeData.comp.orientation,
                riskPosture: intakeData.comp.riskPosture,
                successSignals: intakeData.comp.successSignals
            }
        },

        targetParameters: {
            ...intakeData.filters.hardConstraints,
            ...intakeData.filters.softPreferences
        }
    };
    batch.set(engRef, engagementData);


    // 7. Active Pipeline (Job Pursuit) - "Stripe"
    const pursuitId = `pursuit_${uid}_stripe`;
    const pursuitRef = doc(db, 'job_pursuits', pursuitId);
    batch.set(pursuitRef, {
        id: pursuitId,
        targetId: `target_${uid}_stripe`, // Virtual target
        userId: uid,
        engagementId: engId,
        companyId: companyId_stripe,
        company: "Stripe",
        role: "Product Lead, Issuing",
        status: "interviewing",
        stage_detail: "Onsite Scheduled",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        financials: {
            base: 240000,
            bonus: 40000,
            equity: '0.05%',
            rep_net_value: 1200000 // (240k * 5y?? or just raw value) - using arbitrary logical value
        }
    });

    // 8. Pending Recommendations (Target & Anthropic)
    // Rec 1: Target
    const rec1Id = `rec_${uid}_target`;
    const target1Id = `target_${uid}_target`;
    const rec1Ref = doc(db, 'job_recommendations', rec1Id);

    // Create underlying target first (virtual or real, schema says JobTarget exists)
    const target1Ref = doc(db, 'job_targets', target1Id);
    batch.set(target1Ref, {
        id: target1Id,
        company: "Target Corp",
        role: "VP Engineering",
        status: "OPEN",
        source: "manual",
        createdAt: now.toISOString(),
        financials: { base: 300000, bonus: 50000, equity: "High", rep_net_value: 0 }
    });

    batch.set(rec1Ref, {
        id: rec1Id,
        engagementId: engId,
        targetId: target1Id,
        status: 'pending_client',
        source: 'manual',
        rep_notes: "Strong retail footprint needing modernization.",
        createdAt: now.toISOString(),
        // Denormalized Target for easy display
        target: {
            company: "Target Corp",
            role: "VP Engineering"
        }
    });


    // Rec 2: Anthropic
    const rec2Id = `rec_${uid}_anthropic`;
    const target2Id = `target_${uid}_anthropic`;
    const rec2Ref = doc(db, 'job_recommendations', rec2Id);

    const target2Ref = doc(db, 'job_targets', target2Id);
    batch.set(target2Ref, {
        id: target2Id,
        company: "Anthropic",
        role: "Product Lead",
        status: "OPEN",
        source: "manual",
        createdAt: now.toISOString(),
        financials: { base: 280000, bonus: 20000, equity: "High", rep_net_value: 0 }
    });

    batch.set(rec2Ref, {
        id: rec2Id,
        engagementId: engId,
        targetId: target2Id,
        status: 'pending_client',
        source: 'manual',
        rep_notes: "Perfect fit for your AI interest.",
        createdAt: now.toISOString(),
        target: {
            company: "Anthropic",
            role: "Product Lead"
        }
    });

    await batch.commit();
    console.log("✅ GOLDEN RECORD SEEDED.");
    console.log(`   User ID: ${uid}`);
    console.log(`   Eng ID:  ${engId}`);
}

// Execute
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    wipeDatabase()
        .then(() => seedGoldenRecord())
        .then(() => {
            console.log("🚀 Reseed Complete. Please hard refresh the app.");
            process.exit(0);
        })
        .catch((e) => {
            console.error("❌ Reseed Failed:", e);
            process.exit(1);
        });
}
