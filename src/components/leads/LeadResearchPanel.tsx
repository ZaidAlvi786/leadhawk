// This component exists because: the previous LeadBriefGenerator asked the
// AI to *invent* recent activity for a real person, then the user pasted the
// invention into a real prospect's inbox. This panel forces the user to
// gather real artifacts (their post URL, the company news, the job ad) and
// only then asks the AI to organise them into hooks. The AI never invents.

import React, { useState, useMemo } from 'react';
import {
  Sparkles, Copy, Trash2, Plus, ExternalLink, ChevronDown, FileSearch, Save, X, Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { synthesizeLeadResearch } from '@/lib/ai';
import { ARCHETYPE_PROFILES } from '@/lib/archetypes';
import type { LeadResearch, LeadResearchSource, ResearchField } from '@/lib/types';

const FIELD_PROMPTS: { field: ResearchField; label: string; placeholder: string }[] = [
  { field: 'recent-posts', label: 'Last 1–3 posts', placeholder: 'Paste the URL or text of their recent LinkedIn/X posts…' },
  { field: 'recent-comments', label: 'Recent comments', placeholder: 'What did they comment on recently? Paste 1–2…' },
  { field: 'company-priority', label: 'Company priority', placeholder: 'What does their company homepage / latest blog say is the priority right now?' },
  { field: 'recent-news', label: 'Funding / hiring / launch news', placeholder: 'Paste a press link or a quote…' },
  { field: 'mutual-connections', label: 'Mutual connections', placeholder: 'Anyone worth name-dropping? Paste their name + how you know them…' },
  { field: 'job-posting', label: 'Job posting', placeholder: 'Paste a recent job posting URL or excerpt…' },
];

interface DraftSource {
  id: string;
  field: ResearchField;
  content: string;
  url: string;
}

function newDraftSource(field: ResearchField): DraftSource {
  return { id: `src_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, field, content: '', url: '' };
}

export default function LeadResearchPanel() {
  const { leadResearch, addLeadResearch, updateLeadResearch, deleteLeadResearch, userPositioning } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [meta, setMeta] = useState({ leadName: '', leadCompany: '', leadRole: '', linkedinUrl: '' });
  const [drafts, setDrafts] = useState<DraftSource[]>([newDraftSource('recent-posts')]);

  const validDrafts = useMemo(
    () => drafts.filter((d) => d.content.trim().length > 0),
    [drafts]
  );

  const handleAddSourceField = (field: ResearchField) => {
    setDrafts((prev) => [...prev, newDraftSource(field)]);
  };

  const handleRemoveDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSaveResearch = async () => {
    if (!meta.leadName.trim()) {
      toast.error('Lead name is required');
      return;
    }
    if (validDrafts.length === 0) {
      toast.error('Paste at least one source before saving — fewer hooks > fabricated hooks');
      return;
    }

    const now = new Date().toISOString();
    const sources: LeadResearchSource[] = validDrafts.map((d) => ({
      id: d.id,
      field: d.field,
      content: d.content.trim(),
      url: d.url.trim() || undefined,
      capturedAt: now,
    }));

    const research: LeadResearch = {
      id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      leadName: meta.leadName.trim(),
      leadCompany: meta.leadCompany.trim() || undefined,
      leadRole: meta.leadRole.trim() || undefined,
      linkedinUrl: meta.linkedinUrl.trim() || undefined,
      archetype: 'other',
      sources,
      summary: '',
      hooks: [],
      bestApproach: '',
      redFlags: [],
      createdAt: now,
      updatedAt: now,
    };

    addLeadResearch(research);
    setMeta({ leadName: '', leadCompany: '', leadRole: '', linkedinUrl: '' });
    setDrafts([newDraftSource('recent-posts')]);
    setIsOpen(false);
    toast.success('Research saved. Synthesise hooks when ready.');

    // Kick off synthesis immediately so the user sees output
    await runSynthesis(research);
  };

  const runSynthesis = async (research: LeadResearch) => {
    setIsSynthesizing(research.id);
    try {
      const result = await synthesizeLeadResearch({
        leadName: research.leadName,
        company: research.leadCompany,
        role: research.leadRole,
        linkedinUrl: research.linkedinUrl,
        sources: research.sources,
        positioning: userPositioning,
      });
      updateLeadResearch(research.id, {
        archetype: result.archetype,
        summary: result.summary,
        hooks: result.hooks,
        bestApproach: result.bestApproach,
        redFlags: result.redFlags,
        synthesizedAt: new Date().toISOString(),
      });
      toast.success(result.hooks.length > 0
        ? `Synthesised ${result.hooks.length} hook${result.hooks.length === 1 ? '' : 's'} — each cites a source.`
        : 'Synthesis complete — no hooks because sources were too thin.');
    } catch {
      toast.error('Synthesis failed — try again');
    } finally {
      setIsSynthesizing(null);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  return (
    <div className="space-y-4">
      {/* Discipline reminder — replaces the danger banner. The whole point of
          this rebuild is that the panel doesn't fabricate; remind the user that
          the discipline is theirs. */}
      <div className="rounded-lg p-3" style={{
        background: 'rgba(58,143,163,0.06)',
        border: '1px solid rgba(58,143,163,0.18)',
      }}>
        <p className="text-xs leading-relaxed" style={{ color: '#1E6F70' }}>
          <strong>Research-only.</strong> The AI will only synthesise hooks from sources you paste.
          If you don't paste anything specific, you get fewer (or zero) hooks — by design.
        </p>
      </div>

      {/* Add new research button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-between"
        style={{
          background: isOpen ? 'rgba(58,143,163,0.15)' : 'rgba(58,143,163,0.05)',
          border: isOpen ? '1px solid rgba(58,143,163,0.3)' : '1px solid rgba(58,143,163,0.1)',
          color: '#0F3B47',
        }}
      >
        <span className="flex items-center gap-2">
          <FileSearch size={16} style={{ color: '#1E6F70' }} />
          Research a New Lead
        </span>
        <ChevronDown size={16} style={{
          color: '#6E7F86',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'all 0.2s',
        }} />
      </button>

      {isOpen && (
        <div className="p-4 rounded-lg space-y-4 border" style={{
          background: 'rgba(15,23,42,0.8)',
          borderColor: 'rgba(58,143,163,0.2)',
        }}>
          {/* Lead meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="input-field text-sm"
              placeholder="Lead name *"
              value={meta.leadName}
              onChange={(e) => setMeta({ ...meta, leadName: e.target.value })}
            />
            <input
              className="input-field text-sm"
              placeholder="Company"
              value={meta.leadCompany}
              onChange={(e) => setMeta({ ...meta, leadCompany: e.target.value })}
            />
            <input
              className="input-field text-sm"
              placeholder="Role / title"
              value={meta.leadRole}
              onChange={(e) => setMeta({ ...meta, leadRole: e.target.value })}
            />
            <div className="flex gap-2">
              <input
                className="input-field text-sm flex-1"
                placeholder="LinkedIn URL (optional)"
                value={meta.linkedinUrl}
                onChange={(e) => setMeta({ ...meta, linkedinUrl: e.target.value })}
              />
              {meta.linkedinUrl && (
                <button
                  onClick={() => window.open(meta.linkedinUrl, '_blank')}
                  className="px-2 rounded-md"
                  style={{ background: 'rgba(58,143,163,0.15)', color: '#1E6F70' }}
                  title="Open profile to copy real artifacts from it"
                >
                  <ExternalLink size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Source drafts */}
          <div className="space-y-2">
            <p className="text-xs font-semibold" style={{ color: '#6E7F86' }}>
              Paste real sources ({validDrafts.length} ready)
            </p>
            {drafts.map((draft) => {
              const fieldDef = FIELD_PROMPTS.find((f) => f.field === draft.field) || FIELD_PROMPTS[0];
              return (
                <div key={draft.id} className="rounded-lg p-3 space-y-2" style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div className="flex items-center gap-2">
                    <select
                      value={draft.field}
                      onChange={(e) => setDrafts((prev) => prev.map((d) =>
                        d.id === draft.id ? { ...d, field: e.target.value as ResearchField } : d
                      ))}
                      className="input-field text-xs"
                      style={{ width: 'auto' }}
                    >
                      {FIELD_PROMPTS.map((f) => (
                        <option key={f.field} value={f.field} style={{ background: '#F7F2E7' }}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemoveDraft(draft.id)}
                      className="ml-auto p-1 rounded"
                      style={{ background: 'rgba(176,67,42,0.1)' }}
                    >
                      <X size={12} color="#CC6B4F" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder={fieldDef.placeholder}
                    value={draft.content}
                    onChange={(e) => setDrafts((prev) => prev.map((d) =>
                      d.id === draft.id ? { ...d, content: e.target.value } : d
                    ))}
                    className="input-field text-xs w-full resize-none"
                  />
                  <input
                    className="input-field text-xs w-full"
                    placeholder="Source URL (optional)"
                    value={draft.url}
                    onChange={(e) => setDrafts((prev) => prev.map((d) =>
                      d.id === draft.id ? { ...d, url: e.target.value } : d
                    ))}
                  />
                </div>
              );
            })}
          </div>

          {/* Add source field menu */}
          <div className="flex flex-wrap gap-1.5">
            {FIELD_PROMPTS.map((f) => (
              <button
                key={f.field}
                onClick={() => handleAddSourceField(f.field)}
                className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                style={{ background: 'rgba(58,143,163,0.08)', color: '#1E6F70', border: '1px solid rgba(58,143,163,0.15)' }}
              >
                <Plus size={10} />
                {f.label}
              </button>
            ))}
          </div>

          {/* Save */}
          <button
            onClick={handleSaveResearch}
            disabled={!meta.leadName.trim() || validDrafts.length === 0}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Save size={14} />
            Save & Synthesise Hooks
          </button>
        </div>
      )}

      {/* Saved research list */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {leadResearch.length === 0 ? (
          <p className="text-sm text-gray-500 p-3 text-center">
            No research yet. Add a lead to start.
          </p>
        ) : (
          leadResearch.map((r) => {
            const isExpanded = expanded === r.id;
            const sourceById = new Map(r.sources.map((s) => [s.id, s]));
            return (
              <div
                key={r.id}
                className="rounded-lg border"
                style={{
                  background: 'rgba(30,41,59,0.6)',
                  borderColor: 'rgba(58,143,163,0.2)',
                }}
              >
                <div
                  className="p-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : r.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm flex items-center gap-2">
                      {r.leadName}
                      <span className="px-2 py-0.5 rounded text-xs font-medium" style={{
                        background: 'rgba(58,143,163,0.2)',
                        color: '#1E6F70',
                      }}>
                        {ARCHETYPE_PROFILES[r.archetype]?.label || 'Other'}
                      </span>
                      <span className="text-xs" style={{ color: '#6E7F86' }}>
                        {r.sources.length} source{r.sources.length === 1 ? '' : 's'} · {r.hooks.length} hook{r.hooks.length === 1 ? '' : 's'}
                      </span>
                    </p>
                    {r.leadCompany && <p className="text-xs text-gray-400">{r.leadCompany}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); runSynthesis(r); }}
                      disabled={isSynthesizing === r.id}
                      className="p-1.5 rounded"
                      style={{ background: 'rgba(58,143,163,0.15)' }}
                      title="Re-synthesise hooks"
                    >
                      {isSynthesizing === r.id
                        ? <div className="w-3 h-3 rounded-full border border-indigo-400 border-t-transparent animate-spin" />
                        : <Sparkles size={12} color="#1E6F70" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteLeadResearch(r.id); toast.success('Deleted'); }}
                      className="p-1.5 rounded"
                      style={{ background: 'rgba(176,67,42,0.1)' }}
                    >
                      <Trash2 size={12} color="#CC6B4F" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    {/* Summary */}
                    {r.summary && (
                      <div className="pt-3">
                        <p className="text-xs font-semibold text-gray-400 mb-1">Summary</p>
                        <p className="text-sm text-gray-300">{r.summary}</p>
                      </div>
                    )}

                    {/* Sources */}
                    {r.sources.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">Sources</p>
                        <div className="space-y-1">
                          {r.sources.map((s) => (
                            <div key={s.id} className="px-2 py-1 rounded text-xs" style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.05)',
                            }}>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Tag size={9} color="#6E7F86" />
                                <span style={{ color: '#6E7F86', fontSize: '10px' }}>
                                  {FIELD_PROMPTS.find((f) => f.field === s.field)?.label || s.field}
                                </span>
                                {s.url && (
                                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="ml-auto" title={s.url}>
                                    <ExternalLink size={9} color="#6E7F86" />
                                  </a>
                                )}
                              </div>
                              <p className="text-xs" style={{ color: '#D6CCB6' }}>{s.content.slice(0, 200)}{s.content.length > 200 ? '…' : ''}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hooks */}
                    {r.hooks.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">
                          Hooks (each cites a source on hover)
                        </p>
                        <div className="space-y-1">
                          {r.hooks.map((hook, i) => {
                            const cited = hook.sourceFieldIds
                              .map((id) => sourceById.get(id))
                              .filter(Boolean)
                              .map((s) => FIELD_PROMPTS.find((f) => f.field === s!.field)?.label || s!.field)
                              .join(', ');
                            return (
                              <div
                                key={i}
                                className="flex items-start justify-between gap-2 px-2 py-1.5 rounded bg-surface-900 text-xs text-gray-300 group hover:bg-surface-800"
                                title={`Cites: ${cited}`}
                              >
                                <span className="flex-1">• {hook.text}</span>
                                <span className="text-xs px-1.5 py-0.5 rounded ml-2" style={{
                                  background: 'rgba(30,111,112,0.12)',
                                  color: '#1E6F70',
                                  fontSize: '9px',
                                }}>
                                  {hook.sourceFieldIds.length} src
                                </span>
                                <button
                                  onClick={() => copy(hook.text)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-surface-700 rounded"
                                >
                                  <Copy size={11} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {r.bestApproach && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">Recommended approach</p>
                        <p className="text-xs text-gray-300">{r.bestApproach}</p>
                      </div>
                    )}

                    {r.redFlags.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold" style={{ color: '#CC6B4F' }}>⚠️ Red flags (avoid)</p>
                        <div className="space-y-1">
                          {r.redFlags.map((flag, i) => (
                            <p key={i} className="text-xs text-gray-400">• {flag}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
