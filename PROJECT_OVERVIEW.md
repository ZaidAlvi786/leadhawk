# LeadHawk v2 — Complete Project Overview

> A comprehensive guide for developers to understand the LeadHawk codebase from scratch.

---

## Table of Contents

1. [What is LeadHawk?](#what-is-leadhawk)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [How the App Works](#how-the-app-works)
5. [Module-by-Module Feature Guide](#module-by-module-feature-guide)
6. [State Management Deep Dive](#state-management-deep-dive)
7. [AI System Architecture](#ai-system-architecture)
8. [Authentication](#authentication)
9. [Design System](#design-system)
10. [Development Workflow](#development-workflow)
11. [Deployment](#deployment)
12. [Common Patterns & Best Practices](#common-patterns--best-practices)
13. [Troubleshooting](#troubleshooting)

---

## What is LeadHawk?

**LeadHawk v2** is a professional-grade AI-powered sales intelligence platform that combines multiple sales workflows into one unified application.

### Problem It Solves
Sales professionals juggle multiple tools daily — Sales Navigator, Apollo, LinkedIn, X/Twitter, email tools, CRMs. LeadHawk unifies these workflows with AI that:
- Generates personalized outreach messages
- Analyzes leads by archetype to suggest pain points
- Creates trending content for social media
- Manages email sequences and pipeline stages
- Tracks message performance across all channels

### Target Users
- B2B sales professionals
- Solopreneurs and freelancers
- Marketing & growth teams
- LinkedIn/Twitter content creators
- Anyone doing cold outreach at scale

### Core Value Proposition
> "Replace 5 SaaS tools and a virtual assistant with one AI-powered platform"

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (Pages Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + custom design tokens
- **Icons:** lucide-react
- **State:** Zustand with persist middleware
- **Forms:** React Hook Form (where used)
- **Toasts:** react-hot-toast

### Backend / API
- **API Routes:** Next.js API routes (`/api/*`)
- **AI Providers:**
  - Google Gemini (primary)
  - OpenRouter (fallback with model cycling)
- **Auth:** Supabase (scaffolding in place)

### Storage
- **Client:** localStorage via Zustand persist
- **Auth State:** Supabase session storage
- **No Backend DB:** Currently 100% client-side data

### Build & Deploy
- **Build:** Next.js (`next build`)
- **Hosting:** Vercel-ready (or any Node host)
- **Environment:** `.env.local` for API keys

---

## Project Structure

```
leadhawk/
├── public/                       # Static assets (favicon, etc.)
├── src/
│   ├── pages/                    # Next.js pages (auto-routed)
│   │   ├── _app.tsx              # App wrapper + auth provider
│   │   ├── index.tsx             # Main shell (sidebar + page router)
│   │   ├── login.tsx             # Login/signup page
│   │   ├── leads.tsx             # Lead generation page
│   │   ├── linkedin-growth.tsx   # LinkedIn growth & posts
│   │   ├── apollo.tsx            # Apollo CRM (legacy)
│   │   ├── sequences.tsx         # Email sequence builder
│   │   ├── pipeline.tsx          # Sales pipeline (CRM)
│   │   ├── twitter-growth.tsx    # Twitter/X growth
│   │   ├── analytics.tsx         # Performance dashboard
│   │   ├── templates.tsx         # Message template library
│   │   └── api/
│   │       └── ai.ts             # AI provider router
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx       # Main navigation (8 modules)
│   │   │   └── Header.tsx        # Top bar (mobile menu)
│   │   ├── leads/
│   │   │   ├── LeadFilterBuilder.tsx
│   │   │   ├── LeadBriefGenerator.tsx
│   │   │   └── MessageTemplateGenerator.tsx
│   │   ├── linkedin/
│   │   │   ├── LinkedInPostGenerator.tsx
│   │   │   └── LinkedInGrowthPlan.tsx
│   │   ├── twitter/
│   │   │   ├── TweetGenerator.tsx
│   │   │   ├── TwitterThreadBuilder.tsx
│   │   │   └── TwitterGrowthPlanGenerator.tsx
│   │   ├── pipeline/
│   │   │   ├── SequenceStartDialog.tsx
│   │   │   ├── SequenceProgressDisplay.tsx
│   │   │   ├── BulkImportDialog.tsx
│   │   │   └── DailyActionQueue.tsx
│   │   └── shared/
│   │       └── ProfileSetup.tsx  # User profile modal
│   │
│   ├── lib/
│   │   ├── types.ts              # All TypeScript interfaces
│   │   ├── store.ts              # Zustand global state
│   │   ├── ai.ts                 # AI generation functions
│   │   ├── archetypes.ts         # 9 lead archetype profiles
│   │   ├── topicEngine.ts        # Trending topics + 48h TTL
│   │   ├── auth.tsx              # Supabase auth context
│   │   ├── supabase.ts           # Supabase client init
│   │   ├── utils.ts              # Helpers (URL builders, etc.)
│   │   ├── filterPresets.ts      # Preset filter suggestions
│   │   ├── postTopics.ts         # 300+ static post topics
│   │   ├── postImage.ts          # Post image generators
│   │   └── useTemplates.ts       # Template management hook
│   │
│   └── styles/
│       └── globals.css           # Design tokens + utilities
│
├── .env.local                    # API keys (NOT committed)
├── package.json
├── tailwind.config.js            # Design system config
├── tsconfig.json                 # TypeScript config
├── next.config.js                # Next.js config
├── CLAUDE.md                     # Claude Code instructions
└── PROJECT_OVERVIEW.md           # This file
```

---

## How the App Works

### App Entry Flow

```
1. User opens app (localhost:3000)
2. _app.tsx wraps app in AuthProvider
3. AuthGate checks for Supabase session
   - No session → redirect to /login
   - Has session → render index.tsx
4. index.tsx renders main shell:
   - Sidebar (left)
   - Header (top)
   - Main content area (renders selected page)
5. ProfileSetup modal shown if user.name is empty
6. User selects module from sidebar → page re-renders
```

### Page Routing

LeadHawk uses a **single-page app pattern** within Next.js. Instead of using Next.js's page-based routing for navigation, all modules are rendered conditionally inside `index.tsx` based on `currentPage` state.

```typescript
// In src/pages/index.tsx
{currentPage === 'leads' && <LeadsPage />}
{currentPage === 'linkedin-growth' && <LinkedInGrowthPage />}
{currentPage === 'pipeline' && <PipelinePage />}
// ... etc
```

The `currentPage` state lives in Zustand and is updated when user clicks sidebar items.

### Why This Architecture?
- ✅ Faster transitions (no page reloads)
- ✅ Preserves state across navigation
- ✅ Single shell with consistent layout
- ✅ Simpler than complex Next.js routing for SPA-style apps

---

## Module-by-Module Feature Guide

### 🎯 1. Lead Generation (`/leads`)

**Purpose:** Find and reach out to ideal leads on LinkedIn Sales Navigator with AI-powered intelligence.

**Components:**
- `LeadFilterBuilder.tsx` — Sales Navigator filter generator
- `LeadBriefGenerator.tsx` — AI lead intelligence
- `MessageTemplateGenerator.tsx` — Personalized outreach

#### Feature 1: Lead Filter Builder
**What it does:** User describes ideal customer in plain English → AI extracts Sales Navigator filters.

**Flow:**
```
1. User types: "B2B SaaS founders in US, 10-50 employees, in fintech"
2. Click "Generate Filters"
3. AI returns: jobTitles, industries, companySize, locations
4. Click "Apply" → opens Sales Navigator with filters auto-applied
```

**Code path:** `LeadFilterBuilder.tsx` → `generateFilterSuggestions()` in `ai.ts` → opens URL via `buildSalesNavURL()`

#### Feature 2: Lead Brief Generator
**What it does:** Analyzes a specific lead and generates personalization hooks based on archetype.

**The 9 Archetypes** (defined in `archetypes.ts`):
1. **Founder/CEO** — Time scarcity, hiring, growth plateaus
2. **Marketing Leader** — Attribution, MQLs, content creation
3. **Sales Leader** — Pipeline gaps, rep performance, churn
4. **Agency Owner** — Client retention, scope creep, hiring
5. **Engineering Manager** — Team velocity, technical debt, hiring
6. **Product Manager** — Roadmap pressure, feature requests, data
7. **Freelancer/Creator** — Lead generation, pricing, scaling
8. **Operations Leader** — Process gaps, automation, headcount
9. **Other** — Generic fallback

**Each archetype includes:**
- Common pain points
- Tone guidelines (how to talk to them)
- Hook patterns (what gets their attention)
- Avoid list (what NOT to say)

**Flow:**
```
1. User enters: name, company, role, LinkedIn URL, optional context
2. AI analyzes → detects archetype → fetches profile → generates brief
3. Brief contains:
   - Summary (2-3 sentences)
   - Recent activity (3 inferred items)
   - Pain points (2-3 specific to them)
   - Personalization hooks (3-5 specific opener angles)
   - Best approach (recommended outreach style)
   - Red flags (things to avoid)
4. Saved to localStorage → can be used by Message Generator
```

#### Feature 3: Message Template Generator
**What it does:** Generates personalized outreach messages using a Lead Brief or manual input.

**Two Modes:**
- **Brief Mode:** Auto-fills from saved lead brief, uses hooks for context
- **Manual Mode:** User enters details manually

**4 Tone Options:**
- Professional
- Casual
- Value-driven
- Problem-solving

**Output:** Single connection message under 300 characters that:
- Doesn't fake familiarity
- Doesn't use generic flattery
- Sounds like a human, not a sales bot

---

### 📈 2. LinkedIn Growth (`/linkedin-growth`)

**Purpose:** Generate viral LinkedIn posts and create multi-week growth strategies.

**Components:**
- `LinkedInPostGenerator.tsx` — Post creator with trending topics
- `LinkedInGrowthPlan.tsx` — Multi-week plan generator

#### Feature 1: LinkedIn Post Generator

**6 Post Types:**
- 💡 Thought Leadership
- 📊 Case Study
- ✅ Tips & Tricks
- 📖 Story
- 🗳️ Poll/Question
- 🔥 Engagement Bait

**Two Topic Sources:**

1. **🔥 Trending Topics (AI-generated)**
   - 10 timely topics with trend scores
   - 48-hour TTL (auto-expire)
   - Refresh button with 1-hour cooldown
   - Each topic has: trend score, audience fit, viral pattern, hook

2. **📚 300+ Curated Topics**
   - Categorized: AI/automation, LLMs, dev, freelance, hot takes, cases
   - Searchable with filtering
   - Backed by `postTopics.ts` library

**Output:** Complete LinkedIn post with:
- Strong hook (first line)
- Body content
- 3-5 relevant hashtags
- Estimated reach
- Best time to post

**Image Generation:**
- 4 image styles (hook, gradient, geometric, minimal)
- Generated client-side via canvas
- Downloadable as PNG

#### Feature 2: LinkedIn Growth Plan

**Inputs:** Profile details, current followers, target followers, weeks (4/8/12)

**Output:** Multi-week strategy with:
- Theme per week
- Specific goals (followers, impressions)
- Actions (post, engage, connect, comment, message)
- Frequency for each action
- Priority levels

---

### 📤 3. Apollo (`/apollo`) — LEGACY

**Status:** Deprecated. Functionality merged into Pipeline module.

**Why kept:** For backward compatibility with existing Apollo workflows. Recommends users transition to Pipeline.

---

### 📧 4. Email Sequences (`/sequences`)

**Purpose:** Generate multi-step cold email sequences with AI.

**Sequence Structure:**
```
Step 1: Intro (Day 0)        — Pattern interrupt + soft pitch
Step 2: Value-add (Day 3)    — Free resource or insight
Step 3: Follow-up (Day 7)    — Gentle reminder
Step 4: Breakup (Day 14)     — Last touch with door open
```

**Inputs:**
- Target role
- Industry
- Tone (4 options)
- Sender info

**Output:**
Each step contains:
- Subject line
- Email body
- Delay days (when to send after previous step)
- Step type (intro / value-add / follow-up / breakup)

**Pattern Used by AI:**
- Short emails (< 150 words)
- Specific, not salesy
- One CTA per email
- Step 2 always provides genuine value
- Step 4 closes the loop respectfully

---

### 🐦 5. X / Twitter Growth (`/twitter-growth`)

**Purpose:** Mirror of LinkedIn module but optimized for X/Twitter.

**Components:**
- `TweetGenerator.tsx` — Single tweets, replies, thread starters
- `TwitterThreadBuilder.tsx` — Full thread structure
- `TwitterGrowthPlanGenerator.tsx` — Multi-week strategy

#### Tweet Generator

**3 Tweet Types:**
- 1️⃣ Single Tweet (one powerful tweet)
- 🧵 Thread Starter (first tweet of thread)
- 💬 Reply (engagement)

**4 Tones:**
- Educational
- Controversial (hot takes)
- Humorous
- Inspirational

**Built-in Validation:** 280-character limit with color-coded counter (green/red).

#### Thread Builder

**5 Thread Types:**
- Educational
- Story
- Tips
- Debate
- General

**Thread Structure (auto-generated):**
```
1. Hook tweet         (1st tweet — curiosity/controversy)
2. Setup tweets (2-3) — Context/problem
3. Insights (3-5)     — Actionable takeaways
4. CTA tweet          — Call to action / link
```

#### Growth Plan
Same structure as LinkedIn growth plan but Twitter-specific actions:
- Tweet, reply, retweet, follow, engage, space, thread

---

### 🎯 6. Sales Pipeline (`/pipeline`) — UNIFIED CRM

**Purpose:** Track every lead from first contact to closed deal with AI assistance.

#### The 7 Pipeline Stages
```
NEW → CONTACTED → REPLIED → MEETING → PROPOSAL → CLOSED-WON / CLOSED-LOST
```

#### Lead Source Tags
- `apollo` (imported from Apollo CSV)
- `linkedin`
- `manual` (typed in)
- `referral`
- `inbound` (came to you)

#### Key Features

**1. Add Lead** (manual or bulk)
- Manual: Form with name, title, company, email, etc.
- Bulk Import: CSV with validation
  - Required: firstName, lastName, email
  - Optional: title, company, industry
  - Skips rows with missing required fields
  - Reports success/failures

**2. Sequence Auto-Trigger** (Phase 5 feature)
- When lead moves to "contacted" stage → dialog appears
- User picks an email sequence to start
- Lead card now shows progress bar with current step
- Mail icon (✉️) on card lets users manually link sequence anytime

**3. AI Next Action**
- Click ✨ Sparkles icon on any lead
- AI suggests next action based on:
  - Current stage
  - Days since last contact
  - Notes
- Result: "Send follow-up referencing their recent product launch"

**4. Daily Action Queue**
- Shows at top of pipeline
- Auto-generated recommendations:
  - 📅 Follow-ups due today
  - 📧 Leads needing sequences (in "contacted" without one)
  - ⚡ Meeting prep (leads in "meeting" stage)
- Sorted by priority (high → low)

**5. Notes & Tracking**
- Inline editable notes
- Last contacted date
- Next follow-up date
- Days since contact (visual indicator)

**6. Quick Actions** (per-card icons)
- ⬅️ Move back stage
- ➡️ Move forward stage
- 💬 Mark contacted (sets follow-up +3 days)
- ✉️ Start sequence (if no email linked)
- 📝 Add notes
- ✨ AI suggest action
- W (Won) / L (Lost) buttons
- 🗑️ Delete

---

### 📊 7. Analytics (`/analytics`)

**Purpose:** Track performance across all channels and identify what works.

#### KPIs Displayed
- **Total Sent:** All messages sent (any channel)
- **Replies:** Messages that got responses
- **Reply Rate:** % of messages replied to
- **Meetings:** Leads booked into meetings

#### Channel Breakdown
Bars showing outcomes per channel:
- LinkedIn (cyan)
- Email (indigo)
- Twitter (green)

#### Summary Stats
- Total generated posts (LinkedIn + Twitter combined)
- Total email sequences

#### Recent Outcomes
- List of last 5 message outcomes
- Status badges (replied, meeting_booked, no_response, etc.)
- Channel + date

#### Data Source
All data comes from `outcomes` array in store. Outcomes are added when:
- User manually marks a message as sent
- Pipeline stage changes update outcomes
- (Future: email service webhooks)

---

### 📚 8. Message Templates (`/templates`)

**Purpose:** Reusable templates for consistent, fast outreach.

#### Features
- Create/edit/delete templates
- Filter by tone, target role, industry
- Track response rate per template
- Dynamic variables: `{name}`, `{company}`, `{role}`
- Copy to clipboard for quick use

#### Template Fields
- Name (e.g., "CEO Cold Email")
- Subject line (optional, for emails)
- Message body
- Tone (4 options)
- Target role (CEO, VP Sales, etc.)
- Industry (SaaS, Finance, etc.)
- Response rate (tracked over time)

---

## State Management Deep Dive

### Why Zustand?
- ✅ Simple API (no boilerplate)
- ✅ TypeScript-first
- ✅ Built-in persist middleware
- ✅ Smaller than Redux
- ✅ No providers needed

### Store Structure (`src/lib/store.ts`)

```typescript
interface AppState {
  // Navigation
  currentPage: NavPage;
  setCurrentPage: (page: NavPage) => void;

  // Mobile sidebar (ephemeral)
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;

  // User profile (persisted)
  userProfile: UserProfile;
  setUserProfile: (profile: Partial<UserProfile>) => void;

  // Lead Filters
  filters: LeadFilter[];
  addFilter: (filter: LeadFilter) => void;
  // ... more

  // Lead Briefs (Intelligence)
  leadBriefs: LeadBrief[];
  // ... CRUD

  // LinkedIn Posts
  posts: LinkedInPost[];
  // ... CRUD

  // Trending Topics (per-platform)
  trendingTopics: { linkedin: TrendingTopic[]; twitter: TrendingTopic[] };
  lastTopicRefresh: { linkedin: string; twitter: string };

  // Growth Plans
  growthPlans: GrowthPlan[];

  // Twitter Data
  tweets: Tweet[];
  twitterThreads: TwitterThread[];
  twitterGrowthPlans: TwitterGrowthPlan[];

  // Email Sequences
  sequences: EmailSequence[];

  // Pipeline / CRM
  pipelineLeads: PipelineLead[];

  // Outcomes (Analytics)
  outcomes: MessageOutcome[];
}
```

### Persistence Strategy

```typescript
persist((set) => ({
  // ... state
}), {
  name: 'leadhawk-storage',  // localStorage key
  partialize: (state) => ({
    // Only persist these fields:
    userProfile, filters, leadBriefs, posts,
    trendingTopics, lastTopicRefresh,
    growthPlans, tweets, twitterThreads,
    twitterGrowthPlans, sequences,
    pipelineLeads, outcomes,
    // NOT persisted: currentPage, mobileSidebarOpen
  }),
})
```

### How Components Use the Store

```typescript
// Read state
const { posts, addPost } = useStore();

// Update state
addPost({ id: '...', content: '...', /* ... */ });

// Subscribe to specific state (re-renders only when posts change)
const posts = useStore((s) => s.posts);
```

---

## AI System Architecture

### The Big Picture

```
Component (UI)
    ↓ calls generateX(params)
src/lib/ai.ts
    ↓ calls callAI(systemPrompt, userPrompt, options)
fetch('/api/ai', { ... })
    ↓
src/pages/api/ai.ts (server-side)
    ↓ tries:
    1. Google Gemini (primary)
    2. OpenRouter (fallback)
    ↓ returns { result: "...", provider: "gemini" }
src/lib/ai.ts
    ↓ extractJSON(raw) — handles markdown fences, sanitizes
    ↓ JSON.parse()
Component receives parsed object
```

### Provider Priority

**1. Google Gemini (preferred)**
- Free tier: 15 req/min, 1500/day
- Model: `gemini-2.5-flash` (configurable)
- Supports JSON response format
- Get API key: https://aistudio.google.com/apikey

**2. OpenRouter (fallback)**
- Cycles through multiple models
- Free tier models available
- Get API key: https://openrouter.ai/keys

### How Fallback Works

```
1. Try Gemini → success → return
2. Gemini fails → try OpenRouter model 1 → success → return
3. Model 1 fails → try model 2 → ...
4. All fail → return detailed error with hints
```

### Configuration (`.env.local`)

```bash
# Required (one of these):
GOOGLE_API_KEY=AIzaSy...
# OR
OPENROUTER_API_KEY=sk-or-v1-...

# Optional:
GOOGLE_MODEL=gemini-2.5-flash
OPENROUTER_MODELS=openai/gpt-4o-mini,meta-llama/llama-2-70b
OPENROUTER_MAX_TOKENS=2000
```

### AI Function Pattern

All AI functions follow this structure:

```typescript
// src/lib/ai.ts
export async function generateX(params): Promise<ResultType> {
  const system = `You are a [role]. [Detailed instructions].
Return ONLY valid JSON.`;

  const user = `Create a [thing] for:
- ${params.field1}
- ${params.field2}

Return JSON: { "field": "string" }`;

  try {
    const raw = await callAI(system, user, {
      responseFormat: 'json',
      maxTokens: 2000
    });
    return JSON.parse(extractJSON(raw));
  } catch (err) {
    return { error: 'Failed', details: String(err) };
  }
}
```

### JSON Extraction Robustness

LLMs sometimes return:
- ✗ Markdown code fences (```json ... ```)
- ✗ Leading/trailing prose
- ✗ Trailing commas
- ✗ Unquoted property names

`extractJSON()` handles all of these:
```typescript
1. Try to parse raw as-is
2. Try to sanitize (remove trailing commas, fix quotes)
3. Strip markdown fences and try again
4. Extract from first `{` to last `}`
5. Sanitize and try again
6. Return what we have
```

---

## Authentication

### Implementation: Supabase

```typescript
// src/lib/supabase.ts
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;

// src/lib/auth.tsx
const AuthContext = createContext<AuthContextType>({...});

export function AuthProvider({ children }) {
  // Tracks session, user, loading
  // Provides signIn, signUp, signOut methods
}

export function useAuth() {
  return useContext(AuthContext);
}
```

### Auth Gate (in `_app.tsx`)
```typescript
function AuthGate({ children }) {
  const { session, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!session) {
    router.push('/login');
    return null;
  }
  return children;
}
```

### Status
- ✅ Login/signup pages exist
- ✅ Session persistence works
- ⚠️ Data not synced to Supabase DB (still localStorage)
- ⚠️ Multi-device sync not implemented

---

## Design System

### Color Palette

```css
/* Primary (Indigo-Cyan gradient) */
--primary: #6366f1;
--secondary: #06b6d4;

/* Accents */
--success: #10b981;  /* Emerald */
--warning: #f59e0b;  /* Amber */
--danger: #ef4444;   /* Rose */
--purple: #8b5cf6;

/* Surfaces (dark theme) */
--bg-primary: #0b1020;
--bg-card: #1e293b;
--bg-elevated: #334155;

/* Text */
--text-primary: #f1f5f9;
--text-secondary: #cbd5e1;
--text-muted: #64748b;
--text-disabled: #475569;
```

### Typography

```css
/* Display (headings) */
font-family: 'Syne', sans-serif;

/* Body */
font-family: 'DM Sans', sans-serif;

/* Code/Mono */
font-family: 'JetBrains Mono', monospace;
```

### Tailwind Customizations

**Custom utilities:**
- `.glass-card` — Translucent card with border
- `.btn-primary` — Indigo gradient button
- `.btn-secondary` — Outlined button
- `.input-field` — Styled input
- `.tag` — Small pill badges

**Custom animations:**
- `.animate-fade-in`
- `.animate-fade-up`
- `.animate-pulse-slow`
- `.animate-shimmer`

**Shadows:**
- `.shadow-glow-indigo` — Glowing border
- `.shadow-glow-cyan`
- `.shadow-card`
- `.shadow-card-hover`

### Responsive Strategy

```
Mobile (< 768px):   Sidebar hidden by default, drawer overlay
Tablet (768-1024):  Sidebar visible, condensed
Desktop (> 1024):   Full layout with all panels
```

Use `md:` Tailwind prefix for tablet+ styles.

---

## Development Workflow

### Setup

```bash
# 1. Clone repo
git clone <repo-url>
cd leadhawk

# 2. Install dependencies
npm install

# 3. Create .env.local
echo "GOOGLE_API_KEY=AIzaSy..." > .env.local

# 4. Start dev server
npm run dev

# 5. Open browser
open http://localhost:3000
```

### Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (hot reload) |
| `npm run build` | Production build |
| `npm start` | Run production build locally |
| `npm run lint` | ESLint check |
| `npx tsc --noEmit` | Type check only |

### Adding a New Feature

#### 1. Add a New Module
```typescript
// 1. Create page: src/pages/my-module.tsx
export default function MyModulePage() { ... }

// 2. Add to NavPage type: src/lib/types.ts
export type NavPage = '...' | 'my-module';

// 3. Import & route: src/pages/index.tsx
import MyModulePage from '@/pages/my-module';
{currentPage === 'my-module' && <MyModulePage />}

// 4. Add to sidebar: src/components/layout/Sidebar.tsx
{
  id: 'my-module' as NavPage,
  label: 'My Module',
  icon: SomeIcon,
  description: '...',
  badge: 'NEW',
  badgeColor: 'tag-green',
}
```

#### 2. Add a New AI Function
```typescript
// In src/lib/ai.ts
export async function generateX(params: GenerateXParams): Promise<X> {
  const system = `You are...`;
  const user = `Create...`;

  const raw = await callAI(system, user, { responseFormat: 'json' });
  return JSON.parse(extractJSON(raw));
}
```

#### 3. Add a New Data Type
```typescript
// In src/lib/types.ts
export interface MyData {
  id: string;
  name: string;
  // ...
}

// In src/lib/store.ts (add to AppState interface)
myData: MyData[];
addMyData: (data: MyData) => void;

// In persist's partialize, add:
myData: state.myData,
```

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

**Important:** Add env vars in Vercel dashboard:
- `GOOGLE_API_KEY`
- `OPENROUTER_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL` (if using auth)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (if using auth)

### Self-hosted

```bash
npm run build
npm start
# Server runs on port 3000 by default
```

---

## Common Patterns & Best Practices

### 1. Error Handling with Toasts
```typescript
import toast from 'react-hot-toast';

try {
  const result = await someAsyncOperation();
  toast.success('Operation complete!');
} catch (err) {
  console.error(err);
  toast.error('Something went wrong');
}
```

### 2. Loading States
```typescript
const [loading, setLoading] = useState(false);

const handleClick = async () => {
  setLoading(true);
  try {
    await operation();
  } finally {
    setLoading(false);
  }
};
```

### 3. Optimistic Updates
```typescript
// Update UI first, then sync
addPost(newPost);  // Update Zustand
toast.success('Post saved!');
// (No backend call needed since localStorage is sync)
```

### 4. Form State Pattern
```typescript
const [form, setForm] = useState({
  name: '',
  email: '',
});

<input
  value={form.name}
  onChange={(e) => setForm({ ...form, name: e.target.value })}
/>
```

### 5. Type-Safe State Updates
```typescript
// In store.ts
updateLead: (id: string, lead: Partial<PipelineLead>) =>
  set((s) => ({
    pipelineLeads: s.pipelineLeads.map((l) =>
      l.id === id ? { ...l, ...lead, updatedAt: new Date().toISOString() } : l
    )
  })),
```

---

## Troubleshooting

### "AI request failed"
- Check `.env.local` has `GOOGLE_API_KEY` or `OPENROUTER_API_KEY`
- Verify key is valid at provider's dashboard
- Check browser Network tab for `/api/ai` response

### "JSON parse failed"
- LLM returned malformed JSON
- Check console for raw response
- `extractJSON()` should handle most cases
- If persistent, increase `maxTokens` in AI call

### "localStorage exceeded"
- Browser storage limits hit (~5-10 MB)
- Clear old data: `localStorage.removeItem('leadhawk-storage')`
- For production: migrate to Supabase database

### "Sales Navigator URL doesn't work"
- Requires active LinkedIn Sales Navigator subscription
- URL pre-fills filters, user must still click "Search"

### "LinkedIn post composer empty"
- LinkedIn URL length limit hit
- Content auto-copied to clipboard as fallback
- Manually paste into LinkedIn composer

---

## Architecture Decisions Log

### Why Single-Page App Pattern?
- All modules are tightly integrated (e.g., Pipeline references Sequences)
- State preservation matters (don't lose form input on navigation)
- Faster transitions feel like a SaaS app

### Why localStorage instead of database?
- MVP / no-backend constraint
- Demo-friendly (no setup needed)
- Easy migration path to Supabase later
- Trade-off: no multi-device sync

### Why Zustand over Redux/Context?
- Less boilerplate
- Better TypeScript inference
- Built-in persist middleware
- Smaller bundle size

### Why Gemini as primary AI?
- Generous free tier (15 req/min, 1500/day)
- Native JSON response format
- Fast responses (<2s typically)
- Better than GPT-3.5 for structured output

### Why TTL on trending topics?
- Keep content fresh without unlimited API calls
- 48 hours = good balance for B2B content cycles
- User can manually refresh anytime

---

## File Reference Quick Index

| Need to... | Edit this file |
|------------|----------------|
| Add a new page | `src/pages/[name].tsx` + `index.tsx` + `types.ts` + `Sidebar.tsx` |
| Add a new data type | `src/lib/types.ts` |
| Add a new store action | `src/lib/store.ts` |
| Add a new AI function | `src/lib/ai.ts` |
| Change AI provider | `src/pages/api/ai.ts` |
| Update design system | `src/styles/globals.css` + `tailwind.config.js` |
| Add a new archetype | `src/lib/archetypes.ts` |
| Add new static topics | `src/lib/postTopics.ts` |
| Modify persistence | `src/lib/store.ts` (partialize) |

---

## Next Steps for New Developers

1. **Read this file completely** ✓
2. **Run the app locally:**
   ```bash
   npm install && npm run dev
   ```
3. **Explore each module** by clicking through sidebar
4. **Inspect localStorage** in DevTools to see data shapes
5. **Make a small change** (e.g., update a label) to feel the workflow
6. **Read `CLAUDE.md`** for AI-assist guidelines
7. **Check `src/lib/types.ts`** to understand all data structures

---

## Glossary

- **Archetype:** A predefined lead persona (founder, sales leader, etc.) with associated pain points
- **Brief:** AI-generated lead intelligence document
- **Hook:** Opening line designed to grab attention
- **Pipeline Stage:** Where a lead is in the sales process
- **Sequence:** Multi-step email campaign with timed delays
- **TTL:** Time-To-Live (cache expiration)
- **Outcome:** Result of a sent message (replied, meeting, etc.)
- **Sales Navigator:** LinkedIn's premium prospecting tool

---

**Last Updated:** May 2026
**Version:** 2.0 (All 7 phases complete)
**Maintainer:** See git log for current maintainer
