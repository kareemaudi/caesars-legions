import { useLang } from '@/lib/i18n';

export function StatusBar() {
  const { t } = useLang();
  
  return (
    <footer className="h-8 bg-brand-darker border-t border-brand-border px-6 flex items-center justify-between text-xs text-brand-textMuted">
      <div>{t('status.version')}</div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span>{t('status.powered')}</span>
      </div>
    </footer>
  );
}
