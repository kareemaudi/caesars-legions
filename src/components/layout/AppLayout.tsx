import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { StatusBar } from './StatusBar';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { getStoredUser } from '@/lib/api';
import { useLang } from '@/lib/i18n';

// Demo mode removed

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Demo mode removed
  const user = getStoredUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { isRTL } = useLang();

  // Demo mode removed

  // Redirect to login if no user
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Demo mode removed */}
      <TopBar />
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden fixed bottom-16 z-50 w-12 h-12 rounded-full bg-brand-gold text-black shadow-lg shadow-brand-gold/30 flex items-center justify-center ${
            isRTL ? 'right-4' : 'left-4'
          }`}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          md:relative md:block
          ${mobileOpen
            ? `fixed inset-y-0 z-40 block ${isRTL ? 'right-0' : 'left-0'}`
            : 'hidden md:block'}
        `}>
          <Sidebar />
        </div>

        {/* Main content with page transition */}
        <main
          key={location.pathname}
          className="flex-1 overflow-auto animate-fadeIn"
        >
          <Outlet />
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
