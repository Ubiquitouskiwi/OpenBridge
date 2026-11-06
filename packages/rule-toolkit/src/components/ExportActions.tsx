import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { copyText, downloadTextFile } from '../lib/download.js';

interface ExportActionsProps {
  fileName: string;
  mimeType: string;
  /** Contents of the downloaded file. */
  fileText: () => string;
  /** Text for the clipboard (may differ from the file, for example issue text). */
  copyText: () => string;
  downloadLabel: string;
  copyLabel: string;
  disabled?: boolean;
}

type Status = { kind: 'saved'; file: string } | { kind: 'copied' } | { kind: 'copyFailed' };

/** Download and copy buttons with a spoken confirmation. Nothing leaves the device. */
export function ExportActions(props: ExportActionsProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);

  function download() {
    downloadTextFile(props.fileName, props.fileText(), props.mimeType);
    setStatus({ kind: 'saved', file: props.fileName });
  }

  async function copy() {
    const text = props.copyText();
    const ok = await copyText(text);
    setStatus(ok ? { kind: 'copied' } : { kind: 'copyFailed' });
    setFallback(ok ? null : text);
  }

  return (
    <div className="export-actions">
      <div className="button-row">
        <button type="button" className="primary" onClick={download} disabled={props.disabled}>
          {props.downloadLabel}
        </button>
        <button type="button" onClick={() => void copy()} disabled={props.disabled}>
          {props.copyLabel}
        </button>
      </div>
      <p role="status" className="status-message">
        {status?.kind === 'saved' && t('common.saved', { file: status.file })}
        {status?.kind === 'copied' && t('common.copied')}
        {status?.kind === 'copyFailed' && t('common.copyFailed')}
      </p>
      {fallback !== null && (
        <label className="field">
          {t('common.copyFallbackLabel')}
          <textarea readOnly value={fallback} rows={8} />
        </label>
      )}
    </div>
  );
}
