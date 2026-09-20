import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Wrench, Calendar, RefreshCw, AlertTriangle, UserCheck } from 'lucide-react';
import { Sheet } from '../components/ui/Sheet';
import { Button } from '../components/ui/Button';
import { useApp } from '../state/AppContext';
import { MOCK_PERSONAS } from '../mock/data';
import { setErrorSimulation, isErrorSimulationEnabled } from '../api/client';
import { setStoredUser } from '../api/auth';
import { saveSubscription } from '../api/subscription';
import { User } from '../types/domain';

/**
 * DEMO_ONLY: Persona Switcher, Time-Travel and Error-Simulation Panel
 * Rendered ONLY when ?demo=1 is in URL or sessionStorage has gerabyte:demo = '1'.
 * Deleting the src/demo/ folder and the <DemoPanel /> line in LearnerShell
 * leaves the project building with no errors and no demo UI.
 */
export const DemoPanel: React.FC = () => {
  const location = useLocation();
  const { setUser, setSubscriptionLocal, updateUserLocal, showToast } = useApp();

  // 1. URL search or sessionStorage check
  const [isDemoActive, setIsDemoActive] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === '1') {
      sessionStorage.setItem('gerabyte:demo', '1');
      return true;
    }
    return sessionStorage.getItem('gerabyte:demo') === '1';
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('demo') === '1') {
      sessionStorage.setItem('gerabyte:demo', '1');
      setIsDemoActive(true);
    }
  }, [location.search]);

  const [isOpen, setIsOpen] = useState(false);
  const [activePersonaIndex, setActivePersonaIndex] = useState(0);
  const [simError, setSimError] = useState(() => isErrorSimulationEnabled());

  // Demo actions
  const handleSwitchPersona = useCallback(
    (index: number) => {
      const persona = MOCK_PERSONAS[index];
      if (!persona) return;
      setActivePersonaIndex(index);
      setUser(persona.user);
      setStoredUser(persona.user);
      setSubscriptionLocal(persona.subscription);
      saveSubscription(persona.subscription);
      if (typeof window !== 'undefined') {
        localStorage.setItem('gerabyte:session', '1');
      }
      showToast(`پرسونای «${persona.label}» بارگذاری شد.`, 'info');
    },
    [setUser, setSubscriptionLocal, showToast]
  );

  const handleAdvanceDay = useCallback(() => {
    updateUserLocal((prev: User) => {
      const goalMet = prev.todayCompletedCount >= prev.dailyGoal;
      const nextStreak = goalMet ? prev.streakDays + 1 : Math.max(0, prev.streakDays);
      const updated: User = {
        ...prev,
        todayCompletedCount: 0,
        streakDays: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
      };
      setStoredUser(updated);
      return updated;
    });

    setSubscriptionLocal({
      ...MOCK_PERSONAS[activePersonaIndex]?.subscription,
      remainingDays: Math.max(
        0,
        (MOCK_PERSONAS[activePersonaIndex]?.subscription?.remainingDays ?? 10) - 1
      ),
    });

    showToast('یک روز به جلو حرکت کردید. هدف روزانه ریست شد.', 'success');
  }, [updateUserLocal, setSubscriptionLocal, activePersonaIndex, showToast]);

  const handleEndWeek = useCallback(() => {
    updateUserLocal((prev: User) => {
      const updated: User = {
        ...prev,
        xpTotal: prev.xpTotal + 50,
        coins: prev.coins + 5,
      };
      setStoredUser(updated);
      return updated;
    });
    showToast('هفته لیگ به پایان رسید و نتایج محاسبه شد (+۵۰ تجربه هفتگی).', 'success');
  }, [updateUserLocal, showToast]);

  const handleResetAllData = useCallback(() => {
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('gerabyte:'));
      keys.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem('gerabyte:session', '1');
    }
    const defaultPersona = MOCK_PERSONAS[0];
    setUser(defaultPersona.user);
    setStoredUser(defaultPersona.user);
    setSubscriptionLocal(defaultPersona.subscription);
    setActivePersonaIndex(0);
    showToast('تمام داده‌های محلی ریست و بازیابی شدند.', 'info');
  }, [setUser, setSubscriptionLocal, showToast]);

  const handleToggleErrorSim = () => {
    const next = !simError;
    setSimError(next);
    setErrorSimulation(next);
  };

  // If demo is not activated via ?demo=1 or sessionStorage, render nothing!
  if (!isDemoActive) {
    return null;
  }

  return (
    <>
      {/* Floating Demo Trigger Handle */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="باز کردن پنل دمو و شبیه‌سازی"
        className="fixed bottom-24 left-4 z-40 min-h-[48px] min-w-[48px] px-3.5 py-2.5 rounded-full bg-ink text-surface text-meta font-bold shadow-lg border border-surface/20 flex items-center gap-2 hover:bg-primary active:scale-95 transition-all opacity-90 hover:opacity-100 cursor-pointer"
      >
        <Wrench className="w-5 h-5 text-coin" aria-hidden="true" />
        <span>دمو</span>
      </button>

      {/* Demo Sheet */}
      <Sheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="جعبه ابزار تست و دمو (DEMO_ONLY)"
        subtitle="تغییر پرسونای کاربری، شبیه‌سازی گذر زمان و مدیریت خطای شبکه"
      >
        <div className="space-y-5 text-ink">
          {/* Persona Switcher */}
          <div>
            <p id="demo-f1" className="block text-meta font-bold text-ink/80 mb-2">
              انتخاب پرسونای آزمایشی:
            </p>
            <div className="space-y-2" role="group" aria-labelledby="demo-f1">
              {MOCK_PERSONAS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSwitchPersona(idx)}
                  className={`w-full min-h-[48px] p-3 rounded-tile text-right text-meta transition-all border cursor-pointer ${
                    activePersonaIndex === idx
                      ? 'bg-domain-1-tint border-primary font-bold text-ink shadow-xs'
                      : 'bg-surface border-sunken hover:bg-canvas text-ink/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{p.label}</span>
                    {activePersonaIndex === idx && (
                      <span className="px-2.5 py-0.5 rounded-pill bg-primary text-surface text-meta">
                        فعال
                      </span>
                    )}
                  </div>
                  <p className="text-meta text-ink/70 mt-1 leading-relaxed font-normal">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Time Travel Controls */}
          <div className="pt-3 border-t border-sunken">
            <p id="demo-f2" className="block text-meta font-bold text-ink/80 mb-2">
              شبیه‌سازی زمان (Time-Travel):
            </p>
            <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby="demo-f2">
              <Button
                variant="secondary"
                size="md"
                onClick={handleAdvanceDay}
                leftIcon={<Calendar className="w-5 h-5 text-primary" aria-hidden="true" />}
              >
                +۱ روز بعد
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleEndWeek}
                leftIcon={<UserCheck className="w-5 h-5 text-coin" aria-hidden="true" />}
              >
                پایان هفته لیگ
              </Button>
            </div>
          </div>

          {/* Network Error Simulation */}
          <div className="pt-3 border-t border-sunken">
            <p id="demo-f3" className="block text-meta font-bold text-ink/80 mb-2">
              مدیریت خطای شبکه (Network Chaos):
            </p>
            <button
              onClick={handleToggleErrorSim}
              className={`w-full min-h-[48px] p-3 rounded-tile flex items-center justify-between border cursor-pointer text-meta font-bold transition-all ${
                simError
                  ? 'bg-domain-2-tint border-danger text-danger'
                  : 'bg-surface border-sunken text-ink/80 hover:bg-canvas'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={`w-5 h-5 ${simError ? 'text-danger' : 'text-ink/60'}`}
                  aria-hidden="true"
                />
                <span>شبیه‌سازی خطای تصادفی سرور (Network Error)</span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-pill text-meta ${
                  simError ? 'bg-danger text-surface' : 'bg-sunken text-ink/70'
                }`}
              >
                {simError ? 'فعال' : 'غیرفعال'}
              </span>
            </button>
          </div>

          {/* Quick Navigation to New Views */}
          <div className="pt-3 border-t border-sunken">
            <p id="demo-f4" className="block text-meta font-bold text-ink/80 mb-2">
              دسترسی سریع به بخش‌های سازمانی و دمو:
            </p>
            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-2"
              role="group"
              aria-labelledby="demo-f4"
            >
              <a
                href="/org/overview"
                className="min-h-[44px] px-3 py-2 rounded-tile bg-surface hover:bg-canvas border border-sunken text-center text-meta font-bold text-primary flex items-center justify-center"
              >
                داشبورد سازمان (/org)
              </a>
              <a
                href="/faq"
                className="min-h-[44px] px-3 py-2 rounded-tile bg-surface hover:bg-canvas border border-sunken text-center text-meta font-bold text-ink flex items-center justify-center"
              >
                پرسش‌های متداول (/faq)
              </a>
              <a
                href="/demo/palette"
                className="min-h-[44px] px-3 py-2 rounded-tile bg-surface hover:bg-canvas border border-sunken text-center text-meta font-bold text-ink flex items-center justify-center"
              >
                پالت رنگی (/demo/palette)
              </a>
            </div>
          </div>

          {/* Reset All Local Data */}
          <div className="pt-3 border-t border-sunken">
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={handleResetAllData}
              leftIcon={<RefreshCw className="w-5 h-5 text-ink/60" aria-hidden="true" />}
            >
              بازنشانی کامل تمام داده‌ها (Reset LocalStorage)
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
};
