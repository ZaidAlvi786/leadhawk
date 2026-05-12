# LeadHawk v2 — User Guide

> A 30-day playbook for landing your first paying client with LeadHawk.

This guide is opinionated on purpose. The tool itself is opinionated — positioning gates every generator, the AI refuses to invent facts, the dashboard hides vanity metrics. The guide is how you make those opinions work for you.

---

## Table of contents

1. [What LeadHawk is (and what it isn't)](#what-leadhawk-is-and-what-it-isnt)
2. [Setup — 15 minutes](#setup--15-minutes)
3. [The first thing you do: Positioning Setup — 25 minutes](#the-first-thing-you-do-positioning-setup--25-minutes)
4. [Daily routine — 20 minutes](#daily-routine--20-minutes)
5. [Weekly routine — Monday, 15 minutes](#weekly-routine--monday-15-minutes)
6. [End-to-end workflows](#end-to-end-workflows)
   - [A. Cold prospect → closed deal](#a-cold-prospect--closed-deal-the-main-loop)
   - [B. Hot signal capture (funding / job posting / pain post)](#b-hot-signal-capture)
   - [C. Reply arrived — what now](#c-reply-arrived--what-now)
   - [D. Meeting scheduled → proposal](#d-meeting-scheduled--proposal)
   - [E. Writing a post that drives DMs](#e-writing-a-post-that-drives-dms)
7. [Module reference](#module-reference)
8. [The 5 rules that matter](#the-5-rules-that-matter)
9. [Troubleshooting](#troubleshooting)
10. [Your first 30 days](#your-first-30-days)

---

## What LeadHawk is (and what it isn't)

**LeadHawk is a closed-loop lead acquisition system for solo operators.** It connects four flows that usually live in five different tools:

1. **Positioning** — your sharp commitment to who you serve and what you do
2. **Pipeline + research** — the leads you're working, with real artifacts attached to each
3. **Outreach + replies** — structured messages with send-readiness checks, plus a coach for when they reply
4. **Discovery → proposal** — pre-call brief, BANT debrief, 1-page Markdown proposal

It tries to replace: Sales Navigator + Apollo + a notes app + a CRM + a half-built spreadsheet of warm intros + the email tool you use to compose drafts.

### What it *won't* do for you

- **Land your first client.** That's you. The tool tightens the loop; it doesn't run it.
- **Scrape LinkedIn or X.** Every channel module is paste-and-classify. You do the looking; the app does the structuring. The discipline is the point.
- **Auto-send anything.** No outbound automation, no auto-DM, no auto-follow. You copy-paste into LinkedIn / your email tool / Notion.
- **Invent facts about real prospects.** Every prompt is wired so the AI refuses to fabricate. If sources are thin, you get fewer (or zero) hooks — by design.
- **Tell you what you want to hear.** The Weekly Truth Review names *your* behavior when numbers drop, not the market.

### What it deliberately does

- Forces you to commit to a positioning before unlocking generators
- Makes you paste real artifacts before generating outreach (no fake "I noticed you recently…")
- Shows you the gap between leads you're working and posts you're writing (Authority Gap)
- Hides vanity metrics (messages sent, posts generated) — surfaces only the metrics that predict revenue (calls booked, proposals sent, deals closed)
- Names what's stuck in your pipeline so you see it rot instead of imagining it's healthy

---

## Setup — 15 minutes

### 1. Install

```bash
git clone <repo-url>
cd leadhawk
npm install
```

### 2. Get an AI key

You need **one** of these:

- **Google Gemini** (recommended — free tier is 15 req/min, 1500/day). Get a key at https://aistudio.google.com/apikey
- **OpenRouter** (fallback, cycles through free models when Gemini fails). Get a key at https://openrouter.ai/keys

### 3. Create `.env.local`

Copy `.env.example` to `.env.local` and fill in your key:

```bash
cp .env.example .env.local
```

Open `.env.local` and set `GOOGLE_API_KEY=...` (or `OPENROUTER_API_KEY=...`).

### 4. Supabase (optional, for multi-device sync)

If you only ever use the app on one browser, skip this. Your data stays in localStorage.

If you want to sync between devices:

1. Create a free Supabase project at https://supabase.com
2. Project Settings → API → copy the URL and the anon key into `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. Supabase dashboard → SQL Editor → paste the contents of `supabase/migrations/001_initial_schema.sql` → Run
4. Confirm in the Tables tab that 9 tables exist, and in Authentication → Policies that every table has 4 RLS policies

You'll trigger the first migration later from inside the app (`/analytics` → Sync panel → First-time migrate).

### 5. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000.

If you set up Supabase, sign up at `/login`. If not, you can skip the auth flow — every page works against localStorage by default.

---

## The first thing you do: Positioning Setup — 25 minutes

The moment you open the app for the first time, a wizard blocks you with **6 mandatory steps**. You can't skip it. Every generator in the app refuses to run until this is locked in.

Block 25 minutes. The cost of vague answers here is months of vague outreach later.

### Step 1 — Niche commitment

> *"I help [SPECIFIC ROLE] at [SPECIFIC COMPANY TYPE]."*

**Good:** "VP of Engineering at Series A B2B SaaS, 20-80 engineers"

**Bad:** "Founders / CEOs / VPs at companies of all sizes in various industries"

The validator rejects words like *"businesses", "companies", "anyone", "various", "etc."* and lists with more than 2 commas. If you can't be specific here, you can't be specific anywhere.

### Step 2 — Painful problem

> *"They hire me when they're struggling with [SPECIFIC PROBLEM that costs them money/time/sleep]."*

**Good:** "Their CEO yells at them every Monday because the analytics dashboard hasn't shipped in 5 weeks and engineering can't say why."

**Bad:** "They struggle with productivity and growth."

The validator rejects vague problems ("growth", "efficiency", "optimization"). Write it in *their* language — what they'd actually say to a friend at 11pm on a Tuesday.

### Step 3 — Mechanism

> *"I solve it by [SPECIFIC APPROACH THAT IS DIFFERENT FROM JUST 'I CODE WELL']."*

**Good:** "A 2-week diagnostic where I trace every customer signup through the funnel and flag the 3 highest-drop-off events with code-level fixes."

**Bad:** "I bring deep expertise and best practices to deliver world-class results."

### Step 4 — Outcome with numbers

> *"Typically achieving [QUANTIFIED RESULT] within [TIMEFRAME]."*

**Good:** "40% drop in customer onboarding time, within the first 90 days"

The validator requires at least one digit. If you've never measured this on a real client, **check the "projected" box** — the AI will surface `(projected)` everywhere this outcome appears.

### Step 5 — Proof asset

You must paste at least one URL: GitHub repo, case study, demo video, testimonial, or website. **No proof = no progress past this step.**

If you genuinely have nothing yet, build it this week. A 5-minute Loom walkthrough of a side-project counts. The wizard surfaces a "build one this week" nudge with zero proof.

### Step 6 — Anti-positioning

> *"I am NOT for [WHO YOU TURN AWAY]."*

Almost no beginner writes this. It's what makes the rest credible.

**Good:** "Pre-product startups with no engineering team, agencies looking for white-label labour, anyone whose first question is 'what's your hourly rate'."

**Bad:** "I'm flexible and happy to work with anyone."

### After you commit

You see your positioning on `/positioning`. A compact banner shows on every generator page — *"VP of Engineering @ Series A B2B SaaS · 30% reduction in CI time"* — as a constant reminder of what you committed to. You can edit anytime.

---

## Daily routine — 20 minutes

Your morning loop. Do it before you check Slack.

### 1. Open `/pipeline` (5 min)

Three things demand your attention there:

**Authority Gap banner** (top) — fires when you have active leads in an ICP but haven't posted to that ICP recently. *"You have 14 active leads in ICP=Series A SaaS Founder but haven't posted to that ICP in 9 days."* If you see it, generate a post (the button takes you straight to the LinkedIn Post Generator with the right type).

**Daily Action Queue** (below the banner) — auto-recommendations:
- Follow-ups due today
- Leads in "contacted" without a sequence linked
- Meetings to prep for

**What's Stuck** (on `/analytics` — same data, different view) — leads that have rotted:
- Replied >3 days ago (you owe them a move)
- In meeting stage >7 days (call probably didn't happen)
- In proposal stage >5 days (follow up or close-lost)

Act on every item before generating new outreach. **Old leads have higher conversion than new leads.**

### 2. Scan your `/watchlist` (5 min)

You added 20–50 target accounts during setup (or you should — go do that now if you haven't). The watchlist tells you which haven't been checked in the last 24 hours.

For each stale account, spend 30 seconds on their LinkedIn / Twitter / company blog. If you find anything notable, click "Add signal" on their watchlist row and paste it. Hot signals (less than 72 hours old) will glow on the card — and on any pipeline lead from the same company.

### 3. Add new leads (5-10 min)

Two paths:

**Direct add** — `/pipeline` → "+ Add lead" form
**Channel capture** — `/channels` → paste a YC job, a Wellfound posting, a "looking for X" social post, or a funding announcement. The app parses what it can and creates a pipeline lead tagged with the right source.

Whenever you add a lead, **immediately** also add Lead Research (the next step). Cold contact-info is worthless without an artifact to reference.

### 4. Touch 1-2 warm contacts (3-5 min)

Open `/channels` → Warm Intros tab. The list is sorted with never-touched and most-stale at the top. Send a real, no-ask message to one of them. Click "Touched" when done.

Warm intros convert ~10x better than cold DMs. Skipping this step is the #1 reason beginners take 6 months to land their first client.

### Outbound work is what's LEFT after the loop above

If you have 10 minutes after the daily loop, send 1-3 cold outreach messages to fresh leads (after creating research entries for them). 1-3 per day, not 50. The brief is explicit: quality > volume.

---

## Weekly routine — Monday, 15 minutes

The **Weekly Truth Review** auto-opens on Mondays (once per browser per ISO week).

It shows:
- Last week's KPIs vs the week before, side by side, with deltas
- A button: "Get the diagnosis"

The diagnosis is the actual point. Click it. The AI reads your numbers and produces three fields:

- **What happened** — citing the real numbers (no platitudes)
- **Likely cause** — pointed at *your behavior*, not market conditions (because that's the part you can change)
- **One action this week** — a single concrete behavior change

Read it honestly. The advice is usually uncomfortable — that's the signal.

If you miss Monday or want to re-open it any day, there's a "Weekly review" button next to the range selector on `/analytics`.

---

## End-to-end workflows

The five flows that cover ~90% of what you'll do.

### A. Cold prospect → closed deal (the main loop)

This is the chain from "I found a name" to "they paid me." Every step gates the next.

**1. Capture the lead.** Either via `/channels` paste-and-classify, or `/pipeline` → "+ Add lead". Set the source tag, leave at `new` stage.

**2. Research before messaging.** Open `/leads` → "Lead Research" tab. Paste:
- 1–3 of their recent LinkedIn or X posts
- A comment they made on someone else's post
- Their company's homepage priority statement
- Any recent funding / hiring / launch news
- Optionally: mutual connections worth name-dropping

Click "Save & Synthesise Hooks". The AI reads what you pasted and outputs 1–5 hooks, **each tagged with the source it cites**. Hover over a hook to see which artifact it draws from. *If sources are thin, you get fewer hooks. By design.*

**3. Generate outreach.** Open the "Outreach Composer" tab. Pick the research entry. Click "Generate Outreach Components". You get a 4-part message:

- **Specific reference** — grounded in your research (cited)
- **Pattern interrupt** — a question or sharp observation that breaks the "another DM" frame
- **Earned right** — one sentence of proof from your positioning
- **Low-friction ask** — NOT "30-min call". Something like "worth me sending the 2-min loom?"

Below the components: a **Send-readiness panel** with 5 checks:
- Under 300 chars
- Specific reference cites a source
- No banned phrases (`hope this finds you well`, `circle back`, `synergy`, etc.)
- Doesn't start with "I"
- Low-friction CTA

If any check fails, fix it (the components are editable inline) or override consciously.

**4. Send.** Copy the assembled message. Paste into LinkedIn or your email tool. You sent it; the app didn't.

**5. Move the lead to `contacted`.** On `/pipeline`, drag the lead forward or use the chevron buttons. If the lead has an email and no sequence linked, a dialog asks if you want to start one.

**6. When they reply — Reply Coach.** Open `/leads` → "Reply Coach" tab. Paste the reply (+ optionally your original message + lead context). The AI classifies it into one of 9 types (interested / objection-price/timing/fit/trust / referral-out / polite-no / ghosting-risk / other) and gives you 2–3 strategic options for the next move, each with approach + sample message + tradeoff. Pick on purpose.

**7. Move to `replied` → `meeting`.** Once they agree to a call.

**8. Discovery → debrief → proposal.** See workflow D below.

**9. After they pay.** Move to `closed-won`, enter the dollar amount when prompted. Revenue shows up on `/analytics` and the deal counts toward your conversion rates.

### B. Hot signal capture

You spotted something: a Series B funding announcement, a YC job posting that screams *"they need help with X"*, a tweet where someone says they're stuck on the exact problem you solve.

**1. Open `/channels`.** Pick the matching tab: YC Jobs, Wellfound, "Looking for X" posts, or Funding announcements.

**2. Paste.** The regex parsers extract what they can — company, role, amount, stage, URL. You fill the rest.

**3. Click "Add to pipeline".** The lead drops in with the matching source tag (`yc-jobs`, `funding-news`, etc.) and an attached intent signal so the freshness is computed correctly.

**4. Immediately add research.** Switch to `/leads` → Lead Research, paste the URL of the signal as a source, plus any context (the funding announcement copy, the job description excerpt).

**5. Send within 48 hours.** Hot signals decay. The `/pipeline` card glows amber for fresh signals (<72h) and dims for old ones (>60d). Don't let a hot signal go cold.

### C. Reply arrived — what now

Don't reply on autopilot. Even a "polite no" might be a "yes if you reframe".

**1. Open `/leads` → Reply Coach.**

**2. Paste fields:**
- Lead name / role / company (optional but helpful)
- Your original message (optional — gives the classifier context)
- **Their reply, verbatim** (required)

**3. Click "Classify + Get Options".**

**4. Read the classification + reasoning.** The AI tells you what bucket it sees the reply in (e.g. "objection-trust, 75% confidence") and quotes specifics from their reply.

**5. Review the 2–3 playbook options.** Each has:
- **Approach** — 2-3 sentences of strategy
- **Sample message** — a draft reply you can edit
- **Tradeoff** — when you might NOT want to pick this option

**6. Pick on purpose. Edit the sample. Copy. Send.**

The sample messages are run through the same send-readiness checks as outbound (with the source-reference check suppressed — it's a reply, not a cold open).

### D. Meeting scheduled → proposal

The chain from "they agreed to talk" to "I sent the proposal."

**1. Lead is in `meeting` stage on `/pipeline`.** A `Mic` button appears on the card. It's purple when no debrief exists.

**2. Click the Mic button.** The Meeting Prep Dialog opens.

**3. Pre-call brief** (auto-generates on first open). Contains:
- Top priorities (sourced from research + signals — *not invented*)
- 5 discovery questions in *their* language
- 2 likely objections with handling
- How your mechanism connects to their pain
- A 4-phase call structure summing to ~18 min (for a 20-min call)

Read it before the call. **If sources are thin, the brief is thin.** Add more research first if you need a sharper brief.

**4. Have the call.** Listen 80% of the time. Use the discovery questions verbatim. Confirm BANT.

**5. After the call: fill the debrief.** Open the dialog again, click "Post-call debrief". Tick the four BANT pillars (Pain / Budget / Decision-maker / Timeline) for what was *actually* confirmed. Add notes for what was hinted. Write the **next step agreed** (required field).

The BANT verdict updates live:
- 4/4: "All clear — proposal is the right next move."
- 3/4: "Strong fit. Worth asking one more clarifying question over email before the proposal lands."
- 2/4: "Half-qualified. Proposal will likely stall. Schedule a 15-min follow-up to close the gaps."
- 1/4: "Weak signal. Sending a proposal now wastes their time and yours. Re-qualify or close-lost."
- 0/4: "Not qualified. Either the call didn't happen or this isn't a real prospect — log debrief honestly."

The Mic button on the pipeline card now turns amber and shows the BANT score as a badge.

**6. Generate the proposal.** Switch to the "Proposal" tab in the dialog. It's gated until `painConfirmed` + `nextStep` are set. Once unlocked, click "Generate proposal".

You get:
- Scope (2-3 sentences from the debrief)
- 2-4 milestones with deliverables + days
- Price (anchored to anything you negotiated on the call)
- Timeline
- **Risk reversal** (specific — e.g. *"Money back if Milestone 1 not delivered in 14 days"*)
- The full **Markdown** assembled into a 1-page proposal

**7. Copy the Markdown.** Paste it into Notion, Google Docs, or your proposal tool. Edit there.

**8. Move the lead to `proposal` stage.** When prompted, enter the proposal amount (drives revenue projection on `/analytics`).

**9. Closed-won.** When they say yes, click the **W** button on the card. Enter the final deal amount. Revenue appears on `/analytics`. The deal counts toward your conversion rates.

The Mic button turns green to mark the chain complete.

### E. Writing a post that drives DMs

You don't write LinkedIn posts to look smart. You write them to make cold DMs convert better — by being someone the prospect has *already heard of* with a *credible angle*.

**1. Open `/linkedin-growth` → Post Generator tab.**

**2. Pick a strategic post type** (top of form). Four choices, each tied to a funnel objective:

- 😣 **Pain-naming** — names a specific problem your ICP feels and is too proud to admit. Drives DMs.
- 🔧 **Mechanism reveal** — shows *how* you solve a specific problem with a concrete example. Drives profile visits.
- 🏆 **Proof** — before/after, case study, screenshot. Drives credibility for cold DMs.
- 🔥 **Take** — a strong contrarian opinion in your niche. Drives followers and authority signal.

**3. Target ICP picker.** Defaults to your primary ICP. If you target multiple, pick the right one — the post is tagged so the Authority Gap math knows which audience you've fed.

**4. Pipeline Topic Picker.** A panel below the type selector asks: *"What did your last 5 prospects struggle with?"* It surfaces topic candidates from your actual pipeline (freshest intent signals → research summaries → lead notes). Pick one. Click it. Both the topic field and a `pipelineContext` field populate.

(If your pipeline is thin, you can fall back to the curated 300-topic library by clicking *"Browse curated topic library"*. Real prospect topics almost always perform better.)

**5. Click Generate.** The post comes back with a hook line + body + hashtags + (optional) a generated image card.

**6. Edit if needed. Click "Post to LinkedIn"** — opens LinkedIn's composer with the content pre-filled. (If the post is too long for URL-encoding, it copies to clipboard so you can paste.)

The post is saved with its `postType` and `icpTag` so it counts toward the Authority Gap math.

---

## Module reference

Quick reference for every page.

### `/positioning`

Your committed positioning. Read view + Edit button. Anything generated by the app gets your positioning injected into its system prompt — so every output stays aligned with your commitment.

### `/leads`

Four tabs:

- **Filter Builder** — Sales Navigator filter generator. Click "Open in Sales Nav" to launch a search with your filters applied. Use sparingly — see the Sales Nav Honesty panel at the top.
- **Lead Research** — paste real artifacts about a specific person, get grounded hooks. The starting point for any outreach.
- **Outreach Composer** — generates the 4-part message structure. Requires a research entry first.
- **Reply Coach** — paste a reply, get classification + 2-3 playbook options.

### `/pipeline`

Your CRM. 5 active stages (new / contacted / replied / meeting / proposal) + closed-won/lost at the bottom. Each card shows:
- Name + company
- Source tag, days-ago, follow-up-due flag
- ICP tag (compact picker — click to retag)
- Freshest intent signal (glows amber if <72h, dimmed if >60d)
- $ proposal/won amounts when applicable
- Action buttons: ← →, contacted, sequence start, notes, signal editor, **Mic** for meeting prep (when in meeting stage), AI suggest, W/L

Top of page: Authority Gap banner + Daily Action Queue + the kanban + closed-won list.

### `/channels`

Three sections + 4 capture tabs:

- **Sales Nav Honesty panel** (top) — ranked channel recommendations for your positioning
- **Channel Mix Coach** — your cold/warm/inbound ratio vs the 30/30/40 ideal
- **Capture tabs**:
  - YC Work-at-a-Startup — paste a job URL/snippet
  - Wellfound (AngelList) — same
  - "Looking for X" social posts — paste a LinkedIn/X post where someone said they're hiring or struggling
  - Funding announcements — paste a Crunchbase/TechCrunch headline
- **Warm Intros** — tracker for past colleagues, ex-clients, mutuals. Per-row staleness coloring. *Touch 2-3 per week minimum.*

### `/watchlist`

20–50 target accounts you check daily. Add via the form. Hot signals glow. The daily banner counts accounts not checked in >24 hours. "Mark checked" button per row.

### `/linkedin-growth`

Two tabs:

- **Growth Plan** — 4/8/12-week strategy generator
- **Post Generator** — the 4 strategic post types + pipeline topic picker + image generator

Authority Gap banner here too — click it to jump straight into post generation for the gapped ICP.

### `/twitter-growth`

X / Twitter equivalents of the LinkedIn module:
- Tweet generator (single / thread-starter / reply)
- Thread builder (5 types)
- Growth plan generator

### `/sequences`

Email sequence builder. 3-5 step sequences with timed delays. Link to pipeline leads — when a lead moves to `contacted`, you're prompted to start a sequence.

### `/analytics`

The honest dashboard. Top row: 7 KPIs (Calls Booked / Proposals Sent / Deals Closed / Revenue Closed / Reply→Call / Call→Proposal / Proposal→Closed). Below: Authority Gap, Channel Mix Coach, What's Stuck panel, Sync panel.

Range selector (top right): This week / Last week / This month / Last month. Deltas vs the previous period show on every KPI.

Weekly Truth Review button — auto-fires on Mondays.

Vanity metrics (post counts, sequence counts) are demoted to a collapsible "Detailed Activity" section at the bottom, labeled honestly.

### `/templates`

Reusable message templates library. Filter by tone, role, industry. New templates default to 0% response rate ("no data yet") — Phase 5 will populate real numbers once you've cycled enough leads through closed-won/lost.

---

## The 5 rules that matter

These aren't UX guidelines. They're the strategy embedded in the product.

### 1. **No fabrication.** Ever.

If the AI invents a fact — a "recent post they made", a "case study with a similar client", a number you didn't measure — that's a bug, not a feature. Flag it, edit the prompt, or just don't use that output.

The whole architecture is built around this: positioning gates generators, research requires real sources, every hook cites a source ID, every banned phrase is checked at the boundary, and projected outcomes are labeled `(projected)` everywhere.

### 2. **Quality > volume.**

The brief was explicit: target 5–10 outreach messages per day, not 100. The send-readiness panel deliberately makes a bad message visibly bad at compose time — you can override, but the failure stays visible.

Most people fail at cold outreach not because they sent too few, but because they sent too many with no specificity. Reverse the ratio.

### 3. **Inbound and outbound are one system.**

Posts feed cold DMs. Cold DMs find people who recognized you from posts. The Authority Gap banner is literally this rule made visible. If you have leads in ICP X and haven't posted to ICP X recently, fix the gap before sending more cold messages.

### 4. **BANT or don't propose.**

The proposal generator is gated. Without confirmed pain + a written next step, you don't get a proposal. This is a feature: sending proposals to half-qualified leads is the #1 way to waste a week.

### 5. **Track the truth.**

The dashboard hides "messages sent" and "posts generated" because those numbers lie. They don't predict revenue. What predicts revenue: calls booked, proposals sent, deals closed. If those are zero, you don't have a content problem — you have a sales problem. Read the Weekly Truth Review honestly.

---

## Troubleshooting

### "Generation failed — check API keys"

Open `/api/ai` in your browser DevTools Network tab. Look at the response. Common causes:
- `GOOGLE_API_KEY` not set → set it in `.env.local`, restart dev server
- Gemini quota hit → set `OPENROUTER_API_KEY` as fallback
- Both providers failing → check both keys at https://aistudio.google.com/apikey and https://openrouter.ai/keys

### "Generators are disabled" — Positioning gate

You haven't completed the Positioning wizard. Open `/positioning` and finish all 6 steps. The Next button only enables when validators pass.

### "Sync had N errors" — SyncPanel

Open the per-entity error rows. Common causes:
- Missing tables → run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor
- RLS policies missing → re-run the migration (the `do $$ ... $$` block recreates policies)
- Wrong project → verify `NEXT_PUBLIC_SUPABASE_URL` matches the project you ran the SQL against

### Lost data after clearing localStorage

If you set up Supabase before this happened: open `/analytics` → Sync → "Pull from cloud". Your data hydrates from the latest pushed snapshot.

If you didn't set up Supabase: gone. Set it up now and push.

### LinkedIn composer opens empty

LinkedIn's URL length limit was hit. The post automatically copies to clipboard — paste manually into the composer.

### Sales Navigator opens but filters don't apply

Sales Nav requires an active premium subscription. Without it, the URL opens but the filters silently fail. The brief notes this is a known constraint.

### The AI hallucinated a fact

Open the relevant prompt in `src/lib/ai.ts`. Add the specific failure case to the prompt's "NEVER" list. Or reject the output and flag it.

---

## Your first 30 days

A concrete plan. Adjust to fit your reality.

### Week 1 — Foundation

- **Day 1:** Install, set up env vars, complete the 6-step Positioning wizard. Block 90 minutes. Don't skip Step 6 (Not For).
- **Day 2:** Add 30 watchlist accounts that match your positioning. Spend an hour scrolling LinkedIn and adding companies that fit.
- **Day 3:** Add 10 warm contacts. Don't filter by "might they hire me?" — anyone who knows you well enough to take your call counts.
- **Day 4:** Touch 3 warm contacts. Real messages, no asks, just reconnecting. (Even just *"hey, what are you working on?"* counts.)
- **Day 5:** Create 5 Lead Research entries on 5 specific real people from your watchlist. Paste 2-3 real artifacts each.
- **Day 6-7:** Generate outreach for 3 of those research entries. Run send-readiness. Send them.

End of week 1 target: 30 watchlist + 10 warm contacts + 3 cold sends + 3 warm touches.

### Week 2 — Outbound + content

- **Daily:** Run the 20-min daily routine (Pipeline → Watchlist scan → 1-2 warm touches → 1-3 cold sends).
- **Mid-week:** Write 2 LinkedIn posts using the Pipeline Topic Picker. Pain-naming for one, Mechanism reveal for the other. Tag with your primary ICP.
- **End of week:** First replies should start coming in. Use the Reply Coach for every reply that isn't a clear "yes book a call".

End of week 2 target: ~10 cold messages sent total, ~5 warm touches, 2 posts published, first 1-2 replies received.

### Week 3 — First meeting

- A reply you sent through the Reply Coach turns into a scheduled call. Move that lead to `meeting` stage.
- Click the Mic button. Read the AI brief. **Practice the discovery questions out loud** before the call.
- Have the call. Listen 80%. Fill the debrief immediately after — don't trust your memory.
- If BANT is 3-4, generate the proposal. Paste the Markdown into your proposal tool. Customize. Send.
- If BANT is 0-2, the verdict tells you what to do (re-qualify or close-lost). Don't send a proposal anyway.

End of week 3 target: 1 meeting booked, 1 debrief filled, possibly 1 proposal sent.

### Week 4 — Close

- Follow up on the proposal. The proposal generator includes a "Reply with 'go' and I'll send the contract" CTA — they reply, you act.
- Move the lead through `proposal` → `closed-won` when they sign. Enter the dollar amount when prompted.
- Open `/analytics`. See your first $$$ on the dashboard. Read the Monday Truth Review.

If you don't close in week 4: that's normal. The chain works; the timing isn't always 30 days. What you need at this point is to **not stop the daily routine**. The chain compounds. Most close-rate gains happen between week 4 and week 12.

---

## The North Star

The original brief framed it like this:

> *One real, paying client. Not 10,000 messages sent. Not 50 posts generated. **One contract signed.***

Every feature in this app is built around that. Every alert is designed to make you uncomfortable when you're drifting away from it. Every metric on the dashboard is chosen to predict it.

Use the tool. Run the daily routine. Read the Monday review honestly. The infrastructure is built; what comes next is whether you do the work.

Ship.
