import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/layout';
import { Activity, Shield, Zap, Activity as ActivityIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { BlurReveal, StaggerList, StaggerItem, CountUp, GlassWrapper } from '@/components/ui/motion-container';

type SystemStats = {
    timestamp: string;
    goroutines: number;
    memory_usage: number;
    total_requests: number;
    active_requests: number;
    blocked_requests: number;
    rps: number;
};

export default function NeuralNexus() {
    const { isAuthenticated } = useAuth();
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [history, setHistory] = useState<number[]>(new Array(20).fill(0));
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) return;

        // Connect to WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = process.env.NEXT_PUBLIC_API_URL
            ? process.env.NEXT_PUBLIC_API_URL.replace(/^http/, 'ws')
            : `${protocol}//${window.location.hostname}:8080/api/v1`;

        const ws = new WebSocket(`${host}/nexus/stream`);

        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setStats(data);

                // Update history graph
                setHistory(prev => [...prev.slice(1), data.rps]);

            } catch (e) {
                console.error("Nexus Parse Error", e);
            }
        };

        return () => ws.close();
    }, [isAuthenticated]);

    // Orb Color Logic
    const getOrbColor = () => {
        if (!stats) return "bg-slate-500/20 border-slate-500/30";
        if (stats.rps > 100) return "bg-cosmic-red/20 border-cosmic-red/40 shadow-[0_0_50px_rgba(239,68,68,0.2)]";
        if (stats.rps > 50) return "bg-stardust-violet/20 border-stardust-violet/40 shadow-[0_0_50px_rgba(139,92,246,0.2)]";
        return "bg-earth-green/20 border-earth-green/40 shadow-[0_0_50px_rgba(34,211,238,0.2)]";
    };

    const getOrbPulse = () => {
        if (!stats) return 2;
        // Higher RPS = Faster Pulse
        return Math.max(0.2, 2 - (stats.rps / 50));
    };

    return (
        <Layout title="Neural_Nexus">
            <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-12 relative overflow-hidden">
                {/* Background Visual Flair */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-stardust-violet/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-earth-green/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />

                <BlurReveal>
                    <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                        {/* HUD Header */}
                        <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-32 h-[1px] bg-stardust-violet shadow-[0_0_15px_#6366f1]" />
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-stardust-violet/10 border border-stardust-violet/20 rounded-sm">
                                        <ActivityIcon className="h-8 w-8 text-stardust-violet" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                                            Neural_<span className="text-stardust-violet">Nexus</span>
                                        </h1>
                                        <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mt-2 italic">
                                            High-Priority Infrastructure Intelligence Unit
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8 px-8 py-4 bg-white/[0.02] border border-white/5 rounded-sm">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Signal_Status</span>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2",
                                            connected ? "text-earth-green" : "text-cosmic-red"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", connected ? "bg-earth-green animate-pulse" : "bg-cosmic-red")} />
                                            {connected ? "STABLE_STREAM" : "LOST_SIGNAL"}
                                        </span>
                                    </div>
                                    <div className="w-[1px] h-8 bg-white/5" />
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Core_Sync</span>
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest italic">99.998%</span>
                                    </div>
                                </div>
                            </div>
                        </GlassWrapper>

                        {/* Main Matrix Interface */}
                        <StaggerList className="grid grid-cols-12 gap-8">

                            {/* Throughput Matrix */}
                            <StaggerItem className="col-span-12 lg:col-span-3">
                                <GlassWrapper className="bg-[#0a0a0c] border-white/5 p-8 h-full rounded-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-earth-green/20 to-transparent" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-12 flex items-center gap-3 italic">
                                        <Activity className="w-4 h-4 text-earth-green" /> REAL-TIME_THROUGHPUT
                                    </h3>

                                    <div className="flex-1 flex flex-col justify-center py-8">
                                        <div className="text-7xl font-black tracking-tighter text-white mb-2 italic">
                                            <CountUp value={stats?.rps || 0} />
                                        </div>
                                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">Requests_Per_Sec</div>
                                    </div>

                                    <div className="mt-12 pt-8 border-t border-white/5 space-y-4">
                                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-500 italic">
                                            <span>Peak_Flux_Capacity</span>
                                            <span className="text-white">{Math.max(...history, stats?.rps || 0)} RPS</span>
                                        </div>
                                        <div className="w-full h-1 bg-white/[0.03] rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-earth-green shadow-[0_0_10px_#22d3ee]"
                                                animate={{ width: `${Math.min(((stats?.rps || 0) / 200) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </GlassWrapper>
                            </StaggerItem>

                            {/* The Neural Core */}
                            <StaggerItem className="col-span-12 lg:col-span-6 flex flex-col items-center justify-center relative min-h-[500px]">
                                <div className="relative w-96 h-96 flex items-center justify-center">
                                    {/* Orbital Mechanics */}
                                    <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin_40s_linear_infinite]" />
                                    <div className="absolute inset-10 rounded-full border border-white/[0.02] animate-[spin_60s_linear_infinite_reverse]" />
                                    <div className="absolute inset-20 rounded-full border border-stardust-violet/10 animate-[spin_30s_linear_infinite]" />

                                    {/* The Singularity */}
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.05, 1],
                                        }}
                                        transition={{ duration: getOrbPulse() * 2, repeat: Infinity, ease: "easeInOut" }}
                                        className={cn(
                                            "w-56 h-56 rounded-full flex items-center justify-center transition-all duration-1000 relative border-2 backdrop-blur-3xl",
                                            getOrbColor()
                                        )}
                                    >
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                                        <div className="text-center z-10 space-y-1">
                                            <div className="text-white font-black text-4xl tracking-tighter italic">
                                                {stats ? ((1 - (stats.blocked_requests / (stats.total_requests || 1))) * 100).toFixed(1) : "100"}%
                                            </div>
                                            <div className="text-[9px] text-white/50 font-black uppercase tracking-[0.3em] italic">Stability_Score</div>
                                        </div>
                                    </motion.div>

                                    {/* Perimeter Telemetry */}
                                    <div className="absolute -right-24 top-1/4 bg-white/[0.02] border border-white/5 p-5 rounded-sm backdrop-blur-md">
                                        <div className="text-3xl font-black text-white italic"><CountUp value={stats?.goroutines || 0} /></div>
                                        <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic">Active_Routines</div>
                                    </div>
                                    <div className="absolute -left-24 bottom-1/4 bg-white/[0.02] border border-white/5 p-5 rounded-sm backdrop-blur-md">
                                        <div className="text-3xl font-black text-white italic">
                                            <CountUp value={(stats?.memory_usage || 0) / 1024 / 1024 | 0} /> <span className="text-lg">MB</span>
                                        </div>
                                        <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic">Memory_Reserves</div>
                                    </div>
                                </div>

                                <div className="text-center mt-12 space-y-2">
                                    <h2 className="text-sm font-black text-white tracking-[0.5em] uppercase italic">Core_Vitality_Handshake</h2>
                                    <p className="text-[10px] text-earth-green font-black uppercase tracking-widest italic animate-pulse">Sub-Millisecond Synchronicity_Active</p>
                                </div>
                            </StaggerItem>

                            {/* Intelligence & Protection */}
                            <StaggerItem className="col-span-12 lg:col-span-3 space-y-8">
                                <GlassWrapper className="bg-[#0a0a0c] border-white/5 p-8 rounded-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-transparent via-stardust-violet/20 to-transparent" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-3 italic">
                                        <Shield className="w-4 h-4 text-stardust-violet" /> ACTIVE_PROTECTION
                                    </h3>

                                    <div className="flex justify-between items-baseline mb-6 py-4">
                                        <div className="text-5xl font-black text-white italic"><CountUp value={stats?.blocked_requests || 0} /></div>
                                        <div className="text-[10px] text-stardust-violet font-black uppercase tracking-[0.2em] italic text-right leading-none">THREATS<br />NEUTRALIZED</div>
                                    </div>
                                    <div className="w-full bg-white/[0.03] h-1.5 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-stardust-violet shadow-[0_0_10px_#8b5cf6]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((stats?.blocked_requests || 0) * 10, 100)}%` }}
                                            transition={{ duration: 1 }}
                                        />
                                    </div>
                                </GlassWrapper>

                                <GlassWrapper className="bg-[#0a0a0c] border-white/5 p-8 flex-1 rounded-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-transparent via-cosmic-red/20 to-transparent" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-3 italic">
                                        <Zap className="w-4 h-4 text-cosmic-red" /> NEURAL_LOGIC_OPTIMIZATION
                                    </h3>
                                    <div className="space-y-6">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex items-start gap-4 p-3 bg-white/[0.01] border border-white/5 rounded-sm group hover:border-cosmic-red/30 transition-colors">
                                                <div className="w-1.5 h-1.5 rounded-full bg-cosmic-red mt-1.5 group-hover:animate-ping" />
                                                <div className="space-y-1">
                                                    <div className="text-[10px] font-black text-white uppercase italic tracking-wider">Path_Layer #{100 + i} Handshake</div>
                                                    <div className="text-[9px] text-slate-600 font-black uppercase italic tracking-widest">Efficiency increased by 1.{i}%</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </GlassWrapper>
                            </StaggerItem>
                        </StaggerList>

                        {/* Historical Flux Terminal */}
                        <StaggerItem>
                            <GlassWrapper className="bg-[#0a0a0c] border-white/5 p-8 rounded-sm relative overflow-hidden">
                                <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                                    <div className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic">HISTORICAL_FLUX_ANALYSIS</div>
                                    <div className="text-[10px] text-slate-600 font-mono italic px-3 py-1 bg-white/[0.02] border border-white/5 rounded-sm">NODE_HASH: 0x8FA...E21</div>
                                </div>
                                <div className="flex items-end gap-2 h-20 w-full px-2">
                                    {history.map((val, i) => (
                                        <motion.div
                                            key={i}
                                            className="flex-1 bg-gradient-to-t from-stardust-violet/20 to-stardust-violet border-t border-stardust-violet/40"
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(5, Math.min(val * 8 + 5, 100))}%` }}
                                            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                                        />
                                    ))}
                                </div>
                            </GlassWrapper>
                        </StaggerItem>
                    </div>
                </BlurReveal>
            </div>
        </Layout>
    );
}

