import Papa from 'papaparse';
import writeXlsx from 'write-excel-file/browser';
import readXlsxFile from 'read-excel-file/browser';
import { OrgMember } from '../../../types/org';
import { toFa } from '../../../lib/format';
import { maskPhone } from '../../../lib/privacy';

/** One row of a user-supplied CSV/XLSX import, keyed by its header cell. */
export type RawImportRow = Record<string, unknown>;

/**
 * `write-excel-file/browser` overloads badly for the schema form; this is the
 * shape we actually call.
 */
type XlsxWriter = (
  rows: OrgMember[],
  options: { schema: typeof EXCEL_SCHEMA; fileName: string }
) => Promise<void>;

export const EXCEL_SCHEMA = [
  { column: 'شناسه پرسنلی', type: String, value: (m: OrgMember) => m.id, width: 14 },
  { column: 'نام و نام خانوادگی', type: String, value: (m: OrgMember) => m.fullName, width: 22 },
  { column: 'واحد سازمانی', type: String, value: (m: OrgMember) => m.unitName, width: 26 },
  { column: 'سطح مهارت', type: String, value: (m: OrgMember) => `سطح ${toFa(m.level)}`, width: 12 },
  {
    column: 'نقش سامانه',
    type: String,
    value: (m: OrgMember) =>
      m.role === 'org_admin'
        ? 'مدیر ارشد سازمان'
        : m.role === 'unit_manager'
          ? 'مدیر واحد'
          : 'یادگیرنده',
    width: 18,
  },
  {
    column: 'وضعیت فعالیت',
    type: String,
    value: (m: OrgMember) =>
      m.status === 'active' ? 'فعال و پویا' : m.status === 'at_risk' ? 'نیازمند توجه' : 'غیرفعال',
    width: 16,
  },
  { column: 'امتیاز کل (XP)', type: Number, value: (m: OrgMember) => m.xpTotal, width: 16 },
  { column: 'زنجیره (روز)', type: Number, value: (m: OrgMember) => m.streakDays, width: 14 },
  { column: 'نرخ انطباق (٪)', type: Number, value: (m: OrgMember) => m.complianceRate, width: 16 },
  { column: 'گواهینامه‌ها', type: Number, value: (m: OrgMember) => m.certificatesCount, width: 14 },
  { column: 'شماره تماس', type: String, value: (m: OrgMember) => maskPhone(m.phone), width: 16 },
  { column: 'آخرین فعالیت', type: String, value: (m: OrgMember) => m.lastActiveAt, width: 16 },
];

export async function exportMembersToXlsx(
  members: OrgMember[],
  fileName = 'گزارش_پرسنل_گرابایت.xlsx'
): Promise<void> {
  await (writeXlsx as unknown as XlsxWriter)(members, {
    schema: EXCEL_SCHEMA,
    fileName,
  });
}

export function exportMembersToCsv(
  members: OrgMember[],
  fileName = 'گزارش_پرسنل_گرابایت.csv'
): void {
  const rows = members.map((m) => ({
    'شناسه پرسنلی': m.id,
    'نام و نام خانوادگی': m.fullName,
    'واحد سازمانی': m.unitName,
    'سطح مهارت': `سطح ${m.level}`,
    'نقش سامانه':
      m.role === 'org_admin'
        ? 'مدیر ارشد سازمان'
        : m.role === 'unit_manager'
          ? 'مدیر واحد'
          : 'یادگیرنده',
    'وضعیت فعالیت':
      m.status === 'active' ? 'فعال' : m.status === 'at_risk' ? 'نیازمند توجه' : 'غیرفعال',
    'امتیاز کل (XP)': m.xpTotal,
    'زنجیره (روز)': m.streakDays,
    'نرخ انطباق (٪)': m.complianceRate,
    'تعداد گواهینامه': m.certificatesCount,
    'شماره تماس': maskPhone(m.phone),
    'آخرین فعالیت': m.lastActiveAt,
  }));

  const csv = Papa.unparse(rows);
  // Add UTF-8 BOM so Excel opens Persian without garbled characters
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function parseMembersFromFile(file: File): Promise<RawImportRow[]> {
  if (file.name.endsWith('.csv')) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data as RawImportRow[]),
        error: (error) => reject(error),
      });
    });
  } else {
    // Excel file
    const rows = (await readXlsxFile(file)) as unknown as unknown[][];
    if (rows.length < 2) return [];
    const headers = rows[0].map(String);
    const data = rows.slice(1).map((row: unknown[]) => {
      const obj: RawImportRow = {};
      headers.forEach((h, i) => {
        obj[h] = row[i];
      });
      return obj;
    });
    return data;
  }
}
