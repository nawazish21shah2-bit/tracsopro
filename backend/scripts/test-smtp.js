/**
 * Verify SMTP connection using backend/.env
 * Usage: node scripts/test-smtp.js
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

if (!SMTP_USER || !SMTP_PASS) {
  console.error('❌ SMTP_USER and SMTP_PASS must be set in backend/.env');
  process.exit(1);
}

const smtpPass = (SMTP_PASS || '').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(SMTP_PORT || '587', 10),
  secure: SMTP_PORT === '465',
  auth: { user: SMTP_USER, pass: smtpPass },
});

console.log('🔍 Testing SMTP connection...');
console.log(`   Host: ${SMTP_HOST || 'smtp.gmail.com'}`);
console.log(`   Port: ${SMTP_PORT || '587'}`);
console.log(`   User: ${SMTP_USER}`);

try {
  await transporter.verify();
  console.log('✅ SMTP connection successful — credentials are valid.');
  console.log('   Restart the backend if it was running before you updated .env');
} catch (error) {
  console.error('❌ SMTP failed:', error.message);
  if (error.code === 'EAUTH') {
    console.error('\nGmail tips:');
    console.error('  1. Enable 2-Step Verification on your Google account');
    console.error('  2. Create an App Password: https://myaccount.google.com/apppasswords');
    console.error('  3. Use the 16-character app password as SMTP_PASS (no spaces)');
    console.error('  4. SMTP_USER must match the Gmail address exactly');
  }
  process.exit(1);
}
