import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, session } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (session) {
    if (typeof window !== 'undefined') router.replace('/');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Enter email and password');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        toast.success('Welcome back!');
        router.replace('/');
      } else {
        await signUp(email, password);
        toast.success('Account created — check your email if confirmation is required.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Auth failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ background: '#F2EBDD' }}>
      <div className="glass-card p-6 sm:p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: '#0F3B47', fontFamily: 'Syne' }}>
          LeadHawk
        </h1>
        <p className="text-sm mb-6" style={{ color: '#6E7F86' }}>
          {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
              Email
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="#6E7F86" />
              <input
                type="email"
                className="input-field text-sm pl-9 w-full"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
              Password
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="#6E7F86" />
              <input
                type="password"
                className="input-field text-sm pl-9 w-full"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 w-full justify-center">
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <LogIn size={15} />
            )}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="mt-4 text-xs w-full text-center"
          style={{ color: '#1E6F70' }}
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
