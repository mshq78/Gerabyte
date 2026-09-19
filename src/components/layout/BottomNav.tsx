import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Trophy, Gift, User as UserIcon } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { toFa } from '../../lib/toFa';

export const BottomNav: React.FC = () => {
  const { unreadNotifsCount } = useApp();

  const navItems = [
    { to: '/', label: 'خانه', icon: Home, badge: 0 },
    { to: '/path', label: 'مسیر', icon: Compass, badge: 0 },
    { to: '/league', label: 'لیگ', icon: Trophy, badge: 0 },
    { to: '/rewards', label: 'جوایز', icon: Gift, badge: 0 },
    { to: '/profile', label: 'پروفایل', icon: UserIcon, badge: unreadNotifsCount },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-sunken max-w-[480px] mx-auto safe-bottom shadow-[0_-4px_12px_rgba(13,63,107,0.04)]"
      role="navigation"
      aria-label="منوی اصلی ناوبری"
    >
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 text-meta font-semibold select-none transition-all duration-150 ${
                isActive
                  ? 'text-primary'
                  : 'text-ink/60 hover:text-ink'
              }`
            }
          >
            {({ isActive }) => {
              const Icon = item.icon;
              return (
                <>
                  <div className="relative">
                    <Icon
                      className={`w-6 h-6 transition-transform ${
                        isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[2]'
                      }`}
                      aria-hidden="true"
                    />
                    {item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[18px] h-4 px-1 rounded-pill bg-danger text-surface text-meta font-bold flex items-center justify-center leading-none">
                        {toFa(item.badge)}
                      </span>
                    )}
                  </div>
                  <span className={`mt-0.5 tracking-tight text-meta whitespace-nowrap ${isActive ? 'font-bold' : 'font-normal'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-1 w-8 h-1 rounded-pill bg-primary" />
                  )}
                </>
              );
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
