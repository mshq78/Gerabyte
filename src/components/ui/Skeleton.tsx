import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-[#E8E1D5] rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
};

export const LessonCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-12 h-4" />
      </div>
      <Skeleton className="w-3/4 h-6" />
      <Skeleton className="w-full h-16" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="w-28 h-8 rounded-lg" />
        <Skeleton className="w-20 h-8 rounded-lg" />
      </div>
    </div>
  );
};
