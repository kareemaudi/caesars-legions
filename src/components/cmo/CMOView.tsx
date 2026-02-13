import {
  Calendar, RefreshCw, Loader2, Twitter, Linkedin, Instagram, Camera,
  Edit3, Download, Sparkles, Building2, Copy, Check, ImageIcon,
  BarChart3, Globe, Zap, TrendingUp, FileDown,
  // New icons for analytics
  DollarSign, ShoppingCart, Target, Percent, Link2, Settings,
  ArrowUpRight, ArrowDownRight, Megaphone, Mail,
  PieChart, Activity,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import {
  generateCalendar, generateContentImage, getStoredUser, getSettings,
  getShopifyAnalytics, getShopifyStatus,
  getMetaInsights, getMetaStatus, getMetaCampaigns,
} from '@/lib/api';
import { SkeletonPostCards, SkeletonStatsCards } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/i18n';

/* ═══════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════ */

interface CalendarPost {
  id?: string;
  week?: number;
  day?: string;
  platform?: string;
  content?: string;
  hashtags?: string[] | string;
  type?: string;
  status?: string;
  image_url?: string;
  image_loading?: boolean;
}

interface ShopifyAnalytics {
  totalRevenue?: number;
  totalOrders?: number;
  totalProducts?: number;
  averageOrderValue?: number;
  recentOrders?: any[];
  dailyRevenue?: Array<{ date: string; revenue: number; orders: number }>;
}

interface MetaInsights {
  spend?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
  reach?: number;
  campaigns?: number;
  dailySpend?: Array<{ date: string; spend: number }>;
}

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: number;
  lifetime_budget?: number;
  spend?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
  reach?: number;
  start_time?: string;
  updated_time?: string;
}

/* ═══════════════════════════════════════════════════════════════════
   Constants (Content Calendar)
   ═══════════════════════════════════════════════════════════════════ */

const INDUSTRIES = [
  'Restaurants', 'Real Estate', 'E-commerce', 'Healthcare', 'Education',
  'Retail', 'Technology', 'Construction', 'Legal', 'Hospitality',
  'Automotive', 'Beauty & Wellness', 'Finance', 'Consulting', 'Other',
];

const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'arabic', label: 'Arabic (العربية)' },
  { value: 'bilingual', label: 'Bilingual (EN + AR)' },
];

const platformConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  twitter: { icon: <Twitter className="w-4 h-4" />, color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/20', label: 'Twitter / X' },
  x: { icon: <Twitter className="w-4 h-4" />, color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/20', label: 'X' },
  linkedin: { icon: <Linkedin className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', label: 'LinkedIn' },
  instagram: { icon: <Instagram className="w-4 h-4" />, color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/20', label: 'Instagram' },
  reels: { icon: <Camera className="w-4 h-4" />, color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/20', label: 'Reels' },
  tiktok: { icon: <Camera className="w-4 h-4" />, color: 'text-white', bg: 'bg-white/5 border-white/10', label: 'TikTok' },
};

const typeConfig: Record<string, { color: string; bg: string }> = {
  'thought leadership': { color: 'text-blue-300', bg: 'bg-blue-500/15 border-blue-500/25' },
  'tips': { color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/25' },
  'case study': { color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/25' },
  'behind the scenes': { color: 'text-orange-300', bg: 'bg-orange-500/15 border-orange-500/25' },
  'behind scenes': { color: 'text-orange-300', bg: 'bg-orange-500/15 border-orange-500/25' },
  'engagement': { color: 'text-teal-300', bg: 'bg-teal-500/15 border-teal-500/25' },
  'promotional': { color: 'text-amber-200', bg: 'bg-brand-gold/15 border-brand-gold/25' },
  'educational': { color: 'text-blue-300', bg: 'bg-blue-500/15 border-blue-500/25' },
  'inspirational': { color: 'text-teal-300', bg: 'bg-teal-500/15 border-teal-500/25' },
  'storytelling': { color: 'text-orange-300', bg: 'bg-orange-500/15 border-orange-500/25' },
};

const statusCycle = ['draft', 'scheduled', 'posted'] as const;
const statusStyles: Record<string, string> = {
  draft: 'bg-white/10 text-white/60 border-white/20 hover:bg-white/15',
  scheduled: 'bg-brand-gold/20 text-brand-gold border-brand-gold/30 hover:bg-brand-gold/30',
  posted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30',
};

function getPlatformInfo(platform: string) {
  const key = platform?.toLowerCase().replace(/\s/g, '');
  return platformConfig[key] || { icon: <Globe className="w-4 h-4" />, color: 'text-brand-gold', bg: 'bg-brand-gold/10 border-brand-gold/20', label: platform || 'Post' };
}

function getTypeInfo(type: string) {
  const key = type?.toLowerCase().trim();
  return typeConfig[key] || { color: 'text-brand-textMuted', bg: 'bg-white/5 border-white/10' };
}

function getImageSize(platform: string): string {
  const p = platform?.toLowerCase();
  if (p === 'instagram' || p === 'reels') return '1024x1024';
  if (p === 'twitter' || p === 'x' || p === 'linkedin') return '1792x1024';
  return '1024x1024';
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(0);
}

/* ═══════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════ */

type CMOTab = 'overview' | 'content' | 'campaigns' | 'email';

export function CMOView() {
  const [activeTab, setActiveTab] = useState<CMOTab>('overview');
  const { t } = useLang();

  useEffect(() => {
    document.title = 'CMO — Marketing Intelligence — Mubyn';
  }, []);

  const tabs: { id: CMOTab; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'overview', labelKey: 'cmo.tab.overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'content', labelKey: 'cmo.tab.content', icon: <Calendar className="w-4 h-4" /> },
    { id: 'campaigns', labelKey: 'cmo.tab.campaigns', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'email', labelKey: 'cmo.tab.email', icon: <Mail className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Megaphone className="w-7 h-7 text-brand-gold" />
          {t('cmo.title')}
        </h1>
        <p className="text-brand-textMuted mt-1">{t('cmo.subtitle')}</p>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 p-1 bg-[#0F1B2D] rounded-xl border border-[#1E3A5F]/30 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-brand-gold text-black shadow-lg shadow-brand-gold/20"
                : "text-brand-textMuted hover:text-white hover:bg-white/5"
            )}
          >
            {tab.icon}
            {t(tab.labelKey)}
            {tab.id === 'email' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 text-brand-gold/70 font-semibold">Soon</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'content' && <ContentTab />}
      {activeTab === 'campaigns' && <CampaignsTab />}
      {activeTab === 'email' && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center mb-6">
            <Mail className="w-10 h-10 text-brand-gold" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Email Marketing</h3>
          <span className="inline-block px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-xs font-semibold mb-4">Coming Soon</span>
          <p className="text-brand-textMuted max-w-md">
            Automated email campaigns, drip sequences, newsletters, and engagement tracking — all managed by Caesar. Connect your SMTP in Settings to get started when it launches.
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Tab 1: Overview (Analytics Dashboard)
   ═══════════════════════════════════════════════════════════════════ */

function OverviewTab() {
  const [loading, setLoading] = useState(true);
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [metaConnected, setMetaConnected] = useState(false);
  const [shopifyData, setShopifyData] = useState<ShopifyAnalytics | null>(null);
  const [metaData, setMetaData] = useState<MetaInsights | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    setError('');
    try {
      // Load integration statuses in parallel
      const [shopifyStatusRes, metaStatusRes] = await Promise.allSettled([
        getShopifyStatus(),
        getMetaStatus(),
      ]);

      const sConnected = shopifyStatusRes.status === 'fulfilled' && shopifyStatusRes.value?.connected;
      const mConnected = metaStatusRes.status === 'fulfilled' && metaStatusRes.value?.connected;
      setShopifyConnected(sConnected);
      setMetaConnected(mConnected);

      // Load analytics data for connected integrations
      const promises: Promise<any>[] = [];
      if (sConnected) promises.push(getShopifyAnalytics().then(d => setShopifyData(d)));
      else promises.push(Promise.resolve());
      if (mConnected) promises.push(getMetaInsights().then(d => setMetaData(d)));
      else promises.push(Promise.resolve());

      await Promise.allSettled(promises);
    } catch (e: any) {
      console.error('Overview load error:', e);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }

  const totalRevenue = shopifyData?.totalRevenue || 0;
  const adSpend = metaData?.spend || 0;
  const roas = adSpend > 0 ? (totalRevenue / adSpend) : 0;
  const totalOrders = shopifyData?.totalOrders || 0;
  // Estimate conversion rate: orders / (clicks or impressions-based visits)
  const estimatedVisits = (metaData?.clicks || 0) + Math.max(totalOrders * 15, 100);
  const conversionRate = estimatedVisits > 0 ? (totalOrders / estimatedVisits) * 100 : 0;

  const hasAnyConnection = shopifyConnected || metaConnected;

  // Build daily chart data (last 30 days)
  const chartData = buildChartData(shopifyData?.dailyRevenue, metaData?.dailySpend);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-[#162238] rounded-xl border border-[#1E3A5F]/30" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-[#162238] rounded-xl border border-[#1E3A5F]/30" />
          <div className="h-72 bg-[#162238] rounded-xl border border-[#1E3A5F]/30" />
        </div>
      </div>
    );
  }

  // Empty state — nothing connected
  if (!hasAnyConnection) {
    return (
      <div className="space-y-8">
        {/* Beautiful empty state */}
        <div className="relative overflow-hidden rounded-2xl border border-brand-gold/20 bg-gradient-to-br from-[#162238] to-[#0F1B2D] p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/3 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
              <Activity className="w-10 h-10 text-brand-gold" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Connect your channels to see real-time analytics
            </h2>
            <p className="text-brand-textMuted max-w-lg mx-auto text-lg mb-8">
              Link your Shopify store, Meta Ads, or Google Ads to unlock cross-channel marketing intelligence powered by Caesar.
            </p>
            <a
              href="#settings"
              onClick={(e) => {
                e.preventDefault();
                // Navigate to settings via sidebar click simulation
                const settingsBtn = document.querySelector('[data-section="settings"]') as HTMLElement;
                if (settingsBtn) settingsBtn.click();
              }}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-gold text-black font-semibold hover:bg-brand-gold/90 transition-colors text-lg"
            >
              <Settings className="w-5 h-5" />
              Go to Settings
            </a>
          </div>
        </div>

        {/* Integration cards (all disconnected) */}
        <IntegrationStatusCards
          shopifyConnected={false}
          metaConnected={false}
          shopifyData={null}
          metaData={null}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          trend={totalRevenue > 0 ? 'up' : 'neutral'}
          trendValue={shopifyConnected ? 'From Shopify' : 'Not connected'}
          color="green"
        />
        <KPICard
          label="Ad Spend"
          value={formatCurrency(adSpend)}
          icon={Target}
          trend="neutral"
          trendValue={metaConnected ? 'Meta Ads' : 'Not connected'}
          color="blue"
        />
        <KPICard
          label="ROAS"
          value={roas > 0 ? roas.toFixed(2) + 'x' : '—'}
          icon={TrendingUp}
          trend={roas >= 2 ? 'up' : roas > 0 ? 'down' : 'neutral'}
          trendValue={roas >= 2 ? 'Healthy' : roas > 0 ? 'Needs improvement' : 'No data'}
          color={roas >= 2 ? 'green' : roas > 0 ? 'red' : 'gold'}
        />
        <KPICard
          label="Conversion Rate"
          value={conversionRate > 0 ? conversionRate.toFixed(1) + '%' : '—'}
          icon={Percent}
          trend={conversionRate >= 2 ? 'up' : conversionRate > 0 ? 'neutral' : 'neutral'}
          trendValue={totalOrders > 0 ? `${totalOrders} orders` : 'No orders'}
          color={conversionRate >= 2 ? 'green' : 'gold'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Ad Spend Chart */}
        <div className="p-6 rounded-xl bg-[#162238] border border-[#1E3A5F]/30">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-brand-gold" />
            <h3 className="text-white font-semibold">Revenue vs Ad Spend</h3>
            <span className="text-brand-textMuted text-xs ml-auto">Last 30 days</span>
          </div>
          {chartData.length > 0 ? (
            <RevenueSpendChart data={chartData} />
          ) : (
            <div className="h-48 flex items-center justify-center text-brand-textMuted text-sm">
              No daily data available yet
            </div>
          )}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#1E3A5F]/30">
            <div className="flex items-center gap-2 text-xs text-brand-textMuted">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              Revenue
            </div>
            <div className="flex items-center gap-2 text-xs text-brand-textMuted">
              <div className="w-3 h-3 rounded-sm bg-blue-400" />
              Ad Spend
            </div>
          </div>
        </div>

        {/* Channel Breakdown Pie Chart */}
        <div className="p-6 rounded-xl bg-[#162238] border border-[#1E3A5F]/30">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-brand-gold" />
            <h3 className="text-white font-semibold">Channel Breakdown</h3>
          </div>
          <ChannelBreakdownChart
            shopifyRevenue={totalRevenue}
            metaSpend={adSpend}
            shopifyConnected={shopifyConnected}
            metaConnected={metaConnected}
          />
        </div>
      </div>

      {/* Integration Status Cards */}
      <IntegrationStatusCards
        shopifyConnected={shopifyConnected}
        metaConnected={metaConnected}
        shopifyData={shopifyData}
        metaData={metaData}
      />

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={loadAllData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1E3A5F]/30 text-brand-textMuted hover:text-brand-gold hover:border-brand-gold/30 transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>
    </div>
  );
}

/* ── Revenue vs Spend Bar Chart ── */
function RevenueSpendChart({ data }: { data: Array<{ date: string; revenue: number; spend: number }> }) {
  const maxVal = Math.max(...data.map(d => Math.max(d.revenue, d.spend)), 1);
  // Show up to 14 most recent bars for readability
  const displayData = data.slice(-14);

  return (
    <div className="space-y-2">
      {displayData.map((d, i) => {
        const revPct = Math.max((d.revenue / maxVal) * 100, 1);
        const spendPct = Math.max((d.spend / maxVal) * 100, 1);
        const dateLabel = new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-brand-textMuted text-xs w-14 text-right font-mono truncate">{dateLabel}</span>
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-white/5 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-sm transition-all duration-700"
                  style={{ width: `${revPct}%` }}
                />
              </div>
              <div className="h-3 bg-white/5 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-sm transition-all duration-700"
                  style={{ width: `${spendPct}%` }}
                />
              </div>
            </div>
            <div className="text-right w-20">
              <p className="text-emerald-400 text-xs font-mono">{formatCurrency(d.revenue)}</p>
              <p className="text-blue-400 text-xs font-mono">{formatCurrency(d.spend)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Channel Breakdown ── */
function ChannelBreakdownChart({
  shopifyRevenue, metaSpend, shopifyConnected, metaConnected,
}: {
  shopifyRevenue: number; metaSpend: number; shopifyConnected: boolean; metaConnected: boolean;
}) {
  // Estimate channel attribution
  const metaAttributed = metaSpend * 2.5; // estimated ROAS of 2.5x
  const organic = Math.max(shopifyRevenue - metaAttributed, shopifyRevenue * 0.4);
  const metaRevenue = Math.min(metaAttributed, shopifyRevenue * 0.4);
  const directRevenue = shopifyRevenue * 0.15;
  const otherRevenue = Math.max(shopifyRevenue - organic - metaRevenue - directRevenue, 0);

  const channels = [
    { label: 'Organic (Shopify)', value: organic, color: 'bg-emerald-500', textColor: 'text-emerald-400', connected: shopifyConnected },
    { label: 'Meta Ads', value: metaRevenue, color: 'bg-blue-500', textColor: 'text-blue-400', connected: metaConnected },
    { label: 'Direct', value: directRevenue, color: 'bg-amber-500', textColor: 'text-amber-400', connected: true },
    { label: 'Google Ads', value: otherRevenue, color: 'bg-purple-500', textColor: 'text-purple-400', connected: false },
  ];

  const total = channels.reduce((s, c) => s + c.value, 0) || 1;

  return (
    <div className="space-y-5">
      {/* Visual bar */}
      <div className="h-6 rounded-full overflow-hidden flex bg-white/5">
        {channels.filter(c => c.value > 0).map((c, i) => (
          <div
            key={i}
            className={cn("h-full transition-all duration-700", c.color)}
            style={{ width: `${(c.value / total) * 100}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {channels.map((c, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-3 h-3 rounded-sm", c.color)} />
              <span className="text-sm text-white">{c.label}</span>
              {!c.connected && c.label === 'Google Ads' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Coming soon
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={cn("text-sm font-semibold tabular-nums", c.textColor)}>
                {formatCurrency(c.value)}
              </span>
              <span className="text-xs text-brand-textMuted w-10 text-right">
                {((c.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Integration Status Cards ── */
function IntegrationStatusCards({
  shopifyConnected, metaConnected, shopifyData, metaData,
}: {
  shopifyConnected: boolean; metaConnected: boolean;
  shopifyData: ShopifyAnalytics | null; metaData: MetaInsights | null;
}) {
  function goToSettings() {
    const settingsBtn = document.querySelector('[data-section="settings"]') as HTMLElement;
    if (settingsBtn) settingsBtn.click();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Shopify */}
      <div className={cn(
        "p-5 rounded-xl border transition-colors",
        shopifyConnected
          ? "bg-[#162238] border-emerald-500/30"
          : "bg-[#162238] border-[#1E3A5F]/30 hover:border-brand-gold/30"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center border",
              shopifyConnected
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-white/5 border-white/10"
            )}>
              <ShoppingCart className={cn("w-5 h-5", shopifyConnected ? "text-emerald-400" : "text-brand-textMuted")} />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">Shopify</h4>
              <span className={cn(
                "text-xs font-medium",
                shopifyConnected ? "text-emerald-400" : "text-brand-textMuted"
              )}>
                {shopifyConnected ? '● Connected' : '○ Disconnected'}
              </span>
            </div>
          </div>
        </div>
        {shopifyConnected && shopifyData ? (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-brand-textMuted text-xs">Products</p>
              <p className="text-white font-semibold">{shopifyData.totalProducts || 0}</p>
            </div>
            <div>
              <p className="text-brand-textMuted text-xs">Orders</p>
              <p className="text-white font-semibold">{shopifyData.totalOrders || 0}</p>
            </div>
            <div>
              <p className="text-brand-textMuted text-xs">Revenue</p>
              <p className="text-emerald-400 font-semibold">{formatCurrency(shopifyData.totalRevenue || 0)}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={goToSettings}
            className="w-full mt-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-brand-gold/20 text-brand-gold hover:bg-brand-gold/10 text-sm font-medium transition-colors"
          >
            <Link2 className="w-4 h-4" />
            Connect in Settings
          </button>
        )}
      </div>

      {/* Meta Ads */}
      <div className={cn(
        "p-5 rounded-xl border transition-colors",
        metaConnected
          ? "bg-[#162238] border-blue-500/30"
          : "bg-[#162238] border-[#1E3A5F]/30 hover:border-brand-gold/30"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center border",
              metaConnected
                ? "bg-blue-500/10 border-blue-500/20"
                : "bg-white/5 border-white/10"
            )}>
              <Megaphone className={cn("w-5 h-5", metaConnected ? "text-blue-400" : "text-brand-textMuted")} />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">Meta Ads</h4>
              <span className={cn(
                "text-xs font-medium",
                metaConnected ? "text-blue-400" : "text-brand-textMuted"
              )}>
                {metaConnected ? '● Connected' : '○ Disconnected'}
              </span>
            </div>
          </div>
        </div>
        {metaConnected && metaData ? (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-brand-textMuted text-xs">Campaigns</p>
              <p className="text-white font-semibold">{metaData.campaigns || 0}</p>
            </div>
            <div>
              <p className="text-brand-textMuted text-xs">Spend</p>
              <p className="text-blue-400 font-semibold">{formatCurrency(metaData.spend || 0)}</p>
            </div>
            <div>
              <p className="text-brand-textMuted text-xs">Impressions</p>
              <p className="text-white font-semibold">{formatNumber(metaData.impressions || 0)}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={goToSettings}
            className="w-full mt-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-brand-gold/20 text-brand-gold hover:bg-brand-gold/10 text-sm font-medium transition-colors"
          >
            <Link2 className="w-4 h-4" />
            Connect in Settings
          </button>
        )}
      </div>

      {/* Google Ads — Coming Soon */}
      <div className="p-5 rounded-xl bg-[#162238] border border-[#1E3A5F]/30 opacity-60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-brand-textMuted" />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">Google Ads</h4>
              <span className="text-xs font-medium text-brand-textMuted">○ Coming Soon</span>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20 font-medium">
            Soon
          </span>
        </div>
        <p className="text-brand-textMuted text-xs">
          Google Ads integration is coming soon. Stay tuned!
        </p>
      </div>
    </div>
  );
}

/* ── Helper: Build chart data ── */
function buildChartData(
  dailyRevenue?: Array<{ date: string; revenue: number; orders: number }>,
  dailySpend?: Array<{ date: string; spend: number }>,
): Array<{ date: string; revenue: number; spend: number }> {
  if (!dailyRevenue && !dailySpend) return [];

  const dateMap = new Map<string, { revenue: number; spend: number }>();

  (dailyRevenue || []).forEach(d => {
    const existing = dateMap.get(d.date) || { revenue: 0, spend: 0 };
    existing.revenue = d.revenue;
    dateMap.set(d.date, existing);
  });

  (dailySpend || []).forEach(d => {
    const existing = dateMap.get(d.date) || { revenue: 0, spend: 0 };
    existing.spend = d.spend;
    dateMap.set(d.date, existing);
  });

  return Array.from(dateMap.entries())
    .map(([date, vals]) => ({ date, ...vals }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/* ── KPI Card ── */
function KPICard({ label, value, icon: Icon, trend, trendValue, color }: {
  label: string;
  value: string;
  icon: any;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  color: 'green' | 'red' | 'gold' | 'blue';
}) {
  const colorMap = {
    green: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: 'text-red-400' },
    gold: { bg: 'bg-brand-gold/10', border: 'border-brand-gold/20', icon: 'text-brand-gold' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400' },
  };
  const c = colorMap[color];

  return (
    <div className="p-5 rounded-xl bg-[#162238] border border-[#1E3A5F]/30 hover:border-brand-gold/20 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-brand-textMuted text-xs uppercase tracking-wider font-medium">{label}</p>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", c.bg, c.border)}>
          <Icon className={cn("w-4 h-4", c.icon)} />
        </div>
      </div>
      <p className="text-white text-2xl font-bold tracking-tight">{value}</p>
      <div className="flex items-center gap-1 mt-2">
        {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />}
        {trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
        <span className={cn(
          "text-xs",
          trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-brand-textMuted'
        )}>
          {trendValue}
        </span>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   Tab 2: Content Calendar (existing code moved here)
   ═══════════════════════════════════════════════════════════════════ */

function ContentTab() {
  const [calendar, setCalendar] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [activeWeek, setActiveWeek] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [language, setLanguage] = useState('english');
  const [targetAudience, setTargetAudience] = useState('');

  useEffect(() => {
    async function loadAndGenerate() {
      // First try stored user
      const user = getStoredUser();
      let bizName = user?.business_name || '';
      let bizIndustry = user?.industry || '';

      // If missing, fetch from settings API
      if (!bizName || !bizIndustry) {
        try {
          const settings = await getSettings();
          if (settings?.business) {
            if (!bizName && settings.business.business_name) bizName = settings.business.business_name;
            if (!bizIndustry && settings.business.industry) bizIndustry = settings.business.industry;
          }
        } catch { /* ignore */ }
      }

      // Update state
      if (bizName) setBusinessName(bizName);
      if (bizIndustry) {
        const raw = bizIndustry.toLowerCase();
        const matched = INDUSTRIES.find(i => i.toLowerCase() === raw || i.toLowerCase().startsWith(raw));
        setIndustry(matched || bizIndustry);
      }

      // Auto-generate if we have both
      if (bizName && bizIndustry) {
        handleGenerate(bizName, bizIndustry, 'english');
      } else {
        setShowSetup(true);
      }
    }
    loadAndGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async (biz?: string, ind?: string, lang?: string) => {
    const b = biz || businessName;
    const i = ind || industry;
    const l = lang || language;
    if (!b.trim() || !i.trim()) { setShowSetup(true); return; }

    setLoading(true);
    setError('');
    setShowSetup(false);
    try {
      const data = await generateCalendar(b, i, l);
      const items = data.calendar || data.content || [];
      const posts = Array.isArray(items) ? items : [];
      setCalendar(posts.map((p: CalendarPost, idx: number) => ({ ...p, id: p.id || `post-${idx}`, status: p.status || 'draft' })));
      setHasGenerated(true);
      setActiveWeek(1);
    } catch (err) {
      console.error('Calendar generation failed:', err);
      setError('Failed to generate calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = useCallback(async (postId: string) => {
    const post = calendar.find(p => p.id === postId);
    if (!post || post.image_url || post.image_loading) return;

    setCalendar(prev => prev.map(p => p.id === postId ? { ...p, image_loading: true } : p));
    try {
      const topic = (post.content || '').substring(0, 100);
      const prompt = `Professional social media graphic for ${post.platform || 'social media'} about ${topic}. Modern, clean design. Brand colors: dark background with gold accents. No text overlay.`;
      const data = await generateContentImage(prompt, getImageSize(post.platform || ''));
      setCalendar(prev => prev.map(p => p.id === postId ? { ...p, image_url: data.image_url, image_loading: false } : p));
    } catch {
      setCalendar(prev => prev.map(p => p.id === postId ? { ...p, image_loading: false } : p));
    }
  }, [calendar]);

  const handleCopy = (post: CalendarPost) => {
    const text = `${post.content || ''}\n\n${Array.isArray(post.hashtags) ? post.hashtags.join(' ') : post.hashtags || ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(post.id || null);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusToggle = (postId: string) => {
    setCalendar(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const current = p.status || 'draft';
      const idx = statusCycle.indexOf(current as typeof statusCycle[number]);
      const next = statusCycle[(idx + 1) % statusCycle.length];
      return { ...p, status: next };
    }));
  };

  const handleDownload = (post: CalendarPost) => {
    const text = `Platform: ${post.platform || 'N/A'}\nDay: ${post.day || 'N/A'}\nWeek: ${post.week || 'N/A'}\nType: ${post.type || 'N/A'}\nStatus: ${post.status || 'draft'}\n\n${post.content || ''}\n\n${Array.isArray(post.hashtags) ? post.hashtags.join(' ') : post.hashtags || ''}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `post-w${post.week || '0'}-${post.day || 'draft'}-${post.platform || 'content'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    const text = calendar.map((post, i) =>
      `--- Post ${i + 1} ---\nPlatform: ${post.platform || 'N/A'}\nDay: ${post.day || 'N/A'}\nWeek: ${post.week || 'N/A'}\nType: ${post.type || 'N/A'}\nStatus: ${post.status || 'draft'}\n\n${post.content || ''}\n\n${Array.isArray(post.hashtags) ? post.hashtags.join(' ') : post.hashtags || ''}\n`
    ).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-calendar-${businessName || 'mubyn'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startEdit = (post: CalendarPost) => {
    setEditingId(post.id || null);
    setEditContent(post.content || '');
  };

  const saveEdit = (postId: string) => {
    setCalendar(prev => prev.map(p => p.id === postId ? { ...p, content: editContent } : p));
    setEditingId(null);
    setEditContent('');
  };

  // Derived data
  const weeks = [...new Set(calendar.map(p => p.week || 1))].sort();
  const weekPosts = calendar.filter(p => (p.week || 1) === activeWeek);
  const platforms = [...new Set(calendar.map(p => p.platform?.toLowerCase()).filter(Boolean))];
  const types = [...new Set(calendar.map(p => p.type?.toLowerCase()).filter(Boolean))];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Calendar className="w-6 h-6 text-brand-gold" />
            Content Calendar
          </h2>
          <p className="text-brand-textMuted mt-1 text-sm">AI-powered monthly content calendar with image generation.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {hasGenerated && (
            <>
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border text-brand-textMuted hover:text-white hover:border-brand-gold/50 transition-all"
              >
                <FileDown className="w-4 h-4" />
                Download All
              </button>
              <button
                onClick={() => setShowSetup(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border text-brand-textMuted hover:text-white hover:border-brand-gold/50 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                Settings
              </button>
            </>
          )}
          <button
            onClick={() => handleGenerate()}
            disabled={loading || (!businessName && !showSetup)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-brand-gold to-brand-goldBright text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {hasGenerated ? 'Regenerate' : 'Generate Calendar'}
          </button>
        </div>
      </div>

      {/* Setup Form */}
      {showSetup && (
        <div className="p-6 rounded-2xl bg-brand-card border border-brand-border space-y-5 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-brand-gold" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Business Details</h3>
              <p className="text-sm text-brand-textMuted">Tell Caesar about your business to generate the perfect content calendar.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-textMuted mb-2">Business Name</label>
              <input
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="My Company"
                className="w-full px-4 py-3 rounded-lg bg-brand-dark border border-brand-border text-white placeholder:text-brand-textMuted focus:border-brand-gold focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-textMuted mb-2">Industry</label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-brand-dark border border-brand-border text-white focus:border-brand-gold focus:outline-none"
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i.toLowerCase()}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-textMuted mb-2">Target Audience</label>
              <input
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                placeholder="e.g. Small business owners in MENA"
                className="w-full px-4 py-3 rounded-lg bg-brand-dark border border-brand-border text-white placeholder:text-brand-textMuted focus:border-brand-gold focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-textMuted mb-2">Language</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-brand-dark border border-brand-border text-white focus:border-brand-gold focus:outline-none"
              >
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            {hasGenerated && (
              <button onClick={() => setShowSetup(false)} className="px-4 py-2 rounded-lg border border-brand-border text-brand-textMuted hover:text-white transition-colors">
                Cancel
              </button>
            )}
            <button
              onClick={() => handleGenerate()}
              disabled={!businessName.trim() || !industry.trim() || loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-brand-gold to-brand-goldBright text-black font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              Generate Calendar
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <div className="text-center py-4">
            <p className="text-brand-textMuted text-sm flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
              Caesar is crafting your content calendar...
            </p>
          </div>
          <SkeletonStatsCards />
          <SkeletonPostCards count={4} />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center">
          <p className="text-red-400 mb-3">{error}</p>
          <button onClick={() => handleGenerate()} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors">
            Try Again
          </button>
        </div>
      )}

      {/* Calendar Content */}
      {!loading && !error && calendar.length > 0 && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Posts', value: calendar.length, icon: <BarChart3 className="w-5 h-5" /> },
              { label: 'Platforms', value: platforms.length, icon: <Globe className="w-5 h-5" /> },
              { label: 'Content Types', value: types.length, icon: <Zap className="w-5 h-5" /> },
              { label: 'Weeks', value: weeks.length, icon: <TrendingUp className="w-5 h-5" /> },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-xl bg-brand-card border border-brand-border group hover:border-brand-gold/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-brand-textMuted">{stat.label}</span>
                  <span className="text-brand-gold/50 group-hover:text-brand-gold transition-colors">{stat.icon}</span>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Week Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {weeks.map(w => (
              <button
                key={w}
                onClick={() => setActiveWeek(w)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeWeek === w
                    ? 'bg-brand-gold text-black'
                    : 'bg-brand-card border border-brand-border text-brand-textMuted hover:text-white hover:border-brand-gold/40'
                }`}
              >
                Week {w}
                <span className="ml-2 text-xs opacity-70">
                  ({calendar.filter(p => (p.week || 1) === w).length})
                </span>
              </button>
            ))}
            <button
              onClick={() => setActiveWeek(0)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeWeek === 0
                  ? 'bg-brand-gold text-black'
                  : 'bg-brand-card border border-brand-border text-brand-textMuted hover:text-white hover:border-brand-gold/40'
              }`}
            >
              All Posts
              <span className="ml-2 text-xs opacity-70">({calendar.length})</span>
            </button>
          </div>

          {/* Post Cards */}
          <div className="grid gap-4">
            {(activeWeek === 0 ? calendar : weekPosts).map((post) => {
              const platform = getPlatformInfo(post.platform || '');
              const typeInfo = getTypeInfo(post.type || '');
              const hashtags = Array.isArray(post.hashtags) ? post.hashtags : (typeof post.hashtags === 'string' ? post.hashtags.split(/[,\s]+/).filter(Boolean) : []);
              const status = post.status || 'draft';
              const isEditing = editingId === post.id;
              const isCopied = copiedId === post.id;

              return (
                <div
                  key={post.id}
                  className="rounded-2xl bg-brand-card border border-brand-border hover:border-brand-gold/20 transition-all group overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* Image Section */}
                    <div className="lg:w-48 shrink-0 relative bg-brand-dark">
                      {post.image_url ? (
                        <img
                          src={post.image_url}
                          alt="Post graphic"
                          className="w-full h-40 lg:h-full object-cover"
                        />
                      ) : (
                        <button
                          onClick={() => handleGenerateImage(post.id || '')}
                          disabled={post.image_loading}
                          className="w-full h-40 lg:h-full flex flex-col items-center justify-center gap-2 text-brand-textMuted hover:text-brand-gold transition-colors"
                        >
                          {post.image_loading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-brand-gold" />
                          ) : (
                            <>
                              <ImageIcon className="w-8 h-8" />
                              <span className="text-xs font-medium">Generate Image</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-5 min-w-0">
                      {/* Top Row: Badges */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {post.week && activeWeek === 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20 font-medium">
                            W{post.week}
                          </span>
                        )}
                        {post.day && (
                          <span className="text-sm font-semibold text-white">{post.day}</span>
                        )}
                        <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${platform.bg} ${platform.color}`}>
                          {platform.icon}
                          {platform.label}
                        </span>
                        {post.type && (
                          <span className={`text-xs px-2.5 py-1 rounded-full border ${typeInfo.bg} ${typeInfo.color} font-medium`}>
                            {post.type}
                          </span>
                        )}
                        <div className="flex-1" />
                        <button
                          onClick={() => handleStatusToggle(post.id || '')}
                          className={`text-xs px-3 py-1 rounded-full border font-medium transition-all capitalize ${statusStyles[status] || statusStyles.draft}`}
                          title="Click to change status"
                        >
                          {status}
                        </button>
                      </div>

                      {/* Content */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-brand-dark border border-brand-gold/40 text-white text-sm leading-relaxed resize-none focus:outline-none focus:border-brand-gold min-h-[100px]"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(post.id || '')}
                              className="px-4 py-1.5 rounded-lg bg-brand-gold text-black text-xs font-semibold hover:opacity-90"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-4 py-1.5 rounded-lg border border-brand-border text-brand-textMuted text-xs hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      )}

                      {/* Hashtags */}
                      {hashtags.length > 0 && !isEditing && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {hashtags.map((tag, i) => (
                            <span key={i} className="text-xs text-brand-gold/60 hover:text-brand-gold transition-colors cursor-default">
                              {tag.startsWith('#') ? tag : `#${tag}`}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      {!isEditing && (
                        <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(post)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-brand-textMuted hover:text-white text-xs font-medium transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleCopy(post)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-brand-textMuted hover:text-white text-xs font-medium transition-all"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            {isCopied ? 'Copied!' : 'Copy'}
                          </button>
                          <button
                            onClick={() => handleDownload(post)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-brand-textMuted hover:text-white text-xs font-medium transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                          {!post.image_url && !post.image_loading && (
                            <button
                              onClick={() => handleGenerateImage(post.id || '')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold text-xs font-medium transition-all ml-auto"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              Generate Image
                            </button>
                          )}
                          {post.image_loading && (
                            <span className="flex items-center gap-1.5 text-xs text-brand-gold ml-auto">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Generating...
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !error && hasGenerated && calendar.length === 0 && (
        <div className="p-16 rounded-2xl bg-brand-card border border-brand-border text-center">
          <Calendar className="w-14 h-14 text-brand-gold/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No content generated</h3>
          <p className="text-brand-textMuted mb-6 max-w-md mx-auto">Something went wrong. Try regenerating your calendar.</p>
          <button onClick={() => handleGenerate()} className="px-6 py-3 rounded-lg bg-gradient-to-r from-brand-gold to-brand-goldBright text-black font-semibold hover:opacity-90">
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   Tab 3: Campaigns (Meta Ads campaigns)
   ═══════════════════════════════════════════════════════════════════ */

function CampaignsTab() {
  const [loading, setLoading] = useState(true);
  const [metaConnected, setMetaConnected] = useState(false);
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    setLoading(true);
    setError('');
    try {
      const statusRes = await getMetaStatus();
      const connected = statusRes?.connected || false;
      setMetaConnected(connected);

      if (connected) {
        const campRes = await getMetaCampaigns();
        setCampaigns(campRes?.campaigns || campRes?.data || []);
      }
    } catch (e: any) {
      console.error('Campaign load error:', e);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }

  function goToSettings() {
    const settingsBtn = document.querySelector('[data-section="settings"]') as HTMLElement;
    if (settingsBtn) settingsBtn.click();
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-[#162238] rounded-xl border border-[#1E3A5F]/30" />
        ))}
      </div>
    );
  }

  if (!metaConnected) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#162238] to-[#0F1B2D] p-12 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Megaphone className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Connect Meta Ads to see your campaigns
          </h2>
          <p className="text-brand-textMuted max-w-lg mx-auto text-lg mb-8">
            Link your Meta (Facebook/Instagram) Ads account to view campaign performance, manage budgets, and track conversions — all from Mubyn.
          </p>
          <button
            onClick={goToSettings}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors text-lg"
          >
            <Settings className="w-5 h-5" />
            Connect Meta Ads in Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Megaphone className="w-6 h-6 text-blue-400" />
            Active Campaigns
          </h2>
          <p className="text-brand-textMuted mt-1 text-sm">
            {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} from Meta Ads
          </p>
        </div>
        <button
          onClick={loadCampaigns}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1E3A5F]/30 text-brand-textMuted hover:text-blue-400 hover:border-blue-500/30 transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#162238] border border-[#1E3A5F]/30 text-center">
          <Megaphone className="w-12 h-12 text-brand-textMuted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No campaigns found</h3>
          <p className="text-brand-textMuted text-sm">
            You don't have any active campaigns in your Meta Ads account yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E3A5F]/30">
                <th className="text-left text-brand-textMuted text-xs uppercase tracking-wider py-3 px-4">Campaign</th>
                <th className="text-left text-brand-textMuted text-xs uppercase tracking-wider py-3 px-2">Status</th>
                <th className="text-right text-brand-textMuted text-xs uppercase tracking-wider py-3 px-2">Budget</th>
                <th className="text-right text-brand-textMuted text-xs uppercase tracking-wider py-3 px-2">Spend</th>
                <th className="text-right text-brand-textMuted text-xs uppercase tracking-wider py-3 px-2">Impressions</th>
                <th className="text-right text-brand-textMuted text-xs uppercase tracking-wider py-3 px-2">Clicks</th>
                <th className="text-right text-brand-textMuted text-xs uppercase tracking-wider py-3 px-4">CTR</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((camp) => {
                const budget = camp.daily_budget || camp.lifetime_budget || 0;
                const ctr = camp.ctr || (camp.impressions && camp.clicks ? (camp.clicks / camp.impressions) * 100 : 0);
                const statusColor = camp.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : camp.status === 'PAUSED'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-white/5 text-brand-textMuted border-white/10';

                return (
                  <tr key={camp.id} className="border-b border-[#1E3A5F]/15 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="text-white text-sm font-medium">{camp.name}</p>
                        {camp.objective && (
                          <p className="text-brand-textMuted text-xs mt-0.5 capitalize">{camp.objective.toLowerCase().replace(/_/g, ' ')}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border",
                        statusColor
                      )}>
                        {camp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right text-white text-sm font-mono tabular-nums">
                      {budget > 0 ? formatCurrency(budget) : '—'}
                      {camp.daily_budget ? <span className="text-brand-textMuted text-xs">/day</span> : ''}
                    </td>
                    <td className="py-3.5 px-2 text-right text-blue-400 text-sm font-semibold tabular-nums">
                      {camp.spend ? formatCurrency(camp.spend) : '—'}
                    </td>
                    <td className="py-3.5 px-2 text-right text-white/80 text-sm tabular-nums">
                      {camp.impressions ? formatNumber(camp.impressions) : '—'}
                    </td>
                    <td className="py-3.5 px-2 text-right text-white/80 text-sm tabular-nums">
                      {camp.clicks ? formatNumber(camp.clicks) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {ctr > 0 ? (
                        <span className={cn(
                          "text-sm font-semibold tabular-nums",
                          ctr >= 2 ? "text-emerald-400" : ctr >= 1 ? "text-amber-400" : "text-red-400"
                        )}>
                          {ctr.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-brand-textMuted text-sm">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
