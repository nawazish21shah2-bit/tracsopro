/**
 * Script to fetch Stripe Price IDs from your Stripe account
 * Run this to get all your price IDs for the .env file
 *
 * Usage: node scripts/get-stripe-prices.js
 */

import Stripe from 'stripe';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey || secretKey.includes('YOUR_STRIPE_SECRET_KEY')) {
  console.error('❌ STRIPE_SECRET_KEY is missing or still a placeholder in backend/.env');
  console.error('   Get your test key from: https://dashboard.stripe.com/test/apikeys');
  process.exit(1);
}

const stripe = new Stripe(secretKey);

async function getStripePrices() {
  try {
    console.log('🔍 Fetching products and prices from Stripe...\n');

    // Get all products
    const products = await stripe.products.list({ limit: 100, active: true });
    
    console.log(`Found ${products.data.length} products:\n`);

    const priceMap = {
      BASIC: { monthly: null, yearly: null },
      PROFESSIONAL: { monthly: null, yearly: null },
      ENTERPRISE: { monthly: null, yearly: null },
    };

    // Get prices for each product
    for (const product of products.data) {
      const prices = await stripe.prices.list({ product: product.id, limit: 100 });
      
      console.log(`📦 ${product.name}:`);
      console.log(`   Product ID: ${product.id}`);
      
      for (const price of prices.data) {
        const interval = price.recurring?.interval || 'one_time';
        const amount = (price.unit_amount / 100).toFixed(2);
        const currency = price.currency.toUpperCase();
        
        console.log(`   - ${interval.toUpperCase()}: $${amount} ${currency} (Price ID: ${price.id})`);
        
        // Map to our plan structure
        const productName = product.name.toUpperCase();
        if (productName.includes('BASIC')) {
          if (interval === 'month') priceMap.BASIC.monthly = price.id;
          if (interval === 'year') priceMap.BASIC.yearly = price.id;
        } else if (productName.includes('PROFESSIONAL')) {
          if (interval === 'month') priceMap.PROFESSIONAL.monthly = price.id;
          if (interval === 'year') priceMap.PROFESSIONAL.yearly = price.id;
        } else if (productName.includes('ENTERPRISE')) {
          if (interval === 'month') priceMap.ENTERPRISE.monthly = price.id;
          if (interval === 'year') priceMap.ENTERPRISE.yearly = price.id;
        }
      }
      console.log('');
    }

    // Output .env format
    console.log('\n📋 Add these to your .env file:\n');
    console.log('# Stripe Price IDs');
    if (priceMap.BASIC.monthly) console.log(`STRIPE_PRICE_BASIC_MONTHLY=${priceMap.BASIC.monthly}`);
    if (priceMap.BASIC.yearly) console.log(`STRIPE_PRICE_BASIC_YEARLY=${priceMap.BASIC.yearly}`);
    if (priceMap.PROFESSIONAL.monthly) console.log(`STRIPE_PRICE_PROF_MONTHLY=${priceMap.PROFESSIONAL.monthly}`);
    if (priceMap.PROFESSIONAL.yearly) console.log(`STRIPE_PRICE_PROF_YEARLY=${priceMap.PROFESSIONAL.yearly}`);
    if (priceMap.ENTERPRISE.monthly) console.log(`STRIPE_PRICE_ENTERPRISE_MONTHLY=${priceMap.ENTERPRISE.monthly}`);
    if (priceMap.ENTERPRISE.yearly) console.log(`STRIPE_PRICE_ENTERPRISE_YEARLY=${priceMap.ENTERPRISE.yearly}`);

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error fetching Stripe prices:', error.message);
    process.exit(1);
  }
}

getStripePrices();

