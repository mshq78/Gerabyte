import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import {
  Award,
  BarChart3,
  CreditCard,
  GraduationCap,
  LineChart,
  Settings,
  Trophy,
  UploadCloud,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '../../lib/permissions';

/**
 * The organization dashboard's routing table, in one place.
 *
 * The sidebar and the router are both generated from this list, so a screen
 * cannot be reachable by URL while hidden from the menu — which is exactly
 * how `/org/import`, `/org/subscriptions` and `/org/settings` ended up open
 * to a unit manager who typed the address.
 *
 * The permission here is a UX affordance. The server checks the same
 * permission from the same shared matrix, and that check is the real one.
 */
export interface OrgRoute {
  path: string;
  /** Sidebar label; omitted for routes that are not menu entries. */
  label?: string;
  icon?: LucideIcon;
  permission: Permission;
  Component: LazyExoticComponent<ComponentType>;
}

const OrgOverviewScreen = lazy(() =>
  import('./screens/OrgOverviewScreen').then((m) => ({ default: m.OrgOverviewScreen }))
);
const OrgPeopleScreen = lazy(() =>
  import('./screens/OrgPeopleScreen').then((m) => ({ default: m.OrgPeopleScreen }))
);
const OrgPersonDetailScreen = lazy(() =>
  import('./screens/OrgPersonDetailScreen').then((m) => ({ default: m.OrgPersonDetailScreen }))
);
const OrgImportScreen = lazy(() =>
  import('./screens/OrgImportScreen').then((m) => ({ default: m.OrgImportScreen }))
);
const OrgAssignmentsScreen = lazy(() =>
  import('./screens/OrgAssignmentsScreen').then((m) => ({ default: m.OrgAssignmentsScreen }))
);
const OrgChallengesScreen = lazy(() =>
  import('./screens/OrgChallengesScreen').then((m) => ({ default: m.OrgChallengesScreen }))
);
const OrgChallengeNewScreen = lazy(() =>
  import('./screens/OrgChallengeNewScreen').then((m) => ({ default: m.OrgChallengeNewScreen }))
);
const OrgChallengeDetailScreen = lazy(() =>
  import('./screens/OrgChallengeDetailScreen').then((m) => ({
    default: m.OrgChallengeDetailScreen,
  }))
);
const OrgSubscriptionsScreen = lazy(() =>
  import('./screens/OrgSubscriptionsScreen').then((m) => ({ default: m.OrgSubscriptionsScreen }))
);
const OrgCertificatesScreen = lazy(() =>
  import('./screens/OrgCertificatesScreen').then((m) => ({ default: m.OrgCertificatesScreen }))
);
const OrgEffectivenessScreen = lazy(() =>
  import('./screens/OrgEffectivenessScreen').then((m) => ({ default: m.OrgEffectivenessScreen }))
);
const OrgSettingsScreen = lazy(() =>
  import('./screens/OrgSettingsScreen').then((m) => ({ default: m.OrgSettingsScreen }))
);
const OrgReportsScreen = lazy(() =>
  import('./screens/OrgReportsScreen').then((m) => ({ default: m.OrgReportsScreen }))
);

export const ORG_ROUTES: readonly OrgRoute[] = [
  {
    path: '/org/overview',
    label: 'نمای کلی و شاخص‌ها',
    icon: BarChart3,
    permission: 'org.dashboard.view',
    Component: OrgOverviewScreen,
  },
  {
    path: '/org/people',
    label: 'همکاران و مدیریت دسترسی',
    icon: Users,
    permission: 'org.people.read',
    Component: OrgPeopleScreen,
  },
  {
    path: '/org/people/:id',
    permission: 'org.person.read',
    Component: OrgPersonDetailScreen,
  },
  {
    path: '/org/import',
    label: 'بارگذاری گروهی پرسنل',
    icon: UploadCloud,
    permission: 'org.import.manage',
    Component: OrgImportScreen,
  },
  {
    path: '/org/assignments',
    label: 'مأموریت‌ها و مسیرها',
    icon: GraduationCap,
    permission: 'org.assignments.manage',
    Component: OrgAssignmentsScreen,
  },
  {
    path: '/org/challenges',
    label: 'چالش‌های سازمانی',
    icon: Trophy,
    permission: 'org.challenges.manage',
    Component: OrgChallengesScreen,
  },
  {
    path: '/org/challenges/new',
    permission: 'org.challenges.manage',
    Component: OrgChallengeNewScreen,
  },
  {
    path: '/org/challenges/:id',
    permission: 'org.challenges.manage',
    Component: OrgChallengeDetailScreen,
  },
  {
    path: '/org/certificates',
    label: 'گواهینامه‌های رسمی',
    icon: Award,
    permission: 'org.certificates.view',
    Component: OrgCertificatesScreen,
  },
  {
    path: '/org/effectiveness',
    label: 'ارزیابی اثربخشی (L1-L4)',
    icon: LineChart,
    permission: 'org.effectiveness.view',
    Component: OrgEffectivenessScreen,
  },
  {
    path: '/org/subscriptions',
    label: 'سهمیه‌ها و اشتراک‌ها',
    icon: CreditCard,
    permission: 'org.subscriptions.manage',
    Component: OrgSubscriptionsScreen,
  },
  {
    path: '/org/reports',
    label: 'گزارش‌های تحلیلی و چاپ',
    icon: BarChart3,
    permission: 'org.reports.view',
    Component: OrgReportsScreen,
  },
  {
    path: '/org/settings',
    label: 'تنظیمات و ساختار درخت',
    icon: Settings,
    permission: 'org.settings.manage',
    Component: OrgSettingsScreen,
  },
];

/** The subset that appears in the sidebar, in menu order. */
export const ORG_NAV_ITEMS = ORG_ROUTES.filter(
  (route): route is OrgRoute & { label: string; icon: LucideIcon } =>
    Boolean(route.label && route.icon)
);
