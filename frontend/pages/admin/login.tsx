import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Shield, Lock, Activity } from '@/components/icons'
import { useAuth } from '@/hooks/use-auth'
import { useMounted } from '@/hooks/use-mounted'

export default function AdminLogin() {
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
            // On success, redirect to the main dashboard as requested
            router.push('/dashboard')
        } catch (err: any) {
            setError(err?.message || 'Access Denied: Neural handshake failed.')
        } finally {
            setIsLoading(false)
        }
    }

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-oled-black text-slate-400 flex items-center justify-center p-6 font-sans overflow-hidden">
            <Head>
                <title>Admin Protocol | Alien Net</title>
            </Head>

            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none opacity-5">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:32px_32px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-10 space-y-3">
                    <div className="w-16 h-16 bg-white/[0.03] border border-white/10 mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.02)]" style={{ borderRadius: '4px' }}>
                        <Shield className="h-8 w-8 text-stardust-violet" />
                    </div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">Admin_Protocol</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stardust-violet">Restricted Multi-Vendor Core</p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-8 relative overflow-hidden" style={{ borderRadius: '2px' }}>
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-stardust-violet/50 to-transparent" />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Command_Identifier</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="ADMIN_ID"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-black border-white/10 text-white h-11 text-[11px] font-black uppercase focus:border-stardust-violet/30 focus:ring-0 transition-all placeholder:text-slate-700"
                                style={{ borderRadius: '1.5px' }}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-0.5">
                                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Neural_Auth_Key</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-black border-white/10 text-white h-11 text-sm focus:border-stardust-violet/30 focus:ring-0 transition-all placeholder:text-slate-700"
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
                            className="w-full bg-stardust-violet text-black hover:opacity-90 h-11 font-black uppercase text-[10px] tracking-widest transition-all shadow-[0_0_20px_rgba(138,43,226,0.1)]"
                            style={{ borderRadius: '1.5px' }}
                            disabled={isLoading}
                        >
                            {isLoading ? <LoadingSpinner size="sm" /> : 'Authorize_Session'}
                        </Button>
                    </form>
                </div>

                <div className="mt-12 flex justify-between items-center px-4 opacity-20 hover:opacity-100 transition-opacity duration-500">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-stardust-violet" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Sys_Status: 100%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Lock className="w-3 h-3 text-stardust-violet" />
                        <span className="text-[8px] font-black uppercase tracking-widest">TLS_1.3_ENCRYPTED</span>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
