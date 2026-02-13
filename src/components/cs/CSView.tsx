import {
  MessageCircle, Send, Loader2, Bot, User, Trash2, Settings, BookOpen, Palette,
  Globe, Plus, Edit3, Check, X, Copy, Code, MessageSquare,
  CheckCircle2, Mail, Instagram, Phone, Search, Tag, RefreshCw, Unplug, Eye, EyeOff,
  ArrowLeft, ToggleLeft, ToggleRight, ExternalLink
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import {
  csaRespond, getCsaConversations, getStoredUser,
  getCsaKnowledge, saveCsaKnowledge, updateCsaKnowledge, deleteCsaKnowledge,
  getCsaSettings, saveCsaSettings, getCsaWidget,
  connectCsaTelegram, disconnectCsaTelegram, getCsaTelegramStatus,
  connectCsaEmail, getCsaEmailStatus, disconnectCsaEmail, pollCsaEmail,
  connectWhatsApp, getWhatsAppStatus, disconnectWhatsApp,
  getWhatsAppConversations, sendWhatsAppMessage, toggleWhatsAppAutoReply,
  getGoogleOAuthUrl, getEmailOAuthStatus, API_BASE
} from '@/lib/api';
import { SkeletonMessageBubbles } from '@/components/ui/Skeleton';
import { useLang } from '@/lib/i18n';

/* â"€â"€â"€ Types â"€â"€â"€ */
interface Message {
  role: 'customer' | 'agent';
  content: string;
  timestamp: Date;
}

interface KBEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
}

interface CSASettings {
  tone?: string;
  language?: string;
  response_length?: string;
  custom_instructions?: string;
  widget?: {
    primaryColor?: string;
    position?: string;
    welcomeMessage?: string;
    buttonText?: string;
  };
}

/* â"€â"€â"€ Constants â"€â"€â"€ */
const TABS = [
  { id: 'test', labelKey: 'cs.tab.test', icon: <MessageCircle className="w-4 h-4" /> },
  { id: 'setup', labelKey: 'cs.tab.setup', icon: <Settings className="w-4 h-4" /> },
  { id: 'knowledge', labelKey: 'cs.tab.knowledge', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'tone', labelKey: 'cs.tab.tone', icon: <Palette className="w-4 h-4" /> },
] as const;

const KB_CATEGORIES = [
  { value: 'faq', label: 'FAQs', color: 'bg-sky-500/15 border-sky-500/25 text-sky-300' },
  { value: 'products', label: 'Products', color: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300' },
  { value: 'policies', label: 'Policies', color: 'bg-amber-500/15 border-amber-500/25 text-amber-300' },
  { value: 'custom', label: 'Custom', color: 'bg-white/10 border-white/20 text-white/70' },
];

const TONES = [
  { value: 'professional', label: 'Professional', desc: 'Polite, business-like, and courteous', icon: '🏢' },
  { value: 'friendly', label: 'Friendly', desc: 'Warm, approachable, and conversational', icon: '😊' },
  { value: 'casual', label: 'Casual', desc: 'Relaxed, informal, and personable', icon: '🤙' },
  { value: 'formal', label: 'Formal', desc: 'Very formal, sophisticated language', icon: '👔' },
];

const RESPONSE_LENGTHS = [
  { value: 'concise', label: 'Concise', desc: 'Short and to the point' },
  { value: 'balanced', label: 'Balanced', desc: 'Medium length, well-explained' },
  { value: 'detailed', label: 'Detailed', desc: 'Thorough and comprehensive' },
];

const CHANNELS = [
  { id: 'website', label: 'Website Widget', icon: <Globe className="w-6 h-6" />, status: 'ready', color: 'text-brand-gold' },
  { id: 'whatsapp', label: 'WhatsApp', icon: <Phone className="w-6 h-6" />, status: 'ready', color: 'text-emerald-400' },
  { id: 'telegram', label: 'Telegram', icon: <Send className="w-6 h-6" />, status: 'ready', color: 'text-sky-400' },
  { id: 'email', label: 'Email', icon: <Mail className="w-6 h-6" />, status: 'ready', color: 'text-red-400' },
  { id: 'instagram', label: 'Instagram', icon: <Instagram className="w-6 h-6" />, status: 'coming_soon', color: 'text-pink-400' },
];

const QUICK_QUESTIONS = [
  'What are your opening hours?',
  'I want a refund',
  'Do you deliver to my area?',
  'How much does it cost?',
  'I have a complaint',
  'Can I speak to a manager?',
];

/* â"€â"€â"€ Component â"€â"€â"€ */
export function CSView() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<string>('test');

  // Test Agent state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [businessContext, setBusinessContext] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Knowledge Base state
  const [kbEntries, setKbEntries] = useState<KBEntry[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbSearch, setKbSearch] = useState('');
  const [kbFilter, setKbFilter] = useState('all');
  const [showKbForm, setShowKbForm] = useState(false);
  const [editingKb, setEditingKb] = useState<KBEntry | null>(null);
  const [kbForm, setKbForm] = useState({ title: '', content: '', category: 'faq', tags: '' });

  // Settings state
  const [settings, setSettings] = useState<CSASettings>({
    tone: 'professional',
    language: 'english',
    response_length: 'balanced',
    custom_instructions: '',
    widget: { primaryColor: '#D4A843', position: 'bottom-right', welcomeMessage: 'Hi! How can I help you today?', buttonText: 'Chat with us' },
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Widget state
  const [embedCode, setEmbedCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  // Telegram state
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramBotUsername, setTelegramBotUsername] = useState('');
  const [telegramBotFirstName, setTelegramBotFirstName] = useState('');
  const [telegramConnecting, setTelegramConnecting] = useState(false);
  const [telegramDisconnecting, setTelegramDisconnecting] = useState(false);
  const [telegramError, setTelegramError] = useState('');

  // Email channel state
  const [emailConnected, setEmailConnected] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailProvider, setEmailProvider] = useState('gmail');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailConnectedAddr, setEmailConnectedAddr] = useState('');
  const [emailConnecting, setEmailConnecting] = useState(false);
  const [emailDisconnecting, setEmailDisconnecting] = useState(false);
  const [emailPolling, setEmailPolling] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailLastPoll, setEmailLastPoll] = useState<string | null>(null);
  const [emailPollResult, setEmailPollResult] = useState<string | null>(null);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailImapHost, setEmailImapHost] = useState('');
  const [emailImapPort, setEmailImapPort] = useState('');
  const [emailSmtpHost, setEmailSmtpHost] = useState('');
  const [emailSmtpPort, setEmailSmtpPort] = useState('');

  // Google OAuth state
  const [googleOAuthLoading, setGoogleOAuthLoading] = useState(false);
  const [googleOAuthConnected, setGoogleOAuthConnected] = useState(false);
  const [googleOAuthEmail, setGoogleOAuthEmail] = useState('');
  const [showManualEmail, setShowManualEmail] = useState(false);

  // WhatsApp channel state
  const [waConnected, setWaConnected] = useState(false);
  const [waPhoneNumberId, setWaPhoneNumberId] = useState('');
  const [waAccessToken, setWaAccessToken] = useState('');
  const [waBusinessAccountId, setWaBusinessAccountId] = useState('');
  const [waWebhookVerifyToken, setWaWebhookVerifyToken] = useState('');
  const [waDisplayPhone, setWaDisplayPhone] = useState('');
  const [waVerifiedName, setWaVerifiedName] = useState('');
  const [waAutoReply, setWaAutoReply] = useState(true);
  const [waConnecting, setWaConnecting] = useState(false);
  const [waDisconnecting, setWaDisconnecting] = useState(false);
  const [waError, setWaError] = useState('');
  interface WaConversation {
    id: string;
    phone: string;
    name: string;
    messages: Array<{ id: string; role: 'customer' | 'agent'; content: string; timestamp: string }>;
    updated_at?: string;
    created_at: string;
  }
  const [waConversations, setWaConversations] = useState<WaConversation[]>([]);
  const [waSelectedConvo, setWaSelectedConvo] = useState<WaConversation | null>(null);
  const [waReplyInput, setWaReplyInput] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waLoadingConvos, setWaLoadingConvos] = useState(false);
  const waMessagesEndRef = useRef<HTMLDivElement>(null);

  /* â"€â"€â"€ Load data â"€â"€â"€ */
  useEffect(() => {
    document.title = 'Customer Support Agent â€" Mubyn';
    const user = getStoredUser();
    if (user?.business_name) {
      setBusinessContext(`Business: ${user.business_name}. Industry: ${user.industry || 'General'}. We provide AI-powered business automation services.`);
    }
    loadHistory();
    loadKnowledgeBase();
    loadSettings();
    loadTelegramStatus();
    loadEmailStatus();
    loadWhatsAppStatus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const data = await getCsaConversations();
      const convos = data.conversations || [];
      if (convos.length > 0) {
        const msgs: Message[] = [];
        for (const c of convos.slice(-20)) {
          if (c.customer_message) msgs.push({ role: 'customer', content: c.customer_message, timestamp: new Date(c.timestamp || Date.now()) });
          if (c.ai_response) msgs.push({ role: 'agent', content: c.ai_response, timestamp: new Date(c.timestamp || Date.now()) });
        }
        setMessages(msgs);
      }
    } catch { /* No history yet */ }
    finally { setLoadingHistory(false); }
  };

  const loadKnowledgeBase = async () => {
    setKbLoading(true);
    try {
      const data = await getCsaKnowledge();
      setKbEntries(data.entries || []);
    } catch { /* empty */ }
    finally { setKbLoading(false); }
  };

  const loadSettings = async () => {
    try {
      const data = await getCsaSettings();
      if (data.settings && Object.keys(data.settings).length > 0) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
      const widgetData = await getCsaWidget();
      if (widgetData.embed_code) setEmbedCode(widgetData.embed_code);
    } catch { /* defaults */ }
  };

  const loadTelegramStatus = async () => {
    try {
      const data = await getCsaTelegramStatus();
      if (data.connected) {
        setTelegramConnected(true);
        setTelegramBotUsername(data.bot_username || '');
        setTelegramBotFirstName(data.bot_first_name || '');
      }
    } catch { /* not connected */ }
  };

  const handleTelegramConnect = async () => {
    if (!telegramToken.trim()) return;
    setTelegramConnecting(true);
    setTelegramError('');
    try {
      const data = await connectCsaTelegram(telegramToken.trim());
      if (data.success) {
        setTelegramConnected(true);
        setTelegramBotUsername(data.channel.bot_username || '');
        setTelegramBotFirstName(data.channel.bot_first_name || '');
        setTelegramToken('');
      } else {
        setTelegramError(data.error || 'Connection failed');
      }
    } catch (e: any) {
      setTelegramError(e.message || 'Connection failed');
    } finally {
      setTelegramConnecting(false);
    }
  };

  const handleTelegramDisconnect = async () => {
    setTelegramDisconnecting(true);
    try {
      await disconnectCsaTelegram();
      setTelegramConnected(false);
      setTelegramBotUsername('');
      setTelegramBotFirstName('');
    } catch { /* error */ }
    finally { setTelegramDisconnecting(false); }
  };

  /* â"€â"€â"€ Email channel handlers â"€â"€â"€ */
  const loadEmailStatus = async () => {
    try {
      const data = await getCsaEmailStatus();
      if (data.connected) {
        setEmailConnected(true);
        setEmailConnectedAddr(data.email || '');
        setEmailLastPoll(data.last_poll_at || null);
        // Check if connected via OAuth
        if (data.oauth_provider === 'google') {
          setGoogleOAuthConnected(true);
          setGoogleOAuthEmail(data.email || '');
        }
      }
    } catch { /* not connected */ }

    // Also check URL params for OAuth callback result
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('oauth_success') === 'google') {
        const email = params.get('oauth_email') || '';
        setEmailConnected(true);
        setEmailConnectedAddr(email);
        setGoogleOAuthConnected(true);
        setGoogleOAuthEmail(email);
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
        // Switch to setup tab to show the result
        setActiveTab('setup');
      } else if (params.get('oauth_error')) {
        setEmailError(`Google OAuth failed: ${params.get('oauth_error')}`);
        window.history.replaceState({}, '', window.location.pathname);
        setActiveTab('setup');
      }
    } catch { /* ignore URL parse errors */ }
  };

  const handleGoogleOAuth = async () => {
    setGoogleOAuthLoading(true);
    setEmailError('');
    try {
      const data = await getGoogleOAuthUrl();
      if (data.url) {
        // Redirect to Google OAuth
        window.location.href = data.url;
      } else {
        setEmailError('Failed to get Google OAuth URL');
      }
    } catch (e: any) {
      setEmailError(e.message || 'Google OAuth failed');
    } finally {
      setGoogleOAuthLoading(false);
    }
  };

  const handleEmailConnect = async () => {
    if (!emailAddress.trim() || !emailPassword.trim()) return;
    setEmailConnecting(true);
    setEmailError('');
    try {
      const payload: Record<string, any> = {
        email: emailAddress.trim(),
        password: emailPassword.trim(),
        provider: emailProvider,
      };
      if (emailProvider === 'custom') {
        if (emailImapHost) payload.imap_host = emailImapHost;
        if (emailImapPort) payload.imap_port = parseInt(emailImapPort);
        if (emailSmtpHost) payload.smtp_host = emailSmtpHost;
        if (emailSmtpPort) payload.smtp_port = parseInt(emailSmtpPort);
      }
      const data = await connectCsaEmail(payload as any);
      if (data.success) {
        setEmailConnected(true);
        setEmailConnectedAddr(data.channel.email || emailAddress);
        setEmailPassword('');
        setEmailAddress('');
      } else {
        setEmailError(data.error || 'Connection failed');
      }
    } catch (e: any) {
      setEmailError(e.message || 'Connection failed');
    } finally {
      setEmailConnecting(false);
    }
  };

  const handleEmailDisconnect = async () => {
    setEmailDisconnecting(true);
    try {
      await disconnectCsaEmail();
      setEmailConnected(false);
      setEmailConnectedAddr('');
      setEmailLastPoll(null);
      setEmailPollResult(null);
    } catch { /* error */ }
    finally { setEmailDisconnecting(false); }
  };

  const handleEmailPoll = async () => {
    setEmailPolling(true);
    setEmailPollResult(null);
    setEmailError('');
    try {
      const data = await pollCsaEmail();
      setEmailLastPoll(data.last_poll || new Date().toISOString());
      if (data.new_emails === 0) {
        setEmailPollResult('No new emails found.');
      } else {
        setEmailPollResult(`Found ${data.new_emails} new email(s), replied to ${data.replied}.`);
      }
    } catch (e: any) {
      setEmailError(e.message || 'Poll failed');
    } finally {
      setEmailPolling(false);
    }
  };

  /* â"€â"€â"€ WhatsApp channel handlers â"€â"€â"€ */
  const loadWhatsAppStatus = async () => {
    try {
      const data = await getWhatsAppStatus();
      if (data.connected) {
        setWaConnected(true);
        setWaDisplayPhone(data.displayPhoneNumber || '');
        setWaVerifiedName(data.verifiedName || '');
        setWaAutoReply(data.autoReply !== false);
        loadWhatsAppConversations();
      }
    } catch { /* not connected */ }
  };

  const loadWhatsAppConversations = async () => {
    setWaLoadingConvos(true);
    try {
      const data = await getWhatsAppConversations();
      setWaConversations(data.conversations || []);
    } catch { /* empty */ }
    finally { setWaLoadingConvos(false); }
  };

  const handleWhatsAppConnect = async () => {
    if (!waPhoneNumberId.trim() || !waAccessToken.trim()) return;
    setWaConnecting(true);
    setWaError('');
    try {
      const data = await connectWhatsApp(
        waPhoneNumberId.trim(),
        waAccessToken.trim(),
        waBusinessAccountId.trim(),
        waWebhookVerifyToken.trim()
      );
      if (data.success) {
        setWaConnected(true);
        setWaDisplayPhone(data.channel.displayPhoneNumber || '');
        setWaVerifiedName(data.channel.verifiedName || '');
        setWaPhoneNumberId('');
        setWaAccessToken('');
        setWaBusinessAccountId('');
        setWaWebhookVerifyToken('');
        loadWhatsAppConversations();
      } else {
        setWaError(data.error || 'Connection failed');
      }
    } catch (e: unknown) {
      setWaError(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setWaConnecting(false);
    }
  };

  const handleWhatsAppDisconnect = async () => {
    setWaDisconnecting(true);
    try {
      await disconnectWhatsApp();
      setWaConnected(false);
      setWaDisplayPhone('');
      setWaVerifiedName('');
      setWaConversations([]);
      setWaSelectedConvo(null);
    } catch { /* error */ }
    finally { setWaDisconnecting(false); }
  };

  const handleWaAutoReplyToggle = async () => {
    const newVal = !waAutoReply;
    setWaAutoReply(newVal);
    try {
      await toggleWhatsAppAutoReply(newVal);
    } catch {
      setWaAutoReply(!newVal); // revert on failure
    }
  };

  const handleWaSendReply = async () => {
    if (!waReplyInput.trim() || !waSelectedConvo || waSending) return;
    const msgText = waReplyInput.trim();
    setWaReplyInput('');
    setWaSending(true);
    try {
      await sendWhatsAppMessage(waSelectedConvo.phone, msgText);
      // Optimistic update
      const newMsg = { id: crypto.randomUUID(), role: 'agent' as const, content: msgText, timestamp: new Date().toISOString() };
      setWaSelectedConvo(prev => prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev);
      setWaConversations(prev => prev.map(c => c.id === waSelectedConvo.id ? { ...c, messages: [...c.messages, newMsg], updated_at: new Date().toISOString() } : c));
    } catch { /* error */ }
    finally { setWaSending(false); }
  };

  useEffect(() => {
    if (waSelectedConvo) {
      waMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [waSelectedConvo?.messages?.length]);

  /* â"€â"€â"€ Chat handlers â"€â"€â"€ */
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const customerMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'customer', content: customerMessage, timestamp: new Date() }]);
    setLoading(true);
    try {
      const context = businessContext || 'General business support';
      const activeKb = kbEntries.filter(kb => kb.is_active !== false);
      const data = await csaRespond(customerMessage, context, activeKb.length > 0 ? activeKb : undefined, settings.tone, settings.language);
      const agentResponse = data.response || data.message || 'I apologize, I could not generate a response.';
      setMessages(prev => [...prev, { role: 'agent', content: agentResponse, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'agent', content: 'Sorry, something went wrong. Please try again.', timestamp: new Date() }]);
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /* â"€â"€â"€ KB handlers â"€â"€â"€ */
  const handleSaveKb = async () => {
    if (!kbForm.title.trim() || !kbForm.content.trim()) return;
    try {
      if (editingKb) {
        await updateCsaKnowledge(editingKb.id, {
          title: kbForm.title, content: kbForm.content, category: kbForm.category,
          tags: kbForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        });
      } else {
        await saveCsaKnowledge({
          title: kbForm.title, content: kbForm.content, category: kbForm.category,
          tags: kbForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        });
      }
      setShowKbForm(false);
      setEditingKb(null);
      setKbForm({ title: '', content: '', category: 'faq', tags: '' });
      await loadKnowledgeBase();
    } catch { /* error */ }
  };

  const handleDeleteKb = async (id: string) => {
    try {
      await deleteCsaKnowledge(id);
      setKbEntries(prev => prev.filter(e => e.id !== id));
    } catch { /* error */ }
  };

  const startEditKb = (entry: KBEntry) => {
    setEditingKb(entry);
    setKbForm({ title: entry.title, content: entry.content, category: entry.category, tags: (entry.tags || []).join(', ') });
    setShowKbForm(true);
  };

  /* â"€â"€â"€ Settings handlers â"€â"€â"€ */
  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    try {
      await saveCsaSettings(settings as unknown as Record<string, unknown>);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch { /* error */ }
    finally { setSettingsLoading(false); }
  };

  const handleCopyCode = () => {
    if (embedCode) {
      navigator.clipboard.writeText(embedCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  /* â"€â"€â"€ Filtered KB â"€â"€â"€ */
  const filteredKb = kbEntries.filter(e => {
    if (kbFilter !== 'all' && e.category !== kbFilter) return false;
    if (kbSearch && !e.title.toLowerCase().includes(kbSearch.toLowerCase()) && !e.content.toLowerCase().includes(kbSearch.toLowerCase())) return false;
    return true;
  });

  /* â"€â"€â"€ Render â"€â"€â"€ */
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <MessageCircle className="w-7 h-7 text-brand-gold" />
          {t('cs.title')}
        </h1>
        <p className="text-brand-textMuted mt-1">{t('cs.subtitle')}</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-brand-card border border-brand-border shrink-0 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-brand-gold text-black'
                : 'text-brand-textMuted hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon}
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TAB 1: TEST AGENT â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === 'test' && (
        <div className="flex-1 flex gap-6 min-h-0">
          {/* Chat Area */}
          <div className="flex-1 rounded-2xl bg-brand-card border border-brand-border flex flex-col min-h-[500px] overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingHistory ? (
                <div className="p-4">
                  <SkeletonMessageBubbles count={4} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <div className="w-20 h-20 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-10 h-10 text-brand-gold/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Test your AI support agent</h3>
                    <p className="text-brand-textMuted text-sm max-w-md">
                      Type a message as a customer would. Caesar will respond using your business context and knowledge base.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                      {QUICK_QUESTIONS.map(q => (
                        <button
                          key={q}
                          onClick={() => setInput(q)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-brand-textMuted hover:text-white hover:border-brand-gold/30 transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'agent' && (
                        <div className="w-8 h-8 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-brand-gold" />
                        </div>
                      )}
                      <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'customer'
                          ? 'bg-brand-gold/20 text-white rounded-br-md'
                          : 'bg-white/5 text-white rounded-bl-md border border-white/10'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      {msg.role === 'customer' && (
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-brand-textMuted" />
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-brand-gold" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white/5 border border-white/10">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-brand-gold/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-brand-gold/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-brand-gold/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-brand-border">
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a customer message to test the AI response..."
                  rows={1}
                  className="flex-1 px-4 py-3 rounded-xl bg-brand-dark border border-brand-border text-white placeholder:text-brand-textMuted focus:border-brand-gold focus:outline-none resize-none text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-brand-gold to-brand-goldBright text-black hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Context + KB Summary */}
          <div className="hidden xl:flex flex-col gap-4 w-80 shrink-0">
            {/* Business Context */}
            <div className="rounded-2xl bg-brand-card border border-brand-border p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-brand-gold" />
                Business Context
              </h3>
              <textarea
                value={businessContext}
                onChange={e => setBusinessContext(e.target.value)}
                placeholder="Describe your business..."
                className="w-full h-20 px-3 py-2 rounded-lg bg-brand-dark border border-brand-border text-white placeholder:text-brand-textMuted focus:border-brand-gold focus:outline-none resize-none text-xs"
              />
            </div>

            {/* Active Settings */}
            <div className="rounded-2xl bg-brand-card border border-brand-border p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-brand-gold" />
                Active Settings
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-brand-textMuted">Tone</span>
                  <span className="text-white capitalize">{settings.tone || 'Professional'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-textMuted">Language</span>
                  <span className="text-white capitalize">{settings.language || 'English'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-textMuted">Length</span>
                  <span className="text-white capitalize">{settings.response_length || 'Balanced'}</span>
                </div>
              </div>
            </div>

            {/* KB Summary */}
            <div className="rounded-2xl bg-brand-card border border-brand-border p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-gold" />
                Knowledge Base ({kbEntries.length})
              </h3>
              {kbEntries.length === 0 ? (
                <p className="text-xs text-brand-textMuted">No entries yet. Add knowledge so your agent can answer accurately.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {kbEntries.slice(0, 8).map(entry => (
                    <div key={entry.id} className="text-xs px-2.5 py-1.5 rounded-lg bg-white/5 text-brand-textMuted truncate">
                      {entry.title}
                    </div>
                  ))}
                  {kbEntries.length > 8 && (
                    <p className="text-xs text-brand-gold cursor-pointer hover:underline" onClick={() => setActiveTab('knowledge')}>
                      +{kbEntries.length - 8} more...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Clear Chat */}
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border text-brand-textMuted hover:text-red-400 hover:border-red-400/50 transition-all text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Clear Conversation
              </button>
            )}
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TAB 2: SETUP & CHANNELS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === 'setup' && (
        <div className="space-y-6 flex-1">
          {/* Website Widget Section */}
          <div className="rounded-2xl bg-brand-card border border-brand-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
                <Code className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Website Widget</h3>
                <p className="text-sm text-brand-textMuted">Add a chat widget to your website with a single line of code.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Embed Code */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-textMuted mb-2">Embed Code</label>
                  <div className="relative">
                    <pre className="w-full px-4 py-3 rounded-lg bg-brand-dark border border-brand-border text-xs text-brand-gold font-mono overflow-x-auto">
                      {embedCode || `<script src="https://app.mubyn.com/widget/YOUR_ID.js" async></script>`}
                    </pre>
                    <button
                      onClick={handleCopyCode}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-brand-textMuted hover:text-white transition-all"
                    >
                      {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-brand-textMuted mt-2">Paste this before the closing &lt;/body&gt; tag on your website.</p>
                </div>

                {/* Widget Customization */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white">Customization</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-brand-textMuted mb-1">Primary Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={settings.widget?.primaryColor || '#D4A843'}
                          onChange={e => setSettings(prev => ({ ...prev, widget: { ...prev.widget, primaryColor: e.target.value } }))}
                          className="w-10 h-8 rounded cursor-pointer bg-transparent border-0"
                        />
                        <input
                          value={settings.widget?.primaryColor || '#D4A843'}
                          onChange={e => setSettings(prev => ({ ...prev, widget: { ...prev.widget, primaryColor: e.target.value } }))}
                          className="flex-1 px-3 py-2 rounded-lg bg-brand-dark border border-brand-border text-white text-xs font-mono focus:border-brand-gold focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-brand-textMuted mb-1">Position</label>
                      <select
                        value={settings.widget?.position || 'bottom-right'}
                        onChange={e => setSettings(prev => ({ ...prev, widget: { ...prev.widget, position: e.target.value } }))}
                        className="w-full px-3 py-2 rounded-lg bg-brand-dark border border-brand-border text-white text-xs focus:border-brand-gold focus:outline-none"
                      >
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-brand-textMuted mb-1">Welcome Message</label>
                    <input
                      value={settings.widget?.welcomeMessage || ''}
                      onChange={e => setSettings(prev => ({ ...prev, widget: { ...prev.widget, welcomeMessage: e.target.value } }))}
                      className="w-full px-3 py-2 rounded-lg bg-brand-dark border border-brand-border text-white text-xs focus:border-brand-gold focus:outline-none"
                      placeholder="Hi! How can I help you today?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-brand-textMuted mb-1">Button Text</label>
                    <input
                      value={settings.widget?.buttonText || ''}
                      onChange={e => setSettings(prev => ({ ...prev, widget: { ...prev.widget, buttonText: e.target.value } }))}
                      className="w-full px-3 py-2 rounded-lg bg-brand-dark border border-brand-border text-white text-xs focus:border-brand-gold focus:outline-none"
                      placeholder="Chat with us"
                    />
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    disabled={settingsLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-gold text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {settingsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : settingsSaved ? <Check className="w-4 h-4" /> : null}
                    {settingsSaved ? 'Saved!' : 'Save Widget Settings'}
                  </button>
                </div>
              </div>

              {/* Widget Preview */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-brand-textMuted">Live Preview</label>
                <div className="relative bg-gradient-to-br from-brand-dark to-brand-darker rounded-xl h-[400px] overflow-hidden border border-brand-border">
                  {/* Widget preview */}
                  <div className="p-4 space-y-3 opacity-30">
                    <div className="h-6 bg-white/20 rounded w-1/3" />
                    <div className="h-3 bg-white/10 rounded w-2/3" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                    <div className="h-24 bg-white/5 rounded mt-6" />
                  </div>

                  {/* Widget Preview */}
                  <div
                    className="absolute bottom-4"
                    style={{ [settings.widget?.position === 'bottom-left' ? 'left' : 'right']: '16px' }}
                  >
                    <div className="mb-3 w-[260px] bg-brand-card rounded-2xl shadow-2xl overflow-hidden border border-white/10">
                      <div className="px-4 py-3" style={{ backgroundColor: settings.widget?.primaryColor || '#D4A843' }}>
                        <h3 className="font-semibold text-sm text-black">Support</h3>
                      </div>
                      <div className="p-3">
                        <div className="flex justify-start mb-2">
                          <div className="bg-white/10 rounded-2xl rounded-bl-sm px-3 py-2 max-w-[80%]">
                            <p className="text-xs text-white">{settings.widget?.welcomeMessage || 'Hi! How can I help you today?'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 border-t border-white/10 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Type your message..."
                          className="flex-1 px-3 py-1.5 border border-white/10 rounded-full text-xs bg-transparent text-white/50 outline-none"
                          readOnly
                        />
                        <button
                          className="w-7 h-7 rounded-full flex items-center justify-center text-black"
                          style={{ backgroundColor: settings.widget?.primaryColor || '#D4A843' }}
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-black ml-auto"
                      style={{ backgroundColor: settings.widget?.primaryColor || '#D4A843' }}
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Telegram Bot Section */}
          <div className="rounded-2xl bg-brand-card border border-brand-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                <Send className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Telegram Bot</h3>
                <p className="text-sm text-brand-textMuted">Connect your Telegram bot to auto-respond to customers with AI.</p>
              </div>
            </div>

            {telegramConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-400">Connected</p>
                    <p className="text-xs text-brand-textMuted">
                      Bot: <a href={`https://t.me/${telegramBotUsername}`} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">@{telegramBotUsername}</a>
                      {telegramBotFirstName && <span> ({telegramBotFirstName})</span>}
                    </p>
                  </div>
                  <button
                    onClick={handleTelegramDisconnect}
                    disabled={telegramDisconnecting}
                    className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-all disabled:opacity-50"
                  >
                    {telegramDisconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Disconnect'}
                  </button>
                </div>
                <p className="text-xs text-brand-textMuted">
                  Your bot is live! Customers can message <a href={`https://t.me/${telegramBotUsername}`} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">@{telegramBotUsername}</a> and get instant AI-powered replies using your knowledge base and tone settings.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-brand-textMuted">Bot Token</label>
                  <p className="text-xs text-brand-textMuted">Get this from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">@BotFather</a> on Telegram. Create a new bot and copy the token.</p>
                  <div className="flex gap-3">
                    <input
                      type="password"
                      value={telegramToken}
                      onChange={e => { setTelegramToken(e.target.value); setTelegramError(''); }}
                      placeholder="123456789:ABCdefGHIjklmno_pqrstUVWxyz"
                      className="flex-1 px-4 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-white text-sm placeholder:text-brand-textMuted focus:border-sky-400 focus:outline-none font-mono"
                    />
                    <button
                      onClick={handleTelegramConnect}
                      disabled={!telegramToken.trim() || telegramConnecting}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 disabled:opacity-50 transition-all shrink-0"
                    >
                      {telegramConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {telegramConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                  </div>
                  {telegramError && (
                    <p className="text-xs text-red-400 mt-1">âš ï¸ {telegramError}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-brand-textMuted font-medium mb-1">How to get a bot token:</p>
                  <ol className="text-xs text-brand-textMuted space-y-0.5 list-decimal list-inside">
                    <li>Open Telegram and search for <strong>@BotFather</strong></li>
                    <li>Send <code className="px-1 py-0.5 bg-white/10 rounded">/newbot</code> and follow the prompts</li>
                    <li>Copy the API token and paste it above</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Business Section */}
          <div className="rounded-2xl bg-brand-card border border-brand-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">WhatsApp Business</h3>
                <p className="text-sm text-brand-textMuted">Connect your WhatsApp Business API to auto-respond to customers with AI.</p>
              </div>
            </div>

            {waConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-400">Connected</p>
                    <p className="text-xs text-brand-textMuted">
                      Phone: <span className="text-white">{waDisplayPhone}</span>
                      {waVerifiedName && <span> ({waVerifiedName})</span>}
                    </p>
                  </div>
                  <button
                    onClick={handleWaAutoReplyToggle}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-gold/30 text-xs font-medium hover:bg-brand-gold/10 transition-all mr-2"
                    title={waAutoReply ? 'Auto-reply ON' : 'Auto-reply OFF'}
                  >
                    {waAutoReply ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-brand-textMuted" />}
                    <span className={waAutoReply ? 'text-emerald-400' : 'text-brand-textMuted'}>Auto-Reply</span>
                  </button>
                  <button
                    onClick={handleWhatsAppDisconnect}
                    disabled={waDisconnecting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-all disabled:opacity-50"
                  >
                    {waDisconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unplug className="w-3 h-3" />}
                    Disconnect
                  </button>
                </div>

                {/* Conversations */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">Recent Conversations</h4>
                    <button
                      onClick={loadWhatsAppConversations}
                      disabled={waLoadingConvos}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border text-xs text-brand-textMuted hover:text-white hover:border-brand-gold/30 transition-all disabled:opacity-50"
                    >
                      {waLoadingConvos ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Refresh
                    </button>
                  </div>

                  {waSelectedConvo ? (
                    /* Conversation thread view */
                    <div className="rounded-xl bg-brand-dark border border-brand-border overflow-hidden">
                      <div className="flex items-center gap-3 p-3 border-b border-brand-border">
                        <button
                          onClick={() => { setWaSelectedConvo(null); loadWhatsAppConversations(); }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-brand-textMuted hover:text-white transition-all"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <Phone className="w-4 h-4 text-emerald-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{waSelectedConvo.name}</p>
                          <p className="text-xs text-brand-textMuted">{waSelectedConvo.phone}</p>
                        </div>
                      </div>
                      <div className="max-h-[320px] overflow-y-auto p-4 space-y-3">
                        {waSelectedConvo.messages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.role === 'customer' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                              msg.role === 'customer'
                                ? 'bg-white/5 text-white rounded-bl-sm border border-white/10'
                                : 'bg-emerald-500/20 text-white rounded-br-sm'
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <p className="text-[10px] text-brand-textMuted mt-1">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={waMessagesEndRef} />
                      </div>
                      <div className="p-3 border-t border-brand-border flex gap-2">
                        <input
                          value={waReplyInput}
                          onChange={e => setWaReplyInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleWaSendReply(); } }}
                          placeholder="Type a reply..."
                          className="flex-1 px-3 py-2 rounded-lg bg-brand-card border border-brand-border text-white text-sm placeholder:text-brand-textMuted focus:border-emerald-400 focus:outline-none"
                        />
                        <button
                          onClick={handleWaSendReply}
                          disabled={!waReplyInput.trim() || waSending}
                          className="px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-all"
                        >
                          {waSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ) : waConversations.length > 0 ? (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {waConversations
                        .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
                        .map(convo => {
                          const lastMsg = convo.messages[convo.messages.length - 1];
                          return (
                            <button
                              key={convo.id}
                              onClick={() => setWaSelectedConvo(convo)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-brand-dark border border-brand-border hover:border-emerald-500/30 transition-all text-left"
                            >
                              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                <Phone className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-white truncate">{convo.name}</p>
                                  <span className="text-[10px] text-brand-textMuted shrink-0 ml-2">
                                    {lastMsg ? new Date(lastMsg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                  </span>
                                </div>
                                <p className="text-xs text-brand-textMuted truncate">
                                  {lastMsg ? (lastMsg.role === 'agent' ? 'â†© ' : '') + lastMsg.content : 'No messages'}
                                </p>
                              </div>
                              <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full shrink-0">
                                {convo.messages.length}
                              </span>
                            </button>
                          );
                        })
                      }
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-xl bg-brand-dark border border-brand-border border-dashed">
                      <Phone className="w-8 h-8 text-emerald-400/20 mx-auto mb-2" />
                      <p className="text-sm text-brand-textMuted">No conversations yet. Incoming WhatsApp messages will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-brand-textMuted mb-1">Phone Number ID</label>
                    <input
                      type="text"
                      value={waPhoneNumberId}
                      onChange={e => { setWaPhoneNumberId(e.target.value); setWaError(''); }}
                      placeholder="e.g. 123456789012345"
                      className="w-full px-4 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-white text-sm placeholder:text-brand-textMuted focus:border-emerald-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-textMuted mb-1">Permanent Access Token</label>
                    <input
                      type="password"
                      value={waAccessToken}
                      onChange={e => { setWaAccessToken(e.target.value); setWaError(''); }}
                      placeholder="EAAG... (from Meta Business Suite)"
                      className="w-full px-4 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-white text-sm placeholder:text-brand-textMuted focus:border-emerald-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-brand-textMuted mb-1">Business Account ID <span className="text-brand-textMuted">(optional)</span></label>
                      <input
                        type="text"
                        value={waBusinessAccountId}
                        onChange={e => setWaBusinessAccountId(e.target.value)}
                        placeholder="e.g. 123456789"
                        className="w-full px-4 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-white text-sm placeholder:text-brand-textMuted focus:border-emerald-400 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-textMuted mb-1">Webhook Verify Token <span className="text-brand-textMuted">(optional)</span></label>
                      <input
                        type="text"
                        value={waWebhookVerifyToken}
                        onChange={e => setWaWebhookVerifyToken(e.target.value)}
                        placeholder="Auto-generated if empty"
                        className="w-full px-4 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-white text-sm placeholder:text-brand-textMuted focus:border-emerald-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Webhook URL (read-only) */}
                <div>
                  <label className="block text-xs font-medium text-brand-textMuted mb-1">Webhook URL <span className="text-brand-textMuted">(configure in Meta)</span></label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-xs text-emerald-400 font-mono break-all">
                      {API_BASE}/api/csa/whatsapp/webhook?userId={getStoredUser()?.id || 'YOUR_USER_ID'}
                    </code>
                    <button
                      onClick={() => {
                        const uid = getStoredUser()?.id || 'YOUR_USER_ID';
                        navigator.clipboard.writeText(`${API_BASE}/api/csa/whatsapp/webhook?userId=${uid}`);
                      }}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-brand-textMuted hover:text-white transition-all shrink-0"
                      title="Copy webhook URL"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleWhatsAppConnect}
                  disabled={!waPhoneNumberId.trim() || !waAccessToken.trim() || waConnecting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all"
                >
                  {waConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                  {waConnecting ? 'Testing & Connecting...' : 'Connect WhatsApp'}
                </button>
                {waError && (
                  <p className="text-xs text-red-400">âš ï¸ {waError}</p>
                )}

                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-brand-textMuted font-medium mb-1">How to get WhatsApp Business API credentials:</p>
                  <ol className="text-xs text-brand-textMuted space-y-0.5 list-decimal list-inside">
                    <li>Go to <a href="https://business.facebook.com/settings/whatsapp-business-accounts" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-0.5">Meta Business Suite <ExternalLink className="w-2.5 h-2.5 inline" /></a></li>
                    <li>Navigate to <strong>WhatsApp â†' API Setup</strong></li>
                    <li>Copy the <strong>Phone Number ID</strong> and generate a <strong>Permanent Token</strong></li>
                    <li>Set the <strong>Webhook URL</strong> above in your Meta app configuration</li>
                    <li>Subscribe to the <strong>messages</strong> webhook field</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Email Channel Section */}
          <div className="rounded-2xl bg-brand-card border border-brand-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Email Channel</h3>
                <p className="text-sm text-brand-textMuted">Connect your email to auto-respond to customers with AI via IMAP/SMTP.</p>
              </div>
            </div>

            {emailConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-400">Connected</p>
                    <p className="text-xs text-brand-textMuted">
                      Email: <span className="text-white">{emailConnectedAddr}</span>
                    </p>
                    {emailLastPoll && (
                      <p className="text-xs text-brand-textMuted mt-0.5">
                        Last poll: {new Date(emailLastPoll).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleEmailPoll}
                    disabled={emailPolling}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-gold/30 text-brand-gold text-xs font-medium hover:bg-brand-gold/10 transition-all disabled:opacity-50 mr-2"
                  >
                    {emailPolling ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    {emailPolling ? 'Polling...' : 'Poll Now'}
                  </button>
                  <button
                    onClick={handleEmailDisconnect}
                    disabled={emailDisconnecting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-all disabled:opacity-50"
                  >
                    {emailDisconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unplug className="w-3 h-3" />}
                    Disconnect
                  </button>
                </div>
                {emailPollResult && (
                  <p className="text-xs text-brand-gold px-1">âœ‰ï¸ {emailPollResult}</p>
                )}
                <p className="text-xs text-brand-textMuted">
                  Your email is connected! New customer emails will be answered by AI using your knowledge base and tone settings. Click "Poll Now" to check for new emails, or set up a cron to call the poll endpoint automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Google Sign-in Button */}
                <button
                  onClick={handleGoogleOAuth}
                  disabled={googleOAuthLoading}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-lg bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-all border border-gray-300 shadow-sm"
                >
                  {googleOAuthLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  {googleOAuthLoading ? 'Connecting...' : 'Sign in with Google'}
                </button>

                <p className="text-xs text-center text-brand-textMuted">
                  Instantly connect your Gmail &mdash; no app passwords needed
                </p>

                {emailError && (
                  <p className="text-xs text-red-400">{emailError}</p>
                )}

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-brand-border" />
                  <button
                    onClick={() => setShowManualEmail(!showManualEmail)}
                    className="text-xs text-brand-textMuted hover:text-white transition-colors"
                  >
                    {showManualEmail ? 'Hide manual setup' : 'Or connect manually'}
                  </button>
                  <div className="flex-1 h-px bg-brand-border" />
                </div>

                {/* Collapsible Manual Email Form */}
                {showManualEmail && (
                <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-brand-textMuted mb-1">Email Provider</label>
                    <select
                      value={emailProvider}
                      onChange={e => setEmailProvider(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-white text-sm focus:border-red-400 focus:outline-none"
                    >
                      <option value="gmail">Gmail</option>
                      <option value="outlook">Outlook / Hotmail</option>
                      <option value="yahoo">Yahoo</option>
                      <option value="zoho">Zoho Mail</option>
                      <option value="icloud">iCloud</option>
                      <option value="custom">Custom IMAP/SMTP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-textMuted mb-1">Email Address</label>
                    <input
                      type="email"
                      value={emailAddress}
                      onChange={e => { setEmailAddress(e.target.value); setEmailError(''); }}
                      placeholder="support@company.com"
                      className="w-full px-3 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-white text-sm placeholder:text-brand-textMuted focus:border-red-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-textMuted mb-1">
                    {emailProvider === 'gmail' ? 'App Password' : 'Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showEmailPassword ? 'text' : 'password'}
                      value={emailPassword}
                      onChange={e => { setEmailPassword(e.target.value); setEmailError(''); }}
                      placeholder={emailProvider === 'gmail' ? 'xxxx xxxx xxxx xxxx (Google App Password)' : 'Your email password'}
                      className="w-full px-3 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-white text-sm placeholder:text-brand-textMuted focus:border-red-400 focus:outline-none pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmailPassword(!showEmailPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-textMuted hover:text-white"
                    >
                      {showEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {emailProvider === 'custom' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-brand-textMuted mb-1">IMAP Host</label>
                      <input value={emailImapHost} onChange={e => setEmailImapHost(e.target.value)} placeholder="imap.example.com" className="w-full px-3 py-2 rounded-lg bg-brand-dark border border-brand-border text-white text-xs focus:border-red-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-brand-textMuted mb-1">IMAP Port</label>
                      <input value={emailImapPort} onChange={e => setEmailImapPort(e.target.value)} placeholder="993" className="w-full px-3 py-2 rounded-lg bg-brand-dark border border-brand-border text-white text-xs focus:border-red-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-brand-textMuted mb-1">SMTP Host</label>
                      <input value={emailSmtpHost} onChange={e => setEmailSmtpHost(e.target.value)} placeholder="smtp.example.com" className="w-full px-3 py-2 rounded-lg bg-brand-dark border border-brand-border text-white text-xs focus:border-red-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-brand-textMuted mb-1">SMTP Port</label>
                      <input value={emailSmtpPort} onChange={e => setEmailSmtpPort(e.target.value)} placeholder="587" className="w-full px-3 py-2 rounded-lg bg-brand-dark border border-brand-border text-white text-xs focus:border-red-400 focus:outline-none" />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleEmailConnect}
                  disabled={!emailAddress.trim() || !emailPassword.trim() || emailConnecting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-all"
                >
                  {emailConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {emailConnecting ? 'Testing & Connecting...' : 'Connect Email'}
                </button>

                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-brand-textMuted font-medium mb-1">
                    {emailProvider === 'gmail' ? 'Gmail Setup:' : 'Setup Instructions:'}
                  </p>
                  <ol className="text-xs text-brand-textMuted space-y-0.5 list-decimal list-inside">
                    {emailProvider === 'gmail' ? (
                      <>
                        <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">Google App Passwords</a></li>
                        <li>Create a new app password (select "Mail")</li>
                        <li>Copy the 16-character password and paste above</li>
                        <li>Make sure IMAP is enabled in Gmail Settings â†' Forwarding & POP/IMAP</li>
                      </>
                    ) : (
                      <>
                        <li>Use your email address and password (or app password)</li>
                        <li>IMAP/SMTP settings are auto-filled for known providers</li>
                        <li>We test the connection before saving â€" credentials are encrypted at rest</li>
                      </>
                    )}
                  </ol>
                </div>
                </div>
                )}
              </div>
            )}
          </div>

          {/* Channels Grid */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Support Channels</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {CHANNELS.map(channel => {
                const isTelegram = channel.id === 'telegram';
                const isWhatsApp = channel.id === 'whatsapp';
                const isConnected = isTelegram ? telegramConnected : isWhatsApp ? waConnected : channel.status === 'ready';
                return (
                  <div
                    key={channel.id}
                    className={`rounded-2xl bg-brand-card border border-brand-border p-5 text-center space-y-3 transition-all ${
                      isConnected ? 'hover:border-brand-gold/40' : channel.status === 'ready' ? 'hover:border-brand-gold/40' : 'opacity-60'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center ${
                      isConnected ? 'bg-brand-gold/10 border border-brand-gold/20' : channel.status === 'ready' ? 'bg-brand-gold/10 border border-brand-gold/20' : 'bg-white/5 border border-white/10'
                    }`}>
                      <span className={channel.color}>{channel.icon}</span>
                    </div>
                    <h4 className="text-sm font-medium text-white">{channel.label}</h4>
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        <CheckCircle2 className="w-3 h-3" />
                        {isTelegram ? 'Connected' : 'Ready'}
                      </span>
                    ) : channel.status === 'ready' ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                        Not Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white/5 text-brand-textMuted border border-white/10">
                        Coming Soon
                      </span>
                    )}
                    {isTelegram && telegramConnected && telegramBotUsername && (
                      <p className="text-xs text-sky-400 truncate">@{telegramBotUsername}</p>
                    )}
                    {isWhatsApp && waConnected && waDisplayPhone && (
                      <p className="text-xs text-emerald-400 truncate">{waDisplayPhone}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TAB 3: KNOWLEDGE BASE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === 'knowledge' && (
        <div className="space-y-5 flex-1">
          {/* Search + Filter + Add */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-textMuted" />
              <input
                value={kbSearch}
                onChange={e => setKbSearch(e.target.value)}
                placeholder="Search entries..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-brand-card border border-brand-border text-white text-sm placeholder:text-brand-textMuted focus:border-brand-gold focus:outline-none"
              />
            </div>
            <select
              value={kbFilter}
              onChange={e => setKbFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg bg-brand-card border border-brand-border text-white text-sm focus:border-brand-gold focus:outline-none"
            >
              <option value="all">All Categories</option>
              {KB_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <button
              onClick={() => { setEditingKb(null); setKbForm({ title: '', content: '', category: 'faq', tags: '' }); setShowKbForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-gold to-brand-goldBright text-black font-semibold text-sm hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          </div>

          {/* Add/Edit Form */}
          {showKbForm && (
            <div className="rounded-2xl bg-brand-card border border-brand-gold/30 p-5 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">{editingKb ? 'Edit Entry' : 'Add Knowledge Base Entry'}</h3>
                <button onClick={() => { setShowKbForm(false); setEditingKb(null); }} className="p-1.5 rounded-lg hover:bg-white/10 text-brand-textMuted hover:text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-brand-textMuted mb-1">Question / Title</label>
                  <input
                    value={kbForm.title}
                    onChange={e => setKbForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., What are your business hours?"
                    className="w-full px-4 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-white text-sm placeholder:text-brand-textMuted focus:border-brand-gold focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-brand-textMuted mb-1">Answer / Content</label>
                  <textarea
                    value={kbForm.content}
                    onChange={e => setKbForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="The answer your AI agent should know..."
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-white text-sm placeholder:text-brand-textMuted focus:border-brand-gold focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-textMuted mb-1">Category</label>
                  <select
                    value={kbForm.category}
                    onChange={e => setKbForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-white text-sm focus:border-brand-gold focus:outline-none"
                  >
                    {KB_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-textMuted mb-1">Tags (comma-separated)</label>
                  <input
                    value={kbForm.tags}
                    onChange={e => setKbForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="pricing, hours, delivery"
                    className="w-full px-4 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-white text-sm placeholder:text-brand-textMuted focus:border-brand-gold focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowKbForm(false); setEditingKb(null); }}
                  className="px-4 py-2 rounded-lg border border-brand-border text-brand-textMuted hover:text-white text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveKb}
                  disabled={!kbForm.title.trim() || !kbForm.content.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-brand-gold text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {editingKb ? 'Update Entry' : 'Add Entry'}
                </button>
              </div>
            </div>
          )}

          {/* KB Entries */}
          {kbLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-brand-card border border-brand-border p-4">
                  <div className="space-y-2">
                    <div className="h-4 rounded bg-brand-border/40 animate-pulse" style={{ width: `${50 + (i % 3) * 15}%` }} />
                    <div className="h-3 rounded bg-brand-border/40 animate-pulse" style={{ width: `${70 + (i % 2) * 15}%` }} />
                    <div className="h-3 w-1/3 rounded bg-brand-border/40 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredKb.length === 0 ? (
            <div className="p-16 rounded-2xl bg-brand-card border border-brand-border border-dashed text-center">
              <BookOpen className="w-14 h-14 text-brand-gold/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {kbEntries.length === 0 ? 'No knowledge entries yet' : 'No matching entries'}
              </h3>
              <p className="text-brand-textMuted text-sm max-w-md mx-auto mb-6">
                {kbEntries.length === 0
                  ? 'Add knowledge base entries so your AI agent can answer customer questions accurately.'
                  : 'Try adjusting your search or filter.'
                }
              </p>
              {kbEntries.length === 0 && (
                <button
                  onClick={() => { setShowKbForm(true); setEditingKb(null); setKbForm({ title: '', content: '', category: 'faq', tags: '' }); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-brand-gold to-brand-goldBright text-black font-semibold text-sm hover:opacity-90 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Entry
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredKb.map(entry => {
                const cat = KB_CATEGORIES.find(c => c.value === entry.category);
                return (
                  <div key={entry.id} className={`rounded-xl bg-brand-card border border-brand-border p-4 hover:border-brand-gold/20 transition-all group ${entry.is_active === false ? 'opacity-50' : ''}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h4 className="font-medium text-white text-sm">{entry.title}</h4>
                          {cat && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${cat.color}`}>
                              {cat.label}
                            </span>
                          )}
                          {entry.is_active === false && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-brand-textMuted">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-brand-textMuted line-clamp-2">{entry.content}</p>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {entry.tags.map(tag => (
                              <span key={tag} className="inline-flex items-center gap-1 text-xs text-brand-textMuted bg-white/5 px-2 py-0.5 rounded">
                                <Tag className="w-2.5 h-2.5" />{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => startEditKb(entry)}
                          className="p-2 rounded-lg hover:bg-white/10 text-brand-textMuted hover:text-white transition-all"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteKb(entry.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-brand-textMuted hover:text-red-400 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TAB 4: TONE & STYLE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === 'tone' && (
        <div className="space-y-6 flex-1">
          {/* Tone Selector */}
          <div className="rounded-2xl bg-brand-card border border-brand-border p-6 space-y-4">
            <h3 className="text-white font-semibold">Tone</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {TONES.map(tone => (
                <button
                  key={tone.value}
                  onClick={() => setSettings(prev => ({ ...prev, tone: tone.value }))}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    settings.tone === tone.value
                      ? 'bg-brand-gold/10 border-brand-gold/40 ring-1 ring-brand-gold/20'
                      : 'bg-brand-dark border-brand-border hover:border-brand-gold/20'
                  }`}
                >
                  <span className="text-2xl mb-2 block">{tone.icon}</span>
                  <h4 className={`text-sm font-semibold mb-1 ${settings.tone === tone.value ? 'text-brand-gold' : 'text-white'}`}>
                    {tone.label}
                  </h4>
                  <p className="text-xs text-brand-textMuted">{tone.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="rounded-2xl bg-brand-card border border-brand-border p-6 space-y-4">
            <h3 className="text-white font-semibold">Language</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'english', label: 'English', flag: 'ðŸ‡¬ðŸ‡§' },
                { value: 'arabic', label: 'Arabic (Ø§Ù"Ø¹Ø±Ø¨ÙŠØ©)', flag: 'ðŸ‡¸ðŸ‡¦' },
                { value: 'bilingual', label: 'Bilingual (EN + AR)', flag: 'ðŸŒ' },
              ].map(lang => (
                <button
                  key={lang.value}
                  onClick={() => setSettings(prev => ({ ...prev, language: lang.value }))}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    settings.language === lang.value
                      ? 'bg-brand-gold/10 border-brand-gold/40 ring-1 ring-brand-gold/20'
                      : 'bg-brand-dark border-brand-border hover:border-brand-gold/20'
                  }`}
                >
                  <span className="text-2xl mb-2 block">{lang.flag}</span>
                  <h4 className={`text-sm font-semibold ${settings.language === lang.value ? 'text-brand-gold' : 'text-white'}`}>
                    {lang.label}
                  </h4>
                </button>
              ))}
            </div>
          </div>

          {/* Response Length */}
          <div className="rounded-2xl bg-brand-card border border-brand-border p-6 space-y-4">
            <h3 className="text-white font-semibold">Response Length</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {RESPONSE_LENGTHS.map(len => (
                <button
                  key={len.value}
                  onClick={() => setSettings(prev => ({ ...prev, response_length: len.value }))}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    settings.response_length === len.value
                      ? 'bg-brand-gold/10 border-brand-gold/40 ring-1 ring-brand-gold/20'
                      : 'bg-brand-dark border-brand-border hover:border-brand-gold/20'
                  }`}
                >
                  <h4 className={`text-sm font-semibold mb-1 ${settings.response_length === len.value ? 'text-brand-gold' : 'text-white'}`}>
                    {len.label}
                  </h4>
                  <p className="text-xs text-brand-textMuted">{len.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="rounded-2xl bg-brand-card border border-brand-border p-6 space-y-4">
            <h3 className="text-white font-semibold">Custom Instructions</h3>
            <p className="text-sm text-brand-textMuted">Additional instructions for how the AI agent should behave.</p>
            <textarea
              value={settings.custom_instructions || ''}
              onChange={e => setSettings(prev => ({ ...prev, custom_instructions: e.target.value }))}
              placeholder="e.g., Always greet customers by name, mention our current promotions, never promise exact delivery times..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-brand-dark border border-brand-border text-white text-sm placeholder:text-brand-textMuted focus:border-brand-gold focus:outline-none resize-none"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={settingsLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-brand-gold to-brand-goldBright text-black font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {settingsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : settingsSaved ? (
                <Check className="w-4 h-4" />
              ) : null}
              {settingsSaved ? 'Settings Saved!' : 'Save Tone & Style Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
