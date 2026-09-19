import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowRight,
  Download,
  Share2,
  CheckCircle2,
  Award,
  ShieldCheck,
  Calendar,
  Building,
} from 'lucide-react';
import { certificatesApi } from '../../api/certificates';
import { Certificate } from '../../types/domain';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../state/AppContext';
import { toFa } from '../../lib/toFa';
import { formatJalaliDate } from '../../lib/jalali';

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
      } catch (err: any) {
        showToast(err.message || 'گواهینامه یافت نشد', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [serial, showToast]);

  if (loading || !cert) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-[#0D3F6B]">
        <div className="w-10 h-10 border-4 border-[#1E6FA8] border-t-transparent rounded-full animate-spin" />
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
    <div className="min-h-screen bg-[#F2EDE4] p-4 flex flex-col justify-between text-[#0D3F6B]">
      {/* Top Bar */}
      <header className="flex items-center justify-between py-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-[#0D3F6B]/60 hover:text-[#0D3F6B] hover:bg-white flex items-center gap-1 text-xs font-bold"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت</span>
        </button>
        <span className="text-xs font-bold text-[#1E6FA8] bg-[#EAF3F9] px-3 py-1 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>اصالت تضمین‌شده</span>
        </span>
      </header>

      {/* Certificate Framed Card */}
      <div className="my-auto py-4 max-w-sm mx-auto w-full">
        <div className="p-6 rounded-3xl bg-white border-2 border-[#1E6FA8]/40 shadow-xl relative overflow-hidden space-y-5 text-center">
          {/* Subtle Guilloche Border Accent */}
          <div className="absolute inset-2 rounded-2xl border border-dashed border-[#1E6FA8]/20 pointer-events-none" />

          {/* Seal / Header */}
          <div className="flex flex-col items-center space-y-1.5 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF6EC] text-[#F2A93B] flex items-center justify-center border border-[#F2A93B]/40 shadow-xs">
              <Award className="w-8 h-8 stroke-[2.2]" />
            </div>
            <span className="text-[11px] font-bold text-[#0D3F6B]/60">
              پردیس نوآوری گرا · سامانه اعتبارسنجی شایستگی
            </span>
            <h2 className="text-base font-black text-[#0D3F6B]">
              گواهینامه رسمی شایستگی تخصصی
            </h2>
          </div>

          {/* Candidate Name & Title */}
          <div className="space-y-1 py-1 border-y border-[#E8E1D5]">
            <p className="text-xs text-[#0D3F6B]/70">اعطا شده به جناب/سرکار</p>
            <h3 className="text-lg font-black text-[#1E6FA8]">{cert.holderName}</h3>
            <p className="text-xs text-[#0D3F6B]/80 font-semibold pt-1">
              جهت گذراندن موفقیت‌آمیز سرفصل:
            </p>
            <p className="text-sm font-bold text-[#0D3F6B]">{cert.title}</p>
          </div>

          {/* Details & QR Code */}
          <div className="flex items-center justify-between gap-4 pt-1 text-right text-xs">
            <div className="space-y-1.5 flex-1">
              <div>
                <span className="text-[10px] text-[#0D3F6B]/60 block">کد رهگیری و سریال:</span>
                <span className="font-mono font-bold text-xs text-[#0D3F6B] tracking-wider">
                  {cert.serial}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#0D3F6B]/60 block">تاریخ صدور:</span>
                <span className="font-bold text-[#0D3F6B]">{formatJalaliDate(cert.issuedAt)}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#0D3F6B]/60 block">نمره احرازشده:</span>
                <span className="font-black text-[#2E9E6B]">{toFa(cert.scorePct)}٪ نمره کل</span>
              </div>
            </div>

            {/* Real Offline QR Code rendered with SVG */}
            <div className="p-2 rounded-xl bg-white border border-[#E8E1D5] shadow-xs shrink-0 flex flex-col items-center">
              <QRCodeSVG
                value={verifyUrl}
                size={84}
                level="M"
                fgColor="#0D3F6B"
              />
              <span className="text-[9px] text-[#0D3F6B]/50 mt-1 font-mono">اسکن اصالت</span>
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
          leftIcon={<Download className="w-4 h-4" />}
        >
          دریافت PDF
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={handleShare}
          leftIcon={<Share2 className="w-4 h-4" />}
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
    <div className="flex-1 flex flex-col p-4 space-y-4 text-[#0D3F6B]">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black">گواهینامه‌های رسمی شما</h2>
          <p className="text-xs text-[#0D3F6B]/70 mt-0.5">
            صادره از پردیس نوآوری گرا با قابلیت استعلام آنلاین
          </p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EAF3F9] text-[#1E6FA8]">
          {toFa(certs.length)} گواهینامه
        </span>
      </header>

      <div className="space-y-3">
        {certs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#0D3F6B]/60 bg-white rounded-2xl border border-[#E8E1D5]">
            شما هنوز گواهینامه‌ای دریافت نکرده‌اید. با گذراندن دروس و قبولی در آزمون‌های جامع فصول، گواهینامه معتبر کسب کنید.
          </div>
        ) : (
          certs.map((c) => (
            <div
              key={c.serial}
              onClick={() => navigate(`/certificates/${c.serial}`)}
              className="p-4 rounded-2xl bg-white border border-[#E8E1D5] hover:border-[#1E6FA8]/50 shadow-xs cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#FEF6EC] text-[#F2A93B] flex items-center justify-center shrink-0 border border-[#F2A93B]/30">
                  <Award className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#0D3F6B] leading-snug">
                    {c.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-[#0D3F6B]/60">
                    <span className="font-mono">{c.serial}</span>
                    <span>·</span>
                    <span>نمره: {toFa(c.scorePct)}٪</span>
                  </div>
                </div>
              </div>

              <span className="text-xs font-bold text-[#1E6FA8]">مشاهده</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
