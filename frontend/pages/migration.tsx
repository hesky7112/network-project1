import { useState } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
    Zap,
    Upload,
    Network,
    Database,
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Settings2
} from '@/components/icons'
import Layout from '@/components/layout'
import { cn } from '@/lib/utils'

const SOURCES = [
    { id: 'csv', name: 'Bulk_CSV', icon: Upload, desc: 'Import from Excel or CSV spreadsheets' },
    { id: 'mikrotik', name: 'Mikrotik_Ingest', icon: Network, desc: 'Sync via RouterOS API/User-Manager' },
    { id: 'radius', name: 'Radius_Relay', icon: Database, desc: 'Migrate from legacy Radius Manager' }
]

export default function Migration() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [selectedSource, setSelectedSource] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)

    const startMigration = async () => {
        setIsProcessing(true)
        setProgress(0)

        try {
            // Initiate migration on Go backend (Port 8080)
            const response = await fetch('http://localhost:8080/api/v1/migration/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Include auth
                },
                body: JSON.stringify({
                    source_type: selectedSource,
                    config: {}
                })
            });
            const { job_id } = await response.json();

            // Poll for status
            const pollInterval = setInterval(async () => {
                const statusRes = await fetch(`http://localhost:8080/api/v1/migration/status/${job_id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const statusData = await statusRes.json();

                setProgress(statusData.progress);

                if (statusData.status === 'completed') {
                    clearInterval(pollInterval);
                    setIsProcessing(false);
                    setStep(3);
                } else if (statusData.status === 'failed') {
                    clearInterval(pollInterval);
                    setIsProcessing(false);
                    alert('Migration Failed: Check operator logs.');
                }
            }, 500);
        } catch (error) {
            console.error('Migration error:', error);
            setIsProcessing(false);
            alert('Connection to Migration Catalyst lost.');
        }
    }

    return (
        <Layout title="Migration Catalyst">
            <div className="max-w-5xl mx-auto space-y-12">
                <header className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-alien-green flex items-center justify-center shadow-[0_0_20px_rgba(0,255,65,0.4)]" style={{ borderRadius: '2px' }}>
                            <Zap className="w-6 h-6 text-black" />
                        </div>
                        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                            Migration_Catalyst.
                        </h1>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                        Ingest subscribers from legacy systems into the Alien Net core.
                    </p>
                </header>

                <div className="relative">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.section
                                key="step1"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid md:grid-cols-3 gap-6"
                            >
                                {SOURCES.map(source => (
                                    <button
                                        key={source.id}
                                        onClick={() => setSelectedSource(source.id)}
                                        className={cn(
                                            "p-8 border bg-[#050505] text-left space-y-6 transition-all group",
                                            selectedSource === source.id ? "border-alien-green shadow-[0_0_30px_rgba(0,255,65,0.1)]" : "border-white/5 hover:border-white/10"
                                        )}
                                        style={{ borderRadius: '2px' }}
                                    >
                                        <source.icon className={cn(
                                            "w-10 h-10 transition-colors",
                                            selectedSource === source.id ? "text-alien-green" : "text-slate-700 group-hover:text-slate-500"
                                        )} />
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">{source.name}</h3>
                                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{source.desc}</p>
                                        </div>
                                    </button>
                                ))}

                                <div className="md:col-span-3 pt-6 flex justify-end">
                                    <Button
                                        disabled={!selectedSource}
                                        onClick={() => setStep(2)}
                                        className="h-14 px-12 bg-alien-green text-black hover:bg-[#00dd38] text-[11px] font-black uppercase tracking-[0.3em] disabled:opacity-20"
                                        style={{ borderRadius: '2px' }}
                                    >
                                        Configure_Source <ArrowRight className="ml-3 w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.section>
                        )}

                        {step === 2 && (
                            <motion.section
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8 p-10 border border-white/5 bg-[#050505]"
                                style={{ borderRadius: '2px' }}
                            >
                                <div className="flex justify-between items-center border-b border-white/5 pb-6">
                                    <div className="flex items-center gap-4">
                                        <Settings2 className="w-5 h-5 text-alien-green" />
                                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Source_Configuration</h3>
                                    </div>
                                    <button onClick={() => setStep(1)} className="text-[9px] font-black text-slate-700 hover:text-white uppercase tracking-widest">Change_Source</button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Protocol_Endpoint</label>
                                            <input placeholder="192.168.88.1" className="w-full bg-[#000000] border border-white/10 h-12 px-4 text-[12px] font-bold text-white focus:outline-none focus:border-alien-green/30" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Operator_Credential</label>
                                            <input placeholder="admin_legacy" className="w-full bg-[#000000] border border-white/10 h-12 px-4 text-[12px] font-bold text-white focus:outline-none focus:border-alien-green/30" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Access_Token</label>
                                            <input type="password" placeholder="••••••••" className="w-full bg-[#000000] border border-white/10 h-12 px-4 text-[12px] font-bold text-white focus:outline-none focus:border-alien-green/30" />
                                        </div>
                                    </div>

                                    <div className="p-8 bg-[#000000] border border-white/5 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest text-yellow-500">Validation_Alert</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase bg-yellow-500/5 p-4 border-l border-yellow-500/20">
                                            Ensure the API service is enabled on the target Mikrotik router (IP &gt; Services &gt; api). Default port 8728 must be reachable.
                                        </p>
                                        <div className="pt-4 space-y-3">
                                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                                                <span className="text-slate-700">Payload_Safety</span>
                                                <span className="text-alien-green">AES-256 Verified</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                                                <span className="text-slate-700">Auto_Suspend_Sync</span>
                                                <span className="text-red-500">Disabled</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-white/5 flex gap-4">
                                    <Button
                                        onClick={startMigration}
                                        disabled={isProcessing}
                                        className="h-16 flex-1 bg-alien-green text-black hover:bg-[#00dd38] text-[12px] font-black uppercase tracking-[0.4em] relative overflow-hidden disabled:bg-slate-900"
                                        style={{ borderRadius: '2px' }}
                                    >
                                        {isProcessing ? (
                                            <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                                                <div className="h-full bg-white/20 absolute left-0" style={{ width: `${progress}%` }} />
                                                <span className="relative z-10">Ingesting_Clients_{progress}%</span>
                                            </div>
                                        ) : (
                                            "Initiate_Ingestion_Pulse"
                                        )}
                                    </Button>
                                </div>
                            </motion.section>
                        )}

                        {step === 3 && (
                            <motion.section
                                key="step3"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="p-12 border border-alien-green/20 bg-alien-green/5 text-center space-y-8 shadow-[0_0_50px_rgba(0,255,65,0.05)]"
                                style={{ borderRadius: '4px' }}
                            >
                                <div className="w-20 h-20 bg-alien-green mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(0,255,65,0.4)]" style={{ borderRadius: '1px' }}>
                                    <CheckCircle2 className="w-10 h-10 text-black" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Catalysis_Complete</h2>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] max-w-md mx-auto">
                                        Successfully migrated **1,242** subscribers. All profiles assigned to the **Pro_Core** access matrix.
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-4 border-y border-white/5 py-8">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-white italic uppercase tracking-tighter">892</div>
                                        <div className="text-[8px] font-black text-slate-700 uppercase">PPPoE_Direct</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-white italic uppercase tracking-tighter">350</div>
                                        <div className="text-[8px] font-black text-slate-700 uppercase">Hotspot_Keys</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-white italic uppercase tracking-tighter">0</div>
                                        <div className="text-[8px] font-black text-slate-700 uppercase">Collisions_Resolved</div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <Button
                                        onClick={() => router.push('/dashboard')}
                                        variant="outline"
                                        className="flex-1 h-14 border-white/10 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5"
                                    >
                                        Control_Center
                                    </Button>
                                    <Button
                                        className="flex-1 h-14 bg-alien-green text-black hover:bg-[#00dd38] text-[10px] font-black uppercase tracking-[0.2em]"
                                    >
                                        View_Subscriber_Registry
                                    </Button>
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>
                </div>

                {/* Technical Grid Overlay */}
                <div className="fixed inset-0 pointer-events-none z-0 opacity-10">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px]" />
                </div>
            </div>
        </Layout>
    )
}
