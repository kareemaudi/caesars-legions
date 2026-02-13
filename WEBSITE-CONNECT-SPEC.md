# Mubyn OS — Website Connection Specification

> How Mubyn OS connects to a client's existing website to power CSA (customer support agent widget), analytics, lead capture, and content publishing.

**Date:** 2026-02-11  
**Status:** Research Complete — Ready for Implementation

---

## Table of Contents

1. [Integration Methods Overview (Ranked by Ease)](#1-integration-methods-overview)
2. [Method 1: JavaScript Embed Snippet (Universal)](#2-method-1-javascript-embed-snippet)
3. [Method 2: Platform REST APIs](#3-method-2-platform-rest-apis)
4. [Method 3: MCP (Model Context Protocol) Servers](#4-method-3-mcp-servers)
5. [Method 4: Platform-Specific Plugins/Apps](#5-method-4-platform-specific-plugins)
6. [Platform-by-Platform Guide](#6-platform-by-platform-guide)
7. [Data We Can Pull from Each Platform](#7-data-matrix)
8. [CSA Widget Embedding Guide](#8-csa-widget-embedding)
9. [MVP Recommendation for Demo](#9-mvp-recommendation)
10. [Code Snippets](#10-code-snippets)
11. [Architecture Diagram](#11-architecture)

---

## 1. Integration Methods Overview

| Rank | Method | Complexity | Works On | Setup Time | Data Access |
|------|--------|-----------|----------|------------|-------------|
| 🥇 1 | **JavaScript Embed Snippet** | Trivial | ANY website | 2 minutes | Widget only (CSA chat, lead capture, analytics beacon) |
| 🥈 2 | **Platform REST APIs** | Medium | Shopify, WordPress/WooCommerce, Wix | 30-60 min | Full: products, orders, customers, content |
| 🥉 3 | **MCP Servers** | Medium-High | Shopify (official), WordPress/WooCommerce (official) | 1-2 hours | Full: AI-native access to all store data |
| 4 | **Platform Plugins/Apps** | High (dev effort) | Shopify, WordPress | Days-weeks | Full + deep integration (admin UI, webhooks) |

**Key Insight:** These methods are NOT mutually exclusive. The ideal Mubyn integration uses **Script Tag** (for CSA widget on the storefront) + **API/MCP** (for backend data sync to power CFO, CMO, analytics).

---

## 2. Method 1: JavaScript Embed Snippet (Universal)

### How It Works

This is the same approach used by **Intercom, Crisp, Tidio, Drift, HubSpot, Google Analytics**, and every major SaaS widget. A single `<script>` tag is pasted into the client's website HTML, and our JavaScript bootstraps everything.

### The Pattern

```html
<!-- Mubyn OS Widget -->
<script>
  (function(m,u,b,y,n){
    m['MubynOS']=n;m[n]=m[n]||function(){(m[n].q=m[n].q||[]).push(arguments)};
    var s=u.createElement('script');s.async=1;s.src=b;
    var f=u.getElementsByTagName('script')[0];f.parentNode.insertBefore(s,f);
  })(window,document,'https://widget.mubyn.com/v1/mubyn.js','mubyn');
  
  mubyn('init', 'WORKSPACE_ID_HERE');
</script>
```

### What This Single Script Can Power

| Feature | How |
|---------|-----|
| **CSA Chat Widget** | Floating chat bubble (already built in csa-widget Edge Function) |
| **Lead Capture** | Pop-up forms, exit-intent modals, inline forms |
| **Analytics Beacon** | Page views, visitor sessions, scroll depth, click heatmaps |
| **Content Injection** | Inject recommended content, banners, announcements |
| **A/B Testing** | Inject variant elements for website experiments |
| **Event Tracking** | `mubyn('track', 'purchase', { value: 99.99 })` |

### Why This Is #1

- Works on **ANY** website (Shopify, WordPress, Wix, Squarespace, custom, static HTML)
- No approval process, no app store submission
- Client pastes one line of code — done
- Can be injected via **Google Tag Manager** (zero code for client)
- We already have the CSA widget code (Supabase Edge Function `csa-widget`)

### Existing Implementation (CSA Codebase)

The `csa-widget` Edge Function already generates embed codes:

```html
<script src="https://[SUPABASE_URL]/functions/v1/csa-widget/widget.js?id=WIDGET_ID" async></script>
```

This serves a self-contained IIFE that:
1. Loads widget config from our API
2. Renders a floating chat bubble (customizable colors, position, text)
3. Handles message send/receive via our `csa-ai-chat` function
4. Persists sessions via `localStorage`
5. Sends visitor info (URL, referrer, user agent) with each message

**Status: Already built. Needs polish and branding as Mubyn.**

---

## 3. Method 2: Platform REST APIs

### Shopify Admin API (GraphQL)

**Authentication:** Custom App → Admin API Access Token  
**Base URL:** `https://{store}.myshopify.com/admin/api/2026-01/graphql.json`  
**Header:** `X-Shopify-Access-Token: {token}`

**Available Data:**

| Resource | Endpoint | Permissions Needed |
|----------|----------|-------------------|
| Products | `query { products(first: 50) { nodes { id title priceRange { ... } } } }` | `read_products` |
| Orders | `query { orders(first: 50) { nodes { id totalPrice createdAt lineItems { ... } } } }` | `read_orders` |
| Customers | `query { customers(first: 50) { nodes { id email firstName lastName ordersCount totalSpent } } }` | `read_customers` |
| Inventory | Product variants → `inventoryQuantity` | `read_inventory` |
| Analytics | Built-in reports via ShopifyQL | `read_reports` |
| Store Info | `query { shop { name email currencyCode } }` | Basic access |

**Setup Steps:**
1. Client goes to Shopify Admin → Settings → Apps → Develop apps
2. Create new app → Configure Admin API scopes (read_products, read_orders, read_customers)
3. Install app → Copy Admin API access token
4. Client pastes token in Mubyn dashboard → We store encrypted → Start syncing

### WordPress REST API

**Authentication:** Application Passwords (built into WordPress 5.6+) or OAuth  
**Base URL:** `https://{site}/wp-json/wp/v2/`

**Available Data:**

| Resource | Endpoint | Auth Required |
|----------|----------|--------------|
| Posts | `GET /wp-json/wp/v2/posts` | No (public) / Yes (drafts) |
| Pages | `GET /wp-json/wp/v2/pages` | No (public) / Yes (drafts) |
| Media | `GET /wp-json/wp/v2/media` | No (public) |
| Users | `GET /wp-json/wp/v2/users` | Yes |
| Comments | `GET /wp-json/wp/v2/comments` | Partial |
| Categories/Tags | `GET /wp-json/wp/v2/categories` | No |
| Custom Post Types | `GET /wp-json/wp/v2/{type}` | Depends |

**WooCommerce REST API (if installed):**

| Resource | Endpoint | Auth |
|----------|----------|------|
| Products | `GET /wp-json/wc/v3/products` | Consumer Key/Secret |
| Orders | `GET /wp-json/wc/v3/orders` | Consumer Key/Secret |
| Customers | `GET /wp-json/wc/v3/customers` | Consumer Key/Secret |
| Reports | `GET /wp-json/wc/v3/reports/sales` | Consumer Key/Secret |
| Coupons | `GET /wp-json/wc/v3/coupons` | Consumer Key/Secret |

**Setup Steps:**
1. Client goes to WordPress Admin → Users → Profile → Application Passwords
2. Generate new password for "Mubyn OS"
3. Client pastes URL + username + app password in Mubyn dashboard
4. For WooCommerce: Settings → Advanced → REST API → Add Key (Read permissions)

### Wix APIs

**Authentication:** API Key or OAuth 2.0 via Wix Dev Center  
**Options:**

| Method | Use Case |
|--------|----------|
| **Wix REST API** | External backend access to Wix data (stores, bookings, contacts) |
| **Wix Velo (backend)** | Server-side code running ON the Wix site (wix-fetch, wix-http-functions) |
| **Wix App Market** | Full app integration (requires Wix app submission) |

**Available via Wix REST API:**
- Wix Stores: Products, Orders, Inventory, Carts
- Wix Contacts: CRM data
- Wix Bookings: Services, sessions
- Wix Blog: Posts, categories
- Wix Members: Site members

**Widget Embedding on Wix:**
- Wix Editor → Embed → Custom Element or Embed HTML
- Paste our `<script>` tag in HTML embed block
- Works site-wide or per-page

---

## 4. Method 3: MCP (Model Context Protocol) Servers

### What is MCP?

MCP is an open standard (created by Anthropic, late 2024) that standardizes how AI models connect to external data. Think of it as "USB for LLMs" — a universal plug for AI to access any system.

### Why MCP Matters for Mubyn

Mubyn OS is AI-first. Instead of writing custom API adapters for each platform, we can use MCP servers to let our AI agents (Caesar, CSA, CMO, CFO) natively interact with client data through a standardized protocol.

### Available MCP Servers

#### Shopify MCP (Official + Community)

**1. Shopify Storefront MCP (Official)**
- **URL:** https://shopify.dev/docs/apps/build/storefront-mcp
- **Capabilities:** Product discovery, cart management, order tracking, store info
- **Use case:** Customer-facing AI shopping experiences
- **Architecture:** MCP Client (our app) ↔ MCP Server (Shopify) ↔ Store Data

**2. shopify-mcp (Community — GeLi2001)**
- **URL:** https://github.com/GeLi2001/shopify-mcp
- **Install:** `npx shopify-mcp --accessToken TOKEN --domain store.myshopify.com`
- **Capabilities:** Full Admin API access — products (CRUD), customers (CRUD), orders (read/filter), collections, discounts
- **Tools exposed:** `get-products`, `get-customers`, `get-orders`, `createProduct`, `update-customer`, `manage-collections`, `manage-discounts`
- **Ready to use with Claude/Cursor/any MCP client**

**3. ShopifyMockMCP (for testing)**
- **URL:** https://github.com/ramakay/ShopifyMockMCP
- **Uses mock.shop for testing without real store**

#### WordPress / WooCommerce MCP

**1. WordPress MCP Adapter (Official — WordPress Core)**
- **URL:** https://github.com/WordPress/mcp-adapter
- **Status:** Active development, HTTP + STDIO transports
- **Capabilities:** Bridges WordPress Abilities API to MCP
- **Multi-server management, custom transport support**

**2. MCP for WordPress (Community — CloudFest 2025)**
- **URL:** https://mcp-wp.github.io/docs
- **Capabilities:** WordPress → MCP Server (posts, pages, media, config)
- **Integrates with WP-CLI for developer workflows**

**3. WooCommerce MCP (Official — Developer Preview)**
- **URL:** https://developer.woocommerce.com/docs/features/mcp
- **Status:** Developer Preview (may change)
- **Architecture:**
  ```
  AI Client (Mubyn) → MCP Protocol → Local MCP Proxy → HTTP → WordPress MCP Server → WooCommerce
  ```
- **Available Tools:**
  - Product Management: List, Create, Update, Delete
  - Order Management: List, Create, Update
- **Authentication:** WooCommerce REST API keys
- **Endpoint:** `/wp-json/woocommerce/mcp`

### MCP Integration Strategy for Mubyn

```
┌─────────────────────────────────────────────┐
│                 Mubyn OS                     │
│                                             │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌──────────┐  │
│  │ CSA │  │ CFO │  │ CMO │  │ Lead Gen │  │
│  └──┬──┘  └──┬──┘  └──┬──┘  └────┬─────┘  │
│     │        │        │           │         │
│  ┌──▼────────▼────────▼───────────▼──────┐  │
│  │        Mubyn MCP Client Layer         │  │
│  └──┬────────┬────────┬──────────────────┘  │
│     │        │        │                     │
└─────┼────────┼────────┼─────────────────────┘
      │        │        │
  ┌───▼──┐ ┌──▼───┐ ┌──▼───┐
  │Shopify│ │WooCom│ │ Wix  │
  │  MCP  │ │  MCP │ │ API  │
  └──────┘ └──────┘ └──────┘
```

---

## 5. Method 4: Platform-Specific Plugins/Apps

### Shopify App (Theme App Extension)

**The Shopify Way to embed widgets:**
1. Create a Shopify Partner App
2. Build a Theme App Extension with an "App Embed Block"
3. Client enables the embed from Online Store → Themes → Customize → App Embeds
4. Widget loads on every storefront page

**Pros:** Official, discoverable in Shopify App Store, deep integration  
**Cons:** Requires Shopify Partner account, app review process, weeks of dev  
**Verdict:** Phase 2. Use script tag for MVP.

### WordPress Plugin

**Approach:**
1. Create a WordPress plugin (`mubyn-os-connect`)
2. Plugin adds our `<script>` tag to `wp_footer`
3. Plugin provides a settings page for Workspace ID
4. Plugin registers REST API endpoints for two-way sync
5. Plugin can hook into WooCommerce for order/product webhooks

**Plugin structure:**
```php
<?php
/*
Plugin Name: Mubyn OS
Description: Connect your WordPress/WooCommerce store to Mubyn OS
Version: 1.0.0
*/

// Inject CSA widget on frontend
add_action('wp_footer', function() {
    $workspace_id = get_option('mubyn_workspace_id');
    if ($workspace_id) {
        echo '<script src="https://widget.mubyn.com/v1/mubyn.js?id=' . esc_attr($workspace_id) . '" async></script>';
    }
});

// Settings page
add_action('admin_menu', function() {
    add_options_page('Mubyn OS', 'Mubyn OS', 'manage_options', 'mubyn-os', 'mubyn_settings_page');
});
```

**Pros:** Familiar for WP users, settings in admin, auto-updates  
**Cons:** Need to maintain, submit to wordpress.org  
**Verdict:** Phase 2. Script tag for MVP.

---

## 6. Platform-by-Platform Guide

### Shopify — Full Connection Guide

| Step | Action | Time |
|------|--------|------|
| **1. CSA Widget** | Client pastes `<script>` tag in Online Store → Themes → Edit Code → `theme.liquid` before `</body>` | 2 min |
| **2. Alt: Theme Settings** | Or use Online Store → Themes → Customize → Add Section → Custom Liquid → paste script | 2 min |
| **3. Alt: GTM** | Or inject via Google Tag Manager (Custom HTML tag, All Pages trigger) | 5 min |
| **4. API Access** | Create Custom App in Settings → Apps → Develop apps → grant read scopes → copy token | 10 min |
| **5. Mubyn Config** | Paste Shopify token + store domain in Mubyn dashboard | 2 min |
| **6. MCP (optional)** | Configure `shopify-mcp` server with token for AI-native access | 15 min |

**Data available:** Products, variants, prices, inventory, orders, customers, analytics, store info, shipping, payments

### WordPress / WooCommerce — Full Connection Guide

| Step | Action | Time |
|------|--------|------|
| **1. CSA Widget** | Install via plugin (coming) OR paste `<script>` in Appearance → Theme Editor → footer.php before `</body>` | 2 min |
| **2. Alt: Header/Footer plugin** | Use "Insert Headers and Footers" plugin → paste in Footer Scripts | 3 min |
| **3. WP REST API** | Generate Application Password in Users → Profile → Application Passwords | 5 min |
| **4. WooCommerce API** | WooCommerce → Settings → Advanced → REST API → Add Key (Read) | 5 min |
| **5. Mubyn Config** | Paste site URL + credentials in Mubyn dashboard | 2 min |
| **6. MCP (optional)** | Install WordPress MCP Adapter plugin + configure | 20 min |

**Data available:** Posts, pages, media, comments, users, products (Woo), orders (Woo), customers (Woo), sales reports (Woo)

### Wix — Full Connection Guide

| Step | Action | Time |
|------|--------|------|
| **1. CSA Widget** | Wix Editor → Add (+) → Embed → Custom Embeds → Embed HTML → paste `<script>` tag | 3 min |
| **2. Site-wide** | Settings → Custom Code → Add Code → paste `<script>` → Apply to "All Pages" → Load in "Body - end" | 3 min |
| **3. Wix REST API** | Create app in Wix Dev Center → generate API Key | 15 min |
| **4. Velo backend** | For server-side: use `wix-fetch` in Velo backend to call Mubyn APIs | 30 min |

**Data available:** Products (Wix Stores), orders, contacts, blog posts, bookings, members

### Squarespace — Full Connection Guide

| Step | Action | Time |
|------|--------|------|
| **1. CSA Widget** | Settings → Advanced → Code Injection → Footer → paste `<script>` | 2 min |
| **2. Per-page** | Page Settings → Advanced → Page Header Code Injection | 2 min |
| **3. API** | Limited — no public REST API for store data. Use Commerce APIs (limited) | N/A |

**Data available:** Limited. Squarespace has very restricted API access. Best strategy: widget-only integration + ask client to export data manually or use Zapier.

### Custom Website (any HTML/JS site)

| Step | Action | Time |
|------|--------|------|
| **1. CSA Widget** | Paste `<script>` tag before `</body>` in any HTML page | 1 min |
| **2. GTM** | Add Google Tag Manager → Custom HTML tag with our script | 5 min |
| **3. API** | Client builds webhook endpoints or uses our API to push data | Varies |

---

## 7. Data We Can Pull from Each Platform

| Data Type | Shopify | WordPress | WooCommerce | Wix | Squarespace | Custom |
|-----------|---------|-----------|-------------|-----|-------------|--------|
| **Products** | ✅ Full (GraphQL Admin API) | N/A | ✅ Full (REST) | ✅ (REST) | ❌ Limited | Via webhook |
| **Orders** | ✅ Full | N/A | ✅ Full (REST) | ✅ (REST) | ❌ Limited | Via webhook |
| **Customers** | ✅ Full | ✅ Users (REST) | ✅ Full (REST) | ✅ Contacts (REST) | ❌ | Via webhook |
| **Content (Posts/Pages)** | ✅ Blog (REST) | ✅ Full (REST) | ✅ Full (REST) | ✅ Blog (REST) | ❌ | Via webhook |
| **Analytics** | ✅ ShopifyQL | ✅ Via plugins | ✅ Reports API | ✅ Wix Analytics API | ❌ | GA4 API |
| **Inventory** | ✅ Full | N/A | ✅ Full | ✅ (REST) | ❌ | Via webhook |
| **Visitor Data** | ✅ Via our widget | ✅ Via our widget | ✅ Via our widget | ✅ Via our widget | ✅ Via our widget | ✅ Via our widget |
| **Chat Conversations** | ✅ Via CSA | ✅ Via CSA | ✅ Via CSA | ✅ Via CSA | ✅ Via CSA | ✅ Via CSA |

**Key insight:** Our JavaScript widget gives us visitor data + chat on EVERY platform. API/MCP gives us the business data (products, orders, customers) on supported platforms.

---

## 8. CSA Widget Embedding Guide

### Current Implementation (Already Built)

The CSA codebase (`mubyn-csa/csa-main`) already has a complete widget system:

**Edge Function:** `supabase/functions/csa-widget/index.ts`  
**Actions:**
- `generate` — Create widget for an account (returns embed code)
- `config` — Get widget config (public, called by widget.js)
- `update` — Update widget config (colors, text, position)
- `message` — Handle chat messages (routes to `csa-ai-chat`)

**Widget Features (already built):**
- ✅ Floating chat bubble (configurable color + position)
- ✅ Chat panel with header, messages, input
- ✅ AI-powered responses via `csa-ai-chat` Edge Function
- ✅ Session persistence (localStorage)
- ✅ Visitor info tracking (URL, referrer, user agent)
- ✅ Customizable: primary color, position, welcome message, button text, header title
- ✅ CORS enabled (works on any domain)

**What Needs to Happen for MVP:**
1. Rebrand: `csa-widget` → `mubyn-widget` or serve from `widget.mubyn.com`
2. Add analytics beacon to the same script (page views, events)
3. Add lead capture form (email/phone collection before chat)
4. Add Mubyn branding (small "Powered by Mubyn" in widget)
5. Build a Mubyn dashboard page where client sees their embed code

### Embed Code Flow

```
Client's Website                    Mubyn Backend (Supabase)
┌──────────────┐                   ┌──────────────────────┐
│  <script>    │──── Loads ──────►│  csa-widget/widget.js │
│  (1 line)    │                   │  (Edge Function)      │
└──────────────┘                   └──────────┬───────────┘
       │                                      │
       │  ◄── Returns JS (IIFE) ──────────────┘
       │
       ▼
┌──────────────┐    POST /config   ┌──────────────────────┐
│  Widget IIFE │──────────────────►│  Get widget config    │
│  loads config│                   │  (colors, text)       │
└──────┬───────┘                   └──────────────────────┘
       │
       ▼
┌──────────────┐    POST /message  ┌──────────────────────┐
│  Chat UI     │──────────────────►│  csa-ai-chat          │
│  rendered    │◄──────────────────│  (AI response)        │
└──────────────┘                   └──────────────────────┘
```

---

## 9. MVP Recommendation for Demo

### 🎯 MVP: Script Tag Embed Only

**For the demo, we use the simplest possible approach:**

1. **What client does:**  
   - Sign up for Mubyn OS
   - Go to "Connect Website" in dashboard
   - Copy the one-line `<script>` tag
   - Paste it into their website (any platform)

2. **What happens immediately:**
   - CSA chat widget appears on their site
   - Visitors can chat → AI responds using client's knowledge base
   - Visitor analytics start flowing to Mubyn dashboard
   - Lead capture form collects emails before chat

3. **What we show in the demo:**
   - Website with Mubyn widget → live AI chat
   - Mubyn dashboard showing conversations, analytics, leads
   - "It works on Shopify, WordPress, Wix, or any custom site"

### Phase 2 (Post-Demo): API Connections

After the script tag works:
- Add "Connect Shopify" button → OAuth flow → pulls products/orders → powers CFO agent
- Add "Connect WordPress" button → API key form → pulls content/products
- MCP servers for AI-native data access

### Phase 3: Platform Plugins

- Shopify App (Theme App Extension) → listed on Shopify App Store
- WordPress Plugin → listed on wordpress.org
- Wix App → listed on Wix App Market

---

## 10. Code Snippets

### Universal Embed (Production-Ready Pattern)

```html
<!-- Mubyn OS — Paste this before </body> -->
<script>
  (function(m,u,b,y,n){
    m['MubynOS']=n;
    m[n]=m[n]||function(){(m[n].q=m[n].q||[]).push(arguments)};
    m[n].l=+new Date;
    var s=u.createElement('script');
    s.async=1;
    s.src=b;
    s.dataset.workspace=y;
    var f=u.getElementsByTagName('script')[0];
    f.parentNode.insertBefore(s,f);
  })(window,document,'https://widget.mubyn.com/v1/mubyn.js','WORKSPACE_ID','mubyn');
</script>
```

### Analytics Event Tracking (Client-Side API)

```javascript
// Track a custom event
mubyn('track', 'product_viewed', { 
  product_id: '123', 
  product_name: 'Widget Pro',
  price: 29.99 
});

// Track a purchase
mubyn('track', 'purchase', { 
  order_id: 'ORD-456', 
  total: 149.99, 
  currency: 'USD' 
});

// Identify a visitor (for lead capture)
mubyn('identify', { 
  email: 'john@example.com', 
  name: 'John Doe' 
});

// Open the chat widget programmatically
mubyn('chat', 'open');
mubyn('chat', 'close');
mubyn('chat', 'message', 'How can I return my order?');
```

### Google Tag Manager Injection

```html
<!-- In GTM: New Tag → Custom HTML → All Pages trigger -->
<script>
  (function(m,u,b,y,n){
    m['MubynOS']=n;
    m[n]=m[n]||function(){(m[n].q=m[n].q||[]).push(arguments)};
    m[n].l=+new Date;
    var s=u.createElement('script');
    s.async=1;
    s.src=b;
    s.dataset.workspace=y;
    var f=u.getElementsByTagName('script')[0];
    f.parentNode.insertBefore(s,f);
  })(window,document,'https://widget.mubyn.com/v1/mubyn.js','WORKSPACE_ID','mubyn');
</script>
```

### Shopify API Connection (Server-Side)

```typescript
// Mubyn backend: Shopify sync service
async function syncShopifyData(storeUrl: string, accessToken: string) {
  const response = await fetch(`https://${storeUrl}/admin/api/2026-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: `{
        products(first: 50) {
          nodes {
            id title description
            priceRangeV2 { maxVariantPrice { amount currencyCode } }
            totalInventory
            status
          }
        }
        orders(first: 50, sortKey: CREATED_AT, reverse: true) {
          nodes {
            id name createdAt
            totalPriceSet { shopMoney { amount currencyCode } }
            displayFinancialStatus
            customer { firstName lastName email }
          }
        }
      }`
    })
  });
  
  const { data } = await response.json();
  // Store in Mubyn database for CFO/CMO agents to use
  return data;
}
```

### WordPress API Connection (Server-Side)

```typescript
// Mubyn backend: WordPress sync service
async function syncWordPressData(siteUrl: string, username: string, appPassword: string) {
  const auth = btoa(`${username}:${appPassword}`);
  
  // Fetch posts
  const posts = await fetch(`${siteUrl}/wp-json/wp/v2/posts?per_page=50`, {
    headers: { 'Authorization': `Basic ${auth}` }
  }).then(r => r.json());
  
  // Fetch WooCommerce products (if available)
  const products = await fetch(`${siteUrl}/wp-json/wc/v3/products?per_page=50`, {
    headers: { 'Authorization': `Basic ${auth}` }
  }).then(r => r.json()).catch(() => []);
  
  // Fetch WooCommerce orders
  const orders = await fetch(`${siteUrl}/wp-json/wc/v3/orders?per_page=50`, {
    headers: { 'Authorization': `Basic ${auth}` }
  }).then(r => r.json()).catch(() => []);
  
  return { posts, products, orders };
}
```

### MCP Server Configuration (for Mubyn's AI Agents)

```json
{
  "mcpServers": {
    "shopify": {
      "command": "npx",
      "args": [
        "shopify-mcp",
        "--accessToken", "${SHOPIFY_ACCESS_TOKEN}",
        "--domain", "${SHOPIFY_DOMAIN}"
      ]
    },
    "woocommerce": {
      "command": "npx", 
      "args": [
        "mcp-wordpress-remote",
        "--url", "${WP_SITE_URL}/wp-json/woocommerce/mcp",
        "--auth", "${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}"
      ]
    }
  }
}
```

---

## 11. Architecture

### Full Integration Architecture

```
                          ┌──────────────────────────────────────┐
                          │           MUBYN OS DASHBOARD          │
                          │                                      │
                          │  ┌────────┐ ┌─────┐ ┌─────┐ ┌────┐ │
                          │  │  CSA   │ │ CFO │ │ CMO │ │Lead│ │
                          │  │ Agent  │ │Agent│ │Agent│ │ Gen│ │
                          │  └───┬────┘ └──┬──┘ └──┬──┘ └──┬─┘ │
                          │      │         │       │       │    │
                          │  ┌───▼─────────▼───────▼───────▼──┐ │
                          │  │      Unified Data Layer         │ │
                          │  │  (Supabase + MCP Client Layer)  │ │
                          │  └───┬──────┬──────┬──────┬───────┘ │
                          └──────┼──────┼──────┼──────┼─────────┘
                                 │      │      │      │
                    ┌────────────┤      │      │      ├────────────┐
                    │            │      │      │      │            │
              ┌─────▼─────┐ ┌───▼──┐ ┌─▼────┐ ┌▼─────▼──┐ ┌──────▼──────┐
              │  Script   │ │Shopify│ │ WP/  │ │  Wix   │ │  Custom    │
              │  Tag      │ │ Admin │ │ Woo  │ │  REST  │ │  Webhooks  │
              │  Widget   │ │  API  │ │ API  │ │  API   │ │            │
              └─────┬─────┘ └───┬──┘ └──┬───┘ └──┬────┘ └──────┬────┘
                    │           │       │        │              │
            ┌───────▼───────────▼───────▼────────▼──────────────▼───┐
            │                   CLIENT WEBSITES                     │
            │                                                       │
            │   Shopify    WordPress    Wix    Squarespace   Custom │
            └───────────────────────────────────────────────────────┘
```

### Widget Loading Sequence

```
1. Page loads → <script> tag starts downloading mubyn.js (async, non-blocking)
2. mubyn.js executes → reads workspace ID from data attribute
3. Fetch /api/widget/config?workspace=WORKSPACE_ID → get colors, text, features
4. Render floating button (CSS injected, scoped to avoid conflicts)
5. Start analytics beacon (page view event sent)
6. User clicks button → Chat panel opens → Welcome message shown
7. User types → POST /api/widget/message → AI processes → Response streamed back
8. All events logged → Available in Mubyn dashboard in real-time
```

---

## Summary

| What | Approach | Status |
|------|----------|--------|
| **CSA Widget on any site** | JavaScript embed (`<script>` tag) | ✅ Already built (needs Mubyn branding) |
| **Visitor Analytics** | Same `<script>` — add beacon | 🔨 Needs building |
| **Lead Capture** | Same `<script>` — add form | 🔨 Needs building |
| **Shopify Data Sync** | Admin API (GraphQL) + MCP | 📋 Spec complete, ready to build |
| **WordPress Data Sync** | WP REST API + WooCommerce API + MCP | 📋 Spec complete, ready to build |
| **Wix Data Sync** | Wix REST API | 📋 Spec complete, ready to build |
| **Squarespace** | Widget only (no API) | ⚠️ Limited |
| **Custom Sites** | Widget + custom webhooks | 📋 Flexible approach |

**Bottom line for MVP demo:** One `<script>` tag. Works everywhere. Powers CSA chat + analytics + lead capture. Already 80% built.
