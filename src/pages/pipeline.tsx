import React, { useState } from 'react';
import {
  Plus, Trash2, ChevronRight, ChevronLeft, Wand2, Users, Mail,
  Calendar, Building2, MessageSquare, StickyNote, Sparkles,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { suggestNextAction } from '@/lib/ai';
import type { PipelineLead, PipelineStage, LeadSource } from '@/lib/types';
import toast from 'react-hot-toast';

const STAGES: { id: PipelineStage; label: string; color: string; bgColor: string }[] = [
  { id: 'new', label: 'New', color: '#64748b', bgColor: 'rgba(100,116,139,0.15)' },
  { id: 'contacted', label: 'Contacted', color: '#6366f1', bgColor: 'rgba(99,102,241,0.15)' },
  { id: 'replied', label: 'Replied', color: '#06b6d4', bgColor: 'rgba(6,182,212,0.15)' },
  { id: 'meeting', label: 'Meeting', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.15)' },
  { id: 'proposal', label: 'Proposal', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.15)' },
  { id: 'closed-won', label: 'Won', color: '#10b981', bgColor: 'rgba(16,185,129,0.15)' },
  { id: 'closed-lost', label: 'Lost', color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)' },
];

const SOURCES: { id: LeadSource; label: string }[] = [
  { id: 'apollo', label: 'Apollo' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'manual', label: 'Manual' },
  { id: 'referral', label: 'Referral' },
  { id: 'inbound', label: 'Inbound' },
];

function daysSince(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default function PipelinePage() {
  const {
    pipelineLeads, addPipelineLead, updatePipelineLead,
    movePipelineLead, deletePipelineLead,
  } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [suggestingFor, setSuggestingFor] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    email: '',
    industry: '',
    source: 'manual' as LeadSource,
  });

  const handleAdd = () => {
    if (!addForm.firstName || !addForm.company) {
      toast.error('Name and company are required');
      return;
    }
    const now = new Date().toISOString();
    const lead: PipelineLead = {
      id: Date.now().toString(),
      ...addForm,
      stage: 'new',
      notes: '',
      createdAt: now,
      updatedAt: now,
    };
    addPipelineLead(lead);
    toast.success('Lead added to pipeline!');
    setAddForm({ firstName: '', lastName: '', title: '', company: '', email: '', industry: '', source: 'manual' });
    setShowAddForm(false);
  };

  const moveForward = (lead: PipelineLead) => {
    const idx = STAGES.findIndex((s) => s.id === lead.stage);
    if (idx < STAGES.length - 2) { // don't auto-advance past 'proposal' into won/lost
      movePipelineLead(lead.id, STAGES[idx + 1].id);
      toast.success(`Moved to ${STAGES[idx + 1].label}`);
    }
  };

  const moveBack = (lead: PipelineLead) => {
    const idx = STAGES.findIndex((s) => s.id === lead.stage);
    if (idx > 0) {
      movePipelineLead(lead.id, STAGES[idx - 1].id);
      toast.success(`Moved to ${STAGES[idx - 1].label}`);
    }
  };

  const handleSuggest = async (lead: PipelineLead) => {
    setSuggestingFor(lead.id);
    try {
      const suggestion = await suggestNextAction({
        leadName: `${lead.firstName} ${lead.lastName}`,
        leadTitle: lead.title,
        leadCompany: lead.company,
        currentStage: lead.stage,
        daysSinceContact: daysSince(lead.lastContacted),
        notes: lead.notes,
      });
      updatePipelineLead(lead.id, { aiSuggestedAction: suggestion });
      toast.success('AI suggestion ready!');
    } catch {
      toast.error('Suggestion failed');
    }
    setSuggestingFor(null);
  };

  const markContacted = (lead: PipelineLead) => {
    const now = new Date().toISOString();
    const update: Partial<PipelineLead> = { lastContacted: now };
    if (lead.stage === 'new') update.stage = 'contacted';
    // set next follow-up to 3 days from now
    const followUp = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    update.nextFollowUp = followUp;
    updatePipelineLead(lead.id, update);
    toast.success('Marked as contacted — follow-up set for 3 days');
  };

  // Active stages (excluding closed)
  const activeStages = STAGES.filter((s) => s.id !== 'closed-won' && s.id !== 'closed-lost');
  const wonCount = pipelineLeads.filter((l) => l.stage === 'closed-won').length;
  const lostCount = pipelineLeads.filter((l) => l.stage === 'closed-lost').length;
  const totalActive = pipelineLeads.filter((l) => l.stage !== 'closed-won' && l.stage !== 'closed-lost').length;

  const needsFollowUp = pipelineLeads.filter((l) => {
    if (l.stage === 'closed-won' || l.stage === 'closed-lost') return false;
    if (!l.nextFollowUp) return false;
    return new Date(l.nextFollowUp) <= new Date();
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Hero */}
      <div className="px-8 py-5 border-b" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                <Users size={13} color="white" />
              </div>
              <span className="text-xs font-medium tag tag-green">CRM</span>
            </div>
            <h2 className="text-lg font-semibold text-white mb-0.5" style={{ fontFamily: 'Syne' }}>
              Sales Pipeline
            </h2>
            <p className="text-sm" style={{ color: '#475569' }}>
              Track every lead from first contact to closed deal — AI suggests your next move
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {[
              { label: 'Active Leads', value: totalActive.toString(), color: '#6366f1' },
              { label: 'Won', value: wonCount.toString(), color: '#10b981' },
              { label: 'Lost', value: lostCount.toString(), color: '#ef4444' },
              { label: 'Follow-ups Due', value: needsFollowUp.length.toString(), color: '#f59e0b' },
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-2.5 rounded-xl text-center" style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div className="text-lg font-bold" style={{ color: stat.color, fontFamily: 'Syne' }}>{stat.value}</div>
                <div className="text-xs" style={{ color: '#334155' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-8 py-4 border-b flex items-center gap-3" style={{ borderColor: 'rgba(99,102,241,0.08)' }}>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={14} />
          Add Lead
        </button>
        {needsFollowUp.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs animate-pulse"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d' }}>
            <Calendar size={12} />
            {needsFollowUp.length} follow-up{needsFollowUp.length > 1 ? 's' : ''} overdue
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Add Lead Form */}
        {showAddForm && (
          <div className="glass-card p-5 animate-fadeUp" style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
            <h3 className="text-sm font-medium mb-4" style={{ color: '#6ee7b7', fontFamily: 'Syne' }}>Add New Lead</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <input className="input-field text-sm" placeholder="First Name *" value={addForm.firstName}
                onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })} />
              <input className="input-field text-sm" placeholder="Last Name" value={addForm.lastName}
                onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })} />
              <input className="input-field text-sm" placeholder="Job Title" value={addForm.title}
                onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} />
              <input className="input-field text-sm" placeholder="Company *" value={addForm.company}
                onChange={(e) => setAddForm({ ...addForm, company: e.target.value })} />
              <input className="input-field text-sm" placeholder="Email" value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
              <input className="input-field text-sm" placeholder="Industry" value={addForm.industry}
                onChange={(e) => setAddForm({ ...addForm, industry: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs" style={{ color: '#64748b' }}>Source:</label>
                {SOURCES.map((s) => (
                  <button key={s.id} onClick={() => setAddForm({ ...addForm, source: s.id })}
                    className="text-xs px-2 py-1 rounded-lg transition-all"
                    style={{
                      background: addForm.source === s.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${addForm.source === s.id ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: addForm.source === s.id ? '#a5b4fc' : '#475569',
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex gap-2">
                <button className="btn-secondary text-sm" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button className="btn-primary text-sm" onClick={handleAdd}>Add to Pipeline</button>
              </div>
            </div>
          </div>
        )}

        {/* Kanban Columns */}
        {pipelineLeads.length === 0 && !showAddForm ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Users size={28} color="#10b981" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2" style={{ fontFamily: 'Syne' }}>
              Your Pipeline is Empty
            </h3>
            <p className="text-sm text-center max-w-md" style={{ color: '#475569' }}>
              Add leads manually or import from Apollo. Track them from first contact to closed deal.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {activeStages.map((stage) => {
              const stageLeads = pipelineLeads.filter((l) => l.stage === stage.id);
              return (
                <div key={stage.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                    <span className="text-xs font-medium" style={{ color: stage.color, fontFamily: 'Syne' }}>
                      {stage.label}
                    </span>
                    <span className="text-xs px-1.5 rounded" style={{ background: stage.bgColor, color: stage.color }}>
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="space-y-2 min-h-[100px]">
                    {stageLeads.map((lead) => {
                      const days = daysSince(lead.lastContacted);
                      const isOverdue = lead.nextFollowUp && new Date(lead.nextFollowUp) <= new Date();
                      return (
                        <div key={lead.id} className="glass-card p-3 text-xs"
                          style={isOverdue ? { border: '1px solid rgba(245,158,11,0.3)' } : {}}>
                          {/* Name + company */}
                          <div className="font-medium text-white mb-0.5">
                            {lead.firstName} {lead.lastName}
                          </div>
                          <div className="mb-1.5" style={{ color: '#475569' }}>
                            {lead.title ? `${lead.title} at ` : ''}{lead.company}
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            <span className="tag tag-indigo" style={{ fontSize: '9px', padding: '1px 5px' }}>{lead.source}</span>
                            {lead.email && (
                              <span className="tag tag-cyan" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                <Mail size={8} className="inline mr-0.5" />email
                              </span>
                            )}
                            {days !== undefined && (
                              <span className={`tag ${days > 5 ? 'tag-amber' : 'tag-green'}`}
                                style={{ fontSize: '9px', padding: '1px 5px' }}>
                                {days}d ago
                              </span>
                            )}
                            {isOverdue && (
                              <span className="tag tag-amber" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                follow-up due
                              </span>
                            )}
                          </div>

                          {/* AI suggestion */}
                          {lead.aiSuggestedAction && (
                            <div className="p-2 rounded-lg mb-2" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                              <div className="flex items-center gap-1 mb-0.5">
                                <Sparkles size={9} color="#8b5cf6" />
                                <span style={{ color: '#c4b5fd', fontSize: '9px', fontWeight: 600 }}>AI Suggestion</span>
                              </div>
                              <div style={{ color: '#94a3b8', fontSize: '10px', lineHeight: '1.4' }}>{lead.aiSuggestedAction}</div>
                            </div>
                          )}

                          {/* Notes */}
                          {editingNotes === lead.id ? (
                            <textarea
                              className="input-field text-xs w-full resize-none mb-2"
                              rows={2}
                              placeholder="Add notes..."
                              value={lead.notes}
                              onChange={(e) => updatePipelineLead(lead.id, { notes: e.target.value })}
                              onBlur={() => setEditingNotes(null)}
                              autoFocus
                            />
                          ) : lead.notes ? (
                            <div className="text-xs p-1.5 rounded mb-2 cursor-pointer"
                              style={{ background: 'rgba(255,255,255,0.02)', color: '#475569' }}
                              onClick={() => setEditingNotes(lead.id)}>
                              {lead.notes}
                            </div>
                          ) : null}

                          {/* Actions */}
                          <div className="flex items-center gap-1 pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                            <button onClick={() => moveBack(lead)} title="Move back"
                              className="w-6 h-6 flex items-center justify-center rounded"
                              style={{ background: 'rgba(255,255,255,0.04)' }}>
                              <ChevronLeft size={10} color="#475569" />
                            </button>
                            <button onClick={() => moveForward(lead)} title="Move forward"
                              className="w-6 h-6 flex items-center justify-center rounded"
                              style={{ background: 'rgba(255,255,255,0.04)' }}>
                              <ChevronRight size={10} color="#475569" />
                            </button>
                            <button onClick={() => markContacted(lead)} title="Mark contacted"
                              className="w-6 h-6 flex items-center justify-center rounded"
                              style={{ background: 'rgba(99,102,241,0.1)' }}>
                              <MessageSquare size={10} color="#a5b4fc" />
                            </button>
                            <button onClick={() => setEditingNotes(lead.id)} title="Add notes"
                              className="w-6 h-6 flex items-center justify-center rounded"
                              style={{ background: 'rgba(255,255,255,0.04)' }}>
                              <StickyNote size={10} color="#475569" />
                            </button>
                            <button
                              onClick={() => handleSuggest(lead)}
                              disabled={suggestingFor === lead.id}
                              title="AI suggest next action"
                              className="w-6 h-6 flex items-center justify-center rounded"
                              style={{ background: 'rgba(139,92,246,0.1)' }}>
                              {suggestingFor === lead.id ? (
                                <div className="w-3 h-3 rounded-full border border-purple-400 border-t-transparent animate-spin" />
                              ) : (
                                <Sparkles size={10} color="#8b5cf6" />
                              )}
                            </button>
                            <div className="ml-auto flex items-center gap-1">
                              <button onClick={() => movePipelineLead(lead.id, 'closed-won')} title="Mark as Won"
                                className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold"
                                style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                                W
                              </button>
                              <button onClick={() => movePipelineLead(lead.id, 'closed-lost')} title="Mark as Lost"
                                className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold"
                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                L
                              </button>
                              <button onClick={() => { deletePipelineLead(lead.id); toast.success('Removed'); }} title="Delete"
                                className="w-6 h-6 flex items-center justify-center rounded"
                                style={{ background: 'rgba(244,63,94,0.1)' }}>
                                <Trash2 size={9} color="#f87171" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Closed deals section */}
        {(wonCount > 0 || lostCount > 0) && (
          <div className="mt-6 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <h3 className="text-sm font-medium mb-3" style={{ color: '#64748b', fontFamily: 'Syne' }}>Closed</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Won */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
                  <span className="text-xs font-medium" style={{ color: '#10b981' }}>Won ({wonCount})</span>
                </div>
                <div className="space-y-1">
                  {pipelineLeads.filter((l) => l.stage === 'closed-won').map((lead) => (
                    <div key={lead.id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                      style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                      <span className="text-xs text-white">{lead.firstName} {lead.lastName}</span>
                      <span className="text-xs" style={{ color: '#475569' }}>{lead.company}</span>
                      <button className="ml-auto" onClick={() => { deletePipelineLead(lead.id); toast.success('Removed'); }}>
                        <Trash2 size={10} color="#475569" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Lost */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
                  <span className="text-xs font-medium" style={{ color: '#ef4444' }}>Lost ({lostCount})</span>
                </div>
                <div className="space-y-1">
                  {pipelineLeads.filter((l) => l.stage === 'closed-lost').map((lead) => (
                    <div key={lead.id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                      style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
                      <span className="text-xs text-white">{lead.firstName} {lead.lastName}</span>
                      <span className="text-xs" style={{ color: '#475569' }}>{lead.company}</span>
                      <button className="ml-auto" onClick={() => { deletePipelineLead(lead.id); toast.success('Removed'); }}>
                        <Trash2 size={10} color="#475569" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
