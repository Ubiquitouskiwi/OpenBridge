import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { AutoClearWarning } from './AutoClearWarning.js';

const DATA_PATHS = ['/screen', '/results', '/resume'];

/** Always-on plain-language data transparency (requirement 5.6, Q16). */
export function TransparencyBanner() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const show = DATA_PATHS.some((p) => pathname.startsWith(p));
  if (!show) return <AutoClearWarning />;

  return (
    <div className="transparency-banner" role="status">
      <span aria-hidden="true" className="transparency-icon">
        🔒
      </span>
      <p>
        {t('transparency.onDevice')} {t('transparency.willClear')}
      </p>
      <AutoClearWarning />
    </div>
  );
}
