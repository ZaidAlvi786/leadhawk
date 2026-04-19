// =============================================
// Battle-tested Sales Navigator filter presets
// These target high-intent, high-budget buyer personas
// that typically respond to freelance dev / AI outreach.
// =============================================

import type { LeadFilter } from './types';

export interface FilterPreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  whyItWorks: string;
  data: Omit<LeadFilter, 'id'>;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'funded-saas-ctos',
    name: 'Funded SaaS CTOs',
    emoji: '🚀',
    description: 'CTOs & VPs at Series A/B SaaS companies',
    whyItWorks: 'Have budget + tech debt + hiring pain — prime for freelance dev help',
    data: {
      name: 'Funded SaaS CTOs',
      jobTitles: ['CTO', 'VP of Engineering', 'Head of Engineering'],
      industries: ['SaaS', 'Technology'],
      companySize: ['11-50', '51-200'],
      locations: [],
      seniorityLevels: ['VP', 'C-Suite'],
      keywords: ['React', 'Node.js', 'AWS', 'scaling'],
      technologies: [],
    },
  },
  {
    id: 'ai-startup-founders',
    name: 'AI Startup Founders',
    emoji: '🤖',
    description: 'Founders at AI/ML startups (1-50 employees)',
    whyItWorks: 'AI founders need AI-fluent devs — your differentiator matters here',
    data: {
      name: 'AI Startup Founders',
      jobTitles: ['Founder', 'Co-Founder', 'CEO', 'CTO'],
      industries: ['Technology', 'SaaS'],
      companySize: ['1-10', '11-50'],
      locations: [],
      seniorityLevels: ['Owner', 'Founder', 'C-Suite'],
      keywords: ['AI', 'LLM', 'GPT', 'machine learning', 'OpenAI'],
      technologies: [],
    },
  },
  {
    id: 'ecommerce-founders',
    name: 'E-Commerce Founders',
    emoji: '🛒',
    description: 'DTC / Shopify store owners, 11-200 employees',
    whyItWorks: 'Constant dev needs — custom features, integrations, conversions',
    data: {
      name: 'E-Commerce Founders',
      jobTitles: ['Founder', 'CEO', 'Head of Technology', 'Head of E-commerce'],
      industries: ['E-Commerce', 'Retail'],
      companySize: ['11-50', '51-200'],
      locations: [],
      seniorityLevels: ['Owner', 'C-Suite', 'Director'],
      keywords: ['Shopify', 'DTC', 'conversion rate', 'Klaviyo'],
      technologies: [],
    },
  },
  {
    id: 'digital-agency-owners',
    name: 'Digital Agency Owners',
    emoji: '🎯',
    description: 'Owners at marketing/web agencies, 11-50 people',
    whyItWorks: 'Agencies love white-label freelancers for overflow — recurring work',
    data: {
      name: 'Digital Agency Owners',
      jobTitles: ['Owner', 'Founder', 'Managing Director', 'Agency Director'],
      industries: ['Marketing & Advertising', 'Design'],
      companySize: ['1-10', '11-50', '51-200'],
      locations: [],
      seniorityLevels: ['Owner', 'Partner', 'C-Suite'],
      keywords: ['web development', 'overflow', 'freelance', 'contractor'],
      technologies: [],
    },
  },
  {
    id: 'fintech-vp-eng',
    name: 'FinTech Engineering Leaders',
    emoji: '💳',
    description: 'VPs & Directors at FinTech companies, 51-500 people',
    whyItWorks: 'Deep pockets + strict compliance = high-value engagements',
    data: {
      name: 'FinTech Engineering Leaders',
      jobTitles: ['VP of Engineering', 'Director of Engineering', 'Head of Engineering'],
      industries: ['FinTech', 'Financial Services'],
      companySize: ['51-200', '201-500'],
      locations: [],
      seniorityLevels: ['VP', 'Director'],
      keywords: ['compliance', 'fintech', 'payments', 'API'],
      technologies: [],
    },
  },
  {
    id: 'b2b-saas-product',
    name: 'B2B SaaS Product Leaders',
    emoji: '📊',
    description: 'Product Directors & VPs at 51-500 SaaS companies',
    whyItWorks: 'Product leaders control roadmap + budget — influencers, not gatekeepers',
    data: {
      name: 'B2B SaaS Product Leaders',
      jobTitles: ['Head of Product', 'VP of Product', 'Director of Product', 'Chief Product Officer'],
      industries: ['SaaS', 'Technology'],
      companySize: ['51-200', '201-500'],
      locations: [],
      seniorityLevels: ['VP', 'Director', 'C-Suite'],
      keywords: ['B2B', 'SaaS', 'roadmap', 'MVP'],
      technologies: [],
    },
  },
  {
    id: 'healthcare-tech',
    name: 'Healthcare Tech Directors',
    emoji: '🏥',
    description: 'Tech directors at healthcare / HealthTech, 51-500',
    whyItWorks: 'HIPAA + digital transformation = expensive, specialized dev work',
    data: {
      name: 'Healthcare Tech Directors',
      jobTitles: ['Director of Technology', 'CTO', 'Head of Digital', 'VP of Technology'],
      industries: ['Healthcare'],
      companySize: ['51-200', '201-500'],
      locations: [],
      seniorityLevels: ['Director', 'VP', 'C-Suite'],
      keywords: ['HIPAA', 'telehealth', 'patient', 'EHR'],
      technologies: [],
    },
  },
  {
    id: 'early-stage-ceos',
    name: 'Early-Stage Tech CEOs',
    emoji: '⚡',
    description: 'CEOs at 1-10 employee tech startups',
    whyItWorks: 'Small team = founder wears all hats = desperate for fast dev help',
    data: {
      name: 'Early-Stage Tech CEOs',
      jobTitles: ['CEO', 'Founder', 'Co-Founder'],
      industries: ['Technology', 'SaaS'],
      companySize: ['1-10'],
      locations: [],
      seniorityLevels: ['Owner', 'Founder', 'C-Suite'],
      keywords: ['MVP', 'pre-seed', 'seed', 'bootstrapped'],
      technologies: [],
    },
  },
  {
    id: 'edtech-founders',
    name: 'EdTech Founders',
    emoji: '🎓',
    description: 'Founders at education/e-learning platforms',
    whyItWorks: 'Course platforms + interactive content need custom dev constantly',
    data: {
      name: 'EdTech Founders',
      jobTitles: ['Founder', 'CEO', 'Head of Product'],
      industries: ['Education', 'Higher Education'],
      companySize: ['11-50', '51-200'],
      locations: [],
      seniorityLevels: ['Owner', 'C-Suite', 'Director'],
      keywords: ['e-learning', 'LMS', 'online course', 'education'],
      technologies: [],
    },
  },
  {
    id: 'scaling-series-b',
    name: 'Scaling Series B+ Tech',
    emoji: '📈',
    description: 'Engineering leaders at 201-1000 person tech co\'s',
    whyItWorks: 'Post-PMF scaling crunch = specialists wanted, not generalists',
    data: {
      name: 'Scaling Series B+ Tech',
      jobTitles: ['VP of Engineering', 'Director of Engineering', 'Head of Platform'],
      industries: ['SaaS', 'Technology'],
      companySize: ['201-500', '501-1000'],
      locations: [],
      seniorityLevels: ['VP', 'Director'],
      keywords: ['scaling', 'performance', 'infrastructure', 'DevOps'],
      technologies: [],
    },
  },
];
