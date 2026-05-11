import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/lib/auth';
import '@/styles/globals.css';

const PUBLIC_ROUTES = ['/login'];

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading, enabled } = useAuth();
  const router = useRouter();
  const isPublic = PUBLIC_ROUTES.includes(router.pathname);

  useEffect(() => {
    if (loading) return;
    // Phase 8: when Supabase isn't configured, the app runs in
    // localStorage-only mode — no login wall, no redirect.
    if (!enabled) return;
    if (!session && !isPublic) router.replace('/login');
  }, [loading, session, isPublic, enabled, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2EBDD' }}>
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: '#3A8FA3', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  // localStorage-only mode → never gate
  if (!enabled) return <>{children}</>;
  if (!session && !isPublic) return null;
  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <AuthGate>
        <Component {...pageProps} />
      </AuthGate>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            color: '#0F3B47',
            border: '1px solid #D6CCB6',
            borderRadius: '14px',
            fontSize: '13px',
            fontFamily: 'DM Sans, sans-serif',
            boxShadow: '0 12px 32px -14px rgba(15,59,71,0.28)',
          },
          success: {
            iconTheme: { primary: '#1E6F70', secondary: '#FFFFFF' },
          },
          error: {
            iconTheme: { primary: '#B0432A', secondary: '#FFFFFF' },
          },
        }}
      />
    </AuthProvider>
  );
}
