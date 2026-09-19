import React from 'react';

interface AvatarProps {
  seed?: string;
  name?: string;
  size?: number | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  seed,
  name,
  size = 44,
  className = '',
}) => {
  const seedString = seed || name || 'GeraByte';

  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 36
      : size === 'lg'
      ? 56
      : 44;

  // Simple hash function for deterministic colors & shapes
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 45) % 360;
  const bgColor = `hsl(${hue1}, 55%, 38%)`;
  const accentColor = `hsl(${hue2}, 70%, 75%)`;

  // Pattern shapes
  const shapeType = Math.abs(hash) % 4;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-tile overflow-hidden border-2 border-surface shadow-xs ${className}`}
      style={{ width: pixelSize, height: pixelSize, backgroundColor: bgColor }}
      aria-hidden="true"
    >
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Abstract geometric human silhouette */}
        <circle cx="22" cy="16" r="8" fill={accentColor} />
        {shapeType === 0 && (
          <rect x="8" y="28" width="28" height="18" rx="8" fill="var(--color-surface)" fillOpacity={0.85} />
        )}
        {shapeType === 1 && (
          <circle cx="22" cy="36" r="14" fill="var(--color-surface)" fillOpacity={0.85} />
        )}
        {shapeType === 2 && (
          <path
            d="M9 40 C9 30, 35 30, 35 40 Z"
            fill="var(--color-surface)"
            fillOpacity={0.85}
          />
        )}
        {shapeType === 3 && (
          <rect x="10" y="27" width="24" height="20" rx="6" fill="var(--color-surface)" fillOpacity={0.9} />
        )}
      </svg>
    </div>
  );
};
