import { Loader2 } from 'lucide-react';

interface ToolIndicatorProps {
  tool: string;
}

export function ToolIndicator({ tool }: ToolIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-brand-textMuted text-sm mb-4">
      <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
      <span>{tool}</span>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-brand-gold border border-brand-gold flex items-center justify-center flex-shrink-0">
        <span className="text-sm">⚔️</span>
      </div>
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
        <div className="typing-indicator flex gap-1">
          <span className="w-2 h-2 bg-brand-textMuted rounded-full"></span>
          <span className="w-2 h-2 bg-brand-textMuted rounded-full"></span>
          <span className="w-2 h-2 bg-brand-textMuted rounded-full"></span>
        </div>
      </div>
    </div>
  );
}
