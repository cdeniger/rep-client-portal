import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const onIntakeCreated = functions.firestore
    .document('intake_responses/{intakeId}')
    .onCreate(async (snap, context) => {
        const intakeData = snap.data();
        const userId = intakeData.userId; // Assuming userId is on the intake doc

        if (!userId) {
            console.log('No userId on intake document, skipping hydration.');
            return;
        }

        console.log(`Processing Intake ${context.params.intakeId} for User ${userId}`);

        try {
            // 1. Check if Engagement already exists
            const engagementQuery = await db.collection('engagements')
                .where('userId', '==', userId)
                .limit(1)
                .get();

            if (!engagementQuery.empty) {
                console.log(`Engagement already exists for user ${userId}. Skipping auto-creation.`);
                return;
            }

            // 2. Map Data (Strict schema alignment)
            // We assume intakeData matches the expected IntakeResponse structure

            const newEngagement = {
                userId: userId,
                status: 'active', // Default status
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),

                // Profile Mapping
                profile: {
                    firstName: intakeData.profile?.firstName, // Assuming these might exist in intake, or we handle them gracefully
                    lastName: intakeData.profile?.lastName,
                    headline: intakeData.profile?.headline || intakeData.profile?.currentTitle, // Fallback
                    pod: intakeData.profile?.industry || 'General', // Fallback

                    // Direct Hydration
                    currentTitle: intakeData.profile?.currentTitle,
                    currentCompany: intakeData.profile?.currentCompany,
                    industry: intakeData.profile?.industry,
                    experienceBand: intakeData.profile?.experienceBand,
                    marketIdentity: intakeData.marketIdentity
                },

                // Strategy Mapping (Direct copy of buckets)
                strategy: {
                    trajectory: intakeData.trajectory,
                    horizon: intakeData.horizon,
                    ownership: intakeData.ownership,
                    authority: intakeData.authority,
                    comp: intakeData.comp
                },

                // Target Parameters (Hard & Soft Constraints)
                targetParameters: {
                    // Hard Constraints
                    minBase: intakeData.filters?.hardConstraints?.minBase,
                    minTotalComp: intakeData.filters?.hardConstraints?.minTotalComp,
                    minLevel: intakeData.filters?.hardConstraints?.minLevel,
                    maxCommuteMinutes: intakeData.filters?.hardConstraints?.maxCommuteMinutes,
                    relocationWillingness: intakeData.filters?.hardConstraints?.relocationWillingness,

                    // Soft Preferences
                    preferredIndustries: intakeData.filters?.softPreferences?.preferredIndustries,
                    avoidIndustries: intakeData.filters?.softPreferences?.avoidIndustries,
                    preferredFunctions: intakeData.filters?.softPreferences?.preferredFunctions,
                    workStyle: intakeData.filters?.softPreferences?.workStyle
                }
            };

            // 3. Create Engagement
            await db.collection('engagements').add(newEngagement);
            console.log(`Created new Engagement for user ${userId} from Intake.`);

        } catch (error) {
            console.error('Error hydrating engagement from intake:', error);
        }
    });
