import React, { ReactNode, Suspense, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { hasSession } from './api/auth';
import { useApp } from './state/AppContext';
import { canOpenDashboard, isGeraAdmin } from './lib/permissions';
import { LearnerShell } from './shells/LearnerShell';
import { DashboardShell } from './shells/DashboardShell';
import { Skeleton } from './components/ui/Skeleton';

// Learner screens — every route is code-split so the entry chunk stays small.
const lazyNamed = <K extends string>(
  loader: () => Promise<Record<K, React.ComponentType>>,
  name: K
) => React.lazy(() => loader().then((m) => ({ default: m[name] })));

const HomeScreen = lazyNamed(() => import('./features/home/HomeScreen'), 'HomeScreen');
const PathScreen = lazyNamed(() => import('./features/path/PathScreen'), 'PathScreen');
const LessonPlayerScreen = lazyNamed(
  () => import('./features/lesson/LessonPlayerScreen'),
  'LessonPlayerScreen'
);
const ExamScreen = lazyNamed(() => import('./features/exam/ExamScreen'), 'ExamScreen');
const LeagueScreen = lazyNamed(() => import('./features/league/LeagueScreen'), 'LeagueScreen');
const ChallengeDetailScreen = lazyNamed(
  () => import('./features/challenges/ChallengeDetailScreen'),
  'ChallengeDetailScreen'
);
const RewardsScreen = lazyNamed(() => import('./features/rewards/RewardsScreen'), 'RewardsScreen');
const CertificatesScreen = lazyNamed(
  () => import('./features/certificates/CertificateDetailScreen'),
  'CertificatesScreen'
);
const CertificateDetailScreen = lazyNamed(
  () => import('./features/certificates/CertificateDetailScreen'),
  'CertificateDetailScreen'
);
const VerifyCertificateScreen = lazyNamed(
  () => import('./features/certificates/VerifyCertificateScreen'),
  'VerifyCertificateScreen'
);
const ProfileScreen = lazyNamed(() => import('./features/profile/ProfileScreen'), 'ProfileScreen');
const SubscriptionScreen = lazyNamed(
  () => import('./features/subscription/SubscriptionScreen'),
  'SubscriptionScreen'
);
const NotificationsScreen = lazyNamed(
  () => import('./features/notifications/NotificationsScreen'),
  'NotificationsScreen'
);
const NotificationSettingsScreen = lazyNamed(
  () => import('./features/notifications/NotificationSettingsScreen'),
  'NotificationSettingsScreen'
);
const LoginScreen = lazyNamed(() => import('./features/auth/LoginScreen'), 'LoginScreen');
const OnboardingScreen = lazyNamed(
  () => import('./features/auth/OnboardingScreen'),
  'OnboardingScreen'
);
const PlacementScreen = lazyNamed(
  () => import('./features/placement/PlacementScreen'),
  'PlacementScreen'
);
const AdminDashboardScreen = lazyNamed(
  () => import('./features/dashboard/AdminDashboardScreen'),
  'AdminDashboardScreen'
);
const VisibilitySettingsScreen = lazyNamed(
  () => import('./features/settings/VisibilitySettingsScreen'),
  'VisibilitySettingsScreen'
);

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

/** Skeleton placeholder while a learner screen's chunk is in flight. */
const ScreenFallback: React.FC = () => (
  <div className="p-4 space-y-4" role="status" aria-label="در حال بارگذاری صفحه">
    <Skeleton className="w-1/2 h-7" />
    <Skeleton className="w-full h-28" />
    <Skeleton className="w-full h-20" />
    <Skeleton className="w-3/4 h-20" />
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

/**
 * Route guard for role-restricted areas. Sends anyone without the role back to
 * the learner home with an explanation.
 *
 * TODO(server): authoritative RBAC and scope on every endpoint; UI guards are UX only.
 */
export const RequireRole: React.FC<{ area: 'org' | 'admin'; children: ReactNode }> = ({
  area,
  children,
}) => {
  const { user, showToast } = useApp();
  const allowed = area === 'org' ? canOpenDashboard(user) : isGeraAdmin(user);
  const warned = useRef(false);

  useEffect(() => {
    if (!allowed && !warned.current) {
      warned.current = true;
      showToast('به این بخش دسترسی ندارید', 'error');
    }
  }, [allowed, showToast]);

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<ScreenFallback />}>
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
          3. ORGANIZATION DASHBOARD (org_admin | unit_manager)
         ========================================= */}
        <Route
          element={
            <RequireAuth>
              <RequireRole area="org">
                <DashboardShell />
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route path="/org" element={<Navigate to="/org/overview" replace />} />
          <Route
            path="/org/overview"
            element={
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgOverviewScreen />
              </Suspense>
            }
          />
          <Route
            path="/org/people"
            element={
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgPeopleScreen />
              </Suspense>
            }
          />
          <Route
            path="/org/people/:id"
            element={
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgPersonDetailScreen />
              </Suspense>
            }
          />
          <Route
            path="/org/import"
            element={
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgImportScreen />
              </Suspense>
            }
          />
          <Route
            path="/org/assignments"
            element={
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgAssignmentsScreen />
              </Suspense>
            }
          />
          <Route
            path="/org/challenges"
            element={
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgChallengesScreen />
              </Suspense>
            }
          />
          <Route
            path="/org/challenges/new"
            element={
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgChallengeNewScreen />
              </Suspense>
            }
          />
          <Route
            path="/org/challenges/:id"
            element={
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgChallengeDetailScreen />
              </Suspense>
            }
          />
          <Route
            path="/org/subscriptions"
            element={
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgSubscriptionsScreen />
              </Suspense>
            }
          />
          <Route
            path="/org/certificates"
            element={
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgCertificatesScreen />
              </Suspense>
            }
          />
          <Route
            path="/org/effectiveness"
            element={
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgEffectivenessScreen />
              </Suspense>
            }
          />
          <Route
            path="/org/settings"
            element={
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgSettingsScreen />
              </Suspense>
            }
          />
          <Route
            path="/org/reports"
            element={
              <Suspense fallback={<OrgLoadingFallback />}>
                <OrgReportsScreen />
              </Suspense>
            }
          />
        </Route>

        {/* =========================================
          4. GERA ADMIN PANEL (gera_admin)
         ========================================= */}
        <Route
          element={
            <RequireAuth>
              <RequireRole area="admin">
                <DashboardShell />
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route path="/admin" element={<AdminDashboardScreen />} />
        </Route>

        {/* =========================================
          5. CATCH-ALL REDIRECT
         ========================================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
