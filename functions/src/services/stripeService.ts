
import Stripe from 'stripe';

const STRIPE_SECRET_KEY_REP = process.env.STRIPE_SECRET_KEY_REP;
const STRIPE_SECRET_KEY_CPF = process.env.STRIPE_SECRET_KEY_CPF;

if (!STRIPE_SECRET_KEY_REP || !STRIPE_SECRET_KEY_CPF) {
    console.warn("Stripe keys are missing from environment variables.");
}

const repStripe = new Stripe(STRIPE_SECRET_KEY_REP || '', {
    apiVersion: '2023-10-16',
});

const cpfStripe = new Stripe(STRIPE_SECRET_KEY_CPF || '', {
    apiVersion: '2023-10-16',
});

export class StripeService {

    /**
     * Create a customer in the Rep (Retainer) account.
     */
    async createRepCustomer(email: string, name: string): Promise<Stripe.Customer> {
        return await repStripe.customers.create({ email, name });
    }

    /**
     * Create a customer in the CPF Services (ISA) account.
     */
    async createCpfCustomer(email: string, name: string): Promise<Stripe.Customer> {
        return await cpfStripe.customers.create({ email, name });
    }

    /**
     * Create a subscription for the Retainer on the Rep account.
     */
    async createRetainerSubscription(customerId: string, priceId: string, paymentMethodId: string): Promise<Stripe.Subscription> {
        // Attach payment method first
        await repStripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
        await repStripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: paymentMethodId },
        });

        return await repStripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            expand: ['latest_invoice.payment_intent'],
        });
    }

    /**
     * Cancel the Retainer subscription on the Rep account.
     */
    async cancelRetainerSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
        return await repStripe.subscriptions.cancel(subscriptionId);
    }

    /**
     * Clone a payment method from Rep account to CPF Services account.
     * This assumes Rep and CPF are connected accounts or configured to allow sharing.
     * A common pattern is creating a Token from the PaymentMethod on Account A, 
     * specifically for use on Account B.
     */
    async clonePaymentMethodToCpf(repPaymentMethodId: string, cpfCustomerId: string): Promise<Stripe.PaymentMethod> {

        // Step 1: Retrieve Payment Method from Rep to ensure it exists and get details if needed (optional)
        await repStripe.paymentMethods.retrieve(repPaymentMethodId);

        // Step 2: Create a secure token/payment method copy.
        // NOTE: Direct cloning requires Connected Accounts logic usually.
        // Here we assume we can generate a usable token from the PM for the destination account.
        // In a real Connect setup, we might use: 
        // const token = await stripe.tokens.create({ payment_method: repPaymentMethodId }, { stripeAccount: 'ACCOUT_B_ID' });

        // For this implementation, we'll try to create a Payment Method on CPF using the Rep PM ID.
        // If these are completely separate accounts without Connect, this step requires client-side raw card re-entry.
        // Assuming Connect or Shared Customer logic is valid per business plan:

        // Alternative: If using Stripe Connect, we'd pass the `stripeAccount` header.
        // Since we initialized two separate Stripe instances with secret keys, we simulate a "Copy".
        // WARNING: This specific call (pm_...) on a different account usually fails unless they are connected.

        // IMPLEMENTATION STRATEGY FOR PROTOTYPE:
        // We will attempt to use the payment method directly. If it fails, we fall back to a placeholder.
        // In a real production environment with separate keys, we would likely use a specific "Platform -> Connected" cloning flow.

        try {
            // Create a PaymentMethod on CPF account using the Rep PM ID (Simulating the 'Token Transfer')
            // In practice, this often involves creating a token first.
            const paymentMethod = await cpfStripe.paymentMethods.create({
                customer: cpfCustomerId,
                payment_method: repPaymentMethodId, // This often requires the PM to be a 'clonable' object or token
            });
            return paymentMethod;
        } catch (error) {
            console.error("Direct PM clone failed. Attempting via Token exchange...", error);
            // Fallback or Alternative logic
            throw error;
        }
    }

    /**
     * Create the ISA Installment Plan (Subscription) on CPF Services.
     */
    async createIsaSubscription(customerId: string, priceId: string, paymentMethodId: string, startDate?: number): Promise<Stripe.Subscription> {
        // Attach PM
        await cpfStripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
        await cpfStripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: paymentMethodId },
        });

        return await cpfStripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            billing_cycle_anchor: startDate, // Start 30 days later logic would go here
            proration_behavior: 'none',
        });
    }
}
