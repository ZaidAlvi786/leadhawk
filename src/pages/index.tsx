import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import LeadsPage from '@/pages/leads';
import ApolloPage from '@/pages/apollo';
import SequencesPage from '@/pages/sequences';
import PipelinePage from '@/pages/pipeline';
import LinkedInGrowthPage from '@/pages/linkedin-growth';
import TwitterGrowthPage from '@/pages/twitter-growth';
import AnalyticsPage from '@/pages/analytics';
import TemplatesPage from '@/pages/templates';
import ProfileSetup from '@/components/shared/ProfileSetup';
import { useStore } from '@/lib/store';
import { X } from 'lucide-react';

export default function Home() {
  const { currentPage, userProfile } = useStore();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Show profile setup on first visit
    if (!userProfile.name) {
      setTimeout(() => setShowProfileModal(true), 800);
    }
  }, []);

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>LeadHawk — AI Sales Intelligence</title>
        <meta name="description" content="Generate leads, craft AI outreach messages, and grow your LinkedIn profile" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        {/* Ambient background */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', filter: 'blur(60px)' }} />
        </div>

        {/* Sidebar — self-positioned (fixed on mobile, static on md+) */}
        <Sidebar />

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <Header />
          <main className="flex-1 overflow-hidden flex flex-col">
            {currentPage === 'leads' && <LeadsPage />}
            {currentPage === 'apollo' && <ApolloPage />}
            {currentPage === 'sequences' && <SequencesPage />}
            {currentPage === 'pipeline' && <PipelinePage />}
            {currentPage === 'linkedin-growth' && <LinkedInGrowthPage />}
            {currentPage === 'twitter-growth' && <TwitterGrowthPage />}
            {currentPage === 'analytics' && <AnalyticsPage />}
            {currentPage === 'templates' && <TemplatesPage />}
          </main>
        </div>
      </div>

      {/* Profile Setup Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="relative w-full max-w-2xl animate-fadeUp">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
              style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <X size={14} color="#64748b" />
            </button>
            <div className="mb-3 text-center">
              <p className="text-sm" style={{ color: '#6366f1' }}>👋 Welcome to LeadHawk! Set up your profile for personalized AI output.</p>
            </div>
            <ProfileSetup onClose={() => setShowProfileModal(false)} />
          </div>
        </div>
      )}
    </>
  );
}
