import type { CalculationStep, StateAdapter } from '@openbridge/shared';
import { federal } from '../../data/index.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { citationForStep } from '../../lib/citations.js';
import { type Translate, formatIsoDate } from '../../lib/format.js';
import { formatStepValue, renderMathLabel } from '../../lib/reasons.js';

/** Value text with a word cue for how the step relates to the total (not color alone). */
function valueText(t: Translate, locale: string, step: CalculationStep): string {
  const value = formatStepValue(locale, step);
  switch (step.op) {
    case 'add':
    case 'subtract':
    case 'result':
    case 'limit':
      return t(`app:showMath.${step.op}`, { value });
    default:
      return value;
  }
}

function SourceCell({ step, adapter }: { step: CalculationStep; adapter: StateAdapter }) {
  const { t, locale } = useTranslate();
  if (!step.source) {
    if (step.op === 'input') return <>{t('check.fromTestCase')}</>;
    if (step.op === 'rule') return <>{t('app:showMath.sourceMissing')}</>;
    return <>{t('app:showMath.workedOut')}</>;
  }
  const citation = citationForStep(step.source, adapter, federal);
  if (!citation) return <>{t('app:showMath.sourceMissing')}</>;
  return (
    <a href={citation.url} target="_blank" rel="noreferrer">
      {t('app:showMath.sourceLink', {
        name: citation.sourceName,
        date: formatIsoDate(locale, citation.publishedDate),
      })}
      <span className="visually-hidden"> {t('common.newTab')}</span>
    </a>
  );
}

/** "Show the math": the engine's arithmetic for one row, from its calculation steps. */
export function MathSteps({ steps, adapter }: { steps: CalculationStep[]; adapter: StateAdapter }) {
  const { t, locale } = useTranslate();
  if (steps.length === 0) return null;
  return (
    <details className="calc-steps">
      <summary>{t('app:showMath.summary')}</summary>
      <div className="table-scroll">
        <table>
          <caption>{t('app:showMath.caption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('app:showMath.colStep')}</th>
              <th scope="col">{t('app:showMath.colValue')}</th>
              <th scope="col">{t('app:showMath.colSource')}</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, idx) => (
              <tr key={idx}>
                <th scope="row">{renderMathLabel(t, step.labelCode)}</th>
                <td>{valueText(t, locale, step)}</td>
                <td>
                  <SourceCell step={step} adapter={adapter} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
