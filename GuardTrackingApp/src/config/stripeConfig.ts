/**
 * Stripe Configuration
 * Centralized Stripe publishable key configuration
 */

// Stripe Publishable Key (Test Mode)
// ⚠️ For production, use environment variables or secure config
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SVpTpLEsN8TIkgKDnKDuj9xtgOWuO2SMQ0RtbCIsnxjuO7bVzn4SOvBhEnQZbOhozpwVZOPFeDWTdUo7Tc03sJj002Mdzdgkg';

// Stripe Configuration
export const STRIPE_CONFIG = {
  publishableKey: STRIPE_PUBLISHABLE_KEY,
  merchantIdentifier: 'merchant.com.tracsopro', // For Apple Pay (iOS)
  // Set to true when using live keys
  isTestMode: true,
};



