import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './i18n/config.js';
import './styles/global.css';
import { router } from './router.js';
import { loadDeploymentConfigOverride } from './store/session.js';

// Optional per-deployment config (self-hosters); non-blocking.
void loadDeploymentConfigOverride();

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
