import React from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC<{ isOffline: boolean }> = ({ isOffline }) => {
  if (!isOffline) return null;

  return (
    <div
      className="bg-danger text-surface px-4 py-2 text-meta font-semibold flex items-center justify-center gap-2 sticky top-0 z-40 shadow-xs"
      role="alert"
    >
      <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>ارتباط اینترنتی برقرار نیست؛ اطلاعات ذخیره‌شده محلی نمایش داده می‌شود.</span>
    </div>
  );
};
