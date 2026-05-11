import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, User, ChevronDown, Menu } from 'lucide-react';
import { useStore } from '@/lib/store';

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

const pageLabels: Record<string, { title: string; subtitle: string }> = {
  positioning:      { title: 'Positioning',       subtitle: 'Define your ICP, offer, and proof points' },
  leads:            { title: 'Lead Generation',   subtitle: 'Find & reach your ideal clients on Sales Navigator' },
  sequences:        { title: 'Email Sequences',   subtitle: 'Multi-step cold email — generated and managed by AI' },
  pipeline:         { title: 'Sales Pipeline',    subtitle: 'Track every lead from first contact to closed deal' },
  watchlist:        { title: 'Watchlist',         subtitle: 'Daily account intent signal scan' },
  channels:         { title: 'Channels',          subtitle: 'Beyond Sales Navigator — alt lead sources' },
  'linkedin-growth':{ title: 'LinkedIn Growth',   subtitle: 'Monetize your profile & build thought leadership' },
  'twitter-growth': { title: 'X / Twitter Growth',subtitle: 'Tweets, threads & a growth playbook' },
  analytics:        { title: 'Analytics',         subtitle: 'Performance, outcomes, conversion' },
  templates:        { title: 'Message Templates', subtitle: 'Your reusable copy library' },
};

export default function Header() {
  const { currentPage, userProfile, setMobileSidebarOpen } = useStore();
  const [showProfile, setShowProfile] = useState(false);
  const pageInfo = pageLabels[currentPage] || { title: 'LeadHawk', subtitle: '' };

  return (
    <header
      className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 gap-3 sticky top-0 z-30"
      style={{
        borderBottom: `1px solid ${MC.line}`,
        background: 'rgba(247, 242, 231, 0.85)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      {/* Page title + mobile hamburger */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: MC.card, border: `1px solid ${MC.line}`, color: MC.teal }}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        {/* Animated title swap on page change */}
        <div className="min-w-0 relative overflow-hidden" style={{ height: 44 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pageInfo.title}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1
                className="text-base md:text-xl font-bold truncate"
                style={{ fontFamily: 'Syne, sans-serif', color: MC.ink, letterSpacing: '-0.01em' }}
              >
                {pageInfo.title}
              </h1>
              <p className="text-[11.5px] mt-0.5 truncate hidden sm:block" style={{ color: MC.inkMute }}>
                {pageInfo.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={14} className="absolute left-3" style={{ color: MC.inkMute }} />
          <input
            className="text-sm w-56 outline-none transition-all"
            placeholder="Search leads, posts..."
            style={{
              background: MC.card,
              border: `1px solid ${MC.line}`,
              borderRadius: 11,
              color: MC.ink,
              padding: '8px 12px 8px 34px',
              fontFamily: 'DM Sans',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = MC.teal;
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,143,163,0.18)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = MC.line;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Notification */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ y: -1 }}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: MC.card, border: `1px solid ${MC.line}`, color: MC.teal }}
        >
          <Bell size={16} />
          <motion.span
            className="absolute top-2 right-2 w-2 h-2 rounded-full"
            style={{ background: MC.terracotta }}
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.button>

        {/* Profile */}
        <motion.button
          onClick={() => setShowProfile(!showProfile)}
          whileTap={{ scale: 0.97 }}
          whileHover={{ y: -1 }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl relative"
          style={{ background: MC.card, border: `1px solid ${MC.line}` }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: MC.teal, color: MC.cream }}
          >
            <User size={14} />
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold leading-none" style={{ color: MC.ink }}>
              {userProfile.name || 'Your Name'}
            </div>
            <div className="text-[10.5px] mt-0.5" style={{ color: MC.tealDeep }}>
              {userProfile.title}
            </div>
          </div>
          <ChevronDown size={14} color={MC.inkSoft} />
        </motion.button>
      </div>
    </header>
  );
}
