// This module exists because: every AI prompt and every generator UI in
// LeadHawk depends on the user having committed to a sharp ICP, problem,
// mechanism, and proof. Without these the AI fabricates and the messages
// don't convert. These are pure validators + the system-prompt builder
// that injects positioning into every LLM call.

import type { UserPositioning, ProofAsset } from './types';

export const POSITIONING_SCHEMA_VERSION = 1;

// -----------------------------------------------------------------------------
// Validators — pure functions, easy to unit-test once vitest is wired.
// -----------------------------------------------------------------------------

const VAGUE_NICHE_WORDS = [
  'businesses', 'companies', 'anyone', 'various', 'etc', 'etc.', 'all',
  'everyone', 'startups in general', 'small business', 'smb',
];

const VAGUE_PROBLEM_WORDS = [
  'growth', 'efficiency', 'productivity', 'success', 'better results',
  'optimization', 'scaling', 'transformation', 'synergy',
];

const URL_RE = /^https?:\/\/[^\s]+$/i;

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

export function validateNiche(targetRole: string, targetCompanyType: string): ValidationResult {
  const role = targetRole.trim();
  const company = targetCompanyType.trim();
  if (role.length < 3) return { ok: false, reason: 'Role is required.' };
  if (company.length < 3) return { ok: false, reason: 'Company type is required.' };

  // Reject vague tokens
  const combined = `${role} ${company}`.toLowerCase();
  for (const word of VAGUE_NICHE_WORDS) {
    // word-boundary match so "all" doesn't match "small"
    const re = new RegExp(`\\b${word.replace('.', '\\.')}\\b`);
    if (re.test(combined)) {
      return { ok: false, reason: `"${word}" is too vague — name a specific role or company type.` };
    }
  }

  // Reject lists with more than 2 commas (a sign of "I help X, Y, Z, A, B")
  const commaCount = (combined.match(/,/g) || []).length;
  if (commaCount > 2) {
    return { ok: false, reason: 'Too many commas — pick one role and one company type.' };
  }

  return { ok: true };
}

export function validatePainfulProblem(problem: string): ValidationResult {
  const p = problem.trim();
  if (p.length < 15) {
    return { ok: false, reason: 'Describe the problem in their own words (at least 15 chars).' };
  }
  const lower = p.toLowerCase();
  for (const word of VAGUE_PROBLEM_WORDS) {
    const re = new RegExp(`\\b${word}\\b`);
    if (re.test(lower) && p.length < 80) {
      return {
        ok: false,
        reason: `"${word}" is vague. How would the prospect describe this at 11pm on a Tuesday?`,
      };
    }
  }
  return { ok: true };
}

export function validateMechanism(mechanism: string): ValidationResult {
  const m = mechanism.trim();
  if (m.length < 20) {
    return { ok: false, reason: 'Describe HOW you solve it specifically (at least 20 chars).' };
  }
  // Reject pure platitudes
  const platitudes = ['i code well', 'i work hard', 'i listen', 'best practices'];
  if (platitudes.some((p) => m.toLowerCase().includes(p))) {
    return { ok: false, reason: 'Be specific. "Best practices" is not a mechanism.' };
  }
  return { ok: true };
}

export function validateOutcome(metric: string, timeframe: string): ValidationResult {
  const m = metric.trim();
  const t = timeframe.trim();
  if (m.length < 5) return { ok: false, reason: 'What result do you produce?' };
  if (t.length < 3) return { ok: false, reason: 'How long does it take?' };

  // Require at least one digit in the metric (numbers force specificity)
  if (!/\d/.test(m)) {
    return {
      ok: false,
      reason: 'The outcome must contain a number — even if you have to project it.',
    };
  }
  return { ok: true };
}

export function validateProofAsset(asset: Partial<ProofAsset>): ValidationResult {
  if (!asset.url || !asset.url.trim()) return { ok: false, reason: 'Paste a URL.' };
  if (!URL_RE.test(asset.url.trim())) return { ok: false, reason: 'That doesn\'t look like a URL.' };
  if (!asset.label || asset.label.trim().length < 3) {
    return { ok: false, reason: 'Give it a short label (e.g. "Migration write-up").' };
  }
  return { ok: true };
}

export function validateNotFor(notFor: string): ValidationResult {
  const v = notFor.trim();
  if (v.length < 10) {
    return { ok: false, reason: 'Who do you turn away? Specifics matter — almost no one writes this.' };
  }
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Aggregate completeness check — used everywhere to gate generation.
// -----------------------------------------------------------------------------

export function isPositioningComplete(p: UserPositioning | null | undefined): boolean {
  if (!p) return false;
  return (
    validateNiche(p.targetRole, p.targetCompanyType).ok &&
    validatePainfulProblem(p.painfulProblem).ok &&
    validateMechanism(p.mechanism).ok &&
    validateOutcome(p.outcomeMetric, p.outcomeTimeframe).ok &&
    p.proofAssets.length >= 1 &&
    p.proofAssets.every((a) => validateProofAsset(a).ok) &&
    validateNotFor(p.notFor).ok
  );
}

// -----------------------------------------------------------------------------
// System-prompt builder — injected into every AI call so the model knows
// exactly who the user serves, what they sell, and what they refuse.
// -----------------------------------------------------------------------------

export function buildPositioningContext(p: UserPositioning | null | undefined): string {
  if (!isPositioningComplete(p) || !p) {
    return '';
  }

  const proofLine = p.proofAssets
    .map((a) => `  - ${a.label} (${a.type}): ${a.url}`)
    .join('\n');

  const outcomeLine = p.outcomeIsProjected
    ? `${p.outcomeMetric} within ${p.outcomeTimeframe} (PROJECTED — user has not yet measured this)`
    : `${p.outcomeMetric} within ${p.outcomeTimeframe}`;

  return `
USER POSITIONING (use this verbatim — do not soften, do not generalise):
- Serves: ${p.targetRole} at ${p.targetCompanyType}
- Painful problem they hire for: ${p.painfulProblem}
- Mechanism (how the user solves it): ${p.mechanism}
- Outcome: ${outcomeLine}
- Proof assets:
${proofLine}
- NOT for: ${p.notFor}

When generating outreach, posts, or sequences:
- Connect the prospect's pain to the user's mechanism explicitly.
- Reference proof assets only when relevant — never invent additional credentials.
- If the prospect is in the "NOT for" list, recommend the user skip them rather than generate.
- Do not invent facts about specific people or companies. If a fact is not provided, omit the claim or label it "inferred — verify before sending".
`.trim();
}

// -----------------------------------------------------------------------------
// Empty defaults for new users.
// -----------------------------------------------------------------------------

export function emptyPositioning(): UserPositioning {
  return {
    targetRole: '',
    targetCompanyType: '',
    painfulProblem: '',
    mechanism: '',
    outcomeMetric: '',
    outcomeTimeframe: '',
    outcomeIsProjected: false,
    proofAssets: [],
    notFor: '',
    version: POSITIONING_SCHEMA_VERSION,
    lastUpdated: '',
  };
}
