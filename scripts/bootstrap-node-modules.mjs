#!/usr/bin/env node

/**
 * Bootstrap Node.js dependencies across repo modules.
 *
 * Goal: make root quality commands reproducible on clean checkout.
 *
 * Usage:
 *   npm run bootstrap:node
 *   npm run bootstrap:node:skip-root
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { cwd, argv } from 'node:process';

const REPO_ROOT = cwd();
const SKIP_ROOT = argv.includes('--skip-root');

const MODULES = [
  '.',
  'platform-config/design-tokens',
  'web-portal',
  'admin-portal',
  'mobile-app',
];

function run(command, workdir, label) {
  console.log(`[bootstrap] ${label}: ${command}`);
  execSync(command, {
    cwd: workdir,
    stdio: 'inherit',
  });
}

function ensurePackageLock(modulePath) {
  const lockPath = join(modulePath, 'package-lock.json');
  if (!existsSync(lockPath)) {
    throw new Error(
      `Missing package-lock.json for ${modulePath}. ` +
        'Add a lockfile so bootstrap remains deterministic.'
    );
  }
}

function bootstrapModule(moduleRelPath) {
  const modulePath = join(REPO_ROOT, moduleRelPath);
  const packageJson = join(modulePath, 'package.json');

  if (!existsSync(packageJson)) {
    console.log(`[bootstrap] skip ${moduleRelPath} (no package.json)`);
    return;
  }

  if (moduleRelPath === '.' && SKIP_ROOT) {
    console.log('[bootstrap] skip root install (--skip-root)');
    return;
  }

  ensurePackageLock(modulePath);
  run('npm ci', modulePath, moduleRelPath);
}

function main() {
  console.log('[bootstrap] Installing Node dependencies in deterministic order...');
  for (const moduleRelPath of MODULES) {
    bootstrapModule(moduleRelPath);
  }
  console.log('[bootstrap] Done');
}

main();
