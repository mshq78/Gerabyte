import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, XCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { certificatesApi } from '../../api/certificates';
import { Certificate } from '../../types/domain';
import { Button } from '../../components/ui/Button';
import { toFa } from '../../lib/toFa';
import { formatJalaliDate } from '../../lib/jalali';

export const VerifyCertificateScreen: React.FC = () => {
  const { serial } = useParams<{ serial: string }>();
  const navigate = useNavigate();

  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!serial) return;
      try {
        setLoading(true);
        const data = await certificatesApi.getBySerial(serial);
        if (data) {
          setCert(data);
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } catch {
        setIsValid(false);
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [serial]);

  // Mask holder name for privacy e.g. "علیرضا رضایی" -> "ع*** ر*****"
  const getMaskedName = (name: string) => {
    return name
      .split(' ')
      .map((part) => (part.length > 1 ? `${part[0]}***` : part))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-[#0D3F6B]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#1E6FA8] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold">در حال استعلام اصالت گواهینامه از سامانه مرکزی گرا...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2EDE4] p-5 flex flex-col justify-between text-[#0D3F6B]">
      <header className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#0D3F6B]/70">
          سامانه عمومی استعلام اصالت گواهینامه‌های گرا
        </span>
      </header>

      <div className="my-auto py-6 max-w-sm mx-auto w-full space-y-5">
        <div className="p-6 rounded-3xl bg-white border border-[#E8E1D5] shadow-lg text-center space-y-4">
          <div
            className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto text-white shadow-md ${
              isValid ? 'bg-[#2E9E6B]' : 'bg-[#D5483F]'
            }`}
          >
            {isValid ? (
              <ShieldCheck className="w-10 h-10 stroke-[2.2]" />
            ) : (
              <XCircle className="w-10 h-10 stroke-[2.2]" />
            )}
          </div>

          <div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isValid
                  ? 'bg-[#EDF8F6] text-[#2E9E6B] border-[#2E9E6B]/30'
                  : 'bg-[#FDF2F0] text-[#D5483F] border-[#D5483F]/30'
              }`}
            >
              {isValid ? 'گواهینامه معتبر و اصیل است' : 'گواهینامه فاقد اعتبار یا نامعتبر'}
            </span>
            <h2 className="text-base font-black mt-2">
              سریال: <span className="font-mono text-sm">{serial}</span>
            </h2>
          </div>

          {isValid && cert && (
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E1D5] text-right space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#0D3F6B]/60">نام دارنده (محفوظ):</span>
                <span className="font-bold">{getMaskedName(cert.holderName)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#0D3F6B]/60">عنوان دوره شایستگی:</span>
                <span className="font-bold text-[#1E6FA8]">{cert.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#0D3F6B]/60">تاریخ صدور رسمی:</span>
                <span className="font-bold">{formatJalaliDate(cert.issuedAt)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#E8E1D5] pt-2">
                <span className="text-[#0D3F6B]/60">نمره احرازشده:</span>
                <span className="font-bold text-[#2E9E6B]">{toFa(cert.scorePct)}٪ نمره قبولی</span>
              </div>
            </div>
          )}

          {!isValid && (
            <p className="text-xs text-[#D5483F] leading-relaxed">
              شماره سریال وارد شده در سامانه مرکزی گواهینامه‌های رسمی پردیس نوآوری گرا یافت نشد یا باطل شده است.
            </p>
          )}
        </div>
      </div>

      <div className="pt-2 max-w-sm mx-auto w-full">
        <Button fullWidth size="md" variant="secondary" onClick={() => navigate('/')}>
          ورود به صفحه اصلی گرابایت
        </Button>
      </div>
    </div>
  );
};
