import { SeatSummary, OrgRenewalRequest } from '../../types/org';
import { formatJalaliMonthYear, isoDaysFromToday } from '../../lib/jalali';

const STORAGE_KEY_SEAT_SUMMARY = 'gerabyte_org_seat_summary_v1';
const STORAGE_KEY_RENEWALS = 'gerabyte_org_renewals_v1';

const DEFAULT_SEAT_SUMMARY: SeatSummary = {
  purchased: 5000,
  sponsoredActive: 4420,
  expiring14d: 180,
  expired: 120,
  convertedPersonal: 192,
  unassigned: 280,
};

export interface MonthlySponsorshipDistribution {
  monthName: string;
  count: number;
  percentage: number;
}

export interface ExpiringMemberItem {
  id: string;
  fullName: string;
  phone: string;
  unitName: string;
  rank: string;
  daysRemaining: number;
  sponsorshipEndsAt: string;
  lastReminderSentAt?: string;
  remindersCountToday: number;
}

export const INITIAL_EXPIRING_MEMBERS: ExpiringMemberItem[] = [
  {
    id: 'exp-1',
    fullName: 'مهرداد صالحی',
    phone: '۰۹۱۲۱۱۱۱۱۱۱',
    unitName: 'واحد نورد گرم و مقاطع',
    rank: 'کارشناس',
    daysRemaining: 3,
    sponsorshipEndsAt: isoDaysFromToday(3),
    remindersCountToday: 0,
  },
  {
    id: 'exp-2',
    fullName: 'ندا افشار',
    phone: '۰۹۱۹۲۲۲۲۲۲۲',
    unitName: 'آزمایشگاه متالورژی',
    rank: 'کارشناس',
    daysRemaining: 5,
    sponsorshipEndsAt: isoDaysFromToday(5),
    remindersCountToday: 1,
    lastReminderSentAt: 'دیروز',
  },
  {
    id: 'exp-3',
    fullName: 'سیاوش یزدانی',
    phone: '۰۹۳۵۳۳۳۳۳۳۳',
    unitName: 'معاونت فنی و مهندسی',
    rank: 'سرپرست',
    daysRemaining: 7,
    sponsorshipEndsAt: isoDaysFromToday(7),
    remindersCountToday: 0,
  },
  {
    id: 'exp-4',
    fullName: 'لیلا حسینی',
    phone: '۰۹۱۲۴۴۴۴۴۴۴',
    unitName: 'واحد بهداشت و ایمنی (HSE)',
    rank: 'کارشناس',
    daysRemaining: 9,
    sponsorshipEndsAt: isoDaysFromToday(9),
    remindersCountToday: 0,
  },
  {
    id: 'exp-5',
    fullName: 'کامبیز توکلی',
    phone: '۰۹۱۲۵۵۵۵۵۵۵',
    unitName: 'توسعه سرمایه انسانی',
    rank: 'اپراتور',
    daysRemaining: 12,
    sponsorshipEndsAt: isoDaysFromToday(12),
    remindersCountToday: 0,
  },
];

export const subscriptionsApi = {
  // TODO(backend): GET /api/v1/org/subscriptions/summary
  async getSummary(): Promise<SeatSummary> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SEAT_SUMMARY);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return DEFAULT_SEAT_SUMMARY;
  },

  // TODO(backend): PUT /api/v1/org/subscriptions/summary (e.g. for demo nearly-full state)
  async updateSummary(summary: Partial<SeatSummary>): Promise<SeatSummary> {
    const current = await this.getSummary();
    const updated = { ...current, ...summary };
    localStorage.setItem(STORAGE_KEY_SEAT_SUMMARY, JSON.stringify(updated));
    return updated;
  },

  // Set nearly-full seat pool demo state
  async setDemoNearlyFull(isNearlyFull: boolean): Promise<SeatSummary> {
    const current = await this.getSummary();
    const updated: SeatSummary = isNearlyFull
      ? {
          ...current,
          unassigned: 2, // only 2 seats left!
          sponsoredActive: current.purchased - (current.expiring14d + current.expired + 2),
        }
      : DEFAULT_SEAT_SUMMARY;
    localStorage.setItem(STORAGE_KEY_SEAT_SUMMARY, JSON.stringify(updated));
    return updated;
  },

  // TODO(backend): GET /api/v1/org/subscriptions/distribution
  async getMonthlyDistribution(): Promise<MonthlySponsorshipDistribution[]> {
    // The six months up to and including this one, named from real dates.
    const buckets = [
      { count: 180, percentage: 4.1 },
      { count: 320, percentage: 7.2 },
      { count: 650, percentage: 14.7 },
      { count: 940, percentage: 21.2 },
      { count: 1120, percentage: 25.3 },
      { count: 1210, percentage: 27.5 },
    ];
    return buckets.map((bucket, index) => ({
      monthName: formatJalaliMonthYear(isoDaysFromToday(-30 * (buckets.length - 1 - index))),
      ...bucket,
    }));
  },

  // TODO(backend): GET /api/v1/org/subscriptions/expiring-list
  async getExpiringMembers(): Promise<ExpiringMemberItem[]> {
    return INITIAL_EXPIRING_MEMBERS;
  },

  // TODO(backend): POST /api/v1/org/subscriptions/send-reminder
  async sendRenewalReminder(memberId: string): Promise<{ success: boolean; message: string }> {
    const member = INITIAL_EXPIRING_MEMBERS.find((m) => m.id === memberId);
    if (!member) throw new Error('کاربر یافت نشد.');
    if (member.remindersCountToday >= 1) {
      return {
        success: false,
        message: 'سقف ارسال روزانه یادآوری (۱ بار در روز) برای این همکار پر شده است.',
      };
    }
    member.remindersCountToday += 1;
    member.lastReminderSentAt = 'هم‌اکنون';
    return {
      success: true,
      message: `پیامک یادآوری تمدید سازمانی به شماره ${member.phone} با موفقیت ارسال شد.`,
    };
  },

  // TODO(backend): GET /api/v1/org/subscriptions/renewal-requests
  async getRenewalRequests(): Promise<OrgRenewalRequest[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RENEWALS);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    const initial: OrgRenewalRequest[] = [
      {
        id: 'ren-1',
        requestedAt: isoDaysFromToday(-16),
        seatsCount: 500,
        durationMonths: 6,
        status: 'approved',
        requestedByName: 'مهندس محمدرضا صادقی',
      },
      {
        id: 'ren-2',
        requestedAt: isoDaysFromToday(-92),
        seatsCount: 1000,
        durationMonths: 12,
        status: 'invoiced',
        requestedByName: 'مهندس محمدرضا صادقی',
      },
    ];
    localStorage.setItem(STORAGE_KEY_RENEWALS, JSON.stringify(initial));
    return initial;
  },

  // TODO(backend): POST /api/v1/org/subscriptions/renewal-requests
  async createRenewalRequest(data: {
    seatsCount: number;
    durationMonths: number;
    requestedByName: string;
  }): Promise<OrgRenewalRequest> {
    const list = await this.getRenewalRequests();
    const newReq: OrgRenewalRequest = {
      id: `ren-${Date.now()}`,
      requestedAt: new Date().toISOString(),
      seatsCount: data.seatsCount,
      durationMonths: data.durationMonths,
      status: 'pending',
      requestedByName: data.requestedByName,
    };
    list.unshift(newReq);
    localStorage.setItem(STORAGE_KEY_RENEWALS, JSON.stringify(list));
    return newReq;
  },
};
