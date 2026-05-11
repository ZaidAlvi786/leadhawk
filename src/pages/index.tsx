import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import LeadsPage from '@/pages/leads';
import SequencesPage from '@/pages/sequences';
import PipelinePage from '@/pages/pipeline';
import LinkedInGrowthPage from '@/pages/linkedin-growth';
import TwitterGrowthPage from '@/pages/twitter-growth';
import AnalyticsPage from '@/pages/analytics';
import TemplatesPage from '@/pages/templates';
import PositioningPage from '@/pages/positioning';
import WatchlistPage from '@/pages/watchlist';
import ChannelsPage from '@/pages/channels';
import PositioningSetup from '@/components/positioning/PositioningSetup';
import { useStore } from '@/lib/store';
import { isPositioningComplete } from '@/lib/positioning';
import { X } from 'lucide-react';

const MC = {
  cream: '#F2EBDD',
  paper: '#F7F2E7',
  ink: '#0F3B47',
  teal: '#3A8FA3',
  orange: '#D08A3E',
  terracotta: '#B0432A',
  line: '#D6CCB6',
};

const pageVariants: Variants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(4px)' },
  show:   { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  exit:   { opacity: 0, y: -10, filter: 'blur(3px)', transition: { duration: 0.24, ease: [0.4, 0, 1, 1] } },
};

function PageSlot({ pageKey, children }: { pageKey: string; children: React.ReactNode }) {
  return (
    <motion.div
      key={pageKey}
      variants={pageVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="flex-1 flex flex-col min-h-0"
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const { currentPage, userPositioning, setCurrentPage } = useStore();
  const [showPositioningModal, setShowPositioningModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isPositioningComplete(userPositioning)) {
      setTimeout(() => setShowPositioningModal(true), 600);
    }
  }, [userPositioning]);

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>LeadHawk — AI Sales Intelligence</title>
        <meta name="description" content="Generate leads, craft AI outreach messages, and grow your LinkedIn profile" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex h-screen overflow-hidden" style={{ background: MC.cream, color: MC.ink }}>
        {/* Ambient Mid-Century background — soft, warm radial gradients */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <motion.div
            className="absolute -top-20 left-1/3 w-[28rem] h-[28rem] rounded-full"
            style={{ background: `radial-gradient(circle, ${MC.teal}, transparent 65%)`, filter: 'blur(80px)', opacity: 0.18 }}
            animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-32 right-1/4 w-[26rem] h-[26rem] rounded-full"
            style={{ background: `radial-gradient(circle, ${MC.orange}, transparent 65%)`, filter: 'blur(90px)', opacity: 0.16 }}
            animate={{ x: [0, -25, 0], y: [0, -15, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/2 right-0 w-72 h-72 rounded-full"
            style={{ background: `radial-gradient(circle, ${MC.terracotta}, transparent 65%)`, filter: 'blur(100px)', opacity: 0.10 }}
            animate={{ x: [0, -20, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Sidebar */}
        <Sidebar />

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <Header />
          <main className="flex-1 overflow-hidden flex flex-col relative">
            <AnimatePresence mode="wait" initial={false}>
              {currentPage === 'leads'           && <PageSlot key="leads"           pageKey="leads"><LeadsPage /></PageSlot>}
              {currentPage === 'sequences'       && <PageSlot key="sequences"       pageKey="sequences"><SequencesPage /></PageSlot>}
              {currentPage === 'pipeline'        && <PageSlot key="pipeline"        pageKey="pipeline"><PipelinePage /></PageSlot>}
              {currentPage === 'linkedin-growth' && <PageSlot key="linkedin-growth" pageKey="linkedin-growth"><LinkedInGrowthPage /></PageSlot>}
              {currentPage === 'twitter-growth'  && <PageSlot key="twitter-growth"  pageKey="twitter-growth"><TwitterGrowthPage /></PageSlot>}
              {currentPage === 'analytics'       && <PageSlot key="analytics"       pageKey="analytics"><AnalyticsPage /></PageSlot>}
              {currentPage === 'templates'       && <PageSlot key="templates"       pageKey="templates"><TemplatesPage /></PageSlot>}
              {currentPage === 'positioning'     && <PageSlot key="positioning"     pageKey="positioning"><PositioningPage /></PageSlot>}
              {currentPage === 'watchlist'       && <PageSlot key="watchlist"       pageKey="watchlist"><WatchlistPage /></PageSlot>}
              {currentPage === 'channels'        && <PageSlot key="channels"        pageKey="channels"><ChannelsPage /></PageSlot>}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Positioning Setup — blocks first-load until complete */}
      <AnimatePresence>
        {showPositioningModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,59,71,0.55)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ y: 20, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 16, scale: 0.97, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto"
            >
              {isPositioningComplete(userPositioning) && (
                <button
                  onClick={() => setShowPositioningModal(false)}
                  className="absolute -top-3 -right-3 w-9 h-9 rounded-full flex items-center justify-center z-10"
                  style={{ background: '#FFFFFF', border: `1px solid ${MC.line}`, color: MC.ink, boxShadow: '0 8px 24px -10px rgba(15,59,71,0.3)' }}
                >
                  <X size={15} />
                </button>
              )}
              <PositioningSetup
                onComplete={() => {
                  setShowPositioningModal(false);
                  setCurrentPage('leads');
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
