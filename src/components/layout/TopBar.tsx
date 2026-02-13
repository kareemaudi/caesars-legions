import { Bell, User, LogOut, Languages } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/i18n';

export function TopBar() {
  let user: Record<string, string> = {};
  try { user = JSON.parse(localStorage.getItem('mubyn-user') || '{}'); } catch { /* ignore */ }

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { lang, setLang, t, isRTL } = useLang();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('mubyn-user');
    localStorage.removeItem('mubyn-chat-history');
    navigate('/login');
  };

  const toggleLang = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  const displayName = user.name || user.email?.split('@')[0] || 'User';
  const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();

  return (
    <header className="h-14 bg-brand-darker border-b border-brand-border px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-brand-gold to-brand-goldBright bg-clip-text text-transparent">
            Mubyn
          </span>
          <span className="text-brand-textMuted text-xl mx-2">•</span>
          <span className="text-brand-textMuted text-lg">مبين</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Toggle */}
        <button
          onClick={toggleLang}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
            "border border-brand-border hover:border-brand-gold/40",
            "text-brand-textMuted hover:text-white"
          )}
          aria-label="Toggle language"
          title={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
        >
          <Languages className="w-4 h-4" />
          <span className="hidden sm:inline">
            {lang === 'ar' ? 'EN' : 'العربية'}
          </span>
        </button>

        <button
          className={cn(
            "p-2 rounded-lg hover:bg-white/5 transition-colors relative",
            "text-brand-textMuted hover:text-white"
          )}
          aria-label={t('topbar.notifications')}
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={cn(
              "flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors",
              isRTL ? 'pl-3' : 'pr-3',
              "text-brand-textMuted hover:text-white"
            )}
            aria-label="User menu"
          >
            <div className="w-7 h-7 rounded-full bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center">
              <span className="text-brand-gold font-semibold text-xs">{initial}</span>
            </div>
            <span className="text-sm text-brand-textMuted hidden sm:block">{displayName}</span>
          </button>

          {showMenu && (
            <div className={cn(
              "absolute top-full mt-2 w-48 bg-brand-card border border-brand-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95",
              isRTL ? 'left-0' : 'right-0'
            )}>
              <div className="px-4 py-3 border-b border-brand-border">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-brand-textMuted truncate">{user.email || ''}</p>
              </div>
              <button
                onClick={() => { setShowMenu(false); navigate('/app/settings'); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-brand-textMuted hover:text-white hover:bg-white/5 transition-colors"
              >
                <User className="w-4 h-4" />
                {t('topbar.settings')}
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('topbar.signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
