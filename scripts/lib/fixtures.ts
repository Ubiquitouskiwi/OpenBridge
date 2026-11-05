/**
 * Golden-fixture runner (requirements 5.14.1–5.14.2, Q21). Runs every state's fixtures
 * through the engine and reports any divergence from expected outcomes.
 */
import { evaluateEligibility } from '@openbridge/eligibility-engine';
import type { ProgramId } from '@openbridge/shared';
import {
  loadFederalData,
  loadStateAdapter,
  loadFixtures,
  fixtureProfile,
  listStateCodes,
} from './loaders.js';

/** Fixed evaluation date so age-based results are reproducible. */
export const FIXTURE_AS_OF = '2024-06-01';

export interface FixtureFailure {
  state: string;
  fixture: string;
  detail: string;
}

export function runAllFixtures(): { total: number; failures: FixtureFailure[] } {
  const federal = loadFederalData();
  const failures: FixtureFailure[] = [];
  let total = 0;

  for (const code of listStateCodes()) {
    const adapter = loadStateAdapter(code);
    for (const f of loadFixtures(code)) {
      total += 1;
      const profile = fixtureProfile(f);
      const result = evaluateEligibility(profile, adapter, federal, FIXTURE_AS_OF);

      for (const [programId, expected] of Object.entries(f.expected)) {
        const r = result.results.find((x) => x.programId === (programId as ProgramId));
        if (!r) {
          failures.push({ state: code, fixture: f.name, detail: `no result for ${programId}` });
        } else if (r.outcome !== expected) {
          failures.push({
            state: code,
            fixture: f.name,
            detail: `${programId}: expected ${expected}, got ${r.outcome}`,
          });
        }
      }

      for (const [programId, expectedCents] of Object.entries(f.expectedBenefits ?? {})) {
        const r = result.results.find((x) => x.programId === (programId as ProgramId));
        if (!r) {
          failures.push({ state: code, fixture: f.name, detail: `no result for ${programId}` });
        } else if (r.estimatedBenefitCents !== expectedCents) {
          failures.push({
            state: code,
            fixture: f.name,
            detail: `${programId}: expected benefit ${expectedCents}, got ${String(r.estimatedBenefitCents)}`,
          });
        }
      }

      for (const [programId, members] of Object.entries(f.expectedMembers ?? {})) {
        const r = result.results.find((x) => x.programId === (programId as ProgramId));
        for (const [memberId, expected] of Object.entries(members)) {
          const mr = r?.memberResults?.find((m) => m.memberId === memberId);
          if (!mr) {
            failures.push({
              state: code,
              fixture: f.name,
              detail: `${programId}: no member result for ${memberId}`,
            });
          } else if (mr.outcome !== expected) {
            failures.push({
              state: code,
              fixture: f.name,
              detail: `${programId}.${memberId}: expected ${expected}, got ${mr.outcome}`,
            });
          }
        }
      }
    }
  }

  return { total, failures };
}
