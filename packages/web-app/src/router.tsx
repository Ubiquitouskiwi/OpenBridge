import { createBrowserRouter, createHashRouter } from 'react-router-dom';
import { App } from './App.js';
import { Welcome } from './routes/Welcome.js';
import { Screen } from './routes/Screen.js';
import { Results } from './routes/Results.js';
import { ProgramDetail } from './routes/ProgramDetail.js';
import { Help } from './routes/Help.js';
import { Resume } from './routes/Resume.js';
import { Terms } from './routes/Terms.js';
import { Dashboard } from './routes/Dashboard.js';
import { WhatIf } from './routes/WhatIf.js';
import { Review } from './routes/Review.js';

/**
 * The single-file local build (`npm run build:local`) opens from disk (file://), where
 * path-based URLs cannot resolve, so it routes with the URL hash instead. Routes hold no
 * personal data in either mode.
 */
const createRouter = import.meta.env.MODE === 'standalone' ? createHashRouter : createBrowserRouter;

export const router = createRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Welcome /> },
      { path: 'screen', element: <Screen /> },
      { path: 'results', element: <Results /> },
      { path: 'program/:id', element: <ProgramDetail /> },
      { path: 'help', element: <Help /> },
      { path: 'resume', element: <Resume /> },
      { path: 'terms', element: <Terms /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'what-if', element: <WhatIf /> },
      { path: 'review', element: <Review /> },
    ],
  },
]);
