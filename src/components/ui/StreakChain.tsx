import React from 'react';
import { toFa } from '../../lib/toFa';

interface StreakChainProps {
  count: number;
  isActiveToday?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const StreakChain: React.FC<StreakChainProps> = ({
  count,
  isActiveToday = true,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const isZero = count === 0;

  const chainColor = isZero ? '#9CA3AF' : isActiveToday ? '#F2A93B' : '#E58A1F';
  const badgeBg = isZero ? 'bg-gray-100' : 'bg-[#FEF6EC] border border-[#F2A93B]/30';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl ${badgeBg} ${className}`}
      title={`زنجیره یادگیری: ${toFa(count)} روز متوالی`}
      role="status"
      aria-label={`زنجیره یادگیری: ${toFa(count)} روز متوالی`}
    >
      {/* Linked squares chain icon */}
      <svg
        width={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
        height={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Square link 1 */}
        <rect
          x="3"
          y="7"
          width="9"
          height="9"
          rx="2"
          stroke={chainColor}
          strokeWidth="2.2"
          fill={isZero ? 'none' : chainColor}
          fillOpacity={isZero ? 0 : 0.25}
        />
        {/* Interlocking Link Square 2 */}
        <rect
          x="10"
          y="9"
          width="11"
          height="11"
          rx="2.5"
          stroke={chainColor}
          strokeWidth="2.2"
          fill={isZero ? 'none' : chainColor}
          fillOpacity={isZero ? 0 : 0.8}
        />
        {/* Center Interlock Dot */}
        <circle cx="11" cy="11" r="1.2" fill={isZero ? '#9CA3AF' : '#0D3F6B'} />
      </svg>

      <span className="font-bold text-sm tracking-tight text-[#0D3F6B]">
        {toFa(count)}
      </span>

      {showLabel && (
        <span className="text-xs text-[#0D3F6B]/70 font-medium">
          روز زنجیره
        </span>
      )}
    </div>
  );
};
