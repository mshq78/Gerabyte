import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../state/AppContext';
import { toFa } from '../../lib/toFa';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { updateUserLocal, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'otp' | 'password'>('otp');
  const [mobile, setMobile] = useState('09123456789');
  const [password, setPassword] = useState('');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);

  // First login confirmation step
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupFullName, setSetupFullName] = useState('');
  const [setupNickname, setSetupNickname] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP resend countdown
  useEffect(() => {
    let timer: any;
    if (otpStep === 'verify' && resendTimer > 0) {
      timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpStep, resendTimer]);

  const handleRequestOtp = async () => {
    if (!mobile || mobile.length < 10) {
      showToast('لطفاً شماره موبایل معتبر وارد نمایید.', 'error');
      return;
    }
    try {
      setIsLoading(true);
      await authApi.requestOtp(mobile);
      setOtpStep('verify');
      setResendTimer(60);
      showToast('کد ۵ رقمی ارسال شد (کد آزمایشی: ۱۲۳۴۵)', 'info');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      showToast(err.message || 'خطا در ارسال کد', 'error');
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
    if (val && index < 4) {
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
    if (code.length < 5) {
      showToast('لطفاً تمام ۵ رقم کد را وارد فرمایید.', 'info');
      return;
    }
    try {
      setIsLoading(true);
      const res = await authApi.verifyOtp(mobile, code);
      if (res.isNewUser) {
        setSetupFullName(res.user.fullName);
        setSetupNickname(res.user.nickname || '');
        setNeedsSetup(true);
      } else {
        updateUserLocal(res.user);
        showToast('ورود با موفقیت انجام شد.', 'success');
        navigate('/');
      }
    } catch (err: any) {
      showToast(err.message || 'کد وارد شده صحیح نمی‌باشد.', 'error');
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
      const res = await authApi.loginWithPassword(mobile, password);
      updateUserLocal(res.user);
      showToast('ورود با موفقیت انجام شد.', 'success');
      navigate('/');
    } catch (err: any) {
      showToast(err.message || 'نام کاربری یا رمز عبور اشتباه است.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSetup = () => {
    updateUserLocal({
      fullName: setupFullName,
      nickname: setupNickname,
      onboardingCompleted: true,
    });
    showToast('اطلاعات کاربری ثبت شد.', 'success');
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-[#F2EDE4] p-5 flex flex-col justify-between text-[#0D3F6B]">
      {/* Brand Header */}
      <header className="text-center pt-8 pb-4 space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-[#0D3F6B] text-white flex items-center justify-center mx-auto shadow-md">
          <div className="w-8 h-8 rounded-xl border-2 border-white flex items-center justify-center">
            <span className="font-black text-sm">G</span>
          </div>
        </div>
        <h1 className="text-xl font-black text-[#0D3F6B]">گرابایت · GeraByte</h1>
        <p className="text-xs text-[#0D3F6B]/70 font-semibold">
          سامانه خردآموزی ۳ دقیقه‌ای شایستگی‌های شغلی و سازمانی
        </p>
      </header>

      {/* Main Login Card */}
      <div className="my-auto py-4 max-w-sm mx-auto w-full">
        {!needsSetup ? (
          <div className="p-6 rounded-3xl bg-white border border-[#E8E1D5] shadow-lg space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-2 p-1 bg-[#E8E1D5]/60 rounded-2xl border border-[#E8E1D5]">
              <button
                onClick={() => {
                  setActiveTab('otp');
                  setOtpStep('request');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'otp'
                    ? 'bg-white text-[#0D3F6B] shadow-xs'
                    : 'text-[#0D3F6B]/70'
                }`}
              >
                کد یکبارمصرف (پیامک)
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'password'
                    ? 'bg-white text-[#0D3F6B] shadow-xs'
                    : 'text-[#0D3F6B]/70'
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
                      <label className="block text-xs font-bold mb-1.5">
                        شماره تلفن همراه:
                      </label>
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        dir="ltr"
                        className="w-full h-12 px-4 rounded-xl border border-[#E8E1D5] bg-[#FAF8F5] text-center font-mono font-bold text-sm outline-none focus:border-[#1E6FA8]"
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
                      <p className="text-xs text-[#0D3F6B]/80">
                        کد ۵ رقمی ارسال شده به شماره <strong>{toFa(mobile)}</strong> را وارد نمایید:
                      </p>
                    </div>

                    {/* 5-digit Auto-advancing boxes */}
                    <div className="flex items-center justify-center gap-2" dir="ltr">
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
                          className="w-11 h-12 text-center text-lg font-bold font-mono rounded-xl border-2 border-[#E8E1D5] focus:border-[#1E6FA8] outline-none bg-[#FAF8F5]"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#0D3F6B]/70">
                      {resendTimer > 0 ? (
                        <span>ارسال مجدد تا {toFa(resendTimer)} ثانیه دیگر</span>
                      ) : (
                        <button
                          onClick={handleRequestOtp}
                          className="font-bold text-[#1E6FA8] hover:underline"
                        >
                          ارسال دوباره کد
                        </button>
                      )}
                      <button
                        onClick={() => setOtpStep('request')}
                        className="text-[11px] underline"
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
                  <label className="block text-xs font-bold mb-1.5">
                    شماره تلفن همراه:
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    dir="ltr"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className="w-full h-12 px-4 rounded-xl border border-[#E8E1D5] bg-[#FAF8F5] text-center font-mono font-bold text-sm outline-none focus:border-[#1E6FA8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    کلمه عبور:
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 px-4 rounded-xl border border-[#E8E1D5] bg-[#FAF8F5] text-center font-bold text-sm outline-none focus:border-[#1E6FA8]"
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
          <div className="p-6 rounded-3xl bg-white border border-[#E8E1D5] shadow-lg space-y-4">
            <h3 className="font-bold text-sm text-[#0D3F6B]">
              تأیید مشخصات اولیه کاربری
            </h3>
            <p className="text-xs text-[#0D3F6B]/70">
              این مشخصات در گواهینامه‌های رسمی و رده‌بندی لیگ درج خواهند شد:
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold mb-1">نام و نام خانوادگی:</label>
                <input
                  type="text"
                  value={setupFullName}
                  onChange={(e) => setSetupFullName(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-[#E8E1D5] text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  نام مستعار در جدول عمومی (اختیاری):
                </label>
                <input
                  type="text"
                  value={setupNickname}
                  onChange={(e) => setSetupNickname(e.target.value)}
                  placeholder="مثال: یادگیرنده کوشا"
                  className="w-full h-11 px-3 rounded-xl border border-[#E8E1D5] text-xs outline-none"
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
      <footer className="text-center pb-4 text-[11px] text-[#0D3F6B]/60 leading-relaxed max-w-xs mx-auto">
        <Shield className="w-3.5 h-3.5 inline ml-1 text-[#1E6FA8]" />
        اطلاعات شما با رعایت کامل حریم خصوصی و پروتکل‌های محرمانگی سازمانی نگهداری می‌شود.
      </footer>
    </div>
  );
};
