import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DATA_VERSION, TOOLKIT_VERSION } from './data/index.js';
import { CheckTool } from './features/check/CheckTool.js';
import { Home, TOOLS, type ToolId } from './features/home/Home.js';
import { ProposeTool } from './features/propose/ProposeTool.js';
import { ReviewTool } from './features/review/ReviewTool.js';

type Screen = 'home' | ToolId;

const SCREENS: readonly Screen[] = ['home', ...TOOLS];

/**
 * The toolkit shell. Screens are plain in-memory state: no router and nothing in the URL,
 * so the file works from disk and nothing about the work shows up in history.
 */
export function App() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>('home');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    // Move focus to the new screen's heading so keyboard and screen reader users land there.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [screen]);

  return (
    <>
      <a className="skip-link" href="#main">
        {t('common.skipToContent')}
      </a>
      <header className="app-header">
        <div className="container">
          <p className="app-title">{t('common.appName')}</p>
          <nav aria-label={t('common.navLabel')}>
            <ul className="tabs">
              {SCREENS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    aria-current={screen === s ? 'page' : undefined}
                    onClick={() => setScreen(s)}
                  >
                    {s === 'home' ? t('home.navLabel') : t(`tools.${s}.title`)}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main id="main" className="container">
        <h1 ref={headingRef} tabIndex={-1}>
          {screen === 'home' ? t('home.title') : t(`tools.${screen}.title`)}
        </h1>
        {screen === 'home' && <Home onOpen={setScreen} />}
        {screen === 'review' && <ReviewTool />}
        {screen === 'propose' && <ProposeTool />}
        {screen === 'check' && <CheckTool />}
      </main>
      <footer className="container app-footer">
        <p>{t('common.footerPrivacy')}</p>
        <p>{t('home.versions', { toolkit: TOOLKIT_VERSION, data: DATA_VERSION })}</p>
      </footer>
    </>
  );
}
