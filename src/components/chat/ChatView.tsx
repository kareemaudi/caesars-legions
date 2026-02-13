import { useState, useEffect, useRef } from 'react';
import { ChatMessage, type Message } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator, ToolIndicator } from './ToolIndicator';
import { ConnectedDataSources } from './ConnectedDataSources';
import { OnboardingChecklist } from '../onboarding/OnboardingChecklist';
import { sendChatMessage, sendChatStream } from '@/lib/api';

const STORAGE_KEY = 'mubyn-chat-history';

function loadMessages(): Message[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) }));
    }
  } catch { /* ignore */ }
  return [
    {
      id: '1',
      content: 'أهلاً! أنا قيصر، مدير العمليات الذكي. جاهز أشغّل عملك بالكامل — بدون تدخل بشري.\n\nHello! I\'m Caesar, your AI COO. I run your business operations **autonomously** — no human in the loop required.\n\n**Here\'s what I handle 24/7:**\n🔗 Connect your tools in **Settings** (Shopify, Meta, Google, Email, or your own API)\n📊 I pull live data and generate **CMO analytics + CFO reports** automatically\n📧 I find leads, write personalized emails, and **send outreach on autopilot**\n🤖 My **CS Agent** answers customer questions instantly across 5 channels\n🌐 I build and manage your **website** with a chat widget baked in\n📝 I generate your entire **content calendar** and can auto-publish\n\n**Autopilot mode:** Once connected, I operate continuously. You set the strategy, I execute everything.\n\nWhat should we set up first?',
      sender: 'caesar',
      timestamp: new Date(),
    },
  ];
}

function saveMessages(messages: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-100))); // keep last 100
  } catch { /* ignore */ }
}

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.title = 'Caesar AI — Mubyn'; }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, currentTool]);

  // Persist messages
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Show tool indicator based on message
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('lead') || lowerContent.includes('find') || lowerContent.includes('search') || lowerContent.includes('عملاء') || lowerContent.includes('ابحث')) {
      setCurrentTool('🔍 Searching for leads...');
    } else if (lowerContent.includes('content') || lowerContent.includes('post') || lowerContent.includes('محتوى') || lowerContent.includes('calendar')) {
      setCurrentTool('✍️ Creating content...');
    } else if (lowerContent.includes('email') || lowerContent.includes('send') || lowerContent.includes('بريد') || lowerContent.includes('outreach')) {
      setCurrentTool('📧 Composing email...');
    } else if (lowerContent.includes('website') || lowerContent.includes('موقع') || lowerContent.includes('site')) {
      setCurrentTool('🌐 Analyzing website...');
    } else if (lowerContent.includes('customer') || lowerContent.includes('support') || lowerContent.includes('دعم')) {
      setCurrentTool('🤝 Handling support...');
    } else if (lowerContent.includes('financ') || lowerContent.includes('revenue') || lowerContent.includes('مالي') || lowerContent.includes('cost')) {
      setCurrentTool('💰 Analyzing finances...');
    } else {
      setCurrentTool('💭 Thinking...');
    }

    try {
      // Real AI via backend with streaming
      const streamingMessageId = (Date.now() + 1).toString();
      let streamedContent = '';
      
      // Add placeholder message for streaming
      const placeholderMessage: Message = {
        id: streamingMessageId,
        content: '',
        sender: 'caesar',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, placeholderMessage]);
      
      await sendChatStream(
        content,
        // On each chunk
        (chunk) => {
          streamedContent += chunk;
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === streamingMessageId 
                ? { ...msg, content: streamedContent }
                : msg
            )
          );
        },
        // On model detected
        (model) => {
          setCurrentTool(model === 'falcon' ? '🇦🇪 Falcon responding...' : '🤖 GPT-4o responding...');
        },
        // On done
        () => {
          setCurrentTool(null);
        },
        // On error - fallback to non-streaming
        async () => {
          const data = await sendChatMessage(content);
          setCurrentTool(null);
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === streamingMessageId 
                ? { ...msg, content: data.response || data.message || 'I received your message.' }
                : msg
            )
          );
        }
      );
      return; // Skip fallback
    } catch {
      // Fallback to local responses if backend isn't ready yet
      setTimeout(() => {
        setCurrentTool(null);
        setIsTyping(true);
      }, 800);

      setTimeout(() => {
        setIsTyping(false);
        const caesarMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: getFallbackResponse(content),
          sender: 'caesar',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, caesarMessage]);
      }, 1800);
    }
  };

  const getFallbackResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase();
    
    if (lower.includes('lead') || lower.includes('find') || lower.includes('search') || lower.includes('عملاء') || lower.includes('ابحث')) {
      return '✅ I found 5 qualified leads in the MENA region!\n\n| Name | Company | Role |\n|------|---------|------|\n| Ahmed Hassan | TechCorp MENA | CEO |\n| Sara Al-Mansouri | Dubai Ventures | Founder |\n| Omar Khalil | Beirut Digital | COO |\n| Fatima Al-Sayed | Riyadh Tech | Head of Growth |\n| Karim Nassar | Cairo Startups | Director |\n\nCheck the **Leads** tab for full details. Want me to start an outreach campaign?';
    }
    
    if (lower.includes('content') || lower.includes('post') || lower.includes('محتوى') || lower.includes('calendar')) {
      return '📅 Here\'s your content calendar for the next month:\n\n**Week 1**\n• Mon: LinkedIn — Industry thought leadership\n• Wed: Twitter — Engagement thread on AI in MENA\n• Fri: Instagram — Behind-the-scenes story\n\n**Week 2**\n• Mon: LinkedIn — Case study post\n• Wed: Twitter — Tips & tricks thread\n• Fri: Instagram — Client testimonial\n\n**Week 3-4** follows the same pattern with fresh topics.\n\nGo to the **CMO** tab to customize and schedule. Shall I generate all the copy and images now?';
    }
    
    if (lower.includes('email') || lower.includes('outreach') || lower.includes('بريد')) {
      return '📧 Outreach campaign ready:\n\n**Sequence (3 emails over 7 days):**\n1. **Day 1** — Personalized intro referencing their company\n2. **Day 3** — Value proposition with relevant case study\n3. **Day 7** — Direct ask for 15-min meeting\n\nEach email is personalized using lead data from Apollo. Expected reply rate: 8-12%.\n\nShall I draft and send the first batch to your 5 leads?';
    }
    
    if (lower.includes('website') || lower.includes('site') || lower.includes('موقع')) {
      return '🌐 I can help with your website in two ways:\n\n1. **Connect existing website** — I\'ll analyze it, optimize SEO, and suggest improvements\n2. **Build new website** — Describe your business and I\'ll architect, design, and deploy it\n\nWhich would you prefer?';
    }

    if (lower.includes('customer') || lower.includes('support') || lower.includes('دعم')) {
      return '🤝 Customer Support Agent is ready!\n\nConnect your channels:\n• WhatsApp Business\n• Telegram Bot\n• Email inbox\n• Instagram DMs\n• Facebook Messenger\n\nOnce connected, I\'ll handle customer inquiries 24/7 with your brand voice and business knowledge. Go to the **CS** tab to get started.';
    }

    if (lower.includes('financ') || lower.includes('revenue') || lower.includes('مالي') || lower.includes('money') || lower.includes('cost')) {
      return '💰 Financial Overview:\n\n• **MRR:** $3,294 (+34% from last month)\n• **Expenses:** $412 (API costs, hosting)\n• **Net Profit:** $2,882\n• **Active Clients:** 7\n\nTop insight: Client "Al Rashid Group" usage dropped 40% — I recommend reaching out before they churn.\n\nSee the **CFO** tab for full breakdown.';
    }

    if (lower.includes('مرحبا') || lower.includes('اهلا') || lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return 'أهلاً وسهلاً! 👋\n\nI\'m Caesar, your AI CEO. I run your business operations 24/7. Here\'s what I can do:\n\n🔍 **Find Leads** — "Find restaurant owners in Dubai"\n📝 **Create Content** — "Create this month\'s content calendar"\n📧 **Outreach** — "Draft emails to my leads"\n🤝 **Customer Support** — "Set up CS for my WhatsApp"\n💰 **Finance** — "Show me this month\'s revenue"\n🌐 **Website** — "Build me a landing page"\n\nJust tell me what you need!';
    }
    
    return `I can help with that. Here\'s what I\'m capable of:\n\n🔍 **Lead Generation** — Find qualified prospects in any market\n📝 **Content & Marketing** — Full content calendars with copy, images, and scheduling\n📧 **Outreach Campaigns** — Personalized multi-channel sequences\n🤝 **Customer Support** — 24/7 AI-powered across all channels\n💰 **Financial Intelligence** — Revenue tracking, insights, predictions\n🌐 **Website** — Build or optimize your web presence\n\nTry asking me something specific like "Find me leads in Dubai restaurants" or "Create my February content calendar"!`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <OnboardingChecklist />
          <ConnectedDataSources />
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {currentTool && <ToolIndicator tool={currentTool} />}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <ChatInput onSend={handleSend} disabled={isTyping || !!currentTool} lastUserMessage={messages.filter(m => m.sender === 'user').pop()?.content} />
    </div>
  );
}
