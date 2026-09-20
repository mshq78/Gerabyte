import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { __setDesignTransport } from '../api/http';
import { DesignBar } from './DesignBar';
import { designTransport } from './transport';

export { DESIGN_MODE_MARKER, designTransport } from './transport';
export { DESIGN_PERSONAS } from './personas';

/**
 * Turn design mode on: swap the API transport, then mount the persona bar in
 * its own root so it cannot interfere with the app's tree.
 *
 * Only ever called from a branch guarded by a static `import.meta.env` check,
 * so a production build drops this module entirely.
 */
export function installDesignMode(): void {
  __setDesignTransport(designTransport);

  const host = document.createElement('div');
  host.id = 'gerabyte-design-bar';
  document.body.appendChild(host);
  createRoot(host).render(createElement(DesignBar));
}
