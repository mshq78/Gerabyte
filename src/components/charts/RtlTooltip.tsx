import React from 'react';
import { toFa } from '../../lib/toFa';

export interface RtlTooltipEntry {
  name?: string | number;
  value?: string | number;
  color?: string;
  dataKey?: string | number;
}

interface RtlTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: RtlTooltipEntry[];
  /** Turns a raw value into the string shown next to its series name. */
  formatValue?: (value: string | number | undefined, entry: RtlTooltipEntry) => string;
  /** Turns the axis label into the tooltip heading. */
  formatLabel?: (label: string | number | undefined) => string;
  /** Overrides the series name, e.g. when the chart has a single unnamed series. */
  seriesName?: string;
}

/**
 * Recharts renders its charts inside a `direction: ltr` box so the axes lay out
 * the way the library expects. The tooltip is the one part a reader actually
 * reads, so it gets its own RTL wrapper.
 */
export const RtlTooltip: React.FC<RtlTooltipProps> = ({
  active,
  label,
  payload,
  formatValue,
  formatLabel,
  seriesName,
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      dir="rtl"
      className="rounded-tile border border-sunken bg-surface px-3 py-2 shadow-xs text-meta text-ink"
    >
      {label !== undefined && label !== '' && (
        <div className="font-bold mb-1">{formatLabel ? formatLabel(label) : String(label)}</div>
      )}
      <ul className="space-y-0.5">
        {payload.map((entry, index) => (
          <li key={index} className="flex items-center gap-2">
            {entry.color && (
              <span
                aria-hidden="true"
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
            )}
            <span className="text-ink/70">{seriesName ?? entry.name ?? ''}</span>
            <span className="font-bold">
              {formatValue ? formatValue(entry.value, entry) : toFa(String(entry.value ?? ''))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
