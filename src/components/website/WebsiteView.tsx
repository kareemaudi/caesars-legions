import {
  Globe, Sparkles, Rocket, Loader2, ExternalLink, Pencil,
  Check, Copy, RefreshCw, Building2, Palette,
  Phone, Mail, MapPin, MessageCircle, Link2, Crown, Wand2,
  Code2, Settings2, ShoppingBag, Zap, ArrowRight
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import {
  generateWebsite, getWebsiteMeta, publishWebsite, editWebsite,
  getWebsitePreviewUrl, getStoredUser, API_BASE, saveWidgetConfig
} from '@/lib/api';

const INDUSTRIES = [
  'Restaurant / Café', 'E-commerce / Retail', 'Professional Services',
  'Salon / Spa / Beauty', 'Real Estate', 'Medical / Clinic',
  'Gym / Fitness', 'Education / Tutoring', 'Portfolio / Freelance',
  'Technology / SaaS', 'Construction', 'Legal / Law Firm',
  'Marketing Agency', 'Consulting', 'Other',
];

const STYLES = [
  { value: 'modern-dark', label: '🌙 Modern Dark', desc: 'Dark theme, sleek and premium' },
  { value: 'modern-light', label: '☀️ Modern Light', desc: 'Clean white, airy and fresh' },
  { value: 'bold-gradient', label: '🎨 Bold Gradient', desc: 'Vibrant gradients, energetic' },
  { value: 'minimal', label: '⬜ Minimal', desc: 'Whitespace-focused, elegant' },
  { value: 'luxury', label: '👑 Luxury', desc: 'Gold accents, premium feel' },
  { value: 'corporate', label: '🏢 Corporate', desc: 'Professional, trustworthy blue tones' },
];

const MENA_COUNTRIES = [
  'Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Bahrain', 'Oman',
  'Egypt', 'Jordan', 'Lebanon', 'Iraq', 'Syria', 'Palestine',
  'Libya', 'Tunisia', 'Algeria', 'Morocco', 'Sudan', 'Yemen',
];

type Step = 'form' | 'generating' | 'preview' | 'published';
type PageMode = 'build' | 'connect';

interface WebsiteMeta {
  businessName: string;
  subdomain: string;
  industry: string;
  description: string;
  status: string;
  publishedAt: string | null;
  generatedAt: string;
  language: string;
  phone?: string;
  email?: string;
  address?: string;
  whatsapp?: string;
  style?: string;
}

function getUserId(): string {
  const user = getStoredUser();
  return user?.id || user?.email || 'anonymous';
}

export function WebsiteView() {
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [urlCopied, setUrlCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [meta, setMeta] = useState<WebsiteMeta | null>(null);
  const [siteUrl, setSiteUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [iframeKey, setIframeKey] = useState(0);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Smart page mode: 'connect' (has website) vs 'build' (no website)
  const [pageMode, setPageMode] = useState<PageMode>('build');
  const [userHasWebsite, setUserHasWebsite] = useState(false);
  const [userWebsiteUrl, setUserWebsiteUrl] = useState('');
  const [showBuilderFromConnect, setShowBuilderFromConnect] = useState(false);

  // Widget config
  const [widgetColor, setWidgetColor] = useState('#D4A843');
  const [widgetPosition, setWidgetPosition] = useState('bottom-right');
  const [widgetWelcome, setWidgetWelcome] = useState('Hi! How can I help you today?');
  const [widgetSaving, setWidgetSaving] = useState(false);
  const [widgetSaved, setWidgetSaved] = useState(false);

  // Form fields
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [style, setStyle] = useState('modern-dark');
  const [language, setLanguage] = useState('en');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Generating animation phases
  const [genPhase, setGenPhase] = useState(0);
  const genPhases = [
    { icon: '🎨', text: 'Choosing color palette & design...' },
    { icon: '✍️', text: 'Writing compelling copy...' },
    { icon: '📐', text: 'Structuring sections & layout...' },
    { icon: '🖼️', text: 'Selecting images...' },
    { icon: '📱', text: 'Optimizing for mobile...' },
    { icon: '✨', text: 'Adding finishing touches...' },
  ];

  useEffect(() => {
    document.title = 'Website — Mubyn';
    loadExisting();
  }, []);

  // Animate generation phases
  useEffect(() => {
    if (step !== 'generating') return;
    const interval = setInterval(() => {
      setGenPhase(prev => (prev + 1) % genPhases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [step]);

  const loadExisting = async () => {
    try {
      const user = getStoredUser();
      
      // Pre-fill form from user signup data
      if (user) {
        if (user.business_name) setBusinessName(user.business_name);
        if (user.email) setEmail(user.email);
        if (user.industry) setIndustry(user.industry);
        // Smart language: MENA countries default to Arabic
        if (user.country && MENA_COUNTRIES.some(c => 
          c.toLowerCase() === (user.country || '').toLowerCase()
        )) {
          setLanguage('ar');
        }
        // Check if user has an existing website URL in their profile
        if (user.website && user.website.trim()) {
          setUserHasWebsite(true);
          setUserWebsiteUrl(user.website.trim());
          // pageMode('connect') disabled — widget setup moved to CS Agent settings
        }
      }

      // Also check settings API for extra data (website URL etc.)
      try {
        const settingsRes = await fetch(`${API_BASE}/api/settings/${user?.id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('mubyn-token')}` } });
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings.business?.website && !userHasWebsite) {
            setUserHasWebsite(true);
            setUserWebsiteUrl(settings.business.website);
            // pageMode('connect') disabled — widget setup moved to CS Agent settings
          }
          if (settings.business?.industry && !industry) setIndustry(settings.business.industry);
          if (settings.business?.country && !address) setAddress(settings.business.country);
        }
      } catch { /* ignore settings load failure */ }

      // Check if user already generated a website through Mubyn
      const result = await getWebsiteMeta();
      if (result.exists && result.meta) {
        setMeta(result.meta);
        setPreviewUrl(getWebsitePreviewUrl());
        // Pre-fill form from existing meta
        setBusinessName(result.meta.businessName || businessName);
        setDescription(result.meta.description || '');
        setIndustry(result.meta.industry || '');
        setStyle(result.meta.style || 'modern-dark');
        setLanguage(result.meta.language || 'en');
        setPhone(result.meta.phone || '');
        setEmail(result.meta.email || email);
        setAddress(result.meta.address || '');
        setWhatsapp(result.meta.whatsapp || '');

        if (result.meta.status === 'published') {
          const baseUrl = API_BASE;
          setSiteUrl(`${baseUrl}/site/${result.meta.subdomain}`);
          setStep('published');
        } else {
          setStep('preview');
        }
      }
    } catch {
      // No existing website — show form or connect view
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!businessName.trim()) {
      setError('Business name is required');
      return;
    }
    setError('');
    setStep('generating');
    setGenerating(true);
    setGenPhase(0);

    try {
      const result = await generateWebsite({
        businessName: businessName.trim(),
        description: description.trim(),
        industry,
        style,
        language,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        whatsapp: whatsapp.trim(),
      });

      setMeta(result.meta);
      setPreviewUrl(getWebsitePreviewUrl());
      setSiteUrl(result.siteUrl || '');
      setIframeKey(prev => prev + 1);
      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Generation failed. Please try again.');
      setStep('form');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const result = await publishWebsite();
      setSiteUrl(result.siteUrl);
      setMeta(prev => prev ? { ...prev, status: 'published', publishedAt: result.publishedAt, subdomain: result.subdomain } : prev);
      setStep('published');
    } catch (err: any) {
      setError(err.message || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const handleEdit = async () => {
    if (!editInstruction.trim()) return;
    setEditing(true);
    setError('');
    try {
      await editWebsite(editInstruction.trim());
      setIframeKey(prev => prev + 1);
      setEditInstruction('');
    } catch (err: any) {
      setError(err.message || 'Edit failed');
    } finally {
      setEditing(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(siteUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const handleCopyEmbed = () => {
    const code = `<script src="${API_BASE}/api/widget.js?id=${getUserId()}" async></script>`;
    navigator.clipboard.writeText(code);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const handleSaveWidget = async () => {
    setWidgetSaving(true);
    try {
      await saveWidgetConfig({
        primaryColor: widgetColor,
        position: widgetPosition,
        welcomeMessage: widgetWelcome,
      });
      setWidgetSaved(true);
      setTimeout(() => setWidgetSaved(false), 2000);
    } catch {
      // silently fail
    } finally {
      setWidgetSaving(false);
    }
  };

  const embedCode = `<script src="${API_BASE}/api/widget.js?id=${getUserId()}" async></script>`;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-brand-gold animate-spin mx-auto" />
          <p className="text-brand-textMuted text-sm">Loading Website...</p>
        </div>
      </div>
    );
  }

  // ─── GENERATING STATE ──────────────────────────────────────
  if (step === 'generating') {
    return (
      <div className="p-6 flex items-center justify-center h-[70vh]">
        <div className="text-center space-y-6 max-w-md">
          {/* Animated orb */}
          <div className="relative mx-auto w-28 h-28">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-gold/30 to-amber-400/30 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-brand-gold/20 to-amber-400/20 animate-pulse" />
            <div className="absolute inset-4 rounded-full bg-gradient-to-r from-brand-gold to-amber-400 flex items-center justify-center shadow-lg shadow-brand-gold/30">
              <span className="text-3xl">{genPhases[genPhase].icon}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Building Your Website</h2>
            <p className="text-brand-gold font-medium transition-all duration-500">{genPhases[genPhase].text}</p>
            <p className="text-brand-textMuted text-sm">This usually takes 30-60 seconds</p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-gold to-amber-400 rounded-full transition-all duration-[4000ms] ease-linear"
              style={{ width: `${((genPhase + 1) / genPhases.length) * 100}%` }}
            />
          </div>

          <p className="text-xs text-brand-textMuted">✨ AI is crafting a world-class website for <span className="text-white font-medium">{businessName}</span></p>
        </div>
      </div>
    );
  }

  // ─── PREVIEW / PUBLISHED STATE ──────────────────────────────
  if (step === 'preview' || step === 'published') {
    return (
      <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Globe className="w-7 h-7 text-brand-gold" />
              {meta?.businessName || 'Your Website'}
            </h1>
            <p className="text-brand-textMuted text-sm mt-1">
              {step === 'published' ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Live at <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">{siteUrl.replace('https://', '')}</a>
                </span>
              ) : 'Preview your generated website. Publish when ready.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {step === 'published' && (
              <>
                <button
                  onClick={handleCopyUrl}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border text-brand-textMuted hover:text-white hover:border-white/20 text-sm transition-all"
                >
                  {urlCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {urlCopied ? 'Copied!' : 'Copy URL'}
                </button>
                <a
                  href={siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-gold/30 text-brand-gold text-sm font-medium hover:bg-brand-gold/10 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit Site
                </a>
              </>
            )}
            {step === 'preview' && (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                {publishing ? 'Publishing...' : 'Publish Website'}
              </button>
            )}
            <button
              onClick={() => { setStep('form'); setPageMode('build'); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border text-brand-textMuted hover:text-white hover:border-white/20 text-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Desktop / Mobile toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMobilePreview(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!showMobilePreview ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/30' : 'text-brand-textMuted hover:text-white'}`}
          >
            🖥️ Desktop
          </button>
          <button
            onClick={() => setShowMobilePreview(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showMobilePreview ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/30' : 'text-brand-textMuted hover:text-white'}`}
          >
            📱 Mobile
          </button>
        </div>

        {/* Preview iframe */}
        <div className="flex justify-center">
          <div
            className={`rounded-2xl overflow-hidden border border-brand-border bg-white transition-all duration-300 ${
              showMobilePreview ? 'w-[375px]' : 'w-full'
            }`}
            style={{ height: '70vh' }}
          >
            {/* Browser chrome */}
            <div className="bg-brand-darker px-4 py-2.5 flex items-center gap-3 border-b border-brand-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-3">
                <div className="bg-brand-dark rounded-lg px-3 py-1.5 text-xs text-brand-textMuted font-mono text-center flex items-center justify-center gap-2">
                  <Link2 className="w-3 h-3" />
                  {step === 'published' ? siteUrl.replace('https://', '') : `${meta?.subdomain || 'preview'}.mubyn.com`}
                </div>
              </div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-textMuted hover:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <iframe
              key={iframeKey}
              src={previewUrl}
              className="w-full bg-white"
              style={{ height: 'calc(100% - 44px)' }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>

        {/* AI Edit panel */}
        <div className="rounded-2xl bg-brand-card border border-brand-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">AI Edit</h3>
              <p className="text-xs text-brand-textMuted">Describe changes and AI will modify your website</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              ref={editInputRef}
              type="text"
              value={editInstruction}
              onChange={e => setEditInstruction(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(); } }}
              placeholder='Try: "Make the hero section bigger" or "Change colors to blue" or "Add a pricing section"'
              className="flex-1 px-4 py-3 rounded-xl bg-brand-dark border border-brand-border text-white text-sm placeholder:text-white/20 focus:border-brand-gold focus:outline-none transition-colors"
              disabled={editing}
            />
            <button
              onClick={handleEdit}
              disabled={editing || !editInstruction.trim()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all shadow-lg shadow-violet-500/20"
            >
              {editing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
              {editing ? 'Editing...' : 'Apply'}
            </button>
          </div>
          {/* Quick edit suggestions */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              'Make the hero bigger',
              'Add more testimonials',
              'Change to blue theme',
              'Add a pricing section',
              'Make it more minimal',
              'Add Arabic text',
            ].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => { setEditInstruction(suggestion); editInputRef.current?.focus(); }}
                className="px-3 py-1 rounded-full text-xs text-brand-textMuted border border-brand-border hover:border-violet-500/30 hover:text-violet-400 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Published info + Widget embed */}
        {step === 'published' && (
          <>
            <div className="rounded-2xl bg-gradient-to-r from-emerald-500/5 to-brand-gold/5 border border-emerald-500/20 p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Check className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-white font-semibold">Your website is live! 🎉</h3>
                  <p className="text-sm text-brand-textMuted">
                    Anyone can visit your site at:
                  </p>
                  <div className="flex items-center gap-3">
                    <code className="px-4 py-2 rounded-lg bg-brand-dark text-brand-gold font-mono text-sm border border-brand-border">
                      {siteUrl}
                    </code>
                    <button onClick={handleCopyUrl} className="text-brand-textMuted hover:text-white transition-colors">
                      {urlCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              {/* Custom domain coming soon */}
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                <Crown className="w-4 h-4 text-brand-gold" />
                <span className="text-xs text-brand-textMuted">
                  Custom domain support (yourbusiness.com) — <span className="text-brand-gold">Coming Soon</span>
                </span>
              </div>
            </div>

            {/* Widget Embed Code */}
            {renderWidgetSection()}
          </>
        )}
      </div>
    );
  }

  // ─── CONNECT VIEW (user has existing website) ────────────────
  function renderConnectView() {
    return (
      <div className="p-6 space-y-8 max-w-5xl mx-auto">
        {/* Header with tabs */}
        <div className="text-center space-y-4 py-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-xs font-medium">
            <Globe className="w-3.5 h-3.5" />
            Website & Widget
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Connect Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-amber-400">Website</span>
          </h1>
          <p className="text-brand-textMuted text-lg max-w-2xl mx-auto">
            Add Mubyn's AI-powered chat widget to your existing website. Just copy and paste one line of code.
          </p>
        </div>

        {/* Tab toggle - removed: widget setup moved to CS Agent settings */}
        {/* {renderTabs()} */}

        {/* Current website URL */}
        <div className="rounded-2xl bg-brand-card border border-brand-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">Your Website</h3>
              <p className="text-xs text-brand-textMuted">Connected website URL</p>
            </div>
            <a
              href={userWebsiteUrl.startsWith('http') ? userWebsiteUrl : `https://${userWebsiteUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-gold/30 text-brand-gold text-sm font-medium hover:bg-brand-gold/10 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Visit
            </a>
          </div>
          <div className="px-4 py-3 rounded-xl bg-brand-dark border border-brand-border flex items-center gap-3">
            <Link2 className="w-4 h-4 text-brand-gold shrink-0" />
            <span className="text-white font-mono text-sm">{userWebsiteUrl}</span>
          </div>
        </div>

        {/* Widget embed section */}
        {renderWidgetSection()}

        {/* Widget configuration */}
        {renderWidgetConfig()}

        {/* Platform guides */}
        {renderPlatformGuides()}

        {/* Build new website CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-brand-gold/5 to-amber-400/5 border border-brand-gold/15 p-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-xs font-medium">
            <Sparkles className="w-3 h-3" />
            AI Website Builder
          </div>
          <h3 className="text-white font-semibold text-lg">Want a brand new AI-generated website?</h3>
          <p className="text-brand-textMuted text-sm max-w-md mx-auto">
            Our AI can build you a complete, stunning website in 60 seconds. Free hosting included.
          </p>
          <button
            onClick={() => { setPageMode('build'); setShowBuilderFromConnect(true); }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-gold/20 to-amber-400/20 border border-brand-gold/30 text-brand-gold font-semibold text-sm hover:bg-brand-gold/30 transition-all"
          >
            <Wand2 className="w-4 h-4" />
            Build a Website with AI
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ─── WIDGET EMBED SECTION ──────────────────────────────────
  function renderWidgetSection() {
    return (
      <div className="rounded-2xl bg-brand-card border border-brand-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Embed Widget Code</h3>
            <p className="text-xs text-brand-textMuted">Add this script to your website to enable the AI chat widget</p>
          </div>
        </div>

        {/* Code block */}
        <div className="relative">
          <pre className="px-4 py-3 rounded-xl bg-brand-dark border border-brand-border text-sm font-mono text-emerald-400 overflow-x-auto">
            {embedCode}
          </pre>
          <button
            onClick={handleCopyEmbed}
            className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-card border border-brand-border text-brand-textMuted hover:text-white text-xs transition-all"
          >
            {embedCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {embedCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <p className="text-xs text-brand-textMuted">
          💡 Paste this code just before the <code className="text-brand-gold">&lt;/body&gt;</code> tag in your website's HTML.
        </p>
      </div>
    );
  }

  // ─── WIDGET CONFIG ─────────────────────────────────────────
  function renderWidgetConfig() {
    return (
      <div className="rounded-2xl bg-brand-card border border-brand-border p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Widget Settings</h3>
            <p className="text-xs text-brand-textMuted">Customize how the chat widget looks on your site</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-brand-textMuted mb-1.5">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={widgetColor}
                onChange={e => setWidgetColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-brand-border bg-transparent cursor-pointer"
              />
              <input
                value={widgetColor}
                onChange={e => setWidgetColor(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl bg-brand-dark border border-brand-border text-white text-sm font-mono focus:border-brand-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-medium text-brand-textMuted mb-1.5">Position</label>
            <select
              value={widgetPosition}
              onChange={e => setWidgetPosition(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-brand-dark border border-brand-border text-white text-sm focus:border-brand-gold focus:outline-none"
            >
              <option value="bottom-right">↘ Bottom Right</option>
              <option value="bottom-left">↙ Bottom Left</option>
            </select>
          </div>

          {/* Welcome message */}
          <div>
            <label className="block text-xs font-medium text-brand-textMuted mb-1.5">Welcome Message</label>
            <input
              value={widgetWelcome}
              onChange={e => setWidgetWelcome(e.target.value)}
              placeholder="Hi! How can I help?"
              className="w-full px-3 py-2.5 rounded-xl bg-brand-dark border border-brand-border text-white text-sm placeholder:text-white/20 focus:border-brand-gold focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleSaveWidget}
          disabled={widgetSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {widgetSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : widgetSaved ? <Check className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
          {widgetSaving ? 'Saving...' : widgetSaved ? 'Saved!' : 'Save Widget Settings'}
        </button>
      </div>
    );
  }

  // ─── PLATFORM GUIDES ──────────────────────────────────────
  function renderPlatformGuides() {
    const platforms = [
      {
        name: 'WordPress',
        icon: '🔵',
        steps: [
          'Go to Appearance → Theme Editor (or use a plugin like "Insert Headers and Footers")',
          'Paste the embed code before the </body> tag in footer.php',
          'Save changes — the widget appears immediately',
        ],
      },
      {
        name: 'Shopify',
        icon: '🟢',
        steps: [
          'Go to Online Store → Themes → Edit Code',
          'Open theme.liquid',
          'Paste the embed code just before </body>',
        ],
      },
      {
        name: 'Wix',
        icon: '🟣',
        steps: [
          'Go to Settings → Custom Code',
          'Click "+ Add Custom Code"',
          'Paste the embed code, set placement to "Body - end"',
        ],
      },
      {
        name: 'Squarespace',
        icon: '⚫',
        steps: [
          'Go to Settings → Advanced → Code Injection',
          'Paste the embed code in the "Footer" field',
          'Save — widget goes live instantly',
        ],
      },
    ];

    return (
      <div className="rounded-2xl bg-brand-card border border-brand-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Platform Guides</h3>
            <p className="text-xs text-brand-textMuted">How to add the widget to popular platforms</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map(p => (
            <div key={p.name} className="rounded-xl bg-brand-dark border border-brand-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{p.icon}</span>
                <h4 className="text-white font-medium text-sm">{p.name}</h4>
              </div>
              <ol className="space-y-1.5">
                {p.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-brand-textMuted">
                    <span className="text-brand-gold font-medium shrink-0">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── TAB TOGGLE ────────────────────────────────────────────
  function renderTabs() {
    return (
      <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-brand-card border border-brand-border max-w-md mx-auto">
        <button
          onClick={() => setPageMode('build')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            pageMode === 'build'
              ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/30'
              : 'text-brand-textMuted hover:text-white'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          Build Website
        </button>
        <button
          onClick={() => setPageMode('connect')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            pageMode === 'connect'
              ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/30'
              : 'text-brand-textMuted hover:text-white'
          }`}
        >
          <Link2 className="w-4 h-4" />
          Connect Existing
        </button>
      </div>
    );
  }

  // ─── SMART ROUTING: connect vs build ──────────────────────
  // Connect view disabled — widget setup moved to CS Agent settings
  // if (step === 'form' && pageMode === 'connect' && !showBuilderFromConnect) {
  //   return renderConnectView();
  // }

  // ─── FORM STATE (Build Website) ──────────────────────────────
  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="text-center space-y-4 py-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Website Builder
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Build Your Website in <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-amber-400">60 Seconds</span>
        </h1>
        <p className="text-brand-textMuted text-lg max-w-2xl mx-auto">
          {businessName
            ? <>Your info is already filled in. Just hit <span className="text-brand-gold font-medium">Generate</span> and watch the magic.</>
            : <>Describe your business and AI will generate a complete, stunning, mobile-responsive website.</>
          }
        </p>
      </div>

      {/* Tab toggle — removed: widget setup moved to CS Agent settings */}
      {/* {userHasWebsite && renderTabs()} */}

      {/* ★ ONE-CLICK GENERATE — prominent gold button at the top */}
      {businessName.trim() && (
        <div className="rounded-2xl bg-gradient-to-r from-brand-gold/10 to-amber-400/10 border border-brand-gold/20 p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-white font-semibold text-lg flex items-center gap-2 justify-center sm:justify-start">
              <Zap className="w-5 h-5 text-brand-gold" />
              Ready to go, {businessName}!
            </h3>
            <p className="text-brand-textMuted text-sm mt-1">
              We pre-filled everything from your profile. One click to generate.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-gold to-amber-400 text-black font-bold text-lg hover:opacity-90 disabled:opacity-40 transition-all shadow-xl shadow-brand-gold/25 relative overflow-hidden group shrink-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Sparkles className="w-6 h-6" />
            Generate Website Now
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — Business info */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-brand-card border border-brand-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Business Info</h3>
                <p className="text-xs text-brand-textMuted">
                  {businessName ? '✅ Pre-filled from your profile' : 'Tell us about your business'}
                </p>
              </div>
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-xs font-medium text-brand-textMuted mb-1.5">Business Name *</label>
              <input
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="e.g., Bob's Shawarma House"
                className="w-full px-4 py-3 rounded-xl bg-brand-dark border border-brand-border text-white text-sm placeholder:text-white/20 focus:border-brand-gold focus:outline-none transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-brand-textMuted mb-1.5">Business Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what your business does, your unique value, target audience..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-brand-dark border border-brand-border text-white text-sm placeholder:text-white/20 focus:border-brand-gold focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block text-xs font-medium text-brand-textMuted mb-1.5">Industry</label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-brand-dark border border-brand-border text-white text-sm focus:border-brand-gold focus:outline-none transition-colors"
              >
                <option value="">Select an industry</option>
                {INDUSTRIES.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-medium text-brand-textMuted mb-1.5">Language</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    language === 'en'
                      ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold'
                      : 'border-brand-border text-brand-textMuted hover:text-white'
                  }`}
                >
                  🇺🇸 English
                </button>
                <button
                  onClick={() => setLanguage('ar')}
                  className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    language === 'ar'
                      ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold'
                      : 'border-brand-border text-brand-textMuted hover:text-white'
                  }`}
                >
                  🇸🇦 العربية
                </button>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="rounded-2xl bg-brand-card border border-brand-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Contact Info <span className="text-brand-textMuted text-xs font-normal">(optional)</span></h3>
                <p className="text-xs text-brand-textMuted">Shown on your website</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-brand-textMuted mb-1.5">
                  <Phone className="w-3 h-3 inline mr-1" />Phone
                </label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+961 1 234 567"
                  className="w-full px-3 py-2.5 rounded-xl bg-brand-dark border border-brand-border text-white text-sm placeholder:text-white/20 focus:border-brand-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-textMuted mb-1.5">
                  <MessageCircle className="w-3 h-3 inline mr-1" />WhatsApp
                </label>
                <input
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="+961 71 234 567"
                  className="w-full px-3 py-2.5 rounded-xl bg-brand-dark border border-brand-border text-white text-sm placeholder:text-white/20 focus:border-brand-gold focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-textMuted mb-1.5">
                <Mail className="w-3 h-3 inline mr-1" />Email
              </label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="info@yourbusiness.com"
                className="w-full px-3 py-2.5 rounded-xl bg-brand-dark border border-brand-border text-white text-sm placeholder:text-white/20 focus:border-brand-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-textMuted mb-1.5">
                <MapPin className="w-3 h-3 inline mr-1" />Address
              </label>
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="123 Business St, City"
                className="w-full px-3 py-2.5 rounded-xl bg-brand-dark border border-brand-border text-white text-sm placeholder:text-white/20 focus:border-brand-gold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right column — Style + Generate */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-brand-card border border-brand-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Palette className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Design Style</h3>
                <p className="text-xs text-brand-textMuted">Choose a style — AI will adapt to your industry</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {STYLES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    style === s.value
                      ? 'bg-brand-gold/10 border-brand-gold/30'
                      : 'border-brand-border hover:border-white/20'
                  }`}
                >
                  <span className="text-lg">{s.label.split(' ')[0]}</span>
                  <p className={`text-sm font-medium mt-1 ${style === s.value ? 'text-brand-gold' : 'text-white'}`}>
                    {s.label.split(' ').slice(1).join(' ')}
                  </p>
                  <p className="text-xs text-brand-textMuted mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* What you'll get */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-gold/5 to-amber-400/5 border border-brand-gold/15 p-6 space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-gold" />
              What You'll Get
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '🎨', text: 'Custom design & colors' },
                { icon: '📱', text: 'Mobile responsive' },
                { icon: '✍️', text: 'Professional copy' },
                { icon: '🖼️', text: 'Relevant images' },
                { icon: '📊', text: 'SEO optimized' },
                { icon: '💬', text: 'WhatsApp CTA' },
                { icon: '⚡', text: 'Lightning fast' },
                { icon: '🌐', text: 'Free hosting' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs text-brand-textMuted">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !businessName.trim()}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-brand-gold to-amber-400 text-black font-bold text-lg hover:opacity-90 disabled:opacity-40 transition-all shadow-xl shadow-brand-gold/20 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            {generating ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
            {generating ? 'Generating...' : 'Generate My Website'}
          </button>
          <p className="text-center text-xs text-brand-textMuted">
            Takes ~30 seconds • Powered by GPT-4o • Free to generate
          </p>
        </div>
      </div>

      {/* Back to connect view if came from there */}
      {showBuilderFromConnect && userHasWebsite && (
        <div className="text-center">
          <button
            onClick={() => { setPageMode('connect'); setShowBuilderFromConnect(false); }}
            className="text-brand-textMuted hover:text-brand-gold text-sm transition-colors inline-flex items-center gap-2"
          >
            ← Back to Connect Website
          </button>
        </div>
      )}
    </div>
  );
}
