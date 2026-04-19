import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// =============================================
// AI provider router with automatic fallback
//
// Priority:
//   1. Anthropic direct API (if ANTHROPIC_API_KEY is set)
//   2. OpenRouter free model (if OPENROUTER_API_KEY is set)
//
// If Anthropic fails for any reason (quota, outage, invalid key),
// we silently retry with OpenRouter so the UI stays responsive.
// =============================================

async function callAnthropic(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  // content is an array of blocks — grab the first text block
  const block = response.content[0];
  if (block && block.type === 'text') return block.text;
  return '';
}

async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': process.env.NEXT_PUBLIC_APP_NAME || 'LeadHawk',
    },
  });
  const completion = await openai.chat.completions.create({
    // No hardcoded default — free models rotate on OpenRouter. User must pick
    // one from https://openrouter.ai/models?q=free and set OPENROUTER_MODEL.
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
  });
  return completion.choices[0]?.message?.content || '';
}

function formatError(err: unknown): { status: number; message: string } {
  const e = err as {
    status?: number;
    error?: { message?: string; code?: number };
    message?: string;
  };
  return {
    status: e?.status || 500,
    message: e?.error?.message || e?.message || 'AI generation failed',
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { systemPrompt, userPrompt } = req.body;

  if (!systemPrompt || !userPrompt) {
    return res.status(400).json({ error: 'Missing prompts' });
  }

  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;

  if (!hasAnthropic && !hasOpenRouter) {
    return res.status(500).json({
      error:
        'No AI key configured. Add ANTHROPIC_API_KEY (preferred) or OPENROUTER_API_KEY to .env.local',
    });
  }

  const maxTokens = parseInt(process.env.OPENROUTER_MAX_TOKENS || '800', 10);

  // Track why Anthropic failed (if it did) so we can surface it to the UI
  // alongside any OpenRouter fallback failure.
  let anthropicError: { status: number; message: string } | null = null;

  // ---------- 1. Try Anthropic first ----------
  if (hasAnthropic) {
    try {
      const result = await callAnthropic(systemPrompt, userPrompt, maxTokens);
      return res.status(200).json({ result, provider: 'anthropic' });
    } catch (err) {
      anthropicError = formatError(err);
      console.warn(
        `[ai] Anthropic failed (${anthropicError.status}: ${anthropicError.message}) — falling back to OpenRouter`,
      );
      if (!hasOpenRouter) {
        let hint = '';
        if (anthropicError.status === 401)
          hint = ' — Check your ANTHROPIC_API_KEY at https://console.anthropic.com/';
        else if (anthropicError.status === 429)
          hint = ' — Anthropic rate limit. Add OPENROUTER_API_KEY for auto-fallback.';
        return res.status(anthropicError.status).json({
          error: `Anthropic: ${anthropicError.message}${hint}`,
        });
      }
      // fall through to OpenRouter
    }
  }

  // ---------- 2. Fall back to OpenRouter ----------
  if (hasOpenRouter) {
    try {
      const result = await callOpenRouter(systemPrompt, userPrompt, maxTokens);
      return res.status(200).json({
        result,
        provider: hasAnthropic ? 'openrouter-fallback' : 'openrouter',
      });
    } catch (err) {
      const { status, message } = formatError(err);
      console.error(`[ai] OpenRouter failed (${status}: ${message})`);
      let hint = '';
      if (status === 402) {
        hint =
          ' — Free tier exhausted. Add credits at https://openrouter.ai/settings/credits or switch models via OPENROUTER_MODEL.';
      } else if (status === 401) {
        hint = ' — Check your OPENROUTER_API_KEY at https://openrouter.ai/keys.';
      } else if (status === 429) {
        hint = ' — Rate limited. Wait a moment or switch free models.';
      } else if (/No endpoints found/i.test(message)) {
        hint =
          ' — This model ID is invalid or deprecated. Pick a current free model at https://openrouter.ai/models?q=free';
      }
      // Show BOTH errors so the user knows Anthropic was tried first
      const prefix = anthropicError
        ? `Anthropic failed first (${anthropicError.status}: ${anthropicError.message}). Fallback OpenRouter also failed: `
        : 'OpenRouter: ';
      return res.status(status).json({ error: `${prefix}${message}${hint}` });
    }
  }

  // Should be unreachable
  return res.status(500).json({ error: 'No provider succeeded' });
}
