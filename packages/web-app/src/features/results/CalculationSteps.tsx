import { useTranslation } from 'react-i18next';
import type { i18n as I18n } from 'i18next';
import type { CalculationStep, FederalData, StateAdapter } from '@openbridge/shared';
import { renderMathLabel } from '../../i18n/renderReason.js';
import { findCitation, formatIsoDate, formatStepValue } from './calcFormat.js';

interface CalculationStepsProps {
  steps: CalculationStep[] | undefined;
  adapter: StateAdapter | undefined;
  federal: FederalData;
  /** Visible label for the toggle; defaults to "Show the math". */
  summary?: string;
}

/** Value text with a word cue for how the step relates to the total (not color alone). */
function valueText(i18n: I18n, step: CalculationStep): string {
  const value = formatStepValue(i18n.language, step);
  switch (step.op) {
    case 'add':
      return i18n.t('showMath.add', { value });
    case 'subtract':
      return i18n.t('showMath.subtract', { value });
    case 'result':
      return i18n.t('showMath.result', { value });
    case 'limit':
      return i18n.t('showMath.limit', { value });
    default:
      return value;
  }
}

function SourceCell({
  step,
  adapter,
  federal,
}: {
  step: CalculationStep;
  adapter: StateAdapter | undefined;
  federal: FederalData;
}) {
  const { t, i18n } = useTranslation();
  if (!step.source) {
    if (step.op === 'input') return <>{t('showMath.fromAnswers')}</>;
    if (step.op === 'rule') return <>{t('showMath.sourceMissing')}</>;
    return <>{t('showMath.workedOut')}</>;
  }
  const citation = findCitation(step.source, adapter, federal);
  if (!citation) return <span className="calc-source-missing">{t('showMath.sourceMissing')}</span>;
  return (
    <a href={citation.url} target="_blank" rel="noreferrer">
      {t('showMath.sourceLink', {
        name: citation.sourceName,
        date: formatIsoDate(i18n.language, citation.publishedDate),
      })}{' '}
      <span className="visually-hidden">{t('showMath.newTab')}</span>
    </a>
  );
}

/**
 * "Show the math" (requirement 5.9, radical transparency): the arithmetic behind one result,
 * localized and formatted in the UI from the engine's step codes and raw values.
 */
export function CalculationSteps({ steps, adapter, federal, summary }: CalculationStepsProps) {
  const { t, i18n } = useTranslation();
  if (!steps || steps.length === 0) return null;

  return (
    <details className="calc-steps">
      <summary>{summary ?? t('showMath.summary')}</summary>
      {adapter?.verificationStatus === 'draft' && (
        <p className="field-hint">{t('showMath.draftNote')}</p>
      )}
      <div className="table-scroll">
        <table>
          <caption>{t('showMath.caption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('showMath.colStep')}</th>
              <th scope="col">{t('showMath.colValue')}</th>
              <th scope="col">{t('showMath.colSource')}</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, idx) => {
              const emphasize = step.op === 'result' || step.op === 'limit';
              const label = renderMathLabel(i18n, step.labelCode);
              return (
                <tr key={idx} className={`calc-op-${step.op}`}>
                  <th scope="row">{emphasize ? <strong>{label}</strong> : label}</th>
                  <td>
                    {emphasize ? <strong>{valueText(i18n, step)}</strong> : valueText(i18n, step)}
                  </td>
                  <td>
                    <SourceCell step={step} adapter={adapter} federal={federal} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="field-hint">{t('showMath.estimateNote')}</p>
    </details>
  );
}
