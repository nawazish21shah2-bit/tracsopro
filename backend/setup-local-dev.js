#!/usr/bin/env node
/**
 * Setup script for local development
 * This script creates/updates .env file for local development with SQLite database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

const localDevEnv = `# Development Environment Configuration
NODE_ENV=development
PORT=3000

# Database - Using SQLite for local development
# For production, use PostgreSQL: postgresql://user:password@host:port/database
DATABASE_URL="file:./prisma/dev.db"

# JWT Configuration
JWT_SECRET=dev-secret-change-me-in-production
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_EXPIRES_IN=7d

# OTP Configuration
OTP_ENABLED=true
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_RATE_LIMIT_WINDOW=300000
OTP_RATE_LIMIT_MAX=3

# Email Configuration (SMTP) - Optional for dev
# If not configured, OTP will be bypassed in dev mode
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@tracsopro.com

# Password Hashing
BCRYPT_ROUNDS=10

# CORS - Allow all origins in dev
CORS_ORIGIN=*

# Logging
LOG_LEVEL=debug

# Stripe (Optional - for payment features)
STRIPE_SECRET_KEY=
STRIPE_SUCCESS_URL=http://localhost:3000/success
STRIPE_CANCEL_URL=http://localhost:3000/cancel
BILLING_PORTAL_RETURN_URL=http://localhost:3000/account
BILLING_CURRENCY=USD
`;

try {
  // Check if .env exists
  if (fs.existsSync(envPath)) {
    console.log('📄 .env file already exists');
    console.log('⚠️  To use local SQLite database, update DATABASE_URL in .env to:');
    console.log('   DATABASE_URL="file:./prisma/dev.db"');
    console.log('   NODE_ENV=development');
    console.log('\nOr run this script with --force to overwrite: node setup-local-dev.js --force');
    
    if (process.argv.includes('--force')) {
      fs.writeFileSync(envPath, localDevEnv);
      console.log('✅ .env file updated for local development');
    }
  } else {
    fs.writeFileSync(envPath, localDevEnv);
    console.log('✅ .env file created for local development');
  }
  
  // Also create .env.example if it doesn't exist
  if (!fs.existsSync(envExamplePath)) {
    fs.writeFileSync(envExamplePath, localDevEnv);
    console.log('✅ .env.example file created');
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. Make sure Prisma schema supports SQLite (or use local PostgreSQL)');
  console.log('2. Run: npm run db:setup');
  console.log('3. Start server: npm run dev:db');
  
} catch (error) {
  console.error('❌ Error setting up .env file:', error.message);
  process.exit(1);
}


