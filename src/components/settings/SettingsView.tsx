import { useState, useEffect, useRef, useCallback } from 'react';
import { Building2, CreditCard, Mail, LogOut, Check, Loader2, Send, Shield, ShoppingBag, ExternalLink, Unplug, Package, ShoppingCart, TrendingUp, AlertCircle, X, Megaphone, Eye, MousePointerClick, BarChart3, Search, DollarSign, Target, Upload, ImageIcon, ChevronDown, ChevronUp, Database, RefreshCw, Table2, Cpu, Sparkles } from 'lucide-react';
import { getStoredUser, connectShopify, getShopifyStatus, disconnectShopify, getShopifyProducts, getShopifyAnalytics, startShopifyOAuth, connectMeta, getMetaStatus, disconnectMeta, getMetaCampaigns, getMetaInsights, getMetaOAuthUrl, completeMetaOAuth, connectGoogleAds, getGoogleAdsStatus, disconnectGoogleAds, getGoogleAdsCampaigns, getGoogleAdsInsights, getGoogleAdsOAuthUrl, completeGoogleAdsOAuth, uploadLogo, getLogoUrl } from '@/lib/api';
import { useLang } from '@/lib/i18n';

const API_BASE = import.meta.env.VITE_API_URL || 'https://natural-energy-production-df04.up.railway.app';

function CollapsibleSection({ icon: Icon, title, subtitle, completed, completedLabel, defaultOpen, children }: {
  icon: any; title: string; subtitle?: string; completed?: boolean; completedLabel?: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? !completed);
  return (
    <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-brand-gold" />
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            {subtitle && <p className="text-brand-textMuted text-sm">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {completed && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-medium">{completedLabel || 'Done'}</span>
            </div>
          )}
          {open ? <ChevronUp className="w-5 h-5 text-brand-textMuted" /> : <ChevronDown className="w-5 h-5 text-brand-textMuted" />}
        </div>
      </button>
      {open && <div className="px-6 pb-6 border-t border-brand-border/50 pt-4">{children}</div>}
    </div>
  );
}

export function SettingsView() {
  const user = getStoredUser();
  const { t } = useLang();
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('');
  // Email SMTP settings for outreach
  const [smtpEmail, setSmtpEmail] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [saving, setSaving] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedSmtp, setSavedSmtp] = useState(false);
  const [smtpConnected, setSmtpConnected] = useState(false);
  const [showSmtpForm, setShowSmtpForm] = useState(false);
  // Shopify integration state
  const [shopifyStoreUrl, setShopifyStoreUrl] = useState('');
  const [shopifyAccessToken, setShopifyAccessToken] = useState('');
  const [shopifyConnecting, setShopifyConnecting] = useState(false);
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyShop, setShopifyShop] = useState<{ name?: string; domain?: string; email?: string; plan?: string; currency?: string; connectedAt?: string } | null>(null);
  const [shopifyError, setShopifyError] = useState('');
  const [shopifyProductCount, setShopifyProductCount] = useState<number | null>(null);
  const [shopifyOrderCount, setShopifyOrderCount] = useState<number | null>(null);
  const [shopifyRevenue, setShopifyRevenue] = useState<string | null>(null);
  const [shopifyCurrency, setShopifyCurrency] = useState('USD');
  const [shopifyDisconnecting, setShopifyDisconnecting] = useState(false);
  const [showShopifyInstructions, setShowShopifyInstructions] = useState(false);
  const [shopifyOAuthShop, setShopifyOAuthShop] = useState('');
  const [shopifyOAuthLoading, setShopifyOAuthLoading] = useState(false);
  const [showManualShopify, setShowManualShopify] = useState(false);
  // Meta Ads integration state
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [metaAdAccountId, setMetaAdAccountId] = useState('');
  const [metaConnecting, setMetaConnecting] = useState(false);
  const [metaConnected, setMetaConnected] = useState(false);
  const [metaUser, setMetaUser] = useState<{ name?: string; id?: string; adAccountId?: string; connectedAt?: string } | null>(null);
  const [metaError, setMetaError] = useState('');
  const [metaCampaignCount, setMetaCampaignCount] = useState<number | null>(null);
  const [metaInsights, setMetaInsights] = useState<{ spend?: number; impressions?: number; clicks?: number; ctr?: string; conversions?: number } | null>(null);
  const [metaDisconnecting, setMetaDisconnecting] = useState(false);
  const [showMetaInstructions, setShowMetaInstructions] = useState(false);
  const [showMetaManualForm, setShowMetaManualForm] = useState(false);
  const [metaOAuthLoading, setMetaOAuthLoading] = useState(false);
  // Google Ads integration state
  const [gaDeveloperToken, setGaDeveloperToken] = useState('');
  const [gaClientId, setGaClientId] = useState('');
  const [gaClientSecret, setGaClientSecret] = useState('');
  const [gaRefreshToken, setGaRefreshToken] = useState('');
  const [gaCustomerId, setGaCustomerId] = useState('');
  const [gaConnecting, setGaConnecting] = useState(false);
  const [gaConnected, setGaConnected] = useState(false);
  const [gaAccount, setGaAccount] = useState<{ accountName?: string; customerId?: string; connectedAt?: string } | null>(null);
  const [gaError, setGaError] = useState('');
  const [gaCampaignCount, setGaCampaignCount] = useState<number | null>(null);
  const [gaInsights, setGaInsights] = useState<{ spend?: number; impressions?: number; clicks?: number; ctr?: string; conversions?: number; costPerConversion?: number } | null>(null);
  const [gaDisconnecting, setGaDisconnecting] = useState(false);
  const [showGaInstructions, setShowGaInstructions] = useState(false);
  const [showGaManualForm, setShowGaManualForm] = useState(false);
  const [gaOAuthLoading, setGaOAuthLoading] = useState(false);
  // Supabase / Custom API integration state
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');
  const [sbProjectName, setSbProjectName] = useState('');
  const [sbConnecting, setSbConnecting] = useState(false);
  const [sbConnected, setSbConnected] = useState(false);
  const [sbError, setSbError] = useState('');
  const [sbTables, setSbTables] = useState<string[]>([]);
  const [sbProject, setSbProject] = useState('');
  const [sbConnectedAt, setSbConnectedAt] = useState('');
  const [sbSyncing, setSbSyncing] = useState(false);
  const [sbSyncResult, setSbSyncResult] = useState<any>(null);
  const [sbDisconnecting, setSbDisconnecting] = useState(false);
  // AI Model preference state
  const [aiModelPref, setAiModelPref] = useState<'auto' | 'falcon' | 'gpt4o'>(() => {
    try {
      const stored = localStorage.getItem('mubyn-ai-model');
      if (stored === 'falcon' || stored === 'gpt4o') return stored;
    } catch {}
    return 'auto';
  });

  const handleAiModelChange = (value: 'auto' | 'falcon' | 'gpt4o') => {
    setAiModelPref(value);
    try { localStorage.setItem('mubyn-ai-model', value); } catch {}
  };

  // Logo state
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoSaved, setLogoSaved] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [logoDragging, setLogoDragging] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Settings — Mubyn';
    // Load from localStorage first (instant)
    if (user) {
      setBusinessName(user.business_name || '');
      setIndustry(user.industry || '');
      setDescription(user.description || '');
      setWebsite(user.website || '');
      setCountry(user.country || '');
    }
    // Then fetch from API (authoritative source)
    if (user?.id) {
      const token = localStorage.getItem('mubyn-token') || user?.token;
      fetch(`${API_BASE}/api/settings/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.settings || data) {
            const s = data.settings || data;
            if (s.business_name) setBusinessName(s.business_name);
            if (s.industry) setIndustry(s.industry);
            if (s.description) setDescription(s.description);
            if (s.website) setWebsite(s.website);
            if (s.country) setCountry(s.country);
          }
        })
        .catch(() => {}); // silently fail — localStorage fallback already set
    }
    // Load SMTP settings
    try {
      const smtp = JSON.parse(localStorage.getItem('mubyn-smtp') || '{}');
      if (smtp.email) { setSmtpEmail(smtp.email); setSmtpConnected(true); }
      if (smtp.host) setSmtpHost(smtp.host);
      if (smtp.port) setSmtpPort(smtp.port);
    } catch {}

    // Load current logo
    const logoUrl = getLogoUrl();
    const img = new Image();
    img.onload = () => setLogoPreview(logoUrl);
    img.onerror = () => {}; // No logo yet
    img.src = logoUrl + '?t=' + Date.now();

    // Check for Shopify OAuth callback params in URL
    const urlParams = new URLSearchParams(window.location.search);
    const shopifyParam = urlParams.get('shopify');
    if (shopifyParam === 'connected') {
      // OAuth completed successfully — clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (shopifyParam === 'error') {
      const msg = urlParams.get('message') || 'OAuth connection failed';
      setShopifyError(msg);
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Check for Meta OAuth callback params
    const metaOAuth = urlParams.get('meta_oauth');
    if (metaOAuth === 'success') {
      const metaState = urlParams.get('meta_state');
      const metaUser = urlParams.get('meta_user');
      const metaPrimaryAccount = urlParams.get('meta_primary_account');
      if (metaState) {
        // Complete the OAuth flow
        completeMetaOAuth(metaState, metaPrimaryAccount || undefined).then((result) => {
          setMetaConnected(true);
          setMetaUser({
            name: result.user?.name || metaUser || 'Meta Account',
            id: result.user?.id,
            adAccountId: result.adAccountId,
            connectedAt: new Date().toISOString(),
          });
          loadMetaSummary();
        }).catch((e) => {
          setMetaError(e.message || 'Failed to complete Meta OAuth');
        });
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
    const metaErrorParam = urlParams.get('meta_error');
    if (metaErrorParam) {
      setMetaError(decodeURIComponent(metaErrorParam));
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Check for Google Ads OAuth callback params
    const googleOAuth = urlParams.get('google_oauth');
    if (googleOAuth === 'success') {
      const googleState = urlParams.get('google_state');
      if (googleState) {
        // For Google Ads, we need customer ID — show a prompt or set connected
        // Store the state so user can provide customer ID
        setGaOAuthLoading(false);
        // Auto-complete if possible
        completeGoogleAdsOAuth(googleState).then((result) => {
          setGaConnected(true);
          setGaAccount({
            accountName: result.accountName || 'Google Ads Account',
            customerId: result.customerId,
            connectedAt: new Date().toISOString(),
          });
          loadGaSummary();
        }).catch((e) => {
          setGaError(e.message || 'Failed to complete Google Ads OAuth');
        });
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
    const googleErrorParam = urlParams.get('google_error');
    if (googleErrorParam) {
      setGaError(decodeURIComponent(googleErrorParam));
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Load Shopify status
    loadShopifyStatus();
    // Load Meta status
    loadMetaStatus();
    // Load Google Ads status
    loadGaStatus();
    // Load Supabase status
    loadSupabaseStatus();
  }, []);

  // ─── Shopify Handlers ─────────────────────────────────────────────
  const loadShopifyStatus = async () => {
    try {
      const status = await getShopifyStatus();
      if (status.connected) {
        setShopifyConnected(true);
        setShopifyShop({
          name: status.shopName,
          domain: status.shopDomain,
          email: status.shopEmail,
          plan: status.shopPlan,
          currency: status.currency,
          connectedAt: status.connectedAt,
        });
        setShopifyCurrency(status.currency || 'USD');
        loadShopifySummary();
      }
    } catch { /* Not connected */ }
  };

  const loadShopifySummary = async () => {
    try {
      const [analytics, products] = await Promise.all([
        getShopifyAnalytics().catch(() => null),
        getShopifyProducts().catch(() => null),
      ]);
      if (analytics) {
        setShopifyOrderCount(analytics.orderCount);
        setShopifyRevenue(analytics.totalRevenue);
        setShopifyCurrency(analytics.currency || 'USD');
      }
      if (products) {
        setShopifyProductCount(products.count);
      }
    } catch { /* silent */ }
  };

  const handleShopifyOAuth = async () => {
    const shop = shopifyOAuthShop.trim();
    if (!shop) {
      setShopifyError('Please enter your Shopify store URL (e.g., mystore.myshopify.com)');
      return;
    }
    // Normalize: add .myshopify.com if needed
    let normalizedShop = shop.replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase();
    if (!normalizedShop.includes('.myshopify.com')) {
      normalizedShop = normalizedShop.replace(/\.myshopify\.com$/, '') + '.myshopify.com';
    }
    setShopifyOAuthLoading(true);
    setShopifyError('');
    try {
      await startShopifyOAuth(normalizedShop);
      // Browser will redirect — no need to do anything after
    } catch (e: any) {
      setShopifyError(e.message || 'Failed to start Shopify OAuth');
      setShopifyOAuthLoading(false);
    }
  };

  const handleShopifyConnect = async () => {
    if (!shopifyStoreUrl || !shopifyAccessToken) {
      setShopifyError('Both Store URL and Access Token are required');
      return;
    }
    setShopifyConnecting(true);
    setShopifyError('');
    try {
      const result = await connectShopify(shopifyStoreUrl, shopifyAccessToken);
      setShopifyConnected(true);
      setShopifyShop(result.shop);
      setShopifyStoreUrl('');
      setShopifyAccessToken('');
      loadShopifySummary();
    } catch (e: any) {
      setShopifyError(e.message || 'Failed to connect');
    } finally {
      setShopifyConnecting(false);
    }
  };

  const handleShopifyDisconnect = async () => {
    setShopifyDisconnecting(true);
    try {
      await disconnectShopify();
      setShopifyConnected(false);
      setShopifyShop(null);
      setShopifyProductCount(null);
      setShopifyOrderCount(null);
      setShopifyRevenue(null);
    } catch (e: any) {
      setShopifyError(e.message || 'Failed to disconnect');
    } finally {
      setShopifyDisconnecting(false);
    }
  };

  // ─── Meta Ads Handlers ────────────────────────────────────────────
  const loadMetaStatus = async () => {
    try {
      const status = await getMetaStatus();
      if (status.connected) {
        setMetaConnected(true);
        setMetaUser({
          name: status.metaUserName,
          id: status.metaUserId,
          adAccountId: status.adAccountId,
          connectedAt: status.connectedAt,
        });
        loadMetaSummary();
      }
    } catch { /* Not connected */ }
  };

  const loadMetaSummary = async () => {
    try {
      const [campaignsRes, insightsRes] = await Promise.all([
        getMetaCampaigns().catch(() => null),
        getMetaInsights().catch(() => null),
      ]);
      if (campaignsRes?.campaigns) {
        const activeCampaigns = campaignsRes.campaigns.filter((c: any) => c.status === 'ACTIVE');
        setMetaCampaignCount(activeCampaigns.length);
      }
      if (insightsRes && !insightsRes.error) {
        setMetaInsights({
          spend: insightsRes.spend,
          impressions: insightsRes.impressions,
          clicks: insightsRes.clicks,
          ctr: insightsRes.ctr,
          conversions: insightsRes.conversions,
        });
      }
    } catch { /* silent */ }
  };

  const handleMetaConnect = async () => {
    if (!metaAccessToken || !metaAdAccountId) {
      setMetaError('Both Access Token and Ad Account ID are required');
      return;
    }
    setMetaConnecting(true);
    setMetaError('');
    try {
      const result = await connectMeta(metaAccessToken, metaAdAccountId);
      setMetaConnected(true);
      setMetaUser({
        name: result.user?.name,
        id: result.user?.id,
        adAccountId: result.adAccountId,
        connectedAt: new Date().toISOString(),
      });
      setMetaAccessToken('');
      setMetaAdAccountId('');
      loadMetaSummary();
    } catch (e: any) {
      setMetaError(e.message || 'Failed to connect Meta Ads');
    } finally {
      setMetaConnecting(false);
    }
  };

  const handleMetaDisconnect = async () => {
    setMetaDisconnecting(true);
    try {
      await disconnectMeta();
      setMetaConnected(false);
      setMetaUser(null);
      setMetaCampaignCount(null);
      setMetaInsights(null);
    } catch (e: any) {
      setMetaError(e.message || 'Failed to disconnect');
    } finally {
      setMetaDisconnecting(false);
    }
  };

  // ─── Meta OAuth Handler ────────────────────────────────────────────
  const handleMetaOAuth = async () => {
    setMetaOAuthLoading(true);
    setMetaError('');
    try {
      const { url } = await getMetaOAuthUrl();
      window.location.href = url;
    } catch (e: any) {
      setMetaError(e.message || 'Failed to start Meta OAuth');
      setMetaOAuthLoading(false);
    }
  };

  // ─── Google Ads Handlers ───────────────────────────────────────────
  const loadGaStatus = async () => {
    try {
      const status = await getGoogleAdsStatus();
      if (status.connected) {
        setGaConnected(true);
        setGaAccount({
          accountName: status.accountName,
          customerId: status.customerId,
          connectedAt: status.connectedAt,
        });
        loadGaSummary();
      }
    } catch { /* Not connected */ }
  };

  const loadGaSummary = async () => {
    try {
      const [campaignsRes, insightsRes] = await Promise.all([
        getGoogleAdsCampaigns().catch(() => null),
        getGoogleAdsInsights().catch(() => null),
      ]);
      if (campaignsRes?.campaigns) {
        const activeCampaigns = campaignsRes.campaigns.filter((c: any) => c.status === 'ENABLED');
        setGaCampaignCount(activeCampaigns.length);
      }
      if (insightsRes && !insightsRes.error) {
        setGaInsights({
          spend: insightsRes.spend,
          impressions: insightsRes.impressions,
          clicks: insightsRes.clicks,
          ctr: insightsRes.ctr,
          conversions: insightsRes.conversions,
          costPerConversion: insightsRes.costPerConversion,
        });
      }
    } catch { /* silent */ }
  };

  const handleGaConnect = async () => {
    if (!gaDeveloperToken || !gaClientId || !gaClientSecret || !gaRefreshToken || !gaCustomerId) {
      setGaError('All fields are required');
      return;
    }
    setGaConnecting(true);
    setGaError('');
    try {
      const result = await connectGoogleAds(gaDeveloperToken, gaClientId, gaClientSecret, gaRefreshToken, gaCustomerId);
      setGaConnected(true);
      setGaAccount({
        accountName: result.accountName,
        customerId: result.customerId,
        connectedAt: new Date().toISOString(),
      });
      setGaDeveloperToken('');
      setGaClientId('');
      setGaClientSecret('');
      setGaRefreshToken('');
      setGaCustomerId('');
      loadGaSummary();
    } catch (e: any) {
      setGaError(e.message || 'Failed to connect Google Ads');
    } finally {
      setGaConnecting(false);
    }
  };

  const handleGaDisconnect = async () => {
    setGaDisconnecting(true);
    try {
      await disconnectGoogleAds();
      setGaConnected(false);
      setGaAccount(null);
      setGaCampaignCount(null);
      setGaInsights(null);
    } catch (e: any) {
      setGaError(e.message || 'Failed to disconnect');
    } finally {
      setGaDisconnecting(false);
    }
  };

  // ─── Google Ads OAuth Handler ───────────────────────────────────────
  const handleGaOAuth = async () => {
    setGaOAuthLoading(true);
    setGaError('');
    try {
      const { url } = await getGoogleAdsOAuthUrl();
      window.location.href = url;
    } catch (e: any) {
      setGaError(e.message || 'Failed to start Google Ads OAuth');
      setGaOAuthLoading(false);
    }
  };

  // ─── Supabase / Custom API Handlers ─────────────────────────────────
  const loadSupabaseStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/integrations/supabase/${user?.id}/status`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.connected) {
        setSbConnected(true);
        setSbTables(data.tables || []);
        setSbProject(data.projectName || '');
        setSbConnectedAt(data.connectedAt || '');
      }
    } catch { /* Not connected */ }
  };

  const handleSupabaseConnect = async () => {
    if (!sbUrl || !sbKey) {
      setSbError('Supabase URL and API Key are required');
      return;
    }
    setSbConnecting(true);
    setSbError('');
    try {
      const res = await fetch(`${API_BASE}/api/integrations/supabase/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ userId: user?.id, supabaseUrl: sbUrl, supabaseKey: sbKey, projectName: sbProjectName || 'My Project' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Connection failed');
      setSbConnected(true);
      setSbTables(data.tables || []);
      setSbProject(data.projectName || sbProjectName);
      setSbConnectedAt(data.connectedAt || new Date().toISOString());
      setSbUrl('');
      setSbKey('');
      setSbProjectName('');
    } catch (e: any) {
      setSbError(e.message || 'Failed to connect');
    } finally {
      setSbConnecting(false);
    }
  };

  const handleSupabaseSync = async () => {
    setSbSyncing(true);
    setSbSyncResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/integrations/supabase/${user?.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      setSbSyncResult(data.results);
    } catch (e: any) {
      setSbError(e.message || 'Sync failed');
    } finally {
      setSbSyncing(false);
    }
  };

  const handleSupabaseDisconnect = async () => {
    setSbDisconnecting(true);
    try {
      await fetch(`${API_BASE}/api/integrations/supabase/${user?.id}/disconnect`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setSbConnected(false);
      setSbTables([]);
      setSbProject('');
      setSbConnectedAt('');
      setSbSyncResult(null);
    } catch (e: any) {
      setSbError(e.message || 'Failed to disconnect');
    } finally {
      setSbDisconnecting(false);
    }
  };

  // ─── Logo Handlers ─────────────────────────────────────────────────
  const processLogoFile = useCallback(async (file: File) => {
    setLogoError('');
    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setLogoError('Please upload a PNG, JPG, SVG, or WebP image');
      return;
    }
    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Image must be under 2MB');
      return;
    }
    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setLogoPreview(base64);
      setLogoUploading(true);
      try {
        await uploadLogo(base64);
        setLogoSaved(true);
        setTimeout(() => setLogoSaved(false), 2500);
      } catch (err: any) {
        setLogoError(err.message || 'Upload failed');
      } finally {
        setLogoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleLogoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setLogoDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processLogoFile(file);
  }, [processLogoFile]);

  const handleLogoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processLogoFile(file);
  }, [processLogoFile]);

  // ─── General Handlers ─────────────────────────────────────────────
  const handleSaveBusiness = async () => {
    setSaving(true);
    try {
      const updated = { ...user, business_name: businessName, industry, description, website, country };
      localStorage.setItem('mubyn-user', JSON.stringify(updated));
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ userId: user?.id, business_name: businessName, industry, description, website, country }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSmtp = async () => {
    setSavingSmtp(true);
    try {
      localStorage.setItem('mubyn-smtp', JSON.stringify({ email: smtpEmail, host: smtpHost, port: smtpPort }));
      await fetch(`${API_BASE}/api/settings/smtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ userId: user?.id, email: smtpEmail, password: smtpPassword, host: smtpHost, port: parseInt(smtpPort) }),
      }).catch(() => {});
      setSavedSmtp(true);
      setSmtpConnected(true);
      setShowSmtpForm(false);
      setTimeout(() => setSavedSmtp(false), 2000);
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mubyn-user');
    localStorage.removeItem('mubyn-chat-history');
    window.location.href = '/login';
  };

  const detectSmtpHost = (email: string) => {
    if (email.includes('@gmail.com')) return 'smtp.gmail.com';
    if (email.includes('@outlook.com') || email.includes('@hotmail.com')) return 'smtp-mail.outlook.com';
    if (email.includes('@yahoo.com')) return 'smtp.mail.yahoo.com';
    if (email.includes('@zoho.com')) return 'smtp.zoho.com';
    const domain = email.split('@')[1];
    return domain ? `smtp.${domain}` : '';
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>
          <p className="text-brand-textMuted mt-2">{t('settings.subtitle')}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          {t('settings.signOut')}
        </button>
      </div>

      {/* Business Logo */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <ImageIcon className="w-5 h-5 text-brand-gold" />
          <div>
            <h2 className="text-lg font-bold text-white">{t('settings.businessLogo')}</h2>
            <p className="text-brand-textMuted text-sm">{t('settings.logoDesc')}</p>
          </div>
        </div>

        {logoError && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mt-4 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {logoError}
            <button onClick={() => setLogoError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        <div className="mt-4 flex items-start gap-6">
          {/* Preview */}
          {logoPreview && (
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl border-2 border-brand-border bg-brand-dark overflow-hidden flex items-center justify-center">
                <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
          )}

          {/* Drop zone */}
          <div className="flex-1">
            <input
              ref={logoInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleLogoSelect}
            />
            <div
              onClick={() => logoInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setLogoDragging(true); }}
              onDragLeave={() => setLogoDragging(false)}
              onDrop={handleLogoDrop}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all p-6 text-center ${
                logoDragging
                  ? 'border-brand-gold bg-brand-gold/10 scale-[1.02]'
                  : 'border-brand-gold/40 hover:border-brand-gold hover:bg-brand-gold/5'
              }`}
            >
              {logoUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
                  <p className="text-brand-textMuted text-sm">Uploading...</p>
                </div>
              ) : logoSaved ? (
                <div className="flex flex-col items-center gap-2">
                  <Check className="w-8 h-8 text-green-500" />
                  <p className="text-green-400 text-sm font-medium">Logo saved!</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-brand-gold/60" />
                  <p className="text-white text-sm font-medium">
                    {logoDragging ? 'Drop your logo here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-brand-textMuted text-xs">PNG, JPG, SVG, or WebP — max 2MB</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Model Preference */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Cpu className="w-5 h-5 text-brand-gold" />
          <div>
            <h2 className="text-lg font-bold text-white">AI Model Preference</h2>
            <p className="text-brand-textMuted text-sm">Choose which AI model Caesar uses for responses</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Auto-detect */}
          <label
            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
              aiModelPref === 'auto'
                ? 'bg-brand-gold/5 border-brand-gold/40'
                : 'bg-brand-dark border-brand-border hover:border-brand-border/80'
            }`}
          >
            <input
              type="radio"
              name="ai-model"
              value="auto"
              checked={aiModelPref === 'auto'}
              onChange={() => handleAiModelChange('auto')}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              aiModelPref === 'auto' ? 'border-brand-gold' : 'border-brand-textMuted'
            }`}>
              {aiModelPref === 'auto' && <div className="w-2 h-2 rounded-full bg-brand-gold" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-white font-medium text-sm">Auto-detect</p>
                <span className="px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold text-[10px] font-semibold uppercase tracking-wider">Recommended</span>
              </div>
              <p className="text-brand-textMuted text-xs mt-0.5">Automatically selects the best model based on message language</p>
            </div>
          </label>

          {/* Falcon 3 */}
          <label
            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
              aiModelPref === 'falcon'
                ? 'bg-brand-gold/5 border-brand-gold/40'
                : 'bg-brand-dark border-brand-border hover:border-brand-border/80'
            }`}
          >
            <input
              type="radio"
              name="ai-model"
              value="falcon"
              checked={aiModelPref === 'falcon'}
              onChange={() => handleAiModelChange('falcon')}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              aiModelPref === 'falcon' ? 'border-brand-gold' : 'border-brand-textMuted'
            }`}>
              {aiModelPref === 'falcon' && <div className="w-2 h-2 rounded-full bg-brand-gold" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs">🇦🇪</span>
                <p className="text-white font-medium text-sm">Falcon 3</p>
                <span className="text-brand-textMuted text-[10px]">Arabic-optimized</span>
              </div>
              <p className="text-brand-textMuted text-xs mt-0.5">TII's Falcon 3 — native Arabic understanding, built in Abu Dhabi</p>
            </div>
          </label>

          {/* GPT-4o */}
          <label
            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
              aiModelPref === 'gpt4o'
                ? 'bg-brand-gold/5 border-brand-gold/40'
                : 'bg-brand-dark border-brand-border hover:border-brand-border/80'
            }`}
          >
            <input
              type="radio"
              name="ai-model"
              value="gpt4o"
              checked={aiModelPref === 'gpt4o'}
              onChange={() => handleAiModelChange('gpt4o')}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              aiModelPref === 'gpt4o' ? 'border-brand-gold' : 'border-brand-textMuted'
            }`}>
              {aiModelPref === 'gpt4o' && <div className="w-2 h-2 rounded-full bg-brand-gold" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-white font-medium text-sm">GPT-4o</p>
                <span className="text-brand-textMuted text-[10px]">General purpose</span>
              </div>
              <p className="text-brand-textMuted text-xs mt-0.5">OpenAI's GPT-4o — best for English and general tasks</p>
            </div>
          </label>
        </div>
      </div>

      {/* Business Info */}
      <CollapsibleSection icon={Building2} title={t('settings.businessInfo')} completed={!!(businessName && industry)} completedLabel={businessName || 'Set up'}>
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-brand-textMuted mb-2">Business Name</label>
              <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Your business name"
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-brand-gold transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-textMuted mb-2">Industry</label>
              <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="E.g., Restaurant, E-commerce, Consulting"
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-brand-gold transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-brand-textMuted mb-2">Website</label>
              <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourbusiness.com"
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-brand-gold transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-textMuted mb-2">Country</label>
              <input type="text" value={country} onChange={e => setCountry(e.target.value)} placeholder="UAE, Saudi Arabia, etc."
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-brand-gold transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-textMuted mb-2">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell us about your business — Caesar uses this to personalize all AI responses"
              rows={3} className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-brand-gold resize-none transition-all" />
          </div>
          <button onClick={handleSaveBusiness} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-gold to-brand-goldBright text-black font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </CollapsibleSection>

      {/* Email Configuration for Outreach */}
      <CollapsibleSection icon={Mail} title={t('settings.emailOutreach')} subtitle="Connect your email to send lead outreach" completed={smtpConnected} completedLabel={smtpEmail || 'Connected'}>

        {smtpConnected && !showSmtpForm ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-brand-dark/50 rounded-lg">
              <Check className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-white font-medium">{smtpEmail}</p>
                <p className="text-brand-textMuted text-xs">{smtpHost}:{smtpPort}</p>
              </div>
            </div>
            <button onClick={() => setShowSmtpForm(true)}
              className="text-sm text-brand-gold hover:underline">
              Update email settings
            </button>
          </div>
        ) : (
        <>
        <p className="text-brand-textMuted text-sm mb-6">Connect your email to send lead outreach from your own address. Supports Gmail, Outlook, Zoho, and any SMTP provider.</p>
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-brand-textMuted mb-2">Email Address</label>
              <input type="email" value={smtpEmail} onChange={e => { setSmtpEmail(e.target.value); if (!smtpHost) setSmtpHost(detectSmtpHost(e.target.value)); }}
                placeholder="you@yourbusiness.com"
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-brand-gold transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-textMuted mb-2">App Password</label>
              <input type="password" value={smtpPassword} onChange={e => setSmtpPassword(e.target.value)}
                placeholder="App-specific password"
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-brand-gold transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-brand-textMuted mb-2">SMTP Server</label>
              <input type="text" value={smtpHost} onChange={e => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-brand-gold transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-textMuted mb-2">Port</label>
              <input type="text" value={smtpPort} onChange={e => setSmtpPort(e.target.value)}
                placeholder="587"
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-brand-gold transition-all" />
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-brand-gold/5 border border-brand-gold/20 rounded-lg">
            <Shield className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" />
            <p className="text-brand-textMuted text-xs">For Gmail, use an <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" className="text-brand-gold hover:underline">App Password</a> (not your main password). Your credentials are encrypted and never shared.</p>
          </div>
          <button onClick={handleSaveSmtp} disabled={savingSmtp || !smtpEmail}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-gold to-brand-goldBright text-black font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
            {savingSmtp ? <Loader2 className="w-4 h-4 animate-spin" /> : savedSmtp ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {savingSmtp ? 'Saving...' : savedSmtp ? 'Connected!' : 'Connect Email'}
          </button>
        </div>
        </>
        )}
      </CollapsibleSection>

      {/* ═══════════════════════════════════════════════════════════════
          INTEGRATIONS SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-brand-gold" />
          {t('settings.integrations')}
        </h2>
        <div className="space-y-6">

          {/* ─── Shopify Integration Card ─────────────────────────────── */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#96bf48]/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-[#96bf48]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Shopify</h3>
                  <p className="text-brand-textMuted text-xs">Sync your products, orders, and revenue</p>
                </div>
              </div>
              {shopifyConnected && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Connected
                </span>
              )}
            </div>

            {shopifyError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mt-4 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {shopifyError}
                <button onClick={() => setShopifyError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {shopifyConnected && shopifyShop ? (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-brand-dark rounded-lg border border-brand-border">
                  <p className="text-white font-semibold">{shopifyShop.name || 'Your Store'}</p>
                  <p className="text-brand-textMuted text-sm">{shopifyShop.domain}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-brand-dark rounded-lg border border-brand-border text-center">
                    <Package className="w-4 h-4 text-brand-gold mx-auto mb-1" />
                    <p className="text-white font-bold text-lg">{shopifyProductCount ?? '—'}</p>
                    <p className="text-brand-textMuted text-xs">Products</p>
                  </div>
                  <div className="p-3 bg-brand-dark rounded-lg border border-brand-border text-center">
                    <ShoppingCart className="w-4 h-4 text-brand-gold mx-auto mb-1" />
                    <p className="text-white font-bold text-lg">{shopifyOrderCount ?? '—'}</p>
                    <p className="text-brand-textMuted text-xs">Orders</p>
                  </div>
                  <div className="p-3 bg-brand-dark rounded-lg border border-brand-border text-center">
                    <TrendingUp className="w-4 h-4 text-brand-gold mx-auto mb-1" />
                    <p className="text-white font-bold text-lg">{shopifyRevenue ? `${shopifyCurrency} ${shopifyRevenue}` : '—'}</p>
                    <p className="text-brand-textMuted text-xs">Revenue</p>
                  </div>
                </div>
                <button onClick={handleShopifyDisconnect} disabled={shopifyDisconnecting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm">
                  {shopifyDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
                  {shopifyDisconnecting ? 'Disconnecting...' : 'Disconnect Shopify'}
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {/* ── OAuth Connect (Primary) ── */}
                <div className="p-4 bg-brand-dark rounded-xl border border-brand-border space-y-3">
                  <p className="text-white font-medium text-sm">Connect with one click via Shopify</p>
                  <div className="flex items-center gap-3">
                    <input type="text" value={shopifyOAuthShop} onChange={e => setShopifyOAuthShop(e.target.value)}
                      placeholder="mystore.myshopify.com"
                      onKeyDown={e => e.key === 'Enter' && handleShopifyOAuth()}
                      className="flex-1 bg-brand-bg border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-[#96bf48] transition-all" />
                    <button onClick={handleShopifyOAuth} disabled={shopifyOAuthLoading}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #95BF47, #7ab03c)' }}>
                      {shopifyOAuthLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M15.337 3.415c-.126-.09-.264-.035-.3.09-.024.084-.474 1.014-.498 1.062-.246-.462-.684-.882-1.392-.882h-.072c-.21-.258-.468-.372-.696-.372-1.722 0-2.544 2.154-2.802 3.252-.672.21-1.146.354-1.2.378-.372.12-.384.132-.432.486-.036.264-1.014 7.806-1.014 7.806L12.744 16.8l4.356-.948s-1.686-11.388-1.692-11.448c-.012-.066-.036-.102-.072-.102v.114zm-2.19 1.032c-.24.078-.504.156-.792.246v-.174c0-.516-.072-.936-.192-1.272.48.06.738.612.984 1.2zm-1.59-.492c.132.324.216.786.216 1.422v.084l-1.632.504c.312-1.2.9-1.782 1.416-2.01zm-.552-.42c.096 0 .186.03.276.096-.672.318-1.392 1.116-1.698 2.712l-1.29.396c.36-1.218 1.2-3.204 2.712-3.204z"/><path d="M15.168 3.588c.036 0 .06.036.072.102.006.06 1.692 11.448 1.692 11.448l-4.356.948-5.808-1.566s.978-7.542 1.014-7.806c.048-.354.06-.366.432-.486.054-.024.528-.168 1.2-.378.258-1.098 1.08-3.252 2.802-3.252.228 0 .486.114.696.372h.072c.708 0 1.146.42 1.392.882.024-.048.474-.978.498-1.062.036-.126.174-.18.3-.09l-.006-.114z" opacity=".5"/></svg>
                      )}
                      {shopifyOAuthLoading ? 'Redirecting...' : 'Connect with Shopify'}
                    </button>
                  </div>
                  <p className="text-brand-textMuted text-xs">You'll be redirected to Shopify to authorize access</p>
                </div>

                {/* ── Divider ── */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-brand-border" />
                  <span className="text-brand-textMuted text-xs uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-brand-border" />
                </div>

                {/* ── Manual Token (Collapsible) ── */}
                <button onClick={() => setShowManualShopify(!showManualShopify)}
                  className="text-brand-textMuted text-sm hover:text-white transition-colors flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  {showManualShopify ? 'Hide manual connection' : 'Connect with API token instead'}
                </button>

                {showManualShopify && (
                  <div className="space-y-4 p-4 bg-brand-dark rounded-xl border border-brand-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-brand-textMuted mb-2">Store URL</label>
                        <input type="text" value={shopifyStoreUrl} onChange={e => setShopifyStoreUrl(e.target.value)}
                          placeholder="your-store.myshopify.com"
                          className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-[#96bf48] transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-brand-textMuted mb-2">Admin API Access Token</label>
                        <input type="password" value={shopifyAccessToken} onChange={e => setShopifyAccessToken(e.target.value)}
                          placeholder="shpat_xxxxxxxxxxxxx"
                          className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-[#96bf48] transition-all" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={handleShopifyConnect} disabled={shopifyConnecting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#96bf48] text-black font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                        {shopifyConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                        {shopifyConnecting ? 'Connecting...' : 'Connect with Token'}
                      </button>
                      <button onClick={() => setShowShopifyInstructions(!showShopifyInstructions)}
                        className="text-brand-textMuted text-sm hover:text-white transition-colors underline">
                        How to get your token?
                      </button>
                    </div>
                    {showShopifyInstructions && (
                      <div className="p-4 bg-brand-bg rounded-lg border border-brand-border text-sm text-brand-textMuted space-y-2">
                        <p className="text-white font-medium">How to get your Shopify Admin API token:</p>
                        <ol className="list-decimal ml-4 space-y-1">
                          <li>Go to your Shopify Admin → <strong>Settings</strong> → <strong>Apps and sales channels</strong></li>
                          <li>Click <strong>Develop apps</strong> → <strong>Create an app</strong></li>
                          <li>Under <strong>Admin API access scopes</strong>, enable: <code className="bg-brand-border px-1 rounded">read_products</code>, <code className="bg-brand-border px-1 rounded">read_orders</code></li>
                          <li>Click <strong>Install app</strong> and copy the <strong>Admin API access token</strong></li>
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Meta Ads Integration Card ────────────────────────────── */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1877f2]/10 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-[#1877f2]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Meta Ads</h3>
                  <p className="text-brand-textMuted text-xs">Track campaigns, spend, and ad performance</p>
                </div>
              </div>
              {metaConnected && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Connected
                </span>
              )}
            </div>

            {metaError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mt-4 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {metaError}
                <button onClick={() => setMetaError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {metaConnected && metaUser ? (
              <div className="mt-4 space-y-4">
                {/* Account Info */}
                <div className="p-4 bg-brand-dark rounded-lg border border-brand-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{metaUser.name || 'Meta Account'}</p>
                      <p className="text-brand-textMuted text-sm">Ad Account: {metaUser.adAccountId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-brand-gold font-bold text-lg">{metaCampaignCount ?? '—'}</p>
                      <p className="text-brand-textMuted text-xs">Active Campaigns</p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-brand-dark rounded-lg border border-brand-border text-center">
                    <TrendingUp className="w-4 h-4 text-brand-gold mx-auto mb-1" />
                    <p className="text-white font-bold text-lg">{metaInsights?.spend != null ? `$${metaInsights.spend.toLocaleString()}` : '—'}</p>
                    <p className="text-brand-textMuted text-xs">Total Spend</p>
                  </div>
                  <div className="p-3 bg-brand-dark rounded-lg border border-brand-border text-center">
                    <Eye className="w-4 h-4 text-[#1877f2] mx-auto mb-1" />
                    <p className="text-white font-bold text-lg">{metaInsights?.impressions != null ? metaInsights.impressions.toLocaleString() : '—'}</p>
                    <p className="text-brand-textMuted text-xs">Impressions</p>
                  </div>
                  <div className="p-3 bg-brand-dark rounded-lg border border-brand-border text-center">
                    <MousePointerClick className="w-4 h-4 text-[#1877f2] mx-auto mb-1" />
                    <p className="text-white font-bold text-lg">{metaInsights?.clicks != null ? metaInsights.clicks.toLocaleString() : '—'}</p>
                    <p className="text-brand-textMuted text-xs">Clicks</p>
                  </div>
                  <div className="p-3 bg-brand-dark rounded-lg border border-brand-border text-center">
                    <BarChart3 className="w-4 h-4 text-brand-gold mx-auto mb-1" />
                    <p className="text-white font-bold text-lg">{metaInsights?.ctr ? `${metaInsights.ctr}%` : '—'}</p>
                    <p className="text-brand-textMuted text-xs">CTR</p>
                  </div>
                </div>

                <button onClick={handleMetaDisconnect} disabled={metaDisconnecting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm">
                  {metaDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
                  {metaDisconnecting ? 'Disconnecting...' : 'Disconnect Meta Ads'}
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {/* OAuth Button */}
                <div>
                  <button onClick={handleMetaOAuth} disabled={metaOAuthLoading}
                    className="flex items-center gap-3 w-full px-6 py-3 bg-[#1877F2] text-white font-semibold rounded-xl hover:bg-[#166FE5] transition-all disabled:opacity-50 text-base">
                    {metaOAuthLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    )}
                    {metaOAuthLoading ? 'Redirecting to Facebook...' : 'Connect with Facebook'}
                  </button>
                  <p className="text-brand-textMuted text-xs mt-2">You'll be redirected to Facebook to authorize access to your ad accounts</p>
                </div>

                {/* ── Divider ── */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-brand-border" />
                  <span className="text-brand-textMuted text-xs uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-brand-border" />
                </div>

                {/* ── Manual Token (Collapsible) ── */}
                <button onClick={() => setShowMetaManualForm(!showMetaManualForm)}
                  className="text-brand-textMuted text-sm hover:text-white transition-colors flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  {showMetaManualForm ? 'Hide manual connection' : 'Connect with access token instead'}
                </button>

                {showMetaManualForm && (
                  <div className="space-y-4 p-4 bg-brand-dark rounded-xl border border-brand-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-brand-textMuted mb-2">Access Token</label>
                        <input type="password" value={metaAccessToken} onChange={e => setMetaAccessToken(e.target.value)}
                          placeholder="Your Meta access token"
                          className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-[#1877f2] transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-brand-textMuted mb-2">Ad Account ID</label>
                        <input type="text" value={metaAdAccountId} onChange={e => setMetaAdAccountId(e.target.value)}
                          placeholder="act_123456789 or 123456789"
                          className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-[#1877f2] transition-all" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={handleMetaConnect} disabled={metaConnecting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#1877f2] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                        {metaConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                        {metaConnecting ? 'Connecting...' : 'Connect with Token'}
                      </button>
                      <button onClick={() => setShowMetaInstructions(!showMetaInstructions)}
                        className="text-brand-textMuted text-sm hover:text-white transition-colors underline">
                        How to get your token?
                      </button>
                    </div>
                    {showMetaInstructions && (
                      <div className="p-4 bg-brand-bg rounded-lg border border-brand-border text-sm text-brand-textMuted space-y-2">
                        <p className="text-white font-medium">How to get your Meta Ads credentials:</p>
                        <ol className="list-decimal ml-4 space-y-1">
                          <li>Go to <a href="https://business.facebook.com/settings" target="_blank" rel="noopener" className="text-[#1877f2] hover:underline">Meta Business Suite → Settings</a></li>
                          <li>Navigate to <strong>Users</strong> → <strong>System Users</strong> → create or select a system user</li>
                          <li>Click <strong>Generate New Token</strong> — select permissions: <code className="bg-brand-border px-1 rounded">ads_read</code>, <code className="bg-brand-border px-1 rounded">ads_management</code></li>
                          <li>Your <strong>Ad Account ID</strong> is in <strong>Ad Accounts</strong> section (format: <code className="bg-brand-border px-1 rounded">act_123456789</code>)</li>
                        </ol>
                        <p className="mt-2 text-xs">Or use the <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener" className="text-[#1877f2] hover:underline">Graph API Explorer</a> for a quick test token.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Google Ads Integration Card ─────────────────────────── */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#4285f4]/10 flex items-center justify-center">
                  <Search className="w-5 h-5 text-[#4285f4]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Google Ads</h3>
                  <p className="text-brand-textMuted text-xs">Track campaigns, spend, and search ad performance</p>
                </div>
              </div>
              {gaConnected && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Connected
                </span>
              )}
            </div>

            {gaError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mt-4 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {gaError}
                <button onClick={() => setGaError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {gaConnected && gaAccount ? (
              <div className="mt-4 space-y-4">
                {/* Account Info */}
                <div className="p-4 bg-brand-dark rounded-lg border border-brand-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{gaAccount.accountName || 'Google Ads Account'}</p>
                      <p className="text-brand-textMuted text-sm">Customer ID: {gaAccount.customerId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-brand-gold font-bold text-lg">{gaCampaignCount ?? '—'}</p>
                      <p className="text-brand-textMuted text-xs">Active Campaigns</p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 bg-brand-dark rounded-lg border border-brand-border text-center">
                    <DollarSign className="w-4 h-4 text-brand-gold mx-auto mb-1" />
                    <p className="text-white font-bold text-lg">{gaInsights?.spend != null ? `$${gaInsights.spend.toLocaleString()}` : '—'}</p>
                    <p className="text-brand-textMuted text-xs">Total Spend</p>
                  </div>
                  <div className="p-3 bg-brand-dark rounded-lg border border-brand-border text-center">
                    <Eye className="w-4 h-4 text-[#4285f4] mx-auto mb-1" />
                    <p className="text-white font-bold text-lg">{gaInsights?.impressions != null ? gaInsights.impressions.toLocaleString() : '—'}</p>
                    <p className="text-brand-textMuted text-xs">Impressions</p>
                  </div>
                  <div className="p-3 bg-brand-dark rounded-lg border border-brand-border text-center">
                    <MousePointerClick className="w-4 h-4 text-[#4285f4] mx-auto mb-1" />
                    <p className="text-white font-bold text-lg">{gaInsights?.clicks != null ? gaInsights.clicks.toLocaleString() : '—'}</p>
                    <p className="text-brand-textMuted text-xs">Clicks</p>
                  </div>
                  <div className="p-3 bg-brand-dark rounded-lg border border-brand-border text-center">
                    <BarChart3 className="w-4 h-4 text-brand-gold mx-auto mb-1" />
                    <p className="text-white font-bold text-lg">{gaInsights?.ctr ? `${gaInsights.ctr}%` : '—'}</p>
                    <p className="text-brand-textMuted text-xs">CTR</p>
                  </div>
                  <div className="p-3 bg-brand-dark rounded-lg border border-brand-border text-center">
                    <Target className="w-4 h-4 text-[#34a853] mx-auto mb-1" />
                    <p className="text-white font-bold text-lg">{gaInsights?.conversions != null ? gaInsights.conversions.toLocaleString() : '—'}</p>
                    <p className="text-brand-textMuted text-xs">Conversions</p>
                  </div>
                </div>

                <button onClick={handleGaDisconnect} disabled={gaDisconnecting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm">
                  {gaDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
                  {gaDisconnecting ? 'Disconnecting...' : 'Disconnect Google Ads'}
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {/* OAuth Button */}
                <div>
                  <button onClick={handleGaOAuth} disabled={gaOAuthLoading}
                    className="flex items-center gap-3 w-full px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 text-base border border-gray-200">
                    {gaOAuthLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[#4285f4]" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    )}
                    {gaOAuthLoading ? 'Redirecting to Google...' : 'Connect with Google'}
                  </button>
                  <p className="text-brand-textMuted text-xs mt-2">You'll be redirected to Google to authorize access to your Ads account</p>
                </div>

                {/* ── Divider ── */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-brand-border" />
                  <span className="text-brand-textMuted text-xs uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-brand-border" />
                </div>

                {/* ── Manual Credentials (Collapsible) ── */}
                <button onClick={() => setShowGaManualForm(!showGaManualForm)}
                  className="text-brand-textMuted text-sm hover:text-white transition-colors flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  {showGaManualForm ? 'Hide manual connection' : 'Connect with API credentials instead'}
                </button>

                {showGaManualForm && (
                  <div className="space-y-4 p-4 bg-brand-dark rounded-xl border border-brand-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-brand-textMuted mb-2">Developer Token</label>
                        <input type="password" value={gaDeveloperToken} onChange={e => setGaDeveloperToken(e.target.value)}
                          placeholder="Your developer token"
                          className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-[#4285f4] transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-brand-textMuted mb-2">Customer ID</label>
                        <input type="text" value={gaCustomerId} onChange={e => setGaCustomerId(e.target.value)}
                          placeholder="123-456-7890 or 1234567890"
                          className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-[#4285f4] transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-brand-textMuted mb-2">OAuth Client ID</label>
                        <input type="text" value={gaClientId} onChange={e => setGaClientId(e.target.value)}
                          placeholder="xxxx.apps.googleusercontent.com"
                          className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-[#4285f4] transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-brand-textMuted mb-2">OAuth Client Secret</label>
                        <input type="password" value={gaClientSecret} onChange={e => setGaClientSecret(e.target.value)}
                          placeholder="Your client secret"
                          className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-[#4285f4] transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-textMuted mb-2">Refresh Token</label>
                      <input type="password" value={gaRefreshToken} onChange={e => setGaRefreshToken(e.target.value)}
                        placeholder="Your OAuth refresh token"
                        className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-[#4285f4] transition-all" />
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={handleGaConnect} disabled={gaConnecting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#4285f4] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                        {gaConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        {gaConnecting ? 'Connecting...' : 'Connect with Credentials'}
                      </button>
                      <button onClick={() => setShowGaInstructions(!showGaInstructions)}
                        className="text-brand-textMuted text-sm hover:text-white transition-colors underline">
                        How to get credentials?
                      </button>
                    </div>
                    {showGaInstructions && (
                      <div className="p-4 bg-brand-bg rounded-lg border border-brand-border text-sm text-brand-textMuted space-y-2">
                        <p className="text-white font-medium">How to get your Google Ads API credentials:</p>
                        <ol className="list-decimal ml-4 space-y-1">
                          <li>Go to the <a href="https://ads.google.com/aw/apicenter" target="_blank" rel="noopener" className="text-[#4285f4] hover:underline">Google Ads API Center</a> and apply for a <strong>Developer Token</strong></li>
                          <li>Create an OAuth 2.0 Client in <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" className="text-[#4285f4] hover:underline">Google Cloud Console</a> → get <strong>Client ID</strong> &amp; <strong>Client Secret</strong></li>
                          <li>Use the <a href="https://developers.google.com/oauthplayground/" target="_blank" rel="noopener" className="text-[#4285f4] hover:underline">OAuth Playground</a> to generate a <strong>Refresh Token</strong> with scope <code className="bg-brand-border px-1 rounded">https://www.googleapis.com/auth/adwords</code></li>
                          <li>Your <strong>Customer ID</strong> is shown in the top-right of your Google Ads dashboard (format: <code className="bg-brand-border px-1 rounded">123-456-7890</code>)</li>
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Supabase / Custom API Integration Card ──────────────── */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#3ecf8e]/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-[#3ecf8e]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Custom API / Supabase</h3>
                  <p className="text-brand-textMuted text-xs">Connect your own database to sync clients, invoices & more</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {sbConnected && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Connected
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold text-[10px] font-semibold uppercase tracking-wider">Enterprise</span>
              </div>
            </div>

            {sbError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mt-4 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {sbError}
                <button onClick={() => setSbError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {sbConnected ? (
              <div className="mt-4 space-y-4">
                {/* Connection Info */}
                <div className="p-4 bg-brand-dark rounded-lg border border-brand-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{sbProject || 'Supabase Project'}</p>
                      <p className="text-brand-textMuted text-sm">Connected {sbConnectedAt ? new Date(sbConnectedAt).toLocaleDateString() : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-brand-gold font-bold text-lg">{sbTables.length}</p>
                      <p className="text-brand-textMuted text-xs">Tables</p>
                    </div>
                  </div>
                </div>

                {/* Discovered Tables */}
                {sbTables.length > 0 && (
                  <div className="p-4 bg-brand-dark rounded-lg border border-brand-border">
                    <p className="text-white text-sm font-medium mb-2 flex items-center gap-2">
                      <Table2 className="w-4 h-4 text-[#3ecf8e]" />
                      Discovered Tables
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sbTables.map(t => (
                        <span key={t} className={`px-2.5 py-1 rounded-lg text-xs font-mono ${
                          ['clients', 'invoices', 'projects', 'team_members'].includes(t)
                            ? 'bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20'
                            : 'bg-brand-border/50 text-brand-textMuted'
                        }`}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-brand-textMuted text-xs mt-2">
                      <span className="text-[#3ecf8e]">●</span> Syncable tables (clients → Leads, invoices → CFO, projects, team_members)
                    </p>
                  </div>
                )}

                {/* Sync Button */}
                <div className="flex items-center gap-3">
                  <button onClick={handleSupabaseSync} disabled={sbSyncing}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#3ecf8e] to-[#2bb573] text-black font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                    {sbSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {sbSyncing ? 'Syncing...' : 'Sync Data to Mubyn'}
                  </button>
                  <button onClick={handleSupabaseDisconnect} disabled={sbDisconnecting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm">
                    {sbDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
                    {sbDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>

                {/* Sync Results */}
                {sbSyncResult && (
                  <div className="p-4 bg-brand-dark rounded-lg border border-[#3ecf8e]/20">
                    <p className="text-[#3ecf8e] text-sm font-medium mb-2">✓ Sync Complete</p>
                    {sbSyncResult.synced?.map((s: any) => (
                      <p key={s.table} className="text-brand-textMuted text-xs">
                        <span className="text-white">{s.table}</span> → {s.type}: <span className="text-[#3ecf8e]">{s.count} records</span>
                      </p>
                    ))}
                    {sbSyncResult.errors?.length > 0 && sbSyncResult.errors.map((e: any) => (
                      <p key={e.table} className="text-red-400 text-xs mt-1">⚠ {e.table}: {e.error}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <p className="text-brand-textMuted text-sm">Connect your Supabase project to pull in clients, invoices, projects, and team data. <strong className="text-white">Read-only</strong> — Mubyn never writes to your database.</p>
                <div className="space-y-4 p-4 bg-brand-dark rounded-xl border border-brand-border">
                  <div>
                    <label className="block text-sm font-medium text-brand-textMuted mb-2">Project Name</label>
                    <input type="text" value={sbProjectName} onChange={e => setSbProjectName(e.target.value)}
                      placeholder="My Agency Backend"
                      className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-[#3ecf8e] transition-all" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-textMuted mb-2">Supabase URL</label>
                      <input type="text" value={sbUrl} onChange={e => setSbUrl(e.target.value)}
                        placeholder="https://xxxxx.supabase.co"
                        className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-[#3ecf8e] transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-textMuted mb-2">API Key (anon/public)</label>
                      <input type="password" value={sbKey} onChange={e => setSbKey(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIs..."
                        className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-3 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-[#3ecf8e] transition-all" />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-[#3ecf8e]/5 border border-[#3ecf8e]/20 rounded-lg">
                    <Shield className="w-4 h-4 text-[#3ecf8e] mt-0.5 flex-shrink-0" />
                    <p className="text-brand-textMuted text-xs">Use your <strong className="text-white">anon/public</strong> key — never the service role key. Mubyn only reads data, never writes to your Supabase. Find your keys in <a href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" rel="noopener" className="text-[#3ecf8e] hover:underline">Project Settings → API</a>.</p>
                  </div>
                  <button onClick={handleSupabaseConnect} disabled={sbConnecting || !sbUrl || !sbKey}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#3ecf8e] to-[#2bb573] text-black font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                    {sbConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                    {sbConnecting ? 'Testing Connection...' : 'Connect Supabase'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Demo Mode */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-brand-gold" />
          <h2 className="text-lg font-bold text-white">Demo Mode</h2>
          <span className="px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold text-xs font-medium">Beta</span>
        </div>
        <p className="text-brand-textMuted text-sm mb-4">
          Load sample data across all modules for demonstrations and testing. Perfect for showing Caesar's capabilities to prospects.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 bg-brand-dark rounded-lg border border-brand-border text-center">
            <p className="text-white font-semibold">15</p>
            <p className="text-brand-textMuted text-xs">Sample Leads</p>
          </div>
          <div className="p-3 bg-brand-dark rounded-lg border border-brand-border text-center">
            <p className="text-white font-semibold">12</p>
            <p className="text-brand-textMuted text-xs">Content Posts</p>
          </div>
          <div className="p-3 bg-brand-dark rounded-lg border border-brand-border text-center">
            <p className="text-white font-semibold">6</p>
            <p className="text-brand-textMuted text-xs">CFO Projections</p>
          </div>
          <div className="p-3 bg-brand-dark rounded-lg border border-brand-border text-center">
            <p className="text-white font-semibold">5</p>
            <p className="text-brand-textMuted text-xs">KB Entries</p>
          </div>
        </div>
        <button
          onClick={async () => {
            const userId = getStoredUser()?.id;
            if (!userId) return;
            try {
              // Generate demo data via API calls
              await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL || 'https://natural-energy-production-df04.up.railway.app'}/api/leads/generate`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getStoredUser()?.token}` },
                  body: JSON.stringify({ userId, industry: 'Technology', country: 'UAE', city: 'Dubai', count: 15 })
                }),
                fetch(`${import.meta.env.VITE_API_URL || 'https://natural-energy-production-df04.up.railway.app'}/api/content/calendar`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getStoredUser()?.token}` },
                  body: JSON.stringify({ userId, business_name: businessName || 'Demo Business', industry: industry || 'Technology', language: 'bilingual' })
                }),
                fetch(`${import.meta.env.VITE_API_URL || 'https://natural-energy-production-df04.up.railway.app'}/api/cfo/generate`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getStoredUser()?.token}` },
                  body: JSON.stringify({ userId, industry: industry || 'Technology', businessName: businessName || 'Demo Business' })
                })
              ]);
              alert('Demo data loaded! Check Leads, CMO, and CFO tabs.');
            } catch (e) {
              console.error('Demo data error:', e);
              alert('Failed to load demo data. Please try again.');
            }
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-gold to-brand-goldBright text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-4 h-4" />
          Load Demo Data
        </button>
      </div>

      {/* Billing */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-5 h-5 text-brand-gold" />
          <h2 className="text-lg font-bold text-white">Billing</h2>
        </div>
        <div className="p-6 bg-brand-dark rounded-lg border border-brand-border text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold text-xs font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
            Free Trial Active
          </div>
          <p className="text-white font-semibold mb-1">You're on the Starter plan</p>
          <p className="text-brand-textMuted text-sm mb-6">Upgrade to Pro for unlimited AI generations, priority support, and custom branding.</p>
          <button className="px-6 py-2.5 bg-gradient-to-r from-brand-gold to-brand-goldBright text-black font-semibold rounded-xl hover:opacity-90 transition-opacity">
            Upgrade to Pro — $99/mo
          </button>
        </div>
      </div>
    </div>
  );
}
