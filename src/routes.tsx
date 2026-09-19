import React, { ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { hasSession } from './api/auth';
import { LearnerShell } from './shells/LearnerShell';
import { DashboardShell } from './shells/DashboardShell';

// Feature Screens
import { HomeScreen } from './features/home/HomeScreen';
import { PathScreen } from './features/path/PathScreen';
import { LessonPlayerScreen } from './features/lesson/LessonPlayerScreen';
import { ExamScreen } from './features/exam/ExamScreen';
import { LeagueScreen } from './features/league/LeagueScreen';
import { ChallengeDetailScreen } from './features/challenges/ChallengeDetailScreen';
import { RewardsScreen } from './features/rewards/RewardsScreen';
import {
  CertificatesScreen,
  CertificateDetailScreen,
} from './features/certificates/CertificateDetailScreen';
import { VerifyCertificateScreen } from './features/certificates/VerifyCertificateScreen';
import { ProfileScreen } from './features/profile/ProfileScreen';
import { SubscriptionScreen } from './features/subscription/SubscriptionScreen';
import { NotificationsScreen } from './features/notifications/NotificationsScreen';
import { NotificationSettingsScreen } from './features/notifications/NotificationSettingsScreen';
import { LoginScreen } from './features/auth/LoginScreen';
import { OnboardingScreen } from './features/auth/OnboardingScreen';
import { PlacementScreen } from './features/placement/PlacementScreen';
import { OrgDashboardScreen } from './features/dashboard/OrgDashboardScreen';
import { AdminDashboardScreen } from './features/dashboard/AdminDashboardScreen';

/**
 * Route guard requiring an active user session.
 * Unauthenticated users are redirected to /login.
 */
export const RequireAuth: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();

  if (!hasSession()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* =========================================
          1. PUBLIC ROUTES (No session required)
         ========================================= */}
      <Route
        path="/login"
        element={
          <LearnerShell>
            <LoginScreen />
          </LearnerShell>
        }
      />
      <Route
        path="/verify/:serial"
        element={
          <LearnerShell>
            <VerifyCertificateScreen />
          </LearnerShell>
        }
      />

      {/* =========================================
          2. AUTHENTICATED LEARNER ROUTES (LearnerShell)
         ========================================= */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <LearnerShell>
              <HomeScreen />
            </LearnerShell>
          </RequireAuth>
        }
      />
      <Route
        path="/path"
        element={
          <RequireAuth>
            <LearnerShell>
              <PathScreen />
            </LearnerShell>
          </RequireAuth>
        }
      />
      <Route
        path="/league"
        element={
          <RequireAuth>
            <LearnerShell>
              <LeagueScreen />
            </LearnerShell>
          </RequireAuth>
        }
      />
      <Route
        path="/rewards"
        element={
          <RequireAuth>
            <LearnerShell>
              <RewardsScreen />
            </LearnerShell>
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <LearnerShell>
              <ProfileScreen />
            </LearnerShell>
          </RequireAuth>
        }
      />

      {/* Learning & Examination Flows */}
      <Route
        path="/lesson/:id"
        element={
          <RequireAuth>
            <LearnerShell>
              <LessonPlayerScreen />
            </LearnerShell>
          </RequireAuth>
        }
      />
      <Route
        path="/exam/:id"
        element={
          <RequireAuth>
            <LearnerShell>
              <ExamScreen />
            </LearnerShell>
          </RequireAuth>
        }
      />
      <Route
        path="/challenges/:id"
        element={
          <RequireAuth>
            <LearnerShell>
              <ChallengeDetailScreen />
            </LearnerShell>
          </RequireAuth>
        }
      />

      {/* Certificates */}
      <Route
        path="/certificates"
        element={
          <RequireAuth>
            <LearnerShell>
              <CertificatesScreen />
            </LearnerShell>
          </RequireAuth>
        }
      />
      <Route
        path="/certificates/:serial"
        element={
          <RequireAuth>
            <LearnerShell>
              <CertificateDetailScreen />
            </LearnerShell>
          </RequireAuth>
        }
      />

      {/* Subscription */}
      <Route
        path="/subscription"
        element={
          <RequireAuth>
            <LearnerShell>
              <SubscriptionScreen />
            </LearnerShell>
          </RequireAuth>
        }
      />

      {/* Notifications & Settings */}
      <Route
        path="/notifications"
        element={
          <RequireAuth>
            <LearnerShell>
              <NotificationsScreen />
            </LearnerShell>
          </RequireAuth>
        }
      />
      <Route
        path="/settings/notifications"
        element={
          <RequireAuth>
            <LearnerShell>
              <NotificationSettingsScreen />
            </LearnerShell>
          </RequireAuth>
        }
      />
      {/* Backward-compatibility redirect */}
      <Route
        path="/notification-settings"
        element={<Navigate to="/settings/notifications" replace />}
      />

      {/* Onboarding & Placement */}
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <LearnerShell>
              <OnboardingScreen />
            </LearnerShell>
          </RequireAuth>
        }
      />
      <Route
        path="/placement"
        element={
          <RequireAuth>
            <LearnerShell>
              <PlacementScreen />
            </LearnerShell>
          </RequireAuth>
        }
      />

      {/* =========================================
          3. DASHBOARD ROUTES (DashboardShell)
         ========================================= */}
      <Route
        path="/org"
        element={
          <RequireAuth>
            <DashboardShell title="داشبورد سازمان">
              <OrgDashboardScreen />
            </DashboardShell>
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <DashboardShell title="پنل تیم گرا">
              <AdminDashboardScreen />
            </DashboardShell>
          </RequireAuth>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
