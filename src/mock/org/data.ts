import { OrgUnit, OrgMember, PathAssignment, OrgKpiSummary } from '../../types/org';

// Seeded PRNG for deterministic, reproducible mock data
function createPrng(seed: number) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const MOCK_ORG_UNITS: OrgUnit[] = [
  {
    id: 'u-top',
    name: 'مجتمع فولاد نمونه (کل سازمان)',
    code: 'FN-000',
    parentId: null,
    memberCount: 32,
    managerName: 'مهندس محمدرضا صادقی',
    managerId: 'm-1',
    level: 0,
  },
  {
    id: 'u-prod',
    name: 'معاونت تولید و عملیات',
    code: 'FN-100',
    parentId: 'u-top',
    memberCount: 14,
    managerName: 'مهندس محمدرضا صادقی',
    managerId: 'm-1',
    level: 1,
  },
  {
    id: 'u-nord',
    name: 'واحد نورد گرم و مقاطع',
    code: 'FN-110',
    parentId: 'u-prod',
    memberCount: 8,
    managerName: 'مهندس علیرضا رضایی',
    managerId: 'p-1',
    level: 2,
  },
  {
    id: 'u-fani',
    name: 'معاونت فنی و مهندسی',
    code: 'FN-200',
    parentId: 'u-top',
    memberCount: 9,
    managerName: 'دکتر بهمن ناصری',
    managerId: 'm-2',
    level: 1,
  },
  {
    id: 'u-lab',
    name: 'آزمایشگاه متالورژی و کنترل کیفی',
    code: 'FN-210',
    parentId: 'u-fani',
    memberCount: 5,
    managerName: 'دکتر سپیده رهنما',
    managerId: 'p-4',
    level: 2,
  },
  {
    id: 'u-hse',
    name: 'واحد بهداشت، ایمنی و محیط زیست (HSE)',
    code: 'FN-300',
    parentId: 'u-top',
    memberCount: 4,
    managerName: 'مهندس حمید اکبری',
    managerId: 'm-3',
    level: 1,
  },
  {
    id: 'u-hr',
    name: 'توسعه سرمایه انسانی و آموزش',
    code: 'FN-400',
    parentId: 'u-top',
    memberCount: 5,
    managerName: 'سرکار خانم فریبا رادمنش',
    managerId: 'm-4',
    level: 1,
  },
];

let cachedMembers: OrgMember[] | null = null;

export function getMockOrgMembers(): OrgMember[] {
  if (cachedMembers) return cachedMembers;

  const prng = createPrng(1403);

  const rawList: {
    id: string;
    fullName: string;
    nickname: string;
    avatarSeed: string;
    unitId: string;
    unitName: string;
    role: 'org_admin' | 'unit_manager' | 'learner';
    rank: any;
    level: any;
    phone: string;
    email: string;
  }[] = [
    {
      id: 'p-1',
      fullName: 'علیرضا رضایی',
      nickname: 'علیرضا',
      avatarSeed: 'rezaei',
      unitId: 'u-nord',
      unitName: 'واحد نورد گرم و مقاطع',
      role: 'unit_manager',
      rank: 'supervisor',
      level: 3,
      phone: '۰۹۱۲۳۴۵۶۷۸۹',
      email: 'a.rezaei@foolad-nemooneh.ir',
    },
    {
      id: 'p-2',
      fullName: 'زهرا کریمی',
      nickname: 'زهرا',
      avatarSeed: 'karimi',
      unitId: 'u-lab',
      unitName: 'آزمایشگاه متالورژی و کنترل کیفی',
      role: 'learner',
      rank: 'expert',
      level: 2,
      phone: '۰۹۳۵۱۲۳۴۵۶۷',
      email: 'z.karimi@foolad-nemooneh.ir',
    },
    {
      id: 'p-4',
      fullName: 'دکتر سپیده رهنما',
      nickname: 'سپیده',
      avatarSeed: 'rahnama',
      unitId: 'u-lab',
      unitName: 'آزمایشگاه متالورژی و کنترل کیفی',
      role: 'unit_manager',
      rank: 'senior_manager',
      level: 4,
      phone: '۰۹۱۲۹۹۹۸۸۷۷',
      email: 's.rahnama@foolad-nemooneh.ir',
    },
    {
      id: 'm-1',
      fullName: 'محمدرضا صادقی',
      nickname: 'مهندس صادقی',
      avatarSeed: 'sadeghi',
      unitId: 'u-prod',
      unitName: 'معاونت تولید و عملیات',
      role: 'unit_manager',
      rank: 'senior_manager',
      level: 4,
      phone: '۰۹۱۲۱۱۱۰۱۰۱',
      email: 'm.sadeghi@foolad-nemooneh.ir',
    },
    {
      id: 'm-4',
      fullName: 'فریبا رادمنش',
      nickname: 'رادمنش',
      avatarSeed: 'radmanesh',
      unitId: 'u-hr',
      unitName: 'توسعه سرمایه انسانی و آموزش',
      role: 'org_admin',
      rank: 'middle_manager',
      level: 4,
      phone: '۰۹۱۲۲۲۲۰۲۰۲',
      email: 'f.radmanesh@foolad-nemooneh.ir',
    },
    {
      id: 'm-3',
      fullName: 'حمید اکبری',
      nickname: 'اکبری_ایمنی',
      avatarSeed: 'akbari',
      unitId: 'u-hse',
      unitName: 'واحد بهداشت، ایمنی و محیط زیست (HSE)',
      role: 'unit_manager',
      rank: 'middle_manager',
      level: 3,
      phone: '۰۹۱۲۳۳۳۰۳۰۳',
      email: 'h.akbari@foolad-nemooneh.ir',
    },
    {
      id: 'usr-07',
      fullName: 'حسین مرادی',
      nickname: 'حسین_م',
      avatarSeed: 'moradi',
      unitId: 'u-nord',
      unitName: 'واحد نورد گرم و مقاطع',
      role: 'learner',
      rank: 'operator',
      level: 2,
      phone: '۰۹۱۳۱۱۱۴۴۵۵',
      email: 'h.moradi@foolad-nemooneh.ir',
    },
    {
      id: 'usr-08',
      fullName: 'مریم حسینی',
      nickname: 'مریم_ح',
      avatarSeed: 'hosseini',
      unitId: 'u-hr',
      unitName: 'توسعه سرمایه انسانی و آموزش',
      role: 'learner',
      rank: 'expert',
      level: 3,
      phone: '۰۹۱۸۲۲۲۵۵۶۶',
      email: 'm.hosseini@foolad-nemooneh.ir',
    },
    {
      id: 'usr-09',
      fullName: 'کامران جعفری',
      nickname: 'کامران',
      avatarSeed: 'jafari',
      unitId: 'u-nord',
      unitName: 'واحد نورد گرم و مقاطع',
      role: 'learner',
      rank: 'operator',
      level: 1,
      phone: '۰۹۱۵۳۳۳۶۶۷۷',
      email: 'k.jafari@foolad-nemooneh.ir',
    },
    {
      id: 'usr-10',
      fullName: 'سارا باقری',
      nickname: 'سارا',
      avatarSeed: 'bagheri',
      unitId: 'u-fani',
      unitName: 'معاونت فنی و مهندسی',
      role: 'learner',
      rank: 'expert',
      level: 3,
      phone: '۰۹۱۴۴۴۴۷۷۸۸',
      email: 's.bagheri@foolad-nemooneh.ir',
    },
    {
      id: 'usr-11',
      fullName: 'امید فرهمند',
      nickname: 'امید',
      avatarSeed: 'farahmand',
      unitId: 'u-hse',
      unitName: 'واحد بهداشت، ایمنی و محیط زیست (HSE)',
      role: 'learner',
      rank: 'expert',
      level: 3,
      phone: '۰۹۱۹۵۵۵۸۸۹۹',
      email: 'o.farahmand@foolad-nemooneh.ir',
    },
    {
      id: 'usr-12',
      fullName: 'پیمان انصاری',
      nickname: 'پیمان',
      avatarSeed: 'ansari',
      unitId: 'u-prod',
      unitName: 'معاونت تولید و عملیات',
      role: 'learner',
      rank: 'supervisor',
      level: 2,
      phone: '۰۹۱۱۶۶۶۹۹۰۰',
      email: 'p.ansari@foolad-nemooneh.ir',
    },
    {
      id: 'usr-13',
      fullName: 'نرگس طاهری',
      nickname: 'نرگس',
      avatarSeed: 'taheri',
      unitId: 'u-lab',
      unitName: 'آزمایشگاه متالورژی و کنترل کیفی',
      role: 'learner',
      rank: 'expert',
      level: 2,
      phone: '۰۹۱۷۷۷۷۰۰۱۱',
      email: 'n.taheri@foolad-nemooneh.ir',
    },
    {
      id: 'usr-14',
      fullName: 'بهزاد کیانی',
      nickname: 'بهزاد',
      avatarSeed: 'kiani',
      unitId: 'u-nord',
      unitName: 'واحد نورد گرم و مقاطع',
      role: 'learner',
      rank: 'operator',
      level: 1,
      phone: '۰۹۳۰۸۸۸۱۱۲۲',
      email: 'b.kiani@foolad-nemooneh.ir',
    },
    {
      id: 'usr-15',
      fullName: 'شیما سعیدی',
      nickname: 'شیما',
      avatarSeed: 'saeedi',
      unitId: 'u-fani',
      unitName: 'معاونت فنی و مهندسی',
      role: 'learner',
      rank: 'expert',
      level: 4,
      phone: '۰۹۳۹۹۹۹۲۲۳۳',
      email: 'sh.saeedi@foolad-nemooneh.ir',
    },
    {
      id: 'usr-16',
      fullName: 'داوود قاسمی',
      nickname: 'داوود',
      avatarSeed: 'ghasemi',
      unitId: 'u-nord',
      unitName: 'واحد نورد گرم و مقاطع',
      role: 'learner',
      rank: 'supervisor',
      level: 3,
      phone: '۰۹۱۶۱۱۱۳۳۴۴',
      email: 'd.ghasemi@foolad-nemooneh.ir',
    },
    {
      id: 'usr-17',
      fullName: 'الهام مقدسی',
      nickname: 'الهام',
      avatarSeed: 'moghaddasi',
      unitId: 'u-hr',
      unitName: 'توسعه سرمایه انسانی و آموزش',
      role: 'learner',
      rank: 'expert',
      level: 2,
      phone: '۰۹۳۷۲۲۲۴۴۵۵',
      email: 'e.moghaddasi@foolad-nemooneh.ir',
    },
    {
      id: 'usr-18',
      fullName: 'مجید خسروی',
      nickname: 'مجید',
      avatarSeed: 'khosravi',
      unitId: 'u-prod',
      unitName: 'معاونت تولید و عملیات',
      role: 'learner',
      rank: 'operator',
      level: 1,
      phone: '۰۹۱۵۳۳۳۵۵۶۶',
      email: 'm.khosravi@foolad-nemooneh.ir',
    },
    {
      id: 'usr-19',
      fullName: 'نیلوفر امینی',
      nickname: 'نیلوفر',
      avatarSeed: 'amini',
      unitId: 'u-hse',
      unitName: 'واحد بهداشت، ایمنی و محیط زیست (HSE)',
      role: 'learner',
      rank: 'expert',
      level: 3,
      phone: '۰۹۳۸۴۴۴۶۶۷۷',
      email: 'n.amini@foolad-nemooneh.ir',
    },
    {
      id: 'usr-20',
      fullName: 'یاسر محمودی',
      nickname: 'یاسر',
      avatarSeed: 'mahmoodi',
      unitId: 'u-fani',
      unitName: 'معاونت فنی و مهندسی',
      role: 'learner',
      rank: 'expert',
      level: 2,
      phone: '۰۹۱۲۵۵۵۷۷۸۸',
      email: 'y.mahmoodi@foolad-nemooneh.ir',
    },
  ];

  cachedMembers = rawList.map((item, index) => {
    // Generate deterministic progress metrics based on index
    const isHighPerformer = index < 6;
    const isAtRisk = index === 8 || index === 13 || index === 17;
    const isInactive = index === 19;

    const streakDays = isInactive ? 0 : isAtRisk ? Math.floor(prng() * 2) : Math.floor(prng() * 18) + 3;
    const xpTotal = isInactive ? 60 : isHighPerformer ? 800 + Math.floor(prng() * 600) : 250 + Math.floor(prng() * 450);
    const completedLessonsCount = isInactive ? 2 : isHighPerformer ? 16 + Math.floor(prng() * 8) : 6 + Math.floor(prng() * 10);
    const totalAssignedLessons = 24;
    const complianceRate = Math.min(100, Math.round((completedLessonsCount / totalAssignedLessons) * 100));

    const status: 'active' | 'inactive' | 'at_risk' = isInactive ? 'inactive' : isAtRisk ? 'at_risk' : 'active';
    const certificatesCount = isHighPerformer ? 2 : completedLessonsCount >= 12 ? 1 : 0;

    return {
      ...item,
      status,
      xpTotal,
      streakDays,
      todayCompleted: isHighPerformer ? true : prng() > 0.45,
      totalAssignedLessons,
      completedLessonsCount,
      complianceRate,
      lastActiveAt: isInactive ? '۱۴۰۳/۰۶/۱۵' : isAtRisk ? '۱۴۰۳/۰۶/۲۸' : '۱۴۰۳/۰۷/۰۱',
      certificatesCount,
      domainMastery: {
        'domain-1': Math.min(100, Math.round(50 + prng() * 45)),
        'domain-2': Math.min(100, Math.round(40 + prng() * 50)),
        'domain-3': Math.min(100, Math.round(60 + prng() * 35)),
        'domain-4': Math.min(100, Math.round(45 + prng() * 45)),
        'domain-5': Math.min(100, Math.round(55 + prng() * 40)),
      },
    };
  });

  return cachedMembers;
}

export function getMockPathAssignments(): PathAssignment[] {
  return [
    {
      id: 'asg-1',
      title: 'الزامات ایمنی و حفاظت فردی در خطوط نورد (HSE)',
      description: 'آموزش‌های کاربردی پیشگیری از حوادث شیفت و پروتکل‌های اضطراری کارگاهی',
      domainId: 'domain-5',
      domainTitle: 'فرهنگ ایمنی و سلامت کار',
      targetType: 'all',
      targetId: 'u-top',
      targetName: 'تمام کارکنان مجتمع',
      mandatory: true,
      assignedDate: '۱۴۰۳/۰۶/۱۰',
      dueDate: '۱۴۰۳/۰۷/۱۵',
      status: 'active',
      totalAssigned: 32,
      completedCount: 26,
      inProgressCount: 4,
    },
    {
      id: 'asg-2',
      title: 'ارتباطات موثر و مدیریت تعارض شیفت‌های کاری',
      description: 'اصول هم‌افزایی، حل اختلاف بین‌فردی و شفافیت در تحویل شیفت‌های صنعتی',
      domainId: 'domain-1',
      domainTitle: 'شایستگی‌های فردی و سازمانی',
      targetType: 'unit',
      targetId: 'u-nord',
      targetName: 'واحد نورد گرم و مقاطع',
      mandatory: true,
      assignedDate: '۱۴۰۳/۰۶/۱۵',
      dueDate: '۱۴۰۳/۰۷/۲۰',
      status: 'active',
      totalAssigned: 8,
      completedCount: 6,
      inProgressCount: 2,
    },
    {
      id: 'asg-3',
      title: 'امانتداری داده‌ها و محرمانگی گزارش‌های کیفی',
      description: 'استانداردهای ثبت دقیق نتایج آزمون‌های متالورژی و صیانت از اعتبار سازمانی',
      domainId: 'domain-3',
      domainTitle: 'اخلاق حرفه‌ای و تعهد کاری',
      targetType: 'unit',
      targetId: 'u-lab',
      targetName: 'آزمایشگاه متالورژی و کنترل کیفی',
      mandatory: true,
      assignedDate: '۱۴۰۳/۰۶/۲۰',
      dueDate: '۱۴۰۳/۰۷/۳۰',
      status: 'active',
      totalAssigned: 5,
      completedCount: 4,
      inProgressCount: 1,
    },
    {
      id: 'asg-4',
      title: 'مدیریت خستگی و تعادل شیفت‌کاری در صنایع پیوسته',
      description: 'راهکارهای تنظیم ریتم خواب، تغذیه در شیفت شب و تاب‌آوری روانی خانواده',
      domainId: 'domain-2',
      domainTitle: 'خانواده و تعادل کار و زندگی',
      targetType: 'all',
      targetId: 'u-top',
      targetName: 'تمام کارکنان مجتمع',
      mandatory: false,
      assignedDate: '۱۴۰۳/۰۶/۰۱',
      dueDate: '۱۴۰۳/۰۸/۰۱',
      status: 'active',
      totalAssigned: 32,
      completedCount: 18,
      inProgressCount: 9,
    },
  ];
}

export function getMockOrgKpis(unitId: string | 'all' = 'all'): OrgKpiSummary {
  const members = getMockOrgMembers();
  const filtered = unitId === 'all' ? members : members.filter((m) => m.unitId === unitId);

  const totalMembers = filtered.length;
  const activeThisWeek = filtered.filter((m) => m.status === 'active').length;
  const atRiskLearnersCount = filtered.filter((m) => m.status === 'at_risk').length;

  const totalCompletedLessons = filtered.reduce((acc, m) => acc + m.completedLessonsCount, 0);
  const totalAssigned = filtered.reduce((acc, m) => acc + m.totalAssignedLessons, 0);
  const complianceRate = totalAssigned > 0 ? Math.round((totalCompletedLessons / totalAssigned) * 100) : 0;

  const totalStreak = filtered.reduce((acc, m) => acc + m.streakDays, 0);
  const avgStreakDays = totalMembers > 0 ? Number((totalStreak / totalMembers).toFixed(1)) : 0;

  const totalCerts = filtered.reduce((acc, m) => acc + m.certificatesCount, 0);

  return {
    totalMembers,
    activeThisWeek,
    complianceRate,
    avgDailyMinutes: 4.6,
    avgStreakDays,
    totalCertificatesEarned: totalCerts,
    atRiskLearnersCount,
    weeklyTrend: [
      { dayName: 'شنبه', completedLessons: Math.round(totalMembers * 0.72), activeLearners: Math.round(totalMembers * 0.8) },
      { dayName: 'یکشنبه', completedLessons: Math.round(totalMembers * 0.85), activeLearners: Math.round(totalMembers * 0.88) },
      { dayName: 'دوشنبه', completedLessons: Math.round(totalMembers * 0.9), activeLearners: Math.round(totalMembers * 0.92) },
      { dayName: 'سه‌شنبه', completedLessons: Math.round(totalMembers * 0.78), activeLearners: Math.round(totalMembers * 0.82) },
      { dayName: 'چهارشنبه', completedLessons: Math.round(totalMembers * 0.82), activeLearners: Math.round(totalMembers * 0.85) },
      { dayName: 'پنج‌شنبه', completedLessons: Math.round(totalMembers * 0.55), activeLearners: Math.round(totalMembers * 0.6) },
      { dayName: 'جمعه', completedLessons: Math.round(totalMembers * 0.42), activeLearners: Math.round(totalMembers * 0.45) },
    ],
    domainStats: [
      { domainId: 'domain-1', domainTitle: 'شایستگی‌های فردی و سازمانی', avgScore: 82, completionRate: 84, colorToken: '#1E6FA8' },
      { domainId: 'domain-2', domainTitle: 'خانواده و تعادل کار و زندگی', avgScore: 76, completionRate: 71, colorToken: '#E2665A' },
      { domainId: 'domain-3', domainTitle: 'اخلاق حرفه‌ای و تعهد کاری', avgScore: 89, completionRate: 88, colorToken: '#1F9A8A' },
      { domainId: 'domain-4', domainTitle: 'توسعه فردی و خودرهبری', avgScore: 78, completionRate: 75, colorToken: '#7A5BD6' },
      { domainId: 'domain-5', domainTitle: 'فرهنگ ایمنی و سلامت کار', avgScore: 91, completionRate: 93, colorToken: '#E58A1F' },
    ],
    unitRankings: [
      { unitId: 'u-hse', unitName: 'واحد بهداشت و ایمنی (HSE)', memberCount: 4, completionRate: 94, avgStreak: 9.2 },
      { unitId: 'u-lab', unitName: 'آزمایشگاه متالورژی', memberCount: 5, completionRate: 88, avgStreak: 8.4 },
      { unitId: 'u-hr', unitName: 'منابع انسانی و آموزش', memberCount: 5, completionRate: 82, avgStreak: 7.1 },
      { unitId: 'u-nord', unitName: 'واحد نورد گرم و مقاطع', memberCount: 8, completionRate: 79, avgStreak: 6.5 },
      { unitId: 'u-fani', unitName: 'معاونت فنی و مهندسی', memberCount: 9, completionRate: 74, avgStreak: 5.8 },
      { unitId: 'u-prod', unitName: 'معاونت تولید و عملیات', memberCount: 14, completionRate: 72, avgStreak: 5.2 },
    ],
  };
}
