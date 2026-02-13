import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Circle, ChevronRight, X, Sparkles, Settings, ShoppingBag, Megaphone, Mail, BookOpen, Rocket } from 'lucide-react';
import { getStoredUser } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
  icon: any;
  path?: string;
  checkFn: () => boolean;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'account',
    labelEn: 'Create your account',
    labelAr: 'أنشئ حسابك',
    descEn: 'You\'re in! Welcome to Mubyn.',
    descAr: 'أهلاً بك في مبيّن!',
    icon: Check,
    checkFn: () => true, // Always done if they're logged in
  },
  {
    id: 'profile',
    labelEn: 'Set up business profile',
    labelAr: 'أعدّ ملف الشركة',
    descEn: 'Add your business name, industry & logo',
    descAr: 'أضف اسم شركتك، المجال والشعار',
    icon: Settings,
    path: '/app/settings',
    checkFn: () => {
      const user = getStoredUser();
      return !!(user?.business_name && user?.industry);
    },
  },
  {
    id: 'shopify',
    labelEn: 'Connect Shopify (optional)',
    labelAr: 'ربط Shopify (اختياري)',
    descEn: 'Sync products, orders & revenue data',
    descAr: 'مزامنة المنتجات، الطلبات والإيرادات',
    icon: ShoppingBag,
    path: '/app/settings',
    checkFn: () => {
      try {
        const shopify = localStorage.getItem('mubyn-shopify-connected');
        return shopify === 'true';
      } catch { return false; }
    },
  },
  {
    id: 'meta',
    labelEn: 'Connect Meta Ads (optional)',
    labelAr: 'ربط Meta Ads (اختياري)',
    descEn: 'Import campaigns & ad performance',
    descAr: 'استيراد الحملات وأداء الإعلانات',
    icon: Megaphone,
    path: '/app/settings',
    checkFn: () => {
      try {
        const meta = localStorage.getItem('mubyn-meta-connected');
        return meta === 'true';
      } catch { return false; }
    },
  },
  {
    id: 'email',
    labelEn: 'Set up email for outreach',
    labelAr: 'إعداد البريد للتواصل',
    descEn: 'Send personalized emails automatically',
    descAr: 'أرسل إيميلات مخصصة تلقائياً',
    icon: Mail,
    path: '/app/settings',
    checkFn: () => {
      try {
        const smtp = JSON.parse(localStorage.getItem('mubyn-smtp') || '{}');
        return !!smtp.email;
      } catch { return false; }
    },
  },
  {
    id: 'kb',
    labelEn: 'Add knowledge base',
    labelAr: 'أضف قاعدة المعرفة',
    descEn: 'Help your CS Agent answer questions',
    descAr: 'ساعد وكيل الدعم يجاوب على الأسئلة',
    icon: BookOpen,
    path: '/app/cs',
    checkFn: () => {
      try {
        const kb = localStorage.getItem('mubyn-kb-entries');
        if (!kb) return false;
        const parsed = JSON.parse(kb);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch { return false; }
    },
  },
];

export function OnboardingChecklist() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [dismissed, setDismissed] = useState(false);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check dismissal
    const wasDismissed = localStorage.getItem('mubyn-onboarding-dismissed') === 'true';
    setDismissed(wasDismissed);

    // Check completion status
    const completed = new Set<string>();
    CHECKLIST_ITEMS.forEach(item => {
      if (item.checkFn()) completed.add(item.id);
    });
    setCompletedItems(completed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('mubyn-onboarding-dismissed', 'true');
  };

  const handleItemClick = (item: ChecklistItem) => {
    if (item.path && !completedItems.has(item.id)) {
      navigate(item.path);
    }
  };

  // Don't show if dismissed or all required items complete
  const requiredComplete = completedItems.has('account') && completedItems.has('profile');
  if (dismissed) return null;

  const completedCount = completedItems.size;
  const totalCount = CHECKLIST_ITEMS.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="bg-gradient-to-br from-brand-card to-brand-card/80 border border-brand-gold/20 rounded-2xl p-5 mb-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-3xl" />
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">
              {lang === 'ar' ? 'ابدأ مع مبيّن' : 'Get Started with Mubyn'}
            </h3>
            <p className="text-brand-textMuted text-sm">
              {lang === 'ar' ? `${completedCount} من ${totalCount} مكتملة` : `${completedCount} of ${totalCount} complete`}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-brand-textMuted hover:text-white transition-colors p-1"
          title={lang === 'ar' ? 'إخفاء' : 'Dismiss'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-brand-border rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-gold to-brand-goldBright transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => {
          const isComplete = completedItems.has(item.id);
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={isComplete}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                isComplete
                  ? "bg-green-500/10 cursor-default"
                  : "bg-brand-dark/50 hover:bg-brand-dark cursor-pointer"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                isComplete
                  ? "bg-green-500/20 text-green-400"
                  : "bg-brand-gold/10 text-brand-gold group-hover:bg-brand-gold/20"
              )}>
                {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm truncate",
                  isComplete ? "text-green-400 line-through opacity-70" : "text-white"
                )}>
                  {lang === 'ar' ? item.labelAr : item.labelEn}
                </p>
                <p className="text-brand-textMuted text-xs truncate">
                  {lang === 'ar' ? item.descAr : item.descEn}
                </p>
              </div>
              {!isComplete && item.path && (
                <ChevronRight className="w-4 h-4 text-brand-textMuted group-hover:text-brand-gold transition-colors shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* All done message */}
      {completedCount === totalCount && (
        <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-green-400" />
          <p className="text-green-400 text-sm font-medium">
            {lang === 'ar' ? 'رائع! أنت جاهز للانطلاق 🚀' : 'Amazing! You\'re all set up 🚀'}
          </p>
        </div>
      )}
    </div>
  );
}
