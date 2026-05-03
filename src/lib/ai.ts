// =============================================
// LeadHawk - AI Generation Service
// =============================================

import type { LeadBrief, LeadArchetype } from './types';
import { ARCHETYPE_PROFILES } from './archetypes';

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

export interface CallAIOptions {
  responseFormat?: 'json' | 'text';
  maxTokens?: number;
}

export async function callAI(systemPrompt: string, userPrompt: string, options: CallAIOptions = {}): Promise<string> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, userPrompt, ...options }),
  });
  const data = await res.json().catch(() => ({ error: 'AI request failed' }));
  if (!res.ok) throw new Error(data.error || `AI request failed (${res.status})`);
  return data.result;
}

// Sanitize common LLM JSON errors
function sanitizeJSON(json: string): string {
  // Remove trailing commas before } or ]
  json = json.replace(/,(\s*[}\]])/g, '$1');
  // Replace single quotes with double quotes in property names (simple heuristic)
  json = json.replace(/'([^']*)'(\s*:)/g, '"$1"$2');
  return json;
}

// Robust JSON extraction — handles markdown code fences, leading/trailing prose,
// and partial wrapping. Falls back to whatever's between the first `{` and last `}`.
export function extractJSON(raw: string): string {
  if (!raw) return raw;

  // Try to parse as-is first (might be valid JSON already)
  try {
    JSON.parse(raw);
    return raw;
  } catch {
    // Not valid JSON, continue with extraction
  }

  // Try sanitized version
  try {
    const sanitized = sanitizeJSON(raw);
    JSON.parse(sanitized);
    return sanitized;
  } catch {
    // Still not valid, continue
  }

  // Strip ```json ... ``` or ``` ... ``` fences
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) {
    const extracted = fenced[1].trim();
    try {
      JSON.parse(extracted);
      return extracted;
    } catch {
      try {
        const sanitized = sanitizeJSON(extracted);
        JSON.parse(sanitized);
        return sanitized;
      } catch {
        // Fenced content isn't valid, continue
      }
    }
  }

  // Otherwise carve out the first JSON-looking object/array
  const first = raw.search(/[{[]/);
  const lastObj = raw.lastIndexOf('}');
  const lastArr = raw.lastIndexOf(']');
  const last = Math.max(lastObj, lastArr);
  if (first !== -1 && last > first) {
    const extracted = raw.slice(first, last + 1);
    try {
      JSON.parse(extracted);
      return extracted;
    } catch {
      try {
        const sanitized = sanitizeJSON(extracted);
        JSON.parse(sanitized);
        return sanitized;
      } catch {
        // Extraction didn't produce valid JSON
      }
    }
  }

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
  const system = `You are a LinkedIn content strategist who writes viral, engaging posts for B2B professionals.
You understand the LinkedIn algorithm, emotional hooks, and what drives engagement.

Post type: ${params.postType}.

WRITING STYLE:
- Sound like a real person sharing a real experience or insight — never like a copywriter
- Open with a strong hook in the first 2 lines (everything else is hidden behind "see more")
- Use SHORT paragraphs — 1-2 sentences each, separated by blank lines
- Use emojis sparingly to break up sections (one per major section is plenty)
- Include a concrete story, number, or specific example — not vague generalities
- Avoid sales-bot phrases: "revolutionize", "game-changing", "unlock", "leverage", "synergy"
- Vary sentence length — mix short punchy lines with longer ones
- End with a thought-provoking question that invites comments

LENGTH: 150-300 words total.

HASHTAGS: End the post with 5-10 relevant hashtags on their own line(s) at the very bottom. No spaces inside tags.`;

  const user = `Write a LinkedIn post on this topic:

TOPIC: ${params.topic}
INDUSTRY: ${params.industry}
TARGET AUDIENCE: ${params.targetAudience}
AUTHOR'S EXPERTISE: ${params.yourSkills.join(', ')}

Output ONLY the post text — no preamble, no JSON, no markdown code fences, no labels. Start directly with the hook line. End with hashtags on the last line(s).`;

  const raw = await callAI(system, user, { maxTokens: 2000 });
  return parseLinkedInPost(raw);
}

// Parse a plain-text LinkedIn post into hook + content + hashtags.
// Hook = first 1-2 non-empty lines. Hashtags = #word tokens from the trailing
// hashtag block. Content = everything between (with hashtags removed).
function parseLinkedInPost(raw: string): { content: string; hashtags: string[]; hook: string } {
  // Strip any stray code-fence wrappers a model might still emit
  const text = raw
    .replace(/^```(?:json|markdown|text)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  // Pull all #hashtags out of the body. We prefer hashtags clustered at the
  // bottom of the post — but capture inline ones too as a safety net.
  const hashtagMatches = text.match(/#[A-Za-z0-9_]+/g) || [];
  const hashtags = Array.from(new Set(hashtagMatches.map((t) => t.replace(/^#/, ''))));

  // Find where the trailing hashtag block starts so we can strip it from content.
  // A "hashtag block" = one or more lines near the end that are mostly hashtags.
  const lines = text.split('\n');
  let cutoff = lines.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line === '') continue;
    // A line counts as part of the hashtag block if hashtags dominate it
    const tagsInLine = (line.match(/#[A-Za-z0-9_]+/g) || []).length;
    const wordsInLine = line.split(/\s+/).length;
    if (tagsInLine > 0 && tagsInLine / wordsInLine >= 0.6) {
      cutoff = i;
    } else {
      break;
    }
  }
  const content = lines.slice(0, cutoff).join('\n').trim();

  // Hook = first 1-2 non-empty lines of content (whichever is shorter)
  const contentLines = content.split('\n').filter((l) => l.trim());
  const hook = contentLines.slice(0, 2).join('\n').trim();

  return { content, hashtags, hook };
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

// =============================================
// X / Twitter Generation
// =============================================

export interface GenerateTweetParams {
  topic: string;
  threadType?: 'single' | 'thread-part' | 'reply';
  replyingTo?: string;
  yourExpertise: string[];
  tone?: 'educational' | 'controversial' | 'humorous' | 'inspirational';
}

export async function generateTweet(params: GenerateTweetParams): Promise<{ content: string; hook: string }> {
  const system = `You are a viral X/Twitter expert who writes posts that get engagement.

CRITICAL RULES:
- UNDER 280 CHARACTERS (most important — enforce strictly)
- Hook in first 10-15 words that makes people stop scrolling
- No hashtags at the start (kills reach)
- Be conversational, not corporate
- Use line breaks strategically
- One strong idea per tweet
- Tone: ${params.tone || 'educational'}

NEVER:
- Add hashtags at the end (outdated)
- Overuse emojis (max 1)
- Write like a bot
- Use "I'm excited to announce"
`;

  const user = `Write a ${params.threadType || 'single'} tweet:
Topic: ${params.topic}
${params.replyingTo ? `Reply to: "${params.replyingTo}"` : ''}
Your expertise: ${params.yourExpertise.join(', ')}

Return ONLY the tweet text (under 280 chars). No labels, no explanation, no line breaks unless strategic.`;

  try {
    const content = await callAI(system, user, { maxTokens: 300 });
    const trimmed = content.trim().substring(0, 280);
    const hook = trimmed.split('\n')[0].substring(0, 50);
    return { content: trimmed, hook };
  } catch {
    return { content: 'Tweet generation failed', hook: 'Error' };
  }
}

export async function generateTwitterThread(params: {
  topic: string;
  threadType: 'educational' | 'story' | 'tips' | 'debate' | 'thread';
  yourSkills: string[];
  targetAudience: string;
}): Promise<{ hook: string; setup: string[]; insights: string[]; cta: string }> {
  const system = `You are a Twitter thread expert. You write threads that:
1. Hook in 1st tweet (curiosity or controversy)
2. Build context in 2-3 tweets (the "why")
3. Deliver 3-5 insights (the "how")
4. End with CTA (retweet, reply, follow)

RULES:
- Each tweet UNDER 280 chars
- Use line breaks strategically
- Number the tweets (1/, 2/, etc.)
- Thread type: ${params.threadType}
- Conversational, no corporate jargon
- The more specific, the more engagement

AVOID:
- Generic advice
- Repeating the same point
- Too many emojis (max 1 per tweet)
`;

  const user = `Write a Twitter thread (9-12 tweets) on: ${params.topic}
Type: ${params.threadType}
Target audience: ${params.targetAudience}
Your expertise: ${params.yourSkills.join(', ')}

Return JSON:
{
  "hook": "First tweet that hooks readers (under 100 chars)",
  "setup": ["setup tweet 1", "setup tweet 2", "setup tweet 3"],
  "insights": ["insight 1", "insight 2", "insight 3", "insight 4"],
  "cta": "Final CTA tweet"
}`;

  try {
    const raw = await callAI(system, user, { responseFormat: 'json', maxTokens: 2000 });
    return JSON.parse(extractJSON(raw));
  } catch {
    return { hook: 'Thread generation failed', setup: [], insights: [], cta: 'See above' };
  }
}

function buildWeeksFromJSON(weeksStr: string): any[] {
  // Simple regex-based week extraction as fallback
  const weekMatches = weeksStr.match(/\{[^}]*"week"[^}]*\}/g) || [];
  return weekMatches.map((weekStr, idx) => {
    try {
      // Try to parse individual week
      return JSON.parse(weekStr);
    } catch {
      // Return minimal week structure
      return {
        week: idx + 1,
        theme: `Week ${idx + 1}`,
        goals: [],
        actions: [],
        suggestedTopics: [],
      };
    }
  });
}

export async function generateTwitterGrowthPlan(params: {
  currentFollowers: number;
  niche: string;
  targetFollowers: number;
  weekCount: number;
  expertise: string[];
}): Promise<object> {
  const system = `You are a Twitter growth strategist. You create engagement-first strategies.

X grows differently than LinkedIn:
- Consistency > perfection
- Conversation > broadcasting
- Niche > broad appeal
- Replies & threads > single tweets

Return ONLY valid JSON.`;

  const user = `Create a ${params.weekCount}-week Twitter growth plan:
- Current: ${params.currentFollowers} followers
- Target: ${params.targetFollowers} followers
- Niche: ${params.niche}
- Expertise: ${params.expertise.join(', ')}

Return JSON:
{
  "overview": "string",
  "weeks": [
    {
      "week": 1,
      "theme": "string",
      "goals": ["goal1", "goal2"],
      "actions": [
        { "type": "tweet|reply|thread|space|engage", "description": "string", "frequency": "string", "priority": "high|medium|low" }
      ],
      "suggestedTopics": ["topic1", "topic2"]
    }
  ]
}`;

  try {
    const raw = await callAI(system, user, { responseFormat: 'json', maxTokens: 3000 });
    console.log('[generateTwitterGrowthPlan] Raw response:', raw.substring(0, 200));

    const extracted = extractJSON(raw);
    console.log('[generateTwitterGrowthPlan] Extracted:', extracted.substring(0, 200));

    if (!extracted || extracted.length === 0) {
      console.error('Failed to extract JSON from response:', raw);
      return { error: 'Plan generation failed - could not parse response', raw };
    }

    // Try to parse directly first
    try {
      const parsed = JSON.parse(extracted);
      console.log('[generateTwitterGrowthPlan] Successfully parsed. Weeks:', parsed.weeks?.length);
      return parsed;
    } catch (parseErr) {
      console.warn('[generateTwitterGrowthPlan] JSON parse failed, attempting recovery:', parseErr);

      // Fallback: Extract overview and weeks using regex
      const overviewMatch = extracted.match(/"overview"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/) ||
                           extracted.match(/'overview'\s*:\s*'([^']*(?:\\.[^']*)*)'/) ||
                           extracted.match(/overview\s*:\s*"([^"]*(?:\\.[^"]*)*)/);

      const weeksMatch = extracted.match(/"weeks"\s*:\s*\[([\s\S]*?)\]\s*(?:}|,)/);

      if (overviewMatch) {
        const overview = overviewMatch[1];
        const weeks = weeksMatch ? buildWeeksFromJSON(weeksMatch[1]) : [];
        console.log('[generateTwitterGrowthPlan] Recovered from malformed JSON. Weeks:', weeks.length);
        return { overview, weeks };
      }

      throw parseErr;
    }
  } catch (err) {
    console.error('Twitter growth plan generation error:', err);
    console.error('Error details:', {
      message: String(err),
      name: (err as Error).name,
      stack: (err as Error).stack,
    });
    return { error: 'Plan generation failed', raw: String(err) };
  }
}

// =============================================
// Lead Intelligence Engine
// =============================================

export interface GenerateLeadBriefParams {
  leadName: string;
  company?: string;
  role?: string;
  linkedinUrl?: string;
  additionalContext?: string;
}

export async function generateLeadBrief(params: GenerateLeadBriefParams): Promise<LeadBrief> {
  const system = `You are a sales intelligence analyst. Your job is to research a lead and produce a brief that will power highly personalized outreach.

TASK:
1. Detect the most likely archetype from the role, company, and context provided
2. Infer 2-3 pain points specific to their role/company/industry
3. Generate 3-5 SPECIFIC personalization hooks (not generic statements like "they work in marketing" — instead, "they recently pivoted from B2C to B2B, likely experiencing CAC shock")
4. Determine the best outreach approach based on their archetype
5. Identify red flags (things to avoid in outreach)

ARCHETYPE PROFILES (use these to guide your analysis):
${Object.entries(ARCHETYPE_PROFILES)
  .map(
    ([key, profile]) => `
${profile.label} (${key}):
- Common pains: ${profile.commonPains.join(', ')}
- Tone: ${profile.toneGuidelines}
- Hook patterns: ${profile.hookPatterns.join(', ')}
- Avoid: ${profile.avoidList.join(', ')}
`,
  )
  .join('\n')}

OUTPUT: Return ONLY valid JSON matching this structure:
{
  "archetype": "founder_ceo|marketing_leader|...",
  "summary": "2-3 sentence overview of the lead",
  "recentActivity": ["activity 1", "activity 2"],
  "painPoints": ["pain 1", "pain 2"],
  "personalizationHooks": ["specific hook 1", "specific hook 2", "specific hook 3"],
  "bestApproach": "recommended outreach approach (1-2 sentences)",
  "redFlags": ["avoid this", "don't mention that"]
}`;

  const user = `Generate a lead brief for:
- Name: ${params.leadName}
- Company: ${params.company || 'unknown'}
- Role: ${params.role || 'unknown'}
- LinkedIn URL: ${params.linkedinUrl || 'not provided'}
${params.additionalContext ? `\nAdditional context:\n${params.additionalContext}` : ''}

Return ONLY the JSON (no preamble, no markdown fences).`;

  const raw = await callAI(system, user, { responseFormat: 'json', maxTokens: 1500 });

  try {
    const parsed = JSON.parse(extractJSON(raw)) as Omit<LeadBrief, 'id' | 'leadCompany' | 'leadRole' | 'linkedinUrl' | 'generatedAt'>;
    return {
      id: `brief_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      leadName: params.leadName,
      leadCompany: params.company,
      leadRole: params.role,
      linkedinUrl: params.linkedinUrl,
      archetype: (parsed.archetype as LeadArchetype) || 'other',
      summary: parsed.summary,
      recentActivity: parsed.recentActivity || [],
      painPoints: parsed.painPoints || [],
      personalizationHooks: parsed.personalizationHooks || [],
      bestApproach: parsed.bestApproach,
      redFlags: parsed.redFlags || [],
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return {
      id: `brief_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      leadName: params.leadName,
      leadCompany: params.company,
      leadRole: params.role,
      linkedinUrl: params.linkedinUrl,
      archetype: 'other',
      summary: 'Failed to generate brief. Please try again.',
      recentActivity: [],
      painPoints: [],
      personalizationHooks: [],
      bestApproach: 'Manual research recommended',
      redFlags: [],
      generatedAt: new Date().toISOString(),
    };
  }
}
