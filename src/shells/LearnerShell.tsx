import React, { ReactNode } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { BottomNav } from '../components/layout/BottomNav';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { Toast } from '../components/ui/Toast';
import { useApp } from '../state/AppContext';
import { DemoPanel } from '../demo/DemoPanel';

interface LearnerShellProps {
  children?: ReactNode;
}

export const LearnerShell: React.FC<LearnerShellProps> = ({ children }) => {
  const { isOffline, toast } = useApp();
  const location = useLocation();

  // Hide bottom nav on full-screen flows (lesson player, exam, login, onboarding, placement)
  const isFullScreenFlow =
    location.pathname.startsWith('/lesson/') ||
    location.pathname.startsWith('/exam/') ||
    location.pathname.startsWith('/verify/') ||
    location.pathname === '/login' ||
    location.pathname === '/onboarding' ||
    location.pathname === '/placement';

  return (
    <div className="min-h-screen bg-sunken flex justify-center selection:bg-primary selection:text-white">
      {/* Centered Mobile Column (max-w-md = 480px) */}
      <div className="w-full max-w-[480px] min-h-screen bg-canvas shadow-2xl relative flex flex-col overflow-x-hidden">
        {/* Offline Banner */}
        <OfflineBanner isOffline={isOffline} />

        {/* Floating Toast notifications */}
        <Toast toast={toast} />

        {/* Main View Container */}
        <main className={`flex-1 flex flex-col ${isFullScreenFlow ? '' : 'pb-24'}`}>
          {children || <Outlet />}
        </main>

        {/* Persistent Bottom Navigation with safe-bottom */}
        {!isFullScreenFlow && <BottomNav />}

        {/* Demo Panel Floating Controller (Rendered only if ?demo=1 or stored) */}
        <DemoPanel />
      </div>
    </div>
  );
};
