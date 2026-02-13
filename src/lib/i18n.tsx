import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// ─── Types ───────────────────────────────────────────────────────────

type Lang = 'ar' | 'en';

interface I18nContext {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

// ─── Translations ────────────────────────────────────────────────────

const translations: Record<string, { en: string; ar: string }> = {
  // ── Sidebar ──
  'nav.caesar': { en: 'Caesar', ar: 'قيصر' },
  'nav.leads': { en: 'Leads', ar: 'العملاء' },
  'nav.cmo': { en: 'CMO', ar: 'التسويق' },
  'nav.cs': { en: 'CS', ar: 'الدعم' },
  'nav.cfo': { en: 'CFO', ar: 'المالية' },
  'nav.email': { en: 'Email Marketing', ar: 'التسويق بالبريد' },
  'nav.website': { en: 'Website', ar: 'الموقع' },
  'nav.agents': { en: 'AI Agents', ar: 'وكلاء AI' },
  'nav.settings': { en: 'Settings', ar: 'الإعدادات' },
  'sidebar.os': { en: 'Mubyn OS', ar: 'مبين OS' },
  'sidebar.freePlan': { en: 'Enterprise Trial', ar: 'تجربة المؤسسات' },

  // ── TopBar ──
  'topbar.notifications': { en: 'Notifications', ar: 'الإشعارات' },
  'topbar.settings': { en: 'Settings', ar: 'الإعدادات' },
  'topbar.signOut': { en: 'Sign Out', ar: 'تسجيل الخروج' },

  // ── StatusBar ──
  'status.version': { en: 'Mubyn OS v0.1', ar: 'مبين OS v0.1' },
  'status.powered': { en: 'Powered by Caesar AI', ar: 'مدعوم بالذكاء الاصطناعي — قيصر' },

  // ── Chat ──
  'chat.welcome': { en: "Hello! I'm Caesar, your AI business manager. How can I help you today?", ar: 'أهلاً! أنا قيصر، مدير أعمالك الذكي. كيف أقدر أساعدك اليوم؟' },
  'chat.placeholder': { en: 'Ask Caesar anything...', ar: 'اسأل قيصر أي شيء...' },
  'chat.title': { en: 'Caesar AI — Mubyn', ar: 'قيصر AI — مبين' },

  // ── Leads ──
  'leads.title': { en: 'Lead Agent', ar: 'وكيل العملاء' },
  'leads.subtitle': { en: 'AI-powered lead generation across MENA markets', ar: 'جذب عملاء مدعوم بالذكاء الاصطناعي في أسواق الشرق الأوسط' },
  'leads.generate': { en: 'Generate Leads', ar: 'إنشاء عملاء' },
  'leads.generateFirst': { en: 'Generate Your First Leads', ar: 'أنشئ أول عملائك' },
  'leads.noLeads': { en: 'No leads yet', ar: 'لا يوجد عملاء بعد' },
  'leads.noLeadsDesc': { en: 'Generate your first batch of leads. Caesar will use AI to find real businesses in your target market with verified contact information.', ar: 'أنشئ أول مجموعة من العملاء. سيستخدم قيصر الذكاء الاصطناعي للعثور على شركات حقيقية في سوقك المستهدف مع معلومات اتصال موثقة.' },
  'leads.exportCsv': { en: 'Export CSV', ar: 'تصدير CSV' },
  'leads.totalLeads': { en: 'Total Leads', ar: 'إجمالي العملاء' },
  'leads.withEmail': { en: 'With Email', ar: 'مع بريد إلكتروني' },
  'leads.withPhone': { en: 'With Phone', ar: 'مع هاتف' },
  'leads.replyRate': { en: 'Reply Rate', ar: 'معدل الرد' },
  'leads.coverage': { en: 'coverage', ar: 'تغطية' },
  'leads.replies': { en: 'replies', ar: 'ردود' },
  'leads.searchLeads': { en: 'Search leads...', ar: 'بحث في العملاء...' },
  'leads.all': { en: 'All', ar: 'الكل' },
  'leads.finding': { en: 'Caesar is finding leads...', ar: 'قيصر يبحث عن عملاء...' },
  'leads.findingDesc': { en: 'Using GPT-4o to discover real businesses with verified contact information. This may take a moment.', ar: 'يستخدم GPT-4o لاكتشاف شركات حقيقية مع معلومات اتصال موثقة. قد يستغرق هذا لحظة.' },
  'leads.industry': { en: 'Industry', ar: 'القطاع' },
  'leads.country': { en: 'Country', ar: 'البلد' },
  'leads.city': { en: 'City', ar: 'المدينة' },
  'leads.numLeads': { en: 'Number of Leads', ar: 'عدد العملاء' },
  'leads.cancel': { en: 'Cancel', ar: 'إلغاء' },
  'leads.generating': { en: 'Generating...', ar: 'جارٍ الإنشاء...' },

  // Lead statuses
  'leads.status.new': { en: 'New', ar: 'جديد' },
  'leads.status.contacted': { en: 'Contacted', ar: 'تم التواصل' },
  'leads.status.replied': { en: 'Replied', ar: 'تم الرد' },
  'leads.status.meeting_booked': { en: 'Meeting Booked', ar: 'تم حجز اجتماع' },

  // Lead detail
  'leads.backToLeads': { en: 'Back to leads', ar: 'العودة للعملاء' },
  'leads.contactInfo': { en: 'Contact Info', ar: 'معلومات الاتصال' },
  'leads.contact': { en: 'Contact', ar: 'جهة الاتصال' },
  'leads.email': { en: 'Email', ar: 'البريد الإلكتروني' },
  'leads.phone': { en: 'Phone', ar: 'الهاتف' },
  'leads.website': { en: 'Website', ar: 'الموقع' },
  'leads.address': { en: 'Address', ar: 'العنوان' },
  'leads.updateStatus': { en: 'Update Status', ar: 'تحديث الحالة' },
  'leads.aiEmailDraft': { en: 'AI Email Draft', ar: 'مسودة بريد بالذكاء الاصطناعي' },
  'leads.generateDraft': { en: 'Generate Draft', ar: 'إنشاء مسودة' },
  'leads.drafting': { en: 'Drafting...', ar: 'جارٍ الكتابة...' },
  'leads.sendEmail': { en: 'Send Email', ar: 'إرسال البريد' },
  'leads.sending': { en: 'Sending...', ar: 'جارٍ الإرسال...' },
  'leads.sent': { en: 'Sent!', ar: 'تم الإرسال!' },
  'leads.regenerate': { en: 'Regenerate', ar: 'إعادة إنشاء' },
  'leads.notes': { en: 'Notes', ar: 'ملاحظات' },
  'leads.addNotes': { en: 'Add notes about this lead...', ar: 'أضف ملاحظات حول هذا العميل...' },
  'leads.saveNotes': { en: 'Save Notes', ar: 'حفظ الملاحظات' },
  'leads.leadScore': { en: 'Lead Score', ar: 'تقييم العميل' },
  'leads.deleteLead': { en: 'Delete Lead', ar: 'حذف العميل' },
  'leads.deleteConfirm': { en: 'Delete this lead? This cannot be undone.', ar: 'حذف هذا العميل؟ لا يمكن التراجع عن هذا.' },
  'leads.generateEmailDesc': { en: 'Generate a personalized email draft using AI', ar: 'إنشاء مسودة بريد مخصصة باستخدام الذكاء الاصطناعي' },

  // Table headers
  'leads.th.business': { en: 'Business', ar: 'الشركة' },
  'leads.th.contact': { en: 'Contact', ar: 'جهة الاتصال' },
  'leads.th.email': { en: 'Email', ar: 'البريد' },
  'leads.th.phone': { en: 'Phone', ar: 'الهاتف' },
  'leads.th.location': { en: 'Location', ar: 'الموقع' },
  'leads.th.status': { en: 'Status', ar: 'الحالة' },
  'leads.th.actions': { en: 'Actions', ar: 'الإجراءات' },

  // Email tabs
  'leads.emailTab.initial': { en: 'Initial Email', ar: 'البريد الأولي' },
  'leads.emailTab.followup1': { en: 'Follow-up 1 (Day 3)', ar: 'متابعة 1 (اليوم 3)' },
  'leads.emailTab.followup2': { en: 'Follow-up 2 (Day 7)', ar: 'متابعة 2 (اليوم 7)' },
  'leads.subject': { en: 'Subject:', ar: 'الموضوع:' },
  'leads.body': { en: 'Body:', ar: 'النص:' },
  'leads.sendDay3': { en: 'Send 3 days after initial email', ar: 'أرسل بعد 3 أيام من البريد الأولي' },
  'leads.sendDay7': { en: 'Send 7 days after initial email', ar: 'أرسل بعد 7 أيام من البريد الأولي' },

  // Campaign dialog
  'leads.dialog.title': { en: 'Generate Leads', ar: 'إنشاء عملاء' },
  'leads.dialog.subtitle': { en: 'Caesar will find real businesses using AI', ar: 'سيعثر قيصر على شركات حقيقية باستخدام الذكاء الاصطناعي' },
  'leads.dialog.selectIndustry': { en: 'Select industry...', ar: 'اختر القطاع...' },
  'leads.dialog.selectCountry': { en: 'Select...', ar: 'اختر...' },
  'leads.dialog.selectCity': { en: 'Select city...', ar: 'اختر المدينة...' },
  'leads.dialog.enterCity': { en: 'Enter city...', ar: 'أدخل المدينة...' },
  'leads.dialog.other': { en: 'Other...', ar: 'أخرى...' },
  'leads.dialog.leads': { en: 'leads', ar: 'عملاء' },

  // ── CMO ──
  'cmo.title': { en: 'CMO — Marketing Intelligence', ar: 'التسويق — الذكاء التسويقي' },
  'cmo.subtitle': { en: 'Cross-channel analytics, content calendar, and campaign management.', ar: 'تحليلات متعددة القنوات، تقويم المحتوى، وإدارة الحملات.' },
  'cmo.tab.overview': { en: 'Overview', ar: 'نظرة عامة' },
  'cmo.tab.content': { en: 'Content', ar: 'المحتوى' },
  'cmo.tab.campaigns': { en: 'Campaigns', ar: 'الحملات' },
  'cmo.tab.email': { en: 'Email Marketing', ar: 'البريد التسويقي' },
  'cmo.contentCalendar': { en: 'Content Calendar', ar: 'تقويم المحتوى' },
  'cmo.contentCalendarDesc': { en: 'AI-powered monthly content calendar with image generation.', ar: 'تقويم محتوى شهري مدعوم بالذكاء الاصطناعي مع إنشاء الصور.' },
  'cmo.generateCalendar': { en: 'Generate Calendar', ar: 'إنشاء التقويم' },
  'cmo.regenerate': { en: 'Regenerate', ar: 'إعادة إنشاء' },
  'cmo.downloadAll': { en: 'Download All', ar: 'تحميل الكل' },
  'cmo.settings': { en: 'Settings', ar: 'الإعدادات' },
  'cmo.crafting': { en: 'Caesar is crafting your content calendar...', ar: 'قيصر يصنع تقويم المحتوى الخاص بك...' },
  'cmo.totalPosts': { en: 'Total Posts', ar: 'إجمالي المنشورات' },
  'cmo.platforms': { en: 'Platforms', ar: 'المنصات' },
  'cmo.contentTypes': { en: 'Content Types', ar: 'أنواع المحتوى' },
  'cmo.weeks': { en: 'Weeks', ar: 'الأسابيع' },
  'cmo.week': { en: 'Week', ar: 'الأسبوع' },
  'cmo.allPosts': { en: 'All Posts', ar: 'جميع المنشورات' },
  'cmo.generateImage': { en: 'Generate Image', ar: 'إنشاء صورة' },
  'cmo.businessDetails': { en: 'Business Details', ar: 'تفاصيل العمل' },
  'cmo.businessDetailsDesc': { en: 'Tell Caesar about your business to generate the perfect content calendar.', ar: 'أخبر قيصر عن عملك لإنشاء تقويم المحتوى المثالي.' },
  'cmo.businessName': { en: 'Business Name', ar: 'اسم العمل' },
  'cmo.industry': { en: 'Industry', ar: 'القطاع' },
  'cmo.targetAudience': { en: 'Target Audience', ar: 'الجمهور المستهدف' },
  'cmo.language': { en: 'Language', ar: 'اللغة' },

  // Overview tab
  'cmo.connectChannels': { en: 'Connect your channels to see real-time analytics', ar: 'اربط قنواتك لعرض التحليلات في الوقت الفعلي' },
  'cmo.connectChannelsDesc': { en: 'Link your Shopify store, Meta Ads, or Google Ads to unlock cross-channel marketing intelligence powered by Caesar.', ar: 'اربط متجر Shopify أو إعلانات Meta أو Google Ads لفتح الذكاء التسويقي عبر القنوات بقوة قيصر.' },
  'cmo.goToSettings': { en: 'Go to Settings', ar: 'الذهاب للإعدادات' },
  'cmo.totalRevenue': { en: 'Total Revenue', ar: 'إجمالي الإيرادات' },
  'cmo.adSpend': { en: 'Ad Spend', ar: 'الإنفاق الإعلاني' },
  'cmo.conversionRate': { en: 'Conversion Rate', ar: 'معدل التحويل' },
  'cmo.revenueVsSpend': { en: 'Revenue vs Ad Spend', ar: 'الإيرادات مقابل الإنفاق الإعلاني' },
  'cmo.last30Days': { en: 'Last 30 days', ar: 'آخر 30 يوم' },
  'cmo.revenue': { en: 'Revenue', ar: 'الإيرادات' },
  'cmo.channelBreakdown': { en: 'Channel Breakdown', ar: 'توزيع القنوات' },
  'cmo.refreshData': { en: 'Refresh Data', ar: 'تحديث البيانات' },
  'cmo.noDailyData': { en: 'No daily data available yet', ar: 'لا توجد بيانات يومية متاحة بعد' },
  'cmo.comingSoon': { en: 'Coming soon', ar: 'قريباً' },
  'cmo.connectInSettings': { en: 'Connect in Settings', ar: 'اربط من الإعدادات' },

  // ── CFO ──
  'cfo.title': { en: 'CFO — Financial Intelligence', ar: 'المالية — الذكاء المالي' },
  'cfo.subtitle': { en: 'Revenue tracking, expense management, and financial intelligence.', ar: 'تتبع الإيرادات وإدارة المصاريف والذكاء المالي.' },
  'cfo.aiInsights': { en: 'AI-powered financial insights', ar: 'رؤى مالية مدعومة بالذكاء الاصطناعي' },
  'cfo.generateAnalysis': { en: 'Generate Financial Analysis', ar: 'إنشاء تحليل مالي' },
  'cfo.letCaesar': { en: 'Let Caesar analyze your finances', ar: 'دع قيصر يحلل مالياتك' },
  'cfo.letCaesarDesc': { en: 'Caesar will generate financial projections, revenue estimates, and actionable insights tailored to your business.', ar: 'سيقوم قيصر بإنشاء توقعات مالية وتقديرات إيرادات ورؤى عملية مخصصة لعملك.' },
  'cfo.analyzing': { en: 'Caesar is analyzing your finances...', ar: 'قيصر يحلل مالياتك...' },
  'cfo.analyzingDesc': { en: 'Generating financial projections, KPIs, and actionable insights using AI...', ar: 'إنشاء توقعات مالية ومؤشرات أداء ورؤى عملية باستخدام الذكاء الاصطناعي...' },
  'cfo.monthlyRevenue': { en: 'Monthly Revenue', ar: 'الإيرادات الشهرية' },
  'cfo.monthlyExpenses': { en: 'Monthly Expenses', ar: 'المصاريف الشهرية' },
  'cfo.netProfit': { en: 'Net Profit', ar: 'صافي الربح' },
  'cfo.burnRate': { en: 'Burn Rate', ar: 'معدل الحرق' },
  'cfo.breakEvenPoint': { en: 'Break-even Point', ar: 'نقطة التعادل' },
  'cfo.cac': { en: 'Customer Acquisition Cost', ar: 'تكلفة اكتساب العميل' },
  'cfo.cashRunway': { en: 'Cash Runway', ar: 'المدرج النقدي' },
  'cfo.revenueVsExpenses': { en: 'Revenue vs Expenses', ar: 'الإيرادات مقابل المصاريف' },
  'cfo.profitProjection': { en: '6-Month Profit Projection', ar: 'توقعات الأرباح لـ 6 أشهر' },
  'cfo.expenses': { en: 'Expenses', ar: 'المصاريف' },
  'cfo.aiInsightsTitle': { en: 'AI Insights', ar: 'رؤى الذكاء الاصطناعي' },
  'cfo.recentTx': { en: 'Recent Transactions', ar: 'المعاملات الأخيرة' },
  'cfo.add': { en: 'Add', ar: 'إضافة' },
  'cfo.newTx': { en: 'New Transaction', ar: 'معاملة جديدة' },
  'cfo.income': { en: 'Income', ar: 'دخل' },
  'cfo.expense': { en: 'Expense', ar: 'مصروف' },
  'cfo.amount': { en: 'Amount', ar: 'المبلغ' },
  'cfo.category': { en: 'Category', ar: 'الفئة' },
  'cfo.description': { en: 'Description', ar: 'الوصف' },
  'cfo.noTx': { en: 'No transactions yet. Add your first income or expense.', ar: 'لا توجد معاملات بعد. أضف أول دخل أو مصروف.' },
  'cfo.refresh': { en: 'Refresh', ar: 'تحديث' },
  'cfo.regenerating': { en: 'Regenerating...', ar: 'جارٍ إعادة الإنشاء...' },
  'cfo.date': { en: 'Date', ar: 'التاريخ' },
  'cfo.type': { en: 'Type', ar: 'النوع' },
  'cfo.analyzingBenchmarks': { en: 'Analyzing industry benchmarks...', ar: 'تحليل معايير القطاع...' },
  'cfo.calculatingProjections': { en: 'Calculating projections...', ar: 'حساب التوقعات...' },
  'cfo.generatingInsights': { en: 'Generating insights...', ar: 'إنشاء الرؤى...' },
  'cfo.current': { en: 'Current', ar: 'الحالي' },
  'cfo.showing': { en: 'Showing', ar: 'عرض' },
  'cfo.of': { en: 'of', ar: 'من' },
  'cfo.transactions': { en: 'transactions', ar: 'معاملات' },

  // ── CS ──
  'cs.title': { en: 'Customer Support Agent', ar: 'وكيل دعم العملاء' },
  'cs.subtitle': { en: 'Configure and test your AI customer support agent across all channels.', ar: 'إعداد واختبار وكيل الدعم الذكي عبر جميع القنوات.' },
  'cs.tab.test': { en: 'Test Agent', ar: 'اختبار الوكيل' },
  'cs.tab.setup': { en: 'Setup & Channels', ar: 'الإعداد والقنوات' },
  'cs.tab.knowledge': { en: 'Knowledge Base', ar: 'قاعدة المعرفة' },
  'cs.tab.tone': { en: 'Tone & Style', ar: 'الأسلوب والنبرة' },
  'cs.testTitle': { en: 'Test your AI support agent', ar: 'اختبر وكيل الدعم الذكي' },
  'cs.testDesc': { en: 'Type a message as a customer would. Caesar will respond using your business context and knowledge base.', ar: 'اكتب رسالة كما يفعل العميل. سيرد قيصر باستخدام سياق عملك وقاعدة المعرفة.' },
  'cs.inputPlaceholder': { en: 'Type a customer message to test the AI response...', ar: 'اكتب رسالة عميل لاختبار رد الذكاء الاصطناعي...' },
  'cs.clearConvo': { en: 'Clear Conversation', ar: 'مسح المحادثة' },
  'cs.businessContext': { en: 'Business Context', ar: 'سياق العمل' },
  'cs.descBusiness': { en: 'Describe your business...', ar: 'صف عملك...' },
  'cs.activeSettings': { en: 'Active Settings', ar: 'الإعدادات النشطة' },
  'cs.tone': { en: 'Tone', ar: 'النبرة' },
  'cs.language': { en: 'Language', ar: 'اللغة' },
  'cs.length': { en: 'Length', ar: 'الطول' },

  // ── Website ──
  'website.title': { en: 'Website', ar: 'الموقع الإلكتروني' },
  'website.buildIn60': { en: 'Build Your Website in', ar: 'ابنِ موقعك في' },
  'website.60seconds': { en: '60 Seconds', ar: '60 ثانية' },
  'website.generate': { en: 'Generate My Website', ar: 'إنشاء موقعي' },
  'website.generating': { en: 'Generating...', ar: 'جارٍ الإنشاء...' },
  'website.publish': { en: 'Publish Website', ar: 'نشر الموقع' },
  'website.publishing': { en: 'Publishing...', ar: 'جارٍ النشر...' },
  'website.regenerate': { en: 'Regenerate', ar: 'إعادة إنشاء' },
  'website.copyUrl': { en: 'Copy URL', ar: 'نسخ الرابط' },
  'website.copied': { en: 'Copied!', ar: 'تم النسخ!' },
  'website.visitSite': { en: 'Visit Site', ar: 'زيارة الموقع' },
  'website.edit': { en: 'Apply', ar: 'تطبيق' },
  'website.editing': { en: 'Editing...', ar: 'جارٍ التعديل...' },
  'website.aiEdit': { en: 'AI Edit', ar: 'تعديل بالذكاء الاصطناعي' },
  'website.aiEditDesc': { en: 'Describe changes and AI will modify your website', ar: 'صف التغييرات وسيعدل الذكاء الاصطناعي موقعك' },
  'website.live': { en: 'Your website is live! 🎉', ar: 'موقعك أصبح مباشراً! 🎉' },
  'website.liveDesc': { en: 'Anyone can visit your site at:', ar: 'يمكن لأي شخص زيارة موقعك على:' },
  'website.buildWebsite': { en: 'Build Website', ar: 'بناء الموقع' },
  'website.connectExisting': { en: 'Connect Existing', ar: 'ربط موقع موجود' },
  'website.connect': { en: 'Connect', ar: 'ربط' },
  'website.businessInfo': { en: 'Business Info', ar: 'معلومات العمل' },
  'website.designStyle': { en: 'Design Style', ar: 'نمط التصميم' },
  'website.whatYouGet': { en: "What You'll Get", ar: 'ماذا ستحصل عليه' },

  // ── Settings ──
  'settings.title': { en: 'Settings', ar: 'الإعدادات' },
  'settings.subtitle': { en: 'Manage your account and business preferences', ar: 'إدارة حسابك وتفضيلات عملك' },
  'settings.signOut': { en: 'Sign Out', ar: 'تسجيل الخروج' },
  'settings.businessLogo': { en: 'Business Logo', ar: 'شعار العمل' },
  'settings.logoDesc': { en: 'Used in your website, email signatures, and widget', ar: 'يُستخدم في موقعك وتوقيعات البريد والأداة' },
  'settings.businessInfo': { en: 'Business Information', ar: 'معلومات العمل' },
  'settings.businessName': { en: 'Business Name', ar: 'اسم العمل' },
  'settings.industry': { en: 'Industry', ar: 'القطاع' },
  'settings.website': { en: 'Website', ar: 'الموقع' },
  'settings.country': { en: 'Country', ar: 'البلد' },
  'settings.description': { en: 'Description', ar: 'الوصف' },
  'settings.saveChanges': { en: 'Save Changes', ar: 'حفظ التغييرات' },
  'settings.saving': { en: 'Saving...', ar: 'جارٍ الحفظ...' },
  'settings.saved': { en: 'Saved!', ar: 'تم الحفظ!' },
  'settings.emailOutreach': { en: 'Email for Outreach', ar: 'البريد الإلكتروني للتواصل' },
  'settings.connected': { en: 'Connected', ar: 'متصل' },
  'settings.integrations': { en: 'Integrations', ar: 'التكاملات' },
  'settings.dragDrop': { en: 'Drag & drop or click to upload', ar: 'اسحب وأفلت أو انقر للرفع' },
  'settings.logoSaved': { en: 'Logo saved!', ar: 'تم حفظ الشعار!' },
  'settings.uploading': { en: 'Uploading...', ar: 'جارٍ الرفع...' },
  'settings.connectEmail': { en: 'Connect Email', ar: 'ربط البريد الإلكتروني' },

  // ── AI Agents ──
  'agents.title': { en: 'AI Agents', ar: 'وكلاء AI' },
  'agents.subtitle': { en: 'Autonomous operators that run your business 24/7', ar: 'عملاء مستقلون يديرون أعمالك على مدار الساعة' },
  'agents.poweredBy': { en: 'Powered by OpenClaw', ar: 'مدعوم بـ OpenClaw' },
  'agents.leadHunter': { en: 'Lead Hunter', ar: 'صائد العملاء' },
  'agents.leadHunterDesc': { en: 'Autonomously finds and qualifies prospects 24/7', ar: 'يبحث عن العملاء المحتملين ويؤهلهم تلقائياً على مدار الساعة' },
  'agents.outreach': { en: 'Outreach Agent', ar: 'وكيل التواصل' },
  'agents.outreachDesc': { en: 'Sends personalized emails and follows up automatically', ar: 'يرسل رسائل بريد مخصصة ويتابع تلقائياً' },
  'agents.cs': { en: 'CS Agent', ar: 'وكيل الدعم' },
  'agents.csDesc': { en: 'Handles customer support across 5 channels', ar: 'يتعامل مع دعم العملاء عبر 5 قنوات' },
  'agents.analytics': { en: 'Analytics Agent', ar: 'وكيل التحليلات' },
  'agents.analyticsDesc': { en: 'Monitors KPIs and alerts you to anomalies', ar: 'يراقب مؤشرات الأداء وينبهك للشذوذ' },
  'agents.content': { en: 'Content Agent', ar: 'وكيل المحتوى' },
  'agents.contentDesc': { en: 'Creates and schedules a full month of content', ar: 'ينشئ ويجدول محتوى شهر كامل' },
  'agents.website': { en: 'Website Agent', ar: 'وكيل الموقع' },
  'agents.websiteDesc': { en: 'Builds and optimizes your site continuously', ar: 'يبني ويحسّن موقعك باستمرار' },
  'agents.callout': { en: 'Each agent is an autonomous AI operator with persistent memory, real tools, and 24/7 heartbeats. Not a chatbot — an employee.', ar: 'كل وكيل هو مشغّل ذكاء اصطناعي مستقل مع ذاكرة دائمة وأدوات حقيقية ونبضات قلب على مدار الساعة. ليس روبوت محادثة — بل موظف.' },

  // ── Common ──
  'common.save': { en: 'Save', ar: 'حفظ' },
  'common.cancel': { en: 'Cancel', ar: 'إلغاء' },
  'common.delete': { en: 'Delete', ar: 'حذف' },
  'common.edit': { en: 'Edit', ar: 'تعديل' },
  'common.generate': { en: 'Generate', ar: 'إنشاء' },
  'common.send': { en: 'Send', ar: 'إرسال' },
  'common.connect': { en: 'Connect', ar: 'ربط' },
  'common.disconnect': { en: 'Disconnect', ar: 'قطع الاتصال' },
  'common.refresh': { en: 'Refresh', ar: 'تحديث' },
  'common.copy': { en: 'Copy', ar: 'نسخ' },
  'common.download': { en: 'Download', ar: 'تحميل' },
  'common.tryAgain': { en: 'Try Again', ar: 'حاول مرة أخرى' },
  'common.loading': { en: 'Loading...', ar: 'جارٍ التحميل...' },
  'common.close': { en: 'Close', ar: 'إغلاق' },
};

// ─── Context ─────────────────────────────────────────────────────────

const I18nCtx = createContext<I18nContext>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
  isRTL: false,
});

// ─── Provider ────────────────────────────────────────────────────────

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem('mubyn-lang');
      if (stored === 'ar' || stored === 'en') return stored;
    } catch { /* ignore */ }
    return 'en';
  });

  const isRTL = lang === 'ar';

  // Apply document-level direction and lang
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    // Set font preference
    if (isRTL) {
      document.body.style.fontFamily = "'IBM Plex Sans Arabic', 'Inter', sans-serif";
    } else {
      document.body.style.fontFamily = "'Inter', 'IBM Plex Sans Arabic', sans-serif";
    }
  }, [lang, isRTL]);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    try {
      localStorage.setItem('mubyn-lang', newLang);
    } catch { /* ignore */ }
  }, []);

  const t = useCallback((key: string): string => {
    const entry = translations[key];
    if (!entry) return key; // fallback to key itself
    return entry[lang] || entry.en || key;
  }, [lang]);

  return (
    <I18nCtx.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </I18nCtx.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useLang() {
  return useContext(I18nCtx);
}
