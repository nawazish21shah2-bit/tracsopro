#!/usr/bin/env node
/**
 * Scan repository files for common secret patterns.
 * Usage: node scan-secrets.mjs --all | --staged
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const mode = args.includes('--staged') ? 'staged' : 'all';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');

const ALLOWLIST_PATHS = [
  /node_modules/,
  /\.git\//,
  /package-lock\.json$/,
  /scan-secrets\.mjs$/,
  /\.env\.example$/,
  /ENVIRONMENT_VARIABLES\.md$/,
  /DEPLOYMENT_GUIDE\.md$/,
  /tests\//,
  /__tests__\//,
  /\.test\.(ts|tsx|js)$/,
  /seed\.ts$/,
  /google-services\.json\.example$/,
];

const PATTERNS = [
  { name: 'stripe_live_secret', regex: /sk_live_[a-zA-Z0-9]{16,}/ },
  { name: 'aws_access_key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'private_key', regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'jwt_hardcoded', regex: /JWT_SECRET\s*=\s*['"][^'"]{8,}['"]/ },
  { name: 'generic_api_key', regex: /api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/i },
];

function isAllowlisted(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  return ALLOWLIST_PATHS.some((p) => p.test(rel));
}

function getFiles() {
  if (mode === 'staged') {
    try {
      const out = execSync('git diff --cached --name-only --diff-filter=ACM', {
        cwd: ROOT,
        encoding: 'utf8',
      });
      return out
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean)
        .map((f) => path.join(ROOT, f))
        .filter((f) => fs.existsSync(f) && fs.statSync(f).isFile());
    } catch {
      return [];
    }
  }

  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        walk(full);
      } else if (!isAllowlisted(full)) {
        files.push(full);
      }
    }
  }
  walk(ROOT);
  return files;
}

const findings = [];

for (const file of getFiles()) {
  if (isAllowlisted(file)) continue;
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  if (content.length > 2_000_000) continue;

  for (const { name, regex } of PATTERNS) {
    if (regex.test(content)) {
      findings.push({ file: path.relative(ROOT, file), pattern: name });
    }
  }
}

if (findings.length > 0) {
  console.error('Secret scan failed:');
  for (const f of findings) {
    console.error(`  [${f.pattern}] ${f.file}`);
  }
  process.exit(1);
}

console.log(`Secret scan passed (${mode}, ${getFiles().length} files checked)`);
