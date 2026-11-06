import familyWithChildren from '../../../../../data/states/oh/fixtures/family-with-children.json';
import minimumBenefit from '../../../../../data/states/wa/fixtures/minimum-benefit-single.json';
import { federal } from '../../data/index.js';
import { ohio } from '../../test-utils.js';
import { checkFixtureText } from './CheckTool.js';
import { compareFixture, FIXTURE_EVALUATION_DATE } from './compareFixture.js';
import { parseFixture } from './parseFixture.js';

const repoFixtures = import.meta.glob<{ default: unknown }>(
  '../../../../../data/states/*/fixtures/*.json',
  { eager: true },
);

describe('parseFixture', () => {
  it('reads a repo fixture', () => {
    const parsed = parseFixture(JSON.stringify(familyWithChildren));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.fixture.profile.stateCode).toBe('OH');
  });

  it('says when the file is not JSON', () => {
    expect(parseFixture('{ not json')).toEqual({ ok: false, error: 'notJson' });
  });

  it.each([
    ['an empty object', {}],
    ['a proposal file', { format: 'openbridge.rule-proposal.v1', changes: [] }],
    ['an unknown outcome', { ...familyWithChildren, expected: { snap: 'maybe' } }],
    ['a profile without a state', { ...familyWithChildren, profile: { members: [] } }],
    ['a non-integer benefit', { ...familyWithChildren, expectedBenefits: { snap: 1.5 } }],
  ])('refuses %s as the wrong shape', (_label, value) => {
    expect(parseFixture(JSON.stringify(value))).toEqual({ ok: false, error: 'wrongShape' });
  });
});

describe('compareFixture', () => {
  it('uses the CI fixture date', () => {
    expect(FIXTURE_EVALUATION_DATE).toBe('2024-06-01');
  });

  it('passes every program and member row of a repo fixture', () => {
    const parsed = parseFixture(JSON.stringify(familyWithChildren));
    if (!parsed.ok) throw new Error('fixture did not parse');
    const comparison = compareFixture(parsed.fixture, ohio(), federal);
    expect(comparison.failed).toBe(0);
    expect(comparison.rows.filter((r) => r.kind === 'program')).toHaveLength(5);
    expect(comparison.rows.filter((r) => r.kind === 'member')).toHaveLength(2);
    const snap = comparison.rows.find((r) => r.kind === 'program' && r.programId === 'snap');
    expect(snap?.reasons.length).toBeGreaterThan(0);
    expect(snap?.calculation.length).toBeGreaterThan(0);
  });

  it('flags a changed expectation as a mismatch', () => {
    const edited = {
      ...familyWithChildren,
      expected: { ...familyWithChildren.expected, tanf: 'eligible' },
    };
    const parsed = parseFixture(JSON.stringify(edited));
    if (!parsed.ok) throw new Error('fixture did not parse');
    const comparison = compareFixture(parsed.fixture, ohio(), federal);
    expect(comparison.failed).toBe(1);
    const tanf = comparison.rows.find((r) => r.programId === 'tanf');
    expect(tanf).toMatchObject({
      kind: 'program',
      expected: 'eligible',
      actual: 'ineligible',
      pass: false,
    });
  });

  it('checks benefit amounts in cents', () => {
    const result = checkFixtureText('wa.json', JSON.stringify(minimumBenefit));
    if (result.kind !== 'done') throw new Error(result.kind);
    const benefit = result.comparison.rows.find((r) => r.kind === 'benefit');
    expect(benefit).toMatchObject({
      programId: 'snap',
      expectedCents: 2300,
      actualCents: 2300,
      pass: true,
    });

    const edited = { ...minimumBenefit, expectedBenefits: { snap: 2400 } };
    const off = checkFixtureText('wa.json', JSON.stringify(edited));
    if (off.kind !== 'done') throw new Error(off.kind);
    expect(off.comparison.rows.find((r) => r.kind === 'benefit')?.pass).toBe(false);
  });

  it('agrees with CI on every repo fixture', () => {
    const files = Object.entries(repoFixtures);
    expect(files.length).toBeGreaterThan(0);
    for (const [path, mod] of files) {
      const result = checkFixtureText(path, JSON.stringify(mod.default));
      if (result.kind !== 'done') throw new Error(`${path}: ${result.kind}`);
      expect({ path, failed: result.comparison.failed }).toEqual({ path, failed: 0 });
    }
  });
});

describe('checkFixtureText', () => {
  it('says when the state is not bundled', () => {
    const other = {
      ...familyWithChildren,
      profile: { ...familyWithChildren.profile, stateCode: 'ZZ' },
    };
    expect(checkFixtureText('x.json', JSON.stringify(other))).toEqual({
      kind: 'error',
      error: 'unknownState',
    });
  });
});
