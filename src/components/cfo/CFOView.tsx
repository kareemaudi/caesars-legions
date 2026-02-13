import { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Plus,
  X,
  Loader2,
  Sparkles,
  BarChart3,
  Receipt,
  Lightbulb,
  Trash2,
  RefreshCw,
  Download,
  FileSpreadsheet,
  Users,
  Database,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCFOData, generateCFOData, getTransactions, addTransaction, deleteTransaction, getStoredUser } from '@/lib/api';
import { useLang } from '@/lib/i18n';

interface CFOFinancialData {
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
  profitMargin: string;
  totalRevenue?: number;
  totalExpenses?: number;
  transactionCount?: number;
  monthlyRevenue_avg?: number;
  monthlyExpenses_avg?: number;
  categoryBreakdown?: Record<string, { income: number; expenses: number; count: number }>;
  projections: Array<{ month: string; revenue: number; expenses: number }>;
  insights: string[];
  kpis: {
    cashRunway: string;
    burnRate: number;
    breakEvenPoint: string;
    customerAcquisitionCost: number;
    totalRevenue?: string;
    totalExpenses?: string;
    netProfit?: string;
    avgMonthlyRevenue?: string;
    transactionCount?: number;
  };
  generatedAt?: string;
  businessName?: string;
  industry?: string;
  location?: string;
  dataSource?: string;
  transactions?: Array<{
    id: string;
    date: string;
    type: 'income' | 'expense';
    category: string;
    description: string;
    amount: number;
    clientName?: string;
    invoiceNumber?: string;
    source?: string;
  }>;
  lastSync?: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt?: string;
  clientName?: string;
  invoiceNumber?: string;
}

interface TeamMember {
  id?: string;
  name: string;
  position?: string;
  role?: string;
  amount?: number;
  salary?: number;
  monthly_amount?: number;
}

type SortField = 'date' | 'category' | 'amount' | 'description' | 'clientName';
type SortDir = 'asc' | 'desc';

/** Parse "9-Jan-2026" → Date object */
function parseTxDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  // Try native parse first — handles "9-Jan-2026"
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  // Fallback: manual parse "D-Mon-YYYY"
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };
    const day = parseInt(parts[0], 10);
    const mon = months[parts[1]] ?? 0;
    const year = parseInt(parts[2], 10);
    return new Date(year, mon, day);
  }
  return new Date(0);
}

export function CFOView() {
  const { t } = useLang();
  const [data, setData] = useState<CFOFinancialData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [txForm, setTxForm] = useState({ type: 'income' as 'income' | 'expense', amount: '', category: '', description: '', date: '' });
  const [addingTx, setAddingTx] = useState(false);
  const [error, setError] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Transactions table state
  const [txPage, setTxPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const TX_PER_PAGE = 50;

  const isSupabase = data?.dataSource === 'supabase-financial-transactions';

  // Merge Supabase transactions from data.transactions with local transactions
  const allTransactions = useMemo(() => {
    if (isSupabase && data?.transactions && data.transactions.length > 0) {
      return data.transactions as Transaction[];
    }
    return transactions;
  }, [isSupabase, data, transactions]);

  // Sorted transactions
  const sortedTransactions = useMemo(() => {
    const arr = [...allTransactions];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date':
          cmp = parseTxDate(a.date).getTime() - parseTxDate(b.date).getTime();
          break;
        case 'amount':
          cmp = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case 'category':
          cmp = (a.category || '').localeCompare(b.category || '');
          break;
        case 'description':
          cmp = (a.description || '').localeCompare(b.description || '');
          break;
        case 'clientName':
          cmp = ((a as any).clientName || '').localeCompare((b as any).clientName || '');
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return arr;
  }, [allTransactions, sortField, sortDir]);

  const paginatedTransactions = useMemo(() => {
    return sortedTransactions.slice(0, txPage * TX_PER_PAGE);
  }, [sortedTransactions, txPage]);

  // Load data on mount
  useEffect(() => {
    document.title = 'CFO — Financial Intelligence — Mubyn';
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [cfoRes, txRes] = await Promise.all([getCFOData(), getTransactions()]);
      if (cfoRes.data) setData(cfoRes.data);
      if (txRes.transactions) setTransactions(txRes.transactions);
    } catch (e: any) {
      console.error('CFO load error:', e);
    } finally {
      setLoading(false);
    }

    // Fetch team data (non-blocking)
    try {
      const user = getStoredUser();
      if (user?.id) {
        const API_BASE = import.meta.env.VITE_API_URL || 'https://natural-energy-production-df04.up.railway.app';
        const token = localStorage.getItem('mubyn-token') || user?.token;
        const res = await fetch(`${API_BASE}/api/integrations/supabase/${user.id}/data/payroll_eligible_employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const rows = json.data || json.rows || json || [];
          if (Array.isArray(rows) && rows.length > 0) {
            setTeamMembers(rows);
          }
        }
      }
    } catch (e: any) {
      console.error('Team data fetch error:', e);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const user = getStoredUser();
      const result = await generateCFOData({
        businessName: user?.business_name || undefined,
        industry: undefined,
        location: 'UAE',
      });
      if (result.data) {
        setData(result.data);
      }
    } catch (e: any) {
      setError(e.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerate() {
    setGenerating(true);
    setError('');
    try {
      const user = getStoredUser();
      const result = await generateCFOData({
        businessName: user?.business_name || data?.businessName || undefined,
        industry: data?.industry || undefined,
        location: data?.location || 'UAE',
      });
      if (result.data) setData(result.data);
    } catch (e: any) {
      setError(e.message || 'Regeneration failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleAddTransaction() {
    if (!txForm.amount) return;
    setAddingTx(true);
    try {
      const result = await addTransaction({
        type: txForm.type,
        amount: parseFloat(txForm.amount),
        category: txForm.category || undefined,
        description: txForm.description || undefined,
        date: txForm.date || undefined,
      });
      if (result.transaction) {
        setTransactions(prev => [result.transaction, ...prev]);
      }
      setTxForm({ type: 'income', amount: '', category: '', description: '', date: '' });
      setShowAddTx(false);
    } catch (e: any) {
      setError(e.message || 'Failed to add transaction');
    } finally {
      setAddingTx(false);
    }
  }

  async function handleDeleteTx(txId: string) {
    try {
      await deleteTransaction(txId);
      setTransactions(prev => prev.filter(t => t.id !== txId));
    } catch (e: any) {
      console.error('Delete tx error:', e);
    }
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'date' ? 'desc' : 'asc');
    }
    setTxPage(1);
  }

  function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  }

  function formatNumber(n: number) {
    return new Intl.NumberFormat('en-US').format(n);
  }

  function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleDownloadPL() {
    if (!data) return;
    const businessName = data.businessName || 'My Business';
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    if (isSupabase) {
      // Supabase P&L with category breakdown
      const lines = [
        `Profit & Loss Statement - ${businessName}`,
        `Generated: ${date}`,
        `Data Source: Supabase Financial Transactions`,
        `Transaction Count: ${data.transactionCount || allTransactions.length}`,
        '',
        'REVENUE',
        `Total Revenue,"${formatCurrency(data.totalRevenue || data.monthlyRevenue)}"`,
        `Avg Monthly Revenue,"${formatCurrency(data.monthlyRevenue)}"`,
        '',
        'EXPENSES',
        `Total Expenses,"${formatCurrency(data.totalExpenses || data.monthlyExpenses)}"`,
        `Avg Monthly Expenses,"${formatCurrency(data.monthlyExpenses)}"`,
        '',
        'NET PROFIT',
        `Net Profit,"${formatCurrency(data.netProfit)}"`,
        `Profit Margin,${data.profitMargin}`,
        '',
        'CATEGORY BREAKDOWN',
        'Category,Income,Expenses,Count',
      ];
      if (data.categoryBreakdown) {
        Object.entries(data.categoryBreakdown).forEach(([cat, vals]) => {
          lines.push(`"${cat}","${formatCurrency(vals.income)}","${formatCurrency(Math.abs(vals.expenses))}",${vals.count}`);
        });
      }
      downloadCSV(lines.join('\n'), `PnL_${businessName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    } else {
      const csv = [
        `Profit & Loss Statement - ${businessName}`,
        `Generated: ${date}`,
        '',
        'REVENUE',
        `Monthly Revenue,"${formatCurrency(data.monthlyRevenue)}"`,
        '',
        'EXPENSES',
        `Monthly Expenses,"${formatCurrency(data.monthlyExpenses)}"`,
        '',
        'NET PROFIT',
        `Net Profit,"${formatCurrency(data.netProfit)}"`,
        `Profit Margin,${data.profitMargin}`,
        '',
        'KEY METRICS',
        `Burn Rate,"${formatCurrency(data.kpis.burnRate)}"`,
        `Cash Runway,${data.kpis.cashRunway}`,
        `Break-even Point,${data.kpis.breakEvenPoint}`,
        `Customer Acquisition Cost,"${formatCurrency(data.kpis.customerAcquisitionCost)}"`,
        '',
        'PROJECTIONS',
        'Month,Revenue,Expenses,Net Profit',
        ...(data.projections || []).map(p =>
          `${p.month},"${formatCurrency(p.revenue)}","${formatCurrency(p.expenses)}","${formatCurrency(p.revenue - p.expenses)}"`
        ),
      ].join('\n');
      downloadCSV(csv, `PnL_${businessName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    }
  }

  function handleExportTransactions() {
    const txList = allTransactions;
    if (!txList.length) return;
    const csv = [
      'Date,Type,Category,Description,Client,Invoice,Amount',
      ...txList.map(tx =>
        `${tx.date},${tx.type},"${tx.category || ''}","${(tx.description || '').replace(/"/g, '""')}","${((tx as any).clientName || '').replace(/"/g, '""')}","${((tx as any).invoiceNumber || '').replace(/"/g, '""')}",${tx.amount}`
      ),
    ].join('\n');
    downloadCSV(csv, `Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  // Category breakdown sorted by absolute amount
  const sortedCategories = useMemo(() => {
    if (!data?.categoryBreakdown) return [];
    return Object.entries(data.categoryBreakdown)
      .map(([name, vals]) => ({
        name,
        income: vals.income,
        expenses: Math.abs(vals.expenses),
        count: vals.count,
        isIncome: vals.income > 0 && vals.expenses === 0,
        total: vals.income > 0 ? vals.income : Math.abs(vals.expenses),
      }))
      .sort((a, b) => b.total - a.total);
  }, [data?.categoryBreakdown]);

  const maxCategoryAmount = useMemo(() => {
    if (sortedCategories.length === 0) return 1;
    return sortedCategories[0].total;
  }, [sortedCategories]);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-8 w-64 bg-brand-card rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-brand-card rounded-xl border border-brand-border" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-brand-card rounded-xl border border-brand-border" />
          <div className="h-72 bg-brand-card rounded-xl border border-brand-border" />
        </div>
      </div>
    );
  }

  // ── No Data — First Visit ──
  if (!data) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-brand-gold" />
            {t('cfo.title')}
          </h1>
          <p className="text-brand-textMuted mt-1">{t('cfo.subtitle')}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-brand-gold/30 bg-gradient-to-br from-brand-card to-brand-dark p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
              {generating ? (
                <Loader2 className="w-10 h-10 text-brand-gold animate-spin" />
              ) : (
                <Sparkles className="w-10 h-10 text-brand-gold" />
              )}
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              {generating ? t('cfo.analyzing') : t('cfo.letCaesar')}
            </h2>
            <p className="text-brand-textMuted max-w-lg mx-auto text-lg mb-8">
              {generating
                ? t('cfo.analyzingDesc')
                : t('cfo.letCaesarDesc')}
            </p>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {generating ? (
              <div className="space-y-3 max-w-md mx-auto">
                {['Analyzing industry benchmarks...', 'Calculating projections...', 'Generating insights...'].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-brand-textMuted animate-pulse" style={{ animationDelay: `${i * 500}ms` }}>
                    <div className="w-2 h-2 rounded-full bg-brand-gold" />
                    {step}
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-gold text-brand-dark font-semibold hover:bg-brand-goldBright transition-colors text-lg"
              >
                <Sparkles className="w-5 h-5" />
                {t('cfo.generateAnalysis')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main Dashboard ──
  const maxProjectionRevenue = Math.max(...(data.projections || []).map(p => p.revenue), data.monthlyRevenue || 1);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-brand-gold" />
            {t('cfo.title')}
          </h1>
          <p className="text-brand-textMuted mt-1">
            {isSupabase ? 'Real financial data from your accounting system' : t('cfo.aiInsights')}
            {data.generatedAt && !isSupabase && (
              <span className="text-brand-textMuted/60 ml-2">
                · Updated {new Date(data.generatedAt).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPL}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-colors text-sm font-medium"
            title="Download P&L Statement"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download P&L
          </button>
          {!isSupabase && (
            <button
              onClick={handleRegenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border text-brand-textMuted hover:text-brand-gold hover:border-brand-gold/30 transition-colors text-sm disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", generating && "animate-spin")} />
              {generating ? 'Regenerating...' : 'AI Analysis'}
            </button>
          )}
        </div>
      </div>

      {/* ── Data Source Badge ── */}
      {isSupabase && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-sm font-medium">
            📊 Live from Supabase · {data.transactionCount || allTransactions.length} transactions
            {data.lastSync && ` · Last sync: ${new Date(data.lastSync).toLocaleDateString()}`}
            {!data.lastSync && data.generatedAt && ` · Last sync: ${new Date(data.generatedAt).toLocaleDateString()}`}
          </span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      {isSupabase ? (
        /* Supabase KPI Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total Revenue"
            value={formatCurrency(data.totalRevenue || data.monthlyRevenue)}
            icon={TrendingUp}
            trend="up"
            trendValue={`Avg Monthly: ${formatCurrency(data.monthlyRevenue)}`}
            subtitle="All-time"
            color="green"
            sparkline={data.projections?.slice(0, 6).map(p => p.revenue)}
          />
          <KPICard
            label="Total Expenses"
            value={formatCurrency(data.totalExpenses || data.monthlyExpenses)}
            icon={TrendingDown}
            trend="neutral"
            trendValue={`Avg Monthly: ${formatCurrency(data.monthlyExpenses)}`}
            subtitle="All-time"
            color="red"
          />
          <KPICard
            label="Net Profit"
            value={formatCurrency(data.netProfit)}
            icon={DollarSign}
            trend={data.netProfit >= 0 ? 'up' : 'down'}
            trendValue={`${data.profitMargin} margin`}
            subtitle={data.netProfit >= 0 ? 'Profitable' : 'Loss'}
            color={data.netProfit >= 0 ? 'green' : 'red'}
            sparkline={data.projections?.slice(0, 6).map(p => p.revenue - p.expenses)}
          />
          <KPICard
            label="Monthly Payroll"
            value={formatCurrency(data.kpis.burnRate)}
            icon={Users}
            trend="neutral"
            trendValue="$10,260/month"
            subtitle="Team cost"
            color="gold"
          />
        </div>
      ) : (
        /* AI-generated KPI Cards (original) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label={t('cfo.monthlyRevenue')}
            value={formatCurrency(data.monthlyRevenue)}
            icon={TrendingUp}
            trend="up"
            trendValue={(data as any).revenueGrowth || '+0%'}
            color="green"
          />
          <KPICard
            label={t('cfo.monthlyExpenses')}
            value={formatCurrency(data.monthlyExpenses)}
            icon={TrendingDown}
            trend="neutral"
            trendValue={`${Math.round((data.monthlyExpenses / data.monthlyRevenue) * 100)}% of revenue`}
            color="red"
          />
          <KPICard
            label={t('cfo.netProfit')}
            value={formatCurrency(data.netProfit)}
            icon={DollarSign}
            trend={data.netProfit >= 0 ? 'up' : 'down'}
            trendValue={data.profitMargin + ' margin'}
            color={data.netProfit >= 0 ? 'green' : 'red'}
          />
          <KPICard
            label={t('cfo.burnRate')}
            value={formatCurrency(data.kpis.burnRate)}
            icon={PieChart}
            trend="neutral"
            trendValue={`Runway: ${data.kpis.cashRunway}`}
            color="gold"
          />
        </div>
      )}

      {/* ── Secondary KPIs ── */}
      {isSupabase ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
            <p className="text-brand-textMuted text-xs uppercase tracking-wider mb-1">Transaction Count</p>
            <p className="text-white font-semibold text-lg">{formatNumber(data.transactionCount || allTransactions.length)}</p>
          </div>
          <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
            <p className="text-brand-textMuted text-xs uppercase tracking-wider mb-1">Data Period</p>
            <p className="text-white font-semibold text-lg">Jan 2025 – Feb 2026</p>
          </div>
          <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
            <p className="text-brand-textMuted text-xs uppercase tracking-wider mb-1">Avg Monthly Revenue</p>
            <p className="text-white font-semibold text-lg">{formatCurrency(data.monthlyRevenue)}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
            <p className="text-brand-textMuted text-xs uppercase tracking-wider mb-1">{t('cfo.breakEvenPoint')}</p>
            <p className="text-white font-semibold text-lg">{data.kpis.breakEvenPoint}</p>
          </div>
          <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
            <p className="text-brand-textMuted text-xs uppercase tracking-wider mb-1">{t('cfo.cac')}</p>
            <p className="text-white font-semibold text-lg">${formatNumber(data.kpis.customerAcquisitionCost)}</p>
          </div>
          <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
            <p className="text-brand-textMuted text-xs uppercase tracking-wider mb-1">{t('cfo.cashRunway')}</p>
            <p className="text-white font-semibold text-lg">{data.kpis.cashRunway}</p>
          </div>
        </div>
      )}

      {/* ── P&L Summary / Category Breakdown ── */}
      {isSupabase && sortedCategories.length > 0 ? (
        /* Category Breakdown for Supabase data */
        <div className="p-6 rounded-xl bg-brand-card border border-brand-border">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-gold" />
              <h3 className="text-white font-semibold">Category Breakdown</h3>
            </div>
            <span className="text-brand-textMuted text-xs">
              {sortedCategories.length} categories · {data.transactionCount || allTransactions.length} transactions
            </span>
          </div>

          <div className="space-y-3">
            {sortedCategories.map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-medium", cat.isIncome ? "text-emerald-400" : "text-red-400")}>
                      {cat.name}
                    </span>
                    <span className="text-brand-textMuted text-xs">({cat.count} txns)</span>
                  </div>
                  <span className={cn("text-sm font-semibold tabular-nums", cat.isIncome ? "text-emerald-400" : "text-red-400")}>
                    {cat.isIncome ? '+' : '-'}{formatCurrency(cat.total)}
                  </span>
                </div>
                <div className="h-3 bg-white/5 rounded-md overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-md transition-all duration-700",
                      cat.isIncome
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                        : "bg-gradient-to-r from-red-600/80 to-red-400"
                    )}
                    style={{ width: `${Math.max((cat.total / maxCategoryAmount) * 100, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary footer */}
          <div className="border-t border-brand-border pt-4 mt-4">
            <div className="flex items-center justify-between">
              <span className={cn("text-lg font-bold", data.netProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                {data.netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
              </span>
              <span className={cn("text-2xl font-bold tabular-nums", data.netProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                {formatCurrency(data.netProfit)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-brand-textMuted text-xs">Profit Margin</span>
              <span className={cn("text-sm font-medium", data.netProfit >= 0 ? "text-emerald-400/80" : "text-red-400/80")}>
                {data.profitMargin}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Original P&L Summary for AI-generated data */
        <div className="p-6 rounded-xl bg-brand-card border border-brand-border">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-brand-gold" />
              <h3 className="text-white font-semibold">P&L Summary</h3>
            </div>
            <span className="text-brand-textMuted text-xs">
              {data.generatedAt ? new Date(data.generatedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Current Period'}
            </span>
          </div>

          <div className="space-y-4">
            {/* Revenue Bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-emerald-400 font-medium">Revenue</span>
                <span className="text-sm text-emerald-400 font-semibold tabular-nums">{formatCurrency(data.monthlyRevenue)}</span>
              </div>
              <div className="h-4 bg-white/5 rounded-md overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-md transition-all duration-700"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Expenses Bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-red-400 font-medium">Expenses</span>
                <span className="text-sm text-red-400 font-semibold tabular-nums">{formatCurrency(data.monthlyExpenses)}</span>
              </div>
              <div className="h-4 bg-white/5 rounded-md overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600/80 to-red-400 rounded-md transition-all duration-700"
                  style={{ width: `${Math.min((data.monthlyExpenses / data.monthlyRevenue) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-brand-border pt-4">
              <div className="flex items-center justify-between">
                <span className={cn("text-lg font-bold", data.netProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {data.netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
                </span>
                <span className={cn("text-2xl font-bold tabular-nums", data.netProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {formatCurrency(data.netProfit)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-brand-textMuted text-xs">Profit Margin</span>
                <span className={cn("text-sm font-medium", data.netProfit >= 0 ? "text-emerald-400/80" : "text-red-400/80")}>
                  {data.profitMargin}
                </span>
              </div>
            </div>

            {/* MoM Comparison */}
            {data.projections && data.projections.length > 0 && (
              <div className="pt-3 border-t border-brand-border">
                <p className="text-brand-textMuted text-xs">
                  <span className="text-brand-gold font-medium">Projected next month:</span>{' '}
                  {formatCurrency(data.projections[0].revenue)} revenue / {formatCurrency(data.projections[0].expenses)} expenses
                  {' → '}
                  <span className={cn(
                    "font-semibold",
                    (data.projections[0].revenue - data.projections[0].expenses) >= data.netProfit ? "text-emerald-400" : "text-red-400"
                  )}>
                    {(data.projections[0].revenue - data.projections[0].expenses) >= data.netProfit ? '↑' : '↓'}{' '}
                    {formatCurrency(data.projections[0].revenue - data.projections[0].expenses)} profit
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Charts Row (only for AI-generated data) ── */}
      {!isSupabase && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="p-6 rounded-xl bg-brand-card border border-brand-border">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-brand-gold" />
              <h3 className="text-white font-semibold">{t('cfo.revenueVsExpenses')}</h3>
            </div>
            <div className="space-y-4">
              {/* Current Month */}
              <ChartBar
                label="Current"
                revenue={data.monthlyRevenue}
                expenses={data.monthlyExpenses}
                maxVal={maxProjectionRevenue}
              />
              {/* Projections */}
              {(data.projections || []).map((p, i) => (
                <ChartBar
                  key={i}
                  label={p.month}
                  revenue={p.revenue}
                  expenses={p.expenses}
                  maxVal={maxProjectionRevenue}
                />
              ))}
            </div>
            <div className="flex items-center gap-6 mt-6 pt-4 border-t border-brand-border">
              <div className="flex items-center gap-2 text-xs text-brand-textMuted">
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                Revenue
              </div>
              <div className="flex items-center gap-2 text-xs text-brand-textMuted">
                <div className="w-3 h-3 rounded-sm bg-red-400" />
                Expenses
              </div>
            </div>
          </div>

          {/* Cash Flow Projection */}
          <div className="p-6 rounded-xl bg-brand-card border border-brand-border">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-brand-gold" />
              <h3 className="text-white font-semibold">{t('cfo.profitProjection')}</h3>
            </div>
            <div className="space-y-3">
              {(data.projections || []).map((p, i) => {
                const profit = p.revenue - p.expenses;
                const maxProfit = Math.max(...(data.projections || []).map(pp => pp.revenue - pp.expenses), 1);
                const pct = Math.max((profit / maxProfit) * 100, 5);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-brand-textMuted text-xs w-20 text-right font-mono">{p.month}</span>
                    <div className="flex-1 h-7 bg-white/5 rounded-md overflow-hidden relative">
                      <div
                        className={cn(
                          "h-full rounded-md transition-all duration-500",
                          profit >= 0
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                            : "bg-gradient-to-r from-red-600 to-red-400"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white/80">
                        {formatCurrency(profit)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── AI Insights ── */}
      {data.insights && data.insights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-brand-gold" />
            <h3 className="text-white font-semibold">{t('cfo.aiInsightsTitle')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.insights.map((insight, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-brand-card border border-brand-gold/20 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-gold" />
                <div className="flex items-start gap-3 pl-2">
                  <Sparkles className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" />
                  <p className="text-white/90 text-sm leading-relaxed">{insight}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Team & Payroll ── */}
      {teamMembers.length > 0 && (() => {
        const totalPayroll = teamMembers.reduce((sum, m) => sum + (m.amount || m.salary || m.monthly_amount || 0), 0);
        return (
          <div className="p-6 rounded-xl bg-brand-card border border-brand-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-gold" />
                <h3 className="text-white font-semibold">Team & Payroll</h3>
                <span className="text-brand-textMuted text-xs ml-1">({teamMembers.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-brand-textMuted text-xs">Monthly Total</span>
                <span className="text-white font-bold text-lg tabular-nums">{formatCurrency(totalPayroll)}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="text-left text-brand-textMuted text-xs uppercase tracking-wider py-2 px-2">Name</th>
                    <th className="text-left text-brand-textMuted text-xs uppercase tracking-wider py-2 px-2">Position</th>
                    <th className="text-right text-brand-textMuted text-xs uppercase tracking-wider py-2 px-2">Monthly Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member, i) => (
                    <tr key={member.id || i} className="border-b border-brand-border/50 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-2 text-white text-sm font-medium">{member.name}</td>
                      <td className="py-2.5 px-2 text-brand-textMuted text-sm">{member.position || member.role || '—'}</td>
                      <td className="py-2.5 px-2 text-right text-sm font-semibold tabular-nums text-brand-gold">
                        {formatCurrency(member.amount || member.salary || member.monthly_amount || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ── Transactions Table ── */}
      <div className="p-6 rounded-xl bg-brand-card border border-brand-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-gold" />
            <h3 className="text-white font-semibold">{isSupabase ? 'All Transactions' : t('cfo.recentTx')}</h3>
            <span className="text-brand-textMuted text-xs ml-1">({allTransactions.length})</span>
          </div>
          <div className="flex items-center gap-2">
            {allTransactions.length > 0 && (
              <button
                onClick={handleExportTransactions}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm font-medium border border-emerald-500/20"
                title="Export transactions as CSV"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
            {!isSupabase && (
              <button
                onClick={() => setShowAddTx(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 transition-colors text-sm font-medium border border-brand-gold/20"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            )}
          </div>
        </div>

        {/* Add Transaction Form (only for non-Supabase) */}
        {showAddTx && !isSupabase && (
          <div className="mb-4 p-4 rounded-xl bg-white/5 border border-brand-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-white text-sm font-medium">New Transaction</h4>
              <button onClick={() => setShowAddTx(false)} className="text-brand-textMuted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <select
                value={txForm.type}
                onChange={e => setTxForm(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                className="col-span-1 bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-gold/50"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <input
                type="number"
                placeholder="Amount"
                value={txForm.amount}
                onChange={e => setTxForm(prev => ({ ...prev, amount: e.target.value }))}
                className="col-span-1 bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-white text-sm placeholder:text-brand-textMuted/50 focus:outline-none focus:border-brand-gold/50"
              />
              <input
                type="text"
                placeholder="Category"
                value={txForm.category}
                onChange={e => setTxForm(prev => ({ ...prev, category: e.target.value }))}
                className="col-span-1 bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-white text-sm placeholder:text-brand-textMuted/50 focus:outline-none focus:border-brand-gold/50"
              />
              <input
                type="text"
                placeholder="Description"
                value={txForm.description}
                onChange={e => setTxForm(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-1 bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-white text-sm placeholder:text-brand-textMuted/50 focus:outline-none focus:border-brand-gold/50"
              />
              <button
                onClick={handleAddTransaction}
                disabled={!txForm.amount || addingTx}
                className="col-span-1 bg-brand-gold text-brand-dark rounded-lg px-4 py-2 text-sm font-semibold hover:bg-brand-goldBright transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {addingTx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        {allTransactions.length === 0 ? (
          <div className="text-center py-8 text-brand-textMuted text-sm">
            {t('cfo.noTx')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border">
                  <SortableHeader field="date" label="Date" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <SortableHeader field="category" label="Category" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <SortableHeader field="description" label="Description" current={sortField} dir={sortDir} onSort={toggleSort} />
                  {isSupabase && (
                    <SortableHeader field="clientName" label="Client" current={sortField} dir={sortDir} onSort={toggleSort} />
                  )}
                  <SortableHeader field="amount" label="Amount" current={sortField} dir={sortDir} onSort={toggleSort} align="right" />
                  {!isSupabase && (
                    <th className="text-right text-brand-textMuted text-xs uppercase tracking-wider py-2 px-2 w-10"></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map(tx => (
                  <tr key={tx.id} className="border-b border-brand-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-2 text-brand-textMuted text-sm font-mono whitespace-nowrap">{tx.date}</td>
                    <td className="py-2.5 px-2">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                        tx.type === 'income'
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      )}>
                        {tx.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {tx.category || tx.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-brand-textMuted text-sm truncate max-w-[200px]">{tx.description || '—'}</td>
                    {isSupabase && (
                      <td className="py-2.5 px-2 text-white/70 text-sm truncate max-w-[140px]">{(tx as any).clientName || '—'}</td>
                    )}
                    <td className={cn(
                      "py-2.5 px-2 text-right text-sm font-semibold tabular-nums whitespace-nowrap",
                      tx.type === 'income' ? "text-emerald-400" : "text-red-400"
                    )}>
                      {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount)}
                    </td>
                    {!isSupabase && (
                      <td className="py-2.5 px-2 text-right">
                        <button
                          onClick={() => handleDeleteTx(tx.id)}
                          className="text-brand-textMuted/40 hover:text-red-400 transition-colors p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination / Load More */}
            {paginatedTransactions.length < sortedTransactions.length && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setTxPage(prev => prev + 1)}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-brand-border text-brand-textMuted hover:text-white hover:border-brand-gold/30 transition-colors text-sm"
                >
                  <ChevronDown className="w-4 h-4" />
                  Load more ({sortedTransactions.length - paginatedTransactions.length} remaining)
                </button>
              </div>
            )}
            {paginatedTransactions.length >= sortedTransactions.length && sortedTransactions.length > TX_PER_PAGE && (
              <p className="text-center text-brand-textMuted text-xs mt-3">
                Showing all {sortedTransactions.length} transactions
              </p>
            )}
            {sortedTransactions.length <= TX_PER_PAGE && sortedTransactions.length > 0 && (
              <p className="text-center text-brand-textMuted text-xs mt-3">
                {sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──

function KPICard({ label, value, icon: Icon, trend, trendValue, color, subtitle, sparkline }: {
  label: string;
  value: string;
  icon: any;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  color: 'green' | 'red' | 'gold';
  subtitle?: string;
  sparkline?: number[]; // Optional mini chart data (6 values for last 6 periods)
}) {
  const colorMap = {
    green: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: 'text-emerald-400', spark: '#10b981' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: 'text-red-400', spark: '#ef4444' },
    gold: { bg: 'bg-brand-gold/10', border: 'border-brand-gold/20', text: 'text-brand-gold', icon: 'text-brand-gold', spark: '#D4A843' },
  };
  const c = colorMap[color];

  // Generate sparkline SVG path
  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) return null;
    const max = Math.max(...sparkline);
    const min = Math.min(...sparkline);
    const range = max - min || 1;
    const w = 60, h = 20;
    const points = sparkline.map((v, i) => {
      const x = (i / (sparkline.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg width={w} height={h} className="opacity-60">
        <polyline fill="none" stroke={c.spark} strokeWidth="1.5" points={points} />
      </svg>
    );
  };

  return (
    <div className="p-5 rounded-xl bg-brand-card border border-brand-border hover:border-brand-border/80 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-brand-textMuted text-xs uppercase tracking-wider font-medium">{label}</p>
          {subtitle && (
            <p className="text-brand-textMuted/50 text-[10px] mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", c.bg, c.border, "border")}>
          <Icon className={cn("w-4 h-4", c.icon)} />
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-white text-2xl font-bold tracking-tight">{value}</p>
        {sparkline && renderSparkline()}
      </div>
      <div className="flex items-center gap-1 mt-2">
        {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />}
        {trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
        <span className={cn("text-xs", trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-brand-textMuted')}>
          {trendValue}
        </span>
      </div>
    </div>
  );
}

function SortableHeader({ field, label, current, dir, onSort, align }: {
  field: SortField;
  label: string;
  current: SortField;
  dir: SortDir;
  onSort: (f: SortField) => void;
  align?: 'right';
}) {
  const isActive = current === field;
  return (
    <th
      className={cn(
        "text-brand-textMuted text-xs uppercase tracking-wider py-2 px-2 cursor-pointer hover:text-brand-gold transition-colors select-none",
        align === 'right' ? 'text-right' : 'text-left'
      )}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronsUpDown className="w-3 h-3 opacity-30" />
        )}
      </span>
    </th>
  );
}

function ChartBar({ label, revenue, expenses, maxVal }: {
  label: string;
  revenue: number;
  expenses: number;
  maxVal: number;
}) {
  const revPct = Math.max((revenue / maxVal) * 100, 2);
  const expPct = Math.max((expenses / maxVal) * 100, 2);

  return (
    <div className="flex items-center gap-3">
      <span className="text-brand-textMuted text-xs w-16 text-right font-mono truncate">{label}</span>
      <div className="flex-1 space-y-1">
        <div className="h-3 bg-white/5 rounded-sm overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-sm transition-all duration-700"
            style={{ width: `${revPct}%` }}
          />
        </div>
        <div className="h-3 bg-white/5 rounded-sm overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600/80 to-red-400/80 rounded-sm transition-all duration-700"
            style={{ width: `${expPct}%` }}
          />
        </div>
      </div>
      <div className="text-right w-20">
        <p className="text-emerald-400 text-xs font-mono">${(revenue / 1000).toFixed(0)}k</p>
        <p className="text-red-400 text-xs font-mono">${(expenses / 1000).toFixed(0)}k</p>
      </div>
    </div>
  );
}
