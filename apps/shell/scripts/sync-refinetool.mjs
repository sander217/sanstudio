#!/usr/bin/env node
// Re-vendor refinetool's iframe companion bundle into apps/shell/public/.
// Usage:
//   node scripts/sync-refinetool.mjs                    # default refinetool path
//   node scripts/sync-refinetool.mjs ../refinetool      # explicit path
//
// Assumes refinetool is cloned somewhere on disk and `npm install` has been
// run there. The script:
//   1. cd into refinetool
//   2. npm run build:companion
//   3. copy public/companion.iife.js → sanstudio/apps/shell/public/refinetool/

import { execSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHELL_ROOT = resolve(__dirname, '..');
const VENDOR_DIR = join(SHELL_ROOT, 'public', 'refinetool');

const arg = process.argv[2];
const REFINETOOL_PATH = arg
  ? resolve(arg)
  : resolve(SHELL_ROOT, '..', '..', '..', 'refinetool');

console.log(`refinetool: ${REFINETOOL_PATH}`);
if (!existsSync(REFINETOOL_PATH)) {
  console.error(`refinetool not found at ${REFINETOOL_PATH}.`);
  console.error('Pass the path explicitly: node scripts/sync-refinetool.mjs ../path/to/refinetool');
  process.exit(1);
}

console.log('building companion...');
execSync('npm run build:companion', { cwd: REFINETOOL_PATH, stdio: 'inherit' });

const src = join(REFINETOOL_PATH, 'public', 'companion.iife.js');
const dst = join(VENDOR_DIR, 'companion.iife.js');
console.log(`copying ${src} → ${dst}`);
copyFileSync(src, dst);
console.log('done.');
