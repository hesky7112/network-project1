import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    Zap,
    Cpu,
    Globe,
    Database,
    Shield,
    Terminal,
    Layers,
    Activity,
    Lock,
    ArrowRight,
    Github,
    Code
} from '@/components/icons';

const TECH_ITEMS = [
    {
        category: "Frontend_Orchestration",
        items: [
            { name: "Next.js 14", icon: Globe, status: "Optimized", color: "text-white" },
            { name: "React 18", icon: Activity, status: "Stable", color: "text-blue-400" },
            { name: "Framer Motion", icon: Zap, status: "Vibrant", color: "text-purple-400" },
            { name: "Tailwind CSS", icon: Code, status: "Clean", color: "text-cyan-400" }
        ]
    },
    {
        category: "Backend_Intelligence",
        items: [
            { name: "Python (FastAPI)", icon: Cpu, status: "Robust", color: "text-yellow-400" },
            { name: "Go (NATS)", icon: Layers, status: "High-Concurrency", color: "text-blue-500" },
            { name: "eBPF Packet Filter", icon: Shield, status: "Kernel-Level", color: "text-alien-green" },
            { name: "gRPC Protocols", icon: Terminal, status: "Low-Latency", color: "text-indigo-400" }
        ]
    },
    {
        category: "Data_Persistence",
        items: [
            { name: "PostgreSQL", icon: Database, status: "Standard", color: "text-blue-300" },
            { name: "Redis Cache", icon: Zap, status: "Transient", color: "text-red-400" },
            { name: "InfluxDB (TS)", icon: Activity, status: "Temporal", color: "text-emerald-400" }
        ]
    }
];

export default function TechStack() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#000000] text-slate-400 selection:bg-alien-green/30 selection:text-alien-green font-sans uppercase">
            <Head>
                <title>Tech_Stack // Alien Net Architecture</title>
                <meta name="description" content="Technical specifications and internal architecture of the Alien Net system." />
            </Head>

            {/* Technical Grid Overlay */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#000000]/80 backdrop-blur-md">
                <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
                        <div className="w-8 h-8 bg-alien-green flex items-center justify-center shadow-[0_0_15px_rgba(0,255,65,0.3)]" style={{ borderRadius: '2px' }}>
                            <Zap className="w-5 h-5 text-black" />
                        </div>
                        <span className="text-xl font-bold tracking-tighter text-white uppercase">Alien Net</span>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/')}
                        className="border-white/10 text-[9px] font-black uppercase tracking-widest h-10 px-6 hover:bg-white/5"
                    >
                        Back_to_Home
                    </Button>
                </nav>
            </header>

            <main className="relative z-10 pt-48 pb-32 max-w-7xl mx-auto px-6">
                <div className="space-y-4 mb-24">
                    <div className="inline-flex items-center gap-3 border-l-2 border-alien-green bg-alien-green/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.4em] text-alien-green">
                        System_Specifications_v4.2.0
                    </div>
                    <h1 className="text-6xl lg:text-8xl font-black text-white tracking-tighter leading-none uppercase">
                        The Core <br />
                        <span className="text-alien-green">Architecture.</span>
                    </h1>
                    <p className="text-slate-500 font-bold max-w-2xl text-lg uppercase tracking-tight leading-relaxed">
                        A distributed, multi-tenant orchestration layer built for extreme concurrency and zero-trust security.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {TECH_ITEMS.map((section, idx) => (
                        <div key={idx} className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 pl-4 border-l border-white/10">
                                {section.category}
                            </h4>
                            <div className="space-y-2">
                                {section.items.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ x: 6 }}
                                        className="p-6 bg-[#050505] border border-white/5 flex items-center justify-between group cursor-default"
                                        style={{ borderRadius: '2px' }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 bg-white/5 rounded-full ${item.color}`}>
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-sm font-black text-white tracking-widest uppercase">{item.name}</div>
                                                <div className="text-[9px] font-mono text-slate-600 tracking-widest uppercase">{item.status}</div>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-3 h-3 text-slate-800 group-hover:text-alien-green transition-colors" />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-32 p-12 border border-white/5 bg-[#050505] relative overflow-hidden" style={{ borderRadius: '4px' }}>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-alien-green/5 blur-[120px] pointer-events-none" />
                    <div className="max-w-3xl space-y-8 relative">
                        <div className="flex items-center gap-4 text-alien-green">
                            <Lock className="w-6 h-6" />
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Zero_Trust_Protocol</h3>
                        </div>
                        <p className="text-slate-400 font-bold leading-relaxed uppercase tracking-tight">
                            Every interaction between frontend, API, and the orchestration core is cryptographically signed and verified. We leverage eBPF at the kernel level to ensure traffic isolation across all client nodes.
                        </p>
                        <div className="flex gap-6">
                            <Button className="bg-alien-green text-black hover:bg-[#00dd38] text-[10px] font-black uppercase tracking-widest px-8 h-12">View_Source_Protocol</Button>
                            <Button variant="ghost" className="text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 px-8 h-12 flex items-center gap-2">
                                <Github className="w-4 h-4" /> Documentation
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-20 border-t border-white/5 text-center">
                <span className="text-[9px] font-mono text-slate-800 uppercase tracking-[0.6em]">© 2026 ALIEN_NET_ARCHITECTURE_GROUP</span>
            </footer>
        </div>
    );
}
