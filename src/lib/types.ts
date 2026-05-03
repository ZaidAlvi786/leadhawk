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

export interface LeadBrief {
  id: string;
  leadName: string;
  leadCompany?: string;
  leadRole?: string;
  linkedinUrl?: string;
  archetype: LeadArchetype;
  summary: string;              // 2-3 sentence overview
  recentActivity: string[];     // bullets: recent posts, news, signals
  painPoints: string[];         // inferred pain points
  personalizationHooks: string[]; // 3-5 specific opener angles
  bestApproach: string;         // recommended outreach style
  redFlags: string[];           // things to avoid
  generatedAt: string;
}

// =============================================
// X / Twitter Growth
// =============================================

export interface Tweet {
  id: string;
  content: string;
  hook: string;
  postType: 'single' | 'thread-part' | 'reply';
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

export type NavPage = 'leads' | 'linkedin-growth' | 'apollo' | 'sequences' | 'pipeline' | 'twitter-growth' | 'analytics' | 'templates';
