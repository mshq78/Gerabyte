import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  BookOpen,
  ShieldCheck,
  Award,
  Zap,
} from 'lucide-react';
import { toFa } from '../../lib/format';

interface FaqItem {
  id: string;
  category: 'general' | 'learning' | 'certs' | 'org';
  q: string;
  a: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: '1',
    category: 'general',
    q: 'گرابایت چیست و چه تفاوتی با آموزش‌های صنعتی متداول دارد؟',
    a: 'گرابایت یک سامانه یادگیری خرد (Microlearning) سازمانی است. به جای دوره‌های خسته‌کننده چند ساعته، مفاهیم کلیدی ایمنی، شایستگی‌های فردی و اخلاق حرفه‌ای در قالب پودمان‌های فشرده ۳ تا ۵ دقیقه‌ای و سناریوهای واقعی کارگاهی ارائه می‌شوند تا کارشناسان و اپراتورها بدون اختلال در برنامه شیفت کاری بتوانند هر روز یک گام کوچک بردارند.',
  },
  {
    id: '2',
    category: 'learning',
    q: 'زنجیره پیوسته (Streak) و ردیف بایت (Byte Row) چگونه کار می‌کنند؟',
    a: 'با مطالعه و اتمام حداقل ۱ درس در روز، زنجیره پیوسته شما یک روز افزایش می‌یابد. هدف روزانه شما در «ردیف بایت» با پر شدن مربع‌های اختصاصی نشان داده می‌شود. اگر چند روز پیاپی مطالعه نکنید، زنجیره شما متوقف خواهد شد، اما می‌توانید با استفاده از مهلت احیا یا ادامه مطالعه آن را دوباره آغاز کنید.',
  },
  {
    id: '3',
    category: 'learning',
    q: 'سطح‌های مهارت (از ۱ تا ۵) چگونه ارزیابی و تغییر می‌کنند؟',
    a: 'سطوح مهارت از ۱ (آغازگر) تا ۵ (الهام‌بخش) تعریف شده‌اند. سطح اولیه بر اساس رتبه سازمانی در چارت کارخانه یا آزمون تعیین سطح مشخص می‌شود. علاوه بر این، موتور هوشمند گرابایت بر اساس سرعت پاسخگویی و موفقیت در سناریوهای حل تعارض، می‌تواند ارتقای سطح شما را پیشنهاد دهد.',
  },
  {
    id: '4',
    category: 'certs',
    q: 'گواهینامه‌های گرابایت چگونه صادر و استعلام می‌شوند؟',
    a: 'پس از اتمام تمام فصول یک مسیر یادگیری و موفقیت در آزمون جامع با حداقل نمره ۸۰٪، گواهینامه رسمی با شماره سریال یکتا و کد QR صادر می‌گردد. این گواهینامه در هر زمان از طریق صفحه استعلام سراسری گرابایت به آدرس /verify قابل راستی‌آزمایی توسط مراجع بیرونی است.',
  },
  {
    id: '5',
    category: 'org',
    q: 'مدیران سازمان چه بخش‌هایی را در داشبورد مشاهده می‌کنند؟',
    a: 'داشبورد سازمانی گرابایت به تفکیک دسترسی مدیر ارشد سازمان (org_admin) و مدیر واحد (unit_manager) عمل می‌کند. مدیران می‌توانند نرخ انطباق آموزشی، ساعات مطالعه پرسنل، افراد نیازمند توجه و روند پیشرفت در ۵ حوزه شایستگی را مشاهده و مأموریت‌های یادگیری جدید تعریف کنند.',
  },
];

export const FaqScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openIds, setOpenIds] = useState<string[]>(['1']);
  const [search, setSearch] = useState('');

  const toggleItem = (id: string) => {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      !search ||
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="text-center max-w-lg mx-auto pt-2">
        <div className="w-12 h-12 rounded-tile bg-domain-1-tint text-primary flex items-center justify-center mx-auto mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-headline font-black text-ink">پرسش‌های متداول</h1>
        <p className="text-body text-ink/70 mt-1">
          پاسخ به سوالات پرتکرار یادگیرندگان و مدیران سازمانی گرابایت
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="w-4 h-4 text-ink/40 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در پرسش‌ها..."
          className="w-full min-h-[48px] pr-10 pl-4 py-2 text-body bg-surface rounded-tile border border-sunken focus:outline-none focus:border-primary text-ink shadow-xs"
        />
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[
          { id: 'all', label: 'همه سوالات' },
          { id: 'general', label: 'درباره گرابایت' },
          { id: 'learning', label: 'قوانین یادگیری' },
          { id: 'certs', label: 'گواهینامه‌ها' },
          { id: 'org', label: 'داشبورد سازمان' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-pill text-meta font-bold transition-all cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface text-ink/70 border border-sunken hover:bg-canvas'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="max-w-xl mx-auto space-y-3">
        {filteredFaqs.map((faq) => {
          const isOpen = openIds.includes(faq.id);

          return (
            <div
              key={faq.id}
              className="rounded-tile bg-surface border border-sunken shadow-xs overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleItem(faq.id)}
                className="w-full min-h-[48px] p-4 text-right flex items-center justify-between gap-3 font-bold text-body text-ink hover:bg-canvas/50 cursor-pointer"
                aria-expanded={isOpen}
              >
                <span>{faq.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-ink/40 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-ink/40 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-body text-ink/80 leading-relaxed border-t border-sunken/50 bg-paper/30">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
