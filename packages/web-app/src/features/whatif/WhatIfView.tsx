import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { evaluateIncomeScenarios, findIncomeCliffs } from '@openbridge/eligibility-engine';
import { useIntakeStore } from '../../store/intake.js';
import { useResultStore } from '../../store/result.js';
import { federal, loadAdapter } from '../../data/index.js';
import { formatWholeDollars } from '../results/calcFormat.js';
import { buildScenarioRows, signedDelta, type Direction } from './whatIfSummary.js';
import { IncomeChangeForm } from './IncomeChangeForm.js';
import { ScenarioTable } from './ScenarioTable.js';
import { CliffList } from './CliffList.js';

/**
 * What-if / benefit cliff tool. Everything stays in component memory; amounts are never
 * put in the URL (privacy-security.md). Uses the results page's evaluation date so the
 * "now" column matches what the user already saw.
 */
export function WhatIfView() {
  const { t, i18n } = useTranslation();
  const draft = useIntakeStore((s) => s.draft);
  const result = useResultStore((s) => s.result);
  const [direction, setDirection] = useState<Direction>('more');
  const [amountCents, setAmountCents] = useState(0);

  const adapter = draft.stateCode ? loadAdapter(draft.stateCode) : undefined;
  const asOf = result?.evaluationDate ?? '';
  const ready = Boolean(result && adapter && draft.members.length > 0);
  const delta = signedDelta(direction, amountCents);

  const rows = useMemo(() => {
    if (!ready || !adapter) return [];
    const [now, changed] = evaluateIncomeScenarios(draft, adapter, federal, asOf, [0, delta]);
    return now && changed ? buildScenarioRows(now, changed) : [];
  }, [ready, adapter, draft, asOf, delta]);

  const cliffs = useMemo(
    () => (ready && adapter ? findIncomeCliffs(draft, adapter, federal, asOf) : []),
    [ready, adapter, draft, asOf],
  );

  if (!ready) {
    return (
      <section>
        <h1>{t('whatif.title')}</h1>
        <p>{t('whatif.noIntake')}</p>
        <Link to="/screen">{t('whatif.startScreen')}</Link>
      </section>
    );
  }

  const amount = formatWholeDollars(i18n.language, Math.abs(delta));
  const status =
    delta === 0
      ? t('whatif.statusNone')
      : t(delta > 0 ? 'whatif.statusMore' : 'whatif.statusLess', { amount });

  return (
    <section>
      <p>
        <Link to="/results">{t('whatif.backToResults')}</Link>
      </p>
      <h1>{t('whatif.title')}</h1>
      <p>{t('whatif.intro')}</p>

      <IncomeChangeForm
        direction={direction}
        amountCents={amountCents}
        onDirection={setDirection}
        onAmount={setAmountCents}
      />

      <p role="status">{status}</p>
      <ScenarioTable rows={rows} />
      <CliffList cliffs={cliffs} profile={draft} asOf={asOf} />

      <div className="program-card" role="note">
        <p>{t('whatif.estimateNote')}</p>
        <p>{t('whatif.nextStep')}</p>
        <Link to="/help">{t('getHelp')}</Link>
      </div>
    </section>
  );
}
