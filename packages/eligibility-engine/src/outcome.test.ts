import { describe, it, expect } from 'vitest';
import { decideOutcome, mostEncouraging, isNearThreshold } from './outcome.js';

describe('decideOutcome (cautious ladder)', () => {
  it('returns eligible only when verified and passing', () => {
    expect(decideOutcome({ passesAllHardTests: true })).toBe('eligible');
  });

  it('downgrades to likely_eligible when relying on unverifiable input', () => {
    expect(decideOutcome({ passesAllHardTests: true, reliesOnUnverifiable: true })).toBe(
      'likely_eligible',
    );
  });

  it('prefers possibly_eligible over a hard no when uncertain', () => {
    expect(decideOutcome({ hardDisqualifier: true, withinMarginOfThreshold: true })).toBe(
      'possibly_eligible',
    );
    expect(decideOutcome({ hardDisqualifier: true, missingRequiredInput: true })).toBe(
      'possibly_eligible',
    );
    expect(decideOutcome({ hardDisqualifier: true, uncomputableFactor: true })).toBe(
      'possibly_eligible',
    );
  });

  it('returns ineligible only on a hard disqualifier with no softening', () => {
    expect(decideOutcome({ hardDisqualifier: true })).toBe('ineligible');
  });

  it('returns unknown when nothing is decided', () => {
    expect(decideOutcome({})).toBe('unknown');
  });
});

describe('mostEncouraging', () => {
  it('picks the best outcome for per-member rollups', () => {
    expect(mostEncouraging(['ineligible', 'likely_eligible', 'possibly_eligible'])).toBe(
      'likely_eligible',
    );
    expect(mostEncouraging(['ineligible', 'unknown'])).toBe('unknown');
    expect(mostEncouraging([])).toBe('unknown');
  });
});

describe('isNearThreshold', () => {
  it('detects values within 10% of a limit', () => {
    expect(isNearThreshold(10500, 10000)).toBe(true); // 5% over
    expect(isNearThreshold(11500, 10000)).toBe(false); // 15% over
    expect(isNearThreshold(9200, 10000)).toBe(true); // 8% under
  });
});
