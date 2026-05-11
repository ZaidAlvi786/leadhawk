import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, Settings, Zap, ChevronRight, Mail, Users, Share2, X, BarChart3, BookOpen, Crosshair, Eye, Layers, LogOut } from 'lucide-react';
import { useStore } from '@/lib/store';
import { isPositioningComplete } from '@/lib/positioning';
import { useAuth } from '@/lib/auth';
import { useSync } from '@/lib/useSync';
import SyncStatusIndicator from '@/components/sync/SyncStatusIndicator';
import type { NavPage } from '@/lib/types';

const MC = {
  cream: '#F2EBDD',
  paper: '#F7F2E7',
  card: '#FFFFFF',
  ink: '#0F3B47',
  inkSoft: '#2C5460',
  inkMute: '#6E7F86',
  teal: '#3A8FA3',
  tealDeep: '#1E6F70',
  orange: '#D08A3E',
  terracotta: '#B0432A',
  sand: '#E6DCC8',
  line: '#D6CCB6',
};

const navItems: { id: NavPage; label: string; icon: typeof Target; description: string }[] = [
  { id: 'positioning',     label: 'Positioning',      icon: Crosshair, description: 'Your ICP, offer, proof' },
  { id: 'leads',           label: 'Lead Generation',  icon: Target,    description: 'Sales Navigator + AI Outreach' },
  { id: 'sequences',       label: 'Email Sequences',  icon: Mail,      description: 'Multi-Step Cold Email AI' },
  { id: 'pipeline',        label: 'Sales Pipeline',   icon: Users,     description: 'CRM + AI Next Actions' },
  { id: 'watchlist',       label: 'Watchlist',        icon: Eye,       description: 'Daily account scan' },
  { id: 'channels',        label: 'Channels',         icon: Layers,    description: 'Beyond Sales Navigator' },
  { id: 'linkedin-growth', label: 'LinkedIn Growth',  icon: TrendingUp,description: 'Posts & Authority Building' },
  { id: 'twitter-growth',  label: 'X / Twitter Growth', icon: Share2,  description: 'Tweets & Threads' },
  { id: 'analytics',       label: 'Analytics',        icon: BarChart3, description: 'Performance & Outcomes' },
  { id: 'templates',       label: 'Message Templates',icon: BookOpen,  description: 'Reusable Templates Library' },
];

export default function Sidebar() {
  const { currentPage, setCurrentPage, mobileSidebarOpen, setMobileSidebarOpen, userPositioning, pipelineLeads } = useStore();
  const { enabled: authEnabled, user, signOut } = useAuth();
  const { state: syncState, retry: retrySync } = useSync();
  const positioningReady = isPositioningComplete(userPositioning);
  const activeLeadCount = pipelineLeads.filter((l) => l.stage !== 'closed-won' && l.stage !== 'closed-lost').length;

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(15,59,71,0.45)', backdropFilter: 'blur(4px)' }}
          />
        )}
      </AnimatePresence>

      <aside
        className={`w-64 flex-shrink-0 flex flex-col fixed md:static inset-y-0 left-0 z-50 transition-transform duration-300 md:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          background: `linear-gradient(180deg, ${MC.paper} 0%, ${MC.cream} 100%)`,
          borderRight: `1px solid ${MC.line}`,
          minHeight: '100vh',
        }}
      >
        {/* Top accent stripe — multi-color Mid-Century band */}
        <div
          style={{
            height: 4,
            background: `linear-gradient(90deg, ${MC.teal} 0%, ${MC.tealDeep} 25%, ${MC.orange} 55%, ${MC.terracotta} 85%, ${MC.sand} 100%)`,
            opacity: 0.9,
          }}
        />

        {/* Logo */}
        <div className="p-6 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: MC.teal, color: MC.cream, boxShadow: '0 8px 20px -8px rgba(58,143,163,0.55)' }}
              initial={{ rotate: -8, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 14 }}
              whileHover={{ rotate: 6 }}
            >
              <Zap size={18} fill="currentColor" />
            </motion.div>
            <div>
              <div className="text-lg leading-none" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: MC.ink }}>
                LeadHawk
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: MC.inkMute, letterSpacing: '0.04em' }}>
                AI Sales Intelligence
              </div>
            </div>
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center -mr-2"
            style={{ background: MC.card, border: `1px solid ${MC.line}`, color: MC.inkSoft }}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 mb-4" style={{ height: 1, background: MC.line }} />

        {/* Positioning state pill */}
        <div className="px-4 mb-4">
          <motion.button
            onClick={() => setCurrentPage('positioning')}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-xl p-2.5 text-left transition-colors"
            style={{
              background: positioningReady ? 'rgba(30,111,112,0.08)' : 'rgba(208,138,62,0.12)',
              border: `1px solid ${positioningReady ? 'rgba(30,111,112,0.30)' : 'rgba(208,138,62,0.40)'}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold" style={{ color: positioningReady ? MC.tealDeep : MC.terracotta }}>
                {positioningReady ? '✓ Positioning set' : '⚠ Set positioning'}
              </div>
              <div className="text-[10px] font-mono" style={{ color: MC.inkMute }}>
                {activeLeadCount} active
              </div>
            </div>
            {positioningReady && userPositioning?.targetRole && (
              <div className="text-[11px] truncate mt-0.5" style={{ color: MC.inkSoft }}>
                {userPositioning.targetRole} @ {userPositioning.targetCompanyType}
              </div>
            )}
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-2">
          <div
            className="text-[10px] font-bold mb-2 px-2"
            style={{
              color: MC.inkMute,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            Modules
          </div>

          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + idx * 0.03, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ x: isActive ? 0 : 2 }}
                className="w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 relative group"
                style={{
                  background: isActive
                    ? `linear-gradient(90deg, rgba(58,143,163,0.16), rgba(58,143,163,0.02))`
                    : 'transparent',
                  borderLeft: '3px solid transparent',
                }}
              >
                {/* Active-state vertical indicator */}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
                    style={{ background: MC.teal }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    background: isActive ? MC.teal : MC.sand,
                    color: isActive ? MC.cream : MC.inkSoft,
                  }}
                >
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-semibold leading-tight mb-0.5"
                    style={{ color: isActive ? MC.ink : MC.inkSoft, fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {item.label}
                  </div>
                  <div className="text-[10.5px] truncate" style={{ color: MC.inkMute }}>
                    {item.description}
                  </div>
                </div>
                <ChevronRight size={12} color={isActive ? MC.teal : MC.inkMute} />
              </motion.button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 mt-auto space-y-2">
          <div className="mx-0.5" style={{ height: 1, background: MC.line }} />

          <SyncStatusIndicator state={syncState} onRetry={retrySync} />

          <div className="flex items-center gap-2">
            <button
              className="flex-1 px-3 py-2 rounded-lg flex items-center gap-2 text-left transition-colors"
              style={{ background: 'transparent', color: MC.inkSoft }}
            >
              <Settings size={13} />
              <span className="text-xs" style={{ fontFamily: 'DM Sans' }}>Settings</span>
            </button>
            {authEnabled && user && (
              <button
                onClick={async () => { await signOut(); window.location.reload(); }}
                className="px-2 py-2 rounded-lg flex items-center"
                style={{ background: 'rgba(176,67,42,0.10)', border: `1px solid rgba(176,67,42,0.30)`, color: MC.terracotta }}
                title={`Sign out ${user.email ?? ''}`}
              >
                <LogOut size={11} />
              </button>
            )}
          </div>

          <div className="px-2 flex items-center justify-between">
            <span className="text-[10px]" style={{ color: MC.inkMute, fontFamily: 'JetBrains Mono' }}>v2.0.0</span>
            <div className="flex items-center gap-1.5">
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: MC.tealDeep }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-[10px]" style={{ color: MC.inkMute }}>Live</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
