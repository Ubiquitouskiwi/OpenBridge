import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import type { EligibilityOutcome } from '@openbridge/shared';
import { useSessionStore } from '../../store/session.js';
import { useDashboardStore } from '../../store/dashboard.js';
import { useResultStore } from '../../store/result.js';
import { useIntakeStore } from '../../store/intake.js';

const POSITIVE: EligibilityOutcome[] = ['eligible', 'likely_eligible', 'possibly_eligible'];

/** Navigator batch-screening dashboard (feature-flagged to navigator mode). */
export function DashboardView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mode = useSessionStore((s) => s.mode);
  const { clients, removeClient, clearAll } = useDashboardStore();
  const setResult = useResultStore((s) => s.setResult);
  const resetIntake = useIntakeStore((s) => s.reset);

  if (mode !== 'navigator') {
    return (
      <section>
        <h1>Navigator dashboard</h1>
        <p>Switch to navigator mode on the welcome screen to screen multiple clients.</p>
        <Link to="/">Go to welcome</Link>
      </section>
    );
  }

  function screenNewClient() {
    resetIntake();
    navigate('/screen');
  }

  function viewClient(id: string) {
    const client = clients.find((c) => c.id === id);
    if (client) {
      setResult(client.result);
      navigate('/results');
    }
  }

  return (
    <section>
      <h1>Navigator dashboard</h1>
      <p>
        {clients.length} client session(s) held on this device only. Nothing is saved unless you
        export it.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button type="button" className="primary" onClick={screenNewClient}>
          Screen a new client
        </button>
        {clients.length > 0 && (
          <button type="button" onClick={clearAll}>
            Clear all clients
          </button>
        )}
      </div>

      {clients.map((c) => {
        const positive = c.result.results.filter((r) => POSITIVE.includes(r.outcome));
        return (
          <div key={c.id} className="program-card">
            <strong>{c.label}</strong>
            <p className="field-hint">
              {positive.length > 0
                ? `Likely programs: ${positive.map((r) => t(`programs.${r.programId}`)).join(', ')}`
                : 'No likely matches — see referral options.'}
            </p>
            <button type="button" onClick={() => viewClient(c.id)}>
              View results
            </button>{' '}
            <button type="button" onClick={() => removeClient(c.id)}>
              Clear client
            </button>
          </div>
        );
      })}
    </section>
  );
}
