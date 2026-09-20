import { ImportJob, ImportRowError, OrgMember } from '../../types/org';
import { OrgRank, Level } from '../../types/domain';
import { orgApi } from './client';
import { subscriptionsApi } from './subscriptions';

const STORAGE_KEY_IMPORT_HISTORY = 'gerabyte_org_import_history_v1';

export const VALID_PERSIAN_RANKS: Record<string, OrgRank> = {
  'اپراتور': 'operator',
  'کارشناس': 'expert',
  'سرپرست': 'supervisor',
  'مدیر میانی': 'middle_manager',
  'مدیر ارشد': 'senior_manager',
};

export const RANK_DEFAULT_LEVELS: Record<OrgRank, Level> = {
  operator: 1,
  expert: 2,
  supervisor: 3,
  middle_manager: 4,
  senior_manager: 5,
};

export const CSV_TEMPLATE_HEADERS = [
  'نام و نام خانوادگی',
  'شماره موبایل',
  'کد پرسنلی',
  'معاونت',
  'واحد',
  'گروه',
  'رده سازمانی',
  'سطح',
  'ایمیل',
];

export const CSV_TEMPLATE_SAMPLE_ROWS = [
  ['محمدرضا کاظمی', '09121234567', '10401', 'معاونت تولید و عملیات', 'واحد نورد گرم و مقاطع', 'شیفت A', 'کارشناس', '2', 'm.kazemi@foolad.ir'],
  ['مینا خسروی', '09359876543', '10402', 'معاونت فنی و مهندسی', 'آزمایشگاه متالورژی و کنترل کیفی', 'کنترل خواص مکانیکی', 'سرپرست', '3', 'm.khosravi@foolad.ir'],
  ['علی رادمنش', '09123334455', '10403', 'معاونت تولید و عملیات', 'واحد نورد گرم و مقاطع', 'شیفت B', 'اپراتور', '1', ''],
];

/**
 * Normalizes Persian/Arabic digits, +98, 0098, and spaces into Iranian standard 09XXXXXXXXX
 */
export function normalizePhone(raw: string): string {
  if (!raw) return '';
  let str = String(raw).trim();
  // Persian / Arabic to Latin digits
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(persianDigits[i], 'g'), String(i));
    str = str.replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }
  str = str.replace(/[\s\-\(\)]/g, '');
  if (str.startsWith('+98')) {
    str = '0' + str.slice(3);
  } else if (str.startsWith('0098')) {
    str = '0' + str.slice(4);
  } else if (str.startsWith('98')) {
    str = '0' + str.slice(2);
  } else if (str.length === 10 && str.startsWith('9')) {
    str = '0' + str;
  }
  return str;
}

export interface ParsedRawRow {
  rowNumber: number;
  fullName: string;
  phone: string;
  personnelCode: string;
  depName: string;
  unitName: string;
  groupName?: string;
  rankText: string;
  levelText?: string;
  email?: string;
}

export interface ValidationResult {
  validRows: ParsedRawRow[];
  errors: ImportRowError[];
  autoNodesToCreate: string[];
}

export const importApi = {
  // Generate downloadable CSV template with UTF-8 BOM
  generateTemplateCsv(): string {
    const bom = '\uFEFF';
    const lines = [
      CSV_TEMPLATE_HEADERS.join(','),
      ...CSV_TEMPLATE_SAMPLE_ROWS.map((r) => r.map((c) => `"${c}"`).join(',')),
    ];
    return bom + lines.join('\r\n');
  },

  // Validate list of raw parsed rows client-side
  async validateRows(
    rows: ParsedRawRow[],
    existingMembers: OrgMember[],
    existingUnits: { id: string; name: string }[]
  ): Promise<ValidationResult> {
    const errors: ImportRowError[] = [];
    const validRows: ParsedRawRow[] = [];
    const seenPhonesInFile = new Set<string>();
    const seenCodesInFile = new Set<string>();
    const existingPhones = new Set(existingMembers.map((m) => normalizePhone(m.phone)));
    const existingCodes = new Set(existingMembers.map((m) => m.id));
    const knownUnitNames = new Set(existingUnits.map((u) => u.name.trim().toLowerCase()));
    const unknownUnitsSet = new Set<string>();

    for (const r of rows) {
      let hasRowError = false;

      // 1. Full name
      if (!r.fullName || r.fullName.trim().length < 3) {
        errors.push({
          row: r.rowNumber,
          column: 'نام و نام خانوادگی',
          message: 'نام و نام خانوادگی الزامی است (حداقل ۳ نویسه).',
          hint: 'نام و فامیل همکار را بررسی فرمایید.',
        });
        hasRowError = true;
      }

      // 2. Phone normalization & validation
      const normPhone = normalizePhone(r.phone);
      if (!normPhone || !/^09\d{9}$/.test(normPhone)) {
        errors.push({
          row: r.rowNumber,
          column: 'شماره موبایل',
          message: `شماره موبایل «${r.phone}» نامعتبر است.`,
          hint: 'شماره باید ۱۱ رقمی و با ۰۹ شروع شود.',
        });
        hasRowError = true;
      } else if (seenPhonesInFile.has(normPhone)) {
        errors.push({
          row: r.rowNumber,
          column: 'شماره موبایل',
          message: `شماره موبایل تکراری در همین فایل: ${normPhone}`,
          hint: 'ردیف‌های تکراری را حذف یا تصحیح نمایید.',
        });
        hasRowError = true;
      } else if (existingPhones.has(normPhone)) {
        errors.push({
          row: r.rowNumber,
          column: 'شماره موبایل',
          message: `این شماره قبلاً در سامانه ثبت شده است: ${normPhone}`,
          hint: 'همکار در حال حاضر دارای حساب سازمانی است.',
        });
        hasRowError = true;
      } else {
        seenPhonesInFile.add(normPhone);
      }

      // 3. Personnel Code
      const code = String(r.personnelCode || '').trim();
      if (!code) {
        errors.push({
          row: r.rowNumber,
          column: 'کد پرسنلی',
          message: 'کد پرسنلی الزامی است.',
          hint: 'کد پرسنلی اختصاصی کارمند را درج کنید.',
        });
        hasRowError = true;
      } else if (seenCodesInFile.has(code)) {
        errors.push({
          row: r.rowNumber,
          column: 'کد پرسنلی',
          message: `کد پرسنلی تکراری در فایل: ${code}`,
          hint: 'از یکتایی کد پرسنلی اطمینان حاصل کنید.',
        });
        hasRowError = true;
      } else {
        seenCodesInFile.add(code);
      }

      // 4. Rank check
      const cleanRank = (r.rankText || '').trim();
      if (!cleanRank || !VALID_PERSIAN_RANKS[cleanRank]) {
        errors.push({
          row: r.rowNumber,
          column: 'رده سازمانی',
          message: `رده سازمانی «${cleanRank || 'خالی'}» نامعتبر است.`,
          hint: 'مقادیر مجاز: اپراتور، کارشناس، سرپرست، مدیر میانی، مدیر ارشد',
        });
        hasRowError = true;
      }

      // 5. Unit check
      const targetUnit = (r.unitName || r.depName || '').trim();
      if (!targetUnit) {
        errors.push({
          row: r.rowNumber,
          column: 'واحد',
          message: 'واحد یا معاونت الزامی است.',
          hint: 'ساختار درختی سازمانی را مشخص کنید.',
        });
        hasRowError = true;
      } else if (!knownUnitNames.has(targetUnit.toLowerCase())) {
        unknownUnitsSet.add(targetUnit);
      }

      if (!hasRowError) {
        validRows.push({
          ...r,
          phone: normPhone,
          personnelCode: code,
        });
      }
    }

    return {
      validRows,
      errors,
      autoNodesToCreate: Array.from(unknownUnitsSet),
    };
  },

  // Check seat limit
  async checkSeatAvailability(neededSeats: number): Promise<{ available: boolean; unassigned: number }> {
    const summary = await subscriptionsApi.getSummary();
    return {
      available: summary.unassigned >= neededSeats,
      unassigned: summary.unassigned,
    };
  },

  // Save history
  async getHistory(): Promise<ImportJob[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_IMPORT_HISTORY);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    const initial: ImportJob[] = [
      {
        id: 'job-1',
        fileName: 'پرسنل_شیفت_تابستان_۱۴۰۳.xlsx',
        rowCount: 85,
        validRows: 85,
        errorRows: 0,
        status: 'done',
        errors: [],
        options: { autoCreateNodes: true, sponsorship: { months: 6, startsAt: '۱۴۰۳/۰۶/۰۱' }, sendInviteSms: true },
        result: { added: 85, updated: 0, skipped: 0, failed: 0 },
      },
    ];
    localStorage.setItem(STORAGE_KEY_IMPORT_HISTORY, JSON.stringify(initial));
    return initial;
  },

  async addJob(job: ImportJob): Promise<void> {
    const history = await this.getHistory();
    history.unshift(job);
    localStorage.setItem(STORAGE_KEY_IMPORT_HISTORY, JSON.stringify(history));
  },
};
