import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-sunken rounded-tile ${className}`}
      aria-hidden="true"
    />
  );
};

export const LessonCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-tile bg-surface border border-sunken space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-12 h-4" />
      </div>
      <Skeleton className="w-3/4 h-6" />
      <Skeleton className="w-full h-16" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="w-28 h-8 rounded-tile" />
        <Skeleton className="w-20 h-8 rounded-tile" />
      </div>
    </div>
  );
};
