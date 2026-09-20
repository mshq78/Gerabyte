import { describe, expect, it } from 'vitest';
import { maskPhone } from './privacy';

describe('maskPhone', () => {
  it('masks the middle of an Iranian mobile number', () => {
    expect(maskPhone('09123456789')).toBe('۰۹۱۲***۶۷۸۹');
  });

  it('accepts a number that is already in Persian digits', () => {
    expect(maskPhone('۰۹۱۲۳۴۵۶۷۸۹')).toBe('۰۹۱۲***۶۷۸۹');
  });

  it('ignores separators', () => {
    expect(maskPhone('0912-345-6789')).toBe('۰۹۱۲***۶۷۸۹');
    expect(maskPhone('0912 345 6789')).toBe('۰۹۱۲***۶۷۸۹');
  });

  it('never leaks the middle digits', () => {
    expect(maskPhone('09123456789')).not.toContain('۳۴۵');
    expect(maskPhone('09123456789')).not.toMatch(/[0-9]/);
  });

  it('returns an empty string for missing input', () => {
    expect(maskPhone('')).toBe('');
    expect(maskPhone(null)).toBe('');
    expect(maskPhone(undefined)).toBe('');
  });

  it('does not try to mask something too short to hide', () => {
    expect(maskPhone('123')).toBe('۱۲۳');
  });
});
