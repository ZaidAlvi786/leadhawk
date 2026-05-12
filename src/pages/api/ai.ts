import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// =============================================
// AI provider router with automatic fallback
//
// Priority:
//   1. Google Gemini (if GOOGLE_API_KEY is set) — generous free tier, recommended
//   2. OpenRouter free models (if OPENROUTER_API_KEY is set) — cycles through OPENROUTER_MODELS
//
// Each provider is tried in order until one succeeds.
// =============================================

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  json: boolean,
): Promise<string> {
  const model = process.env.GOOGLE_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;

  // When `json` is true, ask Gemini for structured JSON directly — avoids markdown
  // code fences and truncation surprises. Otherwise free-form text.
  //
  // Gemini 2.5 Flash spends part of `maxOutputTokens` on internal "thinking"
  // before emitting visible output, which silently truncates JSON responses
  // mid-string. For structured JSON the prompt already encodes the schema, so
  // thinking adds noise without value — we turn it off and reclaim the whole
  // budget for the actual answer. Free-form text keeps thinking on by default.
  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: maxTokens,
    temperature: 0.7,
  };
  if (json) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    let parsed: { error?: { message?: string } } = {};
    try { parsed = JSON.parse(body); } catch { /* non-JSON */ }
    const err = new Error(parsed?.error?.message || body) as Error & { status: number };
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || '';
}

async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  model: string,
  json: boolean,
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
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
    ...(json ? { response_format: { type: 'json_object' as const } } : {}),
  });
  return completion.choices[0]?.message?.content || '';
}

// Read either OPENROUTER_MODELS or OPENROUTER_MODEL — both treated as comma-separated
// lists, so a CSV value works regardless of which name was set in the deploy env.
function getOpenRouterModels(): string[] {
  const raw = process.env.OPENROUTER_MODELS || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
  return raw.split(',').map((m) => m.trim()).filter(Boolean);
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

  const { systemPrompt, userPrompt, responseFormat, maxTokens: requestedMax } = req.body as {
    systemPrompt?: string;
    userPrompt?: string;
    responseFormat?: 'json' | 'text';
    maxTokens?: number;
  };

  if (!systemPrompt || !userPrompt) {
    return res.status(400).json({ error: 'Missing prompts' });
  }

  const wantsJSON = responseFormat === 'json';

  const hasGemini = !!process.env.GOOGLE_API_KEY;
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;

  if (!hasGemini && !hasOpenRouter) {
    return res.status(500).json({
      error:
        'No AI key configured. Add GOOGLE_API_KEY (free tier, recommended) or OPENROUTER_API_KEY to .env.local',
    });
  }

  // Per-request override > env default. Bump default for JSON to give the model
  // headroom — incomplete JSON breaks parsing, and 800 tokens is too tight for
  // a full LinkedIn post + hashtags.
  const envDefault = parseInt(process.env.OPENROUTER_MAX_TOKENS || '800', 10);
  const maxTokens = requestedMax ?? (wantsJSON ? Math.max(envDefault, 2000) : envDefault);

  // Track Gemini's failure (if it failed) so the final error message can include it.
  let geminiError: { status: number; message: string } | null = null;

  // ---------- 1. Try Google Gemini first (free tier) ----------
  if (hasGemini) {
    try {
      const result = await callGemini(systemPrompt, userPrompt, maxTokens, wantsJSON);
      return res.status(200).json({ result, provider: 'gemini' });
    } catch (err) {
      geminiError = formatError(err);
      console.warn(`[ai] Gemini failed (${geminiError.status}: ${geminiError.message}) — trying next provider`);
      if (!hasOpenRouter) {
        let hint = '';
        if (geminiError.status === 400 && /api key/i.test(geminiError.message))
          hint = ' — Check your GOOGLE_API_KEY at https://aistudio.google.com/apikey';
        else if (geminiError.status === 429)
          hint = ' — Gemini quota exhausted. Add OPENROUTER_API_KEY for fallback or wait for quota reset.';
        return res.status(geminiError.status).json({
          error: `Gemini: ${geminiError.message}${hint}`,
        });
      }
    }
  }

  // ---------- 2. Fall back to OpenRouter (cycles through models) ----------
  if (hasOpenRouter) {
    const models = getOpenRouterModels();
    let lastError: { status: number; message: string; model: string } | null = null;

    for (const model of models) {
      try {
        const result = await callOpenRouter(systemPrompt, userPrompt, maxTokens, model, wantsJSON);
        return res.status(200).json({
          result,
          provider: hasGemini ? 'openrouter-fallback' : 'openrouter',
          model,
        });
      } catch (err) {
        const { status, message } = formatError(err);
        lastError = { status, message, model };
        console.warn(`[ai] OpenRouter model "${model}" failed (${status}: ${message})`);
        // 401 = bad key — every model will fail the same way, stop cycling.
        if (status === 401) break;
        // Otherwise try the next model (rate limit, free-tier exhausted, deprecated, etc.)
      }
    }

    const { status, message, model } = lastError!;
    let hint = '';
    if (status === 402) {
      hint =
        ' — Free tier exhausted on all models. Add credits at https://openrouter.ai/settings/credits or add more models to OPENROUTER_MODELS.';
    } else if (status === 401) {
      hint = ' — Check your OPENROUTER_API_KEY at https://openrouter.ai/keys.';
    } else if (status === 429) {
      hint =
        ' — All configured free models are rate-limited. Wait a moment or add more models to OPENROUTER_MODELS.';
    } else if (/No endpoints found/i.test(message)) {
      hint =
        ' — Model IDs invalid or deprecated. Pick current free models at https://openrouter.ai/models?q=free';
    }
    const prefix = geminiError
      ? `Gemini failed first (${geminiError.status}: ${geminiError.message}). All ${models.length} OpenRouter model(s) failed, last was "${model}": `
      : `OpenRouter (tried ${models.length} model(s), last was "${model}"): `;
    return res.status(status).json({ error: `${prefix}${message}${hint}` });
  }

  // Should be unreachable
  return res.status(500).json({ error: 'No provider succeeded' });
}
