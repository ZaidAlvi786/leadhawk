import React, { useState } from 'react';
import { Sparkles, Copy, Trash2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateLeadBrief, type GenerateLeadBriefParams } from '@/lib/ai';
import { useStore } from '@/lib/store';
import type { LeadBrief } from '@/lib/types';
import { ARCHETYPE_PROFILES } from '@/lib/archetypes';

export default function LeadBriefGenerator() {
  const { leadBriefs, addLeadBrief, deleteLeadBrief } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    leadName: '',
    company: '',
    role: '',
    linkedinUrl: '',
    additionalContext: '',
  });
  const [expandedBrief, setExpandedBrief] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!formData.leadName.trim()) {
      toast.error('Lead name is required');
      return;
    }

    setIsGenerating(true);
    try {
      const brief = await generateLeadBrief({
        leadName: formData.leadName,
        company: formData.company || undefined,
        role: formData.role || undefined,
        linkedinUrl: formData.linkedinUrl || undefined,
        additionalContext: formData.additionalContext || undefined,
      });
      addLeadBrief(brief);
      toast.success('Lead brief generated! 🎯');
      setFormData({ leadName: '', company: '', role: '', linkedinUrl: '', additionalContext: '' });
      setIsOpen(false);
    } catch (err) {
      toast.error('Failed to generate brief. Check your API keys.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-between"
        style={{
          background: isOpen ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.05)',
          border: isOpen ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(99,102,241,0.1)',
          color: '#f1f5f9',
        }}
      >
        <span className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: '#6366f1' }} />
          Generate Lead Brief
        </span>
        <ChevronDown size={18} style={{ color: '#64748b', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'all 0.2s' }} />
      </button>

      {isOpen && (
        <div
          className="p-4 rounded-lg space-y-3 border"
          style={{ background: 'rgba(15,23,42,0.8)', borderColor: 'rgba(99,102,241,0.2)' }}
        >
          <input
            type="text"
            placeholder="Lead name *"
            value={formData.leadName}
            onChange={(e) => setFormData({ ...formData, leadName: e.target.value })}
            className="w-full px-3 py-2 rounded-md text-sm bg-surface-900 border border-surface-700 placeholder-gray-600"
            style={{ color: '#f1f5f9' }}
          />
          <input
            type="text"
            placeholder="Company (optional)"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full px-3 py-2 rounded-md text-sm bg-surface-900 border border-surface-700 placeholder-gray-600"
            style={{ color: '#f1f5f9' }}
          />
          <input
            type="text"
            placeholder="Role/Title (optional)"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-3 py-2 rounded-md text-sm bg-surface-900 border border-surface-700 placeholder-gray-600"
            style={{ color: '#f1f5f9' }}
          />
          <input
            type="text"
            placeholder="LinkedIn URL (optional)"
            value={formData.linkedinUrl}
            onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
            className="w-full px-3 py-2 rounded-md text-sm bg-surface-900 border border-surface-700 placeholder-gray-600"
            style={{ color: '#f1f5f9' }}
          />
          <textarea
            placeholder="Paste bio, recent post, or additional context (optional)"
            value={formData.additionalContext}
            onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-md text-sm bg-surface-900 border border-surface-700 placeholder-gray-600 resize-none"
            style={{ color: '#f1f5f9' }}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isGenerating ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.8)',
              color: '#f1f5f9',
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate Brief'}
          </button>
        </div>
      )}

      {/* Briefs List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {leadBriefs.length === 0 ? (
          <p className="text-sm text-gray-500 p-3 text-center">No briefs yet. Generate one to get started!</p>
        ) : (
          leadBriefs.map((brief) => (
            <div
              key={brief.id}
              className="rounded-lg p-3 space-y-2 border cursor-pointer transition-all hover:border-opacity-50"
              style={{
                background: 'rgba(30,41,59,0.6)',
                borderColor: 'rgba(99,102,241,0.2)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between"
                onClick={() => setExpandedBrief(expandedBrief === brief.id ? null : brief.id)}
              >
                <div className="flex-1">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    {brief.leadName}
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        background: 'rgba(99,102,241,0.2)',
                        color: '#a5b4fc',
                      }}
                    >
                      {ARCHETYPE_PROFILES[brief.archetype]?.label || 'Other'}
                    </span>
                  </p>
                  {brief.leadCompany && <p className="text-xs text-gray-400">{brief.leadCompany}</p>}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLeadBrief(brief.id);
                    toast.success('Brief deleted');
                  }}
                  className="p-1 hover:bg-red-500 hover:bg-opacity-20 rounded transition-colors"
                >
                  <Trash2 size={16} style={{ color: '#f43f5e' }} />
                </button>
              </div>

              {/* Expanded Content */}
              {expandedBrief === brief.id && (
                <div className="space-y-2 pt-2 border-t border-surface-700">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-1">Summary</p>
                    <p className="text-sm text-gray-300">{brief.summary}</p>
                  </div>

                  {brief.painPoints.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-1">Pain Points</p>
                      <div className="space-y-1">
                        {brief.painPoints.map((pain, i) => (
                          <p key={i} className="text-xs text-gray-400">
                            • {pain}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {brief.personalizationHooks.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-1">Personalization Hooks</p>
                      <div className="space-y-1">
                        {brief.personalizationHooks.map((hook, i) => (
                          <div
                            key={i}
                            className="flex items-start justify-between gap-2 px-2 py-1 rounded bg-surface-900 text-xs text-gray-300 group hover:bg-surface-800"
                          >
                            <span>• {hook}</span>
                            <button
                              onClick={() => copyToClipboard(hook)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-surface-700 rounded"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {brief.redFlags.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold" style={{ color: '#f43f5e' }}>
                        ⚠️ Red Flags (Avoid)
                      </p>
                      <div className="space-y-1">
                        {brief.redFlags.map((flag, i) => (
                          <p key={i} className="text-xs text-gray-400">
                            • {flag}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-1">Recommended Approach</p>
                    <p className="text-xs text-gray-300">{brief.bestApproach}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
