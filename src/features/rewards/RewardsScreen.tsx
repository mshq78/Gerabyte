import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Coins, CheckCircle2, ChevronLeft, ShieldCheck, Ticket, Building2 } from 'lucide-react';
import { rewardsApi } from '../../api/rewards';
import { Reward, RedeemedReward } from '../../types/domain';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../state/AppContext';
import { toFa } from '../../lib/toFa';
import { formatJalaliShort } from '../../lib/jalali';

export const RewardsScreen: React.FC = () => {
  const navigate = useNavigate();
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
    <div className="flex-1 flex flex-col p-4 space-y-4 text-[#0D3F6B]">
      {/* 1. Header with Coins Balance */}
      <header className="p-4 rounded-3xl bg-white border border-[#E8E1D5] shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-[#0D3F6B]">جوایز و هدایای شایستگی</h2>
          <p className="text-xs text-[#0D3F6B]/60 mt-0.5">
            تبدیل سکه‌های کسب‌شده از گرابایت‌ها به پاداش‌های واقعی
          </p>
        </div>

        {/* Tactile Coin Badge */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FEF6EC] border border-[#F2A93B]/40 shadow-xs">
          <Coins className="w-5 h-5 text-[#F2A93B] stroke-[2.2]" />
          <div>
            <span className="text-[10px] text-[#0D3F6B]/60 block font-semibold">موجودی سکه</span>
            <span className="text-sm font-black text-[#0D3F6B]">{toFa(user.coins)} سکه</span>
          </div>
        </div>
      </header>

      {/* 2. Primary Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-[#E8E1D5]">
        <button
          onClick={() => setActiveTab('store')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'store'
              ? 'bg-[#1E6FA8] text-white shadow-xs'
              : 'text-[#0D3F6B]/70 hover:text-[#0D3F6B]'
          }`}
        >
          ویترین جوایز
        </button>
        <button
          onClick={() => setActiveTab('mine')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === 'mine'
              ? 'bg-[#1E6FA8] text-white shadow-xs'
              : 'text-[#0D3F6B]/70 hover:text-[#0D3F6B]'
          }`}
        >
          جوایز دریافت شده من ({toFa(myRedemptions.length)})
        </button>
      </div>

      {/* NEWLY REDEEMED VOUCHER MODAL / BANNER */}
      {newlyRedeemed && (
        <div className="p-4 rounded-3xl bg-[#EDF8F6] border-2 border-[#2E9E6B] shadow-md space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#2E9E6B]">
              <CheckCircle2 className="w-4 h-4" />
              <span>پاداش شما صادر شد:</span>
            </div>
            <button
              onClick={() => setNewlyRedeemed(null)}
              className="text-xs text-[#0D3F6B]/50 hover:text-[#0D3F6B]"
            >
              بستن
            </button>
          </div>
          <h4 className="font-black text-sm">{newlyRedeemed.title}</h4>
          <div className="p-3 rounded-xl bg-white border border-[#2E9E6B]/30 flex items-center justify-between">
            <span className="text-xs text-[#0D3F6B]/70 font-semibold">کد پیگیری / ووچر:</span>
            <span className="font-mono text-sm font-bold text-[#1E6FA8] tracking-wider select-all">
              {newlyRedeemed.voucherCode}
            </span>
          </div>
        </div>
      )}

      {/* TAB 1: STORE */}
      {activeTab === 'store' && (
        <div className="space-y-3">
          {/* Sub-filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filter === 'all'
                  ? 'bg-[#0D3F6B] text-white'
                  : 'bg-white text-[#0D3F6B]/70 border border-[#E8E1D5]'
              }`}
            >
              همه موارد
            </button>
            <button
              onClick={() => setFilter('org')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                filter === 'org'
                  ? 'bg-[#0D3F6B] text-white'
                  : 'bg-white text-[#0D3F6B]/70 border border-[#E8E1D5]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>جوایز اختصاصی سازمان</span>
            </button>
            <button
              onClick={() => setFilter('gera')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filter === 'gera'
                  ? 'bg-[#0D3F6B] text-white'
                  : 'bg-white text-[#0D3F6B]/70 border border-[#E8E1D5]'
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
                  className="p-4 rounded-3xl bg-white border border-[#E8E1D5] shadow-xs space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            reward.provider === 'org'
                              ? 'bg-[#EAF3F9] text-[#1E6FA8]'
                              : 'bg-[#FEF6EC] text-[#E58A1F]'
                          }`}
                        >
                          {reward.provider === 'org' ? 'سازمانی' : 'سراسری گرا'}
                        </span>
                        <span className="text-[11px] text-[#0D3F6B]/50 font-medium">
                          موجودی: {toFa(reward.stock)} عدد
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-[#0D3F6B]">{reward.title}</h3>
                    </div>

                    {/* Price tag */}
                    <div className="text-left shrink-0">
                      <div className="flex items-center gap-1 font-black text-sm text-[#1E6FA8]">
                        <span>{toFa(reward.costCoins)}</span>
                        <Coins className="w-4 h-4 text-[#F2A93B]" />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#0D3F6B]/75 leading-relaxed font-normal">
                    {reward.description}
                  </p>

                  <div className="pt-1 flex items-center justify-between border-t border-[#E8E1D5]">
                    <span className="text-[11px] text-[#0D3F6B]/60">
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
            <div className="p-8 text-center text-xs text-[#0D3F6B]/60 bg-white rounded-3xl border border-[#E8E1D5] space-y-3">
              <Gift className="w-8 h-8 mx-auto text-[#0D3F6B]/40" />
              <p>شما هنوز پاداشی دریافت نکرده‌اید. با تکمیل گرابایت‌ها سکه به دست آورید!</p>
            </div>
          ) : (
            myRedemptions.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-white border border-[#E8E1D5] shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#EDF8F6] text-[#2E9E6B] text-[10px] font-bold">
                        معتبر و فعال
                      </span>
                      <span className="text-[10px] text-[#0D3F6B]/50 font-mono">
                        {formatJalaliShort(item.redeemedAt)}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#0D3F6B] mt-1">{item.title}</h4>
                  </div>

                  <div className="text-left font-mono font-bold text-xs text-[#0D3F6B]/70">
                    {toFa(item.costCoins)} سکه
                  </div>
                </div>

                {/* Voucher code box */}
                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E1D5] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#0D3F6B]/60 block font-semibold">
                      کد ووچر جهت تحویل به رفاهی سازمان:
                    </span>
                    <span className="font-mono text-sm font-bold text-[#1E6FA8] tracking-wider select-all">
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
