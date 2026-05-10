// This module exists because: the discovery-call → debrief → proposal chain
// is where freelancers/consultants lose deals. Beginners wing the call,
// don't capture BANT, write proposals from memory, and wonder why their
// close rate is 10%. These pure helpers make the chain rigorous: BANT
// scoring, debrief completeness, and proposal Markdown assembly — all
// testable without a network call.

import type { CallDebrief, Proposal, UserPositioning } from './types';

// -----------------------------------------------------------------------------
// BANT — the four pillars a discovery call should confirm.
// -----------------------------------------------------------------------------

export type BantPillar = 'pain' | 'budget' | 'decisionMaker' | 'timeline';

export const BANT_LABELS: Record<BantPillar, string> = {
  pain: 'Pain',
  budget: 'Budget',
  decisionMaker: 'Decision-maker',
  timeline: 'Timeline',
};

/** 0-4 score for how many BANT pillars the debrief confirmed. */
export function bantScore(debrief: CallDebrief | undefined): number {
  if (!debrief) return 0;
  return [
    debrief.painConfirmed,
    debrief.budgetConfirmed,
    debrief.decisionMakerConfirmed,
    debrief.timelineConfirmed,
  ].filter(Boolean).length;
}

/**
 * What the BANT score means in plain English. Used by the debrief panel
 * and the "ready to propose?" gate on the proposal generator.
 */
export function bantVerdict(score: number): { label: string; tone: 'good' | 'warn' | 'bad'; advice: string } {
  if (score >= 4) return {
    label: 'All clear',
    tone: 'good',
    advice: 'Pain, budget, decision-maker, and timeline all confirmed — proposal is the right next move.',
  };
  if (score === 3) return {
    label: 'Strong fit',
    tone: 'good',
    advice: 'Only one pillar missing. Worth asking one more clarifying question over email before the proposal lands.',
  };
  if (score === 2) return {
    label: 'Half-qualified',
    tone: 'warn',
    advice: 'Half the pillars are unconfirmed — proposal will likely stall. Schedule a 15-min follow-up to close the gaps.',
  };
  if (score === 1) return {
    label: 'Weak signal',
    tone: 'bad',
    advice: 'Only one pillar confirmed. Sending a proposal now wastes their time and yours. Re-qualify or close-lost.',
  };
  return {
    label: 'Not qualified',
    tone: 'bad',
    advice: 'No BANT pillars confirmed. Either the call didn\'t happen or this isn\'t a real prospect — log debrief honestly.',
  };
}

/**
 * Per-pillar status. Each pillar is `confirmed`, `unconfirmed-with-notes`
 * (the user wrote something but didn't tick the box), or `missing`.
 * Drives the inline visual on the debrief panel.
 */
export function pillarStatus(debrief: CallDebrief | undefined, pillar: BantPillar): 'confirmed' | 'noted' | 'missing' {
  if (!debrief) return 'missing';
  const confirmedKey = `${pillar}Confirmed` as const;
  const notesKey = `${pillar}Notes` as const;
  const confirmed = (debrief as unknown as Record<string, unknown>)[confirmedKey] as boolean;
  const notes = (debrief as unknown as Record<string, unknown>)[notesKey] as string | undefined;
  if (confirmed) return 'confirmed';
  if (notes && notes.trim().length > 0) return 'noted';
  return 'missing';
}

/** Whether the debrief has enough to drive a proposal. */
export function isDebriefReady(debrief: CallDebrief | undefined): boolean {
  if (!debrief) return false;
  if (!debrief.nextStep || !debrief.nextStep.trim()) return false;
  // Require pain at minimum — without pain there's no proposal worth writing
  return debrief.painConfirmed;
}

// -----------------------------------------------------------------------------
// Proposal Markdown assembly — pure function, no AI. The AI fills the
// scope/milestones/etc. fields; this just renders them as a 1-page Markdown
// document the user can paste into Notion or Google Docs.
// -----------------------------------------------------------------------------

interface AssembleProposalInput {
  leadName: string;
  leadCompany?: string;
  positioning?: UserPositioning;
  proposal: Omit<Proposal, 'markdown' | 'generatedAt'>;
}

export function assembleProposalMarkdown(input: AssembleProposalInput): string {
  const { leadName, leadCompany, positioning, proposal } = input;
  const today = new Date().toLocaleDateString();
  const senderName = positioning ? `Your team` : 'Your team';
  const greeting = leadCompany ? `${leadName} at ${leadCompany}` : leadName;

  const milestonesSection = proposal.milestones
    .map((m, i) => `**Milestone ${i + 1} — ${m.title}** (${m.days}d)\n${m.deliverable}`)
    .join('\n\n');

  return `# Proposal — ${leadCompany || leadName}

**Prepared for:** ${greeting}
**Date:** ${today}
${positioning ? `**Outcome:** ${positioning.outcomeMetric}${positioning.outcomeIsProjected ? ' (projected)' : ''} ${positioning.outcomeTimeframe}` : ''}

---

## Scope

${proposal.scope}

## Milestones

${milestonesSection}

## Investment

**${formatPrice(proposal.price)}** — ${proposal.timeline}

## Risk Reversal

${proposal.riskReversal}

## Next Step

Reply with "go" and I'll send the contract + start date this week.

— ${senderName}
`.trim();
}

function formatPrice(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
  return `$${amount.toLocaleString('en-US')}`;
}

// -----------------------------------------------------------------------------
// Default call structure — used as a fallback when the AI brief generation
// fails or returns no callStructure. Total: 18 minutes, leaves 2-min buffer
// for a 20-min call.
// -----------------------------------------------------------------------------

import type { DiscoveryCallPhase } from './types';

export const DEFAULT_CALL_STRUCTURE: DiscoveryCallPhase[] = [
  { phase: 'Discovery questions',     minutes: 8, goal: 'Confirm pain, budget, decision-maker, timeline. Listen 80%.' },
  { phase: 'Problem confirmation',    minutes: 4, goal: 'Restate their pain in your words. Get explicit "yes, that\'s it".' },
  { phase: 'Mechanism walk-through',  minutes: 4, goal: 'Show how your specific approach would solve THIS pain. Skip the generic pitch.' },
  { phase: 'Next step',               minutes: 2, goal: 'Land a concrete next move — proposal date, follow-up call, or graceful close.' },
];
