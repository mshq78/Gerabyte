import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * Design mode, and the reason it can never ship.
 *
 * `import.meta.env.VITE_DESIGN_MODE` is replaced at build time with a literal,
 * so without the flag this whole condition folds to `false` and Rollup drops
 * the branch — and with it the dynamic import, the chunk, and everything in
 * `src/design/`. `scripts/check-dist.mjs` then proves the marker is absent
 * rather than taking the reasoning on trust.
 */
async function start() {
  if (import.meta.env.VITE_DESIGN_MODE === '1') {
    const { installDesignMode } = await import('./design');
    installDesignMode();
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void start();
