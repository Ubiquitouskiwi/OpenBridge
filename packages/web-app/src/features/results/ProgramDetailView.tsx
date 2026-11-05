import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import type { ProgramId } from '@openbridge/shared';
import { useResultStore } from '../../store/result.js';
import { renderReason, renderFactorLabel, renderStep } from '../../i18n/renderReason.js';

function currency(locale: string, dollarString: string): string {
  const n = Number.parseFloat(dollarString);
  if (!Number.isFinite(n)) return dollarString;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(n);
}

export function ProgramDetailView() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const result = useResultStore((s) => s.result);
  const program = result?.results.find((r) => r.programId === (id as ProgramId));

  if (!program) {
    return (
      <section>
        <h1>Program</h1>
        <p>No details available.</p>
        <Link to="/results">Back to results</Link>
      </section>
    );
  }

  return (
    <section>
      <p>
        <Link to="/results">← {t('results')}</Link>
      </p>
      <h1>{t(`programs.${program.programId}`)}</h1>
      <p className={`outcome-${program.outcome}`}>{t(`outcome.${program.outcome}`)}</p>

      {program.estimatedBenefitCents !== undefined && (
        <p>
          <strong>{t('estimated_benefit')}:</strong>{' '}
          {new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(
            program.estimatedBenefitCents / 100,
          )}
        </p>
      )}

      {program.factors.length > 0 && (
        <table>
          <thead>
            <tr>
              <th scope="col">Factor</th>
              <th scope="col">Your value</th>
              <th scope="col">Limit</th>
            </tr>
          </thead>
          <tbody>
            {program.factors.map((f, idx) => (
              <tr key={idx}>
                <td>{renderFactorLabel(i18n, f.labelCode)}</td>
                <td>{currency(i18n.language, f.value)}</td>
                <td>{currency(i18n.language, f.threshold)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Why</h2>
      <ul className="reason-list">
        {program.reasons.map((reason, idx) => (
          <li key={idx}>{renderReason(i18n, reason)}</li>
        ))}
      </ul>

      <h2>{t('next_steps')}</h2>
      <ul className="step-list">
        {program.nextStepCodes.map((code) => (
          <li key={code}>{renderStep(i18n, code)}</li>
        ))}
      </ul>

      <h2>{t('required_documents')}</h2>
      <ul className="doc-list">
        {program.requiredDocumentCodes.map((code) => (
          <li key={code}>{renderStep(i18n, code)}</li>
        ))}
      </ul>

      {program.applyUrl && (
        <p>
          <a href={program.applyUrl} target="_blank" rel="noreferrer">
            Apply on the official site
          </a>
        </p>
      )}
    </section>
  );
}
