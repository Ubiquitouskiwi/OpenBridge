import type { StateAdapter } from '@openbridge/shared';
import { useTranslate } from '../../i18n/useTranslate.js';
import { type Translate, formatCents } from '../../lib/format.js';
import { renderReason } from '../../lib/reasons.js';
import { MathSteps } from './MathSteps.js';
import type { ComparisonRow } from './compareFixture.js';
import type { FixtureFile } from './parseFixture.js';

/** "Person 2 (child, age 6)" from the test case's own member list. */
function memberName(t: Translate, fixture: FixtureFile, memberId: string): string {
  const index = fixture.profile.members.findIndex((m) => m.id === memberId);
  const member = fixture.profile.members[index];
  if (!member) return t('check.memberUnknown', { id: memberId });
  const relationship = t(`app:relationship.${String(member['relationship'] ?? 'other_relative')}`);
  const age = member['age'];
  return typeof age === 'number'
    ? t('app:memberLabel.withAge', { n: index + 1, relationship, age })
    : t('app:memberLabel.noAge', { n: index + 1, relationship });
}

function rowTitle(t: Translate, fixture: FixtureFile, row: ComparisonRow): string {
  const program = t(`app:programs.${row.programId}`);
  if (row.kind === 'member') {
    return t('check.memberRowTitle', { program, person: memberName(t, fixture, row.memberId) });
  }
  if (row.kind === 'benefit') return t('check.benefitRowTitle', { program });
  return program;
}

function values(t: Translate, locale: string, row: ComparisonRow): [string, string] {
  if (row.kind === 'benefit') {
    return [
      formatCents(locale, row.expectedCents),
      row.actualCents === undefined ? t('check.noResult') : formatCents(locale, row.actualCents),
    ];
  }
  return [
    t(`app:outcome.${row.expected}`),
    row.actual ? t(`app:outcome.${row.actual}`) : t('check.noResult'),
  ];
}

interface ComparisonListProps {
  fixture: FixtureFile;
  adapter: StateAdapter;
  rows: ComparisonRow[];
}

/** Expected vs. engine result for every program, person, and benefit amount. */
export function ComparisonList({ fixture, adapter, rows }: ComparisonListProps) {
  const { t, locale } = useTranslate();
  return (
    <ul className="plain-list">
      {rows.map((row, idx) => {
        const [expected, actual] = values(t, locale, row);
        return (
          <li key={idx} className={`card comparison ${row.pass ? 'is-pass' : 'is-mismatch'}`}>
            <h3>{rowTitle(t, fixture, row)}</h3>
            <p className={row.pass ? 'badge pass' : 'badge mismatch'}>
              {row.pass ? t('check.pass') : t('check.mismatch')}
            </p>
            <dl className="facts">
              <div>
                <dt>{t('check.expected')}</dt>
                <dd>{expected}</dd>
              </div>
              <div>
                <dt>{t('check.engine')}</dt>
                <dd>{actual}</dd>
              </div>
            </dl>
            {row.reasons.length > 0 && (
              <>
                <p className="small-heading">{t('check.reasonsHeading')}</p>
                <ul>
                  {row.reasons.map((reason, i) => (
                    <li key={i}>{renderReason(t, locale, reason)}</li>
                  ))}
                </ul>
              </>
            )}
            <MathSteps steps={row.calculation} adapter={adapter} />
          </li>
        );
      })}
    </ul>
  );
}
