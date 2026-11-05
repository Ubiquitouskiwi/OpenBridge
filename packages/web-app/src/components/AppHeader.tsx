import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSessionStore } from '../store/session.js';
import { SUPPORTED_LANGUAGES, type Language } from '../i18n/config.js';
import { ClearDataButton } from './ClearDataButton.js';

export function AppHeader() {
  const { t, i18n } = useTranslation();
  const setLanguage = useSessionStore((s) => s.setLanguage);
  const mode = useSessionStore((s) => s.mode);

  function changeLanguage(lng: Language) {
    setLanguage(lng);
    void i18n.changeLanguage(lng);
  }

  return (
    <header className="container app-header">
      <Link to="/" className="app-title">
        {t('appName')}
      </Link>
      <div className="app-header-actions">
        {mode === 'navigator' && (
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
        )}
        <label className="lang-select">
          <span className="visually-hidden">{t('language')}</span>
          <select
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value as Language)}
            aria-label={t('language')}
          >
            {SUPPORTED_LANGUAGES.map((lng) => (
              <option key={lng} value={lng}>
                {lng.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <ClearDataButton />
      </div>
    </header>
  );
}
