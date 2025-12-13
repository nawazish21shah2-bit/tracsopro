/**
 * Stripe Configuration
 * Centralized Stripe publishable key configuration
 */

// Stripe Publishable Key (Test Mode)
// ⚠️ For production, use environment variables or secure config
// ⚠️ IMPORTANT: Replace with your actual Stripe publishable key from https://dashboard.stripe.com/test/apikeys
// Set this via environment variable or replace the placeholder
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE';

// Stripe Configuration
export const STRIPE_CONFIG = {
  publishableKey: STRIPE_PUBLISHABLE_KEY,
  merchantIdentifier: 'merchant.com.tracsopro', // For Apple Pay (iOS)
  // Set to true when using live keys
  isTestMode: true,
};



