import React, { useState } from 'react';
import { Plus, X, Wand2, ExternalLink, Copy, Trash2, Save, ChevronDown, Sparkles, MessageSquare, Flame, Info } from 'lucide-react';
import { useStore } from '@/lib/store';
import {
  buildSalesNavURL,
  getSalesNavFilterWarnings,
  validateFilter,
  isPlaceholderValue,
  cleanTagList,
  SENIORITY_LEVELS,
  COMPANY_SIZES,
  INDUSTRIES,
  TONES,
} from '@/lib/utils';
import { generateFilterSuggestions } from '@/lib/ai';
import { FILTER_PRESETS, type FilterPreset } from '@/lib/filterPresets';
import type { LeadFilter } from '@/lib/types';
import toast from 'react-hot-toast';

const emptyFilter = (): LeadFilter => ({
  id: Date.now().toString(),
  name: 'New Filter',
  jobTitles: [],
  industries: [],
  companySize: [],
  locations: [],
  seniorityLevels: [],
  keywords: [],
  technologies: [],
});

interface LeadFilterBuilderProps {
  onMessageForFilter?: (data: { leadTitle: string; leadCompany: string; leadIndustry: string; leadName: string }) => void;
}

export default function LeadFilterBuilder({ onMessageForFilter }: LeadFilterBuilderProps) {
  const { filters, addFilter, deleteFilter, activeFilter, setActiveFilter } = useStore();
  const [current, setCurrent] = useState<LeadFilter>(emptyFilter());
  const [inputVals, setInputVals] = useState<Record<string, string>>({});
  const [aiDescription, setAiDescription] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiSuggested, setAiSuggested] = useState<string>('');

  const addTag = (field: keyof LeadFilter, val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (isPlaceholderValue(trimmed)) {
      toast.error(`"${trimmed}" looks like a placeholder — enter a real value.`);
      return;
    }
    const arr = (current[field] as string[]) || [];
    if (!arr.includes(trimmed)) {
      setCurrent({ ...current, [field]: [...arr, trimmed] });
    }
    setInputVals({ ...inputVals, [field]: '' });
  };

  const removeTag = (field: keyof LeadFilter, val: string) => {
    setCurrent({ ...current, [field]: ((current[field] as string[]) || []).filter((v) => v !== val) });
  };

  const toggleOption = (field: keyof LeadFilter, val: string) => {
    const arr = (current[field] as string[]) || [];
    if (arr.includes(val)) {
      setCurrent({ ...current, [field]: arr.filter((v) => v !== val) });
    } else {
      setCurrent({ ...current, [field]: [...arr, val] });
    }
  };

  const handleAIGenerate = async () => {
    if (!aiDescription.trim()) return;
    setLoadingAI(true);
    try {
      const result = await generateFilterSuggestions(aiDescription) as Record<string, unknown>;
      const pick = (key: string, fallback: string[]) =>
        result[key] !== undefined ? cleanTagList(result[key] as string[]) : fallback;
      setCurrent((prev) => ({
        ...prev,
        jobTitles: pick('jobTitles', prev.jobTitles),
        industries: pick('industries', prev.industries),
        companySize: pick('companySize', prev.companySize),
        locations: pick('locations', prev.locations),
        seniorityLevels: pick('seniorityLevels', prev.seniorityLevels),
        keywords: pick('keywords', prev.keywords || []),
      }));
      if (result.suggestedMessage) {
        setAiSuggested(result.suggestedMessage as string);
      }
      toast.success('AI filters applied!');
    } catch {
      toast.error('AI failed. Check your API key.');
    }
    setLoadingAI(false);
  };

  const handleSave = () => {
    const errors = validateFilter(current);
    if (errors.length) {
      errors.forEach((e) => toast.error(e));
      return;
    }
    addFilter({ ...current, id: Date.now().toString() });
    toast.success('Filter saved!');
    setCurrent(emptyFilter());
  };

  const openSalesNav = () => {
    const errors = validateFilter(current);
    if (errors.length) {
      errors.forEach((e) => toast.error(e));
      return;
    }
    const url = buildSalesNavURL(current);
    const warnings = getSalesNavFilterWarnings(current);
    window.open(url, '_blank');
    toast.success('Opening Sales Navigator...');
    warnings.forEach((w) => toast(w, { icon: '⚠️', duration: 6000 }));
  };

  const applyPreset = (preset: FilterPreset) => {
    setCurrent({
      ...preset.data,
      id: Date.now().toString(),
    });
    toast.success(`Applied: ${preset.name}`);
  };

  const openPresetInSalesNav = (preset: FilterPreset) => {
    const filter = { ...preset.data, id: preset.id };
    const url = buildSalesNavURL(filter);
    const warnings = getSalesNavFilterWarnings(filter);
    window.open(url, '_blank');
    toast.success(`Opening Sales Navigator with "${preset.name}"...`);
    warnings.forEach((w) => toast(w, { icon: '⚠️', duration: 6000 }));
  };

  return (
    <div className="space-y-6">
      {/* AI Smart Builder */}
      <div className="glass-card p-5" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.04))',
        border: '1px solid rgba(99,102,241,0.2)',
      }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} color="#a5b4fc" />
          <h3 className="font-semibold text-sm" style={{ color: '#a5b4fc', fontFamily: 'Syne' }}>AI Smart Filter Builder</h3>
        </div>
        <p className="text-xs mb-3" style={{ color: '#475569' }}>
          Describe your ideal client — AI will extract the perfect Sales Navigator filters
        </p>
        <div className="flex gap-2">
          <textarea
            className="input-field text-sm flex-1 resize-none"
            rows={2}
            placeholder="e.g. CTOs and VPs of Engineering at Series B+ SaaS companies in USA with 50-500 employees who use React or Node.js..."
            value={aiDescription}
            onChange={(e) => setAiDescription(e.target.value)}
          />
          <button
            className="btn-primary flex items-center gap-2 self-stretch px-4 flex-shrink-0"
            onClick={handleAIGenerate}
            disabled={loadingAI}
          >
            {loadingAI ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <Wand2 size={15} />
            )}
            <span className="text-sm">{loadingAI ? 'Generating...' : 'Generate'}</span>
          </button>
        </div>
        {aiSuggested && (
          <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}>
            <strong>Suggested angle:</strong> {aiSuggested}
          </div>
        )}
      </div>

      {/* Preset Filter Library */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Flame size={16} color="#f59e0b" />
          <h3 className="font-semibold text-sm" style={{ color: '#fcd34d', fontFamily: 'Syne' }}>
            High-Converting Presets
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#fcd34d' }}>
            Battle-tested
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: '#475569' }}>
          One-click filter templates for high-intent buyer personas. Click <strong style={{ color: '#94a3b8' }}>Apply</strong> to edit
          first, or <strong style={{ color: '#94a3b8' }}>Open</strong> to jump straight to Sales Navigator.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FILTER_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="rounded-xl p-4 transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex items-start justify-between mb-2 gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span className="text-xl flex-shrink-0">{preset.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white" style={{ fontFamily: 'Syne' }}>
                      {preset.name}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                      {preset.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* Why it works */}
              <div className="flex items-start gap-1.5 mb-3 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
                <Info size={11} color="#10b981" className="flex-shrink-0 mt-0.5" />
                <span className="text-xs leading-relaxed" style={{ color: '#6ee7b7' }}>
                  {preset.whyItWorks}
                </span>
              </div>

              {/* Filter chip summary */}
              <div className="flex flex-wrap gap-1 mb-3">
                {preset.data.jobTitles.slice(0, 2).map((t) => (
                  <span key={t} className="tag tag-indigo text-xs">{t}</span>
                ))}
                {preset.data.industries.slice(0, 2).map((i) => (
                  <span key={i} className="tag tag-cyan text-xs">{i}</span>
                ))}
                {preset.data.companySize.slice(0, 1).map((c) => (
                  <span key={c} className="tag tag-amber text-xs">{c}</span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => applyPreset(preset)}
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 flex-1 justify-center"
                >
                  <Wand2 size={11} />
                  Apply
                </button>
                <button
                  onClick={() => openPresetInSalesNav(preset)}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 flex-1 justify-center"
                >
                  <ExternalLink size={11} />
                  Open in Sales Nav
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Builder */}
      <div className="glass-card p-5">
        {/* Filter Name */}
        <div className="mb-5 flex items-center gap-3">
          <input
            className="input-field text-sm font-medium flex-1"
            placeholder="Filter name (e.g. Senior Dev CTOs US)"
            value={current.name}
            onChange={(e) => setCurrent({ ...current, name: e.target.value })}
            style={{ fontFamily: 'Syne' }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Job Titles */}
          <TagInput
            label="Job Titles"
            placeholder="CTO, VP Engineering, Head of Product..."
            tags={current.jobTitles}
            value={inputVals.jobTitles || ''}
            onChange={(v) => setInputVals({ ...inputVals, jobTitles: v })}
            onAdd={(v) => addTag('jobTitles', v)}
            onRemove={(v) => removeTag('jobTitles', v)}
          />

          {/* Keywords */}
          <TagInput
            label="Keywords / Technologies"
            placeholder="React, Node.js, Startup, Fundraising..."
            tags={current.keywords || []}
            value={inputVals.keywords || ''}
            onChange={(v) => setInputVals({ ...inputVals, keywords: v })}
            onAdd={(v) => addTag('keywords', v)}
            onRemove={(v) => removeTag('keywords', v)}
          />

          {/* Locations */}
          <TagInput
            label="Locations"
            placeholder="United States, London, Germany..."
            tags={current.locations}
            value={inputVals.locations || ''}
            onChange={(v) => setInputVals({ ...inputVals, locations: v })}
            onAdd={(v) => addTag('locations', v)}
            onRemove={(v) => removeTag('locations', v)}
          />

          {/* Industries */}
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: '#94a3b8', fontFamily: 'Syne' }}>Industries</label>
            <div className="flex flex-wrap gap-1.5">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind}
                  onClick={() => toggleOption('industries', ind)}
                  className="text-xs px-2.5 py-1 rounded-lg transition-all"
                  style={{
                    background: current.industries.includes(ind) ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${current.industries.includes(ind) ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: current.industries.includes(ind) ? '#a5b4fc' : '#475569',
                  }}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          {/* Seniority */}
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: '#94a3b8', fontFamily: 'Syne' }}>Seniority Level</label>
            <div className="flex flex-wrap gap-1.5">
              {SENIORITY_LEVELS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleOption('seniorityLevels', s)}
                  className="text-xs px-2.5 py-1 rounded-lg transition-all"
                  style={{
                    background: current.seniorityLevels.includes(s) ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${current.seniorityLevels.includes(s) ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color: current.seniorityLevels.includes(s) ? '#67e8f9' : '#475569',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Company Size */}
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: '#94a3b8', fontFamily: 'Syne' }}>Company Size</label>
            <div className="flex flex-wrap gap-1.5">
              {COMPANY_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleOption('companySize', s)}
                  className="text-xs px-2.5 py-1 rounded-lg transition-all"
                  style={{
                    background: current.companySize.includes(s) ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${current.companySize.includes(s) ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color: current.companySize.includes(s) ? '#fcd34d' : '#475569',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn-primary flex items-center gap-2" onClick={openSalesNav}>
            <ExternalLink size={14} />
            Open in Sales Navigator
          </button>
          <button className="btn-secondary flex items-center gap-2" onClick={handleSave}>
            <Save size={14} />
            Save Filter
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}
            onClick={() => { navigator.clipboard.writeText(buildSalesNavURL(current)); toast.success('URL copied!'); }}
          >
            <Copy size={14} />
            Copy URL
          </button>
        </div>
      </div>

      {/* Saved Filters */}
      {filters.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: '#64748b', fontFamily: 'Syne' }}>
            Saved Filters ({filters.length})
          </h3>
          <div className="space-y-2">
            {filters.map((f) => (
              <div key={f.id} className="glass-card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{f.name}</div>
                  <div className="text-xs mt-0.5 flex flex-wrap gap-1" style={{ color: '#475569' }}>
                    {f.jobTitles.slice(0, 2).map((t) => (
                      <span key={t} className="tag tag-indigo">{t}</span>
                    ))}
                    {f.industries.slice(0, 2).map((i) => (
                      <span key={i} className="tag tag-cyan">{i}</span>
                    ))}
                    {f.locations.slice(0, 1).map((l) => (
                      <span key={l} className="tag tag-green">{l}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                    onClick={() => window.open(buildSalesNavURL(f), '_blank')}
                  >
                    <ExternalLink size={12} />
                    Open
                  </button>
                  {onMessageForFilter && (
                    <button
                      className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                      onClick={() => onMessageForFilter({
                        leadTitle: f.jobTitles[0] || '',
                        leadCompany: '',
                        leadIndustry: f.industries[0] || '',
                        leadName: '',
                      })}
                    >
                      <MessageSquare size={12} />
                      Message
                    </button>
                  )}
                  <button
                    onClick={() => { deleteFilter(f.id); toast.success('Filter deleted'); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                    style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}
                  >
                    <Trash2 size={13} color="#f87171" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TagInput({
  label, placeholder, tags, value, onChange, onAdd, onRemove,
}: {
  label: string; placeholder: string; tags: string[]; value: string;
  onChange: (v: string) => void; onAdd: (v: string) => void; onRemove: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium block mb-2" style={{ color: '#94a3b8', fontFamily: 'Syne' }}>{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          className="input-field text-sm flex-1"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onAdd(value); }}
        />
        <button onClick={() => onAdd(value)} className="btn-secondary px-3">
          <Plus size={14} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="tag tag-indigo flex items-center gap-1">
            {tag}
            <button onClick={() => onRemove(tag)}>
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
