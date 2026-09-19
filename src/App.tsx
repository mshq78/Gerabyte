import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './state/AppContext';
import { AppLayout } from './components/layout/AppLayout';

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

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* 1. Primary Tabs */}
            <Route path="/" element={<HomeScreen />} />
            <Route path="/path" element={<PathScreen />} />
            <Route path="/league" element={<LeagueScreen />} />
            <Route path="/rewards" element={<RewardsScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />

            {/* 2. Interactive Flows & Players */}
            <Route path="/lesson/:id" element={<LessonPlayerScreen />} />
            <Route path="/exam/:id" element={<ExamScreen />} />
            <Route path="/challenges/:id" element={<ChallengeDetailScreen />} />

            {/* 3. Certificates & Public Verification */}
            <Route path="/certificates" element={<CertificatesScreen />} />
            <Route path="/certificates/:serial" element={<CertificateDetailScreen />} />
            <Route path="/verify/:serial" element={<VerifyCertificateScreen />} />

            {/* 4. Subscription & Management */}
            <Route path="/subscription" element={<SubscriptionScreen />} />

            {/* 5. Notifications & Settings */}
            <Route path="/notifications" element={<NotificationsScreen />} />
            <Route path="/notification-settings" element={<NotificationSettingsScreen />} />

            {/* 6. Authentication, Onboarding & Placement */}
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route path="/placement" element={<PlacementScreen />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
