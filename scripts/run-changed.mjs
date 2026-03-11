#!/usr/bin/env node

/**
 * Run-changed - Detects changed top-level modules and runs commands on them
 *
 * Usage: node scripts/run-changed.mjs <command> [options]
 *
 * Commands: lint, test, build
 *
 * Options:
 *   --base <ref>    Base ref to compare against (default: origin/main)
 *   --all           Run on all modules regardless of changes
 *
 * Examples:
 *   node scripts/run-changed.mjs lint
 *   node scripts/run-changed.mjs test --base HEAD~5
 *   node scripts/run-changed.mjs build --all
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { cwd } from 'process';

const REPO_ROOT = cwd();

// Top-level module directories to check
const MODULES = [
  'mobile-app',
  'web-portal',
  'backend-services',
  'bff',
  'integration-layer',
  'admin-portal',
  'platform-config',
  'infra',
];

// Command mappings: module command -> root command
const COMMAND_MAP = {
  lint: 'lint',
  test: 'test',
  build: 'build',
};

/**
 * Get the base ref for comparison
 */
function getBaseRef(baseArg) {
  if (baseArg) return baseArg;

  try {
    // Try origin/main first
    execSync('git rev-parse --verify origin/main', { stdio: 'ignore' });
    return 'origin/main';
  } catch {
    // Fallback to merge-base or previous commit
    try {
      return 'HEAD~1';
    } catch {
      return 'HEAD';
    }
  }
}

/**
 * Get list of changed modules compared to base ref
 */
function getChangedModules(baseRef) {
  try {
    const output = execSync(`git diff --name-only ${baseRef} -- ${MODULES.join(' ')}`, {
      encoding: 'utf8',
      cwd: REPO_ROOT,
    });

    const changed = new Set();
    for (const line of output.trim().split('\n')) {
      if (line) {
        const module = line.split('/')[0];
        if (MODULES.includes(module)) {
          changed.add(module);
        }
      }
    }
    return Array.from(changed);
  } catch (error) {
    // If git command fails, return empty (first run scenario)
    console.warn('Warning: Could not detect changes, running on all modules');
    return MODULES;
  }
}

/**
 * Run a command in a module
 */
function runModuleCommand(module, command) {
  const modulePath = join(REPO_ROOT, module);

  // Check for Node.js module (package.json)
  const packageJson = join(modulePath, 'package.json');
  if (existsSync(packageJson)) {
    try {
      // Check if script exists in package.json
      const scriptName = COMMAND_MAP[command];
      const result = execSync(`npm --prefix "${modulePath}" run ${scriptName} 2>&1`, {
        encoding: 'utf8',
        cwd: REPO_ROOT,
        stdio: 'pipe',
      });
      console.log(`[${module}] ${command} completed`);
      return { success: true, output: result };
    } catch (error) {
      if (error.status !== null) {
        // Script doesn't exist or failed
        const output = error.stdout || error.message;
        if (output.includes('missing script') || output.includes('does not support')) {
          console.log(`[${module}] Skipping - no ${command} script defined`);
          return { success: true, skipped: true };
        }
        console.error(`[${module}] ${command} failed:`);
        console.error(output);
        return { success: false, output };
      }
    }
  }

  // Check for Java module (pom.xml or mvnw)
  const pomXml = join(modulePath, 'pom.xml');
  const mvnw = join(modulePath, 'mvnw');
  if (existsSync(pomXml) || existsSync(mvnw)) {
    const mvnCmd = existsSync(mvnw) ? './mvnw' : 'mvn';
    try {
      let goals;
      switch (command) {
        case 'lint':
        case 'test':
          goals = 'verify -DskipTests';
          break;
        case 'build':
          goals = 'package -DskipTests';
          break;
        default:
          goals = 'verify';
      }

      const result = execSync(`cd "${modulePath}" && ${mvnCmd} ${goals} 2>&1`, {
        encoding: 'utf8',
        cwd: REPO_ROOT,
        stdio: 'pipe',
      });
      console.log(`[${module}] ${command} completed (Maven)`);
      return { success: true, output: result };
    } catch (error) {
      const output = error.stdout || error.message;
      if (error.status !== null) {
        console.error(`[${module}] ${command} failed:`);
        console.error(output);
        return { success: false, output };
      }
    }
  }

  // No suitable tooling found
  console.log(`[${module}] Skipping - no package.json or pom.xml found`);
  return { success: true, skipped: true };
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node scripts/run-changed.mjs <command> [--base <ref>] [--all]');
    console.error('Commands: lint, test, build');
    process.exit(1);
  }

  const command = args[0];
  if (!['lint', 'test', 'build'].includes(command)) {
    console.error(`Invalid command: ${command}`);
    console.error('Valid commands: lint, test, build');
    process.exit(1);
  }

  // Parse options
  let baseRef = 'origin/main';
  let runAll = false;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--base' && i + 1 < args.length) {
      baseRef = args[i + 1];
      i++;
    } else if (args[i] === '--all') {
      runAll = true;
    }
  }

  // Determine which modules to run on
  let modulesToRun;
  if (runAll) {
    modulesToRun = MODULES;
    console.log(`Running ${command} on all modules (--all flag)`);
  } else {
    baseRef = getBaseRef(baseRef);
    console.log(`Detecting changes vs ${baseRef}...`);
    modulesToRun = getChangedModules(baseRef);
    console.log(`Changed modules: ${modulesToRun.length > 0 ? modulesToRun.join(', ') : 'none'}`);
  }

  if (modulesToRun.length === 0) {
    console.log('No modules to process');
    process.exit(0);
  }

  // Run command on each module
  let hasFailures = false;

  for (const module of modulesToRun) {
    const moduleDir = join(REPO_ROOT, module);
    if (!existsSync(moduleDir)) {
      console.log(`[${module}] Skipping - directory does not exist`);
      continue;
    }

    console.log(`\n--- Running ${command} on ${module} ---`);
    const result = runModuleCommand(module, command);

    if (!result.success) {
      hasFailures = true;
    }
  }

  if (hasFailures) {
    console.error('\n❌ One or more modules failed');
    process.exit(1);
  }

  console.log('\n✅ All modules processed successfully');
  process.exit(0);
}

main();
