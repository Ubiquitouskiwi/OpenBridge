import { useId, useRef, useState } from 'react';
import type { StateAdapter } from '@openbridge/shared';
import { ExportActions } from '../../components/ExportActions.js';
import { StatePicker } from '../../components/StatePicker.js';
import { TOOLKIT_VERSION, loadAdapter } from '../../data/index.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { isoDateOf } from '../../lib/format.js';
import { ChangeEditor } from './ChangeEditor.js';
import { SourceFields } from './SourceFields.js';
import {
  EXPLANATION_MAX,
  type ChangeDraft,
  type SourceDraft,
  buildProposal,
  emptyChange,
  proposalFileName,
} from './buildProposal.js';
import { buildIssueText } from './issueText.js';

function ExplanationField({
  value,
  error,
  onChange,
}: {
  value: string;
  error: string | undefined;
  onChange: (v: string) => void;
}) {
  const { t } = useTranslate();
  const id = useId();
  const hintId = useId();
  const errorId = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{t('propose.explanation')}</label>
      <textarea
        id={id}
        rows={5}
        value={value}
        required
        maxLength={EXPLANATION_MAX}
        aria-invalid={error !== undefined}
        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
        onChange={(e) => onChange(e.target.value)}
      />
      <p id={hintId} className="hint">
        {t('propose.explanationHint')}
      </p>
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function StateProposal({ adapter }: { adapter: StateAdapter }) {
  const { t, locale } = useTranslate();
  const nextId = useRef(1);
  const [changes, setChanges] = useState<ChangeDraft[]>([emptyChange('change-0')]);
  const [source, setSource] = useState<SourceDraft>({ sourceName: '', url: '', publishedDate: '' });
  const [explanation, setExplanation] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const result = buildProposal({
    adapter,
    changes,
    source,
    explanation,
    toolkitVersion: TOOLKIT_VERSION,
  });
  const date = isoDateOf(new Date());
  const fileName = proposalFileName(adapter.stateCode, date);
  const proposal = result.proposal;

  function update(index: number, draft: ChangeDraft) {
    setChanges((prev) => prev.map((c, i) => (i === index ? draft : c)));
  }

  function addChange() {
    const id = `change-${nextId.current++}`;
    setChanges((prev) => [...prev, emptyChange(id)]);
  }

  return (
    <>
      {changes.map((draft, index) => (
        <ChangeEditor
          key={draft.id}
          adapter={adapter}
          index={index}
          draft={draft}
          error={showErrors ? result.changeErrors[draft.id] : undefined}
          onChange={(d) => update(index, d)}
          onRemove={
            changes.length > 1
              ? () => setChanges((prev) => prev.filter((c) => c.id !== draft.id))
              : undefined
          }
        />
      ))}
      <button type="button" onClick={addChange}>
        {t('propose.addChange')}
      </button>
      <SourceFields
        value={source}
        errors={result.sourceErrors}
        showErrors={showErrors}
        onChange={setSource}
      />
      <ExplanationField
        value={explanation}
        error={
          showErrors && result.explanationError
            ? t(`propose.explanationError.${result.explanationError}`)
            : undefined
        }
        onChange={setExplanation}
      />

      <section aria-labelledby="propose-finish">
        <h2 id="propose-finish">{t('propose.finishHeading')}</h2>
        {!proposal && (
          <>
            <p className="hint">{t('propose.notReady')}</p>
            <button type="button" onClick={() => setShowErrors(true)}>
              {t('propose.checkForm')}
            </button>
            {showErrors && (
              <p role="status" className="field-error">
                {result.checkErrors.length > 0 ? t('propose.checkFailed') : t('propose.fixErrors')}
              </p>
            )}
          </>
        )}
        {proposal && (
          <>
            <p>{t('propose.ready')}</p>
            <ExportActions
              fileName={fileName}
              mimeType="application/json"
              fileText={() => `${JSON.stringify(proposal, null, 2)}\n`}
              copyText={() => buildIssueText(t, locale, adapter, proposal, fileName)}
              downloadLabel={t('propose.download')}
              copyLabel={t('propose.copy')}
            />
            <p>{t('propose.nextStep')}</p>
          </>
        )}
      </section>
    </>
  );
}

/** Tool 2: propose one or more rule changes backed by one official source. */
export function ProposeTool() {
  const { t } = useTranslate();
  const [stateCode, setStateCode] = useState('');
  const adapter = stateCode ? loadAdapter(stateCode) : undefined;
  return (
    <>
      <p>{t('propose.intro')}</p>
      <StatePicker value={stateCode} onChange={setStateCode} />
      {adapter && <StateProposal key={adapter.stateCode} adapter={adapter} />}
    </>
  );
}
