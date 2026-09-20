import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, ArrowRight, Gift, CheckCircle2 } from 'lucide-react';
import { subscriptionApi, SubscriptionPlan } from '../../api/subscription';
import { Subscription } from '../../types/domain';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../state/AppContext';
import { toFa } from '../../lib/toFa';

export const SubscriptionScreen: React.FC = () => {
  const navigate = useNavigate();
  const { subscription, setSubscriptionLocal, showToast } = useApp();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan-3m');
  const [activationCode, setActivationCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<{
    referenceId: string;
    subscription: Subscription;
  } | null>(null);

  useEffect(() => {
    async function loadPlans() {
      try {
        const list = await subscriptionApi.plans();
        setPlans(list);
        if (list.length > 1) {
          setSelectedPlanId(list[1].id);
        }
      } catch {
        showToast('خطا در دریافت لیست پلن‌ها', 'error');
      }
    }
    loadPlans();
  }, [showToast]);

  const handleApplyCode = async () => {
    if (!activationCode.trim()) {
      showToast('لطفاً کد فعال‌سازی را وارد کنید.', 'info');
      return;
    }
    try {
      setIsActivating(true);
      const res = await subscriptionApi.redeemActivationCode(activationCode);
      setSubscriptionLocal(res.subscription);
      showToast(res.message || 'کد فعال‌سازی با موفقیت اعمال گردید!', 'success');
      setActivationCode('');
    } catch (err: any) {
      showToast(err.message || 'کد فعال‌سازی نامعتبر است.', 'error');
    } finally {
      setIsActivating(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true);
      const res = await subscriptionApi.checkout(selectedPlanId);
      setCheckoutResult({
        referenceId: res.referenceId,
        subscription: res.subscription,
      });
      setSubscriptionLocal(res.subscription);
      showToast('پرداخت تستی با موفقیت انجام شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در انجام تراکنش.', 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // SUCCESS CHECKOUT SCREEN
  if (checkoutResult) {
    return (
      <div className="min-h-screen bg-canvas p-5 flex flex-col justify-between text-ink">
        <div className="my-auto py-6 max-w-sm mx-auto w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-sheet bg-domain-3-tint text-success flex items-center justify-center mx-auto border border-success/30 shadow-md">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" aria-hidden="true" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-pill bg-domain-3-tint text-success text-meta font-bold">
              تراکنش موفقیت‌آمیز
            </span>
            <h2 className="text-title font-black mt-2 text-ink">اشتراک کامل شما فعال شد</h2>
            <p className="text-meta text-ink/70 mt-1">
              تمام دروس، آزمون‌های صدور مدرک و جوایز اکنون بازگشایی شدند.
            </p>
          </div>

          <div className="p-4 rounded-tile bg-surface border border-sunken shadow-xs text-meta text-right space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-ink/60">شماره مرجع پرداخت:</span>
              <span className="font-mono font-bold">{checkoutResult.referenceId}</span>
            </div>
            <div className="flex items-center justify-between border-t border-sunken pt-2">
              <span className="text-ink/60">مدت اشتراک اعطا شده:</span>
              <span className="font-bold text-primary">
                {toFa(checkoutResult.subscription.remainingDays || 30)} روز دسترسی کامل
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 max-w-sm mx-auto w-full">
          <Button fullWidth size="lg" onClick={() => navigate('/path')}>
            شروع یادگیری با اشتراک کامل
          </Button>
        </div>
      </div>
    );
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  return (
    <div className="flex-1 flex flex-col p-4 space-y-5 text-ink">
      {/* Header */}
      <header className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="min-h-[48px] px-3 py-2 rounded-tile text-ink/60 hover:text-ink hover:bg-surface flex items-center gap-1.5 text-meta font-bold cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
          <span>بازگشت</span>
        </button>
        <span className="text-meta font-bold text-primary bg-domain-1-tint px-3 py-1.5 rounded-pill">
          پلن‌های عضویت
        </span>
      </header>

      {/* 1. Current Subscription Status Variant Card */}
      <div className="p-4 rounded-sheet bg-surface border border-sunken shadow-xs space-y-2">
        <span className="text-meta font-bold text-primary">وضعیت اشتراک کنونی:</span>
        <div className="flex items-center justify-between">
          <h3 className="font-black text-body text-ink">
            {subscription.source === 'org_sponsored'
              ? `اشتراک هدیه سازمان (${subscription.sponsorOrgName || 'فولاد نمونه'})`
              : subscription.tier === 'full'
                ? 'اشتراک کامل فردی'
                : 'طرح پایه و رایگان'}
          </h3>
          <span
            className={`text-meta font-bold px-2.5 py-0.5 rounded-pill ${
              subscription.status === 'active'
                ? 'bg-domain-3-tint text-success'
                : subscription.status === 'expiring'
                  ? 'bg-domain-5-tint text-coin'
                  : 'bg-sunken text-ink'
            }`}
          >
            {subscription.status === 'active' && subscription.remainingDays
              ? `${toFa(subscription.remainingDays)} روز مانده`
              : subscription.status === 'expiring' && subscription.remainingDays
                ? `تنها ${toFa(subscription.remainingDays)} روز مانده`
                : 'منقضی شده'}
          </span>
        </div>
        {subscription.source === 'org_sponsored' && (
          <p className="text-meta text-ink/70 leading-relaxed">
            این اشتراک توسط سازمان شما تأمین مالی شده و تا پایان مهلت اعتبار فعال است.
          </p>
        )}
      </div>

      {/* 2. Compare Free vs Full Table */}
      <div className="p-4 rounded-sheet bg-surface border border-sunken shadow-xs space-y-3">
        <h3 className="font-bold text-body text-ink">مقایسه امکانات طرح «رایگان» و طرح «کامل»:</h3>

        <div className="overflow-hidden rounded-tile border border-sunken text-meta">
          <table className="w-full text-right divide-y divide-sunken">
            <thead className="bg-paper text-meta font-bold text-ink/70">
              <tr>
                <th className="p-2.5">قابلیت</th>
                <th className="p-2.5 text-center">رایگان</th>
                <th className="p-2.5 text-center text-primary">کامل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sunken font-medium">
              <tr>
                <td className="p-2.5">دروس پایه هر فصل</td>
                <td className="p-2.5 text-center text-success">✓</td>
                <td className="p-2.5 text-center text-success">✓</td>
              </tr>
              <tr>
                <td className="p-2.5">تمام دروس تخصصی</td>
                <td className="p-2.5 text-center text-danger">✗</td>
                <td className="p-2.5 text-center text-success">✓</td>
              </tr>
              <tr>
                <td className="p-2.5">آزمون و گواهینامه معتبر QR</td>
                <td className="p-2.5 text-center text-danger">✗</td>
                <td className="p-2.5 text-center text-success">✓</td>
              </tr>
              <tr>
                <td className="p-2.5">دریافت سکه و تبادل با جوایز</td>
                <td className="p-2.5 text-center text-danger">✗</td>
                <td className="p-2.5 text-center text-success">✓</td>
              </tr>
              <tr>
                <td className="p-2.5">شرکت در لیگ و پویش‌ها</td>
                <td className="p-2.5 text-center text-success">✓</td>
                <td className="p-2.5 text-center text-success">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Pricing Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-body text-ink">تعرفه‌ها و طرح‌های اشتراک:</h3>
          <span className="text-meta text-ink/50 font-bold">(قیمت‌ها نمایشی آزمایشی)</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`p-3 min-h-[48px] rounded-tile border-2 transition-all cursor-pointer flex flex-col justify-between select-none ${
                  isSelected
                    ? 'bg-surface border-primary shadow-md'
                    : 'bg-surface/60 border-sunken hover:border-sunken-darker'
                }`}
              >
                <div>
                  {plan.discountBadge && (
                    <span className="text-meta font-black text-surface bg-coin px-1.5 py-0.5 rounded-pill inline-block mb-1">
                      {plan.discountBadge}
                    </span>
                  )}
                  <h4 className="font-bold text-body leading-tight text-ink">{plan.name}</h4>
                </div>

                <div className="my-2">
                  <span className="font-black text-body text-primary block leading-tight">
                    {plan.formattedPrice}
                  </span>
                </div>

                <div
                  className={`w-4 h-4 rounded-pill border mx-auto flex items-center justify-center ${
                    isSelected ? 'border-primary bg-primary text-surface' : 'border-sunken-darker'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checkout CTA */}
      <Button
        fullWidth
        size="lg"
        variant="accent"
        isLoading={isCheckingOut}
        onClick={handleCheckout}
        leftIcon={<CreditCard className="w-5 h-5" aria-hidden="true" />}
      >
        ارتقا به اشتراک کامل {selectedPlan ? `(${selectedPlan.formattedPrice})` : ''}
      </Button>

      {/* 4. Activation Code Input */}
      <div className="p-4 rounded-sheet bg-surface border border-sunken shadow-xs space-y-2.5">
        <div className="flex items-center gap-1.5 text-body font-bold text-ink">
          <Gift className="w-4 h-4 text-primary" aria-hidden="true" />
          <span>کد فعال‌سازی سازمانی یا کارت هدیه:</span>
        </div>
        <p className="text-meta text-ink/70 leading-relaxed">
          اگر از طرف سازمان خود کد فعال‌سازی دریافت کرده‌اید، آن را وارد نمایید (نمونه:
          FOOLAD-2026):
        </p>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={activationCode}
            onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
            placeholder="مثال: FOOLAD-2026"
            className="flex-1 min-h-[48px] h-12 px-3 rounded-tile border border-sunken text-meta font-mono font-bold text-center outline-none focus:border-primary text-ink bg-surface"
          />
          <Button size="sm" variant="secondary" isLoading={isActivating} onClick={handleApplyCode}>
            اعمال کد
          </Button>
        </div>
      </div>
    </div>
  );
};
