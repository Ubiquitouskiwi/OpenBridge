import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Translate } from '../lib/format.js';

/** A plain translate function and the active locale, for passing into pure builders. */
export function useTranslate(): { t: Translate; locale: string } {
  const { t, i18n } = useTranslation();
  return useMemo(
    () => ({
      t: (key: string, options?: Record<string, unknown>): string => String(t(key, options)),
      locale: i18n.language,
    }),
    [t, i18n.language],
  );
}
