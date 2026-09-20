import { mockRequest } from './client';
import { Subscription } from '../types/domain';
import { MOCK_PERSONAS } from '../mock/data';

const STORAGE_SUB_KEY = 'gerabyte:subscription';

export interface SubscriptionPlan {
  id: string;
  name: string;
  durationMonths: number;
  priceRials: number;
  formattedPrice: string;
  discountBadge?: string;
  isPopular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-1m',
    name: 'اشتراک ۱ ماهه فردی',
    durationMonths: 1,
    priceRials: 1900000,
    formattedPrice: '۱۹۰٬۰۰۰ تومان',
  },
  {
    id: 'plan-3m',
    name: 'اشتراک ۳ ماهه فصلی',
    durationMonths: 3,
    priceRials: 4800000,
    formattedPrice: '۴۸۰٬۰۰۰ تومان',
    discountBadge: '۱۵٪ صرفه‌جویی',
    isPopular: true,
  },
  {
    id: 'plan-12m',
    name: 'اشتراک ۱ ساله جامع',
    durationMonths: 12,
    priceRials: 14900000,
    formattedPrice: '۱٬۴۹۰٬۰۰۰ تومان',
    discountBadge: '۳۵٪ تخفیف ویژه',
  },
];

export function getStoredSubscription(): Subscription {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_SUB_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
  }
  return MOCK_PERSONAS[0].subscription;
}

export function saveSubscription(sub: Subscription): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_SUB_KEY, JSON.stringify(sub));
  }
}

export const subscriptionApi = {
  // TODO(backend): GET /api/v1/subscription
  async get(): Promise<Subscription> {
    return mockRequest(() => getStoredSubscription(), { endpoint: '/api/v1/subscription' });
  },

  // TODO(backend): GET /api/v1/subscription/plans
  async plans(): Promise<SubscriptionPlan[]> {
    return mockRequest(() => SUBSCRIPTION_PLANS, { endpoint: '/api/v1/subscription/plans' });
  },

  // TODO(backend): POST /api/v1/subscription/redeem-code
  async redeemActivationCode(
    code: string
  ): Promise<{ success: boolean; subscription: Subscription; message: string }> {
    return mockRequest(
      () => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) {
          throw new Error('لطفاً کد فعال‌سازی را وارد نمایید.');
        }

        let newSub: Subscription;
        let message = '';

        if (trimmed.startsWith('FOOLAD') || trimmed.startsWith('GERA-ORG')) {
          newSub = {
            tier: 'full',
            source: 'org_sponsored',
            sponsorOrgName: 'مجتمع فولاد نمونه',
            startsAt: new Date().toISOString(),
            endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            remainingDays: 90,
          };
          message = 'اشتراک سازمانی فولاد نمونه با موفقیت به مدت ۹۰ روز برای شما فعال شد.';
        } else {
          newSub = {
            tier: 'full',
            source: 'personal',
            startsAt: new Date().toISOString(),
            endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            remainingDays: 30,
          };
          message = 'کد هدیه اشتراک کامل با موفقیت اعمال گردید (اعتبار ۳۰ روز).';
        }

        saveSubscription(newSub);
        return { success: true, subscription: newSub, message };
      },
      { endpoint: '/api/v1/subscription/redeem-code' }
    );
  },

  // TODO(backend): POST /api/v1/subscription/checkout
  async checkout(
    planId: string
  ): Promise<{ success: boolean; subscription: Subscription; referenceId: string }> {
    return mockRequest(
      () => {
        const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[1];
        const days = plan.durationMonths * 30;

        const newSub: Subscription = {
          tier: 'full',
          source: 'personal',
          startsAt: new Date().toISOString(),
          endsAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          remainingDays: days,
        };

        saveSubscription(newSub);

        return {
          success: true,
          subscription: newSub,
          referenceId: 'GB-PAY-' + Math.floor(10000000 + Math.random() * 90000000),
        };
      },
      { endpoint: '/api/v1/subscription/checkout' }
    );
  },
};
