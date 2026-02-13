import { Bot, Lock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/i18n';

interface Agent {
  emoji: string;
  nameKey: string;
  descKey: string;
  badge: 'BETA' | 'COMING Q2';
}

const agents: Agent[] = [
  {
    emoji: '🎯',
    nameKey: 'agents.leadHunter',
    descKey: 'agents.leadHunterDesc',
    badge: 'BETA',
  },
  {
    emoji: '📧',
    nameKey: 'agents.outreach',
    descKey: 'agents.outreachDesc',
    badge: 'BETA',
  },
  {
    emoji: '📱',
    nameKey: 'agents.cs',
    descKey: 'agents.csDesc',
    badge: 'BETA',
  },
  {
    emoji: '📊',
    nameKey: 'agents.analytics',
    descKey: 'agents.analyticsDesc',
    badge: 'COMING Q2',
  },
  {
    emoji: '✍️',
    nameKey: 'agents.content',
    descKey: 'agents.contentDesc',
    badge: 'BETA',
  },
  {
    emoji: '🌐',
    nameKey: 'agents.website',
    descKey: 'agents.websiteDesc',
    badge: 'COMING Q2',
  },
];

export function AgentsView() {
  const { t } = useLang();

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-text">{t('agents.title')}</h1>
            <p className="text-sm text-brand-textMuted">{t('agents.subtitle')}</p>
          </div>
        </div>
        {/* Powered by OpenClaw */}
        <div className="flex items-center gap-1.5 pt-1">
          <Zap className="w-3.5 h-3.5 text-brand-textMuted/50" />
          <span className="text-xs text-brand-textMuted/50">{t('agents.poweredBy')}</span>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent) => {
          const isComingSoon = agent.badge === 'COMING Q2';

          return (
            <div
              key={agent.nameKey}
              className={cn(
                'relative group rounded-xl border bg-brand-card p-5 transition-all duration-300',
                isComingSoon
                  ? 'border-brand-border/50 opacity-70 cursor-default'
                  : 'border-brand-border hover:border-brand-gold/40 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(212,168,67,0.08)] cursor-pointer'
              )}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                {isComingSoon ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-border/60 text-brand-textMuted/60 border border-brand-border">
                    {agent.badge}
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/25 shadow-[0_0_8px_rgba(212,168,67,0.15)]">
                    BETA
                  </span>
                )}
              </div>

              {/* Lock overlay for Coming Soon */}
              {isComingSoon && (
                <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-brand-darker/20 z-10">
                  <div className="w-10 h-10 rounded-full bg-brand-darker/60 border border-brand-border flex items-center justify-center">
                    <Lock className="w-4 h-4 text-brand-textMuted/40" />
                  </div>
                </div>
              )}

              {/* Card Content */}
              <div className="flex items-start gap-4">
                <div className="text-3xl shrink-0 mt-0.5">{agent.emoji}</div>
                <div className="min-w-0 pr-16">
                  <h3 className="text-base font-semibold text-brand-text mb-1">
                    {t(agent.nameKey)}
                  </h3>
                  <p className="text-sm text-brand-textMuted leading-relaxed">
                    {t(agent.descKey)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Callout */}
      <div className="border-l-2 border-brand-gold/60 bg-brand-card/50 rounded-r-lg px-5 py-4">
        <p className="text-sm text-brand-textMuted leading-relaxed italic">
          {t('agents.callout')}
        </p>
      </div>
    </div>
  );
}
