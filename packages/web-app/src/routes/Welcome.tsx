import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/session.js';
import type { AppMode } from '@openbridge/shared';

export function Welcome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mode = useSessionStore((s) => s.mode);
  const setMode = useSessionStore((s) => s.setMode);

  return (
    <section className="welcome">
      <h1>{t('appName')}</h1>
      <p className="lead">{t('tagline')}</p>

      <fieldset className="mode-select">
        <legend>
          {t('mode.individual')} / {t('mode.navigator')}
        </legend>
        {(['individual', 'navigator'] as AppMode[]).map((m) => (
          <label key={m} className="mode-option">
            <input
              type="radio"
              name="mode"
              value={m}
              checked={mode === m}
              onChange={() => setMode(m)}
            />
            {t(`mode.${m}`)}
          </label>
        ))}
      </fieldset>

      <div className="welcome-actions">
        <button type="button" className="primary" onClick={() => navigate('/screen')}>
          {t('start')}
        </button>
        <Link to="/resume">I have a saved file</Link>
      </div>

      <p className="disclaimer">{t('not_legal_advice')}</p>
    </section>
  );
}
