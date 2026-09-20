import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { authApi } from '../../api/auth';
import { OTP_LENGTH } from '../../../shared/schemas/auth';
import { ApiError } from '../../api/http';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../state/AppContext';
import { toFa } from '../../lib/toFa';
import { errorMessage } from '../../lib/errors';

/** Prefer the server's Persian sentence; fall back to a local one. */
function apiMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  return errorMessage(error) || fallback;
}

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { refreshMe, updateMe, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'otp' | 'password'>('otp');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpDigits, setOtpDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(''));
  /** Opaque handle for the code in flight; never the code itself. */
  const [codeId, setCodeId] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);

  // First login confirmation step
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupFullName, setSetupFullName] = useState('');
  const [setupNickname, setSetupNickname] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP resend countdown
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (otpStep === 'verify' && resendTimer > 0) {
      timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpStep, resendTimer]);

  const handleRequestOtp = async () => {
    if (!mobile || mobile.length < 10) {
      showToast('لطفاً شماره موبایل معتبر وارد نمایید.', 'error');
      return;
    }
    try {
      setIsLoading(true);
      const result = await authApi.requestOtp(mobile);
      setCodeId(result.codeId);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setOtpStep('verify');
      setResendTimer(result.resendAfterSeconds);
      showToast(`کد ${toFa(OTP_LENGTH)} رقمی برای شما ارسال شد.`, 'info');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      showToast(apiMessage(err, 'خطا در ارسال کد'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    const next = [...otpDigits];
    next[index] = val;
    setOtpDigits(next);

    // Auto-advance
    if (val && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpDigits.join('');
    if (code.length < OTP_LENGTH || !codeId) {
      showToast(`لطفاً تمام ${toFa(OTP_LENGTH)} رقم کد را وارد فرمایید.`, 'info');
      return;
    }
    try {
      setIsLoading(true);
      await authApi.verifyOtp(mobile, codeId, code);
      const me = await refreshMe();
      // A brand-new account has no name yet: ask for one before going further.
      if (me && !me.onboardingCompleted) {
        setSetupFullName(me.fullName);
        setSetupNickname(me.nickname);
        setNeedsSetup(true);
      } else {
        showToast('ورود با موفقیت انجام شد.', 'success');
        navigate('/');
      }
    } catch (err) {
      showToast(apiMessage(err, 'کد وارد شده صحیح نمی‌باشد.'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!mobile || !password) {
      showToast('لطفاً شماره موبایل و کلمه عبور را وارد فرمایید.', 'error');
      return;
    }
    try {
      setIsLoading(true);
      await authApi.loginWithPassword(mobile, password);
      await refreshMe();
      showToast('ورود با موفقیت انجام شد.', 'success');
      navigate('/');
    } catch (err) {
      showToast(apiMessage(err, 'شماره موبایل یا کلمه عبور اشتباه است.'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSetup = async () => {
    try {
      setIsLoading(true);
      await updateMe({ fullName: setupFullName, nickname: setupNickname });
      showToast('اطلاعات کاربری ثبت شد.', 'success');
      navigate('/onboarding');
    } catch (err) {
      showToast(apiMessage(err, 'ثبت اطلاعات انجام نشد.'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas p-5 flex flex-col justify-between text-ink">
      {/* Brand Header */}
      <header className="text-center pt-8 pb-4 space-y-2">
        <div className="w-16 h-16 rounded-tile bg-ink text-surface flex items-center justify-center mx-auto shadow-md">
          <div className="w-8 h-8 rounded-tile border-2 border-surface flex items-center justify-center">
            <span className="font-black text-body">G</span>
          </div>
        </div>
        <h1 className="text-headline font-black text-ink">گرابایت · GeraByte</h1>
        <p className="text-meta text-ink/70 font-semibold">
          سامانه خردآموزی ۳ دقیقه‌ای شایستگی‌های شغلی و سازمانی
        </p>
      </header>

      {/* Main Login Card */}
      <div className="my-auto py-4 max-w-sm mx-auto w-full">
        {!needsSetup ? (
          <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-lg space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-2 p-1 bg-sunken/60 rounded-tile border border-sunken">
              <button
                onClick={() => {
                  setActiveTab('otp');
                  setOtpStep('request');
                }}
                className={`flex-1 min-h-[48px] py-2 rounded-tile text-meta font-bold transition-all cursor-pointer ${
                  activeTab === 'otp'
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink/70 hover:text-ink'
                }`}
              >
                کد یکبارمصرف (پیامک)
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`flex-1 min-h-[48px] py-2 rounded-tile text-meta font-bold transition-all cursor-pointer ${
                  activeTab === 'password'
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink/70 hover:text-ink'
                }`}
              >
                رمز عبور
              </button>
            </div>

            {/* TAB: OTP */}
            {activeTab === 'otp' && (
              <div className="space-y-4 pt-1">
                {otpStep === 'request' ? (
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="login-f1"
                        className="block text-meta font-bold mb-1.5 text-ink"
                      >
                        شماره تلفن همراه:
                      </label>
                      <input
                        id="login-f1"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        dir="ltr"
                        className="w-full min-h-[48px] h-12 px-4 rounded-tile border border-sunken bg-paper text-center font-mono font-bold text-body outline-none focus:border-primary text-ink"
                      />
                    </div>

                    <Button
                      fullWidth
                      size="lg"
                      variant="primary"
                      isLoading={isLoading}
                      onClick={handleRequestOtp}
                    >
                      ارسال کد تأیید ورود
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-meta text-ink/80">
                        کد {toFa(OTP_LENGTH)} رقمی ارسال شده به شماره{' '}
                        <strong>{toFa(mobile)}</strong> را وارد نمایید:
                      </p>
                    </div>

                    {/* Six auto-advancing boxes; the count follows OTP_LENGTH. */}
                    <div className="flex items-center justify-center gap-1.5" dir="ltr">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            inputRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-11 h-12 min-h-[48px] min-w-[44px] text-center text-title font-bold font-mono rounded-tile border-2 border-sunken focus:border-primary outline-none bg-paper text-ink"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-meta text-ink/70">
                      {resendTimer > 0 ? (
                        <span className="min-h-[48px] flex items-center">
                          ارسال مجدد تا {toFa(resendTimer)} ثانیه دیگر
                        </span>
                      ) : (
                        <button
                          onClick={handleRequestOtp}
                          className="min-h-[48px] flex items-center font-bold text-primary hover:underline cursor-pointer"
                        >
                          ارسال دوباره کد
                        </button>
                      )}
                      <button
                        onClick={() => setOtpStep('request')}
                        className="min-h-[48px] flex items-center text-meta underline text-ink/70 hover:text-ink cursor-pointer"
                      >
                        ویرایش شماره
                      </button>
                    </div>

                    <Button
                      fullWidth
                      size="lg"
                      variant="primary"
                      isLoading={isLoading}
                      onClick={handleVerifyOtp}
                    >
                      تأیید و ورود
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PASSWORD */}
            {activeTab === 'password' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label htmlFor="login-f2" className="block text-meta font-bold mb-1.5 text-ink">
                    شماره تلفن همراه:
                  </label>
                  <input
                    id="login-f2"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    dir="ltr"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className="w-full min-h-[48px] h-12 px-4 rounded-tile border border-sunken bg-paper text-center font-mono font-bold text-body outline-none focus:border-primary text-ink"
                  />
                </div>

                <div>
                  <label htmlFor="login-f3" className="block text-meta font-bold mb-1.5 text-ink">
                    کلمه عبور:
                  </label>
                  <input
                    id="login-f3"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full min-h-[48px] h-12 px-4 rounded-tile border border-sunken bg-paper text-center font-bold text-body outline-none focus:border-primary text-ink"
                  />
                </div>

                <Button
                  fullWidth
                  size="lg"
                  variant="primary"
                  isLoading={isLoading}
                  onClick={handlePasswordLogin}
                >
                  ورود با رمز عبور
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* FIRST LOGIN SETUP STEP */
          <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-lg space-y-4">
            <h3 className="font-bold text-title text-ink">تأیید مشخصات اولیه کاربری</h3>
            <p className="text-meta text-ink/70">
              این مشخصات در گواهینامه‌های رسمی و رده‌بندی لیگ درج خواهند شد:
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label htmlFor="login-f4" className="block text-meta font-bold mb-1 text-ink">
                  نام و نام خانوادگی:
                </label>
                <input
                  id="login-f4"
                  type="text"
                  value={setupFullName}
                  onChange={(e) => setSetupFullName(e.target.value)}
                  className="w-full min-h-[48px] h-12 px-3 rounded-tile border border-sunken text-body font-bold outline-none text-ink bg-paper"
                />
              </div>

              <div>
                <label htmlFor="login-f5" className="block text-meta font-bold mb-1 text-ink">
                  نام مستعار در جدول عمومی (اختیاری):
                </label>
                <input
                  id="login-f5"
                  type="text"
                  value={setupNickname}
                  onChange={(e) => setSetupNickname(e.target.value)}
                  placeholder="مثال: یادگیرنده کوشا"
                  className="w-full min-h-[48px] h-12 px-3 rounded-tile border border-sunken text-body outline-none text-ink bg-paper"
                />
              </div>

              <Button
                fullWidth
                size="lg"
                variant="primary"
                isLoading={isLoading}
                onClick={handleCompleteSetup}
              >
                تکمیل و ادامه به راهنمای شروع
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Short Privacy Note */}
      <footer className="text-center pb-4 text-meta text-ink/60 leading-relaxed max-w-xs mx-auto safe-bottom">
        <Shield className="w-4 h-4 inline ml-1 text-primary" aria-hidden="true" />
        اطلاعات شما با رعایت کامل حریم خصوصی و پروتکل‌های محرمانگی سازمانی نگهداری می‌شود.
      </footer>
    </div>
  );
};
