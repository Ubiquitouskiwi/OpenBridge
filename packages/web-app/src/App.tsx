import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router-dom';
import { AppHeader } from './components/AppHeader.js';
import { TransparencyBanner } from './components/TransparencyBanner.js';
import { useInactivityAutoClear } from './hooks/useInactivityAutoClear.js';

/**
 * Move focus to the main region without changing the URL. A plain "#main" link would be read
 * as a route by the hash router used in the single-file local build.
 */
function skipToMain(event: MouseEvent<HTMLAnchorElement>): void {
  const main = document.getElementById('main');
  if (!main) return;
  event.preventDefault();
  main.focus();
}

export function App() {
  const { t } = useTranslation();
  useInactivityAutoClear();
  return (
    <div className="app">
      <a className="skip-link" href="#main" onClick={skipToMain}>
        {t('shell.skipToContent')}
      </a>
      <AppHeader />
      <TransparencyBanner />
      <main id="main" className="container" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="container footer">
        <p>{t('shell.footerNotice')}</p>
        <p>
          <Link to="/terms">{t('shell.termsLink')}</Link>
        </p>
      </footer>
    </div>
  );
}
