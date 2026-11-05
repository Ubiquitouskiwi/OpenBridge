/**
 * Validates federal data and every state adapter (schema + required provenance + date
 * sanity), then runs that state's fixtures. Fails CI on any problem
 * (requirements 5.10, 5.14, Q28).
 */
import { loadFederalData, loadStateAdapter, listStateCodes } from './lib/loaders.js';
import { runAllFixtures } from './lib/fixtures.js';

const problems: string[] = [];
const today = new Date().toISOString().slice(0, 10);

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

// Federal data must parse, and its date ranges must make sense.
try {
  const federal = loadFederalData();
  for (const table of Object.values(federal.fplTables)) {
    if (!isValidIsoDate(table.effectiveDate) || !isValidIsoDate(table.expectedRefreshDate)) {
      problems.push(`federal: FPL ${table.region} has an invalid effective/refresh date`);
    } else if (table.expectedRefreshDate <= table.effectiveDate) {
      problems.push(`federal: FPL ${table.region} expectedRefreshDate must be after effectiveDate`);
    }
  }
  if (federal.snap.expectedRefreshDate <= federal.snap.effectiveDate) {
    problems.push('federal: snap expectedRefreshDate must be after effectiveDate');
  }
} catch (err) {
  problems.push(`federal data invalid: ${(err as Error).message}`);
}

// Every configured program needs at least one provenance source, and all dates must be
// valid, non-future ISO dates (Q28).
for (const code of listStateCodes()) {
  try {
    const adapter = loadStateAdapter(code);
    const fields = adapter.sources.map((s) => s.field);
    const configuredPrograms = Object.entries(adapter.programs)
      .filter(([, cfg]) => cfg !== undefined)
      .map(([programId]) => programId);
    for (const programId of configuredPrograms) {
      if (!fields.some((f) => f.startsWith(`${programId}.`) || f === programId)) {
        problems.push(`${code}: missing provenance for configured program "${programId}"`);
      }
    }
    if (!isValidIsoDate(adapter.lastVerified)) {
      problems.push(`${code}: lastVerified is not a valid ISO date`);
    } else if (adapter.lastVerified > today) {
      problems.push(`${code}: lastVerified (${adapter.lastVerified}) is in the future`);
    }
    for (const source of adapter.sources) {
      if (!isValidIsoDate(source.publishedDate)) {
        problems.push(`${code}: source "${source.field}" has an invalid publishedDate`);
      } else if (source.publishedDate > today) {
        problems.push(`${code}: source "${source.field}" publishedDate is in the future`);
      }
    }
    if (adapter.verificationStatus === 'verified' && adapter.lastVerifiedBy.startsWith('pending')) {
      problems.push(`${code}: marked verified but lastVerifiedBy is still pending`);
    }
  } catch (err) {
    problems.push(`${code}: adapter invalid: ${(err as Error).message}`);
  }
}

// Fixtures must pass.
const { total, failures } = runAllFixtures();
for (const f of failures) {
  problems.push(`fixture [${f.state}] ${f.fixture}: ${f.detail}`);
}

if (problems.length > 0) {
  console.error(`\n✖ Adapter validation failed (${problems.length} problem(s)):\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(`✓ Federal data + ${listStateCodes().length} adapters valid; ${total} fixtures pass.`);
