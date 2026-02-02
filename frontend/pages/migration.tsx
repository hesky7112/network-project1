import { useState, useRef } from 'react'
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
    Settings2,
    FileText,
    ShieldAlert
} from '@/components/icons'
import Layout from '@/components/layout'
import { cn } from '@/lib/utils'

const SOURCES = [
    { id: 'csv', name: 'Bulk CSV', icon: Upload, desc: 'Import from Excel or CSV spreadsheets' },
    { id: 'mikrotik', name: 'Mikrotik Import', icon: Network, desc: 'Sync via RouterOS API/User-Manager' },
    { id: 'radius', name: 'Radius Import', icon: Database, desc: 'Migrate from legacy Radius Manager' }
]

export default function Migration() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [step, setStep] = useState(1)
    const [selectedSource, setSelectedSource] = useState('')
    const [selectedResource, setSelectedResource] = useState('users')
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [results, setResults] = useState<any>(null)
    const [errorLog, setErrorLog] = useState<string>('')
    const [base64File, setBase64File] = useState<string>('')
    const [fileName, setFileName] = useState<string>('')

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result as string;
            if (result) {
                const base64 = result.split(',')[1];
                setBase64File(base64 || '');
            }
        }
        reader.readAsDataURL(file)
    }

    const startMigration = async () => {
        if (!base64File && selectedSource === 'csv') {
            alert('Please select a source file.')
            return
        }

        setIsProcessing(true)
        setProgress(0)
        setErrorLog('')

        try {
            const response = await fetch('http://localhost:8080/api/v1/migration/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    source_type: selectedSource,
                    config: {
                        data: base64File,
                        resource: selectedResource
                    }
                })
            });
            const { job_id } = await response.json();

            const pollInterval = setInterval(async () => {
                const statusRes = await fetch(`http://localhost:8080/api/v1/migration/status/${job_id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const statusData = await statusRes.json();

                setProgress(statusData.progress);
                setResults(statusData);
                setErrorLog(statusData.error_log || '');

                if (statusData.status === 'completed') {
                    clearInterval(pollInterval);
                    setIsProcessing(false);
                    setStep(3);
                } else if (statusData.status === 'failed') {
                    clearInterval(pollInterval);
                    setIsProcessing(false);
                }
            }, 800);
        } catch (error) {
            console.error('Migration error:', error);
            setIsProcessing(false);
            alert('Connection to Data Import lost.');
        }
    }

    return (
        <Layout title="Data Import">
            <div className="max-w-5xl mx-auto space-y-12 pb-20">
                <header className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-alien-green flex items-center justify-center shadow-[0_0_20px_rgba(0,255,65,0.4)]" style={{ borderRadius: '2px' }}>
                            <Zap className="w-6 h-6 text-black" />
                        </div>
                        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                            Data Import.
                        </h1>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                        Import users & equipment from legacy systems into the Network Solutions core.
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
                                        className="h-14 px-12 bg-alien-green text-black hover:bg-[#00dd38] text-[11px] font-black uppercase tracking-[0.3em] disabled:opacity-20 transition-all active:scale-95"
                                        style={{ borderRadius: '2px' }}
                                    >
                                        Configure Source <ArrowRight className="ml-3 w-4 h-4" />
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
                                className="space-y-8 p-10 border border-white/5 bg-[#0a0a0c]"
                                style={{ borderRadius: '2px' }}
                            >
                                <div className="flex justify-between items-center border-b border-white/5 pb-6">
                                    <div className="flex items-center gap-4">
                                        <Settings2 className="w-5 h-5 text-alien-green" />
                                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Source Configuration</h3>
                                    </div>
                                    <button onClick={() => setStep(1)} className="text-[9px] font-black text-slate-700 hover:text-white uppercase tracking-widest transition-colors">Change Source</button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Import Target</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => setSelectedResource('users')}
                                                    className={cn(
                                                        "h-14 border text-[10px] font-black uppercase tracking-widest transition-all",
                                                        selectedResource === 'users' ? "border-alien-green text-alien-green bg-alien-green/5" : "border-white/5 text-slate-600"
                                                    )}
                                                >
                                                    Subscribers
                                                </button>
                                                <button
                                                    onClick={() => setSelectedResource('devices')}
                                                    className={cn(
                                                        "h-14 border text-[10px] font-black uppercase tracking-widest transition-all",
                                                        selectedResource === 'devices' ? "border-alien-green text-alien-green bg-alien-green/5" : "border-white/5 text-slate-600"
                                                    )}
                                                >
                                                    Network Devices
                                                </button>
                                            </div>
                                        </div>

                                        {selectedSource === 'csv' ? (
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">CSV File Upload</label>
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={cn(
                                                        "w-full h-32 border border-dashed border-white/10 flex flex-col items-center justify-center p-6 cursor-pointer hover:border-alien-green/30 transition-all bg-black/40",
                                                        fileName && "border-alien-green/30 bg-alien-green/5"
                                                    )}
                                                >
                                                    <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                                                    {fileName ? (
                                                        <>
                                                            <FileText className="w-6 h-6 text-alien-green mb-2" />
                                                            <span className="text-[10px] font-black text-white uppercase italic">{fileName}</span>
                                                            <span className="text-[8px] text-slate-600 font-bold uppercase mt-1">File Selected & Validated</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-6 h-6 text-slate-700 mb-2" />
                                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Select CSV File</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Protocol Endpoint</label>
                                                    <input placeholder="192.168.88.1" className="w-full bg-[#000000] border border-white/10 h-12 px-4 text-[12px] font-bold text-white focus:outline-none focus:border-alien-green/30" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Administrator Credentials</label>
                                                    <input placeholder="admin_legacy" className="w-full bg-[#000000] border border-white/10 h-12 px-4 text-[12px] font-bold text-white focus:outline-none focus:border-alien-green/30" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-8 bg-black/40 border border-white/5 space-y-6 flex flex-col justify-between">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 italic">Validation Rules</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase bg-yellow-500/5 p-4 border-l border-yellow-500/20 italic">
                                                {selectedResource === 'users'
                                                    ? "Required Fields: username, email, password. Optional: role."
                                                    : "Required Fields: ip_address, hostname. Optional: vendor, device_type."}
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest italic">
                                                <span className="text-slate-700">Data Security</span>
                                                <span className="text-alien-green">AES-256 Verified</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest italic">
                                                <span className="text-slate-700">Auto Suspend Sync</span>
                                                <span className="text-red-500">Disabled</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-white/5 flex flex-col gap-6">
                                    <Button
                                        onClick={startMigration}
                                        disabled={isProcessing || (!base64File && selectedSource === 'csv')}
                                        className="h-16 w-full bg-alien-green text-black hover:bg-[#00dd38] text-[12px] font-black uppercase tracking-[0.4em] relative overflow-hidden disabled:bg-slate-900 group"
                                        style={{ borderRadius: '2px' }}
                                    >
                                        {isProcessing ? (
                                            <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                                                <div className="h-full bg-alien-green/20 absolute left-0 transition-all duration-300" style={{ width: `${progress}%` }} />
                                                <span className="relative z-10 animate-pulse">Importing Data_{progress}%</span>
                                            </div>
                                        ) : (
                                            "Start Import"
                                        )}
                                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Zap className="w-4 h-4" />
                                        </div>
                                    </Button>

                                    {/* Real-time Telemetry */}
                                    {isProcessing && (
                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="p-4 bg-white/5 border border-white/5 space-y-2">
                                                <div className="text-[8px] font-black text-slate-600 uppercase italic">Identified</div>
                                                <div className="text-xl font-black text-white italic tracking-tighter">{results?.total || 0}</div>
                                            </div>
                                            <div className="p-4 bg-alien-green/5 border border-alien-green/20 space-y-2">
                                                <div className="text-[8px] font-black text-alien-green/60 uppercase italic">Success</div>
                                                <div className="text-xl font-black text-alien-green italic tracking-tighter">{results?.success_count || 0}</div>
                                            </div>
                                            <div className="p-4 bg-red-500/5 border border-red-500/20 space-y-2">
                                                <div className="text-[8px] font-black text-red-500/60 uppercase italic">Failures</div>
                                                <div className="text-xl font-black text-red-500 italic tracking-tighter">{results?.failure_count || 0}</div>
                                            </div>
                                        </div>
                                    )}

                                    {errorLog && (
                                        <div className="p-6 bg-slate-950/80 border border-white/5 space-y-3">
                                            <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                <ShieldAlert className="w-3 h-3 text-red-500" /> Error Logs
                                            </div>
                                            <pre className="text-[10px] font-mono text-red-400/80 max-h-32 overflow-y-auto custom-scrollbar">
                                                {errorLog}
                                            </pre>
                                        </div>
                                    )}
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
                                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Import Complete</h2>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] max-w-md mx-auto italic">
                                        Successfully imported **{results?.success_count}** {selectedResource === 'users' ? 'Users' : 'Devices'}. {results?.failure_count > 0 && `Encountered ${results?.failure_count} duplicate records.`}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-4 border-y border-white/5 py-8">
                                    <div className="space-y-1">
                                        <div className="text-[14px] font-black text-white italic uppercase tracking-tighter">{results?.total}</div>
                                        <div className="text-[8px] font-black text-slate-700 uppercase italic">Identified</div>
                                    </div>
                                    <div className="space-y-1 border-x border-white/5">
                                        <div className="text-[14px] font-black text-alien-green italic uppercase tracking-tighter">{results?.success_count}</div>
                                        <div className="text-[8px] font-black text-slate-700 uppercase italic">Authenticated</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[14px] font-black text-red-500 italic uppercase tracking-tighter">{results?.failure_count}</div>
                                        <div className="text-[8px] font-black text-slate-700 uppercase italic">Duplicates</div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <Button
                                        onClick={() => router.push('/dashboard')}
                                        variant="outline"
                                        className="flex-1 h-14 border-white/10 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 hover:border-white/20 transition-all italic"
                                    >
                                        Control_Center
                                    </Button>
                                    <Button
                                        onClick={() => router.push(selectedResource === 'users' ? '/admin/users' : '/devices')}
                                        className="flex-1 h-14 bg-alien-green text-black hover:bg-[#00dd38] text-[10px] font-black uppercase tracking-[0.2em] transition-all italic"
                                    >
                                        View User Registry
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
