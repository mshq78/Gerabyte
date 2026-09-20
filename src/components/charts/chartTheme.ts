import { toFa } from '../../lib/toFa';

/**
 * Shared Recharts styling. Everything resolves to a theme token, so no chart
 * carries a raw hex value, and no SVG text drops below the 14px floor.
 */
export const CHART_MIN_FONT_SIZE = 14;

export const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
] as const;

export const CHART_GRID_STROKE = 'var(--color-sunken)';

export const CHART_AXIS_TICK = {
  fill: 'var(--color-ink)',
  fontSize: CHART_MIN_FONT_SIZE,
  fontFamily: 'inherit',
} as const;

/** Persian digits on every axis tick. */
export function faTick(value: unknown): string {
  return toFa(String(value ?? ''));
}

/** Category labels are already Persian words; pass them through untouched. */
export function categoryTick(value: unknown): string {
  return String(value ?? '');
}
