import { useId, useState } from 'react';
import type { StateAdapter } from '@openbridge/shared';
import { federal, loadAdapter } from '../../data/index.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { formatIsoDate } from '../../lib/format.js';
import { ComparisonList } from './ComparisonList.js';
import { type Comparison, FIXTURE_EVALUATION_DATE, compareFixture } from './compareFixture.js';
import { type FixtureFile, parseFixture } from './parseFixture.js';

type CheckState =
  | { kind: 'empty' }
  | {
      kind: 'error';
      error: 'notJson' | 'wrongShape' | 'unknownState' | 'engineFailed' | 'unreadable';
    }
  | {
      kind: 'done';
      fileName: string;
      fixture: FixtureFile;
      adapter: StateAdapter;
      comparison: Comparison;
    };

/** Pure step from file text to what the screen shows. Never throws. */
export function checkFixtureText(fileName: string, text: string): CheckState {
  const parsed = parseFixture(text);
  if (!parsed.ok) return { kind: 'error', error: parsed.error };
  const adapter = loadAdapter(parsed.fixture.profile.stateCode);
  if (!adapter) return { kind: 'error', error: 'unknownState' };
  try {
    const comparison = compareFixture(parsed.fixture, adapter, federal);
    return { kind: 'done', fileName, fixture: parsed.fixture, adapter, comparison };
  } catch {
    // The engine is total for valid profiles; a hand-edited file could still surprise it.
    return { kind: 'error', error: 'engineFailed' };
  }
}

/** Reads a chosen file on the device. FileReader works in every browser the toolkit supports. */
function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsText(file);
  });
}

function Results({ state }: { state: Extract<CheckState, { kind: 'done' }> }) {
  const { t } = useTranslate();
  const { comparison, fixture, adapter } = state;
  const allPass = comparison.failed === 0;
  return (
    <section aria-labelledby="check-results">
      <h2 id="check-results">{t('check.resultsHeading', { name: fixture.name })}</h2>
      <p role="status" className={allPass ? 'summary pass' : 'summary mismatch'}>
        {allPass
          ? t('check.allPass', { count: comparison.passed, state: adapter.stateName })
          : t('check.someMismatch', {
              failed: comparison.failed,
              total: comparison.rows.length,
              state: adapter.stateName,
            })}
      </p>
      {!allPass && <p>{t('check.mismatchHelp')}</p>}
      <ComparisonList fixture={fixture} adapter={adapter} rows={comparison.rows} />
    </section>
  );
}

/** Tool 3: open a test case file and see if the current rules give the expected results. */
export function CheckTool() {
  const { t, locale } = useTranslate();
  const inputId = useId();
  const hintId = useId();
  const [state, setState] = useState<CheckState>({ kind: 'empty' });

  async function open(file: File | undefined) {
    if (!file) return;
    try {
      setState(checkFixtureText(file.name, await readFileText(file)));
    } catch {
      setState({ kind: 'error', error: 'unreadable' });
    }
  }

  return (
    <>
      <p>{t('check.intro')}</p>
      <p className="note">
        {t('check.dateNote', { date: formatIsoDate(locale, FIXTURE_EVALUATION_DATE) })}
      </p>
      <div className="field">
        <label htmlFor={inputId}>{t('check.fileLabel')}</label>
        <input
          id={inputId}
          type="file"
          accept=".json,application/json"
          aria-describedby={hintId}
          onChange={(e) => void open(e.target.files?.[0])}
        />
        <p id={hintId} className="hint">
          {t('check.fileHint')}
        </p>
      </div>
      {state.kind === 'error' && (
        <p role="status" className="field-error">
          {t(`check.error.${state.error}`)}
        </p>
      )}
      {state.kind === 'done' && <Results state={state} />}
    </>
  );
}
