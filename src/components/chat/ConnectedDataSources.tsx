import { useState, useEffect } from 'react';
import { Database, ShoppingBag, Mail, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://natural-energy-production-df04.up.railway.app';

interface DataSourceStatus {
  supabase: boolean;
  shopify: boolean;
  meta: boolean;
  google: boolean;
  email: boolean;
}

export function ConnectedDataSources() {
  const [status, setStatus] = useState<DataSourceStatus>({
    supabase: false,
    shopify: false,
    meta: false,
    google: false,
    email: false,
  });
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('mubyn-user') || '{}');
        const token = localStorage.getItem('mubyn-token') || user?.token;
        const userId = user?.id;

        if (!userId || !token) {
          setLoading(false);
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // Fetch both endpoints in parallel
        const [supabaseRes, settingsRes] = await Promise.allSettled([
          fetch(`${API_BASE}/api/integrations/supabase/${userId}/status`, { headers }),
          fetch(`${API_BASE}/api/settings/${userId}`, { headers }),
        ]);

        const newStatus: DataSourceStatus = {
          supabase: false,
          shopify: false,
          meta: false,
          google: false,
          email: false,
        };

        // Check Supabase status
        if (supabaseRes.status === 'fulfilled' && supabaseRes.value.ok) {
          try {
            const data = await supabaseRes.value.json();
            newStatus.supabase = !!(data.connected || data.status === 'connected' || data.supabaseUrl);
          } catch { /* ignore parse errors */ }
        }

        // Check settings for other integrations
        if (settingsRes.status === 'fulfilled' && settingsRes.value.ok) {
          try {
            const data = await settingsRes.value.json();
            const settings = data.settings || data;

            // Shopify
            newStatus.shopify = !!(
              settings.shopifyDomain ||
              settings.shopify_domain ||
              settings.shopifyAccessToken ||
              settings.shopify_access_token ||
              settings.shopifyConnected
            );

            // Meta
            newStatus.meta = !!(
              settings.metaAccessToken ||
              settings.meta_access_token ||
              settings.metaAdAccountId ||
              settings.meta_ad_account_id ||
              settings.metaConnected
            );

            // Google
            newStatus.google = !!(
              settings.googleAccessToken ||
              settings.google_access_token ||
              settings.googleAdsCustomerId ||
              settings.google_ads_customer_id ||
              settings.googleConnected
            );

            // Email/SMTP
            newStatus.email = !!(
              settings.smtpHost ||
              settings.smtp_host ||
              settings.emailHost ||
              settings.email_host ||
              settings.smtpConnected ||
              settings.emailConnected
            );
          } catch { /* ignore parse errors */ }
        }

        setStatus(newStatus);
      } catch {
        // Silently fail — don't break the chat
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const connectedCount = Object.values(status).filter(Boolean).length;
  const totalCount = Object.values(status).length;

  if (loading) return null;

  const sources = [
    { key: 'supabase', label: 'Supabase', icon: Database, connected: status.supabase },
    { key: 'shopify', label: 'Shopify', icon: ShoppingBag, connected: status.shopify },
    { key: 'meta', label: 'Meta Ads', icon: BarChart3, connected: status.meta },
    { key: 'google', label: 'Google', icon: BarChart3, connected: status.google },
    { key: 'email', label: 'Email', icon: Mail, connected: status.email },
  ];

  return (
    <div className="bg-brand-card/50 border border-brand-border rounded-lg px-3 py-2 mb-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between text-xs text-brand-muted hover:text-brand-text transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Database className="w-3 h-3" />
          <span>
            Data Sources{' '}
            <span className="text-brand-gold">{connectedCount}/{totalCount}</span>
            {connectedCount === 0 && (
              <span className="ml-1.5 text-brand-muted/70">— Connect in Settings</span>
            )}
          </span>
        </span>
        {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      {!collapsed && (
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {sources.map((source) => {
            const Icon = source.icon;
            return (
              <div
                key={source.key}
                className="flex items-center gap-1.5 text-xs"
                title={`${source.label}: ${source.connected ? 'Connected' : 'Not connected'}`}
              >
                <span className="relative">
                  <Icon className={`w-3.5 h-3.5 ${source.connected ? 'text-brand-gold' : 'text-brand-muted/50'}`} />
                  <span
                    className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
                      source.connected ? 'bg-green-500' : 'bg-brand-muted/40'
                    }`}
                  />
                </span>
                <span className={source.connected ? 'text-brand-text' : 'text-brand-muted/50'}>
                  {source.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
