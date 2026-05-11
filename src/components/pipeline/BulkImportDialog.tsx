import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useStore } from '@/lib/store';
import toast from 'react-hot-toast';
import type { PipelineLead, LeadSource } from '@/lib/types';

interface BulkImportDialogProps {
  onClose: () => void;
}

interface CSVRow {
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  company?: string;
  industry?: string;
  source?: LeadSource;
}

export default function BulkImportDialog({ onClose }: BulkImportDialogProps) {
  const { addPipelineLead } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [source, setSource] = useState<LeadSource>('apollo');

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      if (values.length < 2) continue;

      const row: CSVRow = {
        firstName: values[headers.indexOf('firstname')] || '',
        lastName: values[headers.indexOf('lastname')] || '',
        email: values[headers.indexOf('email')] || '',
        title: values[headers.indexOf('title')],
        company: values[headers.indexOf('company')],
        industry: values[headers.indexOf('industry')],
        source,
      };

      if (row.firstName && row.email) {
        rows.push(row);
      }
    }

    return rows;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Select a CSV file');
      return;
    }

    setLoading(true);
    const errors: string[] = [];
    let successCount = 0;

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        toast.error('No valid rows found. CSV must have firstName, lastName, email columns');
        setLoading(false);
        return;
      }

      const now = new Date().toISOString();

      rows.forEach((row, idx) => {
        try {
          const lead: PipelineLead = {
            id: Date.now().toString() + idx,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            title: row.title || '',
            company: row.company || '',
            industry: row.industry || '',
            source: source,
            stage: 'new',
            notes: '',
            createdAt: now,
            updatedAt: now,
          };
          addPipelineLead(lead);
          successCount++;
        } catch (err) {
          errors.push(`Row ${idx + 2}: ${row.firstName || 'Unknown'} - ${(err as Error).message}`);
        }
      });

      setResults({
        success: successCount,
        failed: errors.length,
        errors,
      });

      if (successCount > 0) {
        toast.success(`Imported ${successCount} leads`);
      }
    } catch (err) {
      toast.error('Failed to parse CSV file');
      errors.push((err as Error).message);
      setResults({ success: 0, failed: 1, errors });
    }

    setLoading(false);
  };

  if (results) {
    return (
      <>
        <div onClick={onClose} className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
          <div
            className="rounded-2xl p-6 space-y-4 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #F7F2E7 0%, #0a1428 100%)',
              border: '1px solid rgba(58,143,163,0.2)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center`}
                  style={{
                    background: results.success > 0 ? 'rgba(30,111,112,0.15)' : 'rgba(176,67,42,0.15)',
                  }}
                >
                  {results.success > 0 ? (
                    <CheckCircle size={18} color="#1E6F70" />
                  ) : (
                    <AlertCircle size={18} color="#B0432A" />
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white" style={{ fontFamily: 'Syne' }}>
                  Import Complete
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-6 h-6 flex items-center justify-center rounded"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <X size={14} color="#6E7F86" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} color="#1E6F70" />
                <span className="text-sm" style={{ color: '#1E6F70', fontWeight: 600 }}>
                  {results.success} leads imported
                </span>
              </div>
              {results.failed > 0 && (
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} color="#B0432A" />
                  <span className="text-sm" style={{ color: '#B0432A', fontWeight: 600 }}>
                    {results.failed} failed
                  </span>
                </div>
              )}
            </div>

            {results.errors.length > 0 && (
              <div
                className="p-3 rounded-lg max-h-48 overflow-y-auto text-xs"
                style={{ background: 'rgba(176,67,42,0.05)', border: '1px solid rgba(176,67,42,0.2)' }}
              >
                <div style={{ color: '#fca5a5', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Errors:
                </div>
                {results.errors.map((err, i) => (
                  <div key={i} style={{ color: '#CC6B4F', marginBottom: '0.25rem' }}>
                    • {err}
                  </div>
                ))}
              </div>
            )}

            <button onClick={onClose} className="btn-primary w-full text-sm">
              Done
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div
          className="rounded-2xl p-6 space-y-4 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #F7F2E7 0%, #0a1428 100%)',
            border: '1px solid rgba(58,143,163,0.2)',
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(58,143,163,0.15)' }}
              >
                <Upload size={18} color="#1E6F70" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white" style={{ fontFamily: 'Syne' }}>
                  Bulk Import Leads
                </h3>
                <p className="text-xs" style={{ color: '#6E7F86' }}>
                  Upload a CSV file with your leads
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <X size={14} color="#6E7F86" />
            </button>
          </div>

          {/* Source selector */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86' }}>
              Lead Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as LeadSource)}
              className="input-field text-sm w-full"
            >
              <option value="apollo">Apollo</option>
              <option value="linkedin">LinkedIn</option>
              <option value="manual">Manual</option>
              <option value="referral">Referral</option>
              <option value="inbound">Inbound</option>
            </select>
          </div>

          {/* File input */}
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: '#6E7F86' }}>
              CSV File
            </label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all"
              style={{
                borderColor: file ? 'rgba(30,111,112,0.3)' : 'rgba(58,143,163,0.2)',
                background: file ? 'rgba(30,111,112,0.05)' : 'rgba(58,143,163,0.03)',
              }}
              onClick={() => document.getElementById('csv-input')?.click()}
            >
              <input
                id="csv-input"
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                <Upload size={20} color={file ? '#1E6F70' : '#6E7F86'} />
                <div>
                  {file ? (
                    <>
                      <p className="text-xs font-medium" style={{ color: '#1E6F70' }}>
                        {file.name}
                      </p>
                      <p className="text-xs" style={{ color: '#6E7F86' }}>
                        Ready to import
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-medium text-white">
                        Click to select or drag CSV
                      </p>
                      <p className="text-xs" style={{ color: '#6E7F86' }}>
                        Must include: firstName, lastName, email
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Template */}
          <div
            className="p-3 rounded-lg text-xs"
            style={{ background: 'rgba(58,143,163,0.08)' }}
          >
            <div className="font-medium mb-1.5" style={{ color: '#1E6F70' }}>
              CSV Template:
            </div>
            <code style={{ color: '#D6CCB6', fontSize: '11px', lineHeight: '1.5' }}>
              firstName,lastName,email,title,company,industry
              <br />
              John,Doe,john@example.com,CEO,Acme,Tech
            </code>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 text-sm">
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Importing...
                </>
              ) : (
                'Import Leads'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
