import {
  Users, Search, Plus, Loader2, MapPin, Briefcase, Mail, Phone,
  Building2, User, Globe, Star, ChevronLeft, FileDown, Sparkles,
  Target, TrendingUp, ExternalLink, Send, Trash2, Zap,
  Copy, Check, X, ArrowUpRight, StickyNote, Clock, Upload, FileUp,
  Linkedin, Hash, BarChart3, Award, Bot,
} from 'lucide-react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { generateLeads, getLeads, updateLead, generateEmailDraft, sendLeadEmail, deleteLead } from '@/lib/api';
import { useLang } from '@/lib/i18n';

// Set page title
const PAGE_TITLE = 'Lead Agent — Mubyn';
import { SkeletonTableRows, SkeletonStatsCards } from '@/components/ui/Skeleton';

// ─── Types ───────────────────────────────────────────────────────────

interface Lead {
  id: string;
  businessName: string;
  contactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  googleRating: number;
  industry: string;
  description: string;
  location: string;
  country: string;
  city: string;
  status: LeadStatus;
  source: string;
  notes: string;
  emailDraft: EmailDraft | string;
  createdAt: string;
  updatedAt: string;
}

interface EmailDraft {
  subject: string;
  body: string;
  followUp1: string;
  followUp2: string;
}

type LeadStatus = 'new' | 'contacted' | 'replied' | 'meeting_booked';

// ─── Constants ───────────────────────────────────────────────────────

const INDUSTRIES = [
  'Restaurants & Food Services', 'Real Estate & Property', 'Healthcare & Medical',
  'E-commerce & Online Retail', 'Retail & Consumer Goods', 'Education & Training',
  'Legal & Professional Services', 'Hospitality & Tourism', 'Construction & Engineering',
  'Beauty & Wellness', 'Automotive & Transport', 'Technology & SaaS',
  'Financial Services & Fintech', 'Marketing & Advertising', 'Media & Entertainment',
  'Manufacturing & Industrial', 'Logistics & Supply Chain', 'Agriculture & Farming',
  'Energy & Utilities', 'Telecommunications', 'Consulting & Advisory',
  'Non-Profit & NGO', 'Government & Public Sector', 'Fashion & Apparel',
  'Fitness & Sports', 'Interior Design & Architecture', 'Events & Wedding Planning',
  'Cleaning & Maintenance', 'Pet Services', 'Photography & Videography',
  'Printing & Packaging', 'Recruitment & HR', 'Insurance',
  'Pharmacy & Medical Supplies', 'Import / Export & Trade',
];

const COUNTRIES: Record<string, string[]> = {
  'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain', 'Ras Al Khaimah', 'Fujairah'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar', 'Tabuk'],
  'Lebanon': ['Beirut', 'Tripoli', 'Sidon', 'Jounieh', 'Byblos', 'Zahle', 'Baalbek'],
  'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Sharm El Sheikh', 'Hurghada', 'Luxor', 'Aswan'],
  'Jordan': ['Amman', 'Aqaba', 'Irbid', 'Zarqa', 'Madaba', 'Jerash'],
  'Kuwait': ['Kuwait City', 'Salmiya', 'Hawally', 'Farwaniya', 'Jahra'],
  'Qatar': ['Doha', 'Al Wakrah', 'Al Khor', 'Lusail', 'Al Rayyan'],
  'Oman': ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur'],
  'Morocco': ['Casablanca', 'Marrakech', 'Rabat', 'Fez', 'Tangier', 'Agadir'],
  'Bahrain': ['Manama', 'Muharraq', 'Riffa', 'Isa Town', 'Hamad Town'],
  'Other': [],
};

const LEAD_COUNTS = [10, 25, 50];

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  contacted: { label: 'Contacted', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  replied: { label: 'Replied', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  meeting_booked: { label: 'Meeting Booked', color: 'text-brand-gold', bg: 'bg-brand-gold/10 border-brand-gold/20' },
};

// ─── Sub-Components ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: LeadStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent = false }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`p-5 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-lg ${
      accent
        ? 'bg-gradient-to-br from-brand-gold/10 to-brand-gold/5 border-brand-gold/20'
        : 'bg-brand-card border-brand-border'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          accent ? 'bg-brand-gold/20' : 'bg-white/5'
        }`}>
          <Icon className={`w-4.5 h-4.5 ${accent ? 'text-brand-gold' : 'text-brand-textMuted'}`} />
        </div>
      </div>
      <p className="text-sm text-brand-textMuted mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-brand-textMuted mt-1">{sub}</p>}
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.3;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < full
              ? 'text-brand-gold fill-brand-gold'
              : i === full && hasHalf
              ? 'text-brand-gold fill-brand-gold/50'
              : 'text-brand-border'
          }`}
        />
      ))}
      <span className="text-xs text-brand-textMuted ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Campaign Creation Dialog ────────────────────────────────────────

function CampaignDialog({ open, onClose, onSubmit, loading }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { industry: string; country: string; city: string; count: number }) => void;
  loading: boolean;
}) {
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [count, setCount] = useState(10);
  const [customCity, setCustomCity] = useState('');

  const cities = useMemo(() => COUNTRIES[country] || [], [country]);
  const finalCity = city === '__custom' ? customCity : city;

  const canSubmit = industry && country && finalCity.trim() && !loading;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-brand-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-gold" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Generate Leads</h2>
              <p className="text-sm text-brand-textMuted">Caesar will find real businesses using AI</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-brand-textMuted mb-2">
              <Briefcase className="w-3.5 h-3.5 inline mr-1.5" />
              Industry
            </label>
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-brand-dark border border-brand-border text-white focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/30 transition-all"
            >
              <option value="">Select industry...</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          {/* Country + City */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-textMuted mb-2">
                <Globe className="w-3.5 h-3.5 inline mr-1.5" />
                Country
              </label>
              <select
                value={country}
                onChange={e => { setCountry(e.target.value); setCity(''); }}
                className="w-full px-4 py-3 rounded-xl bg-brand-dark border border-brand-border text-white focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/30 transition-all"
              >
                <option value="">Select...</option>
                {Object.keys(COUNTRIES).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-textMuted mb-2">
                <MapPin className="w-3.5 h-3.5 inline mr-1.5" />
                City
              </label>
              {cities.length > 0 ? (
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-brand-dark border border-brand-border text-white focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/30 transition-all"
                  disabled={!country}
                >
                  <option value="">Select city...</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__custom">Other...</option>
                </select>
              ) : (
                <input
                  value={customCity}
                  onChange={e => setCustomCity(e.target.value)}
                  placeholder="Enter city..."
                  disabled={!country}
                  className="w-full px-4 py-3 rounded-xl bg-brand-dark border border-brand-border text-white placeholder:text-brand-textMuted focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/30 transition-all disabled:opacity-50"
                />
              )}
              {city === '__custom' && (
                <input
                  value={customCity}
                  onChange={e => setCustomCity(e.target.value)}
                  placeholder="Enter city name..."
                  className="mt-2 w-full px-4 py-3 rounded-xl bg-brand-dark border border-brand-border text-white placeholder:text-brand-textMuted focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/30 transition-all"
                />
              )}
            </div>
          </div>

          {/* Number of leads */}
          <div>
            <label className="block text-sm font-medium text-brand-textMuted mb-2">
              <Users className="w-3.5 h-3.5 inline mr-1.5" />
              Number of Leads
            </label>
            <div className="flex gap-3">
              {LEAD_COUNTS.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    count === n
                      ? 'bg-brand-gold/10 border-brand-gold text-brand-gold'
                      : 'bg-brand-dark border-brand-border text-brand-textMuted hover:border-brand-gold/40 hover:text-white'
                  }`}
                >
                  {n} leads
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-brand-border text-brand-textMuted hover:text-white hover:border-brand-gold/40 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => canSubmit && onSubmit({ industry, country, city: finalCity, count })}
            disabled={!canSubmit}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-brand-goldBright text-black font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Leads
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Lead Detail Panel ───────────────────────────────────────────────

function LeadDetailPanel({ lead, onClose, onStatusChange, onNotesChange, onSendEmail, onDelete }: {
  lead: Lead;
  onClose: () => void;
  onStatusChange: (status: LeadStatus) => void;
  onNotesChange: (notes: string) => void;
  onSendEmail?: (leadId: string, sequence?: string) => Promise<void>;
  onDelete?: (leadId: string) => void;
}) {
  const [notes, setNotes] = useState(lead.notes || '');
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(
    typeof lead.emailDraft === 'object' && lead.emailDraft ? lead.emailDraft as EmailDraft : null
  );
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeEmailTab, setActiveEmailTab] = useState<'initial' | 'followup1' | 'followup2'>('initial');

  const handleGenerateEmail = async () => {
    setGeneratingEmail(true);
    try {
      const result = await generateEmailDraft(lead.id);
      if (result.email) {
        setEmailDraft(result.email);
      }
    } catch (err) {
      console.error('Email draft failed:', err);
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveNotes = () => {
    onNotesChange(notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel - slides in from right */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-brand-dark border-l border-brand-border overflow-y-auto animate-in slide-in-from-right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-brand-dark/95 backdrop-blur-md border-b border-brand-border px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="flex items-center gap-2 text-brand-textMuted hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Back to leads</span>
            </button>
            <StatusBadge status={lead.status} />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Business Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center shrink-0">
                <Building2 className="w-7 h-7 text-brand-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-white">{lead.businessName}</h2>
                <p className="text-brand-textMuted mt-0.5">{lead.industry} • {lead.location}</p>
                {lead.googleRating > 0 && (
                  <div className="mt-2">
                    <RatingStars rating={lead.googleRating} />
                  </div>
                )}
              </div>
            </div>

            {lead.description && (
              <p className="text-sm text-brand-textMuted leading-relaxed pl-[72px]">{lead.description}</p>
            )}
          </div>

          {/* Contact Details */}
          <div className="rounded-xl bg-brand-card border border-brand-border p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Contact Info</h3>

            <div className="grid grid-cols-1 gap-3">
              <DetailRow icon={User} label="Contact" value={`${lead.contactName} — ${lead.contactTitle}`} />
              <DetailRow icon={Mail} label="Email" value={lead.email} href={`mailto:${lead.email}`} copyable />
              <DetailRow icon={Phone} label="Phone" value={lead.phone} href={`tel:${lead.phone}`} copyable />
              <DetailRow icon={Globe} label="Website" value={lead.website} href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} external />
              <DetailRow icon={MapPin} label="Address" value={lead.address} />
              <DetailRow icon={Briefcase} label="Industry" value={lead.industry} />
              <DetailRow icon={MapPin} label="Location" value={[lead.city, lead.country].filter(Boolean).join(', ') || lead.location} />
              {lead.website && lead.website !== 'N/A' && (
                <DetailRow icon={Linkedin} label="LinkedIn" value={`Search on LinkedIn`} href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(lead.businessName)}`} external />
              )}
            </div>
            {/* Lead Score */}
            {(lead as any).score > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <Award className="w-4 h-4 text-brand-gold" />
                <span className="text-xs text-brand-textMuted">Lead Score:</span>
                <div className="flex-1 h-2 bg-brand-dark rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((lead as any).score, 100)}%`, background: (lead as any).score >= 70 ? '#22c55e' : (lead as any).score >= 40 ? '#eab308' : '#ef4444' }} />
                </div>
                <span className={`text-xs font-semibold ${(lead as any).score >= 70 ? 'text-green-400' : (lead as any).score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {(lead as any).score}/100 {(lead as any).scoreTier ? `(${(lead as any).scoreTier})` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Status Update */}
          <div className="rounded-xl bg-brand-card border border-brand-border p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Update Status</h3>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    lead.status === s
                      ? 'bg-brand-gold/15 border-brand-gold text-brand-gold'
                      : 'bg-brand-dark border-brand-border text-brand-textMuted hover:text-white hover:border-brand-gold/40'
                  }`}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Email Draft */}
          <div className="rounded-xl bg-brand-card border border-brand-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-gold" />
                AI Email Draft
              </h3>
              {!emailDraft && (
                <button
                  onClick={handleGenerateEmail}
                  disabled={generatingEmail}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-sm font-medium hover:bg-brand-gold/20 transition-all disabled:opacity-50"
                >
                  {generatingEmail ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Drafting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate Draft
                    </>
                  )}
                </button>
              )}
            </div>

            {emailDraft ? (
              <div className="space-y-4">
                {/* Email tabs */}
                <div className="flex gap-1 p-1 bg-brand-dark rounded-lg">
                  {[
                    { key: 'initial' as const, label: 'Initial Email' },
                    { key: 'followup1' as const, label: 'Follow-up 1 (Day 3)' },
                    { key: 'followup2' as const, label: 'Follow-up 2 (Day 7)' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveEmailTab(tab.key)}
                      className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                        activeEmailTab === tab.key
                          ? 'bg-brand-card text-white shadow-sm'
                          : 'text-brand-textMuted hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Email content */}
                <div className="space-y-3">
                  {activeEmailTab === 'initial' && (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-brand-textMuted">Subject:</p>
                        <button
                          onClick={() => handleCopy(emailDraft.subject, 'subject')}
                          className="text-brand-textMuted hover:text-brand-gold transition-colors"
                        >
                          {copied === 'subject' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-sm font-medium text-white bg-brand-dark rounded-lg px-4 py-3 border border-brand-border">
                        {emailDraft.subject}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-brand-textMuted">Body:</p>
                        <button
                          onClick={() => handleCopy(emailDraft.body, 'body')}
                          className="text-brand-textMuted hover:text-brand-gold transition-colors"
                        >
                          {copied === 'body' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="text-sm text-brand-textMuted bg-brand-dark rounded-lg px-4 py-3 border border-brand-border whitespace-pre-wrap leading-relaxed">
                        {emailDraft.body}
                      </div>
                    </>
                  )}
                  {activeEmailTab === 'followup1' && (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-brand-textMuted flex items-center gap-1.5">
                          <Clock className="w-3 h-3" /> Send 3 days after initial email
                        </p>
                        <button
                          onClick={() => handleCopy(emailDraft.followUp1, 'fu1')}
                          className="text-brand-textMuted hover:text-brand-gold transition-colors"
                        >
                          {copied === 'fu1' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="text-sm text-brand-textMuted bg-brand-dark rounded-lg px-4 py-3 border border-brand-border whitespace-pre-wrap leading-relaxed">
                        {emailDraft.followUp1}
                      </div>
                    </>
                  )}
                  {activeEmailTab === 'followup2' && (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-brand-textMuted flex items-center gap-1.5">
                          <Clock className="w-3 h-3" /> Send 7 days after initial email
                        </p>
                        <button
                          onClick={() => handleCopy(emailDraft.followUp2, 'fu2')}
                          className="text-brand-textMuted hover:text-brand-gold transition-colors"
                        >
                          {copied === 'fu2' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="text-sm text-brand-textMuted bg-brand-dark rounded-lg px-4 py-3 border border-brand-border whitespace-pre-wrap leading-relaxed">
                        {emailDraft.followUp2}
                      </div>
                    </>
                  )}
                </div>

                {/* Send + Regenerate buttons */}
                <div className="flex gap-2">
                  {onSendEmail && lead.email && lead.email !== 'N/A' && (
                    <button
                      onClick={async () => {
                        setSendingEmail(true);
                        setSendSuccess(null);
                        try {
                          const seq = activeEmailTab === 'followup1' ? 'followUp1' : activeEmailTab === 'followup2' ? 'followUp2' : 'initial';
                          await onSendEmail(lead.id, seq);
                          setSendSuccess(seq);
                          setTimeout(() => setSendSuccess(null), 3000);
                        } catch { /* parent handles error */ }
                        finally { setSendingEmail(false); }
                      }}
                      disabled={sendingEmail}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-brand-gold to-brand-goldBright text-black font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {sendingEmail ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                      ) : sendSuccess ? (
                        <><Check className="w-3.5 h-3.5" /> Sent!</>
                      ) : (
                        <><Send className="w-3.5 h-3.5" /> Send Email</>
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleGenerateEmail}
                    disabled={generatingEmail}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-brand-border text-brand-textMuted text-sm hover:text-white hover:border-brand-gold/40 transition-all disabled:opacity-50"
                  >
                    {generatingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Regenerate
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-brand-textMuted text-sm">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Generate a personalized email draft using AI</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-xl bg-brand-card border border-brand-border p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-brand-textMuted" />
              Notes
            </h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes about this lead..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-brand-dark border border-brand-border text-white placeholder:text-brand-textMuted text-sm resize-none focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/30 transition-all"
            />
            <button
              onClick={handleSaveNotes}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-sm font-medium hover:bg-brand-gold/20 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              Save Notes
            </button>
          </div>

          {/* Lead score + meta */}
          {(lead as Lead & { score?: number; scoreTier?: string }).score != null && (
            <div className="rounded-xl bg-brand-card border border-brand-border p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-gold" />
                Lead Score
              </h3>
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-bold ${
                  (lead as Lead & { scoreTier?: string }).scoreTier === 'hot' ? 'text-emerald-400'
                  : (lead as Lead & { scoreTier?: string }).scoreTier === 'warm' ? 'text-amber-400'
                  : 'text-brand-textMuted'
                }`}>
                  {(lead as Lead & { score?: number }).score}/100
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                  (lead as Lead & { scoreTier?: string }).scoreTier === 'hot' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : (lead as Lead & { scoreTier?: string }).scoreTier === 'warm' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-brand-border text-brand-textMuted border border-brand-border'
                }`}>
                  {(lead as Lead & { scoreTier?: string }).scoreTier || 'cold'}
                </span>
              </div>
            </div>
          )}

          {/* Delete lead */}
          {onDelete && (
            <button
              onClick={() => { if (window.confirm('Delete this lead? This cannot be undone.')) onDelete(lead.id); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Lead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, href, external, copyable }: {
  icon: React.ElementType;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  if (!value || value === 'N/A') return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 group">
      <Icon className="w-4 h-4 text-brand-textMuted shrink-0" />
      <span className="text-xs text-brand-textMuted w-16 shrink-0">{label}</span>
      {href ? (
        <a
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="text-sm text-brand-gold hover:text-brand-goldBright transition-colors truncate flex items-center gap-1"
        >
          {value}
          {external && <ExternalLink className="w-3 h-3 shrink-0" />}
        </a>
      ) : (
        <span className="text-sm text-white truncate">{value}</span>
      )}
      {copyable && (
        <button
          onClick={handleCopy}
          className="ml-auto opacity-0 group-hover:opacity-100 text-brand-textMuted hover:text-brand-gold transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────

function exportToCSV(leads: Lead[]) {
  const headers = ['Business Name', 'Contact Name', 'Title', 'Email', 'Phone', 'Website', 'Address', 'Industry', 'Rating', 'Status'];
  const rows = leads.map(l => [
    l.businessName, l.contactName, l.contactTitle, l.email, l.phone,
    l.website, l.address, l.industry, l.googleRating.toString(), l.status,
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Autopilot Toggle ────────────────────────────────────────────────

const AUTOPILOT_LOCATIONS = [
  'UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Egypt', 'Jordan', 'Lebanon',
];

const LEADS_PER_DAY_OPTIONS = [5, 10, 25, 50];

function AutopilotSection() {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem('mubyn-leads-autopilot') === 'true'; } catch { return false; }
  });
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [location, setLocation] = useState('UAE');
  const [leadsPerDay, setLeadsPerDay] = useState(10);
  const [autoOutreach, setAutoOutreach] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(0);

  // Measure the config panel's scroll height for smooth animation
  useEffect(() => {
    if (panelRef.current) {
      setPanelHeight(panelRef.current.scrollHeight);
    }
  }, [enabled, industry, location, leadsPerDay, autoOutreach]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    try { localStorage.setItem('mubyn-leads-autopilot', String(next)); } catch {}
  };

  return (
    <div className="rounded-xl bg-brand-card border border-brand-border overflow-hidden">
      {/* Toggle Row */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        onClick={toggle}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
            enabled
              ? 'bg-brand-gold/15 border border-brand-gold/30'
              : 'bg-white/5 border border-brand-border'
          }`}>
            <Bot className={`w-5 h-5 transition-colors duration-300 ${enabled ? 'text-brand-gold' : 'text-brand-textMuted'}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Lead Autopilot
              {enabled && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              )}
            </h3>
            <p className="text-xs text-brand-textMuted mt-0.5">
              {enabled ? (
                <span className="flex items-center gap-1.5">
                  Caesar is finding leads 24/7
                </span>
              ) : (
                'Generate leads manually'
              )}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 transition-colors duration-300 focus:outline-none ${
            enabled
              ? 'bg-brand-gold border-brand-gold'
              : 'bg-brand-border border-brand-border'
          }`}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={`pointer-events-none inline-block h-5.5 w-5.5 rounded-full bg-white shadow-lg transform transition-transform duration-300 mt-[1px] ${
              enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
            }`}
            style={{ width: 20, height: 20 }}
          />
        </button>
      </div>

      {/* Config Panel — animated slide */}
      <div
        style={{
          maxHeight: enabled ? panelHeight + 40 : 0,
          opacity: enabled ? 1 : 0,
          transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
        }}
        className="overflow-hidden"
      >
        <div ref={panelRef} className="px-5 pb-5 pt-1 border-t border-brand-border space-y-4">
          {/* Row 1: Industry + Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-xs font-medium text-brand-textMuted mb-1.5">
                <Briefcase className="w-3 h-3 inline mr-1" />
                Industry
              </label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-white text-sm focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/30 transition-all"
              >
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-textMuted mb-1.5">
                <MapPin className="w-3 h-3 inline mr-1" />
                Target Location
              </label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-white text-sm focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/30 transition-all"
              >
                {AUTOPILOT_LOCATIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Leads per day */}
          <div>
            <label className="block text-xs font-medium text-brand-textMuted mb-1.5">
              <Users className="w-3 h-3 inline mr-1" />
              Leads per day
            </label>
            <div className="flex gap-2">
              {LEADS_PER_DAY_OPTIONS.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLeadsPerDay(n)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    leadsPerDay === n
                      ? 'bg-brand-gold/10 border-brand-gold text-brand-gold'
                      : 'bg-brand-dark border-brand-border text-brand-textMuted hover:border-brand-gold/40 hover:text-white'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Auto-send outreach toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-white font-medium flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-brand-textMuted" />
                Auto-send outreach
              </p>
              <p className="text-xs text-brand-textMuted mt-0.5 ml-5.5">
                Caesar drafts and sends personalized emails automatically
              </p>
            </div>
            <button
              onClick={() => setAutoOutreach(!autoOutreach)}
              className={`relative inline-flex h-6 w-10 shrink-0 rounded-full border-2 transition-colors duration-300 focus:outline-none ${
                autoOutreach
                  ? 'bg-brand-gold border-brand-gold'
                  : 'bg-brand-border border-brand-border'
              }`}
              role="switch"
              aria-checked={autoOutreach}
            >
              <span
                className="pointer-events-none inline-block rounded-full bg-white shadow-lg transform transition-transform duration-300"
                style={{
                  width: 16,
                  height: 16,
                  marginTop: 1,
                  transform: autoOutreach ? 'translateX(17px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>

          {/* Status Line */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-emerald-400 font-medium">
              Active — 15 leads generated this week, 8 emails sent
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function LeadsView() {
  const { t } = useLang();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load existing leads on mount
  useEffect(() => {
    document.title = PAGE_TITLE;
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const data = await getLeads();
      const loadedLeads: Lead[] = (data.leads || []).map((l: Record<string, unknown>) => ({
        id: l.id || crypto.randomUUID(),
        businessName: l.businessName || (l as Record<string, unknown>).business_name || (l as Record<string, unknown>).name || 'Unknown',
        contactName: l.contactName || (l as Record<string, unknown>).contact_name || 'N/A',
        contactTitle: l.contactTitle || (l as Record<string, unknown>).contact_title || (l as Record<string, unknown>).title || '',
        email: l.email || 'N/A',
        phone: l.phone || 'N/A',
        website: l.website || (l as Record<string, unknown>).website_url || 'N/A',
        address: l.address || (l as Record<string, unknown>).location || '',
        googleRating: parseFloat(String(l.googleRating || (l as Record<string, unknown>).google_rating || 0)),
        industry: l.industry || '',
        description: l.description || '',
        location: l.location || '',
        country: l.country || '',
        city: l.city || '',
        status: (l.status as LeadStatus) || 'new',
        source: l.source || 'unknown',
        notes: l.notes || '',
        emailDraft: l.emailDraft || '',
        createdAt: l.createdAt || (l as Record<string, unknown>).created_at || new Date().toISOString(),
        updatedAt: l.updatedAt || (l as Record<string, unknown>).updated_at || new Date().toISOString(),
      } as Lead));
      setLeads(loadedLeads);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleGenerate = async (data: { industry: string; country: string; city: string; count: number }) => {
    setLoading(true);
    setError('');
    try {
      const result = await generateLeads(data.industry, data.country, data.city, data.count);
      if (result.leads) {
        setLeads(prev => [...result.leads, ...prev]);
        setDialogOpen(false);
      } else {
        setError('No leads returned. Try a different search.');
      }
    } catch (err) {
      console.error('Lead generation failed:', err);
      setError(err instanceof Error ? err.message : 'Lead generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = useCallback(async (leadId: string, newStatus: LeadStatus) => {
    try {
      await updateLead(leadId, { status: newStatus });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      if (selectedLead?.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  }, [selectedLead]);

  const handleNotesChange = useCallback(async (leadId: string, notes: string) => {
    try {
      await updateLead(leadId, { notes });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes } : l));
    } catch (err) {
      console.error('Notes update failed:', err);
    }
  }, []);

  // Computed stats
  const stats = useMemo(() => {
    const total = leads.length;
    const withEmail = leads.filter(l => l.email && l.email !== 'N/A').length;
    const withPhone = leads.filter(l => l.phone && l.phone !== 'N/A').length;
    const contacted = leads.filter(l => l.status !== 'new').length;
    const replied = leads.filter(l => l.status === 'replied' || l.status === 'meeting_booked').length;
    const replyRate = contacted > 0 ? Math.round((replied / contacted) * 100) : 0;
    return { total, withEmail, withPhone, replyRate };
  }, [leads]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    let result = leads;
    if (statusFilter !== 'all') {
      result = result.filter(l => l.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.businessName.toLowerCase().includes(q) ||
        l.contactName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.industry.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q)
      );
    }
    return result;
  }, [leads, statusFilter, searchQuery]);

  // Loading state — skeleton instead of spinner
  if (initialLoading) {
    return (
      <div className="p-6 space-y-8 max-w-[1400px] mx-auto animate-fadeIn">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 rounded bg-brand-border/40 animate-pulse" />
            <div className="h-4 w-72 rounded bg-brand-border/40 animate-pulse" />
          </div>
          <div className="h-10 w-36 rounded-xl bg-brand-border/40 animate-pulse" />
        </div>
        <SkeletonStatsCards />
        <div className="rounded-xl bg-brand-card border border-brand-border overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-border">
            <div className="h-9 w-64 rounded-lg bg-brand-border/40 animate-pulse" />
          </div>
          <SkeletonTableRows rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-brand-gold" />
            </div>
            {t('leads.title')}
          </h1>
          <p className="text-brand-textMuted mt-1">{t('leads.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border text-brand-textMuted hover:text-white hover:border-brand-gold/40 transition-all text-sm cursor-pointer">
            <Upload className="w-4 h-4" />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return;
              const text = await file.text();
              const lines = text.split('\n').filter(l => l.trim());
              if (lines.length < 2) return;
              const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
              const imported: Lead[] = lines.slice(1).map(line => {
                const vals = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
                const row: Record<string, string> = {};
                headers.forEach((h, i) => { row[h] = vals[i] || ''; });
                return {
                  id: crypto.randomUUID(), businessName: row['business'] || row['company'] || row['businessname'] || row['name'] || '',
                  contactName: row['contact'] || row['contactname'] || row['person'] || '', contactTitle: row['title'] || row['position'] || row['role'] || '',
                  email: row['email'] || '', phone: row['phone'] || row['tel'] || '', website: row['website'] || row['url'] || row['domain'] || '',
                  address: row['address'] || row['location'] || '', googleRating: parseFloat(row['rating'] || '0') || 0,
                  industry: row['industry'] || row['sector'] || '', description: row['description'] || row['notes'] || '',
                  location: row['city'] || row['location'] || '', country: row['country'] || '', city: row['city'] || '',
                  status: 'new' as LeadStatus, source: 'csv-import', notes: '', emailDraft: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                };
              }).filter(l => l.businessName || l.email);
              if (imported.length > 0) {
                setLeads(prev => [...imported, ...prev]);
                // TODO: persist via API
              }
              e.target.value = '';
            }} />
          </label>
          {leads.length > 0 && (
            <button
              onClick={() => exportToCSV(leads)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border text-brand-textMuted hover:text-white hover:border-brand-gold/40 transition-all text-sm"
            >
              <FileDown className="w-4 h-4" />
              {t('leads.exportCsv')}
            </button>
          )}
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-brand-goldBright text-black font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-brand-gold/20"
          >
            <Plus className="w-4 h-4" />
            {t('leads.generate')}
          </button>
        </div>
      </div>

      {/* Autopilot Section */}
      <AutopilotSection />

      {/* Stats Bar */}
      {leads.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Target} label={t('leads.totalLeads')} value={stats.total} accent />
          <StatCard icon={Mail} label={t('leads.withEmail')} value={stats.withEmail} sub={`${stats.total > 0 ? Math.round((stats.withEmail / stats.total) * 100) : 0}% ${t('leads.coverage')}`} />
          <StatCard icon={Phone} label={t('leads.withPhone')} value={stats.withPhone} sub={`${stats.total > 0 ? Math.round((stats.withPhone / stats.total) * 100) : 0}% ${t('leads.coverage')}`} />
          <StatCard icon={TrendingUp} label={t('leads.replyRate')} value={`${stats.replyRate}%`} sub={`${leads.filter(l => l.status === 'replied' || l.status === 'meeting_booked').length} ${t('leads.replies')}`} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Generating overlay */}
      {loading && !dialogOpen && (
        <div className="p-12 rounded-xl bg-brand-card border border-brand-border text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{t('leads.finding')}</h3>
          <p className="text-brand-textMuted max-w-md mx-auto">
            {t('leads.findingDesc')}
          </p>
        </div>
      )}

      {/* Empty State */}
      {leads.length === 0 && !loading && (
        <div className="py-20 rounded-2xl bg-brand-card border border-brand-border text-center">
          <div className="w-20 h-20 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-brand-gold/60" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">{t('leads.noLeads')}</h3>
          <p className="text-brand-textMuted max-w-md mx-auto mb-8">
            {t('leads.noLeadsDesc')}
          </p>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-gold to-brand-goldBright text-black font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-brand-gold/20"
          >
            <Sparkles className="w-5 h-5" />
            {t('leads.generateFirst')}
          </button>
        </div>
      )}

      {/* Lead Table */}
      {leads.length > 0 && !loading && (
        <div className="rounded-xl bg-brand-card border border-brand-border overflow-hidden">
          {/* Table Header */}
          <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-textMuted" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('leads.searchLeads')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-brand-dark border border-brand-border text-white text-sm placeholder:text-brand-textMuted focus:border-brand-gold focus:outline-none transition-all"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 p-1 bg-brand-dark rounded-lg border border-brand-border">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    statusFilter === 'all'
                      ? 'bg-brand-card text-white shadow-sm'
                      : 'text-brand-textMuted hover:text-white'
                  }`}
                >
                  All ({leads.length})
                </button>
                {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map(s => {
                  const count = leads.filter(l => l.status === s).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        statusFilter === s
                          ? 'bg-brand-card text-white shadow-sm'
                          : 'text-brand-textMuted hover:text-white'
                      }`}
                    >
                      {STATUS_CONFIG[s].label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <span className="text-xs text-brand-textMuted">
              {filteredLeads.length} of {leads.length} leads
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-brand-textMuted uppercase tracking-wider">Business</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-brand-textMuted uppercase tracking-wider">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-brand-textMuted uppercase tracking-wider hidden lg:table-cell">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-brand-textMuted uppercase tracking-wider hidden md:table-cell">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-brand-textMuted uppercase tracking-wider hidden xl:table-cell">Location</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-brand-textMuted uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-brand-textMuted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredLeads.map(lead => (
                  <tr
                    key={lead.id}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {/* Company logo from Google Favicon API */}
                        <div className="w-9 h-9 rounded-lg bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center shrink-0 overflow-hidden">
                          {lead.website && lead.website !== 'N/A' ? (
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${lead.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}&sz=64`}
                              alt=""
                              className="w-6 h-6 object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <Building2 className="w-4 h-4 text-brand-gold" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate max-w-[200px]">{lead.businessName}</p>
                          <p className="text-xs text-brand-textMuted">{lead.industry}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-white truncate max-w-[160px]">{lead.contactName}</p>
                      <p className="text-xs text-brand-textMuted">{lead.contactTitle}</p>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      {lead.email && lead.email !== 'N/A' ? (
                        <a
                          href={`mailto:${lead.email}`}
                          onClick={e => e.stopPropagation()}
                          className="text-sm text-brand-gold hover:text-brand-goldBright transition-colors truncate block max-w-[200px]"
                        >
                          {lead.email}
                        </a>
                      ) : (
                        <span className="text-sm text-brand-textMuted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {lead.phone && lead.phone !== 'N/A' ? (
                        <span className="text-sm text-brand-textMuted">{lead.phone}</span>
                      ) : (
                        <span className="text-sm text-brand-textMuted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden xl:table-cell">
                      <span className="text-sm text-brand-textMuted truncate block max-w-[180px]">{lead.address || lead.location}</span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {lead.email && lead.email !== 'N/A' && (
                          <a
                            href={`mailto:${lead.email}`}
                            onClick={e => e.stopPropagation()}
                            className="p-2 rounded-lg hover:bg-brand-gold/10 text-brand-textMuted hover:text-brand-gold transition-all"
                            title="Send email"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                        {lead.phone && lead.phone !== 'N/A' && (
                          <a
                            href={`tel:${lead.phone}`}
                            onClick={e => e.stopPropagation()}
                            className="p-2 rounded-lg hover:bg-brand-gold/10 text-brand-textMuted hover:text-brand-gold transition-all"
                            title="Call"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                        {lead.website && lead.website !== 'N/A' && (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="p-2 rounded-lg hover:bg-brand-gold/10 text-brand-textMuted hover:text-brand-gold transition-all"
                            title="Visit website"
                          >
                            <Globe className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedLead(lead); }}
                          className="p-2 rounded-lg hover:bg-brand-gold/10 text-brand-textMuted hover:text-brand-gold transition-all"
                          title="View details"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* No results for filter */}
          {filteredLeads.length === 0 && (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-brand-textMuted/40 mx-auto mb-3" />
              <p className="text-brand-textMuted">No leads match your filter</p>
            </div>
          )}
        </div>
      )}

      {/* Campaign Dialog */}
      <CampaignDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleGenerate}
        loading={loading}
      />

      {/* Lead Detail Panel */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={(status) => handleStatusChange(selectedLead.id, status)}
          onNotesChange={(notes) => handleNotesChange(selectedLead.id, notes)}
          onSendEmail={async (leadId, sequence) => {
            await sendLeadEmail(leadId, undefined, undefined, sequence);
            // Update lead status to contacted
            handleStatusChange(leadId, 'contacted');
          }}
          onDelete={(leadId) => {
            deleteLead(leadId).then(() => {
              setLeads(prev => prev.filter(l => l.id !== leadId));
              setSelectedLead(null);
            }).catch((e: unknown) => console.error('Delete failed:', e));
          }}
        />
      )}
    </div>
  );
}
