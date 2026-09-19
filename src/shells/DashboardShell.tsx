import React, { useState, ReactNode } from 'react';
import { useLocation, Link, useNavigate, Outlet } from 'react-router-dom';
import {
  Menu,
  X,
  Building2,
  Users,
  BarChart3,
  Award,
  Settings,
  LogOut,
  ChevronLeft,
  GraduationCap,
  Sliders,
  Shield,
  Filter,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { Avatar } from '../components/ui/Avatar';
import { authApi } from '../api/auth';
import { ScopeProvider, useOrgScope } from '../features/org/context/ScopeContext';
import { OrgRole } from '../types/org';
import { toFa } from '../lib/format';

interface DashboardShellInnerProps {
  children?: ReactNode;
  title?: string;
}

const DashboardShellInner: React.FC<DashboardShellInnerProps> = ({ children, title }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useApp();
  const { currentOrg, userRole, setUserRole, selectedUnitId, setSelectedUnitId, units, canManageAllUnits } =
    useOrgScope();

  const isAdmin = location.pathname.startsWith('/admin');
  const panelTitle = isAdmin ? 'پنل تیم گرا' : 'داشبورد سازمان';
  const displayTitle = title || panelTitle;

  const handleLogout = async () => {
    await authApi.logout();
    navigate('/login');
  };

  const navItems = isAdmin
    ? [
        { path: '/admin', label: 'مدیریت محتوا و سامانه', icon: Sliders },
        { path: '/org/overview', label: 'داشبورد سازمانی', icon: Building2 },
      ]
    : [
        { path: '/org/overview', label: 'نمای کلی و شاخص‌ها', icon: BarChart3 },
        { path: '/org/people', label: 'همکاران و مدیریت دسترسی', icon: Users },
        { path: '/org/assignments', label: 'مأموریت‌ها و مسیرها', icon: GraduationCap },
        { path: '/org/reports', label: 'گزارش‌های تحلیلی و چاپ', icon: Award },
      ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface border-l border-sunken text-ink">
      {/* Logo Slot */}
      <div className="p-5 border-b border-sunken flex items-center justify-between">
        <Link to="/org/overview" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-tile bg-primary text-white flex items-center justify-center font-black text-headline shadow-xs">
            گ
          </div>
          <div>
            <h2 className="text-title font-black leading-tight text-ink">گرابایت</h2>
            <p className="text-meta text-ink/60 font-medium">{panelTitle}</p>
          </div>
        </Link>

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
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/org/overview' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={idx}
              to={item.path}
              onClick={() => setDrawerOpen(false)}
              className={`min-h-[48px] w-full px-3 py-2.5 rounded-tile flex items-center justify-between text-meta font-bold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-ink/80 hover:bg-canvas hover:text-ink'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-ink/60'}`} aria-hidden="true" />
                <span>{item.label}</span>
              </div>
              <ChevronLeft className={`w-4 h-4 ${isActive ? 'text-white/80' : 'text-ink/40'}`} />
            </Link>
          );
        })}
      </nav>

      {/* User Menu at Bottom */}
      <div className="p-4 border-t border-sunken bg-canvas/30 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar seed={user.avatarSeed} name={user.fullName} size="sm" />
          <div className="flex-1 min-w-0">
            <h4 className="text-meta font-bold text-ink truncate">{user.fullName}</h4>
            <p className="text-meta text-ink/60 truncate">
              {userRole === 'org_admin' ? 'مدیر ارشد سازمان' : 'مدیر واحد (شیفت)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="flex-1 min-h-[48px] px-3 py-2 rounded-tile bg-canvas hover:bg-sunken border border-sunken text-ink text-meta font-bold flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <span>نمای یادگیرنده</span>
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </Link>

          <button
            onClick={handleLogout}
            className="min-h-[48px] min-w-[48px] p-2.5 rounded-tile bg-canvas hover:bg-domain-2-tint text-danger border border-sunken hover:border-danger/30 flex items-center justify-center transition-all cursor-pointer"
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
      {/* Desktop Persistent Sidebar (264px) - hidden when printing */}
      <aside className="print:hidden hidden lg:block w-[264px] shrink-0 min-h-screen sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="print:hidden lg:hidden fixed inset-0 bg-ink/40 z-40 backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`print:hidden lg:hidden fixed inset-y-0 right-0 z-50 w-[264px] transform transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header & Scope Controls (hidden when printing) */}
        <header className="print:hidden bg-surface border-b border-sunken sticky top-0 z-20 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4 safe-top shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden min-h-[48px] min-w-[48px] p-2 rounded-tile text-ink hover:bg-canvas flex items-center justify-center cursor-pointer"
              aria-label="باز کردن منوی سایدبار"
            >
              <Menu className="w-6 h-6" aria-hidden="true" />
            </button>
            <div>
              <h1 className="text-headline font-black text-ink">{displayTitle}</h1>
              <span className="text-meta text-ink/60 font-medium hidden sm:inline">{currentOrg.name}</span>
            </div>
          </div>

          {/* Scope Controls & Role Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Unit filter dropdown for org_admin */}
            {canManageAllUnits ? (
              <div className="flex items-center gap-2 bg-canvas px-3 py-1.5 rounded-tile border border-sunken">
                <Filter className="w-4 h-4 text-ink/40" />
                <span className="text-meta font-bold text-ink/60">واحد:</span>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="text-meta font-bold text-ink bg-transparent focus:outline-none cursor-pointer"
                  aria-label="فیلتر واحد سازمانی"
                >
                  <option value="all">تمام واحدهای سازمان</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-tile bg-canvas border border-sunken text-meta font-bold text-ink">
                <span>واحد نورد گرم (شیفت)</span>
              </div>
            )}

            {/* Quick Role Switcher Pill */}
            <div className="flex items-center p-0.5 rounded-pill bg-canvas border border-sunken">
              <button
                onClick={() => setUserRole('org_admin')}
                className={`min-h-[36px] px-3 rounded-pill text-meta font-bold transition-all cursor-pointer ${
                  userRole === 'org_admin'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-ink/60 hover:text-ink'
                }`}
                title="مشاهده داشبورد با دسترسی مدیر ارشد سازمان"
              >
                مدیر ارشد
              </button>
              <button
                onClick={() => setUserRole('unit_manager')}
                className={`min-h-[36px] px-3 rounded-pill text-meta font-bold transition-all cursor-pointer ${
                  userRole === 'unit_manager'
                    ? 'bg-secondary text-white shadow-xs'
                    : 'text-ink/60 hover:text-ink'
                }`}
                title="مشاهده داشبورد با دسترسی مدیر واحد"
              >
                مدیر واحد
              </button>
            </div>

            <Avatar seed={user.avatarSeed} name={user.fullName} size="sm" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1280px] w-full mx-auto safe-bottom">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export const DashboardShell: React.FC<DashboardShellProps> = ({ children, title }) => {
  return (
    <ScopeProvider>
      <DashboardShellInner title={title}>{children}</DashboardShellInner>
    </ScopeProvider>
  );
};

interface DashboardShellProps {
  children?: ReactNode;
  title?: string;
}
