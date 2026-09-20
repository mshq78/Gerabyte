import React, { ReactNode, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { hasSession } from './api/auth';
import { LearnerShell } from './shells/LearnerShell';
import { DashboardShell } from './shells/DashboardShell';

// Eager Feature Screens
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
import { AdminDashboardScreen } from './features/dashboard/AdminDashboardScreen';
import { VisibilitySettingsScreen } from './features/settings/VisibilitySettingsScreen';

// Lazy Loaded Org Dashboard Screens
const OrgOverviewScreen = React.lazy(() =>
  import('./features/org/screens/OrgOverviewScreen').then((m) => ({ default: m.OrgOverviewScreen }))
);
const OrgPeopleScreen = React.lazy(() =>
  import('./features/org/screens/OrgPeopleScreen').then((m) => ({ default: m.OrgPeopleScreen }))
);
const OrgPersonDetailScreen = React.lazy(() =>
  import('./features/org/screens/OrgPersonDetailScreen').then((m) => ({
    default: m.OrgPersonDetailScreen,
  }))
);
const OrgAssignmentsScreen = React.lazy(() =>
  import('./features/org/screens/OrgAssignmentsScreen').then((m) => ({
    default: m.OrgAssignmentsScreen,
  }))
);
const OrgReportsScreen = React.lazy(() =>
  import('./features/org/screens/OrgReportsScreen').then((m) => ({ default: m.OrgReportsScreen }))
);
const OrgChallengesScreen = React.lazy(() =>
  import('./features/org/screens/OrgChallengesScreen').then((m) => ({
    default: m.OrgChallengesScreen,
  }))
);
const OrgChallengeNewScreen = React.lazy(() =>
  import('./features/org/screens/OrgChallengeNewScreen').then((m) => ({
    default: m.OrgChallengeNewScreen,
  }))
);
const OrgChallengeDetailScreen = React.lazy(() =>
  import('./features/org/screens/OrgChallengeDetailScreen').then((m) => ({
    default: m.OrgChallengeDetailScreen,
  }))
);
const OrgImportScreen = React.lazy(() =>
  import('./features/org/screens/OrgImportScreen').then((m) => ({ default: m.OrgImportScreen }))
);
const OrgSubscriptionsScreen = React.lazy(() =>
  import('./features/org/screens/OrgSubscriptionsScreen').then((m) => ({
    default: m.OrgSubscriptionsScreen,
  }))
);
const OrgCertificatesScreen = React.lazy(() =>
  import('./features/org/screens/OrgCertificatesScreen').then((m) => ({
    default: m.OrgCertificatesScreen,
  }))
);
const OrgEffectivenessScreen = React.lazy(() =>
  import('./features/org/screens/OrgEffectivenessScreen').then((m) => ({
    default: m.OrgEffectivenessScreen,
  }))
);
const OrgSettingsScreen = React.lazy(() =>
  import('./features/org/screens/OrgSettingsScreen').then((m) => ({ default: m.OrgSettingsScreen }))
);

const OrgLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-body font-bold text-ink/70">در حال بارگذاری بخش سازمانی...</span>
    </div>
  </div>
);

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
          1. LEAF STANDALONE ROUTES (No Layout Shell)
         ========================================= */}
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/verify/:serial" element={<VerifyCertificateScreen />} />
      <Route
        path="/lesson/:id"
        element={
          <RequireAuth>
            <LessonPlayerScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/exam/:id"
        element={
          <RequireAuth>
            <ExamScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/placement"
        element={
          <RequireAuth>
            <PlacementScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingScreen />
          </RequireAuth>
        }
      />

      {/* =========================================
          2. LEARNER SHELL LAYOUT ROUTE
         ========================================= */}
      <Route element={<LearnerShell />}>
        <Route
          path="/"
          element={
            <RequireAuth>
              <HomeScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/path"
          element={
            <RequireAuth>
              <PathScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/league"
          element={
            <RequireAuth>
              <LeagueScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/challenges"
          element={
            <RequireAuth>
              <LeagueScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/challenges/:id"
          element={
            <RequireAuth>
              <ChallengeDetailScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/rewards"
          element={
            <RequireAuth>
              <RewardsScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/subscription"
          element={
            <RequireAuth>
              <SubscriptionScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfileScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/certificates"
          element={
            <RequireAuth>
              <CertificatesScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/certificates/:serial"
          element={
            <RequireAuth>
              <CertificateDetailScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/certificate/:id"
          element={
            <RequireAuth>
              <CertificateDetailScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <NotificationsScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/settings/notifications"
          element={
            <RequireAuth>
              <NotificationSettingsScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/settings/visibility"
          element={
            <RequireAuth>
              <VisibilitySettingsScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/notification-settings"
          element={<Navigate to="/settings/notifications" replace />}
        />
      </Route>

      {/* =========================================
          3. DASHBOARD SHELL LAYOUT ROUTE
         ========================================= */}
      <Route element={<DashboardShell />}>
        <Route
          path="/org"
          element={
            <RequireAuth>
              <Navigate to="/org/overview" replace />
            </RequireAuth>
          }
        />
        <Route
          path="/org/overview"
          element={
            <RequireAuth>
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgOverviewScreen />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/org/people"
          element={
            <RequireAuth>
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgPeopleScreen />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/org/people/:id"
          element={
            <RequireAuth>
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgPersonDetailScreen />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/org/import"
          element={
            <RequireAuth>
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgImportScreen />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/org/assignments"
          element={
            <RequireAuth>
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgAssignmentsScreen />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/org/challenges"
          element={
            <RequireAuth>
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgChallengesScreen />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/org/challenges/new"
          element={
            <RequireAuth>
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgChallengeNewScreen />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/org/challenges/:id"
          element={
            <RequireAuth>
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgChallengeDetailScreen />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/org/subscriptions"
          element={
            <RequireAuth>
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgSubscriptionsScreen />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/org/certificates"
          element={
            <RequireAuth>
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgCertificatesScreen />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/org/effectiveness"
          element={
            <RequireAuth>
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgEffectivenessScreen />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/org/settings"
          element={
            <RequireAuth>
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgSettingsScreen />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/org/reports"
          element={
            <RequireAuth>
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgReportsScreen />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminDashboardScreen />
            </RequireAuth>
          }
        />
      </Route>

      {/* =========================================
          4. CATCH-ALL REDIRECT
         ========================================= */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
