import { useTranslation } from 'react-i18next';
import type { ReferralEntry } from '@openbridge/shared';
import { useIntakeStore } from '../../store/intake.js';
import directory from '../../../../../data/referrals/directory.json';

const entries = directory as unknown as ReferralEntry[];

export function HelpView() {
  const { t } = useTranslation();
  const stateCode = useIntakeStore((s) => s.draft.stateCode);

  const relevant = entries.filter(
    (e) => e.coverageArea === 'US' || (stateCode && e.coverageArea === stateCode.toUpperCase()),
  );

  return (
    <section>
      <h1>{t('getHelp')}</h1>
      <p>
        These organizations can help you apply or answer questions. Legal aid and government
        resources are listed first.
      </p>

      <ul className="reason-list">
        {relevant.map((e) => (
          <li key={e.name} className="program-card">
            <strong>{e.name}</strong>{' '}
            <span className="field-hint">({e.type.replace('_', ' ')})</span>
            <div>
              {e.phone && <a href={`tel:${e.phone.replace(/[^0-9+]/g, '')}`}>Call {e.phone}</a>}{' '}
              {e.email && <a href={`mailto:${e.email}`}>Email</a>}{' '}
              {e.url && (
                <a href={e.url} target="_blank" rel="noreferrer">
                  Website
                </a>
              )}
            </div>
            <p className="field-hint">Serves: {e.categories.join(', ')}</p>
          </li>
        ))}
      </ul>

      <p className="field-hint">
        OpenBridge does not endorse and is not responsible for these organizations. Being listed
        here is not a recommendation, and no organization pays to be listed.
      </p>
      <p className="disclaimer">{t('not_legal_advice')}</p>
    </section>
  );
}
