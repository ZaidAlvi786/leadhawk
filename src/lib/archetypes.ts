import type { ArchetypeProfile } from './types';

export const ARCHETYPE_PROFILES: Record<string, ArchetypeProfile> = {
  founder_ceo: {
    archetype: 'founder_ceo',
    label: 'Founder / CEO',
    commonPains: [
      'Time scarcity — constantly in meetings, firefighting',
      'Hiring and retention — finding good people is brutal',
      'Runway pressure — always thinking about cash',
      'Growth plateau — revenue stalled, need new channels',
      'Delegation guilt — can\'t let go of key tasks',
      'Board pressure — proving metrics matter',
    ],
    toneGuidelines:
      'Direct, no fluff, respect their time. Founders hate wasted minutes. Be specific about what you do and the outcome. Skip the corporate speak. Show you understand their world.',
    hookPatterns: [
      'Open with a specific metric or peer validation ("3 of your competitors just...", "I saw you hit $X ARR")',
      'Contrarian observation about their industry',
      'A question that implies you\'ve done homework (mention recent news, feature, or hire)',
      'Lead with outcome, not service ("most teams we work with see a 40% drop in CAC")',
      'Vulnerability: admit limitation and lean on their expertise',
    ],
    avoidList: [
      'Long intros or life story',
      'Generic flattery ("impressive work", "innovative approach")',
      'Assuming you know their strategy',
      'Asking for a call with no context',
      'Hyperbole or empty promises',
      'Treating them like a mid-level manager',
    ],
  },

  marketing_leader: {
    archetype: 'marketing_leader',
    label: 'VP/Director of Marketing',
    commonPains: [
      'Lead quality declining — CAC rising, conversion flat',
      'Attribution chaos — can\'t prove marketing\'s impact to finance',
      'Demand gen pressure — always asked to do more with less',
      'Tool sprawl — MarTech stack is unwieldy, expensive',
      'Team burnout — too many channels, too few people',
      'Board/CEO expectations — aggressive growth targets',
    ],
    toneGuidelines:
      'Analytical and outcome-focused. Marketing leaders live in spreadsheets. Lead with data, benchmarks, and proof. They respect efficiency. Be specific about impact (30% cost reduction, not "better performance").',
    hookPatterns: [
      'Industry benchmark ("80% of B2B marketing teams struggle with lead quality")',
      'Specific metric win ("helped 3 SaaS companies drop CAC by 35%")',
      'Problem they\'re likely facing now based on company size/stage',
      'Mention a recent company announcement or new hire they made',
      'Contrast: what\'s possible vs. status quo ("most teams still do X the old way")',
    ],
    avoidList: [
      'Vague language like "growth" or "better ROI"',
      'Assuming they have budget — lead with savings, not cost',
      'Treating marketing as art, not science',
      'Long case studies in first message',
      'Not mentioning specific metrics or numbers',
      'Pitching before understanding their current stack',
    ],
  },

  sales_leader: {
    archetype: 'sales_leader',
    label: 'VP/Director of Sales',
    commonPains: [
      'Quota misses — rep performance variance is wide',
      'Pipeline visibility — can\'t forecast accurately',
      'Sales cycle bloat — deals stuck in middle stages',
      'Rep retention — losing mid-career reps to burnout',
      'Deal quality — lots of activity, few closures',
      'Competitive losses — losing to bigger vendors',
    ],
    toneGuidelines:
      'Results-driven, competitive, time-sensitive. Sales leaders care about pipeline velocity and close rates. They move fast. Be concrete: "improved win rate by 22%" beats "better sales outcomes." No fluff.',
    hookPatterns: [
      'Competitive intelligence (mention a competitor they\'re losing to)',
      'Rep activity insight ("your top 3 reps probably have different sales motions")',
      'Pipeline metric ("average deal in your space stalls at discovery")',
      'Mention specific deal size or ACV if you know it',
      'Proof point from a peer company they know',
    ],
    avoidList: [
      'Lengthy introductions',
      'Anything that sounds "soft" (culture, team morale)',
      'Asking them to try something "innovative" or risky',
      'Generic sales wisdom ("always be closing")',
      'Not understanding their territory or model',
      'Making it sound like extra work for reps',
    ],
  },

  agency_owner: {
    archetype: 'agency_owner',
    label: 'Agency Owner / Consultant',
    commonPains: [
      'Client churn — hard to keep clients longer than 6-12 months',
      'Delivery vs. sales — stuck running the work, can\'t grow business',
      'Pricing power — commoditized, margins squeezed',
      'Team scaling — hiring good people who can execute',
      'Subcontractor management — quality and reliability',
      'Recurring revenue myth — mostly project-based income',
    ],
    toneGuidelines:
      'Entrepreneurial and pragmatic. Agency owners bootstrap. They care about margin and avoiding distraction from delivery. Respect their time and operational reality. Sell outcomes, not effort.',
    hookPatterns: [
      'Client problem (white-label solution, subcontractor reliability)',
      'Recurring revenue angle (help them transition to retainers)',
      'Operational inefficiency they\'re probably facing (time tracking, invoicing)',
      'Peer validation from another agency owner they might know',
      'Margin improvement (savings on tools, labor, or overhead)',
    ],
    avoidList: [
      'Anything that adds process or complexity',
      'Treating their service as inferior to in-house',
      'Assuming unlimited budget',
      'One-size-fits-all solutions',
      'Long onboarding',
      'Talking down to them as "just a freelancer"',
    ],
  },

  engineering_manager: {
    archetype: 'engineering_manager',
    label: 'Engineering Manager / Tech Lead',
    commonPains: [
      'Hiring quality engineers — hard to find, expensive',
      'Technical debt — accumulating, eating velocity',
      'On-call burnout — team exhausted from pager duty',
      'Recruiting burden — pulled into interviews constantly',
      'Tool fragmentation — too many languages, frameworks',
      'Communication overhead — meetings > shipping',
    ],
    toneGuidelines:
      'Technical and skeptical. Engineers value precision and proof. Skip marketing speak. Show how something reduces toil or improves velocity. Be specific about the architecture/approach.',
    hookPatterns: [
      'Specific technical problem ("managing microservices observability")',
      'Developer experience angle ("reduce CI/CD wait time by 60%")',
      'Operational burden ("eliminate manual deployments")',
      'Hiring leverage ("team can focus on product, not firefighting")',
      'Peer tech lead experience from a company they respect',
    ],
    avoidList: [
      'Sales jargon or corporate language',
      'Vague claims without proof',
      'Asking them to adopt an opinionated framework',
      'Not understanding their tech stack',
      'Assuming more process = better',
      'Oversimplifying technical problems',
    ],
  },

  product_manager: {
    archetype: 'product_manager',
    label: 'Product Manager / Head of Product',
    commonPains: [
      'User adoption stalled — good features, no traction',
      'Roadmap pressure — building features nobody wants',
      'Data literacy — team doesn\'t understand metrics',
      'Cross-functional alignment — sales/CS/eng always fighting',
      'Prioritization chaos — too many stakeholders, no framework',
      'Competitive pressure — disruption from niche players',
    ],
    toneGuidelines:
      'Data-driven and strategic. PMs think in outcomes and user behavior. Lead with research insights or behavioral patterns. Skip the demo in first message. Talk about outcomes, not features.',
    hookPatterns: [
      'User behavior insight ("products that optimize for X see 3x higher engagement")',
      'Competitive analysis (market trend or adjacent category)',
      'Adoption metric (churn, activation, or net retention insight)',
      'Mention a recent product move they made (new feature, pricing change)',
      'Behavioral pattern in their customer base',
    ],
    avoidList: [
      'Feature-focused pitches',
      'Not having clear metrics',
      'Assuming they have engineering or analytics issues',
      'Asking them to learn a new framework',
      'Treating product management as order-taking',
      'Ignoring competitive context',
    ],
  },

  freelancer_creator: {
    archetype: 'freelancer_creator',
    label: 'Freelancer / Creator / Solopreneur',
    commonPains: [
      'Income volatility — feast/famine cycles',
      'Sales time — hate selling, love doing the work',
      'Client quality — dealing with demanding, cheap clients',
      'Burnout — always saying yes, never time off',
      'Visibility — hard to stand out in crowded market',
      'Systems — admin and invoicing eat into billable time',
    ],
    toneGuidelines:
      'Authentic and relatable. Freelancers appreciate realness over polish. Lead with respect for their craft. Talk about freeing up time or enabling better work. Skip corporate speak.',
    hookPatterns: [
      'Time savings angle ("50 hours/month back for actual client work")',
      'Client quality filtering ("attract better clients who value expertise")',
      'Income smoothing (help them land retainers, not one-offs)',
      'Visibility/positioning (help them be found by the right people)',
      'Permission to say no ("you don\'t have to take every gig")',
    ],
    avoidList: [
      'Assuming they have budget (lead with free or cheap)',
      'Adding complexity or process',
      'Treating them as beginners',
      'Complex software or steep learning curve',
      'Anything that commoditizes their skill',
      'Speaking down to them',
    ],
  },

  operations_leader: {
    archetype: 'operations_leader',
    label: 'VP/Director of Operations / COO',
    commonPains: [
      'Process debt — manual workflows everywhere',
      'Scaling chaos — what worked at 10 people breaks at 50',
      'Cross-functional friction — ops always the blame for delays',
      'Data consistency — nobody trusts the single source of truth',
      'Cost control — no visibility into spending or efficiency',
      'Team bottlenecks — ops team overwhelmed, pulling tickets',
    ],
    toneGuidelines:
      'Systematic and pragmatic. Ops leaders think in processes and scaling. Lead with efficiency gains and cost savings. Show how something reduces manual work. Be concrete.',
    hookPatterns: [
      'Scaling challenge ("companies at your stage typically hit bottleneck X")',
      'Cost reduction ("your finance team probably spends 20 hours/month on X")',
      'Manual process improvement (automation angle)',
      'Organizational scaling (how other companies solved it)',
      'Data visibility ("you should know your real burn rate in real-time")',
    ],
    avoidList: [
      'Anything that adds process or complexity without cutting elsewhere',
      'Assuming infinite budget',
      'Not understanding their growth stage',
      'Treating ops as clerical work',
      'Oversimplifying workflow challenges',
      'One-size-fits-all approach',
    ],
  },

  other: {
    archetype: 'other',
    label: 'Other / Unclassified',
    commonPains: [
      'Context-dependent — varies widely by role',
      'Time scarcity — almost everyone has this',
      'Proving impact — most struggle with attribution',
      'Team alignment — cross-functional work is hard',
      'Change fatigue — new tools constantly',
    ],
    toneGuidelines:
      'Professional and respectful. Avoid assumptions. Lead with curiosity and openness. If you don\'t know their archetype, acknowledge it and ask good questions.',
    hookPatterns: [
      'Question: what are your top 3 priorities this quarter?',
      'Acknowledge you\'re not sure if this is relevant',
      'Lead with understanding, not pitching',
      'Respect their time and expertise',
    ],
    avoidList: [
      'Guessing their role or pressures',
      'Treating them as generic decision-maker',
      'Pitching before understanding',
      'Making assumptions about their budget or authority',
    ],
  },
};

export function getArchetypeProfile(archetype: string): ArchetypeProfile {
  return ARCHETYPE_PROFILES[archetype] || ARCHETYPE_PROFILES.other;
}
