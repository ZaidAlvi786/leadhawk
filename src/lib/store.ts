import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LeadFilter, LinkedInPost, GrowthPlan, NavPage, EmailSequence, PipelineLead, PipelineStage, LeadResearch, IntentSignal, WatchlistAccount, Tweet, TwitterThread, TwitterGrowthPlan, MessageOutcome, UserPositioning, WarmContact } from './types';
import { emptyPositioning, POSITIONING_SCHEMA_VERSION } from './positioning';

export interface AppState {
  // Navigation
  currentPage: NavPage;
  setCurrentPage: (page: NavPage) => void;

  // Mobile sidebar drawer (ephemeral — not persisted)
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;

  // User profile (legacy — kept for name/title/skills used by post/tweet generators
  // until Phase 4 rewires them around positioning. `targetAudience` is superseded
  // by `userPositioning.targetCompanyType`.)
  userProfile: {
    name: string;
    title: string;
    service: string;
    targetAudience: string;
    skills: string[];
  };
  setUserProfile: (profile: Partial<AppState['userProfile']>) => void;

  // User positioning — the spine. See src/lib/positioning.ts.
  userPositioning: UserPositioning;
  setUserPositioning: (p: UserPositioning) => void;

  // Lead Filters
  filters: LeadFilter[];
  activeFilter: LeadFilter | null;
  addFilter: (filter: LeadFilter) => void;
  updateFilter: (id: string, filter: Partial<LeadFilter>) => void;
  deleteFilter: (id: string) => void;
  setActiveFilter: (filter: LeadFilter | null) => void;

  // Lead Research (Phase 2 — replaces leadBriefs)
  leadResearch: LeadResearch[];
  addLeadResearch: (r: LeadResearch) => void;
  updateLeadResearch: (id: string, r: Partial<LeadResearch>) => void;
  deleteLeadResearch: (id: string) => void;

  // Intent Signals (Phase 2 — global pool, attached to leads OR watchlist accounts).
  // Use the helpers in src/lib/intent.ts to query (signalsForLead/signalsForWatchlist
  // live there, not on the store, to keep state clean from selectors).
  intentSignals: IntentSignal[];
  addIntentSignal: (s: IntentSignal) => void;
  deleteIntentSignal: (id: string) => void;

  // Watchlist Accounts (Phase 2.3)
  watchlistAccounts: WatchlistAccount[];
  addWatchlistAccount: (a: WatchlistAccount) => void;
  updateWatchlistAccount: (id: string, a: Partial<WatchlistAccount>) => void;
  deleteWatchlistAccount: (id: string) => void;
  markWatchlistChecked: (id: string) => void;

  // Warm Intros (Phase 6.2)
  warmContacts: WarmContact[];
  addWarmContact: (c: WarmContact) => void;
  updateWarmContact: (id: string, c: Partial<WarmContact>) => void;
  deleteWarmContact: (id: string) => void;
  markWarmTouched: (id: string) => void;

  // LinkedIn Posts
  posts: LinkedInPost[];
  addPost: (post: LinkedInPost) => void;
  deletePost: (id: string) => void;

  // Growth Plans
  growthPlans: GrowthPlan[];
  activePlan: GrowthPlan | null;
  addGrowthPlan: (plan: GrowthPlan) => void;
  setActivePlan: (plan: GrowthPlan | null) => void;

  // Twitter / X Data
  tweets: Tweet[];
  addTweet: (tweet: Tweet) => void;
  deleteTweet: (id: string) => void;

  twitterThreads: TwitterThread[];
  addTwitterThread: (thread: TwitterThread) => void;
  deleteTwitterThread: (id: string) => void;

  twitterGrowthPlans: TwitterGrowthPlan[];
  addTwitterGrowthPlan: (plan: TwitterGrowthPlan) => void;

  // Email Sequences
  sequences: EmailSequence[];
  addSequence: (seq: EmailSequence) => void;
  updateSequence: (id: string, seq: Partial<EmailSequence>) => void;
  deleteSequence: (id: string) => void;

  // Pipeline / CRM
  pipelineLeads: PipelineLead[];
  addPipelineLead: (lead: PipelineLead) => void;
  updatePipelineLead: (id: string, lead: Partial<PipelineLead>) => void;
  movePipelineLead: (id: string, stage: PipelineStage) => void;
  deletePipelineLead: (id: string) => void;

  // Message Outcomes (Analytics)
  outcomes: MessageOutcome[];
  addOutcome: (outcome: MessageOutcome) => void;
  updateOutcome: (id: string, outcome: Partial<MessageOutcome>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentPage: 'leads' as NavPage,
      setCurrentPage: (page: NavPage) => set({ currentPage: page, mobileSidebarOpen: false }),

      mobileSidebarOpen: false,
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

      userProfile: {
        name: '',
        title: '',
        service: '',
        targetAudience: '',
        skills: [] as string[],
      },
      setUserProfile: (profile) =>
        set((s) => ({ userProfile: { ...s.userProfile, ...profile } })),

      userPositioning: emptyPositioning(),
      setUserPositioning: (p: UserPositioning) =>
        set({ userPositioning: { ...p, version: POSITIONING_SCHEMA_VERSION, lastUpdated: new Date().toISOString() } }),

      filters: [] as LeadFilter[],
      activeFilter: null as LeadFilter | null,
      addFilter: (filter: LeadFilter) => set((s) => ({ filters: [...s.filters, filter] })),
      updateFilter: (id: string, filter: Partial<LeadFilter>) =>
        set((s) => ({ filters: s.filters.map((f) => (f.id === id ? { ...f, ...filter } : f)) })),
      deleteFilter: (id: string) =>
        set((s) => ({ filters: s.filters.filter((f) => f.id !== id) })),
      setActiveFilter: (filter: LeadFilter | null) => set({ activeFilter: filter }),

      leadResearch: [] as LeadResearch[],
      addLeadResearch: (r: LeadResearch) => set((s) => ({ leadResearch: [r, ...s.leadResearch] })),
      updateLeadResearch: (id: string, r: Partial<LeadResearch>) =>
        set((s) => ({
          leadResearch: s.leadResearch.map((x) =>
            x.id === id ? { ...x, ...r, updatedAt: new Date().toISOString() } : x
          ),
        })),
      deleteLeadResearch: (id: string) =>
        set((s) => ({ leadResearch: s.leadResearch.filter((x) => x.id !== id) })),

      intentSignals: [] as IntentSignal[],
      addIntentSignal: (sig: IntentSignal) => set((s) => ({ intentSignals: [sig, ...s.intentSignals] })),
      deleteIntentSignal: (id: string) =>
        set((s) => ({ intentSignals: s.intentSignals.filter((x) => x.id !== id) })),

      watchlistAccounts: [] as WatchlistAccount[],
      addWatchlistAccount: (a: WatchlistAccount) =>
        set((s) => ({ watchlistAccounts: [a, ...s.watchlistAccounts] })),
      updateWatchlistAccount: (id: string, a: Partial<WatchlistAccount>) =>
        set((s) => ({ watchlistAccounts: s.watchlistAccounts.map((x) => (x.id === id ? { ...x, ...a } : x)) })),
      deleteWatchlistAccount: (id: string) =>
        set((s) => ({
          watchlistAccounts: s.watchlistAccounts.filter((x) => x.id !== id),
          // also drop any signals that were attached to this account
          intentSignals: s.intentSignals.filter((sig) => sig.watchlistAccountId !== id),
        })),
      markWatchlistChecked: (id: string) =>
        set((s) => ({
          watchlistAccounts: s.watchlistAccounts.map((x) =>
            x.id === id ? { ...x, lastCheckedAt: new Date().toISOString() } : x
          ),
        })),

      warmContacts: [] as WarmContact[],
      addWarmContact: (c: WarmContact) =>
        set((s) => ({ warmContacts: [c, ...s.warmContacts] })),
      updateWarmContact: (id: string, c: Partial<WarmContact>) =>
        set((s) => ({ warmContacts: s.warmContacts.map((x) => (x.id === id ? { ...x, ...c } : x)) })),
      deleteWarmContact: (id: string) =>
        set((s) => ({ warmContacts: s.warmContacts.filter((x) => x.id !== id) })),
      markWarmTouched: (id: string) =>
        set((s) => ({
          warmContacts: s.warmContacts.map((x) =>
            x.id === id ? { ...x, lastTouchedAt: new Date().toISOString() } : x
          ),
        })),

      posts: [] as LinkedInPost[],
      addPost: (post: LinkedInPost) => set((s) => ({ posts: [post, ...s.posts] })),
      deletePost: (id: string) => set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),

      growthPlans: [] as GrowthPlan[],
      activePlan: null as GrowthPlan | null,
      addGrowthPlan: (plan: GrowthPlan) => set((s) => ({ growthPlans: [...s.growthPlans, plan] })),
      setActivePlan: (plan: GrowthPlan | null) => set({ activePlan: plan }),

      tweets: [] as Tweet[],
      addTweet: (tweet: Tweet) => set((s) => ({ tweets: [tweet, ...s.tweets] })),
      deleteTweet: (id: string) => set((s) => ({ tweets: s.tweets.filter((t) => t.id !== id) })),

      twitterThreads: [] as TwitterThread[],
      addTwitterThread: (thread: TwitterThread) => set((s) => ({ twitterThreads: [thread, ...s.twitterThreads] })),
      deleteTwitterThread: (id: string) => set((s) => ({ twitterThreads: s.twitterThreads.filter((t) => t.id !== id) })),

      twitterGrowthPlans: [] as TwitterGrowthPlan[],
      addTwitterGrowthPlan: (plan: TwitterGrowthPlan) => set((s) => ({ twitterGrowthPlans: [...s.twitterGrowthPlans, plan] })),

      sequences: [] as EmailSequence[],
      addSequence: (seq: EmailSequence) => set((s) => ({ sequences: [...s.sequences, seq] })),
      updateSequence: (id: string, seq: Partial<EmailSequence>) =>
        set((s) => ({ sequences: s.sequences.map((s2) => (s2.id === id ? { ...s2, ...seq } : s2)) })),
      deleteSequence: (id: string) =>
        set((s) => ({ sequences: s.sequences.filter((s2) => s2.id !== id) })),

      pipelineLeads: [] as PipelineLead[],
      addPipelineLead: (lead: PipelineLead) => set((s) => {
        // Phase 5: every lead starts with a stageHistory entry. Without this,
        // the analytics dashboard can't compute conversion rates.
        const seeded: PipelineLead = lead.stageHistory && lead.stageHistory.length > 0
          ? lead
          : { ...lead, stageHistory: [{ stage: lead.stage, at: lead.createdAt }] };
        return { pipelineLeads: [...s.pipelineLeads, seeded] };
      }),
      updatePipelineLead: (id: string, update: Partial<PipelineLead>) =>
        set((s) => ({
          pipelineLeads: s.pipelineLeads.map((l) => {
            if (l.id !== id) return l;
            const now = new Date().toISOString();
            // If the update changes the stage, append to history too.
            const stageChanged = update.stage && update.stage !== l.stage;
            const history = stageChanged
              ? [...(l.stageHistory ?? [{ stage: l.stage, at: l.createdAt }]), { stage: update.stage!, at: now }]
              : l.stageHistory;
            return { ...l, ...update, stageHistory: history, updatedAt: now };
          }),
        })),
      movePipelineLead: (id: string, stage: PipelineStage) =>
        set((s) => ({
          pipelineLeads: s.pipelineLeads.map((l) => {
            if (l.id !== id) return l;
            if (l.stage === stage) return l;
            const now = new Date().toISOString();
            const history = [...(l.stageHistory ?? [{ stage: l.stage, at: l.createdAt }]), { stage, at: now }];
            return { ...l, stage, stageHistory: history, updatedAt: now };
          }),
        })),
      deletePipelineLead: (id: string) =>
        set((s) => ({ pipelineLeads: s.pipelineLeads.filter((l) => l.id !== id) })),

      outcomes: [] as MessageOutcome[],
      addOutcome: (outcome: MessageOutcome) => set((s) => ({ outcomes: [outcome, ...s.outcomes] })),
      updateOutcome: (id: string, outcome: Partial<MessageOutcome>) =>
        set((s) => ({ outcomes: s.outcomes.map((o) => (o.id === id ? { ...o, ...outcome } : o)) })),
    }),
    {
      name: 'leadhawk-storage',
      partialize: (state) => ({
        userProfile: state.userProfile,                 // ~500B
        userPositioning: state.userPositioning,         // ~1KB once filled
        filters: state.filters,                         // ~10KB at 20 filters
        leadResearch: state.leadResearch,               // ~3KB per record × ~150 = ~450KB. Sources inflate this faster than the old leadBriefs.
        intentSignals: state.intentSignals,             // ~600B per signal × ~500 = ~300KB. Watchlists drive the count up.
        watchlistAccounts: state.watchlistAccounts,     // ~400B × 50 max = ~20KB
        warmContacts: state.warmContacts,               // ~300B × 100 typical = ~30KB
        posts: state.posts,                             // ~150KB at 100 posts
        growthPlans: state.growthPlans,                 // ~25KB at 5 plans
        tweets: state.tweets,                           // ~45KB at 150 tweets
        twitterThreads: state.twitterThreads,           // ~90KB at 30 threads
        twitterGrowthPlans: state.twitterGrowthPlans,   // ~25KB at 5 plans
        sequences: state.sequences,                     // ~60KB at 20 sequences
        pipelineLeads: state.pipelineLeads,             // ~600KB at 1k leads. Per-lead intent signals live in `intentSignals` (above), not on the lead itself, to keep the leads collection compact.
        outcomes: state.outcomes,                       // ~200KB at 1k outcomes (Phase 5 will populate)
      }),
    }
  )
);
