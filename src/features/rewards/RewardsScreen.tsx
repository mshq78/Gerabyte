import React, { useState, useEffect } from 'react';
import { Gift, Coins, CheckCircle2, Building2 } from 'lucide-react';
import { rewardsApi } from '../../api/rewards';
import { Reward, RedeemedReward } from '../../types/domain';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../state/AppContext';
import { toFa } from '../../lib/toFa';
import { formatJalaliShort } from '../../lib/jalali';

export const RewardsScreen: React.FC = () => {
  const { user, updateUserLocal, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'store' | 'mine'>('store');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<RedeemedReward[]>([]);
  const [filter, setFilter] = useState<'all' | 'org' | 'gera'>('all');
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [newlyRedeemed, setNewlyRedeemed] = useState<RedeemedReward | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [storeList, redList] = await Promise.all([
          rewardsApi.list(),
          rewardsApi.myRedemptions(),
        ]);
        setRewards(storeList);
        setMyRedemptions(redList);
      } catch (err: any) {
        showToast(err.message || 'خطا در بارگذاری پاداش‌ها', 'error');
      }
    }
    load();
  }, [showToast]);

  const handleRedeem = async (reward: Reward) => {
    if (user.coins < reward.costCoins) {
      showToast(`موجودی سکه شما (${toFa(user.coins)}) برای این جایزه کافی نیست.`, 'error');
      return;
    }

    try {
      setRedeemingId(reward.id);
      const res = await rewardsApi.redeem(reward.id);
      updateUserLocal({ coins: res.remainingCoins });
      setMyRedemptions((prev) => [res.redemption, ...prev]);
      setNewlyRedeemed(res.redemption);
      showToast(`جایزه «${reward.title}» با موفقیت دریافت شد!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در دریافت جایزه', 'error');
    } finally {
      setRedeemingId(null);
    }
  };

  const filteredRewards = rewards.filter((r) => {
    if (filter === 'all') return true;
    return r.provider === filter;
  });

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 text-ink">
      {/* 1. Header with Coins Balance */}
      <header className="p-4 rounded-tile bg-surface border border-sunken shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-title font-black text-ink">جوایز و هدایای شایستگی</h2>
          <p className="text-meta text-ink/60 mt-0.5">
            تبدیل سکه‌های کسب‌شده از گرابایت‌ها به پاداش‌های واقعی
          </p>
        </div>

        {/* Tactile Coin Badge */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-tile bg-domain-5-tint border border-coin/40 shadow-xs min-h-[48px]">
          <Coins className="w-5 h-5 text-coin stroke-[2.2]" aria-hidden="true" />
          <div>
            <span className="text-meta text-ink/60 block font-semibold">موجودی سکه</span>
            <span className="text-body font-black text-ink">{toFa(user.coins)} سکه</span>
          </div>
        </div>
      </header>

      {/* 2. Primary Tabs */}
      <div className="flex items-center gap-2 p-1 bg-surface rounded-tile border border-sunken">
        <button
          onClick={() => setActiveTab('store')}
          className={`flex-1 min-h-[48px] py-2 rounded-tile text-meta font-bold transition-all cursor-pointer ${
            activeTab === 'store'
              ? 'bg-primary text-surface shadow-xs'
              : 'text-ink/70 hover:text-ink'
          }`}
        >
          ویترین جوایز
        </button>
        <button
          onClick={() => setActiveTab('mine')}
          className={`flex-1 min-h-[48px] py-2 rounded-tile text-meta font-bold transition-all cursor-pointer relative ${
            activeTab === 'mine'
              ? 'bg-primary text-surface shadow-xs'
              : 'text-ink/70 hover:text-ink'
          }`}
        >
          جوایز دریافت شده من ({toFa(myRedemptions.length)})
        </button>
      </div>

      {/* NEWLY REDEEMED VOUCHER MODAL / BANNER */}
      {newlyRedeemed && (
        <div className="p-4 rounded-tile bg-domain-3-tint border-2 border-success shadow-md space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-meta font-bold text-success">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              <span>پاداش شما صادر شد:</span>
            </div>
            <button
              onClick={() => setNewlyRedeemed(null)}
              className="text-meta text-ink/50 hover:text-ink cursor-pointer min-h-[48px] px-2 flex items-center"
            >
              بستن
            </button>
          </div>
          <h4 className="font-black text-body text-ink">{newlyRedeemed.title}</h4>
          <div className="p-3 rounded-tile bg-surface border border-success/30 flex items-center justify-between">
            <span className="text-meta text-ink/70 font-semibold">کد پیگیری / ووچر:</span>
            <span className="font-mono text-body font-bold text-primary tracking-wider select-all">
              {newlyRedeemed.voucherCode}
            </span>
          </div>
        </div>
      )}

      {/* TAB 1: STORE */}
      {activeTab === 'store' && (
        <div className="space-y-3">
          {/* Sub-filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-meta">
            <button
              onClick={() => setFilter('all')}
              className={`min-h-[48px] px-3.5 py-1.5 rounded-tile font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-primary text-surface'
                  : 'bg-surface text-ink/70 border border-sunken hover:bg-canvas'
              }`}
            >
              همه موارد
            </button>
            <button
              onClick={() => setFilter('org')}
              className={`min-h-[48px] px-3.5 py-1.5 rounded-tile font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === 'org'
                  ? 'bg-primary text-surface'
                  : 'bg-surface text-ink/70 border border-sunken hover:bg-canvas'
              }`}
            >
              <Building2 className="w-4 h-4" aria-hidden="true" />
              <span>جوایز اختصاصی سازمان</span>
            </button>
            <button
              onClick={() => setFilter('gera')}
              className={`min-h-[48px] px-3.5 py-1.5 rounded-tile font-bold transition-all cursor-pointer ${
                filter === 'gera'
                  ? 'bg-primary text-surface'
                  : 'bg-surface text-ink/70 border border-sunken hover:bg-canvas'
              }`}
            >
              هدایای سراسری گرا
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-3">
            {filteredRewards.map((reward) => {
              const canAfford = user.coins >= reward.costCoins;
              const isRedeeming = redeemingId === reward.id;

              return (
                <div
                  key={reward.id}
                  className="p-4 rounded-tile bg-surface border border-sunken shadow-xs space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-meta font-bold px-2 py-0.5 rounded-tile ${
                            reward.provider === 'org'
                              ? 'bg-domain-1-tint text-primary'
                              : 'bg-domain-5-tint text-coin'
                          }`}
                        >
                          {reward.provider === 'org' ? 'سازمانی' : 'سراسری گرا'}
                        </span>
                        <span className="text-meta text-ink/50 font-medium">
                          موجودی: {toFa(reward.stock)} عدد
                        </span>
                      </div>
                      <h3 className="font-bold text-body text-ink">{reward.title}</h3>
                    </div>

                    {/* Price tag */}
                    <div className="text-left shrink-0">
                      <div className="flex items-center gap-1 font-black text-body text-primary">
                        <span>{toFa(reward.costCoins)}</span>
                        <Coins className="w-4 h-4 text-coin" aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  <p className="text-meta text-ink/75 leading-relaxed font-normal">
                    {reward.description}
                  </p>

                  <div className="pt-1 flex items-center justify-between border-t border-sunken">
                    <span className="text-meta text-ink/60">
                      {canAfford
                        ? 'شما موجودی کافی برای دریافت دارید'
                        : `نیاز به ${toFa(reward.costCoins - user.coins)} سکه دیگر`}
                    </span>

                    <Button
                      size="sm"
                      variant={canAfford ? 'accent' : 'secondary'}
                      disabled={!canAfford || reward.stock <= 0}
                      isLoading={isRedeeming}
                      onClick={() => handleRedeem(reward)}
                    >
                      {reward.stock <= 0 ? 'اتمام موجودی' : 'دریافت پاداش'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MY REDEMPTIONS */}
      {activeTab === 'mine' && (
        <div className="space-y-3">
          {myRedemptions.length === 0 ? (
            <div className="p-8 text-center text-meta text-ink/60 bg-surface rounded-tile border border-sunken space-y-3">
              <Gift className="w-8 h-8 mx-auto text-ink/40" aria-hidden="true" />
              <p>شما هنوز پاداشی دریافت نکرده‌اید. با تکمیل گرابایت‌ها سکه به دست آورید!</p>
            </div>
          ) : (
            myRedemptions.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-tile bg-surface border border-sunken shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-tile bg-domain-3-tint text-success text-meta font-bold">
                        معتبر و فعال
                      </span>
                      <span className="text-meta text-ink/50 font-mono">
                        {formatJalaliShort(item.redeemedAt)}
                      </span>
                    </div>
                    <h4 className="font-bold text-body text-ink mt-1">{item.title}</h4>
                  </div>

                  <div className="text-left font-mono font-bold text-meta text-ink/70">
                    {toFa(item.costCoins)} سکه
                  </div>
                </div>

                {/* Voucher code box */}
                <div className="p-3 rounded-tile bg-paper border border-sunken flex items-center justify-between">
                  <div>
                    <span className="text-meta text-ink/60 block font-semibold">
                      کد ووچر جهت تحویل به رفاهی سازمان:
                    </span>
                    <span className="font-mono text-body font-bold text-primary tracking-wider select-all">
                      {item.voucherCode}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard?.writeText(item.voucherCode);
                      showToast('کد ووچر کپی شد.', 'info');
                    }}
                  >
                    کپی کد
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
