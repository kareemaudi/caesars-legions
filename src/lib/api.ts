// Mubyn API client — connects to backend
const API_BASE = import.meta.env.VITE_API_URL || 'https://natural-energy-production-df04.up.railway.app';

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('mubyn-user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getToken(): string | null {
  const user = getStoredUser();
  return user?.token || null;
}

function getUserId(): string {
  const user = getStoredUser();
  return user?.id || user?.email || 'anonymous';
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// Get user settings (business info, smtp, etc.)
export async function getSettings(): Promise<{ business?: { business_name?: string; industry?: string; country?: string; website?: string; description?: string }; smtp?: { email?: string; host?: string; port?: number; connected?: boolean } }> {
  const res = await fetch(`${API_BASE}/api/settings/${getUserId()}`, { headers: authHeaders() });
  if (!res.ok) return {};
  return res.json();
}

// Auth
export async function signup(email: string, password: string, name: string, businessName: string, extra?: { industry?: string; country?: string; website?: string; primaryNeed?: string }) {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, business_name: businessName, ...extra }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Signup failed' }));
    throw new Error(err.error || 'Signup failed');
  }
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(err.error || 'Invalid email or password');
  }
  return res.json();
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Auth check failed');
  return res.json();
}

// Caesar Chat
export async function sendChat(message: string) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message, userId: getUserId() }),
  });
  if (!res.ok) throw new Error('Chat failed');
  return res.json();
}

// Caesar Chat with Streaming (Server-Sent Events)
export async function sendChatStream(
  message: string,
  onChunk: (chunk: string) => void,
  onModel?: (model: string) => void,
  onDone?: (fullResponse: string) => void,
  onError?: (error: string) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message, userId: getUserId() }),
  });

  if (!res.ok) {
    onError?.('Chat stream failed');
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError?.('No stream available');
    return;
  }

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

    for (const line of lines) {
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'chunk' && data.content) {
          onChunk(data.content);
        } else if (data.type === 'model' && data.model) {
          onModel?.(data.model);
        } else if (data.type === 'done') {
          onDone?.(data.fullResponse || '');
        } else if (data.type === 'error') {
          onError?.(data.error || 'Unknown error');
        }
      } catch { /* ignore parse errors */ }
    }
  }
}

// Leads — uses /api/chat with GPT-4o for AI-powered lead discovery
export async function searchLeadsAI(industry: string, location: string) {
  const prompt = `Find me 10 real ${industry} businesses in ${location} with their contact details. Return ONLY a valid JSON array (no markdown, no explanation) with objects containing these exact fields: name (string), company (string), title (string), email (string), phone (string), location (string). Make them realistic and relevant to the ${location} market.`;
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message: prompt, userId: getUserId() }),
  });
  if (!res.ok) throw new Error('Lead search failed');
  return res.json();
}

// Legacy leads search (direct endpoint)
export async function searchLeads(query: string, location: string, industry: string) {
  const res = await fetch(`${API_BASE}/api/leads/search`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ query, location, industry, userId: getUserId() }),
  });
  if (!res.ok) throw new Error('Lead search failed');
  return res.json();
}

export async function getLeads() {
  const res = await fetch(`${API_BASE}/api/leads/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch leads');
  return res.json();
}

// Generate leads using AI (GPT-4o finds real businesses)
export async function generateLeads(industry: string, country: string, city: string, count: number) {
  const res = await fetch(`${API_BASE}/api/leads/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ industry, country, city, count, userId: getUserId() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Lead generation failed' }));
    throw new Error(err.error || 'Lead generation failed');
  }
  return res.json();
}

// Update lead status
export async function updateLead(leadId: string, updates: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/api/leads/${getUserId()}/${leadId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Lead update failed');
  return res.json();
}

// Generate email draft for a lead
export async function generateEmailDraft(leadId: string, businessContext?: string, objective?: string) {
  const res = await fetch(`${API_BASE}/api/leads/${getUserId()}/${leadId}/email-draft`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ businessContext, objective }),
  });
  if (!res.ok) throw new Error('Email draft generation failed');
  return res.json();
}

// Send email to a lead via SMTP
export async function sendLeadEmail(leadId: string, subject?: string, body?: string, sequence?: string) {
  const res = await fetch(`${API_BASE}/api/leads/send`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId: getUserId(), leadId, subject, body, sequence }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Email send failed' }));
    throw new Error(err.error || 'Email send failed');
  }
  return res.json();
}

// Get daily send quota status
export async function getSendStatus() {
  const res = await fetch(`${API_BASE}/api/leads/send/status`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch send status');
  return res.json();
}

// Delete a lead
export async function deleteLead(leadId: string) {
  const res = await fetch(`${API_BASE}/api/leads/${getUserId()}/${leadId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

// Campaigns
export async function createCampaign(data: { name: string; objective?: string; industry?: string; country?: string; city?: string }) {
  const res = await fetch(`${API_BASE}/api/leads/campaign`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...data, userId: getUserId() }),
  });
  if (!res.ok) throw new Error('Campaign creation failed');
  return res.json();
}

export async function getCampaigns() {
  const res = await fetch(`${API_BASE}/api/leads/campaigns/${getUserId()}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch campaigns');
  return res.json();
}

// Batch email draft generation
export async function batchGenerateEmails(leadIds: string[], objective?: string) {
  const res = await fetch(`${API_BASE}/api/leads/email`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId: getUserId(), leadIds, objective }),
  });
  if (!res.ok) throw new Error('Batch email generation failed');
  return res.json();
}

// Content / Calendar
export async function generateCalendar(businessName: string, industry: string, language: string) {
  const res = await fetch(`${API_BASE}/api/content/calendar`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ business_name: businessName, industry, language, userId: getUserId() }),
  });
  if (!res.ok) throw new Error('Calendar generation failed');
  return res.json();
}

export async function generateContent(topic: string, platform: string, language: string) {
  const res = await fetch(`${API_BASE}/api/content/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ topic, platform, language, userId: getUserId() }),
  });
  if (!res.ok) throw new Error('Content generation failed');
  return res.json();
}

export async function getContent() {
  const res = await fetch(`${API_BASE}/api/content/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch content');
  return res.json();
}

// Content Image Generation (DALL-E 3)
export async function generateContentImage(prompt: string, size?: string) {
  const res = await fetch(`${API_BASE}/api/content/image`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ prompt, size: size || '1024x1024' }),
  });
  if (!res.ok) throw new Error('Image generation failed');
  return res.json();
}

// CSA (Customer Support Agent)
export async function csaRespond(customerMessage: string, businessContext: string, knowledgeBase?: Array<{title: string; content: string}>, tone?: string, language?: string) {
  const res = await fetch(`${API_BASE}/api/csa/respond`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      customer_message: customerMessage,
      business_context: businessContext,
      userId: getUserId(),
      knowledge_base: knowledgeBase,
      tone,
      language,
    }),
  });
  if (!res.ok) throw new Error('CSA failed');
  return res.json();
}

export async function getCsaConversations() {
  const res = await fetch(`${API_BASE}/api/csa/conversations/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

// CSA Knowledge Base
export async function getCsaKnowledge() {
  const res = await fetch(`${API_BASE}/api/csa/knowledge/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch knowledge base');
  return res.json();
}

export async function saveCsaKnowledge(entry: { title: string; content: string; category?: string; tags?: string[]; is_active?: boolean }) {
  const res = await fetch(`${API_BASE}/api/csa/knowledge`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...entry, userId: getUserId() }),
  });
  if (!res.ok) throw new Error('Failed to save knowledge entry');
  return res.json();
}

export async function updateCsaKnowledge(entryId: string, updates: { title?: string; content?: string; category?: string; tags?: string[]; is_active?: boolean }) {
  const res = await fetch(`${API_BASE}/api/csa/knowledge/${getUserId()}/${entryId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update knowledge entry');
  return res.json();
}

export async function deleteCsaKnowledge(entryId: string) {
  const res = await fetch(`${API_BASE}/api/csa/knowledge/${getUserId()}/${entryId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete knowledge entry');
  return res.json();
}

// CSA Settings
export async function getCsaSettings() {
  const res = await fetch(`${API_BASE}/api/csa/settings/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch CSA settings');
  return res.json();
}

export async function saveCsaSettings(settings: Record<string, any>) {
  const res = await fetch(`${API_BASE}/api/csa/settings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...settings, userId: getUserId() }),
  });
  if (!res.ok) throw new Error('Failed to save CSA settings');
  return res.json();
}

// CSA Widget
export async function getCsaWidget() {
  const res = await fetch(`${API_BASE}/api/csa/widget/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch widget');
  return res.json();
}

// Website Widget
export async function getWebsiteWidget() {
  const res = await fetch(`${API_BASE}/api/website/widget/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch widget');
  return res.json();
}

export async function saveWidgetConfig(config: {
  primaryColor?: string;
  position?: string;
  welcomeMessage?: string;
  botName?: string;
  buttonText?: string;
}) {
  const res = await fetch(`${API_BASE}/api/website/widget/config`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId: getUserId(), ...config }),
  });
  if (!res.ok) throw new Error('Failed to save widget config');
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
// CSA Telegram Bot
// ═══════════════════════════════════════════════════════════════════

export async function connectCsaTelegram(botToken: string) {
  const res = await fetch(`${API_BASE}/api/csa/telegram/connect`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId: getUserId(), bot_token: botToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Connection failed' }));
    throw new Error(err.error || 'Failed to connect Telegram bot');
  }
  return res.json();
}

export async function disconnectCsaTelegram() {
  const res = await fetch(`${API_BASE}/api/csa/telegram/disconnect`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId: getUserId() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Disconnect failed' }));
    throw new Error(err.error || 'Failed to disconnect Telegram bot');
  }
  return res.json();
}

export async function getCsaTelegramStatus() {
  const res = await fetch(`${API_BASE}/api/csa/telegram/status/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch Telegram status');
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
// CFO — Financial Intelligence
// ═══════════════════════════════════════════════════════════════════

export async function generateCFOData(data: { industry?: string; location?: string; businessName?: string; monthlyRevenue?: number; monthlyExpenses?: number }) {
  const res = await fetch(`${API_BASE}/api/cfo/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...data, userId: getUserId() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'CFO generation failed' }));
    throw new Error(err.error || 'CFO generation failed');
  }
  return res.json();
}

export async function getCFOData() {
  const res = await fetch(`${API_BASE}/api/cfo/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch CFO data');
  return res.json();
}

export async function addTransaction(data: { type: 'income' | 'expense'; amount: number; category?: string; description?: string; date?: string }) {
  const res = await fetch(`${API_BASE}/api/cfo/transaction`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...data, userId: getUserId() }),
  });
  if (!res.ok) throw new Error('Failed to add transaction');
  return res.json();
}

export async function getTransactions() {
  const res = await fetch(`${API_BASE}/api/cfo/transactions/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function deleteTransaction(txId: string) {
  const res = await fetch(`${API_BASE}/api/cfo/transaction/${getUserId()}/${txId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete transaction');
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
// CSA Email Channel
// ═══════════════════════════════════════════════════════════════════

export async function connectCsaEmail(data: { email: string; password: string; provider: string; imap_host?: string; imap_port?: number; smtp_host?: string; smtp_port?: number }) {
  const res = await fetch(`${API_BASE}/api/csa/email/connect`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...data, userId: getUserId() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Email connection failed' }));
    throw new Error(err.error || 'Email connection failed');
  }
  return res.json();
}

export async function getCsaEmailStatus() {
  const res = await fetch(`${API_BASE}/api/csa/email/status/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch email status');
  return res.json();
}

export async function disconnectCsaEmail() {
  const res = await fetch(`${API_BASE}/api/csa/email/disconnect/${getUserId()}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Disconnect failed');
  return res.json();
}

export async function pollCsaEmail() {
  const res = await fetch(`${API_BASE}/api/csa/email/poll/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Poll failed' }));
    throw new Error(err.error || 'Email poll failed');
  }
  return res.json();
}

export async function sendCsaEmail(data: { to: string; subject: string; body: string; inReplyTo?: string }) {
  const res = await fetch(`${API_BASE}/api/csa/email/send`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...data, userId: getUserId() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Send failed' }));
    throw new Error(err.error || 'Email send failed');
  }
  return res.json();
}

export async function getCsaEmailConversations() {
  const res = await fetch(`${API_BASE}/api/csa/email/conversations/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch email conversations');
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
// 🌐 AI Website Builder
// ═══════════════════════════════════════════════════════════════════

export async function generateWebsite(data: {
  businessName: string;
  description?: string;
  industry?: string;
  style?: string;
  language?: string;
  phone?: string;
  email?: string;
  address?: string;
  whatsapp?: string;
}) {
  const res = await fetch(`${API_BASE}/api/website/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...data, userId: getUserId() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Website generation failed' }));
    throw new Error(err.error || 'Website generation failed');
  }
  return res.json();
}

export async function getWebsiteMeta() {
  const res = await fetch(`${API_BASE}/api/website/meta/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch website meta');
  return res.json();
}

export async function publishWebsite() {
  const res = await fetch(`${API_BASE}/api/website/publish`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId: getUserId() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Publish failed' }));
    throw new Error(err.error || 'Publish failed');
  }
  return res.json();
}

export async function editWebsite(instruction: string) {
  const res = await fetch(`${API_BASE}/api/website/edit`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ userId: getUserId(), instruction }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Edit failed' }));
    throw new Error(err.error || 'Edit failed');
  }
  return res.json();
}

export function getWebsitePreviewUrl() {
  return `${API_BASE}/api/website/preview/${getUserId()}`;
}

export { API_BASE };

// ═══════════════════════════════════════════════════════════════════
// 🛒 Shopify Integration
// ═══════════════════════════════════════════════════════════════════

// Shopify OAuth — Get install URL and redirect user
export async function getShopifyOAuthUrl(shop: string): Promise<{ installUrl: string; shop: string; state: string }> {
  const userId = getUserId();
  const res = await fetch(`${API_BASE}/api/integrations/shopify/oauth/install?shop=${encodeURIComponent(shop)}&userId=${encodeURIComponent(userId)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to get OAuth URL' }));
    throw new Error(err.error || 'Failed to initiate Shopify OAuth');
  }
  return res.json();
}

// Redirect user to Shopify OAuth
export async function startShopifyOAuth(shop: string) {
  const data = await getShopifyOAuthUrl(shop);
  window.location.href = data.installUrl;
}

export async function connectShopify(storeUrl: string, accessToken: string) {
  const res = await fetch(`${API_BASE}/api/integrations/shopify/connect`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId: getUserId(), storeUrl, accessToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Connection failed' }));
    throw new Error(err.error || 'Failed to connect Shopify store');
  }
  return res.json();
}

export async function getShopifyStatus() {
  const res = await fetch(`${API_BASE}/api/integrations/shopify/status/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch Shopify status');
  return res.json();
}

export async function disconnectShopify() {
  const res = await fetch(`${API_BASE}/api/integrations/shopify/disconnect/${getUserId()}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to disconnect Shopify');
  return res.json();
}

export async function getShopifyProducts() {
  const res = await fetch(`${API_BASE}/api/integrations/shopify/products/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch Shopify products');
  return res.json();
}

export async function getShopifyOrders() {
  const res = await fetch(`${API_BASE}/api/integrations/shopify/orders/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch Shopify orders');
  return res.json();
}

export async function getShopifyAnalytics() {
  const res = await fetch(`${API_BASE}/api/integrations/shopify/analytics/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch Shopify analytics');
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
// 📢 Meta Ads Integration
// ═══════════════════════════════════════════════════════════════════

export async function connectMeta(accessToken: string, adAccountId: string) {
  const res = await fetch(`${API_BASE}/api/integrations/meta/connect`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId: getUserId(), accessToken, adAccountId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Meta connection failed' }));
    throw new Error(err.error || 'Failed to connect Meta Ads');
  }
  return res.json();
}

export async function getMetaStatus() {
  const res = await fetch(`${API_BASE}/api/integrations/meta/status/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch Meta status');
  return res.json();
}

export async function disconnectMeta() {
  const res = await fetch(`${API_BASE}/api/integrations/meta/disconnect/${getUserId()}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Meta disconnect failed');
  return res.json();
}

export async function getMetaCampaigns() {
  const res = await fetch(`${API_BASE}/api/integrations/meta/campaigns/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch campaigns' }));
    throw new Error(err.error || 'Failed to fetch Meta campaigns');
  }
  return res.json();
}

export async function createMetaCampaign(data: { name: string; objective: string; dailyBudget?: number; status?: string }) {
  const res = await fetch(`${API_BASE}/api/integrations/meta/campaign/create`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...data, userId: getUserId() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Campaign creation failed' }));
    throw new Error(err.error || 'Failed to create Meta campaign');
  }
  return res.json();
}

export async function getMetaInsights() {
  const res = await fetch(`${API_BASE}/api/integrations/meta/insights/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch insights' }));
    throw new Error(err.error || 'Failed to fetch Meta insights');
  }
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
// 🔍 Google Ads Integration
// ═══════════════════════════════════════════════════════════════════

export async function connectGoogleAds(developerToken: string, clientId: string, clientSecret: string, refreshToken: string, customerId: string) {
  const res = await fetch(`${API_BASE}/api/integrations/google-ads/connect`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId: getUserId(), developerToken, clientId, clientSecret, refreshToken, customerId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Google Ads connection failed' }));
    throw new Error(err.error || 'Failed to connect Google Ads');
  }
  return res.json();
}

export async function getGoogleAdsStatus() {
  const res = await fetch(`${API_BASE}/api/integrations/google-ads/status/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch Google Ads status');
  return res.json();
}

export async function disconnectGoogleAds() {
  const res = await fetch(`${API_BASE}/api/integrations/google-ads/disconnect/${getUserId()}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Google Ads disconnect failed');
  return res.json();
}

export async function getGoogleAdsCampaigns() {
  const res = await fetch(`${API_BASE}/api/integrations/google-ads/campaigns/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch campaigns' }));
    throw new Error(err.error || 'Failed to fetch Google Ads campaigns');
  }
  return res.json();
}

export async function getGoogleAdsInsights() {
  const res = await fetch(`${API_BASE}/api/integrations/google-ads/insights/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch insights' }));
    throw new Error(err.error || 'Failed to fetch Google Ads insights');
  }
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
// 📱 CSA WhatsApp Business Channel
// ═══════════════════════════════════════════════════════════════════

export async function connectWhatsApp(phoneNumberId: string, accessToken: string, businessAccountId: string, webhookVerifyToken: string) {
  const res = await fetch(`${API_BASE}/api/csa/whatsapp/connect`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId: getUserId(), phoneNumberId, accessToken, businessAccountId, webhookVerifyToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Connection failed' }));
    throw new Error(err.error || 'Failed to connect WhatsApp');
  }
  return res.json();
}

export async function getWhatsAppStatus() {
  const res = await fetch(`${API_BASE}/api/csa/whatsapp/status/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch WhatsApp status');
  return res.json();
}

export async function disconnectWhatsApp() {
  const res = await fetch(`${API_BASE}/api/csa/whatsapp/disconnect/${getUserId()}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Disconnect failed');
  return res.json();
}

export async function getWhatsAppConversations() {
  const res = await fetch(`${API_BASE}/api/csa/whatsapp/conversations/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch WhatsApp conversations');
  return res.json();
}

export async function sendWhatsAppMessage(to: string, message: string) {
  const res = await fetch(`${API_BASE}/api/csa/whatsapp/send`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId: getUserId(), to, message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Send failed' }));
    throw new Error(err.error || 'WhatsApp send failed');
  }
  return res.json();
}

export async function toggleWhatsAppAutoReply(autoReply: boolean) {
  const res = await fetch(`${API_BASE}/api/csa/whatsapp/auto-reply/${getUserId()}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ autoReply }),
  });
  if (!res.ok) throw new Error('Failed to toggle auto-reply');
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
// 🖼️ Logo Upload
// ═══════════════════════════════════════════════════════════════════

export async function uploadLogo(logo: string) {
  const res = await fetch(`${API_BASE}/api/settings/logo`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId: getUserId(), logo }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Logo upload failed' }));
    throw new Error(err.error || 'Logo upload failed');
  }
  return res.json();
}

export function getLogoUrl() {
  return `${API_BASE}/api/settings/logo/${getUserId()}`;
}

// ═══════════════════════════════════════════════════════════════════
// 📧 Google OAuth for Email
// ═══════════════════════════════════════════════════════════════════

export async function getGoogleOAuthUrl(): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE}/api/csa/email/oauth/google/url`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to get OAuth URL' }));
    throw new Error(err.error || 'Failed to get Google OAuth URL');
  }
  return res.json();
}

export async function getEmailOAuthStatus(provider: string): Promise<{
  connected: boolean;
  provider?: string;
  email?: string;
  connected_at?: string;
  last_poll_at?: string;
  manual_connected?: boolean;
}> {
  const res = await fetch(`${API_BASE}/api/csa/email/oauth/status/${getUserId()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch OAuth status');
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
// 🔐 Meta Ads OAuth
// ═══════════════════════════════════════════════════════════════════

export async function getMetaOAuthUrl() {
  const res = await fetch(`${API_BASE}/api/integrations/meta/oauth/url`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to get Meta OAuth URL');
  return res.json();
}

export async function completeMetaOAuth(state: string, adAccountId?: string) {
  const res = await fetch(`${API_BASE}/api/integrations/meta/oauth/complete`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId: getUserId(), state, adAccountId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'OAuth completion failed' }));
    throw new Error(err.error || 'Failed to complete Meta OAuth');
  }
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
// 🔐 Google Ads OAuth
// ═══════════════════════════════════════════════════════════════════

export async function getGoogleAdsOAuthUrl() {
  const res = await fetch(`${API_BASE}/api/integrations/google-ads/oauth/url`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to get Google Ads OAuth URL');
  return res.json();
}

export async function completeGoogleAdsOAuth(state: string, customerId?: string, developerToken?: string) {
  const res = await fetch(`${API_BASE}/api/integrations/google-ads/oauth/complete`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId: getUserId(), state, customerId, developerToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'OAuth completion failed' }));
    throw new Error(err.error || 'Failed to complete Google Ads OAuth');
  }
  return res.json();
}

// Alias for backward compatibility
export const sendChatMessage = sendChat;
