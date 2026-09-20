import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  Check,
  Shield,
  Flame,
  Award,
  HeartHandshake,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { toFa } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { ByteRow } from '../../components/ui/ByteRow';

export const PaletteDemoScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas p-6 sm:p-10 max-w-4xl mx-auto space-y-10 text-ink">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-sunken pb-4">
        <div>
          <span className="text-meta font-black text-primary px-2.5 py-0.5 rounded-pill bg-domain-1-tint">
            سند راهنمای سبک و طراحی
          </span>
          <h1 className="text-display font-black text-ink mt-2">ویترین پالت و توکن‌های گرابایت</h1>
          <p className="text-body text-ink/70 mt-1">
            بررسی انطباق پالت رسمی گرا، مقیاس تایپوگرافی و کنترل‌های دسترسی‌پذیر
          </p>
        </div>

        <Link
          to="/"
          className="min-h-[48px] px-4 py-2 rounded-tile bg-surface border border-sunken hover:bg-sunken text-meta font-bold flex items-center gap-1.5 transition-all"
        >
          <span>بازگشت به خانه</span>
          <ChevronLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* 1. Official Color Palette */}
      <section className="space-y-4">
        <h2 className="text-headline font-black text-ink">۱. پالت رنگ‌های بنیادین (Tokens)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-tile bg-[#0D3F6B] text-white shadow-xs">
            <div className="text-title font-black">#0D3F6B</div>
            <div className="text-meta opacity-90 mt-1">آبی عمیق سازمانی (Deep Blue)</div>
          </div>
          <div className="p-4 rounded-tile bg-[#1E6FA8] text-white shadow-xs">
            <div className="text-title font-black">#1E6FA8</div>
            <div className="text-meta opacity-90 mt-1">آبی پایه گرا (Primary Blue)</div>
          </div>
          <div className="p-4 rounded-tile bg-[#F2EDE4] text-ink border border-sunken shadow-xs">
            <div className="text-title font-black">#F2EDE4</div>
            <div className="text-meta text-ink/70 mt-1">بوم کرم ملایم (Canvas)</div>
          </div>
          <div className="p-4 rounded-tile bg-surface text-ink border border-sunken shadow-xs">
            <div className="text-title font-black">#FFFFFF</div>
            <div className="text-meta text-ink/70 mt-1">سطح برآمده (Surface)</div>
          </div>
          <div className="p-4 rounded-tile bg-[#E8E1D5] text-ink shadow-xs">
            <div className="text-title font-black">#E8E1D5</div>
            <div className="text-meta text-ink/70 mt-1">سطح فرورفته (Sunken)</div>
          </div>
          <div className="p-4 rounded-tile bg-[#F2A93B] text-white shadow-xs">
            <div className="text-title font-black">#F2A93B</div>
            <div className="text-meta opacity-90 mt-1">کهربایی سکه (Coin Amber)</div>
          </div>
          <div className="p-4 rounded-tile bg-[#2E9E6B] text-white shadow-xs">
            <div className="text-title font-black">#2E9E6B</div>
            <div className="text-meta opacity-90 mt-1">سبز کامیابی (Success)</div>
          </div>
          <div className="p-4 rounded-tile bg-[#D5483F] text-white shadow-xs">
            <div className="text-title font-black">#D5483F</div>
            <div className="text-meta opacity-90 mt-1">قرمز هشدار (Danger)</div>
          </div>
        </div>
      </section>

      {/* 2. Five Learning Domains Colors */}
      <section className="space-y-4">
        <h2 className="text-headline font-black text-ink">۲. رنگ‌های ۵ حوزه یادگیری گرابایت</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-tile border border-sunken bg-surface flex items-center gap-3">
            <div className="w-10 h-10 rounded-tile bg-[#1E6FA8] text-white flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-ink">شایستگی‌های فردی و سازمانی</div>
              <div className="text-meta text-ink/60">#1E6FA8 / تنت: #EAF3F9</div>
            </div>
          </div>

          <div className="p-4 rounded-tile border border-sunken bg-surface flex items-center gap-3">
            <div className="w-10 h-10 rounded-tile bg-[#E2665A] text-white flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-ink">خانواده و تعادل کار و زندگی</div>
              <div className="text-meta text-ink/60">#E2665A / تنت: #FDF2F0</div>
            </div>
          </div>

          <div className="p-4 rounded-tile border border-sunken bg-surface flex items-center gap-3">
            <div className="w-10 h-10 rounded-tile bg-[#1F9A8A] text-white flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-ink">اخلاق حرفه‌ای و تعهد کاری</div>
              <div className="text-meta text-ink/60">#1F9A8A / تنت: #EDF8F6</div>
            </div>
          </div>

          <div className="p-4 rounded-tile border border-sunken bg-surface flex items-center gap-3">
            <div className="w-10 h-10 rounded-tile bg-[#7A5BD6] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-ink">توسعه فردی و خودرهبری</div>
              <div className="text-meta text-ink/60">#7A5BD6 / تنت: #F2EFFF</div>
            </div>
          </div>

          <div className="p-4 rounded-tile border border-sunken bg-surface flex items-center gap-3">
            <div className="w-10 h-10 rounded-tile bg-[#E58A1F] text-white flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-ink">فرهنگ ایمنی و سلامت کار</div>
              <div className="text-meta text-ink/60">#E58A1F / تنت: #FEF6EC</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Typography Scale */}
      <section className="p-6 rounded-tile bg-surface border border-sunken shadow-xs space-y-4">
        <h2 className="text-headline font-black text-ink">
          ۳. مقیاس تایپوگرافی وزیرمتن (بدون متن زیر ۱۴px)
        </h2>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-sunken pb-2">
            <span className="text-display font-black text-ink">
              Display: ۲۴px - گرابایت یادگیری پیوسته
            </span>
            <span className="text-meta text-ink/60">text-display / وزن ۸۰۰</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-sunken pb-2">
            <span className="text-headline font-black text-ink">
              Headline: ۲۰px - مهارت‌های بنیادین همکاری
            </span>
            <span className="text-meta text-ink/60">text-headline / وزن ۷۰۰</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-sunken pb-2">
            <span className="text-title font-black text-ink">
              Title: ۱۸px - شفافیت در تحویل شیفت‌های کاری
            </span>
            <span className="text-meta text-ink/60">text-title / وزن ۷۰۰</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-sunken pb-2">
            <span className="text-body text-ink leading-relaxed">
              Body: ۱۶px - آموزش‌های فشرده ۳ تا ۵ دقیقه‌ای جهت ارتقای شایستگی‌های صنعتی
            </span>
            <span className="text-meta text-ink/60">text-body / وزن ۴۰۰</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
            <span className="text-meta font-bold text-ink/70">
              Meta: ۱۴px - وضعیت: فعال · مدت زمان: ۳ دقیقه · ۱۵ امتیاز
            </span>
            <span className="text-meta text-ink/60">text-meta / حداقل اندازه ۱۴px</span>
          </div>
        </div>
      </section>

      {/* 4. Signature Components */}
      <section className="p-6 rounded-tile bg-surface border border-sunken shadow-xs space-y-6">
        <h2 className="text-headline font-black text-ink">۴. المان‌های امضایی و تعاملی</h2>

        {/* ByteRow */}
        <div className="space-y-2">
          <div className="text-meta font-bold text-ink">
            ردیف بایت (ByteRow) - پیشرفت ۲ از ۳ گرابایت امروز:
          </div>
          <ByteRow completed={2} total={3} />
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <div className="text-meta font-bold text-ink">
            دکمه‌های استاندارد سیستم طراحی با افکت فشرده شدن:
          </div>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">ادامه مسیر گرابایت</Button>
            <Button variant="secondary">بررسی نتایج آزمون</Button>
            <Button variant="outline">انصراف و بازگشت</Button>
          </div>
        </div>
      </section>
    </div>
  );
};
