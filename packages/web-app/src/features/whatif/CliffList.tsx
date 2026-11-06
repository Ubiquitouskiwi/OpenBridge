import { useTranslation } from 'react-i18next';
import type { HouseholdProfile } from '@openbridge/shared';
import type { IncomeCliff } from '@openbridge/eligibility-engine';
import { DEFAULT_CLIFF_SCAN_MAX_CENTS } from '@openbridge/eligibility-engine';
import { formatWholeDollars } from '../results/calcFormat.js';
import { describeCliff } from './whatIfSummary.js';

interface CliffListProps {
  cliffs: IncomeCliff[];
  profile: Pick<HouseholdProfile, 'members'>;
  asOf: string;
}

/** "Where things may change": plain sentences for each program and person. */
export function CliffList({ cliffs, profile, asOf }: CliffListProps) {
  const { t, i18n } = useTranslation();
  return (
    <section aria-labelledby="cliffs-heading">
      <h2 id="cliffs-heading">{t('whatif.cliffsTitle')}</h2>
      <p>
        {t('whatif.cliffsIntro', {
          max: formatWholeDollars(i18n.language, DEFAULT_CLIFF_SCAN_MAX_CENTS),
        })}
      </p>
      {cliffs.length === 0 ? (
        <p>{t('whatif.noCliffs')}</p>
      ) : (
        <ul className="reason-list">
          {cliffs.map((c) => (
            <li key={`${c.programId}-${c.memberId ?? 'household'}`}>
              {describeCliff(i18n, c, profile, asOf)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
