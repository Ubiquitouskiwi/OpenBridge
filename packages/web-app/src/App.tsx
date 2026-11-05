import { Outlet } from 'react-router-dom';
import { AppHeader } from './components/AppHeader.js';
import { TransparencyBanner } from './components/TransparencyBanner.js';
import { useInactivityAutoClear } from './hooks/useInactivityAutoClear.js';

export function App() {
  useInactivityAutoClear();
  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <AppHeader />
      <TransparencyBanner />
      <main id="main" className="container">
        <Outlet />
      </main>
      <footer className="container footer">
        <p>OpenBridge is not legal advice. It helps you complete benefit applications.</p>
        <p>
          <a href="/terms">Terms of Use</a>
        </p>
      </footer>
    </div>
  );
}
