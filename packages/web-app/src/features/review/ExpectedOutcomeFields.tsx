import { useTranslation } from 'react-i18next';
import type { EligibilityOutcome, EligibilityResult, ProgramId } from '@openbridge/shared';
import { memberLabel } from '../results/memberLabel.js';
import type { ExpectedSelections } from './buildFixture.js';

const OUTCOMES: EligibilityOutcome[] = [
  'eligible',
  'likely_eligible',
  'possibly_eligible',
  'ineligible',
  'unknown',
];

interface OutcomeSelectProps {
  label: string;
  value: EligibilityOutcome | undefined;
  onChange: (o: EligibilityOutcome) => void;
}

function OutcomeSelect({ label, value, onChange }: OutcomeSelectProps) {
  const { t } = useTranslation();
  return (
    <label>
      {label}
      <select
        value={value ?? 'unknown'}
        onChange={(e) => onChange(e.target.value as EligibilityOutcome)}
      >
        {OUTCOMES.map((o) => (
          <option key={o} value={o}>
            {t(`outcome.${o}`)}
          </option>
        ))}
      </select>
    </label>
  );
}

interface ExpectedOutcomeFieldsProps {
  result: EligibilityResult;
  selections: ExpectedSelections;
  onChange: (next: ExpectedSelections) => void;
}

/** One select per program, plus one per person for per-member programs. */
export function ExpectedOutcomeFields({
  result,
  selections,
  onChange,
}: ExpectedOutcomeFieldsProps) {
  const { t, i18n } = useTranslation();

  function setProgram(id: ProgramId, o: EligibilityOutcome) {
    onChange({ ...selections, programs: { ...selections.programs, [id]: o } });
  }

  function setMember(id: ProgramId, memberId: string, o: EligibilityOutcome) {
    const byMember = { ...(selections.members[id] ?? {}), [memberId]: o };
    onChange({ ...selections, members: { ...selections.members, [id]: byMember } });
  }

  return (
    <fieldset>
      <legend>{t('review.expectedLegend')}</legend>
      <p className="field-hint">{t('review.expectedHint')}</p>
      {result.results.map((r) => {
        const program = t(`programs.${r.programId}`);
        return (
          <div key={r.programId} className="review-program">
            <OutcomeSelect
              label={program}
              value={selections.programs[r.programId]}
              onChange={(o) => setProgram(r.programId, o)}
            />
            {r.scope === 'per_member' &&
              (r.memberResults ?? []).map((m) => (
                <OutcomeSelect
                  key={m.memberId}
                  label={t('review.memberSelect', {
                    program,
                    person: memberLabel(i18n, result.profile, m.memberId, result.evaluationDate),
                  })}
                  value={selections.members[r.programId]?.[m.memberId]}
                  onChange={(o) => setMember(r.programId, m.memberId, o)}
                />
              ))}
          </div>
        );
      })}
    </fieldset>
  );
}
