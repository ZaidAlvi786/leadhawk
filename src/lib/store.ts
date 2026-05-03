import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LeadFilter, LinkedInPost, GrowthPlan, NavPage, EmailSequence, PipelineLead, PipelineStage, LeadBrief, Tweet, TwitterThread, TwitterGrowthPlan, MessageOutcome } from './types';
import type { TrendingTopic } from './topicEngine';

interface AppState {
  // Navigation
  currentPage: NavPage;
  setCurrentPage: (page: NavPage) => void;

  // Mobile sidebar drawer (ephemeral — not persisted)
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;

  // User profile
  userProfile: {
    name: string;
    title: string;
    service: string;
    targetAudience: string;
    skills: string[];
  };
  setUserProfile: (profile: Partial<AppState['userProfile']>) => void;

  // Lead Filters
  filters: LeadFilter[];
  activeFilter: LeadFilter | null;
  addFilter: (filter: LeadFilter) => void;
  updateFilter: (id: string, filter: Partial<LeadFilter>) => void;
  deleteFilter: (id: string) => void;
  setActiveFilter: (filter: LeadFilter | null) => void;

  // Lead Briefs (Intelligence)
  leadBriefs: LeadBrief[];
  addLeadBrief: (brief: LeadBrief) => void;
  updateLeadBrief: (id: string, brief: Partial<LeadBrief>) => void;
  deleteLeadBrief: (id: string) => void;

  // LinkedIn Posts
  posts: LinkedInPost[];
  addPost: (post: LinkedInPost) => void;
  deletePost: (id: string) => void;

  // Trending Topics (for post generation)
  trendingTopics: { linkedin: TrendingTopic[]; twitter: TrendingTopic[] };
  setTrendingTopics: (platform: 'linkedin' | 'twitter', topics: TrendingTopic[]) => void;
  lastTopicRefresh: { linkedin: string; twitter: string };
  setLastTopicRefresh: (platform: 'linkedin' | 'twitter', timestamp: string) => void;

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
      currentPage: 'leads',
      setCurrentPage: (page) => set({ currentPage: page, mobileSidebarOpen: false }),

      mobileSidebarOpen: false,
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

      userProfile: {
        name: '',
        title: 'Full Stack Developer',
        service: 'Full Stack Web Development & AI Integration',
        targetAudience: 'Tech Startups and SaaS Companies',
        skills: ['React', 'Next.js', 'Node.js', 'AI Integration', 'Python'],
      },
      setUserProfile: (profile) =>
        set((s) => ({ userProfile: { ...s.userProfile, ...profile } })),

      filters: [],
      activeFilter: null,
      addFilter: (filter: LeadFilter) => set((s) => ({ filters: [...s.filters, filter] })),
      updateFilter: (id: string, filter: Partial<LeadFilter>) =>
        set((s) => ({ filters: s.filters.map((f) => (f.id === id ? { ...f, ...filter } : f)) })),
      deleteFilter: (id: string) =>
        set((s) => ({ filters: s.filters.filter((f) => f.id !== id) })),
      setActiveFilter: (filter: LeadFilter | null) => set({ activeFilter: filter }),

      leadBriefs: [],
      addLeadBrief: (brief: LeadBrief) => set((s) => ({ leadBriefs: [brief, ...s.leadBriefs] })),
      updateLeadBrief: (id: string, brief: Partial<LeadBrief>) =>
        set((s) => ({ leadBriefs: s.leadBriefs.map((b) => (b.id === id ? { ...b, ...brief } : b)) })),
      deleteLeadBrief: (id: string) =>
        set((s) => ({ leadBriefs: s.leadBriefs.filter((b) => b.id !== id) })),

      posts: [],
      addPost: (post: LinkedInPost) => set((s) => ({ posts: [post, ...s.posts] })),
      deletePost: (id: string) => set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),

      trendingTopics: { linkedin: [], twitter: [] },
      setTrendingTopics: (platform: 'linkedin' | 'twitter', topics: TrendingTopic[]) =>
        set((s) => ({
          trendingTopics: { ...s.trendingTopics, [platform]: topics },
        })),
      lastTopicRefresh: { linkedin: '1970-01-01', twitter: '1970-01-01' },
      setLastTopicRefresh: (platform: 'linkedin' | 'twitter', timestamp: string) =>
        set((s) => ({
          lastTopicRefresh: { ...s.lastTopicRefresh, [platform]: timestamp },
        })),

      growthPlans: [],
      activePlan: null,
      addGrowthPlan: (plan: GrowthPlan) => set((s) => ({ growthPlans: [...s.growthPlans, plan] })),
      setActivePlan: (plan: GrowthPlan | null) => set({ activePlan: plan }),

      tweets: [],
      addTweet: (tweet: Tweet) => set((s) => ({ tweets: [tweet, ...s.tweets] })),
      deleteTweet: (id: string) => set((s) => ({ tweets: s.tweets.filter((t) => t.id !== id) })),

      twitterThreads: [],
      addTwitterThread: (thread: TwitterThread) => set((s) => ({ twitterThreads: [thread, ...s.twitterThreads] })),
      deleteTwitterThread: (id: string) => set((s) => ({ twitterThreads: s.twitterThreads.filter((t) => t.id !== id) })),

      twitterGrowthPlans: [],
      addTwitterGrowthPlan: (plan: TwitterGrowthPlan) => set((s) => ({ twitterGrowthPlans: [...s.twitterGrowthPlans, plan] })),

      sequences: [],
      addSequence: (seq: EmailSequence) => set((s) => ({ sequences: [...s.sequences, seq] })),
      updateSequence: (id: string, seq: Partial<EmailSequence>) =>
        set((s) => ({ sequences: s.sequences.map((s2) => (s2.id === id ? { ...s2, ...seq } : s2)) })),
      deleteSequence: (id: string) =>
        set((s) => ({ sequences: s.sequences.filter((s2) => s2.id !== id) })),

      pipelineLeads: [],
      addPipelineLead: (lead: PipelineLead) => set((s) => ({ pipelineLeads: [...s.pipelineLeads, lead] })),
      updatePipelineLead: (id: string, lead: Partial<PipelineLead>) =>
        set((s) => ({ pipelineLeads: s.pipelineLeads.map((l) => (l.id === id ? { ...l, ...lead, updatedAt: new Date().toISOString() } : l)) })),
      movePipelineLead: (id: string, stage: PipelineStage) =>
        set((s) => ({ pipelineLeads: s.pipelineLeads.map((l) => (l.id === id ? { ...l, stage, updatedAt: new Date().toISOString() } : l)) })),
      deletePipelineLead: (id: string) =>
        set((s) => ({ pipelineLeads: s.pipelineLeads.filter((l) => l.id !== id) })),

      outcomes: [],
      addOutcome: (outcome: MessageOutcome) => set((s) => ({ outcomes: [outcome, ...s.outcomes] })),
      updateOutcome: (id: string, outcome: Partial<MessageOutcome>) =>
        set((s) => ({ outcomes: s.outcomes.map((o) => (o.id === id ? { ...o, ...outcome } : o)) })),
    }),
    {
      name: 'leadhawk-storage',
      partialize: (state) => ({
        userProfile: state.userProfile,
        filters: state.filters,
        leadBriefs: state.leadBriefs,
        posts: state.posts,
        trendingTopics: state.trendingTopics,
        lastTopicRefresh: state.lastTopicRefresh,
        growthPlans: state.growthPlans,
        tweets: state.tweets,
        twitterThreads: state.twitterThreads,
        twitterGrowthPlans: state.twitterGrowthPlans,
        sequences: state.sequences,
        pipelineLeads: state.pipelineLeads,
        outcomes: state.outcomes,
      }),
    }
  )
);
