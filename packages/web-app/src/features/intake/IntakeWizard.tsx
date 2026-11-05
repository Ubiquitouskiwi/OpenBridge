import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { evaluateEligibility } from '@openbridge/eligibility-engine';
import type {
  EligibilityStatus,
  IncomeFrequency,
  IncomeSourceType,
  Relationship,
} from '@openbridge/shared';
import { useIntakeStore, nextId } from '../../store/intake.js';
import { useResultStore } from '../../store/result.js';
import { useSessionStore } from '../../store/session.js';
import { useDashboardStore } from '../../store/dashboard.js';
import { federal, loadAdapter, supportedStates } from '../../data/index.js';
import { MoneyInput } from './MoneyInput.js';
import { validateProfile } from './validation.js';

const RELATIONSHIPS: Relationship[] = [
  'self',
  'spouse',
  'child',
  'parent',
  'sibling',
  'grandparent',
  'other_relative',
  'non_relative',
];

const STATUSES: EligibilityStatus[] = [
  'us_citizen',
  'lpr_5yr_plus',
  'lpr_under_5yr',
  'refugee_asylee_humanitarian',
  'other_qualified',
  'undocumented',
  'prefer_not_to_say',
];

const INCOME_TYPES: IncomeSourceType[] = [
  'wages',
  'self_employment',
  'social_security',
  'ssi',
  'unemployment',
  'child_support',
  'pension',
  'other',
];

const FREQUENCIES: IncomeFrequency[] = [
  'hourly',
  'weekly',
  'biweekly',
  'semimonthly',
  'monthly',
  'annual',
];

const EARNED_TYPES = new Set<IncomeSourceType>(['wages', 'self_employment']);

const STEPS = ['location', 'household', 'income', 'expenses', 'review'] as const;
type Step = (typeof STEPS)[number];

export function IntakeWizard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    draft,
    setField,
    addMember,
    updateMember,
    removeMember,
    addIncome,
    updateIncome,
    removeIncome,
  } = useIntakeStore();
  const setResult = useResultStore((s) => s.setResult);
  const mode = useSessionStore((s) => s.mode);
  const addClient = useDashboardStore((s) => s.addClient);
  const [step, setStep] = useState<Step>('location');
  const [error, setError] = useState<string | null>(null);

  const stepIndex = STEPS.indexOf(step);
  const adults = draft.members.filter((m) => (m.age ?? 0) >= 18);
  const showAttribution = adults.length > 1;

  function goNext() {
    setError(null);
    if (step === 'location' && !draft.stateCode) {
      setError('Please choose your state.');
      return;
    }
    if (step === 'household' && draft.members.length === 0) {
      setError('Please add at least one person.');
      return;
    }
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]!);
  }

  function goBack() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]!);
  }

  function compute() {
    const validationError = validateProfile(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    const adapter = loadAdapter(draft.stateCode);
    if (!adapter) {
      setError('That state is not supported yet.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const result = evaluateEligibility(draft, adapter, federal, today);
    setResult(result);
    if (mode === 'navigator') addClient(result);
    navigate('/results');
  }

  return (
    <section className="intake">
      <p className="wizard-steps">
        Step {stepIndex + 1} of {STEPS.length}
      </p>
      {error && (
        <p role="alert" style={{ color: 'var(--bad)' }}>
          {error}
        </p>
      )}

      {step === 'location' && (
        <fieldset>
          <legend>Where do you live?</legend>
          <label>
            State
            <select value={draft.stateCode} onChange={(e) => setField('stateCode', e.target.value)}>
              <option value="">Choose…</option>
              {supportedStates.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            County
            <input value={draft.county} onChange={(e) => setField('county', e.target.value)} />
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.isStateResident ?? true}
              onChange={(e) => setField('isStateResident', e.target.checked)}
            />
            I live in this state
          </label>
        </fieldset>
      )}

      {step === 'household' && (
        <fieldset>
          <legend>Who is in your household?</legend>
          {draft.members.map((m) => (
            <div key={m.id} className="program-card">
              <label>
                Relationship
                <select
                  value={m.relationship}
                  onChange={(e) =>
                    updateMember(m.id, { relationship: e.target.value as Relationship })
                  }
                >
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date of birth (best) or age below
                <input
                  type="date"
                  value={m.dateOfBirth ?? ''}
                  onChange={(e) => updateMember(m.id, { dateOfBirth: e.target.value || undefined })}
                />
              </label>
              <label>
                Age (if you'd rather not share a birth date)
                <input
                  type="number"
                  min={0}
                  value={m.age ?? ''}
                  onChange={(e) =>
                    updateMember(m.id, {
                      age: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Immigration status (optional)
                <select
                  value={m.eligibilityStatus ?? ''}
                  onChange={(e) =>
                    updateMember(m.id, {
                      eligibilityStatus: (e.target.value || undefined) as EligibilityStatus,
                    })
                  }
                >
                  <option value="">Prefer not to say</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={m.isPregnant ?? false}
                  onChange={(e) => updateMember(m.id, { isPregnant: e.target.checked })}
                />
                Pregnant
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={m.isPostpartum ?? false}
                  onChange={(e) => updateMember(m.id, { isPostpartum: e.target.checked })}
                />
                Gave birth in the last 6 months
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={m.isBreastfeeding ?? false}
                  onChange={(e) => updateMember(m.id, { isBreastfeeding: e.target.checked })}
                />
                Breastfeeding a baby under 1
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={m.isDisabled ?? false}
                  onChange={(e) => updateMember(m.id, { isDisabled: e.target.checked })}
                />
                Has a disability
              </label>
              {draft.members.length > 1 && (
                <>
                  <label>
                    <input
                      type="checkbox"
                      checked={m.filesTaxes ?? false}
                      onChange={(e) => updateMember(m.id, { filesTaxes: e.target.checked })}
                    />
                    Files taxes (optional — improves accuracy)
                  </label>
                  <label>
                    Claimed as a dependent by (optional)
                    <select
                      value={m.claimedAsDependentBy ?? ''}
                      onChange={(e) =>
                        updateMember(m.id, { claimedAsDependentBy: e.target.value || undefined })
                      }
                    >
                      <option value="">No one</option>
                      {draft.members
                        .filter((other) => other.id !== m.id)
                        .map((other) => (
                          <option key={other.id} value={other.id}>
                            {other.relationship} ({other.age ?? '?'})
                          </option>
                        ))}
                    </select>
                  </label>
                </>
              )}
              <button type="button" onClick={() => removeMember(m.id)}>
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              addMember({
                id: nextId('member'),
                relationship: draft.members.length === 0 ? 'self' : 'child',
                age: undefined,
              })
            }
          >
            Add a person
          </button>
        </fieldset>
      )}

      {step === 'income' && (
        <fieldset>
          <legend>What income does your household have?</legend>
          {draft.incomeSources.map((src, i) => (
            <div key={i} className="program-card">
              <label>
                Type
                <select
                  value={src.type}
                  onChange={(e) => {
                    const type = e.target.value as IncomeSourceType;
                    updateIncome(i, { type, earned: EARNED_TYPES.has(type) });
                  }}
                >
                  {INCOME_TYPES.map((ty) => (
                    <option key={ty} value={ty}>
                      {ty}
                    </option>
                  ))}
                </select>
              </label>
              <MoneyInput
                label="Amount (before taxes)"
                valueCents={src.amountCents}
                onChangeCents={(cents) => updateIncome(i, { amountCents: cents })}
                example="2000"
                hint="Enter what you earn before taxes."
              />
              <label>
                How often?
                <select
                  value={src.frequency}
                  onChange={(e) =>
                    updateIncome(i, { frequency: e.target.value as IncomeFrequency })
                  }
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
              {src.frequency === 'hourly' && (
                <label>
                  Hours per week
                  <input
                    type="number"
                    min={0}
                    value={src.hoursPerWeek ?? ''}
                    onChange={(e) => updateIncome(i, { hoursPerWeek: Number(e.target.value) })}
                  />
                </label>
              )}
              {showAttribution && (
                <label>
                  Who earns this?
                  <select
                    value={src.memberId ?? ''}
                    onChange={(e) => updateIncome(i, { memberId: e.target.value || undefined })}
                  >
                    <option value="">Not sure</option>
                    {draft.members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.relationship} ({m.age ?? '?'})
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button type="button" onClick={() => removeIncome(i)}>
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              addIncome({ type: 'wages', amountCents: 0, frequency: 'monthly', earned: true })
            }
          >
            Add income
          </button>
        </fieldset>
      )}

      {step === 'expenses' && (
        <fieldset>
          <legend>A few optional details (these can improve your results)</legend>
          <MoneyInput
            label="Monthly rent or mortgage"
            valueCents={draft.monthlyHousingCostCents ?? 0}
            onChangeCents={(c) => setField('monthlyHousingCostCents', c)}
          />
          <MoneyInput
            label="Monthly utilities"
            valueCents={draft.monthlyUtilityCostCents ?? 0}
            onChangeCents={(c) => setField('monthlyUtilityCostCents', c)}
          />
          <MoneyInput
            label="Savings"
            valueCents={draft.liquidAssetsCents ?? 0}
            onChangeCents={(c) => setField('liquidAssetsCents', c)}
          />
          <label>
            <input
              type="checkbox"
              checked={draft.receivesSnap ?? false}
              onChange={(e) => setField('receivesSnap', e.target.checked)}
            />
            We already get SNAP
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.receivesMedicaid ?? false}
              onChange={(e) => setField('receivesMedicaid', e.target.checked)}
            />
            We already get Medicaid
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.receivesCashAssistance ?? false}
              onChange={(e) => setField('receivesCashAssistance', e.target.checked)}
            />
            We already get cash assistance (TANF)
          </label>
        </fieldset>
      )}

      {step === 'review' && (
        <div>
          <h2>Review</h2>
          <p>
            {draft.members.length} person(s) in {draft.stateCode || '—'},{' '}
            {draft.incomeSources.length} income source(s).
          </p>
          <button type="button" className="primary" onClick={compute}>
            See my results
          </button>
        </div>
      )}

      <div className="wizard-nav" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        {stepIndex > 0 && (
          <button type="button" onClick={goBack}>
            {t('back')}
          </button>
        )}
        {step !== 'review' && (
          <button type="button" className="primary" onClick={goNext}>
            {t('next')}
          </button>
        )}
      </div>
    </section>
  );
}
