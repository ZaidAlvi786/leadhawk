import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LeadFilter, LinkedInPost, GrowthPlan, NavPage, EmailSequence, PipelineLead, PipelineStage } from './types';

interface AppState {
  // Navigation
  currentPage: NavPage;
  setCurrentPage: (page: NavPage) => void;

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

  // LinkedIn Posts
  posts: LinkedInPost[];
  addPost: (post: LinkedInPost) => void;
  deletePost: (id: string) => void;

  // Growth Plans
  growthPlans: GrowthPlan[];
  activePlan: GrowthPlan | null;
  addGrowthPlan: (plan: GrowthPlan) => void;
  setActivePlan: (plan: GrowthPlan | null) => void;

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
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentPage: 'leads',
      setCurrentPage: (page) => set({ currentPage: page }),

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
      addFilter: (filter) => set((s) => ({ filters: [...s.filters, filter] })),
      updateFilter: (id, filter) =>
        set((s) => ({ filters: s.filters.map((f) => (f.id === id ? { ...f, ...filter } : f)) })),
      deleteFilter: (id) =>
        set((s) => ({ filters: s.filters.filter((f) => f.id !== id) })),
      setActiveFilter: (filter) => set({ activeFilter: filter }),

      posts: [],
      addPost: (post) => set((s) => ({ posts: [post, ...s.posts] })),
      deletePost: (id) => set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),

      growthPlans: [],
      activePlan: null,
      addGrowthPlan: (plan) => set((s) => ({ growthPlans: [...s.growthPlans, plan] })),
      setActivePlan: (plan) => set({ activePlan: plan }),

      sequences: [],
      addSequence: (seq) => set((s) => ({ sequences: [...s.sequences, seq] })),
      updateSequence: (id, seq) =>
        set((s) => ({ sequences: s.sequences.map((s2) => (s2.id === id ? { ...s2, ...seq } : s2)) })),
      deleteSequence: (id) =>
        set((s) => ({ sequences: s.sequences.filter((s2) => s2.id !== id) })),

      pipelineLeads: [],
      addPipelineLead: (lead) => set((s) => ({ pipelineLeads: [...s.pipelineLeads, lead] })),
      updatePipelineLead: (id, lead) =>
        set((s) => ({ pipelineLeads: s.pipelineLeads.map((l) => (l.id === id ? { ...l, ...lead, updatedAt: new Date().toISOString() } : l)) })),
      movePipelineLead: (id, stage) =>
        set((s) => ({ pipelineLeads: s.pipelineLeads.map((l) => (l.id === id ? { ...l, stage, updatedAt: new Date().toISOString() } : l)) })),
      deletePipelineLead: (id) =>
        set((s) => ({ pipelineLeads: s.pipelineLeads.filter((l) => l.id !== id) })),
    }),
    {
      name: 'leadhawk-storage',
      partialize: (state) => ({
        userProfile: state.userProfile,
        filters: state.filters,
        posts: state.posts,
        growthPlans: state.growthPlans,
        sequences: state.sequences,
        pipelineLeads: state.pipelineLeads,
      }),
    }
  )
);
