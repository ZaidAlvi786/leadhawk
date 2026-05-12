// This component exists because: leads from sources beyond Sales Navigator
// (YC jobs, Wellfound, "looking for X" posts, funding announcements) are
// almost always higher-intent than cold-list outreach. The capture flow is
// paste-and-classify: regex parsers extract what they can, the user fills
// the rest, and the result drops into the pipeline as a lead OR onto a
// watchlist account as an intent signal.

import React, { useState, useMemo } from 'react';
import { Briefcase, Search, DollarSign, Sparkles, Plus, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import {
  parseJobPosting, parseFundingNews, parseSocialPost, type ParsedJobPosting,
} from '@/lib/channels';
import { primaryIcpLabel } from '@/lib/icp';
import { guessSignalType, signalTypeLabel } from '@/lib/intent';
import type { LeadSource, PipelineLead, IntentSignal, IntentSignalType } from '@/lib/types';

type Channel = 'yc' | 'wellfound' | 'social' | 'funding';

const CHANNELS: { id: Channel; label: string; icon: typeof Briefcase; source: LeadSource; description: string }[] = [
  { id: 'yc',        label: 'YC Work-at-a-Startup',  icon: Sparkles,   source: 'yc-jobs',       description: 'Paste a job URL or listing — we extract company + role.' },
  { id: 'wellfound', label: 'Wellfound (AngelList)', icon: Briefcase,  source: 'wellfound',     description: 'Same flow as YC. Different funnel, different ICPs.' },
  { id: 'social',    label: '"Looking for X" posts', icon: Search,     source: 'social-search', description: 'Paste a LinkedIn/X post where someone says they\'re hiring or struggling.' },
  { id: 'funding',   label: 'Funding announcements', icon: DollarSign, source: 'funding-news',  description: 'Crunchbase/TechCrunch/press release. Just-funded companies are buying.' },
];

export default function ChannelCapture() {
  const [channel, setChannel] = useState<Channel>('yc');

  return (
    <div className="space-y-4">
      <div className="rounded-lg p-3" style={{
        background: 'rgba(58,143,163,0.06)',
        border: '1px solid rgba(58,143,163,0.18)',
      }}>
        <p className="text-xs leading-relaxed" style={{ color: '#1E6F70' }}>
          <strong>Paste-and-classify, no scraping.</strong> Each channel has lightweight regex parsers. The user controls what makes it into the pipeline; the AI doesn't invent.
        </p>
      </div>

      {/* Channel tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {CHANNELS.map((c) => {
          const Icon = c.icon;
          const isActive = channel === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setChannel(c.id)}
              className="p-3 rounded-xl text-left transition-all"
              style={{
                background: isActive ? 'rgba(58,143,163,0.18)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? 'rgba(58,143,163,0.5)' : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              <Icon size={13} color={isActive ? '#1E6F70' : '#6E7F86'} className="mb-1.5" />
              <p className="text-xs font-semibold" style={{ color: isActive ? '#1E6F70' : '#D6CCB6' }}>
                {c.label}
              </p>
              <p className="text-xs leading-relaxed mt-0.5" style={{ color: '#6E7F86' }}>
                {c.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active capture form */}
      {(channel === 'yc' || channel === 'wellfound') && <JobCaptureForm channel={channel} />}
      {channel === 'social'  && <SocialCaptureForm />}
      {channel === 'funding' && <FundingCaptureForm />}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Job posting capture (YC + Wellfound)
// -----------------------------------------------------------------------------

function JobCaptureForm({ channel }: { channel: 'yc' | 'wellfound' }) {
  const { addPipelineLead, userPositioning } = useStore();
  const [input, setInput] = useState('');
  const [edited, setEdited] = useState<{ company: string; role: string; url: string }>({ company: '', role: '', url: '' });

  const parsed: ParsedJobPosting = useMemo(() => parseJobPosting(input), [input]);

  // Sync parsed → edited fields when input changes (but don't overwrite if user typed)
  React.useEffect(() => {
    setEdited({
      company: parsed.company || '',
      role: parsed.role || '',
      url: parsed.url || '',
    });
  }, [input, parsed.company, parsed.role, parsed.url]);

  const sourceTag: LeadSource = channel === 'yc' ? 'yc-jobs' : 'wellfound';

  const handleAdd = () => {
    if (!edited.company.trim()) {
      toast.error('Company is required');
      return;
    }
    const now = new Date().toISOString();
    const lead: PipelineLead = {
      id: `l_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      firstName: 'Hiring manager',
      lastName: '',
      title: edited.role.trim() || 'Open role',
      company: edited.company.trim(),
      email: '',
      industry: '',
      source: sourceTag,
      stage: 'new',
      notes: edited.url.trim() ? `Posting: ${edited.url.trim()}` : '',
      icpTag: primaryIcpLabel(userPositioning),
      stageHistory: [{ stage: 'new', at: now }],
      createdAt: now,
      updatedAt: now,
    };
    addPipelineLead(lead);
    toast.success(`${edited.company} added to pipeline`);
    setInput('');
    setEdited({ company: '', role: '', url: '' });
  };

  return (
    <div className="glass-card p-4 space-y-3">
      <p className="text-xs font-semibold" style={{ color: '#6E7F86' }}>
        Paste the {channel === 'yc' ? 'YC' : 'Wellfound'} job (URL + listing snippet)
      </p>
      <textarea
        rows={5}
        className="input-field text-sm w-full resize-none"
        placeholder={'Paste the job URL and a snippet of the listing — we\'ll auto-fill what we can'}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      {input.trim() && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="input-field text-sm" placeholder="Company *" value={edited.company} onChange={(e) => setEdited({ ...edited, company: e.target.value })} />
          <input className="input-field text-sm" placeholder="Role" value={edited.role} onChange={(e) => setEdited({ ...edited, role: e.target.value })} />
          <input className="input-field text-sm md:col-span-2" placeholder="URL" value={edited.url} onChange={(e) => setEdited({ ...edited, url: e.target.value })} />
        </div>
      )}

      {input.trim() && (
        <button
          className="btn-primary w-full flex items-center justify-center gap-2"
          onClick={handleAdd}
          disabled={!edited.company.trim()}
        >
          <Plus size={13} />
          Add to pipeline as {sourceTag} lead
        </button>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Social post capture ("Looking for X")
// -----------------------------------------------------------------------------

function SocialCaptureForm() {
  const { addPipelineLead, userPositioning, watchlistAccounts, addIntentSignal } = useStore();
  const [input, setInput] = useState('');
  const [target, setTarget] = useState<'pipeline' | string>('pipeline'); // string = watchlistAccountId

  const parsed = useMemo(() => parseSocialPost(input), [input]);

  const handleAdd = () => {
    if (!input.trim()) return;
    const now = new Date().toISOString();

    if (target === 'pipeline') {
      // Create a new pipeline lead from the parsed name + excerpt
      const fullName = parsed.authorName || 'Unknown';
      const [first, ...rest] = fullName.split(' ');
      const lead: PipelineLead = {
        id: `l_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        firstName: first || 'Unknown',
        lastName: rest.join(' '),
        title: '',
        company: '',
        email: '',
        industry: '',
        source: 'social-search',
        stage: 'new',
        notes: parsed.excerpt || input.slice(0, 200),
        icpTag: primaryIcpLabel(userPositioning),
        stageHistory: [{ stage: 'new', at: now }],
        createdAt: now,
        updatedAt: now,
      };
      addPipelineLead(lead);
      toast.success(`Added ${fullName} to pipeline`);

      // Also add an intent signal for the "looking for" pattern
      const sigType: IntentSignalType = guessSignalType(input, parsed.url);
      const signal: IntentSignal = {
        id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        leadId: lead.id,
        type: sigType,
        title: parsed.excerpt?.slice(0, 80) || 'Social post signal',
        content: parsed.excerpt || input.slice(0, 500),
        url: parsed.url,
        occurredAt: now,
        capturedAt: now,
      };
      addIntentSignal(signal);
    } else {
      // Attach as a signal to an existing watchlist account
      const sigType: IntentSignalType = guessSignalType(input, parsed.url);
      const signal: IntentSignal = {
        id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        watchlistAccountId: target,
        type: sigType,
        title: parsed.excerpt?.slice(0, 80) || 'Social post signal',
        content: parsed.excerpt || input.slice(0, 500),
        url: parsed.url,
        occurredAt: now,
        capturedAt: now,
      };
      addIntentSignal(signal);
      toast.success('Signal attached to watchlist account');
    }

    setInput('');
  };

  const sigType = input.trim() ? guessSignalType(input, parsed.url) : null;

  return (
    <div className="glass-card p-4 space-y-3">
      <p className="text-xs font-semibold" style={{ color: '#6E7F86' }}>
        Paste a LinkedIn/X post where someone said they're hiring or struggling
      </p>
      <textarea
        rows={5}
        className="input-field text-sm w-full resize-none"
        placeholder={'Author name on first line, then post text. Include the URL too.'}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      {input.trim() && (
        <div className="rounded-lg p-3 space-y-1.5" style={{ background: 'rgba(58,143,163,0.06)', border: '1px solid rgba(58,143,163,0.15)' }}>
          <Detected label="Author"  value={parsed.authorName} />
          <Detected label="Excerpt" value={parsed.excerpt} />
          <Detected label="URL"     value={parsed.url} />
          {sigType && <Detected label="Signal type" value={signalTypeLabel(sigType)} />}
        </div>
      )}

      {input.trim() && (
        <>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86' }}>Save to:</label>
            <select
              className="input-field text-sm w-full"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="pipeline">New pipeline lead</option>
              {watchlistAccounts.map((a) => (
                <option key={a.id} value={a.id}>Watchlist: {a.companyName}</option>
              ))}
            </select>
          </div>

          <button onClick={handleAdd} className="btn-primary w-full flex items-center justify-center gap-2">
            <Plus size={13} /> Save signal
          </button>
        </>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Funding news capture
// -----------------------------------------------------------------------------

function FundingCaptureForm() {
  const { addPipelineLead, userPositioning, addIntentSignal } = useStore();
  const [input, setInput] = useState('');

  const parsed = useMemo(() => parseFundingNews(input), [input]);

  const handleAdd = () => {
    if (!input.trim()) return;
    if (!parsed.company) {
      toast.error('Company name required — fill it in below');
      return;
    }
    const now = new Date().toISOString();
    const lead: PipelineLead = {
      id: `l_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      firstName: 'Founder/team',
      lastName: '',
      title: '',
      company: parsed.company,
      email: '',
      industry: '',
      source: 'funding-news',
      stage: 'new',
      notes: parsed.url ? `Source: ${parsed.url}` : '',
      icpTag: primaryIcpLabel(userPositioning),
      stageHistory: [{ stage: 'new', at: now }],
      createdAt: now,
      updatedAt: now,
    };
    addPipelineLead(lead);

    // Attach as a funding intent signal
    const signal: IntentSignal = {
      id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      leadId: lead.id,
      type: 'funding',
      title: parsed.amount
        ? `${parsed.stage || 'Round'}: $${(parsed.amount / 1_000_000).toFixed(1)}M`
        : (parsed.stage || 'Funding event'),
      content: input.slice(0, 500),
      url: parsed.url,
      occurredAt: now,
      capturedAt: now,
    };
    addIntentSignal(signal);

    toast.success(`${parsed.company} added with funding signal`);
    setInput('');
  };

  return (
    <div className="glass-card p-4 space-y-3">
      <p className="text-xs font-semibold" style={{ color: '#6E7F86' }}>
        Paste the funding announcement (Crunchbase, TechCrunch, press release)
      </p>
      <textarea
        rows={5}
        className="input-field text-sm w-full resize-none"
        placeholder={'Just-funded companies are in buying mode for the next 60-90 days. Paste anything — headline, body, URL.'}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      {input.trim() && (
        <div className="rounded-lg p-3 space-y-1.5" style={{ background: 'rgba(58,143,163,0.06)', border: '1px solid rgba(58,143,163,0.15)' }}>
          <Detected label="Company" value={parsed.company} />
          <Detected label="Amount"  value={parsed.amount ? `$${(parsed.amount / 1_000_000).toFixed(1)}M` : undefined} />
          <Detected label="Stage"   value={parsed.stage} />
          <Detected label="URL"     value={parsed.url} />
        </div>
      )}

      {input.trim() && (
        <button
          onClick={handleAdd}
          disabled={!parsed.company}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Plus size={13} /> Add lead + funding signal
        </button>
      )}
    </div>
  );
}

function Detected({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 flex-shrink-0" style={{ color: '#6E7F86' }}>{label}:</span>
      {value
        ? <span style={{ color: 'var(--text-primary)' }} className="truncate">
            {value.startsWith('http') ? <a href={value} target="_blank" rel="noopener noreferrer" className="underline">{value} <ExternalLink size={9} className="inline" /></a> : value}
          </span>
        : <span style={{ color: '#6E7F86' }}>—</span>}
    </div>
  );
}
