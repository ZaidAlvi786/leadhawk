import React, { useState, useRef, useCallback } from 'react';
import { Upload, Send, Trash2, Copy, Wand2, Users, Mail, Download, MessageSquare } from 'lucide-react';
import { useStore } from '@/lib/store';
import { generateOutreachMessage } from '@/lib/ai';
import toast from 'react-hot-toast';

interface ApolloLead {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  email: string;
  industry: string;
  location: string;
  linkedinUrl: string;
  generatedMessage: string;
}

// Maps common Apollo.io CSV headers to our fields.
// Apollo exports vary by plan, so we accept multiple column names.
const HEADER_MAP: Record<string, keyof ApolloLead> = {
  'first name': 'firstName',
  'first_name': 'firstName',
  'firstname': 'firstName',
  'last name': 'lastName',
  'last_name': 'lastName',
  'lastname': 'lastName',
  'title': 'title',
  'job title': 'title',
  'job_title': 'title',
  'company': 'company',
  'company name': 'company',
  'company_name': 'company',
  'organization name': 'company',
  'email': 'email',
  'email address': 'email',
  'work email': 'email',
  'industry': 'industry',
  'company industry': 'industry',
  'city': 'location',
  'location': 'location',
  'person city': 'location',
  'person linkedin url': 'linkedinUrl',
  'linkedin url': 'linkedinUrl',
  'linkedin': 'linkedinUrl',
};

function parseCSV(text: string): ApolloLead[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const rawHeaders = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());
  const fieldMap: (keyof ApolloLead | null)[] = rawHeaders.map(
    (h) => HEADER_MAP[h.toLowerCase()] ?? null
  );

  const leads: ApolloLead[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVRow(lines[i]);
    const lead: ApolloLead = {
      id: `apollo-${i}-${Date.now()}`,
      firstName: '',
      lastName: '',
      title: '',
      company: '',
      email: '',
      industry: '',
      location: '',
      linkedinUrl: '',
      generatedMessage: '',
    };

    fieldMap.forEach((field, idx) => {
      if (field && values[idx]) {
        (lead as unknown as Record<string, string>)[field] = values[idx].replace(/^"|"$/g, '').trim();
      }
    });

    // Skip rows with no name or company
    if ((lead.firstName || lead.lastName) && lead.company) {
      leads.push(lead);
    }
  }

  return leads;
}

// Handles quoted CSV fields (commas inside quotes)
function splitCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export default function ApolloPage() {
  const { userProfile } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [leads, setLeads] = useState<ApolloLead[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [selectedTone, setSelectedTone] = useState<'professional' | 'casual' | 'value-driven' | 'problem-solving'>('professional');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a .csv file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error('No leads found. Check that your CSV has name + company columns.');
        return;
      }
      setLeads(parsed);
      toast.success(`Imported ${parsed.length} leads!`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const generateForLead = useCallback(async (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    setGenerating(leadId);
    try {
      const msg = await generateOutreachMessage({
        leadName: lead.firstName,
        leadTitle: lead.title,
        leadCompany: lead.company,
        leadIndustry: lead.industry,
        tone: selectedTone,
        yourService: userProfile.service,
        yourName: userProfile.name || 'your name',
      });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, generatedMessage: msg } : l))
      );
      toast.success(`Message generated for ${lead.firstName}!`);
    } catch {
      toast.error('Generation failed');
    }
    setGenerating(null);
  }, [leads, selectedTone, userProfile]);

  const generateAll = async () => {
    const unleaded = leads.filter((l) => !l.generatedMessage);
    if (!unleaded.length) {
      toast.error('All leads already have messages');
      return;
    }
    setBatchGenerating(true);
    let done = 0;
    for (const lead of unleaded) {
      try {
        const msg = await generateOutreachMessage({
          leadName: lead.firstName,
          leadTitle: lead.title,
          leadCompany: lead.company,
          leadIndustry: lead.industry,
          tone: selectedTone,
          yourService: userProfile.service,
          yourName: userProfile.name || 'your name',
        });
        setLeads((prev) =>
          prev.map((l) => (l.id === lead.id ? { ...l, generatedMessage: msg } : l))
        );
        done++;
      } catch {
        // continue to next lead
      }
    }
    setBatchGenerating(false);
    toast.success(`Generated messages for ${done} leads!`);
  };

  const removeLead = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const exportCSV = () => {
    if (!leads.length) return;
    const headers = ['First Name', 'Last Name', 'Title', 'Company', 'Email', 'Industry', 'Location', 'LinkedIn URL', 'Generated Message'];
    const rows = leads.map((l) => [
      l.firstName, l.lastName, l.title, l.company, l.email,
      l.industry, l.location, l.linkedinUrl, l.generatedMessage,
    ].map((v) => `"${(v || '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leadhawk-apollo-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  const messagesGenerated = leads.filter((l) => l.generatedMessage).length;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Hero */}
      <div className="px-8 py-5 border-b" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                <Send size={13} color="white" />
              </div>
              <span className="text-xs font-medium tag tag-amber">Apollo.io Integration</span>
            </div>
            <h2 className="text-lg font-semibold text-white mb-0.5" style={{ fontFamily: 'Syne' }}>
              Apollo Outreach
            </h2>
            <p className="text-sm" style={{ color: '#475569' }}>
              Import leads from Apollo.io → Generate personalized messages → Export & send
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {[
              { label: 'Leads Imported', value: leads.length.toString(), color: '#f59e0b' },
              { label: 'Messages Ready', value: messagesGenerated.toString(), color: '#10b981' },
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

      {/* Workflow */}
      <div className="px-8 py-4 border-b" style={{ borderColor: 'rgba(99,102,241,0.08)' }}>
        <div className="flex items-center gap-0">
          {[
            { n: '1', label: 'Export from Apollo', sub: 'Download CSV' },
            { n: '2', label: 'Import Here', sub: 'Upload CSV file' },
            { n: '3', label: 'Generate Messages', sub: 'AI-crafted outreach' },
            { n: '4', label: 'Export & Send', sub: 'CSV with messages' },
          ].map((step, i) => (
            <React.Fragment key={step.n}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: 'white', fontFamily: 'Syne' }}>
                  {step.n}
                </div>
                <div>
                  <div className="text-xs font-medium" style={{ color: '#94a3b8' }}>{step.label}</div>
                  <div className="text-xs" style={{ color: '#334155' }}>{step.sub}</div>
                </div>
              </div>
              {i < 3 && (
                <div className="flex-1 mx-3 h-px" style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.3), rgba(239,68,68,0.1))' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Actions bar */}
      <div className="px-8 py-4 flex flex-wrap items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={14} />
          Import CSV
        </button>

        {leads.length > 0 && (
          <>
            {/* Tone selector */}
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value as typeof selectedTone)}
              className="input-field text-sm px-3 py-2"
              style={{ width: 'auto' }}
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="value-driven">Value-Driven</option>
              <option value="problem-solving">Problem-Solving</option>
            </select>

            <button
              className="btn-secondary flex items-center gap-2"
              onClick={generateAll}
              disabled={batchGenerating}
            >
              {batchGenerating ? (
                <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
              ) : (
                <Wand2 size={14} />
              )}
              {batchGenerating ? 'Generating...' : `Generate All (${leads.filter(l => !l.generatedMessage).length} left)`}
            </button>

            <button
              className="btn-secondary flex items-center gap-2"
              onClick={exportCSV}
            >
              <Download size={14} />
              Export CSV
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
              style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f87171' }}
              onClick={() => { setLeads([]); toast.success('Cleared all leads'); }}
            >
              <Trash2 size={14} />
              Clear All
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-6">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Users size={28} color="#f59e0b" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2" style={{ fontFamily: 'Syne' }}>
              Import Your Apollo Leads
            </h3>
            <p className="text-sm text-center max-w-md mb-4" style={{ color: '#475569' }}>
              Export leads from Apollo.io as CSV, then upload here. We&apos;ll parse names, titles,
              companies, and emails — then generate personalized outreach messages for each lead.
            </p>
            <div className="glass-card p-4 text-xs max-w-md" style={{ color: '#64748b' }}>
              <strong style={{ color: '#94a3b8' }}>Supported columns:</strong> First Name, Last Name, Title,
              Company, Email, Industry, City/Location, LinkedIn URL
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div key={lead.id} className="glass-card p-4">
                <div className="flex items-start gap-4">
                  {/* Lead info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">
                        {lead.firstName} {lead.lastName}
                      </span>
                      {lead.email && (
                        <span className="tag tag-cyan flex items-center gap-1 text-xs">
                          <Mail size={9} />
                          {lead.email}
                        </span>
                      )}
                    </div>
                    <div className="text-xs mb-1" style={{ color: '#64748b' }}>
                      {lead.title}{lead.company ? ` at ${lead.company}` : ''}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {lead.industry && <span className="tag tag-indigo text-xs">{lead.industry}</span>}
                      {lead.location && <span className="tag tag-green text-xs">{lead.location}</span>}
                      {lead.linkedinUrl && (
                        <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer"
                          className="tag tag-amber text-xs hover:opacity-80">LinkedIn</a>
                      )}
                    </div>

                    {/* Generated message */}
                    {lead.generatedMessage && (
                      <div className="mt-3 p-3 rounded-lg text-sm whitespace-pre-wrap leading-relaxed"
                        style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)', color: '#cbd5e1' }}>
                        {lead.generatedMessage}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => generateForLead(lead.id)}
                      disabled={generating === lead.id}
                      className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                    >
                      {generating === lead.id ? (
                        <div className="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                      ) : (
                        <MessageSquare size={12} />
                      )}
                      {lead.generatedMessage ? 'Regenerate' : 'Generate'}
                    </button>
                    {lead.generatedMessage && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(lead.generatedMessage); toast.success('Copied!'); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg"
                        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
                      >
                        <Copy size={12} color="#a5b4fc" />
                      </button>
                    )}
                    <button
                      onClick={() => removeLead(lead.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg"
                      style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}
                    >
                      <Trash2 size={12} color="#f87171" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
