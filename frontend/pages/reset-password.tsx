import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordStrength } from '@/components/ui/password-strength';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Shield, ArrowLeft } from '@/components/icons';
import { Logo } from '@/components/logo';
import { apiClient } from '@/lib/api';
import { useMounted } from '@/hooks/use-mounted';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const mounted = useMounted();

  useEffect(() => {
    if (router.isReady) {
      const { token: urlToken } = router.query;
      if (urlToken && typeof urlToken === 'string') {
        setToken(urlToken);
      } else {
        setError('Missing recovery token. Unauthorized access detected.');
      }
    }
  }, [router.query, router.isReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Neural mismatch: Passwords do not align.');
      return;
    }

    if (password.length < 8) {
      setError('Insecure key: Minimum 8 characters required.');
      return;
    }

    if (!token) {
      setError('Authentication failure: Token missing.');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.resetPassword(token, password);
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Handshake failed. Token may be expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black text-slate-400 flex items-center justify-center p-6 font-sans overflow-hidden">
        <Head>
          <title>Access Restored | Alien Net</title>
        </Head>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center mb-12 space-y-4">
            <div className="w-16 h-16 bg-alien-green/5 border border-alien-green/20 mx-auto flex items-center justify-center mb-6" style={{ borderRadius: '2px' }}>
              <Shield className="h-8 w-8 text-alien-green animate-pulse" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Access Restored</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-alien-green">Neural identity synchronized</p>
          </div>

          <div className="bg-[#050505] border border-white/5 p-8 relative overflow-hidden text-center" style={{ borderRadius: '2px' }}>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-alien-green/50 to-transparent" />
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-6">Redirecting_to_Portal...</p>
            <div className="w-full h-1 bg-white/5 overflow-hidden" style={{ borderRadius: '1px' }}>
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3 }}
                className="h-full bg-alien-green"
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-400 flex items-center justify-center p-6 font-sans overflow-hidden">
      <Head>
        <title>Finalize Recovery | Alien Net</title>
      </Head>

      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10 space-y-4">
          <Logo variant="auth" className="mb-6" />
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">Finalize_Recovery</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Inject New Access Credentials</p>
        </div>

        <div className="bg-[#050505] border border-white/5 p-8 relative overflow-hidden" style={{ borderRadius: '2px' }}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-cosmic-red/10 border-cosmic-red/20 text-cosmic-red py-3" style={{ borderRadius: '1px' }}>
                <AlertDescription className="text-[10px] font-black uppercase tracking-wide italic">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-500">New_Access_Key</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black border-white/10 text-white h-11 text-sm focus:border-white/30 focus:ring-0 transition-all placeholder:text-slate-700"
                style={{ borderRadius: '1.5px' }}
                required
              />
              <PasswordStrength password={password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Verify_Access_Key</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-black border-white/10 text-white h-11 text-sm focus:border-white/30 focus:ring-0 transition-all placeholder:text-slate-700"
                style={{ borderRadius: '1.5px' }}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-slate-200 h-11 font-black uppercase text-[10px] tracking-widest transition-all"
              style={{ borderRadius: '1.5px' }}
              disabled={isLoading || !token}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Override_Global_Auth'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2">
              <ArrowLeft className="w-3 h-3" /> Abort_Handshake
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
