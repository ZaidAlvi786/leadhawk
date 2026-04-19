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

export interface LinkedInPost {
  id: string;
  content: string;
  hook: string;
  hashtags: string[];
  postType: 'thought-leadership' | 'case-study' | 'tips' | 'story' | 'poll' | 'engagement';
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

export type LeadSource = 'apollo' | 'linkedin' | 'manual' | 'referral' | 'inbound';

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
  createdAt: string;
  updatedAt: string;
}

export type NavPage = 'leads' | 'linkedin-growth' | 'apollo' | 'sequences' | 'pipeline';
