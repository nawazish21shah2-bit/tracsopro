#!/usr/bin/env node
/**
 * Lightweight secret scanner for pre-commit / CI fallback.
 * Usage:
 *   node scripts/scan-secrets.mjs --staged
 *   node scripts/scan-secrets.mjs --all
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const IGNORE_PATHS = [
  /^node_modules\//,
  /^\.git\//,
  /^backend\/node_modules\//,
  /^GuardTrackingApp\/node_modules\//,
  /^backend\/uploads\//,
  /^\.env$/,
  /^backend\/\.env$/,
  /^GuardTrackingApp\/\.env$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.webp$/,
  /\.lock$/,
  /\.ttf$/,
  /\.jar$/,
  /\.zip$/,
  /\.bundle$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /^GuardTrackingApp\/android\//,
  /^GuardTrackingApp\/ios\//,
  /\.md$/,
];

const SCAN_PREFIXES = [
  'backend/src/',
  'backend/prisma/',
  'backend/scripts/',
  'backend/tests/',
  'GuardTrackingApp/src/',
  '.github/',
  '.gitleaks.toml',
  '.pre-commit-config.yaml',
];

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.yaml',
  '.yml',
  '.toml',
]);

const IGNORE_CONTENT = [
  /replace-with-a-long-random-secret/,
  /postgresql:\/\/USER:PASSWORD@/,
  /integration-test-jwt-secret/,
  /ci-integration-test-jwt-secret/,
  /dev-secret-change-me-in-production/,
  /sk_test_/,
  /pk_test_/,
  /whsec_replace/,
];

const RULES = [
  { name: 'AWS access key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private key block', regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Stripe live secret', regex: /sk_live_[0-9a-zA-Z]{16,}/ },
  { name: 'Stripe live publishable', regex: /pk_live_[0-9a-zA-Z]{16,}/ },
  { name: 'GitHub token', regex: /ghp_[A-Za-z0-9]{20,}/ },
  { name: 'Slack token', regex: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  {
    name: 'Hardcoded JWT secret assignment',
    regex: /JWT_SECRET\s*=\s*['"][^'"\s]{16,}['"]/,
    skip: /test|replace|example|changeme|your_|dev-secret|integration-test|ci-integration/i,
  },
  {
    name: 'Database URL with credentials',
    regex: /postgresql:\/\/(?!USER:PASSWORD|username:password|user:pass|postgres:postgres@)[^/\s:@]+:[^@\s/]+@/,
  },
];

function shouldIgnore(relativePath) {
  return IGNORE_PATHS.some((pattern) => pattern.test(relativePath));
}

function shouldScan(relativePath) {
  if (shouldIgnore(relativePath)) return false;
  if (!SCAN_PREFIXES.some((prefix) => relativePath.startsWith(prefix) || relativePath === prefix)) {
    return false;
  }
  if (relativePath.endsWith('.env.example')) return true;
  const ext = path.extname(relativePath);
  return TEXT_EXTENSIONS.has(ext);
}

function getFiles(mode) {
  if (mode === '--staged') {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    return output ? output.split('\n') : [];
  }

  const output = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).trim();
  return output ? output.split('\n') : [];
}

function scanFile(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!existsSync(fullPath)) return [];

  let content;
  try {
    content = readFileSync(fullPath, 'utf8');
  } catch {
    return [];
  }

  const findings = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (IGNORE_CONTENT.some((pattern) => pattern.test(line))) continue;

    for (const rule of RULES) {
      if (rule.skip && rule.skip.test(line)) continue;
      if (rule.regex.test(line)) {
        findings.push({
          file: relativePath,
          line: i + 1,
          rule: rule.name,
          snippet: line.trim().slice(0, 120),
        });
      }
    }
  }

  return findings;
}

function main() {
  const mode = process.argv[2] || '--all';
  if (!['--staged', '--all'].includes(mode)) {
    console.error('Usage: node scripts/scan-secrets.mjs [--staged|--all]');
    process.exit(1);
  }

  const files = getFiles(mode).filter(shouldScan);
  const findings = files.flatMap(scanFile);

  if (findings.length === 0) {
    console.log(`Secret scan passed (${files.length} file(s) checked).`);
    process.exit(0);
  }

  console.error(`Secret scan failed: ${findings.length} potential secret(s) found.\n`);
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.rule}] ${finding.snippet}`);
  }
  process.exit(1);
}

main();
