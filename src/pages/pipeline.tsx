import React, { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup, Variants } from 'framer-motion';
import {
  Plus, Trash2, ChevronRight, ChevronLeft, Users, Mail,
  Calendar, MessageSquare, StickyNote, Sparkles, Upload, Mic,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { suggestNextAction } from '@/lib/ai';
import {
  signalsForLead, freshestSignal, freshnessHours, classifyFreshness,
} from '@/lib/intent';
import type { PipelineLead, PipelineStage, LeadSource } from '@/lib/types';
import toast from 'react-hot-toast';
import SequenceStartDialog from '@/components/pipeline/SequenceStartDialog';
import SequenceProgressDisplay from '@/components/pipeline/SequenceProgressDisplay';
import BulkImportDialog from '@/components/pipeline/BulkImportDialog';
import DailyActionQueue from '@/components/pipeline/DailyActionQueue';
import IntentSignalDisplay from '@/components/intent/IntentSignalDisplay';
import IntentSignalEditor from '@/components/intent/IntentSignalEditor';
import AuthorityGapBanner from '@/components/icp/AuthorityGapBanner';
import IcpTagPicker from '@/components/icp/IcpTagPicker';
import { primaryIcpLabel } from '@/lib/icp';
import MeetingPrepDialog from '@/components/discovery/MeetingPrepDialog';
import { bantScore } from '@/lib/discovery';

const MC = {
  cream: '#F2EBDD',
  paper: '#F7F2E7',
  card: '#FFFFFF',
  ink: '#0F3B47',
  inkSoft: '#2C5460',
  inkMute: '#6E7F86',
  teal: '#3A8FA3',
  tealDeep: '#1E6F70',
  tealLight: '#7BB8C4',
  orange: '#D08A3E',
  orangeSoft: '#E5B07A',
  terracotta: '#B0432A',
  terracottaSoft: '#CC6B4F',
  sand: '#E6DCC8',
  line: '#D6CCB6',
};

const STAGES: { id: PipelineStage; label: string; color: string; bgColor: string }[] = [
  { id: 'new',         label: 'New',       color: MC.teal,        bgColor: 'rgba(58,143,163,0.12)' },
  { id: 'contacted',   label: 'Contacted', color: MC.tealDeep,    bgColor: 'rgba(30,111,112,0.12)' },
  { id: 'replied',     label: 'Replied',   color: MC.tealLight,   bgColor: 'rgba(123,184,196,0.18)' },
  { id: 'meeting',     label: 'Meeting',   color: MC.orange,      bgColor: 'rgba(208,138,62,0.16)' },
  { id: 'proposal',    label: 'Proposal',  color: MC.terracotta,  bgColor: 'rgba(176,67,42,0.14)' },
  { id: 'closed-won',  label: 'Won',       color: MC.tealDeep,    bgColor: 'rgba(30,111,112,0.14)' },
  { id: 'closed-lost', label: 'Lost',      color: MC.inkMute,     bgColor: 'rgba(110,127,134,0.14)' },
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

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;
  return `$${amount.toFixed(0)}`;
}

// Motion variants — kept tasteful, respect reduced-motion automatically via framer-motion
const containerStagger: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const itemRise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } },
};

const heroFade: Variants = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const cardEntry: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
  exit: { opacity: 0, y: -6, scale: 0.96, transition: { duration: 0.18 } },
};

export default function PipelinePage() {
  const {
    pipelineLeads, addPipelineLead, updatePipelineLead,
    movePipelineLead, deletePipelineLead, userPositioning, intentSignals,
  } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [suggestingFor, setSuggestingFor] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [editingSignalsFor, setEditingSignalsFor] = useState<string | null>(null);
  const [sequenceDialogLead, setSequenceDialogLead] = useState<PipelineLead | null>(null);
  const [meetingPrepLead, setMeetingPrepLead] = useState<PipelineLead | null>(null);
  const defaultIcp = primaryIcpLabel(userPositioning);
  const [addForm, setAddForm] = useState<{
    firstName: string;
    lastName: string;
    title: string;
    company: string;
    email: string;
    industry: string;
    source: LeadSource;
    icpTag: string | undefined;
  }>({
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    email: '',
    industry: '',
    source: 'manual',
    icpTag: defaultIcp,
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
    setAddForm({ firstName: '', lastName: '', title: '', company: '', email: '', industry: '', source: 'manual', icpTag: defaultIcp });
    setShowAddForm(false);
  };

  const moveForward = (lead: PipelineLead) => {
    const idx = STAGES.findIndex((s) => s.id === lead.stage);
    if (idx >= STAGES.length - 2) return;
    const nextStage = STAGES[idx + 1].id;

    if (nextStage === 'proposal' && !lead.proposalAmount) {
      const raw = window.prompt('Proposal amount in $ (optional, drives revenue projections):');
      const amt = raw ? Number(raw.replace(/[^\d.]/g, '')) : undefined;
      const update: Partial<PipelineLead> = { stage: nextStage };
      if (amt && !isNaN(amt) && amt > 0) update.proposalAmount = amt;
      updatePipelineLead(lead.id, update);
    } else {
      movePipelineLead(lead.id, nextStage);
    }
    toast.success(`Moved to ${STAGES[idx + 1].label}`);
  };

  const markWon = (lead: PipelineLead) => {
    const defaultAmount = lead.dealAmount ?? lead.proposalAmount ?? 0;
    const raw = window.prompt(
      `Closed-won! Final deal amount in $:`,
      defaultAmount > 0 ? defaultAmount.toString() : ''
    );
    if (raw === null) return;
    const amt = Number(raw.replace(/[^\d.]/g, ''));
    const update: Partial<PipelineLead> = { stage: 'closed-won' };
    if (!isNaN(amt) && amt > 0) update.dealAmount = amt;
    updatePipelineLead(lead.id, update);
    toast.success(amt > 0 ? `Closed-won: ${formatCurrency(amt)}` : 'Marked closed-won');
  };

  const markLost = (lead: PipelineLead) => {
    movePipelineLead(lead.id, 'closed-lost');
    toast('Marked closed-lost', { icon: '😐' });
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
        positioning: userPositioning,
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
    const followUp = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    update.nextFollowUp = followUp;
    updatePipelineLead(lead.id, update);

    if (lead.stage === 'new' && !lead.sequenceId && lead.email) {
      setTimeout(() => setSequenceDialogLead({ ...lead, stage: 'contacted' }), 300);
    }
    toast.success('Marked as contacted — follow-up set for 3 days');
  };

  const activeStages = STAGES.filter((s) => s.id !== 'closed-won' && s.id !== 'closed-lost');
  const wonCount = pipelineLeads.filter((l) => l.stage === 'closed-won').length;
  const lostCount = pipelineLeads.filter((l) => l.stage === 'closed-lost').length;
  const totalActive = pipelineLeads.filter((l) => l.stage !== 'closed-won' && l.stage !== 'closed-lost').length;

  const needsFollowUp = pipelineLeads.filter((l) => {
    if (l.stage === 'closed-won' || l.stage === 'closed-lost') return false;
    if (!l.nextFollowUp) return false;
    return new Date(l.nextFollowUp) <= new Date();
  });

  const stats = [
    { label: 'Active Leads',    value: totalActive,         color: MC.teal },
    { label: 'Won',             value: wonCount,            color: MC.tealDeep },
    { label: 'Lost',            value: lostCount,           color: MC.inkMute },
    { label: 'Follow-ups Due',  value: needsFollowUp.length, color: MC.terracotta },
  ];

  return (
    <div className="theme-midcentury flex-1 flex flex-col min-h-0">
      {/* Hero */}
      <motion.div
        className="px-4 md:px-8 pt-6 pb-5"
        initial="hidden"
        animate="show"
        variants={heroFade}
      >
        <div className="mc-hero px-5 md:px-7 py-5 md:py-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: MC.teal, color: MC.cream }}
                  initial={{ rotate: -8, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
                >
                  <Users size={14} />
                </motion.div>
                <span className="mc-tag mc-tag-teal">CRM</span>
              </div>
              <h2 className="mc-h text-2xl md:text-[28px] font-bold mb-1">Sales Pipeline</h2>
              <p className="text-sm mc-soft max-w-xl">
                Track every lead from first contact to closed deal — AI suggests your next move.
              </p>
            </div>

            <motion.div
              className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
              variants={containerStagger}
              initial="hidden"
              animate="show"
            >
              {stats.map((stat) => (
                <motion.div key={stat.label} variants={itemRise} className="mc-stat">
                  <div className="mc-h text-xl font-bold leading-tight" style={{ color: stat.color }}>
                    <AnimatedNumber value={stat.value} />
                  </div>
                  <div className="text-[11px] mc-mute mt-0.5">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="px-4 md:px-8 pb-4 flex flex-wrap items-center gap-3"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <motion.button
          className="mc-btn mc-btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={14} />
          Add Lead
        </motion.button>
        <motion.button
          className="mc-btn mc-btn-secondary"
          onClick={() => setShowBulkImport(true)}
          whileTap={{ scale: 0.97 }}
        >
          <Upload size={14} />
          Bulk Import
        </motion.button>
        {needsFollowUp.length > 0 && (
          <motion.div
            className="mc-tag mc-tag-orange"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: [0.9, 1.05, 1] }}
            transition={{ duration: 0.5 }}
          >
            <Calendar size={12} />
            {needsFollowUp.length} follow-up{needsFollowUp.length > 1 ? 's' : ''} overdue
          </motion.div>
        )}
      </motion.div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 space-y-5">
        <AuthorityGapBanner />
        <DailyActionQueue />

        {/* Add Lead Form */}
        <AnimatePresence initial={false}>
          {showAddForm && (
            <motion.div
              key="add-form"
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div className="mc-card p-5" style={{ borderColor: 'rgba(58,143,163,0.45)' }}>
                <h3 className="mc-h text-sm font-bold mb-4" style={{ color: MC.tealDeep }}>
                  Add New Lead
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <input className="mc-input" placeholder="First Name *" value={addForm.firstName}
                    onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })} />
                  <input className="mc-input" placeholder="Last Name" value={addForm.lastName}
                    onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })} />
                  <input className="mc-input" placeholder="Job Title" value={addForm.title}
                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} />
                  <input className="mc-input" placeholder="Company *" value={addForm.company}
                    onChange={(e) => setAddForm({ ...addForm, company: e.target.value })} />
                  <input className="mc-input" placeholder="Email" value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
                  <input className="mc-input" placeholder="Industry" value={addForm.industry}
                    onChange={(e) => setAddForm({ ...addForm, industry: e.target.value })} />
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs mc-mute">Source:</label>
                    {SOURCES.map((s) => {
                      const active = addForm.source === s.id;
                      return (
                        <motion.button
                          key={s.id}
                          onClick={() => setAddForm({ ...addForm, source: s.id })}
                          whileTap={{ scale: 0.95 }}
                          className="text-xs px-2.5 py-1 rounded-full transition-all"
                          style={{
                            background: active ? MC.teal : MC.card,
                            border: `1px solid ${active ? MC.teal : MC.line}`,
                            color: active ? MC.cream : MC.inkSoft,
                            fontWeight: 600,
                          }}
                        >
                          {s.label}
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-xs mc-mute">ICP:</label>
                    <div className="flex-1 max-w-md">
                      <IcpTagPicker
                        value={addForm.icpTag}
                        onChange={(tag) => setAddForm({ ...addForm, icpTag: tag })}
                        allowClear
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button className="mc-btn mc-btn-secondary flex-1 sm:flex-initial" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </button>
                    <button className="mc-btn mc-btn-primary flex-1 sm:flex-initial" onClick={handleAdd}>
                      Add to Pipeline
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kanban */}
        {pipelineLeads.length === 0 && !showAddForm ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="mc-empty-ring mb-4">
              <Users size={28} />
            </div>
            <h3 className="mc-h text-base font-bold mb-2">Your Pipeline is Empty</h3>
            <p className="text-sm text-center max-w-md mc-mute">
              Add leads manually or import from Apollo. Track them from first contact to closed deal.
            </p>
          </motion.div>
        ) : (
          <LayoutGroup>
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-5 gap-4"
              variants={containerStagger}
              initial="hidden"
              animate="show"
            >
              {activeStages.map((stage) => {
                const stageLeads = pipelineLeads.filter((l) => l.stage === stage.id);
                return (
                  <motion.div key={stage.id} variants={itemRise} layout>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="mc-stage-dot" style={{ background: stage.color }} />
                      <span className="mc-h text-[11px] font-bold uppercase tracking-wider" style={{ color: stage.color }}>
                        {stage.label}
                      </span>
                      <span
                        className="text-[10px] font-semibold ml-auto px-2 py-0.5 rounded-full"
                        style={{ background: stage.bgColor, color: stage.color }}
                      >
                        {stageLeads.length}
                      </span>
                    </div>

                    <motion.div layout className="space-y-2.5 min-h-[100px]">
                      <AnimatePresence initial={false} mode="popLayout">
                        {stageLeads.map((lead) => {
                          const days = daysSince(lead.lastContacted);
                          const isOverdue = lead.nextFollowUp && new Date(lead.nextFollowUp) <= new Date();
                          const leadSignals = signalsForLead(intentSignals, lead.id);
                          const topSignal = freshestSignal(leadSignals);
                          const topFreshness = topSignal ? classifyFreshness(freshnessHours(topSignal)) : 'cold';
                          const isHot = topFreshness === 'hot';
                          const isStale = !topSignal || topFreshness === 'cold';
                          return (
                            <motion.div
                              key={lead.id}
                              layoutId={`lead-${lead.id}`}
                              layout
                              variants={cardEntry}
                              initial="hidden"
                              animate="show"
                              exit="exit"
                              whileHover={{ y: -2 }}
                              transition={{ layout: { type: 'spring', stiffness: 320, damping: 28 } }}
                              className="mc-card p-3 text-xs"
                              style={{
                                opacity: isStale ? 0.72 : 1,
                                borderColor: isHot ? MC.orange : isOverdue ? MC.orangeSoft : MC.line,
                                boxShadow: isHot ? '0 0 0 3px rgba(208,138,62,0.15), 0 10px 24px -14px rgba(208,138,62,0.5)' : undefined,
                              }}
                            >
                              <div className="mc-h font-bold text-[13px]" style={{ color: MC.ink }}>
                                {lead.firstName} {lead.lastName}
                              </div>
                              <div className="mb-2 mc-soft text-[11.5px]">
                                {lead.title ? `${lead.title} at ` : ''}{lead.company}
                              </div>

                              {topSignal && (
                                <div className="mb-2">
                                  <IntentSignalDisplay signal={topSignal} compact />
                                </div>
                              )}

                              <div className="flex flex-wrap gap-1 mb-2 items-center">
                                <span className="mc-tag mc-tag-ink">{lead.source}</span>
                                {lead.email && (
                                  <span className="mc-tag mc-tag-teal">
                                    <Mail size={9} />email
                                  </span>
                                )}
                                {days !== undefined && (
                                  <span className={`mc-tag ${days > 5 ? 'mc-tag-orange' : 'mc-tag-teal'}`}>
                                    {days}d ago
                                  </span>
                                )}
                                {isOverdue && (
                                  <span className="mc-tag mc-tag-orange">follow-up due</span>
                                )}
                                {lead.proposalAmount && lead.stage === 'proposal' && (
                                  <span className="mc-tag mc-tag-terra">
                                    {formatCurrency(lead.proposalAmount)} proposal
                                  </span>
                                )}
                                {lead.dealAmount && lead.stage === 'closed-won' && (
                                  <span className="mc-tag mc-tag-teal">
                                    {formatCurrency(lead.dealAmount)} won
                                  </span>
                                )}
                                <IcpTagPicker
                                  value={lead.icpTag}
                                  onChange={(tag) => updatePipelineLead(lead.id, { icpTag: tag })}
                                  compact
                                  allowClear
                                />
                              </div>

                              <AnimatePresence>
                                {lead.aiSuggestedAction && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-2 rounded-lg mb-2"
                                    style={{
                                      background: 'rgba(208,138,62,0.10)',
                                      border: '1px solid rgba(208,138,62,0.28)',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <Sparkles size={10} color={MC.terracotta} />
                                      <span className="mc-h text-[10px] font-bold" style={{ color: MC.terracotta }}>
                                        AI Suggestion
                                      </span>
                                    </div>
                                    <div className="text-[11px] leading-snug" style={{ color: MC.inkSoft }}>
                                      {lead.aiSuggestedAction}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {lead.sequenceId && <SequenceProgressDisplay lead={lead} />}

                              <AnimatePresence>
                                {editingSignalsFor === lead.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-2"
                                    style={{ overflow: 'hidden' }}
                                  >
                                    <IntentSignalEditor leadId={lead.id} onAdded={() => setEditingSignalsFor(null)} />
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {editingNotes === lead.id ? (
                                <textarea
                                  className="mc-input text-xs resize-none mb-2"
                                  rows={2}
                                  placeholder="Add notes..."
                                  value={lead.notes}
                                  onChange={(e) => updatePipelineLead(lead.id, { notes: e.target.value })}
                                  onBlur={() => setEditingNotes(null)}
                                  autoFocus
                                />
                              ) : lead.notes ? (
                                <div
                                  className="text-[11px] p-2 rounded-lg mb-2 cursor-pointer"
                                  style={{ background: MC.sand, color: MC.inkSoft }}
                                  onClick={() => setEditingNotes(lead.id)}
                                >
                                  {lead.notes}
                                </div>
                              ) : null}

                              {/* Actions */}
                              <div className="flex items-center gap-1 pt-2 mt-1 border-t" style={{ borderColor: MC.line }}>
                                <IconBtn title="Move back" onClick={() => moveBack(lead)}>
                                  <ChevronLeft size={12} />
                                </IconBtn>
                                <IconBtn title="Move forward" onClick={() => moveForward(lead)}>
                                  <ChevronRight size={12} />
                                </IconBtn>
                                <IconBtn title="Mark contacted" onClick={() => markContacted(lead)}>
                                  <MessageSquare size={12} />
                                </IconBtn>
                                {!lead.sequenceId && lead.email && (
                                  <IconBtn title="Start sequence" onClick={() => setSequenceDialogLead(lead)}>
                                    <Mail size={12} />
                                  </IconBtn>
                                )}
                                <IconBtn title="Add notes" onClick={() => setEditingNotes(lead.id)}>
                                  <StickyNote size={12} />
                                </IconBtn>
                                <IconBtn
                                  title="Add intent signal"
                                  variant="accent"
                                  onClick={() => setEditingSignalsFor(editingSignalsFor === lead.id ? null : lead.id)}
                                >
                                  <Calendar size={12} />
                                </IconBtn>
                                {lead.stage === 'meeting' && (
                                  <IconBtn
                                    title="Open meeting prep"
                                    variant="accent"
                                    onClick={() => setMeetingPrepLead(lead)}
                                    badge={lead.callDebrief ? bantScore(lead.callDebrief) : undefined}
                                    badgeColor={
                                      lead.callDebrief && bantScore(lead.callDebrief) >= 3 ? MC.tealDeep
                                      : lead.callDebrief && bantScore(lead.callDebrief) >= 2 ? MC.orange
                                      : MC.terracotta
                                    }
                                  >
                                    <Mic size={12} />
                                  </IconBtn>
                                )}
                                <IconBtn
                                  title="AI suggest next action"
                                  variant="accent"
                                  onClick={() => handleSuggest(lead)}
                                  disabled={suggestingFor === lead.id}
                                >
                                  {suggestingFor === lead.id ? (
                                    <motion.span
                                      className="inline-block w-3 h-3 rounded-full border-2 border-t-transparent"
                                      style={{ borderColor: MC.terracotta, borderTopColor: 'transparent' }}
                                      animate={{ rotate: 360 }}
                                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                    />
                                  ) : (
                                    <Sparkles size={12} />
                                  )}
                                </IconBtn>
                                <div className="ml-auto flex items-center gap-1">
                                  <IconBtn title="Mark as Won" variant="win" onClick={() => markWon(lead)}>
                                    <span className="text-[10px] font-bold">W</span>
                                  </IconBtn>
                                  <IconBtn title="Mark as Lost" variant="danger" onClick={() => markLost(lead)}>
                                    <span className="text-[10px] font-bold">L</span>
                                  </IconBtn>
                                  <IconBtn
                                    title="Delete"
                                    variant="danger"
                                    onClick={() => { deletePipelineLead(lead.id); toast.success('Removed'); }}
                                  >
                                    <Trash2 size={11} />
                                  </IconBtn>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </LayoutGroup>
        )}

        {/* Closed deals */}
        {(wonCount > 0 || lostCount > 0) && (
          <motion.div
            className="mt-4 pt-6 border-t mc-divider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="mc-h text-sm font-bold mb-3" style={{ color: MC.inkSoft }}>Closed</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="mc-stage-dot" style={{ background: MC.tealDeep }} />
                  <span className="mc-h text-xs font-bold uppercase tracking-wider" style={{ color: MC.tealDeep }}>
                    Won ({wonCount})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {pipelineLeads.filter((l) => l.stage === 'closed-won').map((lead) => (
                    <motion.div
                      key={lead.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mc-card-flat flex items-center gap-3 px-3 py-2"
                    >
                      <span className="text-xs font-semibold" style={{ color: MC.ink }}>
                        {lead.firstName} {lead.lastName}
                      </span>
                      <span className="text-xs mc-mute">{lead.company}</span>
                      {lead.dealAmount && (
                        <span className="text-xs font-bold ml-auto mr-1" style={{ color: MC.tealDeep }}>
                          {formatCurrency(lead.dealAmount)}
                        </span>
                      )}
                      <button
                        className={lead.dealAmount ? '' : 'ml-auto'}
                        onClick={() => { deletePipelineLead(lead.id); toast.success('Removed'); }}
                      >
                        <Trash2 size={11} color={MC.inkMute} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="mc-stage-dot" style={{ background: MC.terracotta }} />
                  <span className="mc-h text-xs font-bold uppercase tracking-wider" style={{ color: MC.terracotta }}>
                    Lost ({lostCount})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {pipelineLeads.filter((l) => l.stage === 'closed-lost').map((lead) => (
                    <motion.div
                      key={lead.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mc-card-flat flex items-center gap-3 px-3 py-2"
                      style={{ background: 'rgba(176,67,42,0.04)' }}
                    >
                      <span className="text-xs font-semibold" style={{ color: MC.ink }}>
                        {lead.firstName} {lead.lastName}
                      </span>
                      <span className="text-xs mc-mute">{lead.company}</span>
                      <button
                        className="ml-auto"
                        onClick={() => { deletePipelineLead(lead.id); toast.success('Removed'); }}
                      >
                        <Trash2 size={11} color={MC.inkMute} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {sequenceDialogLead && (
        <SequenceStartDialog
          leadId={sequenceDialogLead.id}
          leadName={`${sequenceDialogLead.firstName} ${sequenceDialogLead.lastName}`}
          leadEmail={sequenceDialogLead.email}
          onClose={() => setSequenceDialogLead(null)}
        />
      )}

      {showBulkImport && <BulkImportDialog onClose={() => setShowBulkImport(false)} />}

      {meetingPrepLead && (
        <MeetingPrepDialog
          lead={pipelineLeads.find((l) => l.id === meetingPrepLead.id) || meetingPrepLead}
          onClose={() => setMeetingPrepLead(null)}
        />
      )}
    </div>
  );
}

/* -------- helpers -------- */

function IconBtn({
  children, title, onClick, disabled, variant, badge, badgeColor,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'accent' | 'danger' | 'win';
  badge?: number;
  badgeColor?: string;
}) {
  const cls =
    'mc-icon-btn ' +
    (variant === 'accent' ? 'is-accent' :
     variant === 'danger' ? 'is-danger' :
     variant === 'win'    ? 'is-win'    : '');
  return (
    <motion.button
      title={title}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.9 }}
      whileHover={{ y: -1 }}
      className={cls + ' relative'}
      style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
    >
      {children}
      {badge !== undefined && (
        <span
          className="absolute -top-1 -right-1 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold"
          style={{ background: badgeColor ?? MC.terracotta, color: MC.cream }}
        >
          {badge}
        </span>
      )}
    </motion.button>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  // Simple animated rise on mount + key-change. Keeps things light and tasteful.
  return (
    <motion.span
      key={value}
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 240, damping: 22 }}
      style={{ display: 'inline-block' }}
    >
      {value}
    </motion.span>
  );
}
