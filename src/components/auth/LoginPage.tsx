import { useState, type FormEvent, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, ArrowRight, ArrowLeft, Utensils, ShoppingCart, Home, Laptop, Heart, GraduationCap, Briefcase, HelpCircle, Users, TrendingUp, Headphones, MapPin, Check, Upload, Loader2 as Loader2Icon } from 'lucide-react';
import { login, signup, uploadLogo } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── i18n translations ─────────────────────────────────────────────────────
type Lang = 'en' | 'ar';

const t = {
  en: {
    tagline: 'Your AI Business Operating System',
    welcomeBack: 'Welcome back',
    email: 'Email',
    emailAddress: 'Email address',
    password: 'Password',
    passwordHint: 'Password (6+ characters)',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    newToMubyn: 'New to Mubyn?',
    createAccount: 'Create an account',
    alreadyHaveAccount: 'Already have an account?',
    signInLink: 'Sign in',
    invalidLogin: 'Invalid email or password',
    back: 'Back',
    continue: 'Continue',
    // Step 0 — Name
    letsGetStarted: "Let's get started",
    whatsYourName: "What's your name?",
    typeYourName: 'Type your name...',
    // Step 1 — Business Name
    niceToMeet: (n: string) => `Nice to meet you, ${n} 👋`,
    whatsYourBusiness: "What's your business called?",
    typeBusinessName: 'Type your business name...',
    // Step 2 — Logo (optional)
    addYourLogo: 'Add your logo',
    logoOptional: '(optional)',
    logoHint: "Drag & drop or click to upload. We'll use it across your website, emails, and widget.",
    logoSkip: 'Skip for now',
    logoUploading: 'Processing...',
    logoFormats: 'PNG, JPG, SVG, or WebP — max 2MB',
    // Step 3 — Industry
    greatName: (b: string) => `${b} — great name!`,
    whatIndustry: 'What industry are you in?',
    // Step 3 — Location
    location: 'Location',
    whereBased: "Where's your business based?",
    // Step 4 — Website
    almostThere: 'Almost there!',
    haveWebsite: 'Do you have a website?',
    websiteHint: "If not, we can help you build one.",
    websitePlaceholder: 'https://yourbusiness.com',
    noWebsite: "I don't have one yet",
    // Step 5 — Primary Need
    oneMoreThing: 'One more thing 🎯',
    whatNeedMost: 'What do you need most?',
    needHint: "We'll start with this and unlock everything else.",
    findCustomers: 'Find new customers',
    findCustomersDesc: 'AI-powered lead generation',
    createContent: 'Create content & marketing',
    createContentDesc: 'Full month content calendar',
    customerSupport: 'Customer support',
    customerSupportDesc: 'AI agent for your website',
    // Step 6 — Account
    lastStep: "Last step — let's secure your account 🔒",
    createYourAccount: 'Create your account',
    launchMubyn: 'Launch Mubyn →',
    settingUp: 'Setting up your workspace...',
    terms: 'By signing up you agree to our Terms & Privacy Policy',
    // Industries
    ind_restaurant: 'Restaurant & Food',
    ind_ecommerce: 'E-Commerce & Retail',
    ind_realestate: 'Real Estate',
    ind_tech: 'Technology & SaaS',
    ind_healthcare: 'Healthcare',
    ind_education: 'Education',
    ind_consulting: 'Consulting & Services',
    ind_other: 'Other',
    // Countries
    co_UAE: '🇦🇪 UAE',
    co_SaudiArabia: '🇸🇦 Saudi Arabia',
    co_Lebanon: '🇱🇧 Lebanon',
    co_Egypt: '🇪🇬 Egypt',
    co_Jordan: '🇯🇴 Jordan',
    co_Kuwait: '🇰🇼 Kuwait',
    co_Qatar: '🇶🇦 Qatar',
    co_Morocco: '🇲🇦 Morocco',
    co_Other: '🌍 Other',
    // Demo mode
    tryDemo: 'Try Demo',
    tryDemoHint: 'Explore with sample data',
    orText: 'or',
  },
  ar: {
    tagline: 'نظام تشغيل أعمالك بالذكاء الاصطناعي',
    welcomeBack: 'أهلاً من جديد',
    email: 'البريد الإلكتروني',
    emailAddress: 'بريدك الإلكتروني',
    password: 'كلمة المرور',
    passwordHint: 'كلمة مرور (٦ أحرف على الأقل)',
    signIn: 'تسجيل الدخول',
    signingIn: 'جاري الدخول...',
    newToMubyn: 'جديد على مبيّن؟',
    createAccount: 'أنشئ حساب',
    alreadyHaveAccount: 'عندك حساب؟',
    signInLink: 'سجّل دخول',
    invalidLogin: 'البريد أو كلمة المرور غلط',
    back: 'رجوع',
    continue: 'متابعة',
    // Step 0 — Name
    letsGetStarted: 'يلّا نبدأ',
    whatsYourName: 'شو اسمك؟',
    typeYourName: 'اكتب اسمك...',
    // Step 1 — Business Name
    niceToMeet: (n: string) => `أهلاً ${n} 👋`,
    whatsYourBusiness: 'شو اسم مشروعك؟',
    typeBusinessName: 'اكتب اسم مشروعك...',
    // Step 2 — Logo (optional)
    addYourLogo: 'أضف شعارك',
    logoOptional: '(اختياري)',
    logoHint: 'اسحب وأفلت أو اضغط للرفع. سنستخدمه في موقعك وإيميلاتك والويدجت.',
    logoSkip: 'تخطّي',
    logoUploading: 'جاري المعالجة...',
    logoFormats: 'PNG, JPG, SVG أو WebP — أقصى ٢ ميغابايت',
    // Step 3 — Industry
    greatName: (b: string) => `${b} — اسم حلو!`,
    whatIndustry: 'اختر مجالك',
    // Step 3 — Location
    location: 'الموقع',
    whereBased: 'وين موقع مشروعك؟',
    // Step 4 — Website
    almostThere: 'قربنا نخلّص!',
    haveWebsite: 'عندك موقع إلكتروني؟',
    websiteHint: 'إذا ما عندك، نساعدك تسوّي واحد.',
    websitePlaceholder: 'https://yourbusiness.com',
    noWebsite: 'ما عندي بعد',
    // Step 5 — Primary Need
    oneMoreThing: 'سؤال أخير 🎯',
    whatNeedMost: 'شو أكثر شي تحتاجه؟',
    needHint: 'نبدأ بهالشي وبعدين نفتح لك كل شي.',
    findCustomers: 'ألاقي عملاء جدد',
    findCustomersDesc: 'توليد عملاء بالذكاء الاصطناعي',
    createContent: 'أسوّي محتوى وتسويق',
    createContentDesc: 'تقويم محتوى لشهر كامل',
    customerSupport: 'خدمة عملاء',
    customerSupportDesc: 'وكيل ذكاء اصطناعي لموقعك',
    // Step 6 — Account
    lastStep: 'آخر خطوة — نأمّن حسابك 🔒',
    createYourAccount: 'أنشئ حسابك',
    launchMubyn: '← شغّل مبيّن',
    settingUp: 'جاري تجهيز مساحة عملك...',
    terms: 'بتسجيلك أنت موافق على الشروط وسياسة الخصوصية',
    // Industries
    ind_restaurant: 'مطاعم وأكل',
    ind_ecommerce: 'تجارة إلكترونية',
    ind_realestate: 'عقارات',
    ind_tech: 'تكنولوجيا وبرمجيات',
    ind_healthcare: 'رعاية صحية',
    ind_education: 'تعليم',
    ind_consulting: 'استشارات وخدمات',
    ind_other: 'غير ذلك',
    // Countries
    co_UAE: '🇦🇪 الإمارات',
    co_SaudiArabia: '🇸🇦 السعودية',
    co_Lebanon: '🇱🇧 لبنان',
    co_Egypt: '🇪🇬 مصر',
    co_Jordan: '🇯🇴 الأردن',
    co_Kuwait: '🇰🇼 الكويت',
    co_Qatar: '🇶🇦 قطر',
    co_Morocco: '🇲🇦 المغرب',
    co_Other: '🌍 أخرى',
    // Demo mode
    tryDemo: 'جرّب الديمو',
    tryDemoHint: 'استكشف ببيانات تجريبية',
    orText: 'أو',
  },
} as const;

// ─── helpers ───────────────────────────────────────────────────────────────
function detectLang(): Lang {
  const saved = localStorage.getItem('mubyn-lang');
  if (saved === 'ar' || saved === 'en') return saved;
  const nav = navigator.language || (navigator as any).userLanguage || '';
  return nav.startsWith('ar') ? 'ar' : 'en';
}

const INDUSTRIES_BASE = [
  { value: 'restaurant', key: 'ind_restaurant' as const, icon: Utensils, emoji: '🍽️' },
  { value: 'ecommerce', key: 'ind_ecommerce' as const, icon: ShoppingCart, emoji: '🛒' },
  { value: 'realestate', key: 'ind_realestate' as const, icon: Home, emoji: '🏠' },
  { value: 'tech', key: 'ind_tech' as const, icon: Laptop, emoji: '💻' },
  { value: 'healthcare', key: 'ind_healthcare' as const, icon: Heart, emoji: '🏥' },
  { value: 'education', key: 'ind_education' as const, icon: GraduationCap, emoji: '📚' },
  { value: 'consulting', key: 'ind_consulting' as const, icon: Briefcase, emoji: '💼' },
  { value: 'other', key: 'ind_other' as const, icon: HelpCircle, emoji: '✨' },
];

const COUNTRIES_BASE = [
  { value: 'UAE', key: 'co_UAE' as const },
  { value: 'Saudi Arabia', key: 'co_SaudiArabia' as const },
  { value: 'Lebanon', key: 'co_Lebanon' as const },
  { value: 'Egypt', key: 'co_Egypt' as const },
  { value: 'Jordan', key: 'co_Jordan' as const },
  { value: 'Kuwait', key: 'co_Kuwait' as const },
  { value: 'Qatar', key: 'co_Qatar' as const },
  { value: 'Morocco', key: 'co_Morocco' as const },
  { value: 'Other', key: 'co_Other' as const },
];

const NEEDS_BASE = [
  { value: 'leads', labelKey: 'findCustomers' as const, descKey: 'findCustomersDesc' as const, icon: Users, path: '/app/leads' },
  { value: 'content', labelKey: 'createContent' as const, descKey: 'createContentDesc' as const, icon: TrendingUp, path: '/app/cmo' },
  { value: 'support', labelKey: 'customerSupport' as const, descKey: 'customerSupportDesc' as const, icon: Headphones, path: '/app/cs' },
];

// ─── component ─────────────────────────────────────────────────────────────
export function LoginPage() {
  const location = useLocation();
  const isSignupRoute = location.pathname === '/signup';
  const [mode, setMode] = useState<'login' | 'signup'>(isSignupRoute ? 'signup' : 'login');
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<Lang>(detectLang);

  const L = t[lang];
  const isRTL = lang === 'ar';
  const ArrowForward = isRTL ? ArrowLeft : ArrowRight;
  const ArrowBack = isRTL ? ArrowRight : ArrowLeft;

  // Persist language
  const toggleLang = () => {
    const next: Lang = lang === 'en' ? 'ar' : 'en';
    setLang(next);
    localStorage.setItem('mubyn-lang', next);
  };

  // Sync mode with URL on navigation
  useEffect(() => {
    if (location.pathname === '/signup' && mode !== 'signup') {
      setMode('signup');
      setStep(0);
    } else if (location.pathname === '/login' && mode !== 'login') {
      setMode('login');
    }
  }, [location.pathname]);

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [signupLogo, setSignupLogo] = useState<string | null>(null);
  const [signupLogoDragging, setSignupLogoDragging] = useState(false);
  const [signupLogoProcessing, setSignupLogoProcessing] = useState(false);
  const signupLogoInputRef = useRef<HTMLInputElement>(null);
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [website, setWebsite] = useState('');
  const [primaryNeed, setPrimaryNeed] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = mode === 'login'
      ? (lang === 'ar' ? 'تسجيل الدخول — مبيّن' : 'Sign In — Mubyn')
      : (lang === 'ar' ? 'ابدأ الآن — مبيّن' : 'Get Started — Mubyn');
    if (mode === 'signup') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [step, mode, lang]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      localStorage.setItem('mubyn-user', JSON.stringify(data.user ? { ...data.user, token: data.token } : { email, token: data.token }));
      localStorage.setItem('mubyn-token', data.token);
      navigate('/app/chat');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError('Unable to connect to server. Please check your internet connection and try again.');
      } else {
        setError(msg === 'Login failed' ? L.invalidLogin : msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Demo mode removed — users sign up directly for the real product

  const processSignupLogoFile = useCallback((file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type) || file.size > 2 * 1024 * 1024) return;
    setSignupLogoProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSignupLogo(base64);
      localStorage.setItem('mubyn-signup-logo', base64);
      setSignupLogoProcessing(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSignupComplete = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await signup(email, password, name, businessName, { industry, country, website, primaryNeed });
      localStorage.setItem('mubyn-user', JSON.stringify({
        ...(data.user || {}), token: data.token, website: website || data.user?.website, industry: industry || data.user?.industry, country: country || data.user?.country, primaryNeed: primaryNeed || data.user?.primaryNeed
      }));
      localStorage.setItem('mubyn-token', data.token);
      // Upload logo if user chose one during signup
      const pendingLogo = signupLogo || localStorage.getItem('mubyn-signup-logo');
      if (pendingLogo) {
        try { await uploadLogo(pendingLogo); } catch { /* non-blocking */ }
        localStorage.removeItem('mubyn-signup-logo');
      }
      navigate('/app/chat');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError('Unable to connect to server. Please check your internet connection and try again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => Math.max(0, s - 1));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (canProceed()) nextStep();
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return name.trim().length >= 2;
      case 1: return businessName.trim().length >= 2;
      case 2: return true; // Logo is optional
      case 3: return !!industry;
      case 4: return !!country;
      case 5: return true;
      case 6: return !!primaryNeed;
      case 7: return email.includes('@') && password.length >= 6;
      default: return false;
    }
  };

  const totalSteps = 8;
  const progress = ((step + 1) / totalSteps) * 100;

  // ─── Language toggle pill ─────────────────────────────────────────────────
  const LangToggle = () => (
    <button
      onClick={toggleLang}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-brand-border bg-brand-card/50 text-brand-textMuted hover:text-white hover:border-brand-gold/50 transition-all backdrop-blur-sm"
    >
      {lang === 'en' ? 'العربية' : 'English'}
    </button>
  );

  // ─── Login form ───────────────────────────────────────────────────────────
  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-brand-dark overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Language toggle — top right */}
        <div className="fixed top-4 right-4 z-50"><LangToggle /></div>

        <div className="w-full max-w-md">
          <div className="text-center mb-8 sm:mb-10 px-2">
            <img src={isRTL ? '/mubyn-logo-ar.png' : '/mubyn-logo-en.png'} alt="Mubyn" className="h-8 sm:h-10 mx-auto mb-4 rounded-lg" />
            <p className="text-brand-textMuted text-sm sm:text-base break-words leading-relaxed">{L.tagline}</p>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-2xl p-5 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-5 sm:mb-6">{L.welcomeBack}</h2>
            {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={L.email} required autoFocus
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3.5 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-brand-gold transition-colors" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={L.password} required
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3.5 text-white placeholder:text-brand-textMuted focus:outline-none focus:border-brand-gold transition-colors" />
              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-brand-gold to-brand-goldBright text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-gold/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <LogIn className="w-5 h-5" />}
                {loading ? L.signingIn : L.signIn}
              </button>
            </form>
            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-brand-border" />
              <span className="text-brand-textMuted text-xs">{L.orText}</span>
              <div className="flex-1 h-px bg-brand-border" />
            </div>

            {/* Demo mode removed */}

            <p className="text-center text-brand-textMuted text-sm mt-4">
              <button onClick={() => setError(lang === 'ar' ? 'تواصل مع الدعم: support@mubyn.com' : 'Contact support: support@mubyn.com')} className="text-brand-textMuted hover:text-brand-gold text-xs">
                {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
              </button>
            </p>
            <p className="text-center text-brand-textMuted text-sm mt-2">
              {L.newToMubyn}{' '}
              <button onClick={() => navigate('/signup')} className="text-brand-gold hover:text-brand-goldBright">{L.createAccount}</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Typeform-style signup ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-brand-dark overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-brand-border">
          <div
            className="h-full bg-gradient-to-r from-brand-gold to-brand-goldBright transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, [isRTL ? 'marginRight' : 'marginLeft']: '0' }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <button onClick={() => step === 0 ? setMode('login') : prevStep()} className="flex items-center gap-1 sm:gap-2 text-brand-textMuted hover:text-white transition-colors">
          <ArrowBack className="w-4 h-4" />
          <span className="text-xs sm:text-sm hidden xs:inline">{L.back}</span>
        </button>
        <img src={isRTL ? '/mubyn-logo-ar.png' : '/mubyn-logo-en.png'} alt="Mubyn" className="h-6 sm:h-7 rounded-lg" />
        <div className="flex items-center gap-2 sm:gap-3">
          <LangToggle />
          <span className="text-xs sm:text-sm text-brand-textMuted">{step + 1}/{totalSteps}</span>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg animate-in fade-in slide-in-from-right-4 duration-300" key={`${step}-${lang}`}>

          {/* Step 0: Name */}
          {step === 0 && (
            <div className="space-y-5 sm:space-y-6">
              <div>
                <p className="text-brand-gold text-xs sm:text-sm font-medium mb-2">{L.letsGetStarted}</p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">{L.whatsYourName}</h1>
              </div>
              <input ref={inputRef} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={L.typeYourName} autoFocus
                className="w-full bg-transparent border-b-2 border-brand-border focus:border-brand-gold text-2xl text-white placeholder:text-brand-textMuted/50 py-4 outline-none transition-colors" />
              <button onClick={nextStep} disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-brand-gold text-black font-semibold rounded-xl hover:bg-brand-goldBright transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                {L.continue} <ArrowForward className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 1: Business Name */}
          {step === 1 && (
            <div className="space-y-5 sm:space-y-6">
              <div>
                <p className="text-brand-gold text-xs sm:text-sm font-medium mb-2">{L.niceToMeet(name)}</p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">{L.whatsYourBusiness}</h1>
              </div>
              <input ref={inputRef} value={businessName} onChange={(e) => setBusinessName(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={L.typeBusinessName}
                className="w-full bg-transparent border-b-2 border-brand-border focus:border-brand-gold text-2xl text-white placeholder:text-brand-textMuted/50 py-4 outline-none transition-colors" />
              <button onClick={nextStep} disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-brand-gold text-black font-semibold rounded-xl hover:bg-brand-goldBright transition-colors disabled:opacity-30">
                {L.continue} <ArrowForward className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Logo (optional) */}
          {step === 2 && (
            <div className="space-y-5 sm:space-y-6">
              <div>
                <p className="text-brand-gold text-xs sm:text-sm font-medium mb-2">{L.addYourLogo} <span className="text-brand-textMuted">{L.logoOptional}</span></p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">{L.addYourLogo}</h1>
                <p className="text-brand-textMuted text-sm mt-2">{L.logoHint}</p>
              </div>

              <input
                ref={signupLogoInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) processSignupLogoFile(f); }}
              />

              {signupLogo ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-2xl border-2 border-brand-gold/50 bg-brand-card overflow-hidden flex items-center justify-center">
                    <img src={signupLogo} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                  </div>
                  <button
                    onClick={() => { setSignupLogo(null); localStorage.removeItem('mubyn-signup-logo'); }}
                    className="text-sm text-brand-textMuted hover:text-red-400 transition-colors"
                  >
                    Remove & choose another
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => signupLogoInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setSignupLogoDragging(true); }}
                  onDragLeave={() => setSignupLogoDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setSignupLogoDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processSignupLogoFile(f); }}
                  className={cn(
                    "cursor-pointer rounded-xl border-2 border-dashed transition-all p-10 text-center",
                    signupLogoDragging
                      ? "border-brand-gold bg-brand-gold/10 scale-[1.02]"
                      : "border-brand-gold/40 hover:border-brand-gold hover:bg-brand-gold/5"
                  )}
                >
                  {signupLogoProcessing ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2Icon className="w-10 h-10 text-brand-gold animate-spin" />
                      <p className="text-brand-textMuted text-sm">{L.logoUploading}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-10 h-10 text-brand-gold/60" />
                      <p className="text-white font-medium">
                        {signupLogoDragging ? 'Drop your logo here' : 'Drag & drop or click to upload'}
                      </p>
                      <p className="text-brand-textMuted text-xs">{L.logoFormats}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-gold text-black font-semibold rounded-xl hover:bg-brand-goldBright transition-colors">
                  {signupLogo ? L.continue : L.logoSkip} <ArrowForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Industry (visual cards) */}
          {step === 3 && (
            <div className="space-y-5 sm:space-y-6">
              <div>
                <p className="text-brand-gold text-xs sm:text-sm font-medium mb-2 break-words">{L.greatName(businessName)}</p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">{L.whatIndustry}</h1>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {INDUSTRIES_BASE.map((ind) => (
                  <button key={ind.value} onClick={() => { setIndustry(ind.value); setTimeout(nextStep, 200); }}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-start",
                      industry === ind.value
                        ? "border-brand-gold bg-brand-gold/10 text-white"
                        : "border-brand-border hover:border-brand-gold/50 text-brand-textMuted hover:text-white"
                    )}>
                    <span className="text-2xl">{ind.emoji}</span>
                    <span className="font-medium text-sm">{L[ind.key]}</span>
                    {industry === ind.value && <Check className="w-4 h-4 text-brand-gold ms-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Location */}
          {step === 4 && (
            <div className="space-y-5 sm:space-y-6">
              <div>
                <p className="text-brand-gold text-xs sm:text-sm font-medium mb-2"><MapPin className="w-4 h-4 inline" /> {L.location}</p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">{L.whereBased}</h1>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {COUNTRIES_BASE.map((c) => (
                  <button key={c.value} onClick={() => { setCountry(c.value); setTimeout(nextStep, 200); }}
                    className={cn(
                      "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                      country === c.value
                        ? "border-brand-gold bg-brand-gold/10 text-white"
                        : "border-brand-border hover:border-brand-gold/50 text-brand-textMuted hover:text-white"
                    )}>
                    <span className="font-medium text-sm">{L[c.key]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Website (optional) */}
          {step === 5 && (
            <div className="space-y-5 sm:space-y-6">
              <div>
                <p className="text-brand-gold text-xs sm:text-sm font-medium mb-2">{L.almostThere}</p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">{L.haveWebsite}</h1>
                <p className="text-brand-textMuted text-sm mt-2">{L.websiteHint}</p>
              </div>
              <input ref={inputRef} value={website} onChange={(e) => setWebsite(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={L.websitePlaceholder} dir="ltr"
                className="w-full bg-transparent border-b-2 border-brand-border focus:border-brand-gold text-xl text-white placeholder:text-brand-textMuted/50 py-4 outline-none transition-colors" />
              <div className="flex gap-3">
                <button onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-gold text-black font-semibold rounded-xl hover:bg-brand-goldBright transition-colors">
                  {website ? L.continue : L.noWebsite} <ArrowForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Primary need */}
          {step === 6 && (
            <div className="space-y-5 sm:space-y-6">
              <div>
                <p className="text-brand-gold text-xs sm:text-sm font-medium mb-2">{L.oneMoreThing}</p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">{L.whatNeedMost}</h1>
                <p className="text-brand-textMuted text-sm mt-2">{L.needHint}</p>
              </div>
              <div className="space-y-3">
                {NEEDS_BASE.map((need) => (
                  <button key={need.value} onClick={() => { setPrimaryNeed(need.value); setTimeout(nextStep, 200); }}
                    className={cn(
                      "w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-start group",
                      primaryNeed === need.value
                        ? "border-brand-gold bg-brand-gold/10"
                        : "border-brand-border hover:border-brand-gold/50"
                    )}>
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0",
                      primaryNeed === need.value ? "bg-brand-gold text-black" : "bg-brand-border text-brand-textMuted group-hover:text-white"
                    )}>
                      <need.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-semibold text-white block">{L[need.labelKey]}</span>
                      <span className="text-sm text-brand-textMuted">{L[need.descKey]}</span>
                    </div>
                    {primaryNeed === need.value && <Check className="w-5 h-5 text-brand-gold ms-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 7: Email & Password */}
          {step === 7 && (
            <div className="space-y-5 sm:space-y-6">
              <div>
                <p className="text-brand-gold text-xs sm:text-sm font-medium mb-2">{L.lastStep}</p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">{L.createYourAccount}</h1>
              </div>
              <div className="space-y-4">
                <input ref={inputRef} type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                  placeholder={L.emailAddress} autoFocus dir="ltr"
                  className="w-full bg-brand-card border-2 border-brand-border focus:border-brand-gold rounded-xl px-4 py-4 text-lg text-white placeholder:text-brand-textMuted/50 outline-none transition-colors" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && canProceed()) handleSignupComplete(); }}
                  placeholder={L.passwordHint} minLength={6} dir="ltr"
                  className="w-full bg-brand-card border-2 border-brand-border focus:border-brand-gold rounded-xl px-4 py-4 text-lg text-white placeholder:text-brand-textMuted/50 outline-none transition-colors" />
              </div>
              {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
              <button onClick={handleSignupComplete} disabled={!canProceed() || loading}
                className="w-full py-4 bg-gradient-to-r from-brand-gold to-brand-goldBright text-black font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-brand-gold/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : null}
                {loading ? L.settingUp : L.launchMubyn}
              </button>
              <p className="text-center text-brand-textMuted text-xs">
                {L.terms}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-4 sm:px-6 py-4 text-center">
        <p className="text-brand-textMuted text-xs">
          {L.alreadyHaveAccount}{' '}
          <button onClick={() => navigate('/login')} className="text-brand-gold hover:text-brand-goldBright">{L.signInLink}</button>
        </p>
      </div>
    </div>
  );
}
