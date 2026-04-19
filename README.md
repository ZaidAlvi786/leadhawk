# 🦅 LeadHawk — AI Sales Intelligence Platform

> **Production-grade SaaS tool for Lead Generation + LinkedIn Growth**
> Built with Next.js 14, TypeScript, Tailwind CSS, OpenAI GPT-4o, Zustand

---

## ✨ Features

### 🎯 Lead Generation (Sales Navigator)
- **AI Filter Builder** — Describe your ideal client in plain English → AI extracts precise Sales Navigator filters
- **One-Click Open** — Filters auto-applied when opening Sales Navigator
- **Save & Manage Filters** — Store multiple filter presets for different ICP segments
- **AI Message Generator** — GPT-4o writes personalized outreach messages with 4 tone options
- **Template Library** — Save, manage, and copy high-performing message templates

### 📈 LinkedIn Growth
- **AI Growth Plan** — 4/8/12-week actionable LinkedIn monetization strategy
- **Post Generator** — 6 post types (thought leadership, case study, tips, story, poll, engagement bait)
- **One-Click Post** — Opens LinkedIn composer with full post + hashtags pre-filled
- **Post Library** — Save and manage generated posts

### ⚙️ Smart Features
- **Profile Setup** — Your profile data personalizes all AI output
- **Local Persistence** — All data saved to localStorage via Zustand persist
- **Toast Notifications** — Real-time feedback on all actions
- **Dark Premium UI** — Professional SaaS aesthetic

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd leadhawk
npm install
```

### 2. Add OpenAI API Key
Edit `.env.local`:
```
OPENAI_API_KEY=sk-your-key-here
```
Get your key at: https://platform.openai.com/api-keys

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 4. Set Up Your Profile
On first launch, the profile setup modal will appear. Fill in:
- Your name
- Your title (e.g., Full Stack Developer)
- Your service offering
- Target audience
- Skills

---

## 📁 Project Structure

```
leadhawk/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   │   └── Header.tsx           # Top header bar
│   │   ├── leads/
│   │   │   ├── LeadFilterBuilder.tsx    # Sales Navigator filter builder
│   │   │   └── MessageTemplateGenerator.tsx  # AI outreach generator
│   │   ├── linkedin/
│   │   │   ├── LinkedInPostGenerator.tsx     # AI post generator
│   │   │   └── LinkedInGrowthPlan.tsx        # Growth plan generator
│   │   └── shared/
│   │       └── ProfileSetup.tsx     # User profile configuration
│   ├── lib/
│   │   ├── types.ts                 # TypeScript interfaces
│   │   ├── utils.ts                 # Utilities + Sales Nav URL builder
│   │   ├── ai.ts                    # OpenAI API functions
│   │   └── store.ts                 # Zustand global state
│   ├── pages/
│   │   ├── api/
│   │   │   └── ai.ts                # Next.js API route for OpenAI
│   │   ├── _app.tsx
│   │   ├── _document.tsx
│   │   ├── index.tsx                # Main app shell
│   │   ├── leads.tsx                # Lead Generation page
│   │   └── linkedin-growth.tsx      # LinkedIn Growth page
│   └── styles/
│       └── globals.css              # Global styles + design tokens
├── public/
├── .env.local                       # ← Add OPENAI_API_KEY here
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🔧 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with API routes |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling |
| **Zustand** | Global state + localStorage persistence |
| **OpenAI GPT-4o** | AI message/post/plan generation |
| **Lucide React** | Icons |
| **React Hot Toast** | Notifications |

---

## 🎯 How to Use

### Lead Generation Workflow
1. Go to **Lead Generation** in sidebar
2. Click **Filter Builder** tab
3. Either:
   - **Describe** your ideal client in the AI box → click **Generate**
   - Or manually fill in job titles, industries, seniority, etc.
4. Click **Open in Sales Navigator** → filters are pre-applied
5. Find leads → come back to **Message Templates** tab
6. Enter lead's details → choose tone → **Generate AI Message**
7. Copy or edit → send on LinkedIn

### LinkedIn Growth Workflow
1. Go to **LinkedIn Growth** in sidebar
2. **Growth Plan** tab → fill in your details → Generate plan
3. Follow weekly actions in the plan
4. **Post Generator** tab → enter topic + type → Generate
5. Click **Post to LinkedIn** → opens composer with content + hashtags
6. Publish!

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | Your OpenAI API key for GPT-4o |

---

## 🛠️ Build for Production

```bash
npm run build
npm start
```

---

## 📝 Notes

- **Sales Navigator URL** — The tool builds optimal Sales Navigator URLs with filters. You need an active Sales Navigator subscription.
- **LinkedIn Post URL** — Uses LinkedIn's share API (`linkedin.com/feed/?shareActive=true`). Works with any LinkedIn account.
- **Data Storage** — All filters, templates, and posts are stored in your browser's localStorage.
- **AI Quality** — Uses GPT-4o for best results. Falls back gracefully if API key is missing.

---

## 🚀 Deployment (Vercel)

```bash
npm install -g vercel
vercel
# Add OPENAI_API_KEY in Vercel dashboard → Environment Variables
```

---

Built with 💜 using Next.js + OpenAI
