// =============================================
// LeadHawk - Type Definitions
// =============================================

export interface LeadFilter {
  id: string;
  name: string;
  jobTitles: string[];
  industries: string[];
  companySize: string[];
  locations: string[];
  seniorityLevels: string[];
  keywords: string[];
  yearsOfExperience?: string;
  technologies?: string[];
}

export interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  industry: string;
  connections: number;
  matchScore: number;
  tags: string[];
  profileUrl: string;
  avatar?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  subject?: string;
  body: string;
  tone: 'professional' | 'casual' | 'value-driven' | 'problem-solving';
  targetRole: string;
  industry: string;
  openRate?: number;
  responseRate?: number;
  createdAt: string;
}

// Phase 4 strategic post types — each tied to a funnel objective.
// Legacy values kept in the union for back-compat with already-saved posts; the
// UI only surfaces the 4 new ones for new generation.
export type LinkedInPostType =
  | 'pain-naming'       // names an ICP pain → drives DMs
  | 'mechanism-reveal'  // shows HOW you solve → drives profile visits
  | 'proof'             // case study / before-after → drives credibility
  | 'take'              // contrarian opinion → drives followers / authority
  // Legacy (Phase 1-3 era) — read-only:
  | 'thought-leadership' | 'case-study' | 'tips' | 'story' | 'poll' | 'engagement';

export interface LinkedInPost {
  id: string;
  content: string;
  hook: string;
  hashtags: string[];
  postType: LinkedInPostType;
  /** ICP this post targets. Defaults to the user's primary positioning ICP at write time. */
  icpTag?: string;
  estimatedReach: number;
  bestTimeToPost: string;
  createdAt: string;
}

export interface GrowthPlan {
  id: string;
  week: number;
  theme: string;
  goals: string[];
  actions: GrowthAction[];
  posts: LinkedInPost[];
  targetConnections: number;
  targetImpressions: number;
}

export interface GrowthAction {
  id: string;
  type: 'post' | 'engage' | 'connect' | 'message' | 'comment';
  description: string;
  frequency: string;
  priority: 'high' | 'medium' | 'low';
  completed?: boolean;
}

export interface ProfileStats {
  profileViews: number;
  searchAppearances: number;
  postImpressions: number;
  connections: number;
  followers: number;
  weeklyGrowth: number;
}

// =============================================
// Email Sequences
// =============================================

export type SequenceStepType = 'intro' | 'value-add' | 'follow-up' | 'breakup';

export interface SequenceStep {
  id: string;
  stepNumber: number;
  type: SequenceStepType;
  subject: string;
  body: string;
  delayDays: number; // days after previous step
}

export interface EmailSequence {
  id: string;
  name: string;
  targetRole: string;
  industry: string;
  tone: 'professional' | 'casual' | 'value-driven' | 'problem-solving';
  steps: SequenceStep[];
  createdAt: string;
}

// =============================================
// Pipeline / CRM
// =============================================

export type PipelineStage =
  | 'new'
  | 'contacted'
  | 'replied'
  | 'meeting'
  | 'proposal'
  | 'closed-won'
  | 'closed-lost';

// Phase 6: extended source enum to cover the new ingestion channels.
// Legacy values ('apollo') retained for back-compat with existing leads.
export type LeadSource =
  | 'apollo' | 'linkedin' | 'manual' | 'referral' | 'inbound'
  | 'yc-jobs' | 'wellfound' | 'social-search' | 'funding-news' | 'warm-intro';

/** Phase 5: every stage transition is timestamped so the dashboard can
 *  derive honest metrics (calls booked, proposals sent, conversion rates,
 *  "what's stuck") without a separate event log. */
export interface StageTransition {
  stage: PipelineStage;
  at: string;
}

export interface PipelineLead {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  email: string;
  industry: string;
  source: LeadSource;
  stage: PipelineStage;
  notes: string;
  lastContacted?: string;
  nextFollowUp?: string;
  sequenceId?: string;      // linked email sequence
  currentStep?: number;     // which step they're on
  aiSuggestedAction?: string;
  /** ICP this lead belongs to. Drives the Authority Gap calculation. */
  icpTag?: string;
  /** Phase 5: every stage transition timestamped. Initialized on add, appended on move. */
  stageHistory?: StageTransition[];
  /** Phase 5: proposal value when stage = proposal. Drives revenue projections. */
  proposalAmount?: number;
  /** Phase 5: actual closed amount when stage = closed-won. Drives Revenue Closed KPI. */
  dealAmount?: number;
  /** Phase 7: pre-call brief generated when the lead enters `meeting`. */
  discoveryBrief?: DiscoveryBrief;
  /** Phase 7: post-call debrief filled by the user after the meeting. */
  callDebrief?: CallDebrief;
  /** Phase 7: 1-page proposal Markdown — generated from the debrief. */
  proposal?: Proposal;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// Discovery Call Framework (Phase 7)
//
// Three artifacts attached to a single lead — they form a chain:
//   meeting-stage transition → DiscoveryBrief → CallDebrief → Proposal.
// Storing them on the lead (not as separate collections) keeps the data
// model flat: one lead = one brief + one debrief + one proposal at most.
// =============================================

export interface DiscoveryCallPhase {
  phase: string;       // e.g. "Discovery questions"
  minutes: number;     // e.g. 8
  goal: string;        // what the user is trying to learn / land
}

export interface DiscoveryObjection {
  objection: string;   // what they'll likely say
  handling: string;    // how to respond — 1-2 sentences
}

export interface DiscoveryBrief {
  generatedAt: string;
  topPriorities: string[];               // 2-3 sourced priorities for THIS lead
  discoveryQuestions: string[];          // 5 questions in the lead's language
  likelyObjections: DiscoveryObjection[]; // 2 objections + handling
  mechanismConnection: string;           // how user's positioning solves their pain
  callStructure: DiscoveryCallPhase[];   // 4 phases summing to ~15-20 min
}

export interface CallDebrief {
  completedAt: string;
  // BANT — each pillar has a confirmed flag + free-text notes
  painConfirmed: boolean;
  painNotes?: string;
  budgetConfirmed: boolean;
  budgetNotes?: string;
  decisionMakerConfirmed: boolean;
  decisionMakerNotes?: string;
  timelineConfirmed: boolean;
  timelineNotes?: string;
  // Outcome
  objectionRaised?: string;
  nextStep: string;
}

export interface Proposal {
  generatedAt: string;
  markdown: string;     // the assembled 1-page proposal, ready to paste into Notion/Docs
  scope: string;
  milestones: { title: string; deliverable: string; days: number }[];
  price: number;        // in user's currency (assume USD until i18n)
  timeline: string;
  riskReversal: string; // e.g. "Money-back if Milestone 1 not delivered in 14 days"
}

// =============================================
// Lead Intelligence Engine
// =============================================

export type LeadArchetype =
  | 'founder_ceo'
  | 'marketing_leader'
  | 'sales_leader'
  | 'agency_owner'
  | 'engineering_manager'
  | 'product_manager'
  | 'freelancer_creator'
  | 'operations_leader'
  | 'other';

export interface ArchetypeProfile {
  archetype: LeadArchetype;
  label: string;
  commonPains: string[];
  toneGuidelines: string;
  hookPatterns: string[];
  avoidList: string[];
}

// =============================================
// Lead Research (Phase 2 — replaces LeadBrief)
//
// Sources are user-pasted real artifacts (LinkedIn posts, news links, etc.)
// Hooks are AI synthesis tied back to the source that justifies them.
// =============================================

export type ResearchField =
  | 'recent-posts'
  | 'recent-comments'
  | 'company-priority'
  | 'recent-news'
  | 'mutual-connections'
  | 'job-posting'
  | 'other';

export interface LeadResearchSource {
  id: string;
  field: ResearchField;
  content: string;     // user-pasted text or URL
  url?: string;        // canonical URL when applicable
  capturedAt: string;  // when the user pasted this source
  postedAt?: string;   // when the underlying content was published (LinkedIn post date,
                       // article date, etc.). Drives recency filtering in the composer —
                       // sources older than ~30 days get deprioritised.
}

export interface LeadResearchHook {
  text: string;
  sourceFieldIds: string[]; // ties back to source IDs that justify this hook
}

export interface LeadResearch {
  id: string;
  leadName: string;
  leadCompany?: string;
  leadRole?: string;
  linkedinUrl?: string;
  archetype: LeadArchetype;
  sources: LeadResearchSource[];
  // AI synthesis — re-generated when user re-runs synthesis
  summary: string;
  hooks: LeadResearchHook[];
  bestApproach: string;
  redFlags: string[];
  synthesizedAt?: string;     // last time AI was run
  createdAt: string;
  updatedAt: string;
}

// =============================================
// Intent Signals (Phase 2)
//
// Real, time-stamped events that suggest a lead is in-market right now.
// Freshness is computed from `occurredAt` — < 72h glows.
// =============================================

export type IntentSignalType =
  | 'job-posting'        // they're hiring for a role we can help with
  | 'funding'            // raised a round
  | 'product-launch'     // shipped something
  | 'social-pain'        // posted about a pain point
  | 'social-hiring'      // posted "looking for ___"
  | 'github-activity'    // recent issue/PR/release
  | 'press-mention'      // article/podcast/news
  | 'other';

export interface IntentSignal {
  id: string;
  // Either leadId OR watchlistAccountId — one signal can attach to either
  leadId?: string;
  watchlistAccountId?: string;
  type: IntentSignalType;
  title: string;            // human-readable summary
  content: string;          // raw pasted snippet/quote (max ~1KB)
  url?: string;             // source URL
  occurredAt: string;       // when the signal happened in real life (best guess)
  capturedAt: string;       // when the user added it
}

// =============================================
// Watchlist (Phase 2.3)
//
// Manual list of target accounts the user checks daily.
// Discipline > automation: just list them, not auto-monitor.
// =============================================

export interface WatchlistAccount {
  id: string;
  companyName: string;
  industry?: string;
  url?: string;            // homepage or LinkedIn company page
  notes?: string;
  lastCheckedAt?: string;  // when user last manually reviewed this account
  createdAt: string;
}

// =============================================
// X / Twitter Growth
// =============================================

export interface Tweet {
  id: string;
  content: string;
  hook: string;
  postType: 'single' | 'thread-part' | 'reply';
  /** ICP this tweet targets. */
  icpTag?: string;
  estimatedEngagement: number;
  createdAt: string;
}

export interface TwitterThread {
  id: string;
  hook: string;          // First tweet (hook line)
  setup: string[];       // 2-3 tweets building context
  insights: string[];    // 3-5 tweets with actionable insights
  cta: string;          // Final call-to-action tweet
  threadType: 'educational' | 'story' | 'tips' | 'debate' | 'thread';
  /** ICP this thread targets. */
  icpTag?: string;
  estimatedReach: number;
  createdAt: string;
}

export interface TwitterGrowthPlan {
  id: string;
  week: number;
  theme: string;
  goals: string[];
  actions: TwitterAction[];
  suggestedTopics: string[];
  targetFollowers: number;
  targetEngagementRate: number;
}

export interface TwitterAction {
  id: string;
  type: 'tweet' | 'reply' | 'retweet' | 'space' | 'follow' | 'engage';
  description: string;
  frequency: string;
  priority: 'high' | 'medium' | 'low';
  completed?: boolean;
}

// =============================================
// Outreach Components (Phase 3)
//
// Every outbound message MUST contain 4 elements. The AI emits them as
// labeled fields so the user learns the structure over time, instead of
// being given a single opaque blob with no failure mode.
// =============================================

// 'product' = classic 4-component DM with an earned-right pitch line. Good for
//              SaaS / product-led sales.
// 'services' = help-shaped opener — acknowledge what they're building and offer
//              concrete free value (teardown, second pair of eyes). Better fit
//              for agencies, freelancers, consultants where the product IS the
//              help. Same 4 fields but the model fills them very differently.
export type OutreachMode = 'product' | 'services';

export interface OutreachComponents {
  specificReference: string;     // grounded in a real research source
  patternInterrupt: string;      // a question, admission, or sharp observation
                                 // (services mode: warm acknowledgement of what they're building)
  earnedRight: string;           // one sentence of proof (positioning + proof asset)
                                 // (services mode: concrete help offer / free value)
  lowFrictionAsk: string;        // small ask — NOT "hop on a 30-min call"
                                 // (services mode: permission-framed ask, "if useful", "no pressure")
  sourceFieldIds: string[];      // research source IDs the reference cites
  assembledMessage: string;      // the four parts joined into a sendable message
  mode?: OutreachMode;           // which prompt produced this — drives label rendering
                                 // and allows future re-generation in the same mode
}

// =============================================
// Send-Readiness Check
// =============================================

export interface CheckResult {
  ok: boolean;
  reason?: string;
}

export interface SendReadinessReport {
  underLengthLimit: CheckResult;
  hasSpecificReference: CheckResult;
  noBannedPhrases: CheckResult;
  doesNotStartWithI: CheckResult;
  ctaIsLowFriction: CheckResult;
  /** Convenience: number of checks passed. */
  passed: number;
  /** Total number of checks (always 5). */
  total: number;
}

// =============================================
// Reply Coach
// =============================================

export type ReplyClassification =
  | 'interested'
  | 'objection-price'
  | 'objection-timing'
  | 'objection-fit'
  | 'objection-trust'
  | 'referral-out'
  | 'polite-no'
  | 'ghosting-risk'
  | 'other';

export interface ReplyPlaybookOption {
  label: string;          // e.g. "Acknowledge + reframe"
  approach: string;       // 2-3 sentences of strategy
  exampleMessage: string; // a draft the user can copy
  tradeoff: string;       // why a user might NOT pick this
}

export interface ReplyAnalysis {
  classification: ReplyClassification;
  confidence: number;     // 0-1
  reasoning: string;      // 1-2 sentences justifying the classification
  playbook: ReplyPlaybookOption[]; // 2-3 strategic options
}

// =============================================
// Outcome Tracking & Analytics
// =============================================

export interface MessageOutcome {
  id: string;
  messageId?: string;
  leadName: string;
  channel: 'linkedin' | 'email' | 'twitter';
  status: 'sent' | 'opened' | 'replied' | 'meeting_booked' | 'closed_won' | 'closed_lost' | 'no_response';
  sentAt: string;
  respondedAt?: string;
  notes?: string;
}

// =============================================
// User Positioning (the spine — drives every AI prompt)
// =============================================

export type ProofAssetType = 'github' | 'case-study' | 'demo' | 'testimonial' | 'website' | 'other';

export interface ProofAsset {
  type: ProofAssetType;
  url: string;
  label: string;
}

export interface UserPositioning {
  // Step 1 — Niche commitment
  targetRole: string;          // e.g. "VP of Engineering"
  targetCompanyType: string;   // e.g. "Series A B2B SaaS, 20-80 engineers"

  // Step 2 — Painful problem
  painfulProblem: string;      // problem in their words

  // Step 3 — Mechanism
  mechanism: string;           // how you solve it (specific, not "I code well")

  // Step 4 — Outcome with numbers
  outcomeMetric: string;       // e.g. "30% reduction in CI/CD wait time"
  outcomeTimeframe: string;    // e.g. "within 6 weeks"
  outcomeIsProjected: boolean; // true if user has no past results

  // Step 5 — Proof
  proofAssets: ProofAsset[];   // at least one required

  // Step 6 — Anti-positioning
  notFor: string;              // who you turn away

  // Metadata
  version: number;             // bump on schema changes
  lastUpdated: string;
}

export interface TemplateStats {
  templateId: string;
  templateName: string;
  channel: 'linkedin' | 'email' | 'twitter';
  sent: number;
  opened: number;
  replied: number;
  replyRate: number;
  meetingRate: number;
  closeRate: number;
}

export type NavPage = 'leads' | 'linkedin-growth' | 'sequences' | 'pipeline' | 'twitter-growth' | 'analytics' | 'templates' | 'positioning' | 'watchlist' | 'channels';

// =============================================
// Warm Intros (Phase 6.2)
//
// People you already know — past colleagues, ex-clients, mutuals — who get
// ignored when the user spends 100% of their time on cold outbound. The
// tracker is intentionally simple: name, relationship, last touched. The
// discipline is in the touching, not the data model.
// =============================================

export interface WarmContact {
  id: string;
  name: string;
  relationship: string;       // "ex-colleague at Acme", "client 2024", "mutual via Sarah"
  channel?: string;           // "LinkedIn", "WhatsApp", "Email" — where you reach them
  url?: string;               // their LinkedIn or contact page
  notes?: string;             // why they matter
  lastTouchedAt?: string;     // when you last reached out
  createdAt: string;
}
