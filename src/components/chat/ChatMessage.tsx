import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'caesar';
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  let user: Record<string, string> = {};
  try { user = JSON.parse(localStorage.getItem('mubyn-user') || '{}'); } catch { /* ignore */ }

  return (
    <div
      className={cn(
        "flex gap-3 mb-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser
            ? "bg-brand-gold/20 border border-brand-gold/30"
            : "bg-brand-gold border border-brand-gold"
        )}
      >
        {isUser ? (
          <span className="text-brand-gold font-semibold text-sm">
            {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </span>
        ) : (
          <span className="text-sm">⚔️</span>
        )}
      </div>

      <div
        className={cn(
          "max-w-[70%] rounded-2xl p-4",
          isUser
            ? "bg-brand-gold/10 border border-brand-gold/20"
            : "bg-brand-card border border-brand-border"
        )}
      >
        <p className="text-brand-text whitespace-pre-wrap">{message.content}</p>
        <div className="mt-2 text-xs text-brand-textMuted">
          {message.timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
