import { Subscription, User } from '../types/domain';
import { MOCK_PERSONAS } from '../mock/data';

export interface DashboardPersona {
  id: string;
  label: string;
  desc: string;
  user: User;
  subscription: Subscription;
}

const base = MOCK_PERSONAS[0];

const sponsored: Subscription = {
  ...base.subscription,
  tier: 'full',
  source: 'org_sponsored',
  sponsorOrgName: 'مجتمع فولاد نمونه',
  status: 'active',
};

function member(
  over: Pick<User, 'id' | 'fullName' | 'nickname' | 'avatarSeed' | 'roles'> & Partial<User>
): User {
  return { ...base.user, ...over };
}

/**
 * Dashboard personas used to exercise the role guards and scope rules while the
 * server is not yet the authority. Dev-only; the whole folder ships nowhere.
 */
export const DASHBOARD_PERSONAS: DashboardPersona[] = [
  {
    id: 'org-admin',
    label: 'مدیر آموزش سازمان',
    desc: 'دسترسی کامل به تمام بخش‌های /org و همه واحدهای سازمان',
    subscription: sponsored,
    user: member({
      id: 'p-admin',
      fullName: 'فریبا رادمنش',
      nickname: 'فریبا',
      avatarSeed: 'radmanesh',
      roles: ['learner', 'org_admin'],
      membership: {
        orgId: 'org-foolad',
        orgName: 'مجتمع فولاد نمونه',
        orgRank: 'senior_manager',
        nodePath: ['فولاد نمونه', 'مدیریت آموزش و توسعه منابع انسانی'],
      },
    }),
  },
  {
    id: 'unit-manager-prod',
    label: 'معاون تولید',
    desc: 'مدیر واحد، محدود به زیردرخت معاونت تولید و عملیات (u-prod)',
    subscription: sponsored,
    user: member({
      id: 'p-prod',
      fullName: 'محمدرضا صادقی',
      nickname: 'محمدرضا',
      avatarSeed: 'sadeghi',
      roles: ['learner', 'unit_manager'],
      managedNodeId: 'u-prod',
      membership: {
        orgId: 'org-foolad',
        orgName: 'مجتمع فولاد نمونه',
        orgRank: 'middle_manager',
        nodePath: ['فولاد نمونه', 'معاونت تولید و عملیات'],
      },
    }),
  },
  {
    id: 'unit-manager-nord',
    label: 'سرپرست واحد نورد',
    desc: 'مدیر واحد، محدود به زیردرخت واحد نورد گرم و مقاطع (u-nord)',
    subscription: sponsored,
    user: member({
      id: 'p-nord',
      fullName: 'علیرضا رضایی',
      nickname: 'علیرضا',
      avatarSeed: 'rezaei',
      roles: ['learner', 'unit_manager'],
      managedNodeId: 'u-nord',
      membership: {
        orgId: 'org-foolad',
        orgName: 'مجتمع فولاد نمونه',
        orgRank: 'supervisor',
        nodePath: ['فولاد نمونه', 'معاونت تولید و عملیات', 'واحد نورد گرم و مقاطع'],
      },
    }),
  },
  {
    id: 'learner',
    label: 'یادگیرنده ساده',
    desc: 'بدون نقش مدیریتی؛ ورود به /org باید به صفحه اصلی بازگردانده شود',
    subscription: sponsored,
    user: member({
      id: 'p-learner',
      fullName: 'زهرا کریمی',
      nickname: 'زهرا',
      avatarSeed: 'karimi',
      roles: ['learner'],
      managedNodeId: undefined,
      membership: {
        orgId: 'org-foolad',
        orgName: 'مجتمع فولاد نمونه',
        orgRank: 'operator',
        nodePath: ['فولاد نمونه', 'معاونت تولید و عملیات', 'واحد نورد گرم و مقاطع'],
      },
    }),
  },
];
