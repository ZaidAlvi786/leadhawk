import React, { useState } from 'react';
import { Bell, Search, User, ChevronDown } from 'lucide-react';
import { useStore } from '@/lib/store';

const pageLabels: Record<string, { title: string; subtitle: string }> = {
  leads: { title: 'Lead Generation', subtitle: 'Find & Reach Your Ideal Clients on Sales Navigator' },
  'linkedin-growth': { title: 'LinkedIn Growth', subtitle: 'Monetize Your Profile & Build Thought Leadership' },
};

export default function Header() {
  const { currentPage, userProfile } = useStore();
  const [showProfile, setShowProfile] = useState(false);
  const pageInfo = pageLabels[currentPage] || { title: 'LeadHawk', subtitle: '' };

  return (
    <header className="flex items-center justify-between px-8 py-4" style={{
      borderBottom: '1px solid rgba(99,102,241,0.1)',
      background: 'rgba(8,15,30,0.8)',
      backdropFilter: 'blur(10px)',
    }}>
      {/* Page title */}
      <div>
        <h1 className="font-display text-xl font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
          {pageInfo.title}
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{pageInfo.subtitle}</p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={14} className="absolute left-3" style={{ color: '#334155' }} />
          <input
            className="input-field pl-9 text-sm w-52"
            placeholder="Search leads, posts..."
            style={{ background: 'rgba(15,23,42,0.6)', padding: '8px 12px 8px 34px' }}
          />
        </div>

        {/* Notification */}
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.15)',
        }}>
          <Bell size={16} color="#6366f1" />
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: '#f43f5e' }} />
        </button>

        {/* Profile */}
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl relative"
          style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.15)',
          }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          }}>
            <User size={14} color="white" />
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-medium text-white leading-none">{userProfile.name || 'Your Name'}</div>
            <div className="text-xs mt-0.5" style={{ color: '#6366f1' }}>{userProfile.title}</div>
          </div>
          <ChevronDown size={14} color="#6366f1" />
        </button>
      </div>
    </header>
  );
}
