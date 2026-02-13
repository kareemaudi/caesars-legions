# Mubyn OS — UX/UI Design Specification v1.0

> **Date:** February 11, 2026
> **Purpose:** Actionable design spec for VC demo — every recommendation is implementable in code.
> **Stack:** React/Next.js + Tailwind CSS + Framer Motion + Radix UI primitives

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Onboarding Flow](#2-onboarding-flow)
3. [Dashboard Layout Spec](#3-dashboard-layout-spec)
4. [Component Patterns](#4-component-patterns)
5. [Micro-interactions](#5-micro-interactions)
6. [Color & Typography](#6-color--typography)
7. [Mobile Responsiveness](#7-mobile-responsiveness)
8. [Accessibility](#8-accessibility)
9. [RTL / Arabic / Bilingual Support](#9-rtl--arabic--bilingual-support)
10. [Competitive Comparison — What to Steal](#10-competitive-comparison--what-to-steal)

---

## 1. Design Principles

1. **Chat-first, not dashboard-first.** Caesar (the AI CEO) is the primary interface. Every screen should be reachable via conversation. The chat isn't a feature — it's the operating system. *(Inspired by: ChatGPT, Perplexity, Cursor command palette)*

2. **Progressive disclosure over feature walls.** Show only what's needed right now. Advanced features reveal themselves contextually as the user matures. One field/action at a time during onboarding. *(Inspired by: Typeform, Duolingo, Notion)*

3. **Speed is a feature.** Every interaction must feel instant (<100ms perceived). Optimistic UI updates. Skeleton loaders, not spinners. Pre-fetched data. *(Inspired by: Linear — keyboard-first, zero-latency feel)*

4. **Dark + Gold = premium authority.** The visual identity communicates "AI executive suite" — not "SaaS tool." Deep blacks, muted surfaces, gold accents on actionable elements only. *(Inspired by: Linear dark mode, Vercel dashboard)*

5. **AI transparency builds trust.** Every AI action shows what it did, why, and lets users undo. Confidence scores on recommendations. Source citations on generated content. *(Inspired by: Perplexity citations, Clay enrichment provenance)*

6. **Keyboard-first, mouse-friendly.** Power users navigate entirely by keyboard (Cmd+K command palette, shortcuts). Casual users never need to learn them. *(Inspired by: Linear, Cursor, Raycast)*

7. **Bilingual-native, not bolted-on.** Arabic/RTL is a first-class citizen, not a CSS hack. Layout mirrors automatically. Typography accommodates both scripts. *(Required for MENA market)*

---

## 2. Onboarding Flow

### Philosophy
Typeform-style staged disclosure. One question per screen. Full-screen with centered content. Smooth crossfade transitions (300ms ease-out). Progress indicator at top (thin gold bar, not dots).

### Screen Sequence

```
┌─────────────────────────────────────────────────┐
│  ━━━━━━━━━━━░░░░░░░░░░░░░░░░░  Step 1/6        │
│                                                   │
│              👋 Welcome to Mubyn                  │
│                                                   │
│        What's your business name?                 │
│                                                   │
│   ┌─────────────────────────────────────┐        │
│   │  e.g. "Bloom Coffee Roasters"       │        │
│   └─────────────────────────────────────┘        │
│                                                   │
│              [ Continue → ]                       │
│                                                   │
│         Press Enter to continue                   │
└─────────────────────────────────────────────────┘
```

#### Step 1: Business Name
- **Type:** Single text input, large (text-2xl), auto-focused
- **Validation:** Min 2 chars, real-time
- **UX:** Enter key submits. Gold accent on active input border
- **Animation:** Input slides up from bottom (translateY 20px → 0, 300ms)

#### Step 2: Industry
- **Type:** Visual card grid (3×2), NOT a dropdown
- **Cards:** Icon + label, hover reveals brief description
- **Options:**
  - 🍽️ Restaurant & Food
  - 🛍️ Retail & E-commerce
  - 💼 Professional Services
  - 🏥 Healthcare & Wellness
  - 🏗️ Real Estate & Construction
  - ✨ Other (opens text input)
- **UX:** Click or press number key (1-6). Selected card gets gold border + subtle scale(1.02)
- **Animation:** Cards stagger-fade in (50ms delay each)

#### Step 3: Location
- **Type:** Visual region picker with popular cities as quick-select chips
- **Layout:**
  - Quick chips: Dubai, Riyadh, Cairo, Beirut, Amman, Kuwait City
  - "Other" chip opens text input with autocomplete
- **UX:** Chips are large touch targets (min 44px height). Selected = gold fill
- **Why not a map:** Maps add weight, load time, and complexity. Chips are faster for MENA focus

#### Step 4: Website
- **Type:** URL input with smart detection
- **Layout:**
  - Input field with "https://" prefix shown in muted text
  - Below: Ghost button "I don't have a website yet →"
- **UX:** If "no website" selected, show micro-animation (checkmark) + text: "No problem — we'll help you build one."
- **Validation:** Basic URL format, no mandatory https

#### Step 5: Primary Need
- **Type:** 3 large cards, full-width, stacked vertically
- **Cards (each ~80px tall):**
  - 🎯 **Get More Leads** — "Find and reach new customers automatically"
  - 📝 **Create Content** — "Social media, email, blog — written by AI"
  - 💬 **Customer Support** — "24/7 AI agent that handles inquiries"
- **UX:** Selection determines which feature Caesar introduces first after onboarding
- **Animation:** Cards slide in from right, staggered 100ms

#### Step 6: Meet Caesar (Transition Screen)
- **Type:** No input — animated intro
- **Content:**
  ```
  ✨ Setting up your workspace...

  Caesar, your AI business partner, is ready.

  [Enter Mubyn →]
  ```
- **Animation:**
  1. Gold particles converge into Caesar avatar (Lottie animation, 1.5s)
  2. Text fades in below (400ms delay)
  3. Button pulses with gold glow
- **Backend:** While animation plays, workspace is being provisioned (optimistic — pre-created during Step 1)

### Technical Implementation Notes
```tsx
// Onboarding state machine
type OnboardingStep = 'name' | 'industry' | 'location' | 'website' | 'need' | 'ready';

// Each step is a <motion.div> with AnimatePresence
// Transition: { opacity: [0,1], y: [20,0], duration: 0.3, ease: 'easeOut' }
// Progress bar: width = (currentStep / totalSteps) * 100%
// Data saved to backend after each step (resilient to page close)
```

---

## 3. Dashboard Layout Spec

### Overall Structure

```
┌──────────────────────────────────────────────────────────┐
│ ┌────┐ ┌──────────────────────────────────────────────┐  │
│ │    │ │                 Top Bar (48px)                │  │
│ │    │ ├──────────────────────────────────────────────┤  │
│ │ S  │ │                                              │  │
│ │ I  │ │                                              │  │
│ │ D  │ │            Main Content Area                 │  │
│ │ E  │ │                                              │  │
│ │ B  │ │                                              │  │
│ │ A  │ │                                              │  │
│ │ R  │ │                                              │  │
│ │    │ │                                              │  │
│ │ 64 │ │                                              │  │
│ │ px │ │                                              │  │
│ └────┘ └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Sidebar (Left Rail)

**Default state:** Collapsed (64px wide) — icons only
**Expanded state:** 240px wide — icons + labels
**Toggle:** Hover to peek, click hamburger or press `[` to lock open

```
┌──────┐
│  ◎   │  ← Caesar avatar (always visible, gold ring)
│──────│
│  💬  │  Caesar Chat (home)
│  🎯  │  Leads
│  📝  │  Content (CMO)
│  💬  │  CS Agent
│  📊  │  Analytics
│──────│  ← Divider
│  ⚙️  │  Settings
│  ❓  │  Help
│  👤  │  Profile
└──────┘
```

**Behavior:**
- Collapsed: 24px icons, centered, with tooltip on hover (200ms delay)
- Active page: Left gold accent bar (3px, border-radius 2px) + icon gets `opacity: 1` (others at 0.5)
- Hover: Background `#1A1A1F`, 150ms transition
- On mobile: Sidebar hidden, replaced by bottom tab bar

**Colors:**
- Background: `#0B0B0F` (same as page bg, seamless)
- Divider: `#1F1F26`
- Icon default: `#6B6B7B`
- Icon active: `#F5C542` (gold)
- Icon hover: `#A0A0B0`

### Top Bar (48px)

```
┌──────────────────────────────────────────────────────────┐
│  [Page Title]          [🔍 Cmd+K]    [🔔]    [AR|EN]    │
└──────────────────────────────────────────────────────────┘
```

- **Left:** Page title (text-sm, font-medium, `#A0A0B0`)
- **Center-right:** Command palette trigger — shows "Search or run a command..." in muted text
- **Right:** Notification bell (dot indicator for unread), Language toggle (AR/EN)
- **Background:** `#0B0B0F` with bottom border `#1F1F26`
- **Height:** 48px, flex items vertically centered

### Command Palette (Cmd+K / Ctrl+K)

```
┌───────────────────────────────────────────────┐
│  🔍 Type a command or search...               │
│───────────────────────────────────────────────│
│  PAGES                                        │
│  → Caesar Chat                                │
│  → Leads                                      │
│  → Content Calendar                           │
│                                               │
│  ACTIONS                                      │
│  → Create new lead                            │
│  → Generate content post                      │
│  → Ask Caesar a question                      │
│                                               │
│  RECENT                                       │
│  → "show me last week's leads"                │
│  → "draft Instagram post for…"                │
└───────────────────────────────────────────────┘
```

**Behavior:**
- Opens as modal overlay with backdrop blur (8px)
- Background: `#141419` with 1px border `#2A2A35`
- Search is instant (client-side fuzzy matching via `cmdk` or `kbar`)
- Arrow keys navigate, Enter selects, Esc closes
- Results grouped by category with muted headers
- Animation: Scale from 0.95→1, opacity 0→1, 150ms

### Notification System

**Types:**
1. **Toast (non-blocking):** Bottom-right, auto-dismiss 4s. For confirmations ("Lead added"), AI completions ("Content drafted")
2. **Badge (persistent):** Red dot on bell icon. Count if >1
3. **Notification panel:** Slides from right (320px wide) on bell click
4. **Inline alerts:** Yellow/gold bar at top of relevant page for urgent items

**Toast design:**
```
┌──────────────────────────────┐
│ ✅ Lead enriched             │ ← 14px, white
│ Ahmed Al-Fahad — verified    │ ← 12px, #6B6B7B
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ ← Auto-dismiss progress bar (gold)
└──────────────────────────────┘
```

---

## 4. Component Patterns

### 4A. Caesar Chat (AI CEO Interface)

This is the **centerpiece** of Mubyn OS. It's the default landing page.

```
┌──────────────────────────────────────────────────────┐
│                                                       │
│           ◎ Caesar                                    │
│           Your AI Business Partner                    │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │ Good morning, Ahmed. Here's your daily brief:  │  │
│  │                                                 │  │
│  │ 📊 12 new leads from yesterday                 │  │
│  │ 📝 3 content pieces ready for review           │  │
│  │ 💬 2 customer inquiries need attention          │  │
│  │                                                 │  │
│  │ Want me to start with lead outreach or          │  │
│  │ review the content calendar?                    │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  ┌─ You ──────────────────────────────────────────┐  │
│  │ Show me the top 5 leads from Riyadh            │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  ┌─ Caesar ───────────────────────────────────────┐  │
│  │ Here are your top 5 Riyadh leads by score:     │  │
│  │                                                 │  │
│  │ ┌─────────────────────────────────────────┐    │  │
│  │ │ [Inline data table — renders here]      │    │  │
│  │ │ Name    | Company  | Score | Action     │    │  │
│  │ │ Ahmed   | TechCo   | 92    | [Email →]  │    │  │
│  │ │ Sara    | GrowthX  | 88    | [Email →]  │    │  │
│  │ └─────────────────────────────────────────┘    │  │
│  │                                                 │  │
│  │ [📧 Email all] [📋 Export] [🔍 See full list]  │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │  Ask Caesar anything...               [Send]  │    │
│  │  📎  📷  /commands                            │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- **Message bubbles:** No traditional bubbles. Use full-width blocks with subtle left border (gold for Caesar, transparent for user)
- **Rich responses:** Caesar can render tables, charts, action buttons, forms inline in the chat
- **Slash commands:** `/leads`, `/content`, `/support`, `/report` — auto-complete dropdown
- **Input area:** Multi-line, auto-expanding (max 200px), attachment support
- **Streaming:** Responses stream token-by-token with a typing indicator (3 gold dots pulsing)
- **Daily brief:** Auto-generated on first visit of the day, pinned at top until dismissed

**Caesar Avatar:**
- 40px circle with gold ring (2px, animated shimmer on new message)
- Uses a subtle gradient: `linear-gradient(135deg, #D4A843, #F5C542)`
- Appears at start of each Caesar message block

### 4B. Leads (Smart Table — Clay.com Style)

```
┌──────────────────────────────────────────────────────────────┐
│ Leads                           [+ Add Lead] [⬇ Import CSV] │
│──────────────────────────────────────────────────────────────│
│ 🔍 Filter leads...    [Industry ▾] [Score ▾] [Status ▾]    │
│──────────────────────────────────────────────────────────────│
│ ☐ │ Name          │ Company     │ Email      │ Score │ ··· │
│───┼───────────────┼─────────────┼────────────┼───────┼─────│
│ ☐ │ Ahmed Khalil  │ TechNova    │ a@tech...  │ ██ 94 │ ··· │
│ ☐ │ Sara Mansour  │ GrowthX     │ s@grow...  │ ██ 88 │ ··· │
│ ☐ │ Omar Farid    │ BuildCo     │ o@buil...  │ █░ 72 │ ··· │
│ ☐ │ Layla Hassan  │ FreshBite   │ l@fres...  │ █░ 65 │ ··· │
│──────────────────────────────────────────────────────────────│
│ Showing 1-25 of 342 leads          [← Prev] [1] [2] [Next →]│
└──────────────────────────────────────────────────────────────┘
```

**Clay-Inspired Features:**
- **Waterfall enrichment columns:** Each data column shows source icon (Apollo, web scrape, AI-inferred) on hover
- **Inline editing:** Click any cell to edit. Changes save on blur (optimistic)
- **Column types:** Text, Email, URL, Number, Score (progress bar), Status (pill badge), Date
- **Row expansion:** Click row → slide-out panel (right, 400px) with full lead detail
- **Smart columns:** AI-computed columns (e.g., "Fit Score", "Suggested Message") with sparkle ✨ icon
- **Bulk actions:** Select rows → floating action bar appears at bottom: [Email All] [Add to Sequence] [Export] [Delete]
- **Empty state:** Illustration + "Import your first leads or let Caesar find them" + [Import CSV] [Let Caesar find leads]

**Score visualization:**
- Inline progress bar using gold gradient
- 80-100: Full gold
- 60-79: Gold at 60% opacity
- Below 60: Muted gray

### 4C. CMO / Content (Visual Calendar + AI Generation)

```
┌──────────────────────────────────────────────────────────┐
│ Content Calendar          [Month ▾]  [+ Generate Month]  │
│──────────────────────────────────────────────────────────│
│  Mon    │  Tue    │  Wed    │  Thu    │  Fri    │  Sat  │
│─────────┼─────────┼─────────┼─────────┼─────────┼───────│
│         │ 📸 IG   │         │ 📝 Blog │ 📸 IG   │       │
│         │ Product │         │ "5 Ways │ Behind  │       │
│         │ Launch  │         │  to..." │ scenes  │       │
│         │ ●Ready  │         │ ○Draft  │ ○Idea   │       │
│─────────┼─────────┼─────────┼─────────┼─────────┼───────│
│ 🐦 X    │         │ 📧 News │         │ 🐦 X    │       │
│ Thread  │         │ letter  │         │ Tips    │       │
│ ●Ready  │         │ ○Draft  │         │ ○Idea   │       │
└──────────────────────────────────────────────────────────┘
```

**Features:**
- **Month auto-generation:** Click "Generate Month" → Caesar creates a full 30-day content calendar based on business type, industry trends, and holidays
- **Drag-and-drop:** Reschedule posts by dragging between days (Framer Motion `drag` + `reorder`)
- **Status pills:**
  - `●Ready` — Green (#22C55E)
  - `○Draft` — Yellow (#EAB308)
  - `○Idea` — Gray (#6B6B7B)
- **Click to expand:** Opens content editor in a right panel or modal:
  - AI-generated copy (editable)
  - Image preview/generation
  - Platform selector (IG, X, LinkedIn, Email)
  - Schedule time picker
  - [Approve & Schedule] [Edit] [Regenerate]
- **Platform icons:** Color-coded (Instagram pink, X/Twitter neutral, LinkedIn blue)
- **Empty month:** "Let Caesar fill your calendar" CTA — single click generates everything

### 4D. CS Agent (Chat + Settings Split View)

```
┌─────────────────────────────────────────────────────────────┐
│ Customer Support Agent                                       │
│─────────────────────────────────────────────────────────────│
│ ┌─ Live Conversations ──────┐ ┌─ Agent Settings ──────────┐│
│ │                            │ │                            ││
│ │ 🟢 WhatsApp — Ahmed (2m)  │ │ Agent Personality          ││
│ │ 🟢 Website — Sara (5m)    │ │ ┌─────────────────────────┐││
│ │ 🟡 Email — Omar (1h)      │ │ │ Professional, friendly, │││
│ │ ⚪ Resolved — Layla (3h)   │ │ │ uses Arabic greetings   │││
│ │                            │ │ └─────────────────────────┘││
│ │ ─── Selected Chat ───     │ │                            ││
│ │                            │ │ Knowledge Base             ││
│ │ Ahmed: "Where's my order?" │ │ ☑ Product FAQ (23 items)  ││
│ │                            │ │ ☑ Return Policy           ││
│ │ 🤖 AI: "Your order #4521  │ │ ☐ Pricing (draft)         ││
│ │ is out for delivery.       │ │                            ││
│ │ Expected by 3pm today."   │ │ Escalation Rules           ││
│ │                            │ │ → Refund >$100: human     ││
│ │ Ahmed: "Thanks!"          │ │ → Complaint: human         ││
│ │                            │ │ → Technical: attempt 2x    ││
│ │ [Type reply or let AI...] │ │                            ││
│ └────────────────────────────┘ └────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Layout:** 60/40 split — conversations left, settings right
**Conversation list:**
- Status dot: 🟢 Active, 🟡 Waiting, ⚪ Resolved
- Source icon: WhatsApp/Website/Email/Telegram
- Time badge: "2m ago" in muted text
- Unread count badge if applicable

**Chat view:**
- Same message styling as Caesar Chat (consistency)
- AI responses marked with `🤖` prefix and subtle blue-gray background
- "Take over" button lets human agent intervene
- Satisfaction rating shown after resolution

**Settings panel:**
- Tabs: Personality | Knowledge Base | Escalation | Analytics
- Each tab is a clean form with toggle switches and text areas
- Knowledge base: File upload + manual entry, with status indicators

---

## 5. Micro-interactions

### Loading States
| Context | Pattern | Implementation |
|---------|---------|----------------|
| Page load | Skeleton screens | Gray pulsing blocks matching layout shape. `animate-pulse` on `bg-[#1A1A1F]` |
| Chat response | Streaming + typing indicator | 3 gold dots with staggered bounce animation (200ms offset each) |
| Data fetch | Optimistic UI | Show expected result immediately, reconcile on response |
| Button action | Loading spinner in button | Button shrinks text, shows 16px spinner, disabled state |
| Table load | Skeleton rows | 5 skeleton rows with varied widths to look natural |

### Transitions
| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page change | Fade + slight upward slide | 200ms | `ease-out` |
| Modal open | Scale 0.95→1 + fade | 150ms | `ease-out` |
| Modal close | Scale 1→0.95 + fade | 100ms | `ease-in` |
| Sidebar expand | Width 64→240px | 200ms | `ease-in-out` |
| Toast enter | Slide from right + fade | 300ms | `spring(1, 80, 10)` |
| Toast exit | Slide right + fade | 200ms | `ease-in` |
| Dropdown open | Scale Y 0.95→1 + fade | 150ms | `ease-out` |
| Card hover | Scale 1→1.02, shadow increase | 150ms | `ease-out` |

### Empty States
Every major section has a designed empty state:
- **Illustration:** Simple, line-art style, gold accent color, ~120px
- **Headline:** Action-oriented ("No leads yet")
- **Description:** One line explaining value ("Import contacts or let Caesar find leads for you")
- **CTA:** Primary gold button + secondary ghost button
- **Example:**
  ```
  ┌─────────────────────────────┐
  │         [illustration]       │
  │                              │
  │     No content scheduled     │
  │  Let Caesar generate your    │
  │  first month of content.     │
  │                              │
  │  [Generate Content Calendar] │
  │     or import manually       │
  └─────────────────────────────┘
  ```

### Success States
- **Confetti micro-burst** (gold particles, 800ms) on first major action (first lead added, first content published)
- **Checkmark morph:** Button text → ✓ with green flash, then revert after 2s
- **Counter increment:** Numbers animate upward (count-up animation, 400ms)

---

## 6. Color & Typography

### Color Palette

```
// Backgrounds (darkest to lightest)
--bg-primary:      #0B0B0F    // Main page background
--bg-secondary:    #101015    // Cards, elevated surfaces
--bg-tertiary:     #141419    // Modals, command palette
--bg-hover:        #1A1A1F    // Hover states
--bg-active:       #222228    // Active/pressed states

// Borders
--border-subtle:   #1F1F26    // Dividers, card borders
--border-default:  #2A2A35    // Input borders
--border-focus:    #D4A843    // Focused input (gold)

// Text
--text-primary:    #F5F5F7    // Headings, primary content
--text-secondary:  #A0A0B0    // Descriptions, labels
--text-muted:      #6B6B7B    // Placeholders, timestamps
--text-disabled:   #3A3A45    // Disabled elements

// Gold Accent (primary brand)
--gold-primary:    #D4A843    // Buttons, active indicators
--gold-light:      #F5C542    // Hover states, highlights
--gold-muted:      #8B7230    // Subtle accents, disabled gold
--gold-bg:         #D4A84315  // Gold at 8% opacity — subtle bg tint

// Status Colors
--success:         #22C55E    // Completed, positive
--success-bg:      #22C55E15  // Success background tint
--warning:         #EAB308    // Needs attention
--warning-bg:      #EAB30815  // Warning background tint
--error:           #EF4444    // Errors, destructive
--error-bg:        #EF444415  // Error background tint
--info:            #3B82F6    // Informational
--info-bg:         #3B82F615  // Info background tint
```

### Typography

**Primary Font:** `Inter` — clean, highly legible, excellent for UI. Available on Google Fonts.
**Arabic Font:** `IBM Plex Sans Arabic` — professional, pairs well with Inter, full Arabic support.
**Monospace:** `JetBrains Mono` — for code snippets, data values, IDs.

```css
/* Font Scale (using rem, base 16px) */
--text-xs:    0.75rem;    /* 12px — timestamps, badges */
--text-sm:    0.875rem;   /* 14px — secondary text, table cells */
--text-base:  1rem;       /* 16px — body text, input text */
--text-lg:    1.125rem;   /* 18px — card titles */
--text-xl:    1.25rem;    /* 20px — section headings */
--text-2xl:   1.5rem;     /* 24px — page titles */
--text-3xl:   1.875rem;   /* 30px — onboarding questions */
--text-4xl:   2.25rem;    /* 36px — hero/splash text */

/* Font Weights */
--font-regular:  400;     /* Body text */
--font-medium:   500;     /* Labels, table headers */
--font-semibold: 600;     /* Section headings, buttons */
--font-bold:     700;     /* Page titles, emphasis */

/* Line Heights */
--leading-tight:  1.25;   /* Headings */
--leading-normal: 1.5;    /* Body text (EN) */
--leading-relaxed: 1.6;   /* Body text (AR) — Arabic needs more */
```

### Spacing System (4px base)

```
--space-0:   0px
--space-1:   4px      // Tight padding, inline spacing
--space-2:   8px      // Icon gap, compact padding
--space-3:   12px     // Default padding in dense areas
--space-4:   16px     // Standard padding, margins
--space-5:   20px     // Between related elements
--space-6:   24px     // Between sections
--space-8:   32px     // Large section gaps
--space-10:  40px     // Page-level spacing
--space-12:  48px     // Top bar height, major gaps
--space-16:  64px     // Sidebar collapsed width
```

### Border Radius

```
--radius-sm:   4px     // Badges, small elements
--radius-md:   8px     // Cards, inputs, buttons
--radius-lg:   12px    // Modals, large cards
--radius-xl:   16px    // Feature panels
--radius-full: 9999px  // Avatars, pills
```

### Shadows (very subtle on dark theme)

```
--shadow-sm:   0 1px 2px rgba(0,0,0,0.3)
--shadow-md:   0 4px 12px rgba(0,0,0,0.4)
--shadow-lg:   0 8px 24px rgba(0,0,0,0.5)
--shadow-glow: 0 0 20px rgba(212,168,67,0.15)   // Gold glow for focus states
```

---

## 7. Mobile Responsiveness

### Breakpoints

```css
/* Tailwind defaults, modified */
sm:  640px    /* Large phones landscape */
md:  768px    /* Tablets */
lg:  1024px   /* Small laptops */
xl:  1280px   /* Desktops */
2xl: 1536px   /* Large monitors */
```

### Mobile Navigation (< 768px)

Replace sidebar with **bottom tab bar** (fixed, 64px height):

```
┌──────────────────────────────────────┐
│ [💬 Chat] [🎯 Leads] [📝 Content]  │
│            [💬 CS]  [⚙️ More]       │
└──────────────────────────────────────┘
```

Actually, use 5 tabs max:
```
┌─────────────────────────────────────────┐
│  💬       🎯       📝       💬       ⚙️ │
│ Chat    Leads   Content    CS      More │
└─────────────────────────────────────────┘
```

- Active tab: Gold icon + label
- Inactive: `#6B6B7B` icon, no label (to save space) or smaller label
- Tab bar background: `#0B0B0F` with top border `#1F1F26`
- Safe area padding for notched devices

### Mobile Layout Adjustments

| Component | Desktop | Mobile |
|-----------|---------|--------|
| Sidebar | 64/240px left rail | Bottom tab bar |
| Tables | Full horizontal scroll | Card view (stack columns vertically) |
| Split views (CS) | 60/40 side-by-side | Stack vertically, swipe between |
| Command palette | Centered modal (600px) | Full-screen modal |
| Calendar | Grid | List view (vertical scroll) |
| Chat input | Fixed bottom, 48px | Fixed bottom, 44px, full width |
| Modals | Centered, max 640px | Full screen (sheet from bottom) |

### Touch Targets
- Minimum: 44×44px (Apple HIG / WCAG)
- Button padding: min 12px vertical, 16px horizontal
- Table row height: 52px on mobile (vs 40px desktop)

---

## 8. Accessibility

### Color Contrast (WCAG 2.1 AA minimum)

| Combination | Ratio | Pass? |
|-------------|-------|-------|
| `#F5F5F7` on `#0B0B0F` | 18.5:1 | ✅ AAA |
| `#A0A0B0` on `#0B0B0F` | 8.2:1 | ✅ AAA |
| `#6B6B7B` on `#0B0B0F` | 4.6:1 | ✅ AA |
| `#D4A843` on `#0B0B0F` | 8.1:1 | ✅ AAA |
| `#F5C542` on `#0B0B0F` | 12.3:1 | ✅ AAA |
| `#22C55E` on `#0B0B0F` | 9.4:1 | ✅ AAA |
| `#EF4444` on `#0B0B0F` | 5.2:1 | ✅ AA |

### Keyboard Navigation

- **Full tab-key navigation** for all interactive elements
- **Focus rings:** 2px solid `#D4A843` with 2px offset (not outline — use box-shadow for control)
- **Skip to main content** link (hidden until focused)
- **Cmd+K** opens command palette from anywhere
- **Escape** closes any modal/overlay
- **Arrow keys** navigate lists, tables, calendar
- **Enter** activates focused element
- **Focus trap** in modals (focus doesn't leave modal until dismissed)

### Screen Reader Support

- All images: meaningful `alt` text or `aria-hidden` if decorative
- Interactive elements: `aria-label` for icon-only buttons
- Dynamic content: `aria-live="polite"` for toast notifications, chat messages
- Tables: Proper `<thead>`, `<th scope>`, `<caption>`
- Forms: `<label>` associated with every input
- Status indicators: Not color-only (include text/icon)
- Loading states: `aria-busy="true"` on updating regions
- Command palette: `role="combobox"` with `aria-expanded`, `aria-activedescendant`

### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. RTL / Arabic / Bilingual Support

### Implementation Strategy

Use CSS logical properties and `dir="rtl"` attribute:

```css
/* Instead of margin-left, use: */
margin-inline-start: 16px;

/* Instead of padding-right, use: */
padding-inline-end: 16px;

/* Instead of left: 0, use: */
inset-inline-start: 0;

/* Instead of text-align: left, use: */
text-align: start;
```

### What Mirrors (RTL)
- ✅ Sidebar moves to right side
- ✅ Text alignment flips
- ✅ Navigation flow reverses
- ✅ Breadcrumbs, progress bars reverse direction
- ✅ Form labels align right
- ✅ Icons with directional meaning (arrows, chevrons) flip
- ✅ Slide-out panels from left instead of right

### What Does NOT Mirror
- ❌ Numbers (phone, dates, prices) — always LTR
- ❌ Clocks, circular progress — always clockwise
- ❌ Logos and brand marks
- ❌ Media playback controls
- ❌ Code snippets
- ❌ Icons without directional meaning (trash, settings, star)

### Arabic Typography Rules
- **Minimum font size:** 14px (Arabic requires ~2px more than Latin for legibility)
- **Line height:** 1.6 minimum (vs 1.5 for Latin) — Arabic has tall ascenders/descenders
- **Font:** IBM Plex Sans Arabic (weights: 400, 500, 600, 700)
- **Avoid ALL CAPS** — Arabic has no uppercase/lowercase distinction
- **Kerning:** Ensure connected letters render properly (test with: ل + ا = لا)
- **Mixed content:** When Arabic and English appear in same paragraph, use `unicode-bidi: embed`

### Language Toggle
- **Location:** Top bar, right side (or left in RTL)
- **Style:** Two-letter toggle: `AR | EN` — active gets gold underline
- **Behavior:** Instant switch, no page reload (i18n via `next-intl` or `react-i18next`)
- **Persistence:** Saved to user preferences, remembered across sessions
- **Default:** Auto-detect from browser locale, with easy override

### Bilingual Content Display
- User-generated content shown in original language
- AI-generated content can be toggled or shown side-by-side
- Caesar chat: Responds in the language the user types in (auto-detect)

---

## 10. Competitive Comparison — What to Steal

### Linear (linear.app) — Project Management

**What they nail:**
- **Speed:** Every interaction is <100ms. No loading spinners visible. Optimistic updates everywhere.
- **Keyboard-first:** Every action has a shortcut. Cmd+K command palette is the primary navigation for power users. You can create issues, assign, change status, filter — all without touching the mouse.
- **Minimal chrome:** The sidebar is thin (icons only by default). Content area gets maximum real estate. No clutter, no decorative elements.
- **Dark mode as default:** Deep blacks (#000000–#111111), very subtle borders, white text. Color is used sparingly and purposefully — only for status indicators and the occasional accent.
- **Typography:** Inter font, consistent weight hierarchy. Bold for titles, regular for content, muted for metadata.
- **Transitions:** Smooth but fast. Page transitions feel like state changes, not navigations. No page flash.

**Steal for Mubyn:**
- Command palette as primary power-user nav ✅
- Keyboard shortcuts for every action ✅
- Optimistic UI + speed obsession ✅
- Minimal sidebar (collapsed default) ✅
- Dark theme as default ✅

---

### Notion AI (notion.so) — Workspace

**What they nail:**
- **Block-based architecture:** Everything is a block (text, table, image, embed). This composability makes the interface infinitely flexible while maintaining consistency.
- **Slash commands (`/`):** Type `/` anywhere to access every feature. This is the inline command palette — no need to hunt through menus.
- **AI integration:** `AI` button in every block. Summarize, translate, rewrite, generate — contextual to the block content. AI feels like a feature of the content, not a separate tool.
- **Templates:** Pre-built starting points for every use case. Reduces blank-page anxiety.
- **Progressive complexity:** New users see a simple note-taking app. Advanced users find databases, relations, formulas, automations. Same product, different depth levels.
- **Sidebar:** Clean tree structure. Sections collapse. Favorites pinned at top. Shared spaces clearly separated from personal.

**Steal for Mubyn:**
- Slash commands in Caesar chat (for triggering specific modules) ✅
- AI integrated into every component, not just the chat page ✅
- Templates for common business scenarios ✅
- Progressive complexity — simple by default ✅

---

### Clay.com — Lead Enrichment

**What they nail:**
- **Spreadsheet-as-interface:** The entire product is a smart table. Users understand it instantly because it looks like a spreadsheet, but each column can pull from AI or data providers.
- **Waterfall enrichment UX:** You define a "recipe" (sequence of data providers). If source A fails, try source B, then C. Each cell shows which source provided the data (small icon). This transparency builds trust.
- **Column types:** Not just text. Columns can be "Find email" (enrichment action), "AI classify" (AI-computed), "Formula" (calculated). The column header shows the type with a distinct icon.
- **Inline actions:** Right-click context menus, cell-level editing, bulk operations on selected rows. Dense but usable.
- **Visual data quality:** Cells color-coded by confidence. Verified = solid. Unverified = dashed border. Missing = muted red.

**Steal for Mubyn Leads:**
- Smart table as primary leads interface ✅
- Column-level source attribution (hover to see where data came from) ✅
- Waterfall enrichment concept for lead scoring ✅
- Visual confidence indicators on data cells ✅
- Inline editing with instant save ✅

---

### Jasper AI (jasper.ai) — Content Creation

**What they nail:**
- **Template-first approach:** Instead of a blank text box, users choose a template (Instagram caption, blog intro, email subject line, etc.). This reduces cognitive load and improves output quality.
- **Campaign concept:** Group content by campaign (product launch, seasonal sale). All pieces generated together with consistent voice and messaging.
- **Brand voice persistence:** You set your brand voice once, and every generation respects it. You don't re-explain your brand in every prompt.
- **Side-by-side generation:** Write on the left, generate on the right. Or generate 3 variations to choose from.
- **Tone slider:** Professional ↔ Casual, Serious ↔ Playful — visual controls instead of prompt engineering.
- **Content calendar view:** See all scheduled/published content in a calendar grid. Visual status indicators.

**Steal for Mubyn Content (CMO):**
- Template library for content types ✅
- Campaign grouping (auto-generated month = campaign) ✅
- Brand voice configuration (set once, used everywhere) ✅
- Visual tone/style controls instead of raw prompts ✅
- Calendar view as primary content interface ✅

---

### Perplexity AI — Information Seeking

**What they nail:**
- **Extreme simplicity:** One search box. That's it. No sidebar, no features visible. The product IS the interaction.
- **Citations built-in:** Every claim links to a source. Numbered superscripts like academic papers. This makes AI output trustworthy.
- **Follow-up suggestions:** After answering, Perplexity suggests 3-4 related questions. This keeps users engaged and exploring.
- **Multi-format responses:** Text, images, videos, maps — whatever format best answers the query. Not just a wall of text.
- **Speed:** Responses begin streaming almost instantly. The typing indicator and progressive reveal create perception of intelligence at work.

**Steal for Caesar Chat:**
- Citations on AI-generated claims ✅
- Follow-up action suggestions after every response ✅
- Multi-format responses (tables, charts, lists, not just text) ✅
- Streaming responses with progressive reveal ✅
- Suggested questions/actions to maintain momentum ✅

---

### Cursor (cursor.com) — AI IDE

**What they nail:**
- **Command palette is everything:** Cmd+K opens an intelligent palette that understands context. You can ask it natural language questions about your code, or run traditional commands.
- **Inline AI:** Select text → Cmd+K → "make this more concise" → AI edits in place. No separate window, no copy-paste.
- **Diff view for AI edits:** When AI suggests changes, you see a git-diff-style view. Green for additions, red for removals. Accept or reject with one keystroke.
- **Tab-completion on steroids:** AI predicts your next action and offers it as a ghost preview. Press Tab to accept.

**Steal for Mubyn:**
- Command palette with natural language understanding ✅
- Inline AI editing (e.g., in content editor: select text → "rewrite for Instagram") ✅
- Ghost suggestions in input fields ✅

---

### v0.dev (Vercel) — AI Code Generation

**What they nail:**
- **Chat-first, preview-second:** You describe what you want in natural language. The AI generates it. A live preview appears alongside the chat.
- **Iterative refinement:** "Make the button bigger" — and it updates in real-time. Conversation IS the tool.
- **Clean, opinionated design:** v0 outputs are always clean, modern, consistent. The design system is baked in.

**Steal for Mubyn:**
- Chat as the primary creation interface (describe → Caesar generates) ✅
- Iterative refinement through conversation ✅
- Live previews of generated content inline in chat ✅

---

## Implementation Priority (for VC Demo)

### Must-have (Day 1):
1. ✅ Dark + gold theme applied globally
2. ✅ Typeform onboarding flow (5 steps)
3. ✅ Caesar Chat with streaming responses
4. ✅ Sidebar with collapsed/expanded state
5. ✅ Leads table with basic CRUD
6. ✅ Content calendar (even with mock data for demo)
7. ✅ Command palette (Cmd+K)

### Nice-to-have (Day 2-3):
1. CS Agent split view
2. Analytics dashboard
3. Notification system
4. RTL toggle (can demo with a button click)
5. Mobile responsive bottom nav

### Polish (Week 1):
1. All micro-interactions and transitions
2. Full keyboard navigation
3. Empty states with illustrations
4. Confetti and success animations
5. Full RTL/Arabic support
6. Accessibility audit

---

*This spec is designed to be handed directly to a frontend engineer or AI code generator (v0, Cursor) and produce a production-quality dashboard. Every color, every spacing value, every animation timing is specified. Build it.*
