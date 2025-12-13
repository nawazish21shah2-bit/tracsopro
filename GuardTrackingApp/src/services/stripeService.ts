/**
 * Stripe Service - Wrapper for Stripe React Native SDK
 */

import { initStripe } from '@stripe/stripe-react-native';

// Get publishable key from environment or config
// In production, this should come from environment variables
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here';

class StripeService {
  private initialized: boolean = false;

  /**
   * Initialize Stripe with publishable key
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Use publishable key from config or fallback
      // ⚠️ IMPORTANT: Replace with your actual Stripe publishable key from https://dashboard.stripe.com/test/apikeys
      const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE';
      
      await initStripe({
        publishableKey,
        merchantIdentifier: 'merchant.com.tracsopro', // iOS only
      });
      this.initialized = true;
      console.log('Stripe initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      throw error;
    }
  }

  /**
   * Check if Stripe is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export default new StripeService();

