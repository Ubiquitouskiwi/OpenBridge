import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { evaluateEligibility } from '@openbridge/eligibility-engine';
import { useIntakeStore } from '../../store/intake.js';
import { useResultStore } from '../../store/result.js';
import { federal, loadAdapter } from '../../data/index.js';
import { FIXTURE_EVALUATION_DATE } from './buildFixture.js';
import { ReviewForm } from './ReviewForm.js';

/**
 * Fixture recorder for rule reviewers: screen a made-up household with the normal intake,
 * then save the expected results as a golden test case without touching code.
 */
export function ReviewView() {
  const { t } = useTranslation();
  const draft = useIntakeStore((s) => s.draft);
  const result = useResultStore((s) => s.result);
  const adapter = draft.stateCode ? loadAdapter(draft.stateCode) : undefined;
  const ready = Boolean(result && adapter && draft.members.length > 0);

  const engineResult = useMemo(
    () =>
      ready && adapter
        ? evaluateEligibility(draft, adapter, federal, FIXTURE_EVALUATION_DATE)
        : null,
    [ready, adapter, draft],
  );

  return (
    <section>
      <h1>{t('review.title')}</h1>
      <p>{t('review.intro1')}</p>
      <p>{t('review.intro2')}</p>

      {!engineResult ? (
        <>
          <p>{t('review.noIntake')}</p>
          <Link to="/screen">{t('whatif.startScreen')}</Link>
        </>
      ) : (
        <>
          <p className="field-hint">{t('review.dateNote')}</p>
          <ReviewForm profile={draft} engineResult={engineResult} />
        </>
      )}

      <h2>{t('review.submitTitle')}</h2>
      <p>{t('review.submitIssue')}</p>
      <p>{t('review.submitPr', { code: (draft.stateCode || 'xx').toLowerCase() })}</p>
    </section>
  );
}
