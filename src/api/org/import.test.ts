import { describe, expect, it } from 'vitest';
import { ParsedRawRow, importApi, normalizePhone } from './import';
import type { OrgMember } from '../../types/org';

describe('normalizePhone', () => {
  it('passes a already-correct number through', () => {
    expect(normalizePhone('09123456789')).toBe('09123456789');
  });

  it('converts Persian digits', () => {
    expect(normalizePhone('۰۹۱۲۳۴۵۶۷۸۹')).toBe('09123456789');
  });

  it('converts Arabic-Indic digits', () => {
    expect(normalizePhone('٠٩١٢٣٤٥٦٧٨٩')).toBe('09123456789');
  });

  it('strips spaces, dashes and parentheses', () => {
    expect(normalizePhone(' 0912 345 6789 ')).toBe('09123456789');
    expect(normalizePhone('0912-345-6789')).toBe('09123456789');
    expect(normalizePhone('(0912)3456789')).toBe('09123456789');
  });

  it('normalises +98, 0098, 98 and a bare 9 prefix', () => {
    expect(normalizePhone('+989123456789')).toBe('09123456789');
    expect(normalizePhone('00989123456789')).toBe('09123456789');
    expect(normalizePhone('989123456789')).toBe('09123456789');
    expect(normalizePhone('9123456789')).toBe('09123456789');
  });

  it('handles a Persian-digit +98 number', () => {
    expect(normalizePhone('+۹۸۹۱۲۳۴۵۶۷۸۹')).toBe('09123456789');
  });

  it('returns an empty string for empty input', () => {
    expect(normalizePhone('')).toBe('');
  });
});

const UNITS = [
  { id: 'u-nord', name: 'واحد نورد گرم و مقاطع' },
  { id: 'u-lab', name: 'آزمایشگاه متالورژی و کنترل کیفی' },
];

const EXISTING = [{ id: 'p-1', fullName: 'علیرضا رضایی', phone: '09121110000' } as OrgMember];

function row(over: Partial<ParsedRawRow> = {}): ParsedRawRow {
  return {
    rowNumber: 1,
    fullName: 'زهرا کریمی',
    phone: '09123456789',
    personnelCode: '10401',
    depName: 'معاونت تولید و عملیات',
    unitName: 'واحد نورد گرم و مقاطع',
    rankText: 'اپراتور',
    ...over,
  };
}

const validate = (rows: ParsedRawRow[]) => importApi.validateRows(rows, EXISTING, UNITS);
const columnsOf = (errors: { column: string }[]) => errors.map((e) => e.column);

describe('import validation', () => {
  it('accepts a well-formed row', async () => {
    const result = await validate([row()]);
    expect(result.errors).toEqual([]);
    expect(result.validRows).toHaveLength(1);
  });

  it('normalises the phone on the accepted row', async () => {
    const result = await validate([row({ phone: '+۹۸۹۱۲۳۴۵۶۷۸۹' })]);
    expect(result.errors).toEqual([]);
    expect(result.validRows[0].phone).toBe('09123456789');
  });

  it('accepts 0098 and a bare +98 form', async () => {
    const result = await validate([
      row({ rowNumber: 1, phone: '00989121112233', personnelCode: 'A1' }),
      row({ rowNumber: 2, phone: '+989121112244', personnelCode: 'A2' }),
    ]);
    expect(result.errors).toEqual([]);
    expect(result.validRows.map((r) => r.phone)).toEqual(['09121112233', '09121112244']);
  });

  it('rejects a malformed phone', async () => {
    const result = await validate([row({ phone: '12345' })]);
    expect(columnsOf(result.errors)).toContain('شماره موبایل');
    expect(result.validRows).toHaveLength(0);
  });

  it('rejects a duplicate phone inside the same file', async () => {
    const result = await validate([
      row({ rowNumber: 1, personnelCode: 'A1' }),
      row({ rowNumber: 2, personnelCode: 'A2' }),
    ]);
    expect(result.validRows).toHaveLength(1);
    expect(result.errors.some((e) => e.row === 2 && e.column === 'شماره موبایل')).toBe(true);
  });

  it('rejects a phone that already exists in the organization', async () => {
    const result = await validate([row({ phone: '09121110000' })]);
    expect(columnsOf(result.errors)).toContain('شماره موبایل');
    expect(result.validRows).toHaveLength(0);
  });

  it('rejects a duplicate personnel code', async () => {
    const result = await validate([
      row({ rowNumber: 1, phone: '09121112233' }),
      row({ rowNumber: 2, phone: '09121112244' }),
    ]);
    expect(result.errors.some((e) => e.row === 2 && e.column === 'کد پرسنلی')).toBe(true);
    expect(result.validRows).toHaveLength(1);
  });

  it('rejects a missing personnel code', async () => {
    const result = await validate([row({ personnelCode: '' })]);
    expect(columnsOf(result.errors)).toContain('کد پرسنلی');
  });

  it('rejects an unknown organizational rank', async () => {
    const result = await validate([row({ rankText: 'فرمانده کل' })]);
    expect(columnsOf(result.errors)).toContain('رده سازمانی');
    expect(result.validRows).toHaveLength(0);
  });

  it('rejects a missing name', async () => {
    const result = await validate([row({ fullName: '' })]);
    expect(columnsOf(result.errors)).toContain('نام و نام خانوادگی');
  });

  it('rejects a name shorter than three characters', async () => {
    const result = await validate([row({ fullName: 'ز' })]);
    expect(columnsOf(result.errors)).toContain('نام و نام خانوادگی');
  });

  it('rejects a row with no unit at all', async () => {
    const result = await validate([row({ unitName: '', depName: '' })]);
    expect(columnsOf(result.errors)).toContain('واحد');
  });

  it('flags an unknown unit without failing the row', async () => {
    const result = await validate([row({ unitName: 'واحد ریخته‌گری' })]);
    expect(result.errors).toEqual([]);
    expect(result.validRows).toHaveLength(1);
    expect(result.autoNodesToCreate).toContain('واحد ریخته‌گری');
  });

  it('reports every problem on a row that is wrong in several ways', async () => {
    const result = await validate([
      row({ fullName: '', phone: 'nope', personnelCode: '', rankText: 'x' }),
    ]);
    expect(columnsOf(result.errors)).toEqual(
      expect.arrayContaining(['نام و نام خانوادگی', 'شماره موبایل', 'کد پرسنلی', 'رده سازمانی'])
    );
    expect(result.validRows).toHaveLength(0);
  });
});
