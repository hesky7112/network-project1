import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from '@/components/icons';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/api';
import { useMounted } from '@/hooks/use-mounted';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const mounted = useMounted();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await apiClient.forgotPassword(email);
      setSuccess(true);
      // Stay on success state for a while
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initialize recovery. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-black text-slate-400 flex items-center justify-center p-6 font-sans overflow-hidden">
        <Head>
          <title>Recovery Dispatched | Alien Net</title>
        </Head>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center mb-12 space-y-4">
            <Logo variant="auth" className="mb-6" />
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Handshake Initiated</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-alien-green">Check your secure comms channel</p>
          </div>

          <div className="bg-[#050505] border border-white/5 p-8 relative overflow-hidden text-center" style={{ borderRadius: '2px' }}>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-alien-green/50 to-transparent" />

            <p className="text-[11px] font-bold text-slate-400 mb-8 leading-relaxed">
              If an operator with the identity <span className="text-white">[{email}]</span> exists, safe recovery instructions have been dispatched.
            </p>

            <Button
              onClick={() => router.push('/login')}
              className="w-full bg-white text-black hover:bg-slate-200 h-12 font-black uppercase text-xs tracking-widest transition-all"
              style={{ borderRadius: '2px' }}
            >
              Return to Gateway
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-400 flex items-center justify-center p-6 font-sans overflow-hidden">
      <Head>
        <title>Identity Recovery | Alien Net</title>
      </Head>

      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10 space-y-4">
          <Logo variant="auth" className="mb-6" />
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">Identity_Recovery</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Restore Lost Access Key</p>
        </div>

        <div className="bg-[#050505] border border-white/5 p-8 relative overflow-hidden" style={{ borderRadius: '2px' }}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operator_Identifier</Label>
              <Input
                id="email"
                type="email"
                placeholder="OPERATOR_ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black border-white/10 text-white h-11 text-[11px] font-black uppercase focus:border-alien-green/30 focus:ring-0 transition-all placeholder:text-slate-700"
                style={{ borderRadius: '1.5px' }}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive" className="bg-cosmic-red/10 border-cosmic-red/20 text-cosmic-red py-3" style={{ borderRadius: '1px' }}>
                <AlertDescription className="text-[10px] font-black uppercase tracking-wide italic">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-slate-200 h-11 font-black uppercase text-[10px] tracking-widest transition-all"
              style={{ borderRadius: '1.5px' }}
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Request_Recovery'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2">
              <ArrowLeft className="w-3 h-3" /> Back_to_Portal
            </Link>
          </div>
        </div>

        <div className="mt-12 flex justify-between items-center px-4 opacity-30 grayscale underline animate-pulse">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase tracking-widest tracking-tighter">Auth_Server: Stable</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
