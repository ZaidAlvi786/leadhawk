// This module exists because: the brief's Operating Principle #5 is "Inbound
// and outbound are one system." If the user has 14 leads in ICP=X but hasn't
// posted to that ICP in 9 days, every cold DM is 3-5x less likely to convert
// (no inbound proof, no warm prior). Tagging entities with an ICP and
// computing the gap between those two sides is the highest-leverage feature
// in the whole improvement brief.

import type {
  UserPositioning, LinkedInPost, Tweet, TwitterThread, PipelineLead,
} from './types';
import { isPositioningComplete } from './positioning';

/**
 * The user's primary ICP label, derived from their committed positioning.
 * Stable identifier used as the default `icpTag` for new posts/leads/etc.
 */
export function primaryIcpLabel(positioning: UserPositioning | null | undefined): string | undefined {
  if (!isPositioningComplete(positioning) || !positioning) return undefined;
  return `${positioning.targetRole} @ ${positioning.targetCompanyType}`;
}

interface KnownIcpsInput {
  positioning: UserPositioning | null | undefined;
  posts: LinkedInPost[];
  tweets: Tweet[];
  threads: TwitterThread[];
  leads: PipelineLead[];
}

/**
 * Deduplicated list of every ICP tag the user has touched, primary first.
 * Used to populate the IcpTagPicker dropdown — gives the user a stable list
 * of choices instead of letting them invent a slightly-different label each
 * time.
 */
export function knownIcps(input: KnownIcpsInput): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const primary = primaryIcpLabel(input.positioning);
  if (primary) {
    seen.add(primary);
    out.push(primary);
  }
  const collect = (tag: string | undefined) => {
    if (!tag) return;
    const trimmed = tag.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    out.push(trimmed);
  };
  for (const p of input.posts)   collect(p.icpTag);
  for (const t of input.tweets)  collect(t.icpTag);
  for (const t of input.threads) collect(t.icpTag);
  for (const l of input.leads)   collect(l.icpTag);
  return out;
}

// -----------------------------------------------------------------------------
// Authority Gap
// -----------------------------------------------------------------------------

/** A gap between the user's outbound activity and their inbound posting. */
export interface AuthorityGap {
  icpTag: string;
  activeLeadCount: number;
  daysSinceLastPost: number | null; // null = never posted to this ICP
  /** Severity is what drives the visual urgency of the banner. */
  severity: 'critical' | 'warning' | 'ok';
}

const POST_GAP_CRITICAL_DAYS = 14;
const POST_GAP_WARNING_DAYS = 7;

interface ComputeGapsInput {
  posts: LinkedInPost[];
  leads: PipelineLead[];
  positioning: UserPositioning | null | undefined;
}

/**
 * Compute the Authority Gap per ICP. Surfaces ICPs where the user has active
 * leads but hasn't posted recently (or ever). Returns one entry per ICP that
 * has either active leads OR recent posts — sorted by severity (worst first).
 *
 * "Active leads" = leads not in closed-won or closed-lost stages.
 * "Last post" = max(createdAt) for posts whose `icpTag` matches the ICP.
 */
export function computeAuthorityGaps(input: ComputeGapsInput, now: Date = new Date()): AuthorityGap[] {
  const primary = primaryIcpLabel(input.positioning);

  // Aggregate by ICP — leads that have no tag default to the primary ICP
  // (otherwise the gap would never surface for unmatured users).
  const leadCounts = new Map<string, number>();
  for (const lead of input.leads) {
    if (lead.stage === 'closed-won' || lead.stage === 'closed-lost') continue;
    const tag = lead.icpTag || primary;
    if (!tag) continue;
    leadCounts.set(tag, (leadCounts.get(tag) || 0) + 1);
  }

  const lastPostByIcp = new Map<string, number>();
  for (const post of input.posts) {
    const tag = post.icpTag || primary;
    if (!tag) continue;
    const t = new Date(post.createdAt).getTime();
    if (isNaN(t)) continue;
    const prev = lastPostByIcp.get(tag);
    if (!prev || t > prev) lastPostByIcp.set(tag, t);
  }

  const allIcps = new Set<string>([
    ...Array.from(leadCounts.keys()),
    ...Array.from(lastPostByIcp.keys()),
  ]);
  const out: AuthorityGap[] = [];
  Array.from(allIcps).forEach((tag) => {
    const activeLeadCount = leadCounts.get(tag) || 0;
    const lastPostMs = lastPostByIcp.get(tag);
    const daysSinceLastPost = lastPostMs == null
      ? null
      : Math.floor((now.getTime() - lastPostMs) / 86_400_000);

    let severity: AuthorityGap['severity'] = 'ok';
    // Only surface as a gap if there are active leads — posting without leads
    // is fine (you're building authority from scratch).
    if (activeLeadCount > 0) {
      if (daysSinceLastPost == null || daysSinceLastPost >= POST_GAP_CRITICAL_DAYS) {
        severity = 'critical';
      } else if (daysSinceLastPost >= POST_GAP_WARNING_DAYS) {
        severity = 'warning';
      }
    }

    out.push({ icpTag: tag, activeLeadCount, daysSinceLastPost, severity });
  });

  // Sort: critical → warning → ok; within each, more active leads first.
  const sevOrder = { critical: 0, warning: 1, ok: 2 };
  out.sort((a, b) => {
    if (sevOrder[a.severity] !== sevOrder[b.severity]) {
      return sevOrder[a.severity] - sevOrder[b.severity];
    }
    return b.activeLeadCount - a.activeLeadCount;
  });

  return out;
}

/**
 * Pick the single most-urgent gap to surface in the banner — or undefined if
 * there's nothing to show. The banner only fires when there's a real gap; we
 * don't nag a user who just posted yesterday.
 */
export function topAuthorityGap(gaps: AuthorityGap[]): AuthorityGap | undefined {
  return gaps.find((g) => g.severity !== 'ok');
}

// -----------------------------------------------------------------------------
// Display labels for the 4 strategic post types (Phase 4)
// -----------------------------------------------------------------------------

import type { LinkedInPostType } from './types';

export interface PostTypeMeta {
  label: string;
  emoji: string;
  funnelObjective: string;     // what this drives downstream
  promptGuidance: string;      // injected into the AI system prompt for this type
}

export const STRATEGIC_POST_TYPES: Partial<Record<LinkedInPostType, PostTypeMeta>> = {
  'pain-naming': {
    label: 'Pain-naming',
    emoji: '😣',
    funnelObjective: 'Drives DMs from people who feel that exact pain',
    promptGuidance: `Name a SPECIFIC TECHNICAL or PROCESS failure the ICP recognizes — not a feeling. The pain is "Stripe drops metered events at 100 req/s per object" or "our Vercel build pipeline OOMs at 4GB of generated routes" — NOT "that pit in your stomach when the CEO asks again." Open with the precise mechanism of the failure (a number, a tool name, a config quirk, a race condition). Therapy-talk language is BANNED here — never write "pit in your stomach", "silent struggle", "burnout", "you've got a talented team but...", "your CEO asks... again", "It's Monday morning". These are AI tells that mark the post as auto-generated within 2 seconds. End with an ask that invites someone to share THEIR specific failure mode — "What's the equivalent in YOUR stack?" — not a generic "what's your experience?".`,
  },
  'mechanism-reveal': {
    label: 'Mechanism reveal',
    emoji: '🔧',
    funnelObjective: 'Drives profile visits + bookmarks',
    promptGuidance: `Show HOW you (or someone) solve a specific problem the ICP has. Walk through one concrete example with steps and decisions. Avoid abstract advice. The reader should leave with a workable mental model AND want to see what else this person knows — that's the profile-visit click.`,
  },
  'proof': {
    label: 'Proof',
    emoji: '🏆',
    funnelObjective: 'Drives credibility for cold DMs',
    promptGuidance: `Show a real before/after, case study, or screenshot. Concrete numbers > adjectives. The post is doing one job: making the next cold DM the user sends 10x more credible because the prospect can search the user's profile and find this. Do NOT invent results — if the user hasn't measured anything, write the post from a "here's how I'd think about it" angle and label any numbers as "(projected)".`,
  },
  'take': {
    label: 'Contrarian take',
    emoji: '🔥',
    funnelObjective: 'Drives followers + authority signal',
    promptGuidance: `A strong, defensible opinion that goes against the current consensus in the niche. Must be specific enough to be wrong (vague takes don't trigger debate). Include the standard view, then dismantle it with one piece of evidence. The post should make people want to argue OR agree publicly — both grow the audience.`,
  },
};
