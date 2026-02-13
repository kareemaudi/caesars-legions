import { NavLink } from 'react-router-dom';
import {
  MessageSquare,
  Users,
  Headphones,
  TrendingUp,
  DollarSign,
  Globe,
  Settings,
  Mail,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useLang } from '@/lib/i18n';

const navItems = [
  { path: '/app/chat', icon: MessageSquare, labelKey: 'nav.caesar' },
  { path: '/app/leads', icon: Users, labelKey: 'nav.leads' },
  { path: '/app/cmo', icon: TrendingUp, labelKey: 'nav.cmo' },
  { path: '/app/cs', icon: Headphones, labelKey: 'nav.cs' },
  { path: '/app/cfo', icon: DollarSign, labelKey: 'nav.cfo' },
  { path: '/app/website', icon: Globe, labelKey: 'nav.website' },
  { path: '/app/agents', icon: Bot, labelKey: 'nav.agents', isNew: true },
  { path: '/app/settings', icon: Settings, labelKey: 'nav.settings' },
];

function getUserInitials(): string {
  try {
    const user = JSON.parse(localStorage.getItem('mubyn-user') || '{}');
    if (user.email) return user.email.charAt(0).toUpperCase();
    if (user.name) return user.name.charAt(0).toUpperCase();
  } catch { /* ignore */ }
  return 'U';
}

export function Sidebar() {
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile on mount and resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  // On mobile, always show expanded. On desktop, expand on hover.
  const expanded = isMobile || hovered;
  const { t, isRTL, lang } = useLang();

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'h-full bg-brand-darker flex flex-col transition-all duration-200 ease-in-out overflow-hidden',
        isRTL ? 'border-l border-brand-border' : 'border-r border-brand-border',
        expanded ? 'w-[240px]' : 'w-[64px]'
      )}
    >
      {/* Logo */}
      <div className="px-3 py-5 border-b border-brand-border flex items-center gap-3 min-h-[72px]">
        <img
          src={isRTL ? '/mubyn-logo-ar.png' : '/mubyn-logo-en.png'}
          alt="Mubyn"
          className="w-10 h-10 rounded-lg shrink-0 object-contain p-1"
        />
        <span
          className={cn(
            'text-sm text-brand-textMuted font-medium whitespace-nowrap transition-opacity duration-200',
            expanded ? 'opacity-100' : 'opacity-0'
          )}
        >
          {t('sidebar.os')}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              {(item as any).comingSoon ? (
                <div
                  className={cn(
                    'flex items-center gap-3 py-3 text-brand-textMuted/30 cursor-default relative',
                    expanded ? 'px-4' : 'px-0 justify-center',
                  )}
                  title="Coming Soon"
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span
                    className={cn(
                      'font-medium text-sm whitespace-nowrap transition-opacity duration-200',
                      expanded ? 'opacity-100' : 'opacity-0 w-0'
                    )}
                  >
                    {t(item.labelKey)}
                  </span>
                  {expanded && <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold/60 border border-brand-gold/20">Soon</span>}
                </div>
              ) : (
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 py-3 text-brand-textMuted/60 hover:text-brand-textMuted hover:bg-white/5 transition-colors relative',
                    expanded ? 'px-4' : 'px-0 justify-center',
                    isActive && [
                      'text-brand-gold hover:text-brand-gold bg-brand-gold/5',
                      // Gold border indicator (left for LTR, right for RTL)
                      isRTL
                        ? 'before:absolute before:right-0 before:top-1 before:bottom-1 before:w-[3px] before:bg-brand-gold before:rounded-l-sm'
                        : 'before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:bg-brand-gold before:rounded-r-sm',
                    ]
                  )
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span
                  className={cn(
                    'font-medium text-sm whitespace-nowrap transition-opacity duration-200',
                    expanded ? 'opacity-100' : 'opacity-0 w-0'
                  )}
                >
                  {t(item.labelKey)}
                </span>
                {expanded && (item as any).isNew && (
                  <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand-gold text-brand-darker leading-none tracking-wide">NEW</span>
                )}
              </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* User Avatar at bottom */}
      <div className="border-t border-brand-border p-3">
        <div
          className={cn(
            'flex items-center gap-3',
            expanded ? '' : 'justify-center'
          )}
        >
          <div className="w-9 h-9 rounded-full bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center shrink-0">
            <span className="text-brand-gold font-semibold text-sm">
              {getUserInitials()}
            </span>
          </div>
          {expanded && (
            <div className="min-w-0 transition-opacity duration-200">
              <p className="text-xs text-white font-medium truncate">
                {(() => {
                  try {
                    const user = JSON.parse(localStorage.getItem('mubyn-user') || '{}');
                    return user.business_name || user.email || 'User';
                  } catch {
                    return 'User';
                  }
                })()}
              </p>
              <p className="text-xs text-brand-textMuted truncate">{t('sidebar.freePlan')}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
