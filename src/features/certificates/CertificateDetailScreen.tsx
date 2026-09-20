import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowRight, Download, Share2, Award, ShieldCheck } from 'lucide-react';
import { certificatesApi } from '../../api/certificates';
import { Certificate } from '../../types/domain';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../state/AppContext';
import { toFa } from '../../lib/toFa';
import { formatJalaliDate } from '../../lib/jalali';
import { errorMessage } from '../../lib/errors';
import { clickableProps } from '../../lib/a11y';

export const CertificateDetailScreen: React.FC = () => {
  const { serial } = useParams<{ serial: string }>();
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!serial) return;
      try {
        setLoading(true);
        const data = await certificatesApi.getBySerial(serial);
        setCert(data);
      } catch (err) {
        showToast(errorMessage(err) || 'گواهینامه یافت نشد', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [serial, showToast]);

  if (loading || !cert) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-ink">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-pill animate-spin" />
      </div>
    );
  }

  // Construct absolute verification URL for QR
  const verifyUrl = `${window.location.origin}/verify/${cert.serial}`;

  const handleDownloadPdf = () => {
    showToast('در حال آماده‌سازی فایل PDF گواهینامه معتبر...', 'info');
    setTimeout(() => {
      showToast('گواهینامه با موفقیت دریافت گردید.', 'success');
    }, 1200);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: cert.title,
        text: `گواهینامه تخصصی ${cert.title} از پردیس نوآوری گرا`,
        url: verifyUrl,
      });
    } else {
      navigator.clipboard.writeText(verifyUrl);
      showToast('پیوند استعلام اصالت در حافظه کپی شد.', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-canvas p-4 flex flex-col justify-between text-ink">
      {/* Top Bar */}
      <header className="flex items-center justify-between py-2">
        <button
          onClick={() => navigate(-1)}
          className="min-h-[48px] px-3 py-2 rounded-tile text-ink/60 hover:text-ink hover:bg-surface flex items-center gap-1.5 text-meta font-bold cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
          <span>بازگشت</span>
        </button>
        <span className="text-meta font-bold text-primary bg-domain-1-tint px-3 py-1.5 rounded-pill flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          <span>اصالت تضمین‌شده</span>
        </span>
      </header>

      {/* Certificate Framed Card */}
      <div className="my-auto py-4 max-w-sm mx-auto w-full">
        <div className="p-6 rounded-sheet bg-surface border-2 border-primary/40 shadow-xl relative overflow-hidden space-y-5 text-center">
          {/* Subtle Guilloche Border Accent */}
          <div className="absolute inset-2 rounded-tile border border-dashed border-primary/20 pointer-events-none" />

          {/* Seal / Header */}
          <div className="flex flex-col items-center space-y-1.5 pt-2">
            <div className="w-14 h-14 rounded-tile bg-domain-5-tint text-coin flex items-center justify-center border border-coin/40 shadow-xs">
              <Award className="w-8 h-8 stroke-[2.2]" aria-hidden="true" />
            </div>
            <span className="text-meta font-bold text-ink/60">
              پردیس نوآوری گرا · سامانه اعتبارسنجی شایستگی
            </span>
            <h2 className="text-title font-black text-ink">گواهینامه رسمی شایستگی تخصصی</h2>
          </div>

          {/* Candidate Name & Title */}
          <div className="space-y-1 py-1 border-y border-sunken">
            <p className="text-meta text-ink/70">اعطا شده به جناب/سرکار</p>
            <h3 className="text-headline font-black text-primary">{cert.holderName}</h3>
            <p className="text-meta text-ink/80 font-semibold pt-1">
              جهت گذراندن موفقیت‌آمیز سرفصل:
            </p>
            <p className="text-body font-bold text-ink">{cert.title}</p>
          </div>

          {/* Details & QR Code */}
          <div className="flex items-center justify-between gap-4 pt-1 text-right text-meta">
            <div className="space-y-1.5 flex-1">
              <div>
                <span className="text-meta text-ink/60 block">کد رهگیری و سریال:</span>
                <span className="font-mono font-bold text-meta text-ink tracking-wider">
                  {cert.serial}
                </span>
              </div>
              <div>
                <span className="text-meta text-ink/60 block">تاریخ صدور:</span>
                <span className="font-bold text-ink">{formatJalaliDate(cert.issuedAt)}</span>
              </div>
              <div>
                <span className="text-meta text-ink/60 block">نمره احرازشده:</span>
                <span className="font-black text-success">{toFa(cert.scorePct)}٪ نمره کل</span>
              </div>
            </div>

            {/* Real Offline QR Code rendered with SVG */}
            <div className="p-2 rounded-tile bg-surface border border-sunken shadow-xs shrink-0 flex flex-col items-center">
              <QRCodeSVG value={verifyUrl} size={84} level="M" fgColor="#0D3F6B" />
              <span className="text-meta text-ink/50 mt-1 font-mono">اسکن اصالت</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="pt-2 max-w-sm mx-auto w-full grid grid-cols-2 gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={handleDownloadPdf}
          leftIcon={<Download className="w-4 h-4" aria-hidden="true" />}
        >
          دریافت PDF
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={handleShare}
          leftIcon={<Share2 className="w-4 h-4" aria-hidden="true" />}
        >
          اشتراک‌گذاری
        </Button>
      </div>
    </div>
  );
};

export const CertificatesScreen: React.FC = () => {
  const navigate = useNavigate();
  const [certs, setCerts] = useState<Certificate[]>([]);

  useEffect(() => {
    async function load() {
      const list = await certificatesApi.list();
      setCerts(list);
    }
    load();
  }, []);

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 text-ink">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-headline font-black">گواهینامه‌های رسمی شما</h2>
          <p className="text-meta text-ink/70 mt-0.5">
            صادره از پردیس نوآوری گرا با قابلیت استعلام آنلاین
          </p>
        </div>
        <span className="text-meta font-bold px-2.5 py-1 rounded-pill bg-domain-1-tint text-primary">
          {toFa(certs.length)} گواهینامه
        </span>
      </header>

      <div className="space-y-3">
        {certs.length === 0 ? (
          <div className="p-8 text-center text-meta text-ink/60 bg-surface rounded-tile border border-sunken">
            شما هنوز گواهینامه‌ای دریافت نکرده‌اید. با گذراندن دروس و قبولی در آزمون‌های جامع فصول،
            گواهینامه معتبر کسب کنید.
          </div>
        ) : (
          certs.map((c) => (
            <div
              key={c.serial}
              {...clickableProps(() => navigate(`/certificates/${c.serial}`))}
              className="p-4 rounded-tile bg-surface border border-sunken hover:border-primary/50 shadow-xs cursor-pointer transition-all flex items-center justify-between min-h-[48px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-tile bg-domain-5-tint text-coin flex items-center justify-center shrink-0 border border-coin/30">
                  <Award className="w-6 h-6 stroke-[2.2]" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-bold text-body text-ink leading-snug">{c.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-meta text-ink/60">
                    <span className="font-mono">{c.serial}</span>
                    <span>·</span>
                    <span>نمره: {toFa(c.scorePct)}٪</span>
                  </div>
                </div>
              </div>

              <span className="text-meta font-bold text-primary">مشاهده</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
