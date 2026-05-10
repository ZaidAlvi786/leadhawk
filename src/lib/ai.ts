// =============================================
// LeadHawk - AI Generation Service
// =============================================

import type {
  LeadResearch, LeadResearchSource, LeadArchetype, UserPositioning,
  OutreachComponents, ReplyAnalysis, ReplyClassification, ReplyPlaybookOption,
  LinkedInPostType, IntentSignal,
  DiscoveryBrief, DiscoveryCallPhase, CallDebrief, Proposal,
} from './types';
import { ARCHETYPE_PROFILES } from './archetypes';
import { buildPositioningContext } from './positioning';
import { assembleComponents, BANNED_PHRASES, HIGH_FRICTION_CTA_PHRASES, LOW_FRICTION_CTA_EXAMPLES } from './outreach';
import { STRATEGIC_POST_TYPES } from './icp';
import { DEFAULT_CALL_STRUCTURE, assembleProposalMarkdown } from './discovery';

// Universal anti-fabrication footer prepended to every system prompt.
// The brief calls this rule out explicitly: never invent facts about real people.
const ANTI_FABRICATION_RULE = `\n\nGUARDRAIL: Do not invent facts about specific people or companies. If a fact is not provided to you, omit the claim or label it "inferred — verify before sending". Generic framing is fine; specific made-up details are not.`;

/**
 * Wrap a system prompt with the user's positioning context (when complete) and
 * the universal anti-fabrication guardrail. Use this at the top of every
 * generation function so positioning automatically influences output.
 */
function withPositioning(systemPrompt: string, positioning?: UserPositioning): string {
  const ctx = buildPositioningContext(positioning);
  if (!ctx) return systemPrompt + ANTI_FABRICATION_RULE;
  return `${ctx}\n\n${systemPrompt}${ANTI_FABRICATION_RULE}`;
}

export interface GenerateMessageParams {
  leadName?: string;
  leadTitle: string;
  leadCompany: string;
  leadIndustry: string;
  tone: 'professional' | 'casual' | 'value-driven' | 'problem-solving';
  yourService: string;
  yourName: string;
  positioning?: UserPositioning;
}

// =============================================
// Phase 3: Structured Outreach Components
// =============================================

export interface GenerateOutreachComponentsParams {
  leadName?: string;
  leadTitle?: string;
  leadCompany?: string;
  research: LeadResearch;             // REQUIRED — no research, no message
  positioning?: UserPositioning;
  yourName: string;
}

/**
 * Replaces the old single-blob outreach generator. Returns 4 labeled
 * components so the user learns the structure over time, plus the assembled
 * message ready for the readiness check. The AI must cite at least one source
 * ID — uncited references are filtered out at the boundary.
 */
export async function generateOutreachComponents(params: GenerateOutreachComponentsParams): Promise<OutreachComponents> {
  const sourceList = params.research.sources
    .map((s) => `[${s.id}] ${s.field}: ${s.content.slice(0, 400)}`)
    .join('\n');

  const baseSystem = `You write cold outreach DMs that survive a saturated inbox. Every message you produce has FOUR mandatory components:

1. SPECIFIC REFERENCE — names something real about the prospect, drawn ONLY from the RESEARCH SOURCES below. Cite the source ID(s). If sources are empty, refuse: return all components as empty strings.
2. PATTERN INTERRUPT — a question, an admission, or a sharp observation that breaks the "another sales DM" frame. NOT flattery, NOT a setup line.
3. EARNED RIGHT — one sentence of relevant proof connected to the user's POSITIONING above. Reference the user's mechanism or proof asset; do not invent past clients.
4. LOW-FRICTION ASK — a small ask. Examples of GOOD asks: ${LOW_FRICTION_CTA_EXAMPLES.map((e) => `"${e}"`).join(', ')}. NEVER use any of these high-friction phrases: ${HIGH_FRICTION_CTA_PHRASES.join(', ')}.

ABSOLUTE RULES (these will be machine-checked):
- Whole assembled message MUST be under 300 characters total.
- Do NOT use any of these banned phrases: ${BANNED_PHRASES.join(', ')}.
- The message must NOT start with "I".
- Specific reference must cite at least one source ID — fabricated references will be rejected.

Return ONLY this JSON shape (no preamble, no markdown):
{
  "specificReference": "string",
  "patternInterrupt": "string",
  "earnedRight": "string",
  "lowFrictionAsk": "string",
  "sourceFieldIds": ["src_..."]
}`;

  const system = withPositioning(baseSystem, params.positioning);

  const user = `Compose outreach for:
- Name: ${params.leadName || 'the prospect'}
- Role: ${params.leadTitle || 'unknown'}
- Company: ${params.leadCompany || 'unknown'}

RESEARCH SOURCES (cite these IDs — never reference anything outside this list):
${sourceList || '(none — refuse to generate; return empty strings)'}

Sender's name: ${params.yourName}

Return ONLY the JSON.`;

  const validIds = new Set(params.research.sources.map((s) => s.id));
  let parsed: Partial<OutreachComponents> = {};

  try {
    const raw = await callAI(system, user, { responseFormat: 'json', maxTokens: 1000 });
    const obj = JSON.parse(extractJSON(raw));
    parsed = {
      specificReference: typeof obj.specificReference === 'string' ? obj.specificReference : '',
      patternInterrupt: typeof obj.patternInterrupt === 'string' ? obj.patternInterrupt : '',
      earnedRight: typeof obj.earnedRight === 'string' ? obj.earnedRight : '',
      lowFrictionAsk: typeof obj.lowFrictionAsk === 'string' ? obj.lowFrictionAsk : '',
      sourceFieldIds: Array.isArray(obj.sourceFieldIds)
        ? obj.sourceFieldIds.filter((id: unknown) => typeof id === 'string' && validIds.has(id))
        : [],
    };
  } catch {
    // fall through with empty parsed → caller sees blank components and can retry
  }

  const components: OutreachComponents = {
    specificReference: parsed.specificReference || '',
    patternInterrupt: parsed.patternInterrupt || '',
    earnedRight: parsed.earnedRight || '',
    lowFrictionAsk: parsed.lowFrictionAsk || '',
    sourceFieldIds: parsed.sourceFieldIds || [],
    assembledMessage: '',
  };
  components.assembledMessage = assembleComponents(components);
  return components;
}

// =============================================
// Phase 7: Discovery Call Framework
// =============================================

export interface GenerateDiscoveryBriefParams {
  leadName: string;
  leadCompany?: string;
  leadRole?: string;
  research?: LeadResearch;
  signals?: IntentSignal[];
  positioning?: UserPositioning;
}

export async function generateDiscoveryBrief(params: GenerateDiscoveryBriefParams): Promise<DiscoveryBrief> {
  const sourcesBlock = params.research?.sources?.length
    ? params.research.sources
        .map((s) => `[${s.field}] ${s.content.slice(0, 400)}`)
        .join('\n')
    : '(no research sources)';

  const signalsBlock = params.signals?.length
    ? params.signals
        .map((s) => `- ${s.type}: ${s.title}${s.content && s.content !== s.title ? ` — ${s.content.slice(0, 200)}` : ''}`)
        .join('\n')
    : '(no intent signals)';

  const baseSystem = `You are a sales coach. The user is preparing for a discovery call with a real prospect. Your job is to produce a tight pre-call brief grounded ONLY in the research + signals provided. Do not invent priorities, quotes, or events.

OUTPUT 5 things:
1. topPriorities (2-3): What is THIS lead likely focused on right now? Each priority must be traceable to a source in the research/signals. If no source supports it, label it "(inferred — verify)".
2. discoveryQuestions (5): Questions that test the user's positioning hypothesis. Phrase them in language the LEAD would use, not the user's. They should make BANT (pain, budget, decision-maker, timeline) easier to confirm without sounding like a checklist.
3. likelyObjections (2): What will the lead push back on? For each, write a one-sentence handling that LANDS — not a generic reframe.
4. mechanismConnection: One paragraph connecting the user's positioning's MECHANISM to this lead's pain. Specific. Not "we help with X".
5. callStructure: 4 phases summing to ~18 min for a 20-min call: Discovery questions / Problem confirmation / Mechanism walk-through / Next step.

ABSOLUTE RULES:
- No invented client names, no fabricated past wins.
- If sources are thin, return fewer items rather than fabricate.
- Each discovery question is a single sentence ending in "?".

Return ONLY this JSON shape (no preamble, no markdown):
{
  "topPriorities": ["string"],
  "discoveryQuestions": ["string", "string", "string", "string", "string"],
  "likelyObjections": [{ "objection": "string", "handling": "string" }],
  "mechanismConnection": "string",
  "callStructure": [{ "phase": "string", "minutes": 0, "goal": "string" }]
}`;

  const system = withPositioning(baseSystem, params.positioning);

  const user = `Prepare a discovery brief for:
- Name: ${params.leadName}
- Company: ${params.leadCompany || 'unknown'}
- Role: ${params.leadRole || 'unknown'}

RESEARCH SOURCES (you may only cite these):
${sourcesBlock}

INTENT SIGNALS (real, time-stamped events about this lead/account):
${signalsBlock}

Return ONLY the JSON.`;

  try {
    const raw = await callAI(system, user, { responseFormat: 'json', maxTokens: 1500 });
    const parsed = JSON.parse(extractJSON(raw));

    return {
      generatedAt: new Date().toISOString(),
      topPriorities: Array.isArray(parsed.topPriorities) ? parsed.topPriorities.filter((s: unknown) => typeof s === 'string') : [],
      discoveryQuestions: Array.isArray(parsed.discoveryQuestions) ? parsed.discoveryQuestions.filter((s: unknown) => typeof s === 'string').slice(0, 5) : [],
      likelyObjections: Array.isArray(parsed.likelyObjections)
        ? parsed.likelyObjections
            .filter((o: { objection?: string; handling?: string }) => o && typeof o.objection === 'string' && typeof o.handling === 'string')
            .slice(0, 3)
            .map((o: { objection: string; handling: string }) => ({ objection: o.objection, handling: o.handling }))
        : [],
      mechanismConnection: typeof parsed.mechanismConnection === 'string' ? parsed.mechanismConnection : '',
      callStructure: Array.isArray(parsed.callStructure) && parsed.callStructure.length > 0
        ? parsed.callStructure
            .filter((p: { phase?: string; minutes?: number; goal?: string }) => p && typeof p.phase === 'string' && typeof p.goal === 'string')
            .map((p: { phase: string; minutes?: number; goal: string }) => ({
              phase: p.phase,
              minutes: typeof p.minutes === 'number' && p.minutes > 0 ? p.minutes : 5,
              goal: p.goal,
            } as DiscoveryCallPhase))
        : DEFAULT_CALL_STRUCTURE,
    };
  } catch {
    return {
      generatedAt: new Date().toISOString(),
      topPriorities: [],
      discoveryQuestions: [],
      likelyObjections: [],
      mechanismConnection: 'Brief generation failed — try again or check API keys.',
      callStructure: DEFAULT_CALL_STRUCTURE,
    };
  }
}

export interface GenerateProposalParams {
  leadName: string;
  leadCompany?: string;
  leadRole?: string;
  debrief: CallDebrief;
  positioning?: UserPositioning;
  /** Optional anchor amount the user collected during the call. Drives a non-AI fallback. */
  proposedAmount?: number;
}

export async function generateProposal(params: GenerateProposalParams): Promise<Proposal> {
  const baseSystem = `You are a senior consultant. The user just had a discovery call with a real prospect; you're writing the 1-page proposal.

ABSOLUTE RULES:
- Scope must reflect ONLY what the debrief notes contain. Do not invent capabilities the user didn't mention.
- Milestones must be 2-4 concrete deliverables with realistic day estimates.
- Price: use the proposedAmount if provided. Otherwise infer from the user's POSITIONING outcome and the scope size — round to a clean number.
- Risk reversal must be specific (e.g. "Money back if Milestone 1 not delivered in 14 days") not generic ("satisfaction guaranteed").
- Tone: direct, professional, written by someone who's done this before.

Return ONLY this JSON:
{
  "scope": "2-3 sentence scope statement",
  "milestones": [{"title": "string", "deliverable": "string", "days": 7}],
  "price": 5000,
  "timeline": "e.g. 4 weeks total",
  "riskReversal": "string"
}`;

  const system = withPositioning(baseSystem, params.positioning);

  const debriefSummary = `
- Pain confirmed: ${params.debrief.painConfirmed}${params.debrief.painNotes ? ` — "${params.debrief.painNotes}"` : ''}
- Budget confirmed: ${params.debrief.budgetConfirmed}${params.debrief.budgetNotes ? ` — "${params.debrief.budgetNotes}"` : ''}
- Decision-maker confirmed: ${params.debrief.decisionMakerConfirmed}${params.debrief.decisionMakerNotes ? ` — "${params.debrief.decisionMakerNotes}"` : ''}
- Timeline confirmed: ${params.debrief.timelineConfirmed}${params.debrief.timelineNotes ? ` — "${params.debrief.timelineNotes}"` : ''}
${params.debrief.objectionRaised ? `- Objection raised: "${params.debrief.objectionRaised}"` : ''}
- Next step agreed: "${params.debrief.nextStep}"`;

  const user = `Write a 1-page proposal for:
- Name: ${params.leadName}
- Company: ${params.leadCompany || 'unknown'}
- Role: ${params.leadRole || 'unknown'}
${params.proposedAmount ? `- Anchor price discussed on call: $${params.proposedAmount}` : ''}

DEBRIEF (the only source of truth about this deal):
${debriefSummary}

Return ONLY the JSON.`;

  try {
    const raw = await callAI(system, user, { responseFormat: 'json', maxTokens: 1500 });
    const parsed = JSON.parse(extractJSON(raw));

    const scope = typeof parsed.scope === 'string' ? parsed.scope : '';
    const milestones = Array.isArray(parsed.milestones)
      ? parsed.milestones
          .filter((m: { title?: string; deliverable?: string; days?: number }) =>
            m && typeof m.title === 'string' && typeof m.deliverable === 'string'
          )
          .slice(0, 5)
          .map((m: { title: string; deliverable: string; days?: number }) => ({
            title: m.title,
            deliverable: m.deliverable,
            days: typeof m.days === 'number' && m.days > 0 ? Math.round(m.days) : 7,
          }))
      : [];
    const price = typeof parsed.price === 'number' && parsed.price > 0
      ? Math.round(parsed.price)
      : (params.proposedAmount || 0);
    const timeline = typeof parsed.timeline === 'string' ? parsed.timeline : '';
    const riskReversal = typeof parsed.riskReversal === 'string' ? parsed.riskReversal : '';

    const proposalCore: Omit<Proposal, 'markdown' | 'generatedAt'> = {
      scope, milestones, price, timeline, riskReversal,
    };

    return {
      generatedAt: new Date().toISOString(),
      ...proposalCore,
      markdown: assembleProposalMarkdown({
        leadName: params.leadName,
        leadCompany: params.leadCompany,
        positioning: params.positioning,
        proposal: proposalCore,
      }),
    };
  } catch {
    const fallback: Omit<Proposal, 'markdown' | 'generatedAt'> = {
      scope: 'Proposal generation failed — fill in manually.',
      milestones: [],
      price: params.proposedAmount || 0,
      timeline: '',
      riskReversal: '',
    };
    return {
      generatedAt: new Date().toISOString(),
      ...fallback,
      markdown: assembleProposalMarkdown({
        leadName: params.leadName,
        leadCompany: params.leadCompany,
        positioning: params.positioning,
        proposal: fallback,
      }),
    };
  }
}

// =============================================
// Phase 5: Weekly Truth Review
// =============================================

export interface WeeklyDiagnosisInput {
  // Pre-formatted summary the caller passes in. We don't pass raw lead arrays
  // because the AI doesn't need them — it needs the *story*, not the data.
  currentWeekSummary: string;
  previousWeekSummary: string;
  // Optional context: what changed in the user's behaviour week over week
  // (e.g. "8 of last 10 messages had no specific reference traceable to research").
  behaviorContext?: string;
  positioning?: UserPositioning;
}

export interface WeeklyDiagnosis {
  diagnosis: string;          // 1-2 sentence diagnosis citing the actual numbers
  likelyCause: string;        // the user's behaviour that drove the result
  oneAction: string;          // ONE concrete action for this week
}

export async function generateWeeklyDiagnosis(params: WeeklyDiagnosisInput): Promise<WeeklyDiagnosis> {
  const baseSystem = `You are a sales coach. The user just opened their weekly review. Your job is to look at the week-over-week numbers, name what's working or breaking, and give them ONE concrete action for the week ahead.

RULES:
- Diagnosis MUST cite the actual numbers from the summaries. No vague platitudes ("keep up the momentum").
- Likely cause MUST point at a USER BEHAVIOR (e.g. "your last 10 messages had no specific reference"), not external factors. The user can change their own behavior — they can't change the market.
- One action: a single, concrete, this-week move. NOT a goal ("close 3 deals"). A behavior ("rewrite your top 3 saved templates to include a specific reference").
- Tone: direct, not punitive. The user is doing the work; you're helping them see what to adjust.
- 3 fields total. Keep each one tight.

Return ONLY this JSON shape:
{
  "diagnosis": "1-2 sentences citing the real numbers",
  "likelyCause": "1-2 sentences naming the user behavior",
  "oneAction": "ONE concrete behavior change for this week"
}`;

  const system = withPositioning(baseSystem, params.positioning);

  const user = `Last week's numbers:
${params.previousWeekSummary}

This week's numbers:
${params.currentWeekSummary}

${params.behaviorContext ? `Recent behavior signals:\n${params.behaviorContext}` : ''}

Diagnose what's happening and recommend ONE action.`;

  try {
    const raw = await callAI(system, user, { responseFormat: 'json', maxTokens: 600 });
    const parsed = JSON.parse(extractJSON(raw));
    return {
      diagnosis: typeof parsed.diagnosis === 'string' ? parsed.diagnosis : '',
      likelyCause: typeof parsed.likelyCause === 'string' ? parsed.likelyCause : '',
      oneAction: typeof parsed.oneAction === 'string' ? parsed.oneAction : '',
    };
  } catch {
    return {
      diagnosis: 'Diagnosis unavailable — try again or check API keys.',
      likelyCause: '',
      oneAction: '',
    };
  }
}

// =============================================
// Phase 3: Reply Coach
// =============================================

export interface AnalyzeReplyParams {
  prospectReply: string;
  leadName?: string;
  leadRole?: string;
  leadCompany?: string;
  // The original outreach message we sent — gives the model context for the reply
  originalMessage?: string;
  positioning?: UserPositioning;
}

const REPLY_CLASS_HINTS: Record<ReplyClassification, string> = {
  'interested':       'They want to learn more. Move toward a concrete next step.',
  'objection-price':  'They flagged cost. Reframe around value or unbundle.',
  'objection-timing': '"Not now." Earn permission to follow up later.',
  'objection-fit':    'They think you don\'t fit. Either reframe or graciously bow out.',
  'objection-trust':  'They\'re skeptical of you specifically. Lead with proof.',
  'referral-out':     'They redirected to someone else. Use the warm intro path.',
  'polite-no':        'A no — close gracefully and ask permission to revisit.',
  'ghosting-risk':    'Vague / one-word reply. Risk of fading; one more concrete touch.',
  'other':            'Doesn\'t fit a standard pattern. Read carefully and respond per their words.',
};

export async function analyzeReply(params: AnalyzeReplyParams): Promise<ReplyAnalysis> {
  const baseSystem = `You are a sales coach who classifies prospect replies and proposes 2-3 strategic options for the next move. You do NOT pick one — the user picks.

CLASSIFICATION CHOICES (pick exactly one):
${Object.entries(REPLY_CLASS_HINTS).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

PLAYBOOK RULES:
- Return 2-3 distinct options, each labeled with a short name (e.g. "Acknowledge + reframe", "Bow out gracefully", "Send proof + retry in 30d").
- Each option needs a 2-3 sentence approach AND a sample reply message AND an honest tradeoff (why a user might NOT pick this).
- Sample messages must follow the same rules as cold outreach: under 300 chars, no banned phrases, no "I"-opener, low-friction ask.
- BANNED phrases: ${BANNED_PHRASES.join(', ')}.

Return ONLY this JSON shape (no preamble, no markdown):
{
  "classification": "interested|objection-price|objection-timing|objection-fit|objection-trust|referral-out|polite-no|ghosting-risk|other",
  "confidence": 0.0,
  "reasoning": "1-2 sentences justifying the classification, citing words from the reply",
  "playbook": [
    {
      "label": "string",
      "approach": "2-3 sentences",
      "exampleMessage": "string under 300 chars",
      "tradeoff": "1 sentence on the downside"
    }
  ]
}`;

  const system = withPositioning(baseSystem, params.positioning);

  const user = `Classify this prospect reply and propose 2-3 strategic options:

Prospect: ${params.leadName || 'unknown'}, ${params.leadRole || ''} at ${params.leadCompany || ''}
${params.originalMessage ? `\nOriginal message I sent:\n${params.originalMessage}\n` : ''}
Their reply:
"""
${params.prospectReply}
"""

Return ONLY the JSON.`;

  try {
    const raw = await callAI(system, user, { responseFormat: 'json', maxTokens: 1500 });
    const parsed = JSON.parse(extractJSON(raw));

    const validClasses: ReplyClassification[] = [
      'interested', 'objection-price', 'objection-timing', 'objection-fit',
      'objection-trust', 'referral-out', 'polite-no', 'ghosting-risk', 'other',
    ];
    const classification: ReplyClassification = validClasses.includes(parsed.classification)
      ? parsed.classification
      : 'other';

    const playbook: ReplyPlaybookOption[] = Array.isArray(parsed.playbook)
      ? parsed.playbook
          .filter((p: { label?: string; approach?: string; exampleMessage?: string }) =>
            p && typeof p.label === 'string' && typeof p.approach === 'string' && typeof p.exampleMessage === 'string'
          )
          .slice(0, 3)
          .map((p: { label: string; approach: string; exampleMessage: string; tradeoff?: string }) => ({
            label: p.label,
            approach: p.approach,
            exampleMessage: p.exampleMessage,
            tradeoff: typeof p.tradeoff === 'string' ? p.tradeoff : '',
          }))
      : [];

    return {
      classification,
      confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
      playbook,
    };
  } catch {
    return {
      classification: 'other',
      confidence: 0,
      reasoning: 'Analysis failed — try again or check API keys.',
      playbook: [],
    };
  }
}

export interface GeneratePostParams {
  topic: string;
  postType: LinkedInPostType;
  industry: string;
  targetAudience: string;
  yourSkills: string[];
  positioning?: UserPositioning;
  /** Phase 4 — ICP this post targets. Used in the prompt for sharper writing. */
  icpTag?: string;
  /** Phase 4 — when the topic comes from a specific lead's pain, surface that context. */
  pipelineContext?: string;
}

export interface GeneratePlanParams {
  currentRole: string;
  targetAudience: string;
  mainSkills: string[];
  businessGoal: string;
  weekCount: number;
  positioning?: UserPositioning;
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
  const baseSystem = `You write short LinkedIn outreach messages that sound like a real person — not a sales bot.

CRITICAL RULES:
- NEVER fake familiarity. You don't know their work, haven't read their posts, haven't "been following their journey." Don't pretend otherwise.
- NEVER use generic flattery like "your impressive work" or "your innovative approach." If you can't name something specific and real, skip compliments entirely.
- Be direct about your intent: you're reaching out because their pain matches the user's mechanism (per the POSITIONING above).
- Keep it under 300 characters for connection requests. Short = respectful of their time.
- Sound like a human sending a quick note, not a copywriter crafting a "hook."
- One message, no subject line, no labels, no explanations.
- BANNED phrases: "hope this finds you well", "quick question", "circle back", "synergy", "leverage", "I came across your profile", "I wanted to reach out".
- Do NOT start the message with "I".

Tone: ${params.tone}.`;
  const system = withPositioning(baseSystem, params.positioning);

  const user = `Write a LinkedIn connection message:
- To: ${params.leadName || 'the prospect'}, ${params.leadTitle} at ${params.leadCompany}
- Their industry: ${params.leadIndustry || 'not specified'}
- What I do: ${params.yourService}
- My name: ${params.yourName}

Connect their likely pain to the mechanism in my POSITIONING. Be specific. No fake familiarity. Return ONLY the message text.`;

  return callAI(system, user);
}

export async function generateLinkedInPost(params: GeneratePostParams): Promise<{ content: string; hashtags: string[]; hook: string }> {
  // Phase 4: each strategic post type gets its own funnel-tied guidance.
  // Legacy types fall back to a generic prompt for back-compat.
  const typeMeta = STRATEGIC_POST_TYPES[params.postType];
  const typeGuidance = typeMeta
    ? `\n\nPOST TYPE: ${typeMeta.label.toUpperCase()} — funnel objective: ${typeMeta.funnelObjective}\n\n${typeMeta.promptGuidance}`
    : `\n\nPost type (legacy): ${params.postType}. Use generic best practices.`;

  const icpLine = params.icpTag
    ? `\n\nThis post is targeted at ICP: "${params.icpTag}". Speak directly to that audience — not "professionals", not "founders", THIS specific person.`
    : '';

  const pipelineLine = params.pipelineContext
    ? `\n\nThe topic came from a real prospect in the user's pipeline. Their pain, in their words:\n"${params.pipelineContext}"\nLet this ground the post — write as if the prospect is one of many feeling this, not as if it's the only example.`
    : '';

  const baseSystem = `You are a LinkedIn content strategist who writes posts that reinforce the user's POSITIONING above and drive a specific funnel objective.${typeGuidance}${icpLine}${pipelineLine}

WRITING STYLE:
- Sound like a real person sharing a real experience or insight — never like a copywriter
- Open with a strong hook in the first 2 lines (everything else is hidden behind "see more")
- Use SHORT paragraphs — 1-2 sentences each, separated by blank lines
- Use emojis sparingly to break up sections (one per major section is plenty)
- If you reference a "story" or "number" or "example", it MUST come from the user's prompt/pipelineContext above or be labeled "(hypothetical)". Do not invent past clients or wins.
- Avoid sales-bot phrases: "revolutionize", "game-changing", "unlock", "leverage", "synergy"
- Vary sentence length — mix short punchy lines with longer ones
- End with a thought-provoking question that invites comments (the comments ARE the conversion mechanism for this post type)

LENGTH: 150-300 words total.

HASHTAGS: End the post with 5-10 relevant hashtags on their own line(s) at the very bottom. No spaces inside tags.`;
  const system = withPositioning(baseSystem, params.positioning);

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
  const baseSystem = `You are a LinkedIn growth expert who creates actionable monetization strategies.
Strategies must reinforce the user's POSITIONING above — every action funnels back to landing the ICP described.
Return ONLY valid JSON.`;
  const system = withPositioning(baseSystem, params.positioning);

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

export async function generateFilterSuggestions(description: string, positioning?: UserPositioning): Promise<object> {
  const baseSystem = `You are a B2B sales expert who knows Sales Navigator deeply.
Given a target customer description, extract optimal filter values that match the user's POSITIONING.
Return ONLY valid JSON.

IMPORTANT — use these EXACT values where possible:
- industries: "Technology", "SaaS", "FinTech", "E-Commerce", "Healthcare", "Marketing & Advertising", "Real Estate", "Education", "Consulting", "Manufacturing", "Retail", "Media", "Legal", "Construction", "Design", "Financial Services", "Software", "Insurance", "Automotive", "Hospitality", "Human Resources", "Non-profit", "Government", "Pharmaceuticals", "Biotechnology"
- seniorityLevels: "Individual Contributor", "Manager", "Director", "VP", "C-Suite", "Partner", "Owner", "Founder"
- companySize: "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10000+"
- locations: Use real city/country names like "United States", "London, UK", "Germany"
- jobTitles and keywords: free-form, use whatever fits best`;
  const system = withPositioning(baseSystem, positioning);

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
  positioning?: UserPositioning;
}

export async function generateEmailSequence(params: GenerateSequenceParams): Promise<{
  steps: { type: string; subject: string; body: string; delayDays: number }[];
}> {
  const numSteps = params.sequenceLength || 3;

  const baseSystem = `You are a cold email expert who builds sequences that get replies.
Every email connects the prospect's pain to the user's MECHANISM and OUTCOME (per POSITIONING above).

CRITICAL RULES:
- Email 1 (intro): Short, direct. Who you are, why you're reaching out, one clear ask. No flattery.
- Email 2 (value-add): Share a generic insight or framework that applies to their role — NOT a fabricated audit of their specific company (you have no real data on them).
- Email 3+ (follow-up/breakup): Short. Acknowledge they're busy. Either share one more angle or gracefully close the loop. The "breakup" email ("No worries if this isn't a fit") consistently gets the highest reply rate.

NEVER:
- Fake familiarity or claim you've "been following their work"
- Invent a "mini-audit" of a specific company you have no data on
- Write generic compliments
- Use salesy language ("revolutionize", "game-changing", "unlock", "leverage", "synergy")
- Write emails longer than 100 words each

Tone: ${params.tone}.
Return ONLY valid JSON.`;
  const system = withPositioning(baseSystem, params.positioning);

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
  positioning?: UserPositioning;
}

export async function suggestNextAction(params: SuggestActionParams): Promise<string> {
  const baseSystem = `You are a sales coach. Given a lead's current pipeline stage and context, suggest ONE specific next action in 1-2 sentences.

Rules:
- Tie the action to the user's POSITIONING (mechanism, outcome, proof) when relevant.
- Do NOT invent context about this specific lead (e.g. "their recent product launch") unless it appears in the notes.
- If you're guessing, prefix with "Likely guess:" so the user knows.`;
  const system = withPositioning(baseSystem, params.positioning);

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
  positioning?: UserPositioning;
}

export async function generateTweet(params: GenerateTweetParams): Promise<{ content: string; hook: string }> {
  const baseSystem = `You are a viral X/Twitter expert who writes posts that get engagement.

Tweets reinforce the user's POSITIONING above — they speak to the user's ICP and name a pain or share an insight tied to the user's mechanism.

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
- Invent specific past wins or client names
`;
  const system = withPositioning(baseSystem, params.positioning);

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
  positioning?: UserPositioning;
}): Promise<{ hook: string; setup: string[]; insights: string[]; cta: string }> {
  const baseSystem = `You are a Twitter thread expert. You write threads that:
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
- Inventing client names, project specifics, or fake numbers
`;
  const system = withPositioning(baseSystem, params.positioning);

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
  positioning?: UserPositioning;
}): Promise<object> {
  const baseSystem = `You are a Twitter growth strategist. You create engagement-first strategies.

X grows differently than LinkedIn:
- Consistency > perfection
- Conversation > broadcasting
- Niche > broad appeal
- Replies & threads > single tweets

Plan must funnel followers toward the ICP described in POSITIONING above.

Return ONLY valid JSON.`;
  const system = withPositioning(baseSystem, params.positioning);

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
// Lead Research Synthesis (Phase 2)
//
// Replaces the old generateLeadBrief. Crucially, this function REFUSES to
// invent facts — it only synthesizes hooks from sources the user has pasted.
// The previous behavior (model fabricating "recent activity") is now banned
// at the prompt level.
// =============================================

export interface SynthesizeResearchParams {
  leadName: string;
  company?: string;
  role?: string;
  linkedinUrl?: string;
  sources: LeadResearchSource[];
  positioning?: UserPositioning;
}

export type SynthesisResult = Pick<LeadResearch, 'archetype' | 'summary' | 'hooks' | 'bestApproach' | 'redFlags'>;

export async function synthesizeLeadResearch(params: SynthesizeResearchParams): Promise<SynthesisResult> {
  const baseSystem = `You are a sales research synthesizer. The user has pasted real artifacts about a specific lead. Your job is to organize what they pasted into hooks they can use in outreach.

ABSOLUTE RULES:
- Use ONLY the information the user provides in the SOURCES below. You have no internet access.
- Do NOT infer, assume, or invent any fact about this person.
- If sources are sparse or empty, produce FEWER but better-grounded hooks. Do not fabricate to hit a count.
- Every hook MUST cite the source ID(s) it draws from in "sourceFieldIds". A hook with no citation is invalid — omit it.
- The "archetype" field is a categorization based on role/company; that is allowed. Pain framing comes from the archetype context. Specific claims about THIS lead must be sourced.

ARCHETYPE PROFILES (use these to choose the archetype + frame approach):
${Object.entries(ARCHETYPE_PROFILES)
  .map(
    ([key, profile]) => `
${profile.label} (${key}):
- Tone: ${profile.toneGuidelines}
- Avoid: ${profile.avoidList.join(', ')}
`,
  )
  .join('\n')}

OUTPUT: Return ONLY valid JSON matching this structure (no markdown, no preamble):
{
  "archetype": "founder_ceo|marketing_leader|sales_leader|agency_owner|engineering_manager|product_manager|freelancer_creator|operations_leader|other",
  "summary": "2-3 sentence overview based ONLY on what's in sources + their role/company. Do not embellish.",
  "hooks": [
    {
      "text": "the hook line (under 200 chars). Must reference real specifics from the cited sources.",
      "sourceFieldIds": ["src_xxx"]
    }
  ],
  "bestApproach": "1-2 sentences on the recommended angle, tied to the user's POSITIONING above and the actual sources.",
  "redFlags": ["string"]
}

If sources are entirely empty, return summary="No sources provided yet — paste a recent post, news link, or job posting to enable hook generation.", hooks=[], bestApproach="Gather research first.", redFlags=[].`;
  const system = withPositioning(baseSystem, params.positioning);

  const sourcesBlock = params.sources.length === 0
    ? '(no sources provided yet)'
    : params.sources
        .map((s) => `[${s.id}] field=${s.field}${s.url ? ` url=${s.url}` : ''}\n  content: ${s.content.replace(/\n+/g, ' ').slice(0, 800)}`)
        .join('\n\n');

  const user = `Synthesize research for:
- Name: ${params.leadName}
- Company: ${params.company || 'unknown'}
- Role: ${params.role || 'unknown'}
- LinkedIn: ${params.linkedinUrl || 'not provided'}

SOURCES (each preceded by an ID you must cite):
${sourcesBlock}

Return ONLY the JSON.`;

  const raw = await callAI(system, user, { responseFormat: 'json', maxTokens: 1500 });

  try {
    const parsed = JSON.parse(extractJSON(raw));
    // Filter out hooks that didn't cite a real source — the prompt forbids it
    // but the model occasionally drops the array. Be defensive at the boundary.
    const validIds = new Set(params.sources.map((s) => s.id));
    const hooks = Array.isArray(parsed.hooks)
      ? parsed.hooks
          .filter((h: { text?: string; sourceFieldIds?: string[] }) => h.text && Array.isArray(h.sourceFieldIds) && h.sourceFieldIds.length > 0)
          .map((h: { text: string; sourceFieldIds: string[] }) => ({
            text: h.text,
            sourceFieldIds: h.sourceFieldIds.filter((id) => validIds.has(id)),
          }))
          .filter((h: { sourceFieldIds: string[] }) => h.sourceFieldIds.length > 0)
      : [];

    return {
      archetype: (parsed.archetype as LeadArchetype) || 'other',
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      hooks,
      bestApproach: typeof parsed.bestApproach === 'string' ? parsed.bestApproach : '',
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
    };
  } catch {
    return {
      archetype: 'other',
      summary: 'Synthesis failed. Try again or check API keys.',
      hooks: [],
      bestApproach: '',
      redFlags: [],
    };
  }
}
