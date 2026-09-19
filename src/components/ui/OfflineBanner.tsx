import React from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC<{ isOffline: boolean }> = ({ isOffline }) => {
  if (!isOffline) return null;

  return (
    <div
      className="bg-[#D5483F] text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 sticky top-0 z-40 shadow-sm"
      role="alert"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>ارتباط اینترنتی برقرار نیست؛ اطلاعات ذخیره‌شده محلی نمایش داده می‌شود.</span>
    </div>
  );
};
