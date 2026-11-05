/**
 * CI entry point: run all golden fixtures and fail on any divergence (Q21).
 */
import { runAllFixtures } from './lib/fixtures.js';

const { total, failures } = runAllFixtures();

if (failures.length > 0) {
  console.error(`\n✖ ${failures.length} fixture assertion(s) failed:\n`);
  for (const f of failures) {
    console.error(`  [${f.state}] ${f.fixture} — ${f.detail}`);
  }
  process.exit(1);
}

console.log(`✓ All ${total} golden fixtures passed.`);
