// =============================================
// LeadHawk - AI Generation Service
// =============================================

export interface GenerateMessageParams {
  leadName?: string;
  leadTitle: string;
  leadCompany: string;
  leadIndustry: string;
  tone: 'professional' | 'casual' | 'value-driven' | 'problem-solving';
  yourService: string;
  yourName: string;
}

export interface GeneratePostParams {
  topic: string;
  postType: 'thought-leadership' | 'case-study' | 'tips' | 'story' | 'poll' | 'engagement';
  industry: string;
  targetAudience: string;
  yourSkills: string[];
}

export interface GeneratePlanParams {
  currentRole: string;
  targetAudience: string;
  mainSkills: string[];
  businessGoal: string;
  weekCount: number;
}

interface CallAIOptions {
  responseFormat?: 'json' | 'text';
  maxTokens?: number;
}

async function callAI(systemPrompt: string, userPrompt: string, options: CallAIOptions = {}): Promise<string> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, userPrompt, ...options }),
  });
  const data = await res.json().catch(() => ({ error: 'AI request failed' }));
  if (!res.ok) throw new Error(data.error || `AI request failed (${res.status})`);
  return data.result;
}

// Robust JSON extraction — handles markdown code fences, leading/trailing prose,
// and partial wrapping. Falls back to whatever's between the first `{` and last `}`.
function extractJSON(raw: string): string {
  if (!raw) return raw;
  // Strip ```json ... ``` or ``` ... ``` fences
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) return fenced[1].trim();
  // Otherwise carve out the first JSON-looking object/array
  const first = raw.search(/[{[]/);
  const lastObj = raw.lastIndexOf('}');
  const lastArr = raw.lastIndexOf(']');
  const last = Math.max(lastObj, lastArr);
  if (first !== -1 && last > first) return raw.slice(first, last + 1);
  return raw.trim();
}

export async function generateOutreachMessage(params: GenerateMessageParams): Promise<string> {
  const system = `You write short LinkedIn outreach messages that sound like a real person — not a sales bot.

CRITICAL RULES:
- NEVER fake familiarity. You don't know their work, haven't read their posts, haven't "been following their journey." Don't pretend otherwise.
- NEVER use generic flattery like "your impressive work" or "your innovative approach." If you can't name something specific and real, skip compliments entirely.
- Be direct about your intent: you're reaching out to explore opportunities, collaboration, or see if there's a fit.
- Keep it under 300 characters for connection requests. Short = respectful of their time.
- Sound like a human sending a quick note, not a copywriter crafting a "hook."
- One message, no subject line, no labels, no explanations.

Tone: ${params.tone}.`;

  const user = `Write a LinkedIn connection message:
- To: ${params.leadName || 'the prospect'}, ${params.leadTitle} at ${params.leadCompany}
- Their industry: ${params.leadIndustry || 'not specified'}
- What I do: ${params.yourService}
- My name: ${params.yourName}

The message should:
1. Brief intro — who I am and what I do (one line)
2. Why I'm reaching out — be honest (looking for collaboration, freelance opportunities, or to connect with people in their space)
3. Simple ask — open to a quick chat, or let me know if you ever need help with [my skill area]
4. No fake compliments, no "I noticed your…", no pretending to know them

Return ONLY the message text.`;

  return callAI(system, user);
}

export async function generateLinkedInPost(params: GeneratePostParams): Promise<{ content: string; hashtags: string[]; hook: string }> {
  const system = `You are a LinkedIn content strategist who creates viral, engaging posts for B2B professionals.
You understand the LinkedIn algorithm, emotional hooks, and how to drive engagement.
Post type: ${params.postType}.
Always return JSON with: { "hook": "...", "content": "...", "hashtags": ["..."] }`;

  const user = `Create a high-performing LinkedIn post:
- Topic: ${params.topic}
- Industry: ${params.industry}
- Target audience: ${params.targetAudience}
- Author's skills: ${params.yourSkills.join(', ')}

Format rules:
- Start with a POWERFUL hook (first 2 lines visible before "see more")
- Use line breaks every 1-2 sentences for readability
- Include a relatable story or insight
- End with a thought-provoking question or clear CTA
- 5-10 relevant hashtags
- 150-300 words total

Return JSON only: { "hook": "first 2 lines", "content": "full post text", "hashtags": ["tag1","tag2"] }`;

  const raw = await callAI(system, user, { responseFormat: 'json', maxTokens: 2000 });
  try {
    return JSON.parse(extractJSON(raw));
  } catch {
    return { hook: '', content: raw, hashtags: [] };
  }
}

export async function generateGrowthPlan(params: GeneratePlanParams): Promise<object> {
  const system = `You are a LinkedIn growth expert who creates actionable monetization strategies.
You understand personal branding, content calendars, and lead generation through LinkedIn.
Return ONLY valid JSON.`;

  const user = `Create a ${params.weekCount}-week LinkedIn growth plan:
- Current role: ${params.currentRole}
- Target audience: ${params.targetAudience}
- Skills: ${params.mainSkills.join(', ')}
- Goal: ${params.businessGoal}

Return JSON: {
  "overview": "string",
  "weeks": [
    {
      "week": 1,
      "theme": "string",
      "focus": "string",
      "goals": ["goal1", "goal2"],
      "actions": [
        { "type": "post|engage|connect|message", "description": "string", "frequency": "string", "priority": "high|medium|low" }
      ],
      "contentTopics": ["topic1", "topic2"],
      "targetConnections": 50,
      "targetImpressions": 5000
    }
  ],
  "keyMetrics": ["metric1"],
  "monetizationTips": ["tip1"]
}`;

  // Growth plans are big (multi-week, nested actions) — needs more headroom.
  const raw = await callAI(system, user, { responseFormat: 'json', maxTokens: 4000 });
  try {
    return JSON.parse(extractJSON(raw));
  } catch {
    return { error: 'Failed to parse plan', raw };
  }
}

export async function generateFilterSuggestions(description: string): Promise<object> {
  const system = `You are a B2B sales expert who knows Sales Navigator deeply.
Given a target customer description, extract optimal filter values.
Return ONLY valid JSON.

IMPORTANT — use these EXACT values where possible:
- industries: "Technology", "SaaS", "FinTech", "E-Commerce", "Healthcare", "Marketing & Advertising", "Real Estate", "Education", "Consulting", "Manufacturing", "Retail", "Media", "Legal", "Construction", "Design", "Financial Services", "Software", "Insurance", "Automotive", "Hospitality", "Human Resources", "Non-profit", "Government", "Pharmaceuticals", "Biotechnology"
- seniorityLevels: "Individual Contributor", "Manager", "Director", "VP", "C-Suite", "Partner", "Owner", "Founder"
- companySize: "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10000+"
- locations: Use real city/country names like "United States", "London, UK", "Germany"
- jobTitles and keywords: free-form, use whatever fits best`;

  const user = `Extract Sales Navigator filters from: "${description}"

Return JSON: {
  "jobTitles": ["CTO", "VP Engineering"],
  "industries": ["Technology", "SaaS"],
  "companySize": ["11-50", "51-200"],
  "locations": ["United States", "London, UK"],
  "seniorityLevels": ["Manager", "Director"],
  "keywords": ["React", "Node.js"],
  "suggestedMessage": "Brief outreach angle"
}

Never return placeholders like "city, country" or "industry1".`;

  const raw = await callAI(system, user, { responseFormat: 'json', maxTokens: 1200 });
  try {
    return JSON.parse(extractJSON(raw));
  } catch {
    return {};
  }
}

// =============================================
// Email Sequence Generation
// =============================================

export interface GenerateSequenceParams {
  targetRole: string;
  industry: string;
  tone: 'professional' | 'casual' | 'value-driven' | 'problem-solving';
  yourService: string;
  yourName: string;
  sequenceLength?: number; // defaults to 3
}

export async function generateEmailSequence(params: GenerateSequenceParams): Promise<{
  steps: { type: string; subject: string; body: string; delayDays: number }[];
}> {
  const numSteps = params.sequenceLength || 3;

  const system = `You are a cold email expert who builds sequences that get replies.
You understand that most replies come from follow-ups, not the first email.

CRITICAL RULES:
- Email 1 (intro): Short, direct. Who you are, why you're reaching out, one clear ask. No flattery.
- Email 2 (value-add): Share something genuinely useful — an insight, a quick tip, a mini-audit of something public about their company. Show you can help WITHOUT asking for anything.
- Email 3+ (follow-up/breakup): Short. Acknowledge they're busy. Either share one more angle or gracefully close the loop. The "breakup" email ("No worries if this isn't a fit") consistently gets the highest reply rate.

NEVER:
- Fake familiarity or claim you've "been following their work"
- Write generic compliments
- Use salesy language ("revolutionize", "game-changing", "unlock")
- Write emails longer than 100 words each

Tone: ${params.tone}.
Return ONLY valid JSON.`;

  const user = `Create a ${numSteps}-step cold email sequence:
- Target: ${params.targetRole} in ${params.industry}
- My service: ${params.yourService}
- My name: ${params.yourName}

Return JSON:
{
  "steps": [
    {
      "type": "intro",
      "subject": "Short subject line",
      "body": "Email body (under 100 words)",
      "delayDays": 0
    },
    {
      "type": "value-add",
      "subject": "...",
      "body": "...",
      "delayDays": 3
    },
    {
      "type": "breakup",
      "subject": "...",
      "body": "...",
      "delayDays": 5
    }
  ]
}`;

  // Email sequences scale with step count — give per-step headroom.
  const raw = await callAI(system, user, { responseFormat: 'json', maxTokens: Math.max(2000, numSteps * 600) });
  try {
    return JSON.parse(extractJSON(raw));
  } catch {
    return { steps: [] };
  }
}

// =============================================
// AI Next Action Suggestion for Pipeline
// =============================================

export interface SuggestActionParams {
  leadName: string;
  leadTitle: string;
  leadCompany: string;
  currentStage: string;
  daysSinceContact?: number;
  notes?: string;
}

export async function suggestNextAction(params: SuggestActionParams): Promise<string> {
  const system = `You are a sales coach. Given a lead's current pipeline stage and context, suggest ONE specific next action in 1-2 sentences. Be concrete and actionable — not generic advice.`;

  const user = `Lead: ${params.leadName}, ${params.leadTitle} at ${params.leadCompany}
Stage: ${params.currentStage}
${params.daysSinceContact !== undefined ? `Days since last contact: ${params.daysSinceContact}` : 'Not yet contacted'}
${params.notes ? `Notes: ${params.notes}` : ''}

What's the single best next action?`;

  return callAI(system, user);
}
