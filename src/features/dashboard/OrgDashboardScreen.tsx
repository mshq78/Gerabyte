import React from 'react';
import { Building2, Sparkles } from 'lucide-react';

export const OrgDashboardScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-surface rounded-tile border border-sunken">
      <div className="w-16 h-16 rounded-tile bg-domain-1-tint text-primary flex items-center justify-center mb-4 shadow-xs">
        <Building2 className="w-8 h-8" aria-hidden="true" />
      </div>
      <h2 className="text-headline font-black text-ink mb-2">داشبورد سازمان</h2>
      <p className="text-body text-ink/70 max-w-md">
        این بخش برای مدیران منابع انسانی و آموزش سازمان‌ها طراحی شده است و به‌زودی در نسخه‌های آتی فعال خواهد شد.
      </p>
    </div>
  );
};
