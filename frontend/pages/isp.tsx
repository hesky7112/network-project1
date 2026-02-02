import { useState, useEffect } from 'react'
import Head from 'next/head'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Wifi,
    Globe,
    CheckCircle,
    AlertCircle,
    Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Layout from '@/components/layout'
import { apiClient } from '@/lib/api'
import { toast } from 'react-hot-toast'

interface Package {
    id: number
    name: string
    speed: string
    price: number
}

interface Subscription {
    id: number
    package_id: number
    name: string
    status: string
    expires_at: string
}

export default function ISPPortal() {
    const [packages, setPackages] = useState<Package[]>([])
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<number | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [pkgs, subs] = await Promise.all([
                apiClient.getISPPackages(),
                apiClient.getMySubscriptions()
            ])
            setPackages(pkgs)
            setSubscriptions(subs.subscriptions || [])
        } catch (err) {
            console.error('Failed to fetch ISP data:', err)
            toast.error('Failed to load ISP portal data')
        } finally {
            setLoading(false)
        }
    }

    const handleSubscribe = async (pkg: Package) => {
        setProcessingId(pkg.id)
        try {
            await apiClient.subscribeISP(pkg.id)
            toast.success(`Successfully subscribed to ${pkg.name}!`)
            fetchData() // Refresh data
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Subscription failed')
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-[80vh]">
                    <LoadingSpinner size="lg" />
                </div>
            </Layout>
        )
    }

    // Determine active subscription (if any)
    const activeSubscription = subscriptions.find(s => s.status === 'active')

    return (
        <Layout>
            <Head>
                <title>ISP Portal | Network Solutions</title>
            </Head>

            <div className="space-y-8 p-6 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                            <span className="text-alien-green">ISP</span> Subscriber Portal
                        </h1>
                        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest mt-2">
                            Manage your connection & bandwidth allocation
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded border border-white/10">
                        <Globe className="w-4 h-4 text-alien-green" />
                        <span className="text-xs font-mono text-white">
                            STATUS: <span className="text-alien-green">CONNECTED</span>
                        </span>
                    </div>
                </div>

                {/* Active Subscription Status */}
                <AnimatePresence mode="wait">
                    {activeSubscription ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full"
                        >
                            <Card className="bg-gradient-to-r from-alien-green/10 to-transparent border-alien-green/20">
                                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-alien-green/20 rounded-full">
                                            <Wifi className="w-8 h-8 text-alien-green" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white uppercase">{activeSubscription.name}</h3>
                                            <p className="text-alien-green font-mono text-sm">ACTIVE • EXPIRES {new Date(activeSubscription.expires_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-8 text-center">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-slate-500">Speed</p>
                                            <p className="text-xl font-black text-white">
                                                {packages.find(p => p.id === activeSubscription.package_id)?.speed || 'Unknown'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-slate-500">Latency</p>
                                            <p className="text-xl font-black text-white">~4ms</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <Alert className="bg-yellow-500/10 border-yellow-500/20 text-yellow-500">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>No Active Connection</AlertTitle>
                            <AlertDescription>
                                You are currently running on fallback connectivity. Subscribe to a package to unlock full speed.
                            </AlertDescription>
                        </Alert>
                    )}
                </AnimatePresence>

                {/* Packages Grid */}
                <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-alien-green" /> Available Upgrades
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {packages.map((pkg) => (
                            <motion.div
                                key={pkg.id}
                                whileHover={{ scale: 1.02 }}
                                className="relative group"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-b from-alien-green/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg blur-xl`} />
                                <Card className="bg-[#0A0A0A] border-white/10 h-full relative z-10 hover:border-alien-green/50 transition-colors">
                                    <CardHeader>
                                        <CardTitle className="text-white uppercase font-black tracking-wide text-lg">
                                            {pkg.name}
                                        </CardTitle>
                                        <CardDescription className="font-mono text-alien-green">
                                            {pkg.speed} // Low Latency
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="text-3xl font-black text-white">
                                            KES {pkg.price.toLocaleString()}
                                            <span className="text-sm font-normal text-slate-500 ml-1">/mo</span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <CheckCircle className="w-3 h-3 text-alien-green" />
                                                <span>Unlimited Data</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <CheckCircle className="w-3 h-3 text-alien-green" />
                                                <span>Public IP Address</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <CheckCircle className="w-3 h-3 text-alien-green" />
                                                <span>24/7 Priority Support</span>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => handleSubscribe(pkg)}
                                            disabled={processingId === pkg.id || activeSubscription?.package_id === pkg.id}
                                            className={`w-full font-bold uppercase tracking-widest ${activeSubscription?.package_id === pkg.id
                                                ? 'bg-white/10 text-white cursor-default'
                                                : 'bg-alien-green text-black hover:bg-green-400'
                                                }`}
                                        >
                                            {processingId === pkg.id ? (
                                                <LoadingSpinner size="sm" />
                                            ) : activeSubscription?.package_id === pkg.id ? (
                                                'Current Plan'
                                            ) : (
                                                'Upgrade Now'
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    )
}
