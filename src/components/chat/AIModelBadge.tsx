import { useLang } from '@/lib/i18n';

/**
 * Detects whether a text string contains Arabic characters.
 */
function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

type ModelMode = 'auto' | 'falcon' | 'gpt4o';

function getModelPreference(): ModelMode {
  try {
    const pref = localStorage.getItem('mubyn-ai-model');
    if (pref === 'falcon' || pref === 'gpt4o') return pref;
  } catch { /* ignore */ }
  return 'auto';
}

interface AIModelBadgeProps {
  /** The latest user message (used for auto-detection) */
  lastUserMessage?: string;
}

export function AIModelBadge({ lastUserMessage }: AIModelBadgeProps) {
  const { lang } = useLang();
  const pref = getModelPreference();

  // Determine which model to show
  let showFalcon = false;
  if (pref === 'falcon') {
    showFalcon = true;
  } else if (pref === 'gpt4o') {
    showFalcon = false;
  } else {
    // Auto-detect: Arabic UI language OR Arabic in last message
    showFalcon = lang === 'ar' || (lastUserMessage ? hasArabic(lastUserMessage) : false);
  }

  if (showFalcon) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F1B2D] border border-[#D4A843]/30 transition-all duration-300">
        <span className="text-xs leading-none">🇦🇪</span>
        <span className="text-[11px] font-semibold text-[#D4A843] tracking-wide">
          Falcon 3
        </span>
        <span className="text-[10px] text-[#8899B0]">·</span>
        <span className="text-[10px] text-[#8899B0] font-medium">
          Arabic-Native AI
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F1B2D] border border-brand-border/60 transition-all duration-300">
      <span className="text-[11px] font-semibold text-white/80 tracking-wide">
        GPT-4o
      </span>
      <span className="text-[10px] text-[#8899B0]">·</span>
      <span className="text-[10px] text-[#8899B0] font-medium">
        OpenAI
      </span>
    </div>
  );
}
