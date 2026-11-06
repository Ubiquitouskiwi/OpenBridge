import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n/config.js';
import './styles.css';
import { App } from './App.js';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
