/**
 * Regenerates the federal reference data JSON under data/federal from canonical source
 * constants (requirements 5.15, Q29). Run during the January (FPL) and October (SNAP)
 * refresh cycles, then bump values here and re-run. Idempotent: writing the same
 * constants produces the same files.
 *
 * NOTE: values below are the 2024/FY2024 figures and are illustrative pending SME
 * verification. Update them from the cited sources during each refresh.
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FED = resolve(dirname(fileURLToPath(import.meta.url)), '../data/federal');

const fplTables = {
  contiguous: { baseAnnualCents: 1506000, perAdditionalPersonCents: 538000 },
  alaska: { baseAnnualCents: 1881000, perAdditionalPersonCents: 673000 },
  hawaii: { baseAnnualCents: 1731000, perAdditionalPersonCents: 619000 },
};
const FPL_YEAR = 2024;
const FPL_EFFECTIVE = '2024-01-17';
const FPL_REFRESH = '2025-01-31';

const snap = {
  maxAllotmentByHouseholdSizeCents: [0, 29100, 53500, 76600, 97300, 115500, 138600, 153200, 175100],
  standardDeductionByHouseholdSizeCents: [0, 19800, 19800, 19800, 20800, 24400, 27900],
  earnedIncomeDeductionRate: 0.2,
  benefitReductionRate: 0.3,
  shelterCapCents: 67200,
  medicalDeductionThresholdCents: 3500,
  minBenefit1to2Cents: 2300,
  effectiveDate: '2023-10-01',
  expectedRefreshDate: '2024-10-01',
};

function write(name: string, obj: unknown): void {
  writeFileSync(resolve(FED, name), JSON.stringify(obj, null, 2) + '\n');
}

for (const [region, vals] of Object.entries(fplTables)) {
  write(`poverty-guidelines.${region}.json`, {
    region,
    year: FPL_YEAR,
    baseAnnualCents: vals.baseAnnualCents,
    perAdditionalPersonCents: vals.perAdditionalPersonCents,
    effectiveDate: FPL_EFFECTIVE,
    expectedRefreshDate: FPL_REFRESH,
  });
}
write('snap.json', snap);

console.log('✓ Seeded federal reference data (FPL + SNAP) to data/federal.');
