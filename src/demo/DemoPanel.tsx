import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Wrench, ChevronDown, Calendar, RefreshCw, AlertTriangle, UserCheck } from 'lucide-react';
import { Sheet } from '../components/ui/Sheet';
import { Button } from '../components/ui/Button';
import { useApp } from '../state/AppContext';
import { MOCK_PERSONAS } from '../mock/data';
import { setErrorSimulation, isErrorSimulationEnabled } from '../api/client';

/**
 * DEMO_ONLY: Persona Switcher, Time-Travel and Error-Simulation Panel
 * Loaded when ?demo=1 is in URL or can be toggled by developer.
 * Must be deletable in one step without breaking the production build.
 */
export const DemoPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [simError, setSimError] = useState(() => isErrorSimulationEnabled());
  const { activePersonaIndex, switchPersona, advanceDay, endWeek, resetAllData } = useApp();
  const location = useLocation();

  // Check if ?demo=1 is in query or if user pressed developer handle
  const isDemoQuery = location.search.includes('demo=1');

  useEffect(() => {
    if (isDemoQuery) {
      setIsOpen(true);
    }
  }, [isDemoQuery]);

  const handleToggleErrorSim = () => {
    const next = !simError;
    setSimError(next);
    setErrorSimulation(next);
  };

  return (
    <>
      {/* Floating Demo Trigger Handle */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-4 z-40 px-3 py-2 rounded-full bg-[#0D3F6B] text-white text-xs font-bold shadow-lg border border-white/20 flex items-center gap-1.5 hover:bg-[#1E6FA8] active:scale-95 transition-all opacity-85 hover:opacity-100"
        title="پنل دمو و شبیه‌سازی پرسونای گرا"
      >
        <Wrench className="w-4 h-4 text-[#F2A93B]" />
        <span>دمو</span>
      </button>

      {/* Demo Sheet */}
      <Sheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="جعبه ابزار تست و دمو (DEMO_ONLY)"
        subtitle="تغییر پرسونای کاربری، شبیه‌سازی گذر زمان و مدیریت خطای شبکه"
      >
        <div className="space-y-5 text-[#0D3F6B]">
          {/* Persona Switcher */}
          <div>
            <label className="block text-xs font-bold text-[#0D3F6B]/80 mb-2">
              انتخاب پرسونای آزمایشی:
            </label>
            <div className="space-y-2">
              {MOCK_PERSONAS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => switchPersona(idx)}
                  className={`w-full p-3 rounded-xl text-right text-xs transition-all border ${
                    activePersonaIndex === idx
                      ? 'bg-[#EAF3F9] border-[#1E6FA8] font-bold text-[#0D3F6B] shadow-xs'
                      : 'bg-white border-[#E8E1D5] hover:bg-gray-50 text-[#0D3F6B]/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{p.label}</span>
                    {activePersonaIndex === idx && (
                      <span className="px-2 py-0.5 rounded-md bg-[#1E6FA8] text-white text-[10px]">
                        فعال
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#0D3F6B]/70 mt-1 leading-relaxed font-normal">
                    {p.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Time Travel Controls */}
          <div className="pt-2 border-t border-[#E8E1D5]">
            <label className="block text-xs font-bold text-[#0D3F6B]/80 mb-2">
              شبیه‌سازی زمان (Time-Travel):
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={advanceDay}
                leftIcon={<Calendar className="w-4 h-4 text-[#1E6FA8]" />}
              >
                +۱ روز بعد (ریست هدف)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={endWeek}
                leftIcon={<Calendar className="w-4 h-4 text-[#7A5BD6]" />}
              >
                پایان هفته (نتایج لیگ)
              </Button>
            </div>
          </div>

          {/* Network Error Simulation Toggle */}
          <div className="pt-2 border-t border-[#E8E1D5]">
            <label className="block text-xs font-bold text-[#0D3F6B]/80 mb-2">
              شبیه‌سازی شرایط شبکه و خطا:
            </label>
            <button
              onClick={handleToggleErrorSim}
              className={`w-full p-3 rounded-xl text-right text-xs font-semibold flex items-center justify-between border transition-all ${
                simError
                  ? 'bg-[#FDF2F0] border-[#D5483F] text-[#D5483F]'
                  : 'bg-white border-[#E8E1D5] text-[#0D3F6B]'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${simError ? 'text-[#D5483F]' : 'text-gray-400'}`} />
                <span>شبیه‌سازی خطای ۵۰۳ شبکه و قطعی سرور</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${simError ? 'bg-[#D5483F] text-white' : 'bg-gray-200 text-gray-700'}`}>
                {simError ? 'فعال' : 'غیرفعال'}
              </span>
            </button>
          </div>

          {/* Reset All Local Data */}
          <div className="pt-2 border-t border-[#E8E1D5]">
            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={resetAllData}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              ریست کامل داده‌ها و بازگشت به تنظیمات اولیه
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
};
