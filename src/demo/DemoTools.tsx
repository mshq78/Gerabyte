import React from 'react';
import { useLocation } from 'react-router-dom';
import { DemoPanel } from './DemoPanel';
import { OrgSimulatorPanel } from './OrgSimulatorPanel';

/**
 * DEMO_ONLY entry point for every dev-only tool. Reached exclusively through the
 * dynamic import in src/components/DevTools.tsx, so this module and everything it
 * pulls in stay out of production bundles. The whole folder is deleted in Phase 2.
 */
const DemoTools: React.FC = () => {
  const location = useLocation();
  const onDashboard = location.pathname.startsWith('/org');

  return (
    <>
      <DemoPanel />
      {onDashboard && <OrgSimulatorPanel />}
    </>
  );
};

export default DemoTools;
