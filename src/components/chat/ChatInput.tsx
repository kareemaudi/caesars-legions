import { Send } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { AIModelBadge } from './AIModelBadge';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  lastUserMessage?: string;
}

export function ChatInput({ onSend, disabled, lastUserMessage }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-brand-border bg-brand-dark">
      <div className="flex items-center justify-center mb-2">
        <AIModelBadge lastUserMessage={lastUserMessage} />
      </div>
      <div className="flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اسأل قيصر أي سؤال... Ask Caesar anything..."
          disabled={disabled}
          className={cn(
            "flex-1 bg-brand-card border border-brand-border rounded-xl px-4 py-3",
            "text-brand-text placeholder:text-brand-textMuted",
            "focus:outline-none focus:ring-2 focus:ring-brand-gold/50",
            "resize-none min-h-[52px] max-h-[200px]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className={cn(
            "px-4 py-3 rounded-xl font-semibold transition-all",
            "bg-gradient-to-r from-brand-gold to-brand-goldBright",
            "text-black hover:shadow-lg hover:shadow-brand-gold/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center justify-center"
          )}
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
