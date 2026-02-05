import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { StripeService } from '../services/stripeService';

const stripeService = new StripeService();
const db = admin.firestore();
const ISA_PRICE_ID = 'price_isa_placeholder'; // Should be environmentally configured

export const onClientPlaced = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        // Check if status changed to 'placed'
        if (before.status !== 'placed' && after.status === 'placed') {
            const userId = context.params.userId;
            console.log(`Processing placement for user ${userId}`);

            try {
                // 1. Get Financial Subscription Doc
                const subscriptionQuery = await db.collection('financial_subscriptions')
                    .where('userId', '==', db.doc(`users/${userId}`))
                    .limit(1)
                    .get();

                if (subscriptionQuery.empty) {
                    console.error(`No financial subscription found for user ${userId}`);
                    return;
                }

                const subDoc = subscriptionQuery.docs[0];
                const subData = subDoc.data();
                const repStripeCustomerId = subData.stripeCustomerId;
                const repSubscriptionId = subData.stripeSubscriptionId;
                const repPaymentMethodId = subData.defaultPaymentMethodId;

                if (!repStripeCustomerId || !repSubscriptionId || !repPaymentMethodId) {
                    console.error("Missing Stripe data in subscription doc");
                    return;
                }

                // 2. Cancel Retainer on Rep Account
                console.log(`Canceling Retainer sub: ${repSubscriptionId}`);
                await stripeService.cancelRetainerSubscription(repSubscriptionId);

                // 3. Clone Payment Method to CPF Services
                const userEmail = after.profile?.email || `user_${userId}@example.com`;
                const newCpfCustomer = await stripeService.createCpfCustomer(userEmail, after.profile?.name || 'Valued Client');
                const cpfCustomerId = newCpfCustomer.id;

                console.log(`Cloning Payment Method ${repPaymentMethodId} to CPF Customer ${cpfCustomerId}`);
                const cpfPaymentMethod = await stripeService.clonePaymentMethodToCpf(repPaymentMethodId, cpfCustomerId);

                // 4. Create ISA Subscription on CPF Services
                const startDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
                console.log(`Creating ISA Subscription starting at ${startDate}`);

                const isaSub = await stripeService.createIsaSubscription(
                    cpfCustomerId,
                    ISA_PRICE_ID,
                    cpfPaymentMethod.id,
                    startDate
                );

                // 5. Update Firestore
                await subDoc.ref.update({
                    plan: 'isa_agreement',
                    status: 'active',
                    cpfStripeCustomerId: cpfCustomerId,
                    cpfStripeSubscriptionId: isaSub.id,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                console.log("Token Transfer and ISA Activation Complete.");

            } catch (error) {
                console.error("Error in onClientPlaced trigger:", error);
            }
        }
    });
