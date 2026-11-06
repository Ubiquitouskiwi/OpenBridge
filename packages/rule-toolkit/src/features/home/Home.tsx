import { useTranslation } from 'react-i18next';
import { DATA_VERSION, TOOLKIT_VERSION } from '../../data/index.js';

export type ToolId = 'review' | 'propose' | 'check';

export const TOOLS: readonly ToolId[] = ['review', 'propose', 'check'];

/** What each tool is for, and the ground rules, in plain words. */
export function Home({ onOpen }: { onOpen: (tool: ToolId) => void }) {
  const { t } = useTranslation();
  return (
    <>
      <p>{t('home.intro')}</p>
      <ul className="plain-list tool-cards">
        {TOOLS.map((tool) => (
          <li key={tool} className="card">
            <h2>{t(`tools.${tool}.title`)}</h2>
            <p>{t(`tools.${tool}.description`)}</p>
            <button type="button" className="primary" onClick={() => onOpen(tool)}>
              {t('home.open', { tool: t(`tools.${tool}.title`) })}
            </button>
          </li>
        ))}
      </ul>
      <section aria-labelledby="home-know">
        <h2 id="home-know">{t('home.knowHeading')}</h2>
        <ul>
          <li>{t('home.drafts')}</li>
          <li>{t('home.private')}</li>
          <li>{t('home.sources')}</li>
        </ul>
      </section>
      <section aria-labelledby="home-send">
        <h2 id="home-send">{t('home.sendHeading')}</h2>
        <ol>
          <li>{t('home.sendIssue')}</li>
          <li>{t('home.sendEmail')}</li>
        </ol>
        <p>{t('home.sendAfter')}</p>
      </section>
      <p className="hint">{t('home.versions', { toolkit: TOOLKIT_VERSION, data: DATA_VERSION })}</p>
    </>
  );
}
