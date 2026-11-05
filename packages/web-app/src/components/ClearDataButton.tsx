import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { clearAllData } from '../store/clear.js';

/** Always-visible panic control that wipes in-memory data (requirement 5.7.1, Q26). */
export function ClearDataButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  function onClear() {
    clearAllData();
    navigate('/');
  }

  return (
    <button type="button" className="clear-data-button" onClick={onClear}>
      {t('clearData')}
    </button>
  );
}
