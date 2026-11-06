import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EligibilityResult, HouseholdProfile } from '@openbridge/shared';
import { downloadTextFile } from '../save/savePayload.js';
import {
  buildFixture,
  defaultSelections,
  fixtureFileName,
  type ExpectedSelections,
} from './buildFixture.js';
import { ExpectedOutcomeFields } from './ExpectedOutcomeFields.js';

interface ReviewFormProps {
  profile: HouseholdProfile;
  /** Engine result on the fixture runner's date, used to pre-fill the selects. */
  engineResult: EligibilityResult;
}

/** Made-up confirmation, test-case name, expected outcomes, and the download. */
export function ReviewForm({ profile, engineResult }: ReviewFormProps) {
  const { t } = useTranslation();
  const ids = { hint: useId(), error: useId(), gate: useId() };
  const [madeUp, setMadeUp] = useState(false);
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const [selections, setSelections] = useState<ExpectedSelections>(() =>
    defaultSelections(engineResult),
  );
  const [savedFile, setSavedFile] = useState<string | null>(null);

  const nameMissing = name.trim() === '';
  const canDownload = madeUp && !nameMissing;

  function download() {
    if (!canDownload) return;
    const fixture = buildFixture(name, profile, engineResult, selections);
    const file = fixtureFileName(name);
    downloadTextFile(file, `${JSON.stringify(fixture, null, 2)}\n`);
    setSavedFile(file);
  }

  return (
    <>
      <label className="checkbox-label">
        <input type="checkbox" checked={madeUp} onChange={(e) => setMadeUp(e.target.checked)} />{' '}
        {t('review.madeUpLabel')}
      </label>

      <label>
        {t('review.nameLabel')}
        <input
          value={name}
          required
          aria-required="true"
          aria-invalid={touched && nameMissing}
          aria-describedby={touched && nameMissing ? `${ids.hint} ${ids.error}` : ids.hint}
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched(true)}
        />
      </label>
      <p id={ids.hint} className="field-hint">
        {t('review.nameHint')}
      </p>
      {touched && nameMissing && (
        <p id={ids.error} className="field-error">
          {t('review.nameRequired')}
        </p>
      )}

      <ExpectedOutcomeFields
        result={engineResult}
        selections={selections}
        onChange={setSelections}
      />

      {!canDownload && (
        <p id={ids.gate} className="field-hint">
          {t('review.gateHint')}
        </p>
      )}
      <button
        type="button"
        className="primary"
        disabled={!canDownload}
        aria-describedby={canDownload ? undefined : ids.gate}
        onClick={download}
      >
        {t('review.download')}
      </button>
      <p role="status">{savedFile ? t('review.saved', { file: savedFile }) : ''}</p>
    </>
  );
}
