import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, ChevronLeft, Building2, ArrowRight } from 'lucide-react';
import { useApp } from '../../state/AppContext';

export const VisibilitySettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();

  const orgName = user.membership?.orgName || 'سازمان شما';
  const nodePath = user.membership?.nodePath || [];

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-2xl mx-auto space-y-6 text-ink">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-sunken pb-3">
        <button
          onClick={() => navigate('/profile')}
          className="min-h-[48px] min-w-[48px] p-2 rounded-tile hover:bg-canvas text-ink/70 hover:text-ink flex items-center gap-1.5 transition-all cursor-pointer"
          aria-label="بازگشت به پروفایل"
        >
          <ArrowRight className="w-5 h-5" />
          <span className="text-meta font-bold">پروفایل</span>
        </button>
        <span className="text-meta font-black text-primary px-3 py-1 rounded-pill bg-domain-1-tint">
          شفافیت و حریم خصوصی
        </span>
      </div>

      {/* Main Title & Org Banner */}
      <div className="p-5 rounded-sheet bg-surface border border-sunken shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-primary">
          <Building2 className="w-6 h-6" />
          <h1 className="text-title font-black text-ink">چه چیزی برای مدیر من قابل مشاهده است؟</h1>
        </div>
        <p className="text-body text-ink/80 leading-relaxed">
          در گرابایت، حفظ استقلال یادگیری و حریم خصوصی فردی شما یک اصل بنیادین است. سازمان متبوع شما
          (<strong>{orgName}</strong>) صرفاً به پیشرفت‌های مرتبط با مسیرهای آموزشی سازمانی دسترسی
          دارد و داده‌های شخصی شما کاملاً محرمانه باقی می‌ماند.
        </p>

        {nodePath.length > 0 && (
          <div className="p-3 rounded-tile bg-paper border border-sunken text-meta space-y-1">
            <span className="text-ink/60 font-bold block">موقعیت در درخت سازمانی:</span>
            <div className="flex items-center flex-wrap gap-1 font-bold text-ink">
              {nodePath.map((item, idx) => (
                <React.Fragment key={idx}>
                  <span>{item}</span>
                  {idx < nodePath.length - 1 && <span className="text-ink/40">‹</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 1. Visible to Managers */}
      <div className="p-5 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-success font-black text-body">
          <div className="w-8 h-8 rounded-tile bg-domain-3-tint text-success flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <h2>اطلاعات قابل مشاهده برای مدیر واحد و سازمان:</h2>
        </div>

        <ul className="space-y-3 text-meta text-ink/90">
          <li className="flex items-start gap-3 p-3 rounded-tile bg-domain-3-tint/30 border border-success/20">
            <span className="text-success font-black text-title leading-none">•</span>
            <div>
              <strong className="text-ink block">
                پیشرفت و نمرات در دوره‌ها و مسیرهای سازمانی:
              </strong>
              <span className="text-ink/70">
                درصدهای تکمیل، نمرات آزمون‌ها و تمرین‌های مسیرهایی که مستقیماً توسط سازمان برای شما
                تخصیص یافته است.
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3 p-3 rounded-tile bg-domain-3-tint/30 border border-success/20">
            <span className="text-success font-black text-title leading-none">•</span>
            <div>
              <strong className="text-ink block">گواهینامه‌های رسمی دوره‌های سازمانی:</strong>
              <span className="text-ink/70">
                مدارک و شماره سریال گواهینامه‌هایی که پس از گذراندن دوره‌های تخصصی سازمانی اخذ
                نموده‌اید.
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3 p-3 rounded-tile bg-domain-3-tint/30 border border-success/20">
            <span className="text-success font-black text-title leading-none">•</span>
            <div>
              <strong className="text-ink block">تعداد روزهای فعالیت و استمرار کلی:</strong>
              <span className="text-ink/70">
                طول زنجیره روزانه (Streak) و آخرین تاریخ مطالعه برای ارزیابی شاخص پیوستگی آموزشی.
              </span>
            </div>
          </li>
        </ul>
      </div>

      {/* 2. NOT Visible to Managers */}
      <div className="p-5 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-danger font-black text-body">
          <div className="w-8 h-8 rounded-tile bg-domain-2-tint text-danger flex items-center justify-center">
            <EyeOff className="w-5 h-5" />
          </div>
          <h2>اطلاعات کاملاً محرمانه (غیرقابل مشاهده برای مدیر):</h2>
        </div>

        <ul className="space-y-3 text-meta text-ink/90">
          <li className="flex items-start gap-3 p-3 rounded-tile bg-domain-2-tint/30 border border-danger/20">
            <span className="text-danger font-black text-title leading-none">•</span>
            <div>
              <strong className="text-ink block">سایر گرابایت‌ها، حوزه‌ها و علایق شخصی:</strong>
              <span className="text-ink/70">
                عناوین دروسی که به‌صورت اختیاری و خارج از مأموریت‌های سازمانی مطالعه می‌کنید هرگز به
                مدیر گزارش نمی‌شود.
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3 p-3 rounded-tile bg-domain-2-tint/30 border border-danger/20">
            <span className="text-danger font-black text-title leading-none">•</span>
            <div>
              <strong className="text-ink block">سکه‌ها، جوایز دریافتی و کدهای تخفیف:</strong>
              <span className="text-ink/70">
                موجودی سکه گرابایت و جوایز فردی که در بخش پاداش‌ها ردیم کرده‌اید متعلق به خود شماست.
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3 p-3 rounded-tile bg-domain-2-tint/30 border border-danger/20">
            <span className="text-danger font-black text-title leading-none">•</span>
            <div>
              <strong className="text-ink block">مسیرهای یادگیری شخصی و شماره موبایل کامل:</strong>
              <span className="text-ink/70">
                مدیران به مسیرهای مطالعاتی شخصی شما و اطلاعات محرمانه هویتی دسترسی ندارند.
              </span>
            </div>
          </li>
        </ul>
      </div>

      {/* 3. Reassurance Card */}
      <div className="p-4 rounded-tile bg-domain-5-tint border border-coin/30 flex items-start gap-3 text-ink">
        <ShieldCheck className="w-6 h-6 text-coin shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-body font-black text-ink">تضمین مالکیت دستاوردها</h3>
          <p className="text-meta text-ink/80 leading-relaxed">
            «وقتی اشتراک سازمانی تمام شود، حساب شما شخصی می‌شود و تمام دستاوردها، زنجیره‌ها،
            گواهینامه‌ها و سوابق یادگیری متعلق به شما خواهد بود و هرگز حذف نمی‌شوند.»
          </p>
        </div>
      </div>

      {/* Back button */}
      <div className="pt-2">
        <Link
          to="/profile"
          className="min-h-[48px] w-full px-4 py-2.5 rounded-tile bg-primary hover:bg-primary-hover text-white text-meta font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          <span>بازگشت به پروفایل</span>
          <ChevronLeft className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
