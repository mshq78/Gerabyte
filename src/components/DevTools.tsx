import React, { Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * In a production build `import.meta.env.DEV` is the literal `false`, so this
 * branch — and with it the only dynamic import of src/demo — is dropped at
 * build time. Nothing under src/demo can reach a production bundle.
 */
const DemoTools = import.meta.env.DEV ? React.lazy(() => import('../demo/DemoTools')) : null;

const DEMO_SESSION_KEY = 'gerabyte:demo';

function isDemoRequested(search: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (new URLSearchParams(search).get('demo') === '1') {
      sessionStorage.setItem(DEMO_SESSION_KEY, '1');
      return true;
    }
    return sessionStorage.getItem(DEMO_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/** Dev-only slot: mounts the demo tools when running `npm run dev` with ?demo=1. */
export const DevTools: React.FC = () => {
  const location = useLocation();
  const [isActive, setIsActive] = useState(
    () => DemoTools !== null && isDemoRequested(location.search)
  );

  useEffect(() => {
    if (DemoTools !== null && isDemoRequested(location.search)) {
      setIsActive(true);
    }
  }, [location.search]);

  if (!DemoTools || !isActive) return null;

  return (
    <Suspense fallback={null}>
      <DemoTools />
    </Suspense>
  );
};
