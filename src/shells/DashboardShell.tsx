import React, { useState, ReactNode } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Building2,
  Users,
  BarChart3,
  Award,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  GraduationCap,
  Sliders,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { Avatar } from '../components/ui/Avatar';
import { authApi } from '../api/auth';

interface DashboardShellProps {
  children: ReactNode;
  title?: string;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ children, title }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useApp();

  const isAdmin = location.pathname.startsWith('/admin');
  const panelTitle = isAdmin ? 'پنل تیم گرا' : 'داشبورد سازمان';
  const displayTitle = title || panelTitle;

  const handleLogout = async () => {
    await authApi.logout();
    navigate('/login');
  };

  const navItems = isAdmin
    ? [
        { label: 'مدیریت محتوا و مسیرها', icon: GraduationCap, disabled: true },
        { label: 'سازمان‌های همکار', icon: Building2, disabled: true },
        { label: 'کاربران و اعتبارات', icon: Users, disabled: true },
        { label: 'گزارش‌های پیشرفته', icon: BarChart3, disabled: true },
        { label: 'تنظیمات سامانه گرا', icon: Sliders, disabled: true },
      ]
    : [
        { label: 'نمای کلی و خلاصه شاخص‌ها', icon: BarChart3, disabled: true },
        { label: 'تیم‌ها و همکاران', icon: Users, disabled: true },
        { label: 'گواهینامه‌های سازمانی', icon: Award, disabled: true },
        { label: 'مسیرهای اختصاصی سازمان', icon: GraduationCap, disabled: true },
        { label: 'تنظیمات سازمان', icon: Settings, disabled: true },
      ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface border-l border-sunken text-ink">
      {/* Logo Slot */}
      <div className="p-5 border-b border-sunken flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-tile bg-primary text-surface flex items-center justify-center font-black text-headline shadow-xs">
            گ
          </div>
          <div>
            <h2 className="text-title font-black leading-tight text-ink">گرابایت</h2>
            <p className="text-meta text-ink/60 font-medium">{panelTitle}</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setDrawerOpen(false)}
          className="lg:hidden min-h-[48px] min-w-[48px] p-2.5 rounded-tile text-ink/70 hover:bg-canvas hover:text-ink flex items-center justify-center cursor-pointer"
          aria-label="بستن منوی داشبورد"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Nav items list */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="min-h-[48px] w-full px-3 py-2.5 rounded-tile flex items-center justify-between text-meta font-bold transition-all text-ink/40 cursor-not-allowed bg-canvas/40 border border-transparent"
              title="به‌زودی در دسترس قرار می‌گیرد"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-ink/40" aria-hidden="true" />
                <span>{item.label}</span>
              </div>
              <span className="text-meta font-normal text-ink/40">به‌زودی</span>
            </div>
          );
        })}
      </nav>

      {/* User Menu at Bottom */}
      <div className="p-4 border-t border-sunken bg-paper/50">
        <div className="flex items-center gap-3 mb-3">
          <Avatar seed={user.avatarSeed} name={user.fullName} size="sm" />
          <div className="flex-1 min-w-0">
            <h4 className="text-meta font-bold text-ink truncate">{user.fullName}</h4>
            <p className="text-meta text-ink/60 truncate">
              {isAdmin ? 'مدیر سیستم گرا' : user.membership?.orgName || 'همکار سازمانی'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="flex-1 min-h-[48px] px-3 py-2 rounded-tile bg-canvas hover:bg-sunken text-ink text-meta font-bold flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <span>نمای یادگیرنده</span>
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </Link>

          <button
            onClick={handleLogout}
            className="min-h-[48px] min-w-[48px] p-2.5 rounded-tile bg-canvas hover:bg-domain-2-tint text-danger hover:border-danger/30 flex items-center justify-center transition-all cursor-pointer"
            aria-label="خروج از حساب کاربری"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink flex selection:bg-primary selection:text-white">
      {/* Desktop Persistent Sidebar (264px) */}
      <aside className="hidden lg:block w-[264px] shrink-0 min-h-screen sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="lg:hidden fixed inset-0 bg-ink/40 z-40 backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 right-0 z-50 w-[264px] transform transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-surface border-b border-sunken sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between safe-top">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden min-h-[48px] min-w-[48px] p-2 rounded-tile text-ink hover:bg-canvas flex items-center justify-center cursor-pointer"
              aria-label="باز کردن منوی سایدبار"
            >
              <Menu className="w-6 h-6" aria-hidden="true" />
            </button>
            <h1 className="text-headline font-black text-ink">{displayTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-pill bg-canvas border border-sunken">
              <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
              <span className="text-meta font-bold text-ink/80">
                {isAdmin ? 'دسترسی ادمین ارشد' : 'دسترسی سازمانی فعال'}
              </span>
            </div>
            <Avatar seed={user.avatarSeed} name={user.fullName} size="sm" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1280px] w-full mx-auto safe-bottom">
          {children}
        </main>
      </div>
    </div>
  );
};
