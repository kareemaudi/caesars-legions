# Mubyn OS — Website Builder (Website Architect Agent)

> **Status:** SPEC COMPLETE — Ready for Implementation  
> **Date:** 2026-02-11  
> **Author:** Caesar (AI Architect)  
> **Priority:** HIGH — Core product feature for onboarding clients without websites

---

## 1. Executive Summary

Mubyn OS clients (SMBs in MENA) often don't have a website. The **Website Architect Agent** generates and deploys a professional single-page (expandable to multi-page) website from minimal business data, hosted on `clientname.mubyn.com` subdomains. 

**Recommended Approach (MVP):** GPT-4o generates complete HTML/CSS/JS → deployed to **Cloudflare Workers + R2** with wildcard subdomain routing on `*.mubyn.com`. This is the fastest path — zero external vendor dependency, $0 hosting cost at scale, full control.

---

## 2. Research Summary

### 2.1 AI Website Builder Landscape (2025-2026)

| Solution | Type | API? | Cost | Verdict |
|----------|------|------|------|---------|
| **10Web Website Builder API** | White-label WordPress | ✅ Full REST API | $3.50–$5/site/month | Best turnkey option but expensive at scale, WordPress bloat |
| **Duda** | White-label builder | ✅ API | ~$7-15/site/month | Enterprise-grade, overkill for single-page sites |
| **Wix ADI** | Consumer AI builder | ❌ No programmatic API | $17+/month | Not embeddable |
| **Framer / Webflow** | Design tools | ❌ Limited API | $10+/site/month | Manual, not programmatic |
| **Vercel v0** | AI component gen | ❌ No deploy API for generated sites | N/A | Generates React components, not full sites |
| **Replit** | AI coding | ❌ No white-label API | Variable | Good for prototypes, not production hosting |
| **GPT-4o + Self-host** | Custom pipeline | ✅ Full control | ~$0.01-0.05/site generation | **WINNER — fastest, cheapest, most flexible** |

### 2.2 Key Insight

The Reddit/HN consensus (2024-2025): *"GPT-4 does a really good job at picking a color scheme that works for the business, keyword to search for stock photos, and writing all the copy. Templates + AI content = best results."*

**Our approach:** Pre-built HTML/Tailwind templates per industry + GPT-4o fills content, colors, images → deploy static HTML to Cloudflare.

### 2.3 Deployment Platform Comparison

| Platform | API Deploy? | Wildcard Subdomain? | Cost | Speed |
|----------|-------------|---------------------|------|-------|
| **Cloudflare Workers + R2** | ✅ Full API | ✅ Via Worker routing | Free (100K req/day free) | <1s global |
| **Cloudflare Pages** | ✅ Wrangler CLI | ❌ No wildcard subdomain | Free (500 builds/mo) | ~30s deploy |
| **Vercel** | ✅ API | ⚠️ Complex per-project | Free tier then $20/mo | ~15s deploy |
| **GitHub Pages** | ✅ Via Git | ❌ No wildcard | Free | ~60s deploy |
| **Railway** | ✅ API | ⚠️ Manual DNS | $5/mo minimum | ~30s deploy |
| **Netlify** | ✅ API | ⚠️ One site per deploy | Free tier | ~30s deploy |

**Winner: Cloudflare Workers + R2**
- Wildcard `*.mubyn.com` routing with a single Worker
- Store HTML in R2 (object storage, $0 egress)
- Global CDN, <50ms TTFB worldwide
- Zero hosting cost up to massive scale
- Full API control (create, update, delete sites programmatically)

---

## 3. Technical Architecture

### 3.1 High-Level Flow

```
User signs up to Mubyn OS
        │
        ▼
Fills business form (name, industry, location, description, phone, hours)
        │
        ▼
POST /api/website/generate
        │
        ▼
┌─────────────────────────────────┐
│  1. SELECT TEMPLATE             │  ← Based on industry
│  2. GPT-4o GENERATES CONTENT   │  ← Business-specific copy, colors, CTAs
│  3. INJECT INTO TEMPLATE        │  ← Handlebars/mustache merge
│  4. GENERATE IMAGES (optional)  │  ← AI stock photo search or generation
│  5. UPLOAD TO R2                │  ← clientname/index.html + assets
│  6. REGISTER SUBDOMAIN          │  ← clientname.mubyn.com in Supabase
│  7. RETURN URL                  │  ← https://clientname.mubyn.com
└─────────────────────────────────┘
        │
        ▼
Client sees their live website in <60 seconds
```

### 3.2 Infrastructure Components

```
┌──────────────────────────────────────────────────────┐
│                   CLOUDFLARE                          │
│                                                       │
│  DNS: *.mubyn.com → AAAA 100:: (proxied)             │
│       ↓                                               │
│  Worker Route: *.mubyn.com/*                          │
│       ↓                                               │
│  ┌─────────────────────────────────┐                  │
│  │  WEBSITE ROUTER WORKER          │                  │
│  │                                  │                  │
│  │  1. Extract subdomain from Host  │                  │
│  │  2. Look up in KV/R2 mapping     │                  │
│  │  3. Serve HTML from R2 bucket    │                  │
│  │  4. 404 → redirect to mubyn.com  │                  │
│  └─────────┬───────────────────────┘                  │
│            │                                          │
│  ┌─────────▼───────────────────────┐                  │
│  │  R2 BUCKET: mubyn-websites       │                  │
│  │                                   │                  │
│  │  /acme-corp/index.html            │                  │
│  │  /acme-corp/styles.css            │                  │
│  │  /acme-corp/images/hero.webp      │                  │
│  │  /bobs-restaurant/index.html      │                  │
│  │  /bobs-restaurant/styles.css      │                  │
│  │  ...                              │                  │
│  └───────────────────────────────────┘                  │
│                                                       │
│  KV Namespace: SITE_MAP                               │
│  {                                                    │
│    "acme-corp": { clientId: "...", active: true },     │
│    "bobs-restaurant": { clientId: "...", active: true} │
│  }                                                    │
└──────────────────────────────────────────────────────┘
```

### 3.3 Cloudflare Worker (Router)

```javascript
// website-router.js — Cloudflare Worker
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname; // e.g., "acme-corp.mubyn.com"
    
    // Extract subdomain
    const subdomain = host.split('.')[0];
    
    // Skip non-client subdomains
    const reserved = ['www', 'app', 'api', 'dashboard', 'mail'];
    if (reserved.includes(subdomain) || !subdomain) {
      return Response.redirect('https://mubyn.com', 301);
    }
    
    // Check if site exists in KV
    const siteData = await env.SITE_MAP.get(subdomain, 'json');
    if (!siteData || !siteData.active) {
      return new Response('Site not found', { status: 404 });
    }
    
    // Determine file path
    let path = url.pathname === '/' ? '/index.html' : url.pathname;
    const key = `${subdomain}${path}`;
    
    // Fetch from R2
    const object = await env.WEBSITES_BUCKET.get(key);
    if (!object) {
      // Fallback to index.html for SPA routing
      const fallback = await env.WEBSITES_BUCKET.get(`${subdomain}/index.html`);
      if (!fallback) return new Response('Not found', { status: 404 });
      return new Response(fallback.body, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    
    // Determine content type
    const contentType = getContentType(path);
    
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }
};

function getContentType(path) {
  const ext = path.split('.').pop().toLowerCase();
  const types = {
    html: 'text/html;charset=UTF-8',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    woff2: 'font/woff2',
  };
  return types[ext] || 'application/octet-stream';
}
```

---

## 4. Backend API Spec

### 4.1 `POST /api/website/generate`

**Description:** Generate and deploy a complete website for a client.

**Request Body:**
```json
{
  "clientId": "uuid-of-client",
  "businessName": "Bob's Shawarma House",
  "industry": "restaurant",
  "subIndustry": "middle_eastern",
  "description": "Family-owned shawarma restaurant in Beirut serving authentic Lebanese street food since 1985.",
  "location": {
    "city": "Beirut",
    "country": "Lebanon",
    "address": "Hamra Street 42, Beirut"
  },
  "contactInfo": {
    "phone": "+961 1 234 567",
    "email": "info@bobsshawarma.com",
    "whatsapp": "+961 71 234 567"
  },
  "hours": "Mon-Sat 11:00-23:00, Sun 12:00-22:00",
  "subdomain": "bobs-shawarma",
  "language": "en",
  "direction": "ltr",
  "features": ["menu", "location_map", "whatsapp_cta", "reviews"],
  "branding": {
    "primaryColor": null,
    "logo": null
  }
}
```

**Response (success):**
```json
{
  "success": true,
  "website": {
    "id": "ws_abc123",
    "url": "https://bobs-shawarma.mubyn.com",
    "subdomain": "bobs-shawarma",
    "status": "live",
    "generatedAt": "2026-02-11T14:30:00Z",
    "template": "restaurant_v1",
    "pages": ["index.html"],
    "previewImage": "https://r2.mubyn.com/previews/bobs-shawarma.png"
  }
}
```

**Response time target:** < 30 seconds (most of that is GPT-4o content generation).

### 4.2 `PUT /api/website/:websiteId/update`

**Description:** Regenerate or update specific sections.

```json
{
  "sections": ["hero", "menu"],
  "data": {
    "hero": { "headline": "New headline here" },
    "menu": { "items": [...] }
  }
}
```

### 4.3 `DELETE /api/website/:websiteId`

Remove site from R2 and KV. Sets `active: false`.

### 4.4 `GET /api/website/:websiteId/status`

Returns current deployment status, URL, and analytics.

---

## 5. Template System

### 5.1 Template Architecture

Each template is a self-contained HTML file using **Tailwind CSS (CDN)** with **Handlebars-style placeholders** that get replaced during generation.

```
templates/
├── restaurant_v1.html
├── restaurant_v2.html
├── ecommerce_v1.html
├── services_v1.html
├── portfolio_v1.html
├── salon_v1.html
├── realestate_v1.html
├── clinic_v1.html
├── gym_v1.html
├── education_v1.html
└── generic_v1.html
```

### 5.2 Industry Templates

| Industry | Template ID | Key Sections | Special Features |
|----------|-------------|--------------|------------------|
| **Restaurant / Café** | `restaurant_v1` | Hero + tagline, Menu (categories + items), Location map, Hours, Photo gallery, Reviews | Menu display, Delivery CTA, WhatsApp order button |
| **E-commerce / Retail** | `ecommerce_v1` | Hero, Featured products grid, Categories, About, Contact | Product cards, "Shop Now" CTAs, WhatsApp catalog link |
| **Professional Services** | `services_v1` | Hero, Services grid, About, Team, Testimonials, Contact form | Service cards with icons, Booking CTA |
| **Salon / Spa / Beauty** | `salon_v1` | Hero, Services + prices, Gallery, Team, Booking, Reviews | Before/after gallery, Price list, Booking CTA |
| **Real Estate** | `realestate_v1` | Hero, Featured listings, Services, Testimonials, Contact | Property cards, Area focus, Virtual tour link |
| **Medical / Clinic** | `clinic_v1` | Hero, Services, Doctors/Team, Hours, Insurance, Contact | Doctor profiles, Specialties, Emergency info |
| **Gym / Fitness** | `gym_v1` | Hero, Programs, Trainers, Schedule, Pricing, Join CTA | Class schedule, Membership tiers, Before/after |
| **Education / Tutoring** | `education_v1` | Hero, Programs, Instructors, Testimonials, Enroll | Course cards, Instructor profiles |
| **Portfolio / Freelance** | `portfolio_v1` | Hero, Work samples, About, Skills, Contact | Project cards, Skill bars, Resume download |
| **Generic Business** | `generic_v1` | Hero, About, Services, Features, Testimonials, Contact | Flexible sections, works for any business |

### 5.3 Template Variables (filled by GPT-4o)

```javascript
const templateVars = {
  // Branding
  businessName: "Bob's Shawarma House",
  tagline: "Authentic Lebanese Street Food Since 1985",
  primaryColor: "#D4A843",      // GPT picks based on industry
  secondaryColor: "#1A1A2E",
  accentColor: "#E8B86D",
  fontFamily: "Inter",
  
  // Hero
  heroHeadline: "Taste the Soul of Beirut",
  heroSubheadline: "Handcrafted shawarma wraps made with love, served fresh daily.",
  heroCTA: "View Our Menu",
  heroImage: "https://images.unsplash.com/...",  // Curated stock
  
  // About
  aboutTitle: "Our Story",
  aboutText: "For over 35 years, Bob's Shawarma House has been...",
  
  // Services / Menu / Products (array)
  items: [
    { name: "Classic Chicken Shawarma", description: "...", price: "$5.99", image: "..." },
    { name: "Beef Shawarma Plate", description: "...", price: "$8.99", image: "..." },
  ],
  
  // Testimonials (array)
  testimonials: [
    { name: "Ahmad K.", text: "Best shawarma in Hamra!", rating: 5 },
    { name: "Sarah M.", text: "My family's favorite...", rating: 5 },
  ],
  
  // Contact
  phone: "+961 1 234 567",
  email: "info@bobsshawarma.com",
  whatsapp: "+961 71 234 567",
  address: "Hamra Street 42, Beirut, Lebanon",
  mapEmbed: "https://maps.google.com/...",
  hours: "Mon-Sat 11:00-23:00",
  
  // Social
  instagram: "https://instagram.com/bobsshawarma",
  facebook: "https://facebook.com/bobsshawarma",
  
  // SEO
  metaTitle: "Bob's Shawarma House | Authentic Lebanese Shawarma in Beirut",
  metaDescription: "Family-owned since 1985. Serving the best shawarma...",
  
  // Footer
  footerText: "© 2026 Bob's Shawarma House. Powered by Mubyn.",
  poweredBy: true,  // "Powered by Mubyn" badge
};
```

### 5.4 GPT-4o Prompt for Content Generation

```
You are a professional web copywriter and designer. Generate website content for a business.

Business Info:
- Name: {{businessName}}
- Industry: {{industry}}
- Description: {{description}}
- Location: {{location}}
- Language: {{language}}

Generate the following as a JSON object:
1. tagline (short, punchy, 5-8 words)
2. heroHeadline (compelling, 4-8 words)
3. heroSubheadline (1-2 sentences, benefit-focused)
4. heroCTA (button text, 2-4 words)
5. primaryColor (hex, appropriate for the industry)
6. secondaryColor (hex, complementary dark shade)
7. accentColor (hex, for highlights)
8. aboutTitle (section heading)
9. aboutText (2-3 paragraphs, professional tone, authentic)
10. items[] (4-8 items with name, description, price if applicable)
11. testimonials[] (3 realistic testimonials with names)
12. metaTitle (SEO optimized, <60 chars)
13. metaDescription (SEO optimized, <160 chars)
14. heroImageKeyword (search term for Unsplash stock photo)
15. itemImageKeywords[] (search terms per item)

Return ONLY valid JSON. No markdown, no explanation.
Match the tone to the industry and location (e.g., warm for restaurants, professional for law firms, energetic for gyms).
If the language is Arabic, generate all content in Arabic and set direction to "rtl".
```

---

## 6. Subdomain System

### 6.1 DNS Configuration (Cloudflare)

```
Type    Name    Content         Proxy
AAAA    *       100::           ✅ Proxied
A       @       <server-ip>     ✅ Proxied
CNAME   www     mubyn.com       ✅ Proxied
CNAME   app     <dashboard>     ✅ Proxied
CNAME   api     <backend>       ✅ Proxied
```

The wildcard `*` record catches ALL subdomains and routes them through Cloudflare's proxy to our Worker.

### 6.2 Subdomain Rules

- **Allowed:** lowercase letters, numbers, hyphens. 3-50 chars.
- **Reserved:** `www`, `app`, `api`, `dashboard`, `admin`, `mail`, `staging`, `dev`, `cdn`, `assets`, `blog`
- **Auto-generated:** Slugified business name. E.g., "Bob's Shawarma House" → `bobs-shawarma-house`
- **Collision handling:** Append random 3-digit suffix if taken. E.g., `bobs-shawarma-house-347`
- **Custom subdomains:** Client can request a specific subdomain during setup.

### 6.3 Custom Domain Support (Phase 2)

For clients who want their own domain (e.g., `www.bobsshawarma.com`):
1. Client adds CNAME: `www.bobsshawarma.com → sites.mubyn.com`
2. We add custom hostname via Cloudflare for SaaS API
3. Automatic SSL via Cloudflare
4. **Cost:** Cloudflare for SaaS is $0.10/month per custom hostname (after 100 free)

---

## 7. Image Strategy

### 7.1 Stock Photos (MVP)

Use **Unsplash API** (free, no attribution required for most uses):
- GPT-4o generates search keywords per section
- We query Unsplash API and pick the top result
- Download and store in R2 alongside the site
- **Cost:** Free (50 req/hour on demo key, paid plans available)

### 7.2 AI-Generated Images (Phase 2)

- Use Flux/DALL-E for custom hero images
- Generate product/service illustrations
- Brand-consistent image generation
- **Cost:** ~$0.02-0.10 per image

### 7.3 Client Logo

- If client has a logo → upload and use
- If no logo → generate a simple text-based logo using the business name + a relevant icon from Lucide/Heroicons
- **Phase 2:** AI logo generation (Ideogram/DALL-E)

---

## 8. RTL & Arabic Support

Critical for MENA market:

```html
<!-- Arabic template variant -->
<html lang="ar" dir="rtl">
<head>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
</head>
```

- All templates have RTL variants
- GPT-4o generates Arabic content natively when `language: "ar"`
- Font: Tajawal (Arabic) or Cairo for headers
- Tailwind RTL plugin handles layout mirroring
- WhatsApp CTA especially important in MENA

---

## 9. MVP Implementation Plan

### Phase 1: Core Pipeline (3-5 days)

| Day | Task | Output |
|-----|------|--------|
| 1 | Build 2 HTML/Tailwind templates (restaurant + generic) | `templates/restaurant_v1.html`, `templates/generic_v1.html` |
| 1 | GPT-4o content generation function | `lib/generate-content.ts` |
| 2 | Template injection engine (merge content → HTML) | `lib/template-engine.ts` |
| 2 | Cloudflare R2 upload function | `lib/deploy-to-r2.ts` |
| 3 | Cloudflare Worker (subdomain router) | `worker/website-router.js` |
| 3 | DNS wildcard setup on mubyn.com | Cloudflare dashboard |
| 4 | Backend endpoint: `POST /api/website/generate` | Express route |
| 4 | Supabase table: `websites` (track all generated sites) | Migration |
| 5 | Dashboard UI: "Create Website" form | React component |
| 5 | Testing + polish | E2E test |

### Phase 2: Enhancement (Week 2)

- 8 more industry templates
- Arabic/RTL support
- Custom domain support (Cloudflare for SaaS)
- Website editor (inline text editing)
- AI image generation for heroes
- Analytics integration (simple page view counter via Worker)
- "Powered by Mubyn" badge with backlink

### Phase 3: Advanced (Month 2)

- Multi-page sites (About, Services, Contact as separate pages)
- Blog/news section
- Booking/appointment integration
- E-commerce (simple product catalog + WhatsApp ordering)
- Form submissions (contact form → Supabase → email notification)
- A/B testing different templates
- SEO auto-optimization

---

## 10. Database Schema

```sql
CREATE TABLE websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) NOT NULL,
  subdomain VARCHAR(50) UNIQUE NOT NULL,
  custom_domain VARCHAR(255),
  business_name VARCHAR(255) NOT NULL,
  industry VARCHAR(50) NOT NULL,
  template_id VARCHAR(50) NOT NULL,
  language VARCHAR(5) DEFAULT 'en',
  status VARCHAR(20) DEFAULT 'generating', -- generating, live, paused, deleted
  content JSONB, -- full generated content for re-rendering
  r2_prefix VARCHAR(100) NOT NULL, -- R2 path prefix
  page_views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deployed_at TIMESTAMPTZ,
  
  CONSTRAINT subdomain_format CHECK (subdomain ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$')
);

CREATE INDEX idx_websites_client ON websites(client_id);
CREATE INDEX idx_websites_subdomain ON websites(subdomain);
CREATE INDEX idx_websites_status ON websites(status);
```

---

## 11. Cost Analysis

### Per-Site Generation Cost

| Component | Cost per Site | Notes |
|-----------|--------------|-------|
| GPT-4o content generation | ~$0.02 | ~2K input + 2K output tokens |
| Unsplash API (images) | $0.00 | Free tier |
| R2 storage | ~$0.00015/month | ~1MB per site, $0.015/GB/month |
| R2 egress | $0.00 | Free egress |
| Worker requests | $0.00 | 100K/day free, then $0.50/M |
| KV reads | $0.00 | 100K/day free |
| **Total generation cost** | **~$0.02** | |
| **Total hosting cost/month** | **~$0.00** | Free at scale up to ~100K sites |

### At Scale (1,000 client sites)

| Component | Monthly Cost |
|-----------|-------------|
| R2 storage (1GB total) | $0.015 |
| Worker requests (est. 500K/mo) | $0.00 (free tier) |
| KV operations | $0.00 (free tier) |
| Custom domains (100 clients) | $0.00 (100 free) |
| **Total monthly hosting** | **< $1.00/month** |

### Comparison to Alternatives

| Approach | Cost per site/month | Setup effort |
|----------|-------------------|--------------|
| **Our approach (GPT + CF)** | **~$0.00** | 3-5 days |
| 10Web API | $3.50–$5.00 | 1-2 days |
| Duda white-label | $7–$15 | 3-5 days |
| Vercel per-project | $0–$20 | 5-7 days |
| Manual (hire dev) | $200–$2000 one-time | 1-4 weeks |

---

## 12. Revenue Model

This is a **huge value-add** for Mubyn clients:

| Tier | Price | What They Get |
|------|-------|---------------|
| **Included in Mubyn OS** | $0 (bundled) | clientname.mubyn.com subdomain, basic template |
| **Pro Website** | $29/month add-on | Custom domain, advanced template, no "Powered by Mubyn" |
| **Custom Website** | $99 one-time + $19/month | Custom design, multi-page, blog, booking |

The "Powered by Mubyn" badge on free sites = organic marketing. Every client site promotes Mubyn.

---

## 13. Competitive Advantage

1. **Speed:** Website live in <60 seconds (competitors take minutes to hours)
2. **Cost:** Essentially free hosting (competitors charge $3-15/site/month)
3. **MENA-native:** Arabic RTL support out of the box (most builders are English-first)
4. **Integrated:** Website is part of the Mubyn OS ecosystem — linked to Lead Agent, CSA, social media
5. **AI-powered updates:** Client tells Caesar "update my menu" → website auto-updates
6. **WhatsApp-first CTAs:** Every template has WhatsApp integration (critical for MENA)

---

## 14. Integration with Mubyn OS Agents

The Website Architect doesn't exist in isolation — it connects to the full agent suite:

| Agent | Integration |
|-------|-------------|
| **Lead Agent** | Leads captured via website contact form → Lead pipeline |
| **CSA** | Chat widget on website → Customer support agent |
| **Social Media Planner** | Auto-generate social posts promoting the website |
| **CMO Agent** | SEO optimization, analytics tracking, conversion optimization |
| **Caesar Chat** | "Create a website for my business" → triggers generation |

---

## 15. Implementation Checklist (MVP)

- [ ] Create `templates/restaurant_v1.html` (Tailwind, responsive, dark modern design)
- [ ] Create `templates/generic_v1.html` (fallback for any industry)
- [ ] Build `lib/generate-content.ts` (GPT-4o content generation)
- [ ] Build `lib/template-engine.ts` (inject content into HTML template)
- [ ] Build `lib/deploy-to-r2.ts` (upload to Cloudflare R2 via S3-compatible API)
- [ ] Build `lib/manage-kv.ts` (register subdomain in Cloudflare KV)
- [ ] Deploy Cloudflare Worker: `website-router.js`
- [ ] Configure DNS: wildcard `*.mubyn.com` → proxied
- [ ] Create Supabase table: `websites`
- [ ] Build API endpoint: `POST /api/website/generate`
- [ ] Build API endpoint: `GET /api/website/:id/status`
- [ ] Build API endpoint: `DELETE /api/website/:id`
- [ ] Add "Website" section to Mubyn Dashboard sidebar
- [ ] Build "Create Website" form UI
- [ ] Build "Website Preview" component
- [ ] Test with 5 different businesses across industries
- [ ] Add "Powered by Mubyn" footer badge

---

## 16. Sample Template Structure (Restaurant)

```html
<!DOCTYPE html>
<html lang="{{language}}" dir="{{direction}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{metaTitle}}</title>
  <meta name="description" content="{{metaDescription}}">
  <meta property="og:title" content="{{metaTitle}}">
  <meta property="og:description" content="{{metaDescription}}">
  <meta property="og:image" content="{{heroImage}}">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '{{primaryColor}}',
            secondary: '{{secondaryColor}}',
            accent: '{{accentColor}}',
          },
          fontFamily: {
            sans: ['{{fontFamily}}', 'sans-serif'],
          }
        }
      }
    }
  </script>
</head>
<body class="bg-secondary text-white font-sans">
  <!-- Navigation -->
  <nav class="fixed top-0 w-full bg-secondary/95 backdrop-blur-sm z-50 border-b border-white/10">
    <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
      <h1 class="text-xl font-bold text-primary">{{businessName}}</h1>
      <div class="hidden md:flex gap-6 text-sm">
        <a href="#about" class="hover:text-primary transition">About</a>
        <a href="#menu" class="hover:text-primary transition">Menu</a>
        <a href="#reviews" class="hover:text-primary transition">Reviews</a>
        <a href="#contact" class="hover:text-primary transition">Contact</a>
      </div>
      <a href="https://wa.me/{{whatsapp}}" class="bg-primary text-secondary px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition">
        Order Now
      </a>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="relative min-h-screen flex items-center justify-center">
    <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('{{heroImage}}')"></div>
    <div class="absolute inset-0 bg-black/60"></div>
    <div class="relative z-10 text-center px-4 max-w-3xl">
      <h2 class="text-5xl md:text-7xl font-bold mb-4">{{heroHeadline}}</h2>
      <p class="text-xl text-gray-300 mb-8">{{heroSubheadline}}</p>
      <a href="#menu" class="bg-primary text-secondary px-8 py-3 rounded-lg text-lg font-semibold hover:opacity-90 transition">
        {{heroCTA}}
      </a>
    </div>
  </section>

  <!-- ... more sections (About, Menu, Reviews, Contact, Footer) ... -->
  
  <!-- Footer -->
  <footer class="bg-secondary border-t border-white/10 py-8">
    <div class="max-w-6xl mx-auto px-4 text-center text-gray-400 text-sm">
      <p>{{footerText}}</p>
      {{#if poweredBy}}
      <p class="mt-2">
        <a href="https://mubyn.com" class="text-primary hover:underline">Powered by Mubyn</a>
      </p>
      {{/if}}
    </div>
  </footer>
</body>
</html>
```

---

## 17. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| GPT-4o generates poor content | Use structured prompts + manual review queue for first 50 sites |
| Template looks generic | Invest in 2-3 premium templates per industry, unique layouts |
| Subdomain SEO is weak | Each site gets proper meta tags, schema.org markup, sitemap |
| Client wants more customization | Phase 2 inline editor, or upsell to custom website tier |
| Cloudflare free tier limits | Paid Workers plan is $5/month for 10M requests — trivial cost |
| Arabic text rendering issues | Test extensively with Arabic content, use proper RTL fonts |

---

## 18. Summary

**The fastest path to an MVP website builder for Mubyn OS:**

1. **GPT-4o generates content** from business data ($0.02/site)
2. **Pre-built Tailwind templates** per industry (10 templates)
3. **Inject content into templates** (simple string replacement)
4. **Deploy to Cloudflare R2** (free object storage)
5. **Route via Cloudflare Worker** with wildcard `*.mubyn.com`
6. **Live website in <60 seconds** at `clientname.mubyn.com`
7. **Cost: ~$0/month** per site (essentially free)

**This is a massive competitive advantage.** No other AI OS platform for SMBs in MENA offers instant website generation bundled into the platform. Combined with Lead Agent, CSA, and Social Media — Mubyn becomes the only tool a small business needs.

---

*"Every Mubyn client gets a website. No exceptions. No excuses."*
