#!/usr/bin/env node
// Bulk update users via Prisma (verify email, reset password, change role)

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Load .env from backend root even if CWD is scripts/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const prisma = new PrismaClient();

// Edit this list as needed
const targets = [
  // Examples from your DB screenshot
  { email: 'guard@so.com', newPassword: 'Passw0rd!', verifyEmail: true, role: 'GUARD' },
  { email: 'guard2@example.com', newPassword: 'Passw0rd!', verifyEmail: true, role: 'GUARD' },
  { email: 'supervisor1@example.com', newPassword: 'Passw0rd!', verifyEmail: true, role: 'SUPERVISOR' },
  { email: 'admin@example.com', newPassword: 'Passw0rd!', verifyEmail: true, role: 'ADMIN' },
];

async function run() {
  let updated = 0;

  for (const t of targets) {
    const email = t.email.toLowerCase();
    const data = {};

    if (typeof t.verifyEmail === 'boolean') {
      data.isEmailVerified = t.verifyEmail;
    }

    if (t.newPassword) {
      const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
      data.password = await bcrypt.hash(t.newPassword, rounds);
    }

    if (t.role) {
      data.role = t.role; // 'GUARD' | 'SUPERVISOR' | 'ADMIN' | 'CLIENT'
    }

    if (Object.keys(data).length === 0) {
      // No changes
      continue;
    }

    try {
      const user = await prisma.user.update({
        where: { email },
        data,
        select: { id: true, email: true, role: true, isEmailVerified: true }
      });
      console.log(`Updated ${user.email} role=${user.role} verified=${user.isEmailVerified}`);
      updated++;
    } catch (e) {
      if (e.code === 'P2025') {
        console.log(`Not found: ${email}`);
      } else {
        console.error(`Failed for ${email}:`, e.message || e);
      }
    }
  }

  console.log(`Done. Users updated: ${updated}`);
}

run()
  .catch((e) => {
    console.error('❌ Script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
