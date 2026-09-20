import { mockRequest } from './client';
import { Reward, RedeemedReward } from '../types/domain';
import { MOCK_REWARDS } from '../mock/data';
import { getStoredUser, setStoredUser } from './auth';

const STORAGE_REDEMPTIONS_KEY = 'gerabyte:my_redemptions';

function getStoredRedemptions(): RedeemedReward[] {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_REDEMPTIONS_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
  }
  return [
    {
      id: 'red-seed-1',
      rewardId: 'rew-org-4',
      title: 'کارت هدیه خرید کتاب از بوک‌استور کارخانه',
      redeemedAt: '2026-09-10T14:20:00Z',
      voucherCode: 'FOOLAD-BOOK-۹۸۲۴',
      costCoins: 60,
      provider: 'org',
      status: 'valid',
    },
  ];
}

function saveRedemptions(list: RedeemedReward[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_REDEMPTIONS_KEY, JSON.stringify(list));
  }
}

export const rewardsApi = {
  // TODO(backend): GET /api/v1/rewards
  async list(): Promise<Reward[]> {
    return mockRequest(() => MOCK_REWARDS, { endpoint: '/api/v1/rewards' });
  },

  // TODO(backend): GET /api/v1/rewards/my-redemptions
  async myRedemptions(): Promise<RedeemedReward[]> {
    return mockRequest(() => getStoredRedemptions(), {
      endpoint: '/api/v1/rewards/my-redemptions',
    });
  },

  // TODO(backend): POST /api/v1/rewards/:id/redeem
  async redeem(
    id: string
  ): Promise<{ success: boolean; redemption: RedeemedReward; remainingCoins: number }> {
    return mockRequest(
      () => {
        const user = getStoredUser();
        const reward = MOCK_REWARDS.find((r) => r.id === id);
        if (!reward) {
          throw new Error('جایزه موردنظر یافت نشد.');
        }

        if (user.coins < reward.costCoins) {
          throw new Error(
            `موجودی سکه شما (${user.coins}) برای دریافت این جایزه (${reward.costCoins} سکه) کافی نیست.`
          );
        }

        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const voucherCode = `${reward.provider.toUpperCase()}-GB-${randomCode}`;

        const newRedemption: RedeemedReward = {
          id: 'red_' + Date.now(),
          rewardId: reward.id,
          title: reward.title,
          redeemedAt: new Date().toISOString(),
          voucherCode,
          costCoins: reward.costCoins,
          provider: reward.provider,
          status: 'valid',
        };

        const updatedUser = {
          ...user,
          coins: user.coins - reward.costCoins,
        };
        setStoredUser(updatedUser);

        const redemptions = getStoredRedemptions();
        saveRedemptions([newRedemption, ...redemptions]);

        return {
          success: true,
          redemption: newRedemption,
          remainingCoins: updatedUser.coins,
        };
      },
      { endpoint: `/api/v1/rewards/${id}/redeem` }
    );
  },
};
