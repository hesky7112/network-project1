import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Shield, Lock } from '@/components/icons'
import { Logo } from '@/components/logo'
import { useAuth } from '@/hooks/use-auth'
import { useMounted } from '@/hooks/use-mounted'

export default function Login() {
  const router = useRouter()
  const { login } = useAuth()
  const mounted = useMounted()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Authorization failed. Check your access key.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#000000] text-slate-400 flex items-center justify-center p-6 font-sans overflow-hidden">
      <Head>
        <title>Access Gateway | Alien Net</title>
      </Head>

      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12 space-y-4">
          <Logo variant="auth" className="mb-6" />
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Access Gateway</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-alien-green">Initialize Outbound Connection</p>
        </div>

        <div className="bg-[#050505] border border-white/5 p-8 relative overflow-hidden" style={{ borderRadius: '2px' }}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-alien-green/30 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Operator ID (Email)</Label>
              <Input
                id="email"
                type="email"
                placeholder="operator@alien.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#000000] border-white/5 text-white h-12 text-sm focus:border-alien-green/50 focus:ring-1 focus:ring-alien-green/20 transition-all placeholder:text-slate-700"
                style={{ borderRadius: '2px' }}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Access Key</Label>
                <Link href="/forgot-password" title="Recover Access" className="text-[9px] font-bold uppercase tracking-widest text-alien-green hover:text-white transition-colors">
                  Recover Key
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#000000] border-white/5 text-white h-12 text-sm focus:border-alien-green/50 focus:ring-1 focus:ring-alien-green/20 transition-all placeholder:text-slate-700"
                style={{ borderRadius: '2px' }}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 py-3" style={{ borderRadius: '2px' }}>
                <AlertDescription className="text-[10px] font-bold uppercase tracking-wide">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-slate-200 h-12 font-black uppercase text-xs tracking-widest transition-all"
              style={{ borderRadius: '2px' }}
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Establish Connection'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              New Operator? <Link href="/register" className="text-alien-green hover:text-white transition-colors ml-2">Request Induction</Link>
            </p>
          </div>
        </div>

        <div className="mt-12 flex justify-between items-center px-4 grayscale opacity-30">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3" />
            <span className="text-[8px] font-mono uppercase tracking-widest">AES_256_ACTIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3" />
            <span className="text-[8px] font-mono uppercase tracking-widest">EDGE_POOL_READY</span>
          </div>
        </div>
      </motion.div>

      <div className="fixed bottom-6 right-6 border border-white/5 bg-[#050505] p-4 hidden md:block" style={{ borderRadius: '2px' }}>
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2">Technical Preview</p>
        <p className="text-[9px] font-mono text-alien-green/60 uppercase">UID: heskeyomondi@gmail.com</p>
        <p className="text-[9px] font-mono text-alien-green/60 uppercase">KEY: omondiAlienNet7112</p>
      </div>
    </div>
  )
}
