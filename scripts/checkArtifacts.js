#!/usr/bin/env node

/**
 * Build Artifact Checker
 *
 * Scans the repository for build artifacts that should not be in source directories.
 * Specifically fails if .d.ts or .d.ts.map files are found inside any src/ folder.
 *
 * Usage: node scripts/checkArtifacts.js
 * Exit code: 0 if clean, 1 if artifacts found
 */

const { execSync } = require('child_process');
const path = require('path');

// Get repository root (assumes script is in repo/scripts/)
const repoRoot = path.resolve(__dirname, '..');

console.log('🔍 Checking for build artifacts in src/ directories...');

// Use git ls-files to only check tracked files (ignores node_modules, dist, etc.)
// Exclude known intentional type declaration files (e.g., Fastify augmentation, test setup)
const command = `git ls-files | grep -E "(^|/)src/.*\\.d\\.ts$|(^|/)src/.*\\.d\\.ts\\.map$" | grep -v -E "fastify-augmentation\\.d\\.ts$|__tests__/global-setup\\.d\\.ts$" || true`;

try {
  const output = execSync(command, {
    cwd: repoRoot,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  const files = output.trim().split('\n').filter(line => line.length > 0);

  if (files.length > 0) {
    console.error('\n❌ Found build artifacts in src/ directories:');
    files.forEach(file => console.error(`   ${file}`));
    console.error('\nBuild artifacts (.d.ts, .d.ts.map) must not be committed in source directories.');
    console.error('They should be generated in dist/ during build.\n');
    process.exit(1);
  } else {
    console.log('✅ No build artifacts found in src/ directories');
    process.exit(0);
  }
} catch (error) {
  // If grep finds no matches, it exits with code 1, which throws
  // In that case, output should be empty => clean
  if (error.statusCode === 1) {
    console.log('✅ No build artifacts found in src/ directories');
    process.exit(0);
  }
  // Other errors
  console.error('❌ Error checking artifacts:', error.message);
  process.exit(1);
}
