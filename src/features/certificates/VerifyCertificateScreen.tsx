import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, XCircle } from 'lucide-react';
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
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-ink">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-pill animate-spin mx-auto" />
          <p className="text-meta font-bold">
            در حال استعلام اصالت گواهینامه از سامانه مرکزی گرا...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas p-5 flex flex-col justify-between text-ink">
      <header className="flex items-center justify-between">
        <span className="text-meta font-bold text-ink/70">
          سامانه عمومی استعلام اصالت گواهینامه‌های گرا
        </span>
      </header>

      <div className="my-auto py-6 max-w-sm mx-auto w-full space-y-5">
        <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-lg text-center space-y-4">
          <div
            className={`w-16 h-16 rounded-sheet flex items-center justify-center mx-auto text-surface shadow-md ${
              isValid ? 'bg-success' : 'bg-danger'
            }`}
          >
            {isValid ? (
              <ShieldCheck className="w-10 h-10 stroke-[2.2]" aria-hidden="true" />
            ) : (
              <XCircle className="w-10 h-10 stroke-[2.2]" aria-hidden="true" />
            )}
          </div>

          <div>
            <span
              className={`px-3 py-1 rounded-pill text-meta font-bold border ${
                isValid
                  ? 'bg-domain-3-tint text-success border-success/30'
                  : 'bg-danger-tint text-danger border-danger/30'
              }`}
            >
              {isValid ? 'گواهینامه معتبر و اصیل است' : 'گواهینامه فاقد اعتبار یا نامعتبر'}
            </span>
            <h2 className="text-body font-black mt-2 text-ink">
              سریال: <span className="font-mono text-meta">{serial}</span>
            </h2>
          </div>

          {isValid && cert && (
            <div className="p-3.5 rounded-tile bg-paper border border-sunken text-right space-y-2 text-meta">
              <div className="flex items-center justify-between">
                <span className="text-ink/60">نام دارنده (محفوظ):</span>
                <span className="font-bold text-ink">{getMaskedName(cert.holderName)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink/60">عنوان دوره شایستگی:</span>
                <span className="font-bold text-primary">{cert.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink/60">تاریخ صدور رسمی:</span>
                <span className="font-bold text-ink">{formatJalaliDate(cert.issuedAt)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-sunken pt-2">
                <span className="text-ink/60">نمره احرازشده:</span>
                <span className="font-bold text-success">{toFa(cert.scorePct)}٪ نمره قبولی</span>
              </div>
            </div>
          )}

          {!isValid && (
            <p className="text-meta text-danger leading-relaxed">
              شماره سریال وارد شده در سامانه مرکزی گواهینامه‌های رسمی پردیس نوآوری گرا یافت نشد یا
              باطل شده است.
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
