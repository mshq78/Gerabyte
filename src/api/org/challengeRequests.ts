import { ChallengeRequest, ChallengeRequestStatus, OrgScope } from '../../types/org';
import { Prize, Level, Challenge } from '../../types/domain';

const STORAGE_KEY_CHALLENGE_REQUESTS = 'gerabyte_org_challenge_requests_v1';
const STORAGE_CHALLENGES_KEY = 'gerabyte:challenges';

export const INITIAL_MOCK_CHALLENGE_REQUESTS: ChallengeRequest[] = [
  {
    id: 'req-1',
    title: 'ماراتن ایمنی کارگاه و پیشگیری از حوادث خط نورد',
    objective: 'کاهش نرخ حوادث خط نورد گرم و یادآوری سریع اصول واکنش در شرایط اضطراری',
    target: { unitId: 'u-nord', unitName: 'واحد نورد گرم و مقاطع', includeChildren: true },
    levelFilter: [1, 2, 3],
    goal: { type: 'xp', target: 500 },
    startsAt: '۱۴۰۳/۰۷/۰۱',
    endsAt: '۱۴۰۳/۰۷/۱۵',
    suggestedPrize: 'ماگ هوشمند حرارتی و ست وسایل ارگونومیک گرا',
    notes: 'پرسنل شیفت شب نیز می‌توانند در زمان استراحت شرکت کنند.',
    status: 'active',
    requestedByName: 'مهندس علیرضا رضایی',
    estimatedParticipants: 48,
    timeline: [
      {
        at: '۱۴۰۳/۰۶/۲۵',
        status: 'submitted',
        byName: 'مهندس علیرضا رضایی',
        comment: 'درخواست چالش برای پرسنل نورد ارسال شد.',
      },
      {
        at: '۱۴۰۳/۰۶/۲۶',
        status: 'in_review',
        byName: 'تیم آموزش گرا',
        comment: 'بررسی اهداف آموزشی و تطابق با کاتالوگ مهارت‌ها.',
      },
      {
        at: '۱۴۰۳/۰۶/۲۷',
        status: 'approved',
        byName: 'تیم آموزش گرا',
        comment: 'چالش تأیید شد و جوایز پستی تخصیص یافت.',
      },
      {
        at: '۱۴۰۳/۰۷/۰۱',
        status: 'active',
        byName: 'سیستم هوشمند گرا',
        comment: 'چالش در اپلیکیشن کارکنان فعال گردید.',
      },
    ],
    approvedPrize: {
      title: 'پک ویژه ایمنی و سلامت گرا + ماگ هوشمند حرارتی',
      description: 'جوایز اختصاصی تأمین شده توسط تیم گرا برای برترین‌های ماراتن ایمنی',
      winnersCount: 3,
      provider: 'gera',
      valueTag: 'ارزش ۱،۸۰۰،۰۰۰ تومان',
    },
    winnersRule: 'سه نفر برتر که بیشترین امتیاز XP را در آزمون‌های ایمنی کسب نمایند',
    live: {
      joined: 42,
      completed: 28,
    },
  },
  {
    id: 'req-2',
    title: 'چالش تسلط بر استانداردهای کنترل کیفی متالورژی',
    objective: 'افزایش دقت آزمایشگاهی در آزمون کشش میلگرد و آزمون ضربه شارپی',
    target: { unitId: 'u-lab', unitName: 'آزمایشگاه متالورژی و کنترل کیفی' },
    levelFilter: [2, 3, 4],
    goal: { type: 'lessons', target: 8 },
    startsAt: '۱۴۰۳/۰۷/۱۰',
    endsAt: '۱۴۰۳/۰۷/۲۴',
    suggestedPrize: 'کارت هدیه کتاب فنی یا هندبوک متالورژی ASM',
    notes: 'تمرکز بر بخش تلورانس ابعادی و عیوب ساختاری فولاد',
    status: 'in_review',
    requestedByName: 'دکتر سپیده رهنما',
    estimatedParticipants: 18,
    timeline: [
      {
        at: '۱۴۰۳/۰۷/۰۱',
        status: 'submitted',
        byName: 'دکتر سپیده رهنما',
        comment: 'ثبت طرح اولیه برای کارشناسان آزمایشگاه',
      },
      {
        at: '۱۴۰۳/۰۷/۰۲',
        status: 'in_review',
        byName: 'تیم آموزش گرا',
        comment: 'در حال بررسی توسط منتور ارشد صنعتی گرا',
      },
    ],
  },
  {
    id: 'req-3',
    title: 'ارتقای مهارت‌های ارتباطی و حل تعارض شیفت‌های تولید',
    objective: 'بهبود همکاری بین سرپرستان شیفت و اپراتورهای خط در انتقال پیام‌های تحویل شیفت',
    target: 'all',
    levelFilter: [3, 4, 5],
    goal: { type: 'streak', target: 7 },
    startsAt: '۱۴۰۳/۰۷/۱۵',
    endsAt: '۱۴۰۳/۰۷/۳۰',
    suggestedPrize: 'دوره ویژه رهبری سازمانی',
    notes: 'در شیفت عصر و شب نیاز مبرم به ارتباط شفاف وجود دارد.',
    status: 'needs_changes',
    requestedByName: 'مهندس محمدرضا صادقی',
    estimatedParticipants: 75,
    timeline: [
      { at: '۱۴۰۳/۰۶/۲۰', status: 'submitted', byName: 'مهندس محمدرضا صادقی' },
      {
        at: '۱۴۰۳/۰۶/۲۲',
        status: 'needs_changes',
        byName: 'تیم آموزش گرا',
        comment:
          'هدف‌گذاری زنجیره ۷ روزه برای شیفت‌های چرخشی سخت‌گیرانه است؛ پیشنهاد می‌شود نوع هدف به تعداد ۵ گرابایت تغییر یابد.',
      },
    ],
  },
  {
    id: 'req-4',
    title: 'جام گرابایت تابستانه: کاهش ضایعات و دوباره‌کاری قطعات',
    objective: 'ارتقای دانش فنی فرآیندهای جوشکاری و برشکاری صنعتی',
    target: 'all',
    goal: { type: 'lessons', target: 12 },
    startsAt: '۱۴۰۳/۰۵/۰۱',
    endsAt: '۱۴۰۳/۰۵/۲۵',
    status: 'ended',
    requestedByName: 'سرکار خانم فریبا رادمنش',
    estimatedParticipants: 140,
    approvedPrize: {
      title: 'هدفون بی‌سیم انکر + تندیس یادبود گرا',
      description: 'اهدایی از طرف گرا به رتبه‌های برتر سازمان',
      winnersCount: 3,
      provider: 'gera',
      valueTag: 'ارزش ۳،۵۰۰،۰۰۰ تومان',
    },
    winnersRule: 'بیشترین پیشرفت و نمره در آزمون جامع فنی',
    timeline: [
      { at: '۱۴۰۳/۰۴/۲۰', status: 'submitted', byName: 'سرکار خانم فریبا رادمنش' },
      { at: '۱۴۰۳/۰۴/۲۴', status: 'approved', byName: 'تیم آموزش گرا' },
      { at: '۱۴۰۳/۰۵/۰۱', status: 'active', byName: 'سیستم گرا' },
      {
        at: '۱۴۰۳/۰۵/۲۵',
        status: 'ended',
        byName: 'سیستم گرا',
        comment: 'چالش به پایان رسید و نتایج نهایی استخراج شد.',
      },
    ],
    result: {
      participants: 124,
      completed: 88,
      winners: [
        { name: 'زهرا کریمی', unit: 'آزمایشگاه متالورژی' },
        { name: 'محسن اسدی', unit: 'نورد گرم و مقاطع' },
        { name: 'سارا باقری', unit: 'فنی و مهندسی' },
      ],
    },
  },
];

function getStoredRequests(): ChallengeRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHALLENGE_REQUESTS);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  try {
    localStorage.setItem(
      STORAGE_KEY_CHALLENGE_REQUESTS,
      JSON.stringify(INITIAL_MOCK_CHALLENGE_REQUESTS)
    );
  } catch {
    // fallback
  }
  return INITIAL_MOCK_CHALLENGE_REQUESTS;
}

function saveStoredRequests(list: ChallengeRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CHALLENGE_REQUESTS, JSON.stringify(list));
  } catch {
    // fallback
  }
}

/**
 * Sync approved challenge into learner app's challenges storage
 */
function syncWithLearnerChallenges(req: ChallengeRequest): void {
  try {
    const raw = localStorage.getItem(STORAGE_CHALLENGES_KEY);
    let challenges: Challenge[] = [];
    if (raw) {
      challenges = JSON.parse(raw);
    }
    const challengeId = `org-ch-${req.id}`;
    const existingIdx = challenges.findIndex((c) => c.id === challengeId);

    const prize: Prize = req.approvedPrize || {
      title: req.suggestedPrize || 'پک هدایای اختصاصی گرا',
      description: 'تأمین شده و تضمین شده توسط آکادمی گرا',
      winnersCount: 3,
      provider: 'gera',
      valueTag: 'ارزش ۱،۵۰۰،۰۰۰ تومان',
    };

    const newChallenge: Challenge = {
      id: challengeId,
      title: req.title,
      description: req.objective,
      origin: 'org_requested',
      requestedBy: req.requestedByName,
      startsAt: req.startsAt,
      endsAt: req.endsAt,
      goal: req.goal,
      prize,
      state: 'available',
      progress: 0,
      participants: req.live?.joined || 12,
      top: [
        {
          rank: 1,
          userId: 'p-2',
          displayName: 'زهرا کریمی',
          unitLabel: 'آزمایشگاه',
          avatarSeed: 'karimi',
          weeklyXp: 420,
          isMe: false,
          movement: 'up',
        },
        {
          rank: 2,
          userId: 'p-1',
          displayName: 'علیرضا رضایی',
          unitLabel: 'نورد گرم',
          avatarSeed: 'rezaei',
          weeklyXp: 380,
          isMe: true,
          movement: 'same',
        },
        {
          rank: 3,
          userId: 'p-7',
          displayName: 'مهدی حسینی',
          unitLabel: 'HSE',
          avatarSeed: 'hoseini',
          weeklyXp: 350,
          isMe: false,
          movement: 'down',
        },
      ],
      requiresFullPlan: false,
    };

    if (existingIdx >= 0) {
      challenges[existingIdx] = newChallenge;
    } else {
      challenges.unshift(newChallenge);
    }
    localStorage.setItem(STORAGE_CHALLENGES_KEY, JSON.stringify(challenges));
  } catch (err) {
    console.error('Failed to sync challenge with learner app:', err);
  }
}

export const challengeRequestsApi = {
  // TODO(backend): GET /api/v1/org/challenge-requests
  async list(filters?: {
    status?: string;
    role?: string;
    managerName?: string;
  }): Promise<ChallengeRequest[]> {
    let list = getStoredRequests();
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((r) => r.status === filters.status);
    }
    if (filters?.role === 'unit_manager' && filters.managerName) {
      list = list.filter(
        (r) =>
          r.requestedByName.includes(filters.managerName!) ||
          (typeof r.target === 'object' && r.target.unitId === 'u-nord')
      );
    }
    return list;
  },

  // TODO(backend): GET /api/v1/org/challenge-requests/:id
  async getById(id: string): Promise<ChallengeRequest | null> {
    const list = getStoredRequests();
    return list.find((r) => r.id === id) || null;
  },

  // TODO(backend): POST /api/v1/org/challenge-requests
  async create(data: {
    title: string;
    objective: string;
    target: OrgScope;
    levelFilter?: Level[];
    goal: { type: 'lessons' | 'xp' | 'streak' | 'exam'; target: number };
    startsAt: string;
    endsAt: string;
    suggestedPrize?: string;
    notes?: string;
    requestedByName: string;
    status: 'draft' | 'submitted';
  }): Promise<ChallengeRequest> {
    const list = getStoredRequests();
    const newReq: ChallengeRequest = {
      id: `req-${Date.now()}`,
      ...data,
      estimatedParticipants: typeof data.target === 'object' ? 35 : 120,
      timeline: [
        {
          at: 'امروز',
          status: data.status,
          byName: data.requestedByName,
          comment:
            data.status === 'submitted' ? 'درخواست به گرا ارسال شد.' : 'پیش‌نویس ذخیره گردید.',
        },
      ],
    };
    list.unshift(newReq);
    saveStoredRequests(list);
    return newReq;
  },

  // TODO(backend): PUT /api/v1/org/challenge-requests/:id
  async update(id: string, updates: Partial<ChallengeRequest>): Promise<ChallengeRequest> {
    const list = getStoredRequests();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('درخواست چالش یافت نشد.');

    list[idx] = { ...list[idx], ...updates };
    saveStoredRequests(list);
    return list[idx];
  },

  // TODO(backend): POST /api/v1/org/challenge-requests/:id/submit
  async submit(id: string, byName: string): Promise<ChallengeRequest> {
    const list = getStoredRequests();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('درخواست یافت نشد.');

    list[idx].status = 'submitted';
    list[idx].timeline.push({
      at: 'امروز',
      status: 'submitted',
      byName,
      comment: 'درخواست توسط مدیر ارسال شد و در انتظار بررسی گراست.',
    });
    saveStoredRequests(list);
    return list[idx];
  },

  // TODO(backend): POST /api/v1/org/challenge-requests/:id/withdraw
  async withdraw(id: string, byName: string): Promise<ChallengeRequest> {
    const list = getStoredRequests();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('درخواست یافت نشد.');

    list[idx].status = 'draft';
    list[idx].timeline.push({
      at: 'امروز',
      status: 'draft',
      byName,
      comment: 'درخواست جهت اعمال ویرایش بازپس‌گرفته شد.',
    });
    saveStoredRequests(list);
    return list[idx];
  },

  // Demo & Gera Admin Actions
  // TODO(backend): POST /api/v1/org/challenge-requests/:id/approve-by-gera
  async approveByGera(
    id: string,
    customPrize?: Prize,
    customRule?: string
  ): Promise<ChallengeRequest> {
    const list = getStoredRequests();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('درخواست چالش یافت نشد.');

    const prize: Prize = customPrize || {
      title: 'ست هوشمند ورزشی و فلاسک دماسنج‌دار گرا',
      description: 'تأمین جوایز با بالاترین کیفیت به‌عهده گرا است',
      winnersCount: 3,
      provider: 'gera',
      valueTag: 'ارزش ۱،۶۰۰،۰۰۰ تومان',
    };

    list[idx].status = 'approved';
    list[idx].approvedPrize = prize;
    list[idx].winnersRule = customRule || '۳ نفر برتر رده‌بندی کل چالش در پایان مهلت';
    list[idx].live = { joined: 1, completed: 0 };
    list[idx].timeline.push({
      at: 'امروز',
      status: 'approved',
      byName: 'تیم پشتیبانی گرا',
      comment:
        'درخواست چالش تأیید شد و جوایز گرا رزرو گردید. این چالش در اپلیکیشن یادگیرندگان منتشر شد.',
    });

    saveStoredRequests(list);
    // SYNC TO LEARNER APP
    syncWithLearnerChallenges(list[idx]);
    return list[idx];
  },

  // TODO(backend): POST /api/v1/org/challenge-requests/:id/needs-changes-by-gera
  async needsChangesByGera(id: string, comment: string): Promise<ChallengeRequest> {
    const list = getStoredRequests();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('درخواست چالش یافت نشد.');

    list[idx].status = 'needs_changes';
    list[idx].timeline.push({
      at: 'امروز',
      status: 'needs_changes',
      byName: 'تیم پشتیبانی گرا',
      comment:
        comment ||
        'لطفاً بازه زمانی چالش را حداقل به ۱۰ روز افزایش دهید تا امکان رسیدن به تارگت وجود داشته باشد.',
    });
    saveStoredRequests(list);
    return list[idx];
  },

  // TODO(backend): POST /api/v1/org/challenge-requests/:id/reject-by-gera
  async rejectByGera(id: string, comment: string): Promise<ChallengeRequest> {
    const list = getStoredRequests();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('درخواست چالش یافت نشد.');

    list[idx].status = 'rejected';
    list[idx].timeline.push({
      at: 'امروز',
      status: 'rejected',
      byName: 'تیم پشتیبانی گرا',
      comment:
        comment ||
        'با توجه به هم‌پوشانی با چالش سازمانی سراسری دیگر، در این بازه زمانی امکان برگزاری میسر نیست.',
    });
    saveStoredRequests(list);
    return list[idx];
  },
};
