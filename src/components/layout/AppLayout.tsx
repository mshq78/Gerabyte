import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from '../ui/OfflineBanner';
import { Toast } from '../ui/Toast';
import { useApp } from '../../state/AppContext';
import { DemoPanel } from '../../demo/DemoPanel';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
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
    <div className="min-h-screen bg-[#E8E1D5] flex justify-center selection:bg-[#1E6FA8] selection:text-white">
      {/* Centered Mobile Column (max-w-md = 480px) */}
      <div className="w-full max-w-[480px] min-h-screen bg-[#F2EDE4] shadow-2xl relative flex flex-col overflow-x-hidden">
        {/* Offline Banner */}
        <OfflineBanner isOffline={isOffline} />

        {/* Floating Toast notifications */}
        <Toast toast={toast} />

        {/* Main View Container */}
        <main className={`flex-1 flex flex-col ${isFullScreenFlow ? '' : 'pb-20'}`}>
          {children}
        </main>

        {/* Persistent Bottom Navigation */}
        {!isFullScreenFlow && <BottomNav />}

        {/* Demo Panel Floating Controller (Available via ?demo=1 or toggle) */}
        <DemoPanel />
      </div>
    </div>
  );
};
