import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const AdminDashboardScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-surface rounded-tile border border-sunken">
      <div className="w-16 h-16 rounded-tile bg-domain-4-tint text-domain-4 flex items-center justify-center mb-4 shadow-xs">
        <ShieldCheck className="w-8 h-8" aria-hidden="true" />
      </div>
      <h2 className="text-headline font-black text-ink mb-2">پنل تیم گرا</h2>
      <p className="text-body text-ink/70 max-w-md">
        این بخش برای تیم توسعه محتوا، پشتیبانی و مدیران ارشد پردیس نوآوری گرا طراحی شده است و به‌زودی فعال خواهد شد.
      </p>
    </div>
  );
};
