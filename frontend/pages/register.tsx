import { useState } from 'react';
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
import { Activity, UserPlus } from '@/components/icons';
import { Logo } from '@/components/logo';
import { apiClient } from '@/lib/api';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await apiClient.register(formData);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Check your parameters.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#000000] text-slate-400 flex items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 max-w-sm"
        >
          <Logo variant="auth" className="mb-6" />
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Registration Successful</h2>
            <p className="text-sm text-slate-500 font-medium">Your credentials have been synchronized. Redirecting to login portal...</p>
          </div>
          <div className="h-1 bg-white/5 w-full mx-auto" style={{ borderRadius: '2px' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 3 }}
              className="h-full bg-alien-green shadow-[0_0_10px_rgba(0,255,65,0.5)]"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-slate-400 flex items-center justify-center p-6 font-sans py-20">
      <Head>
        <title>Registration Center | Alien Net</title>
      </Head>

      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-12 space-y-4">
          <Logo variant="auth" className="mb-6" />
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Registration Center</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-alien-green">Register System Administrator</p>
        </div>

        <div className="bg-[#050505] border border-white/5 p-8 relative overflow-hidden" style={{ borderRadius: '2px' }}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-alien-green/30 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Callsign (Username)</Label>
              <Input
                id="username"
                type="text"
                placeholder="operator_zero"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="bg-[#000000] border-white/5 text-white h-12 text-sm focus:border-alien-green/50 focus:ring-1 focus:ring-alien-green/20 placeholder:text-slate-700"
                style={{ borderRadius: '2px' }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Primary ID (Email)</Label>
              <Input
                id="email"
                type="email"
                placeholder="operator@alien.net"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-[#000000] border-white/5 text-white h-12 text-sm focus:border-alien-green/50 focus:ring-1 focus:ring-alien-green/20 placeholder:text-slate-700"
                style={{ borderRadius: '2px' }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Access Key</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-[#000000] border-white/5 text-white h-12 text-sm focus:border-alien-green/50 focus:ring-1 focus:ring-alien-green/20 placeholder:text-slate-700"
                style={{ borderRadius: '2px' }}
                required
              />
              <div className="pt-2">
                <PasswordStrength password={formData.password} />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 py-3" style={{ borderRadius: '2px' }}>
                <AlertDescription className="text-[10px] font-bold uppercase tracking-wide">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-alien-green text-black hover:bg-[#00dd38] h-12 font-black uppercase text-xs tracking-widest transition-all"
              style={{ borderRadius: '2px' }}
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Register Identification'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              Existing user? <Link href="/login" className="text-alien-green hover:text-white transition-colors ml-2">Access Portal</Link>
            </p>
          </div>
        </div>

        <div className="mt-12 flex justify-center gap-8 grayscale opacity-20">
          <div className="flex items-center gap-2">
            <UserPlus className="w-3 h-3" />
            <span className="text-[8px] font-mono uppercase tracking-widest">ID_GEN_01</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3" />
            <span className="text-[8px] font-mono uppercase tracking-widest">SYNC_ACTIVE</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
