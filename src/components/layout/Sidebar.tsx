import React from 'react';
import { Target, TrendingUp, Settings, Zap, ChevronRight, Send, Mail, Users, Share2, X, BarChart3, BookOpen } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { NavPage } from '@/lib/types';

const navItems = [
  {
    id: 'leads' as NavPage,
    label: 'Lead Generation',
    icon: Target,
    description: 'Sales Navigator + AI Outreach',
    badge: 'HOT',
    badgeColor: 'tag-amber',
  },
  {
    id: 'apollo' as NavPage,
    label: 'Apollo Outreach',
    icon: Send,
    description: 'CSV Import + Cold Email',
    badge: 'NEW',
    badgeColor: 'tag-green',
  },
  {
    id: 'sequences' as NavPage,
    label: 'Email Sequences',
    icon: Mail,
    description: 'Multi-Step Cold Email AI',
    badge: 'AI',
    badgeColor: 'tag-indigo',
  },
  {
    id: 'pipeline' as NavPage,
    label: 'Sales Pipeline',
    icon: Users,
    description: 'CRM + AI Next Actions',
    badge: 'CRM',
    badgeColor: 'tag-cyan',
  },
  {
    id: 'linkedin-growth' as NavPage,
    label: 'LinkedIn Growth',
    icon: TrendingUp,
    description: 'Monetize & Grow Your Profile',
    badge: 'AI',
    badgeColor: 'tag-indigo',
  },
  {
    id: 'twitter-growth' as NavPage,
    label: 'X / Twitter Growth',
    icon: Share2,
    description: 'Viral Tweets & Threads',
    badge: 'NEW',
    badgeColor: 'tag-cyan',
  },
  {
    id: 'analytics' as NavPage,
    label: 'Analytics',
    icon: BarChart3,
    description: 'Performance & Outcomes',
    badge: 'NEW',
    badgeColor: 'tag-indigo',
  },
  {
    id: 'templates' as NavPage,
    label: 'Message Templates',
    icon: BookOpen,
    description: 'Reusable Templates Library',
    badge: 'NEW',
    badgeColor: 'tag-cyan',
  },
];

export default function Sidebar() {
  const { currentPage, setCurrentPage, mobileSidebarOpen, setMobileSidebarOpen } = useStore();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        />
      )}

      <aside
        className={`w-64 flex-shrink-0 flex flex-col fixed md:static inset-y-0 left-0 z-50 transition-transform duration-300 md:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          background: 'linear-gradient(180deg, #0a1628 0%, #080f1e 100%)',
          borderRight: '1px solid rgba(99,102,241,0.12)',
          minHeight: '100vh',
        }}
      >
      {/* Logo */}
      <div className="p-6 pb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            boxShadow: '0 0 20px rgba(99,102,241,0.4)',
          }}>
            <Zap size={18} color="white" fill="white" />
          </div>
          <div>
            <div className="font-display font-800 text-white text-lg leading-none" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800 }}>
              LeadHawk
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(99,102,241,0.7)' }}>
              AI Sales Intelligence
            </div>
          </div>
        </div>
        {/* Close button (mobile only) */}
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center -mr-2"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
          aria-label="Close menu"
        >
          <X size={16} color="#6366f1" />
        </button>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-4" style={{ height: '1px', background: 'rgba(99,102,241,0.1)' }} />

      {/* Stats pills */}
      <div className="px-4 mb-4 flex gap-2">
        <div className="flex-1 rounded-lg p-2 text-center" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <div className="text-xs font-mono font-medium" style={{ color: '#a5b4fc', fontFamily: 'JetBrains Mono' }}>0</div>
          <div className="text-xs mt-0.5" style={{ color: '#475569' }}>Filters</div>
        </div>
        <div className="flex-1 rounded-lg p-2 text-center" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}>
          <div className="text-xs font-mono font-medium" style={{ color: '#67e8f9', fontFamily: 'JetBrains Mono' }}>0</div>
          <div className="text-xs mt-0.5" style={{ color: '#475569' }}>Posts</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        <div className="text-xs font-medium mb-2 px-2" style={{ color: '#334155', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Syne, sans-serif' }}>
          Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full text-left px-3 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 group ${
                isActive ? 'nav-active' : 'nav-item'
              }`}
              style={isActive ? {
                background: 'linear-gradient(90deg, rgba(99,102,241,0.18), rgba(99,102,241,0.04))',
                borderLeft: '2px solid #6366f1',
              } : {
                borderLeft: '2px solid transparent',
              }}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                isActive ? 'shadow-glow-indigo' : ''
              }`} style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(6,182,212,0.2))'
                  : 'rgba(255,255,255,0.04)',
              }}>
                <Icon size={16} color={isActive ? '#a5b4fc' : '#475569'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-none mb-0.5" style={{
                  color: isActive ? '#e0e7ff' : '#64748b',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {item.label}
                </div>
                <div className="text-xs truncate" style={{ color: isActive ? '#6366f1' : '#334155' }}>
                  {item.description}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`tag text-xs px-1.5 py-0.5 ${item.badgeColor}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                  {item.badge}
                </span>
                <ChevronRight size={12} color={isActive ? '#6366f1' : '#334155'} />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 mt-auto">
        <div className="mb-3 mx-0.5" style={{ height: '1px', background: 'rgba(99,102,241,0.1)' }} />
        <button
          className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 nav-item text-left"
          style={{ borderLeft: '2px solid transparent' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Settings size={15} color="#475569" />
          </div>
          <span className="text-sm" style={{ color: '#64748b', fontFamily: 'DM Sans' }}>Settings</span>
        </button>

        {/* Version */}
        <div className="mt-3 px-2 flex items-center justify-between">
          <span className="text-xs" style={{ color: '#1e293b', fontFamily: 'JetBrains Mono' }}>v1.0.0</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse-slow" style={{ background: '#10b981' }} />
            <span className="text-xs" style={{ color: '#1e293b' }}>Live</span>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
