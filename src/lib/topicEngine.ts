import type { LinkedInPost } from './types';
import { TOPIC_SUGGESTIONS } from './postTopics';
import { callAI, extractJSON } from './ai';

export interface TrendingTopic {
  id: string;
  title: string;
  angle: string;
  niche: string;
  postType: LinkedInPost['postType'];
  trendScore: number;
  trendReason: string;
  audienceFit: number;
  viralPattern: string;
  suggestedHook: string;
  generatedAt: string;
  expiresAt: string;
}

// =============================================
// Trending Topics Generation
// =============================================

export interface GenerateTrendingTopicsParams {
  niche: string;
  audience: string;
  expertiseAreas: string[];
  recentPostThemes?: string[];
  weekCount?: number;
}

export async function generateTrendingTopics(params: GenerateTrendingTopicsParams): Promise<TrendingTopic[]> {
  const system = `You are a LinkedIn content strategist who tracks current trends and viral patterns in tech communities.

Your job is to generate 10 trending topic ideas that are:
1. TIMELY — based on current events, developments, or shifts in the ${params.niche} space (2025-2026)
2. SPECIFIC — concrete angles, not generic topics ("AI is transforming X" → bad. "Why 90% of AI projects fail at the evaluation stage" → good)
3. AUDIENCE-ALIGNED — relevant to ${params.audience}
4. HIGH-ENGAGEMENT — designed to trigger comments, shares, or controversy
5. AUTHOR-COMPATIBLE — leverage the author's expertise in ${params.expertiseAreas.join(', ')}

For each topic, identify:
- The SPECIFIC angle (not just the topic)
- A "viral pattern" (how it's designed to spread — contrarian take? Behind-the-scenes story? Useful framework?)
- A "trend score" (1-10, how hot is this right now?)
- An "audience fit score" (1-10, how relevant to the target audience?)
- The strongest first line that hooks readers

Avoid:
${params.recentPostThemes ? `- Recycling these recent themes: ${params.recentPostThemes.join(', ')}` : ''}
- Generic advice or overused angles
- Topics that won't spark discussion

Output ONLY valid JSON.`;

  const user = `Generate 10 trending topics for a ${params.niche} creator:
- Target audience: ${params.audience}
- Creator's expertise: ${params.expertiseAreas.join(', ')}
${params.recentPostThemes ? `- Avoid repeating: ${params.recentPostThemes.join(', ')}` : ''}

Return JSON array:
[
  {
    "title": "Specific, concrete title",
    "angle": "The unique angle/POV",
    "postType": "thought-leadership|case-study|tips|story|poll|engagement",
    "trendReason": "Why this is trending right now (1-2 sentences)",
    "viralPattern": "e.g. 'contrarian take', 'behind-the-scenes', 'useful framework'",
    "suggestedHook": "First line that hooks readers (under 15 words)",
    "trendScore": 8,
    "audienceFit": 9
  }
]`;

  try {
    const raw = await callAI(system, user, { responseFormat: 'json', maxTokens: 2000 });
    const parsed = JSON.parse(extractJSON(raw)) as Array<
      Omit<TrendingTopic, 'id' | 'generatedAt' | 'expiresAt' | 'niche'>
    >;

    // Add generated timestamps and IDs
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours TTL

    return parsed.map((topic, index) => ({
      ...topic,
      id: `trending_${Date.now()}_${index}`,
      niche: params.niche,
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }));
  } catch (err) {
    console.warn('[Topic Engine] Failed to generate trending topics, falling back to curated list:', err);
    return getFallbackTopics(params.niche);
  }
}

// =============================================
// Fallback: Curated static topics
// =============================================

function getFallbackTopics(niche: string): TrendingTopic[] {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Filter from static topics and convert to TrendingTopic format
  const relevant = TOPIC_SUGGESTIONS.filter((t) => t.trending).slice(0, 10);

  return relevant.map((topic, index) => ({
    id: `fallback_${Date.now()}_${index}`,
    title: topic.topic,
    angle: topic.topic, // Reuse topic as angle for fallback
    niche,
    postType: topic.postType,
    trendScore: topic.trending ? 7 : 5,
    trendReason: 'From curated library (AI generation unavailable)',
    audienceFit: 8,
    viralPattern: 'industry-relevant',
    suggestedHook: topic.topic.substring(0, 40), // First 40 chars as hook
    generatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }));
}

// =============================================
// Topic Cache Management
// =============================================

export function isTopicExpired(topic: TrendingTopic): boolean {
  return new Date(topic.expiresAt) < new Date();
}

export function filterExpiredTopics(topics: TrendingTopic[]): TrendingTopic[] {
  return topics.filter((t) => !isTopicExpired(t));
}

// Re-export static topics for backward compatibility
export { TOPIC_SUGGESTIONS } from './postTopics';
