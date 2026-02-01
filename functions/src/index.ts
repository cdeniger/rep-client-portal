import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { StripeService } from './services/stripeService';

admin.initializeApp();
const db = admin.firestore();
const stripeService = new StripeService();

// Constants
const ISA_PRICE_ID = 'price_isa_placeholder'; // This would come from config/env

export { onIntakeCreated } from './triggers/onIntakeCreated';
export { provisionClient } from './provisionClient';
export { onApplicationCreate } from './triggers/onApplicationCreate';


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
                const repPaymentMethodId = subData.defaultPaymentMethodId; // Assuming we stored this

                if (!repStripeCustomerId || !repSubscriptionId || !repPaymentMethodId) {
                    console.error("Missing Stripe data in subscription doc");
                    return;
                }

                // 2. Cancel Retainer on Rep Account
                console.log(`Canceling Retainer sub: ${repSubscriptionId}`);
                await stripeService.cancelRetainerSubscription(repSubscriptionId);

                // 3. Clone Payment Method to CPF Services
                // First, ensure/find CPF Customer. 
                // Ideally we stored cpfCustomerId if it existed, or we create one now matching the email.
                // For now, we'll create a new customer on CPF for this user.
                const userEmail = after.profile?.email || `user_${userId}@example.com`; // Fallback
                const newCpfCustomer = await stripeService.createCpfCustomer(userEmail, after.profile?.name || 'Valued Client');
                const cpfCustomerId = newCpfCustomer.id;

                console.log(`Cloning Payment Method ${repPaymentMethodId} to CPF Customer ${cpfCustomerId}`);
                const cpfPaymentMethod = await stripeService.clonePaymentMethodToCpf(repPaymentMethodId, cpfCustomerId);

                // 4. Create ISA Subscription on CPF Services
                // Start date: 30 days from now? 
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
                    status: 'active', // or 'scheduled'
                    cpfStripeCustomerId: cpfCustomerId,
                    cpfStripeSubscriptionId: isaSub.id,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                console.log("Token Transfer and ISA Activation Complete.");

            } catch (error) {
                console.error("Error in onClientPlaced trigger:", error);
                // TODO: Implement alert/notification for manual intervention
            }
        }
    });
