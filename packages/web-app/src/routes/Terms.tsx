import { useTranslation } from 'react-i18next';

/** Plain-language Terms of Use / disclaimer (requirement 5.13, Q27). */
export function Terms() {
  const { t } = useTranslation();
  return (
    <section>
      <h1>Terms of Use</h1>
      <p>{t('not_legal_advice')}</p>
      <ul>
        <li>
          OpenBridge helps you check eligibility and fill out forms. It does not decide benefits.
        </li>
        <li>Results are estimates. The agency you apply to makes the final decision.</li>
        <li>
          We do not guarantee accuracy, and we are not liable for decisions made using this tool.
        </li>
        <li>Your information stays on your device unless you choose to export it.</li>
        <li>
          We list legal aid and other organizations to help you. We do not endorse them and are not
          responsible for their services.
        </li>
      </ul>
    </section>
  );
}
