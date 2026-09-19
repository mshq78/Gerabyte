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
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E1D5] max-w-[480px] mx-auto pb-safe shadow-[0_-4px_12px_rgba(13,63,107,0.04)]"
      role="navigation"
      aria-label="منوی اصلی ناوبری"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-semibold select-none transition-all duration-150 ${
                isActive
                  ? 'text-[#1E6FA8]'
                  : 'text-[#0D3F6B]/60 hover:text-[#0D3F6B]'
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
                    />
                    {item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#D5483F] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                        {toFa(item.badge)}
                      </span>
                    )}
                  </div>
                  <span className={`mt-1 tracking-tight text-[11px] ${isActive ? 'font-bold' : 'font-normal'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-1 w-8 h-1 rounded-full bg-[#1E6FA8]" />
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
