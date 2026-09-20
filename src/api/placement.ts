import { mockRequest } from './client';
import { Level, Question } from '../types/domain';
import { getStoredUser, setStoredUser } from './mockUser';

export interface PlacementTestResult {
  suggestedLevel: Level;
  confidence: number;
  reasons: string[];
  scorePct: number;
}

export const PLACEMENT_QUESTIONS: Question[] = [
  {
    id: 'pq-1',
    kind: 'single',
    prompt: 'در هنگام بروز یک مشکل غیرمنتظره در انجام پروژه، اولین اقدام حرفه‌ای کدام است؟',
    options: [
      { id: 'po-1', text: 'جستجوی مقصر برای تعیین تکلیف مسئولیت.' },
      { id: 'po-2', text: 'تحدید مسئله، ارزیابی دامنه اثر و اطلاع‌رسانی شفاف به ذی‌نفعان.' },
      { id: 'po-3', text: 'پنهان کردن مشکل تا زمانی که راه‌حل نهایی پیدا شود.' },
    ],
    correctIds: ['po-2'],
    explanation: 'شفافیت زودهنگام ریسک سیستماتیک را کاهش می‌دهد.',
    weight: 1,
  },
  {
    id: 'pq-2',
    kind: 'scenario',
    prompt:
      'یکی از اعضای تیم از حجم کاری بالا گله‌مند است و احساس فرسودگی می‌کند. واکنش موثر چیست؟',
    options: [
      { id: 'po-4', text: 'شنیدن متمرکز دغدغه‌ها و بازنگری اولویت‌ها و توزیع کار با همکاری تیم.' },
      { id: 'po-5', text: 'توصیه به سکوت و تحمل شرایط کاری تا پایان ماه.' },
    ],
    correctIds: ['po-4'],
    explanation: 'همدلی همراه با اصلاح فرآیند مانع فرسودگی شغلی می‌شود.',
    weight: 2,
  },
  {
    id: 'pq-3',
    kind: 'single',
    prompt: 'ماتریس آیزنهاور وظایف را بر چه اساسی تفکیک می‌کند؟',
    options: [
      { id: 'po-6', text: 'سختی و آسانی کار' },
      { id: 'po-7', text: 'فوریت و اهمیت (Urgent vs Important)' },
      { id: 'po-8', text: 'هزینه مالی و سودآوری' },
    ],
    correctIds: ['po-7'],
    explanation: 'تفکیک فوریت از اهمیت، کلید رهایی از تله کارهای کم‌ارزش است.',
    weight: 1,
  },
  {
    id: 'pq-4',
    kind: 'scenario',
    prompt: 'مدیر شما بازخوردی تند و با لحن انتقادی ارائه می‌دهد. پاسخ سنجیده چیست؟',
    options: [
      {
        id: 'po-9',
        text: 'تمرکز بر هسته فنی بازخورد، تفکیک هیجان کلام از نکات قابل بهبود و طرح سوالات شفاف‌ساز.',
      },
      { id: 'po-10', text: 'ترک فوری جلسه و پاسخ با ایمیل پرخاشگرانه.' },
    ],
    correctIds: ['po-9'],
    explanation: 'جداسازی داده از لحن نشانه بلوغ هیجانی و حرفه‌ای است.',
    weight: 2,
  },
  {
    id: 'pq-5',
    kind: 'true_false',
    prompt:
      'تفکر سیستمی یعنی دیدن کل فرآیند و روابط علت و معلولی چرخه، به جای بررسی جداگانه تک‌تک اجزا.',
    options: [
      { id: 'po-11', text: 'درست' },
      { id: 'po-12', text: 'نادرست' },
    ],
    correctIds: ['po-11'],
    explanation: 'تفکر سیستمی ساختار کلی و چرخه‌های بازخورد را تحلیل می‌کند.',
    weight: 1,
  },
  {
    id: 'pq-6',
    kind: 'single',
    prompt: 'تکنیک پومودورو برای کدام هدف طراحی شده است؟',
    options: [
      { id: 'po-13', text: 'افزایش تمرکز متمرکز با بلوک‌های زمانی منظم و استراحت کوتاه' },
      { id: 'po-14', text: 'انجام همزمان چند کار بدون توقف' },
    ],
    correctIds: ['po-13'],
    explanation: 'تمرکز متمرکز و فاصله‌گذاری مانع خستگی زودرس مغز می‌شود.',
    weight: 1,
  },
  {
    id: 'pq-7',
    kind: 'scenario',
    prompt:
      'در جلسه تصمیم‌گیری، دو نفر از همکاران ارشد دچار اختلاف دیدگاه جدی شده‌اند. نقش شما چیست؟',
    options: [
      { id: 'po-15', text: 'بازگرداندن گفتگو به هدف مشترک سازمانی و داده‌های سنجش‌پذیر.' },
      { id: 'po-16', text: 'طرفداری کامل از یک نفر برای پایان سریع جلسه.' },
    ],
    correctIds: ['po-15'],
    explanation: 'هدایت گفتگو به سمت معیارها و اهداف عینی اختلاف شخصی را خنثی می‌کند.',
    weight: 2,
  },
  {
    id: 'pq-8',
    kind: 'single',
    prompt: 'شاخص فرهنگ ایمنی پیشگیرانه چیست؟',
    options: [
      { id: 'po-17', text: 'تعداد بالای ثبت شبه‌حوادث بدون خسارت و رفع خطر پیشگیرانه' },
      { id: 'po-18', text: 'پنهان کردن موارد نقض جزئی استاندارد' },
    ],
    correctIds: ['po-17'],
    explanation: 'ثبت آزادانه شبه‌حوادث نشانه هوشیاری و بلوغ ایمنی سازمان است.',
    weight: 1,
  },
];

export const placementApi = {
  // TODO(backend): GET /api/v1/placement/questions
  async start(): Promise<{ questions: Question[] }> {
    return mockRequest(
      () => {
        return { questions: PLACEMENT_QUESTIONS };
      },
      { endpoint: '/api/v1/placement/questions' }
    );
  },

  // TODO(backend): POST /api/v1/placement/submit
  async submit(answers: Record<string, string>): Promise<PlacementTestResult> {
    return mockRequest(
      () => {
        let totalWeight = 0;
        let scoreWeight = 0;

        PLACEMENT_QUESTIONS.forEach((q) => {
          const w = q.weight || 1;
          totalWeight += w;
          const ans = answers[q.id];
          if (ans && q.correctIds.includes(ans)) {
            scoreWeight += w;
          }
        });

        const scorePct = Math.round((scoreWeight / totalWeight) * 100);
        let suggestedLevel: Level = 1;
        let confidence = 0.82;
        let reasons: string[] = [];

        if (scorePct >= 85) {
          suggestedLevel = 4;
          confidence = 0.94;
          reasons = [
            'تسلط عالی در سناریوهای حل تعارض و هدایت تیم',
            'درک عمیق تفکر سیستمی و مدیریت زمان پیشرفته',
            'نگاه راهبردی به استانداردهای ارتباطی و فرهنگ ایمنی',
          ];
        } else if (scorePct >= 65) {
          suggestedLevel = 3;
          confidence = 0.88;
          reasons = [
            'عملکرد قوی در تفکیک فوریت از اهمیت در محیط کاری',
            'توانایی مناسب در مدیریت بازخورد و تعاملات سازمانی',
            'آمادگی برای ورود مستقیم به پروژه‌های کاربردی سطح ماهر',
          ];
        } else if (scorePct >= 40) {
          suggestedLevel = 2;
          confidence = 0.85;
          reasons = [
            'آشنایی مطلوب با پایه‌های ارتباطات اثربخش',
            'نیاز به تثبیت الگوهای تفکر سیستمی در عمل',
            'مسیر مشخص برای پیشرفت سریع در واحدهای بنیادین',
          ];
        } else {
          suggestedLevel = 1;
          confidence = 0.8;
          reasons = [
            'بهترین نقطه برای پایه‌ریزی اصول اولیه شایستگی',
            'شروع آرام و لذت‌بخش با گرابایت‌های بنیادین',
            'یادگیری گام‌به‌گام مفاهیم پایه‌ای کار تیمی',
          ];
        }

        const user = getStoredUser();
        const updatedUser = {
          ...user,
          level: suggestedLevel,
          levelSource: 'placement_test' as const,
          aiSuggestedLevel: {
            level: suggestedLevel,
            reasons,
            confidence,
          },
        };
        setStoredUser(updatedUser);

        return {
          suggestedLevel,
          confidence,
          reasons,
          scorePct,
        };
      },
      { endpoint: '/api/v1/placement/submit' }
    );
  },
};
