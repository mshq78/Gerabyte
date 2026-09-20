import React, { ReactNode, useId, useState } from 'react';
import { BarChart3, Table2 } from 'lucide-react';

export interface ChartTableData {
  columns: string[];
  rows: ReactNode[][];
}

interface ChartFrameProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  /** The same numbers the chart shows, for the «جدول» view. */
  table: ChartTableData;
  /** Height utility for the chart box, e.g. "h-64". */
  heightClass?: string;
  children: ReactNode;
}

/**
 * Wraps a chart with its heading and a «نمودار / جدول» switch, so every chart
 * has a readable, screen-reader-friendly equivalent. The chart itself sits in a
 * `dir="ltr"` box because Recharts lays its axes out left-to-right; the table
 * and all the surrounding copy stay RTL.
 */
export const ChartFrame: React.FC<ChartFrameProps> = ({
  title,
  subtitle,
  badge,
  table,
  heightClass = 'h-64',
  children,
}) => {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const regionId = useId();

  const toggle = (target: 'chart' | 'table', label: string, Icon: typeof BarChart3) => (
    <button
      type="button"
      onClick={() => setView(target)}
      aria-pressed={view === target}
      aria-controls={regionId}
      className={`min-h-[44px] min-w-[44px] px-3 rounded-pill text-meta font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
        view === target ? 'bg-primary text-surface shadow-xs' : 'text-ink/70 hover:text-ink'
      }`}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="p-6 rounded-tile bg-surface border border-sunken shadow-xs flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-headline font-black text-ink">{title}</h3>
          {subtitle && <p className="text-meta text-ink/60">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {badge}
          <div className="print:hidden flex items-center p-0.5 rounded-pill bg-canvas border border-sunken">
            {toggle('chart', 'نمودار', BarChart3)}
            {toggle('table', 'جدول', Table2)}
          </div>
        </div>
      </div>

      <div id={regionId}>
        {view === 'chart' ? (
          <div className={`${heightClass} w-full`} dir="ltr">
            {children}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-meta">
              <thead>
                <tr className="border-b border-sunken text-ink/60">
                  {table.columns.map((column) => (
                    <th key={column} scope="col" className="py-2 px-3 font-bold whitespace-nowrap">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-sunken/60 last:border-0">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="py-2 px-3 text-ink">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
