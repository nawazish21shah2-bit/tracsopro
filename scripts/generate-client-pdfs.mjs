#!/usr/bin/env node
/**
 * Generate client delivery PDFs from markdown into docs/
 * Usage: node scripts/generate-client-pdfs.mjs
 */
import { mdToPdf } from 'md-to-pdf';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const docsDir = join(repoRoot, 'docs');
const stylePath = join(docsDir, 'pdf-style.css');

const documents = [
  { src: join(repoRoot, 'CLIENT_HANDOFF.md'), out: 'CLIENT_HANDOFF.pdf', title: 'TracSOpro Client Handoff' },
  { src: join(repoRoot, 'ENVIRONMENT_VARIABLES.md'), out: 'ENVIRONMENT_VARIABLES.pdf', title: 'Environment Variables' },
  { src: join(docsDir, 'DEPLOYMENT_GUIDE.md'), out: 'DEPLOYMENT_GUIDE.pdf', title: 'Deployment Guide' },
  { src: join(docsDir, 'USER_GUIDE.md'), out: 'USER_GUIDE.pdf', title: 'User Guide' },
  { src: join(docsDir, 'TROUBLESHOOTING.md'), out: 'TROUBLESHOOTING.pdf', title: 'Troubleshooting' },
  { src: join(docsDir, 'SYSTEM_ARCHITECTURE.md'), out: 'SYSTEM_ARCHITECTURE.pdf', title: 'System Architecture' },
  { src: join(docsDir, 'API_REFERENCE.md'), out: 'API_REFERENCE.pdf', title: 'API Reference' },
  { src: join(docsDir, 'DATABASE_SCHEMA.md'), out: 'DATABASE_SCHEMA.pdf', title: 'Database Schema' },
  { src: join(docsDir, 'MOBILE_APP_ARCHITECTURE.md'), out: 'MOBILE_APP_ARCHITECTURE.pdf', title: 'Mobile App Architecture' },
  { src: join(docsDir, 'README.md'), out: 'DOCUMENTATION_INDEX.pdf', title: 'Documentation Index' },
];

const pdfOptions = {
  format: 'A4',
  printBackground: true,
  margin: { top: '22mm', right: '18mm', bottom: '22mm', left: '18mm' },
  displayHeaderFooter: true,
  headerTemplate: `
    <div style="font-size:8px;width:100%;padding:0 18mm;color:#666;font-family:Segoe UI,Arial,sans-serif;">
      <span style="float:left;">TracSOpro</span>
      <span style="float:right;">Confidential — Client Delivery</span>
    </div>`,
  footerTemplate: `
    <div style="font-size:8px;width:100%;text-align:center;color:#888;font-family:Segoe UI,Arial,sans-serif;">
      Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>`,
};

async function buildCoverHtml(title, subtitle) {
  return `
    <div style="page-break-after:always;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;font-family:Segoe UI,Arial,sans-serif;">
      <div style="font-size:11pt;color:#1a6fb5;letter-spacing:2px;text-transform:uppercase;margin-bottom:24px;">TracSOpro</div>
      <div style="font-size:28pt;font-weight:700;color:#0f2d52;margin-bottom:12px;">${title}</div>
      <div style="font-size:12pt;color:#555;margin-bottom:48px;">${subtitle}</div>
      <div style="font-size:10pt;color:#888;">Guard Tracking Platform · Client Documentation</div>
      <div style="font-size:10pt;color:#888;margin-top:6px;">June 2026</div>
    </div>`;
}

async function convertOne({ src, out, title }) {
  const dest = join(docsDir, out);
  const markdown = await readFile(src, 'utf8');
  const cover = await buildCoverHtml(title, 'Official delivery documentation');
  const wrapped = `${cover}\n\n${markdown}`;

  const tempMd = join(docsDir, `.tmp-${out.replace('.pdf', '.md')}`);
  await writeFile(tempMd, wrapped, 'utf8');

  try {
    const result = await mdToPdf(
      { path: tempMd },
      {
        dest,
        basedir: dirname(src),
        stylesheet: [stylePath],
        css: `
          .page-break { page-break-after: always; }
          h1:first-of-type { margin-top: 0; }
        `,
        pdf_options: pdfOptions,
        launch_options: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
      }
    );

    if (!result?.filename) {
      throw new Error(`No PDF produced for ${src}`);
    }

    console.log(`✓ ${out}`);
    return dest;
  } finally {
    try {
      const { unlink } = await import('node:fs/promises');
      await unlink(tempMd);
    } catch {
      /* ignore */
    }
  }
}

async function main() {
  await mkdir(docsDir, { recursive: true });
  console.log('Generating client PDFs in docs/...\n');

  for (const doc of documents) {
    await convertOne(doc);
  }

  console.log(`\nDone. ${documents.length} PDFs written to docs/`);
}

main().catch((err) => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
