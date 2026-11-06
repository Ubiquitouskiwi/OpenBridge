import { useTranslation } from 'react-i18next';
import type { ProvenanceSource } from '@openbridge/shared';
import { formatIsoDate } from '../lib/format.js';

/** A rule value's citation: source name (a link), published date, or a calm "none yet". */
export function SourceCitation({ citation }: { citation: ProvenanceSource | undefined }) {
  const { t, i18n } = useTranslation();
  if (!citation) return <span className="muted">{t('review.noSource')}</span>;
  return (
    <span>
      <a href={citation.url} target="_blank" rel="noreferrer">
        {citation.sourceName}
        <span className="visually-hidden"> {t('common.newTab')}</span>
      </a>
      {', '}
      {t('review.published', { date: formatIsoDate(i18n.language, citation.publishedDate) })}
    </span>
  );
}
