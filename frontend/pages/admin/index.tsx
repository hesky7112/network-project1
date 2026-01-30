"use client"

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/layout';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    Activity,
    Users,
    Shield,
    Terminal as TerminalIcon,
    Map as MapIcon,
    Settings,
    Zap,
    Cpu,
    Globe,
    Layers,
    Search,
    ChevronRight,
    AlertTriangle,
    Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    BlurReveal,
    GlassWrapper,
    StaggerList,
    StaggerItem,
    CountUp,
    SoftLift
} from '@/components/ui/motion-container';
import Link from 'next/link';

// Dynamically import heavy/client-only modules
const NetworkMap = dynamic(() => import('@/components/visualizations/NetworkMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-black/40 animate-pulse rounded-2xl border border-white/5 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-600">Initializing_Spatial_Layers...</div>
});

const WebTerminal = dynamic(() => import('@/components/visualizations/WebTerminal').then(mod => ({ default: mod.WebTerminal })), {
    ssr: false,
    loading: () => <div className="h-48 w-full bg-[#1e1e1e] rounded-sm animate-pulse border border-white/5" />
});

const SparklineGrid = dynamic(() => import('@/components/visualizations/SparklineGrid').then(mod => ({ default: mod.SparklineGrid })), {
    ssr: false,
    loading: () => <div className="h-48 w-full bg-black/20 rounded-sm animate-pulse border border-white/5" />
});

export default function AdminCommandCenter() {
    const { isAuthenticated } = useAuth();
    const [devices, setDevices] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any[]>([]);
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchData = async () => {
            try {
                const [devicesRes, usersRes, metricsRes, healthRes] = await Promise.all([
                    apiClient.getDevices(),
                    apiClient.getUsers(),
                    apiClient.getLiveMetrics(),
                    apiClient.getLatestHealthAnalysis().catch(() => null) // Handle 404/Empty gracefully
                ]);

                // Map devices to NetworkMap format
                setDevices(devicesRes.map((d: any) => ({
                    id: d.id,
                    name: d.hostname || `NODE_${d.id}`,
                    model: d.vendor || 'Unknown',
                    ip_address: d.ip_address,
                    lat: d.latitude || -1.286389 + (Math.random() * 0.05), // Fallback or jitter if 0
                    lng: d.longitude || 36.817223 + (Math.random() * 0.05)
                })));

                // Map users to map user markers
                setUsers(usersRes.map((u: any) => ({
                    id: u.id,
                    username: u.username,
                    service_type: u.role === 'admin' ? 'enterprise' : 'hotspot',
                    lat: -1.286389 + (Math.random() * 0.05), // Mock user location
                    lng: 36.817223 + (Math.random() * 0.05)
                })));

                setMetrics(metricsRes);
                setHealth(healthRes);
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    // Calculate Average Stats
    const activeNodes = devices.length;
    const avgCpu = metrics.filter((m: any) => m.metric === 'cpu_usage').reduce((acc: number, curr: any) => acc + curr.value, 0) / (metrics.filter((m: any) => m.metric === 'cpu_usage').length || 1);

    // System Integrity from Health Analysis Score (0-100) or fallback
    const systemIntegrity = health?.score ? health.score : (activeNodes > 0 ? 98.2 : 0);

    const stats = [
        { label: "Network_Capacity", value: activeNodes > 0 ? 100 - (avgCpu || 10) : 0, suffix: "%", icon: Zap, color: "text-alien-green" },
        { label: "Active_Terminals", value: activeNodes, suffix: "", icon: Users, color: "text-blue-400" },
        { label: "System_Integrity", value: systemIntegrity, suffix: "%", icon: Shield, color: "text-stardust-violet" },
        { label: "Core_Compute", value: avgCpu || 0, suffix: "%", icon: Cpu, color: "text-indigo-400" }
    ];

    return (
        <Layout title="COMMAND_CENTER | ALIEN_NET">
            <div className="min-h-screen bg-oled-black text-white p-4 lg:p-8 space-y-8 relative overflow-hidden">

                {/* Visual Flair: Background Grids */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-alien-green/5 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 space-y-8">

                    {/* TOP BAR / HEADER */}
                    <BlurReveal>
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/5 pb-8">
                            <div>
                                <h1 className="text-5xl font-black uppercase tracking-tighter italic flex items-center gap-4">
                                    <div className="p-3 bg-white/5 border border-white/10 rounded-sm">
                                        <TerminalIcon className="h-8 w-8 text-slate-500" />
                                    </div>
                                    Command_<span className="text-stardust-violet">Center</span>
                                </h1>
                                <div className="flex items-center gap-4 mt-3 ml-1">
                                    <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.4em]">
                                        Infrastructure Oversight v4.0.2
                                    </p>
                                    <div className="h-[1px] w-12 bg-white/10" />
                                    <div className="text-alien-green text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-alien-green animate-pulse" />
                                        Neural_Link_Stable
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-sm">
                                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">Uptime</div>
                                    <div className="text-xs font-mono font-bold tracking-widest">429:12:05:41</div>
                                </div>
                                <Button className="h-12 px-6 bg-stardust-violet/20 border border-stardust-violet/30 hover:bg-stardust-violet/30 text-stardust-violet text-[10px] font-black uppercase tracking-[0.2em]" style={{ borderRadius: '2px' }}>
                                    <Zap className="mr-2 h-3.5 w-3.5" /> Force_Re-Sync
                                </Button>
                                <Button className="h-12 w-12 p-0 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400" style={{ borderRadius: '2px' }}>
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </BlurReveal>

                    {/* STATS ROW */}
                    <StaggerList className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                        {stats.map((stat, i) => (
                            <StaggerItem key={i}>
                                <SoftLift>
                                    <GlassWrapper className="p-6 h-full flex flex-col justify-between bg-white/[0.02] border-white/5 hover:border-white/10 transition-all rounded-sm relative group overflow-hidden">
                                        <div className="absolute -right-2 -top-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <stat.icon className="h-24 w-24" />
                                        </div>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={cn("p-2.5 rounded-sm border bg-white/5", stat.color, "border-white/5")}>
                                                <stat.icon className="h-5 w-5" />
                                            </div>
                                            <div className="h-1 w-12 bg-white/5 mt-4" />
                                        </div>
                                        <div>
                                            <div className="text-4xl font-black italic tracking-tighter text-white flex items-end gap-1">
                                                <CountUp value={stat.value} duration={1.5} />
                                                <span className="text-lg text-slate-500 not-italic">{stat.suffix}</span>
                                            </div>
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">
                                                {stat.label}
                                            </div>
                                        </div>
                                    </GlassWrapper>
                                </SoftLift>
                            </StaggerItem>
                        ))}
                    </StaggerList>

                    {/* MAIN GRID */}
                    <div className="grid grid-cols-12 gap-8">

                        {/* LEFT: SPATIAL INTELLIGENCE & TERMINAL */}
                        <div className="col-span-12 xl:col-span-8 space-y-8">

                            {/* MAP GARDEN */}
                            <BlurReveal delay={0.2}>
                                <div className="h-[500px] border border-white/5 bg-white/[0.02] rounded-sm relative overflow-hidden group">
                                    <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
                                        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-sm">
                                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Globe className="h-3 w-3 text-blue-400" /> Spatial_Intelligence_Grid
                                            </h3>
                                        </div>
                                        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-sm">
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">LIVE_SYNC</span>
                                        </div>
                                    </div>
                                    <div className="absolute top-6 right-6 z-20 flex gap-2">
                                        <Button variant="ghost" size="sm" className="bg-black/40 border border-white/5 h-8 text-[9px] font-bold uppercase tracking-widest hover:bg-white/10">
                                            <Layers className="h-3 w-3 mr-2" /> Topo
                                        </Button>
                                        <Button variant="ghost" size="sm" className="bg-black/40 border border-white/5 h-8 text-[9px] font-bold uppercase tracking-widest hover:bg-white/10">
                                            <Search className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <NetworkMap devices={devices} users={users} />

                                    {/* Map HUD Elements */}
                                    <div className="absolute bottom-6 left-6 z-20 space-y-2">
                                        <div className="p-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-sm w-64">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active_Nodes</span>
                                                <span className="text-[9px] font-mono text-white">12/12</span>
                                            </div>
                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full w-full bg-indigo-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </BlurReveal>

                            {/* TERMINAL SECTION */}
                            <BlurReveal delay={0.3}>
                                <div className="border border-white/5 bg-white/[0.02] rounded-sm overflow-hidden">
                                    <div className="px-6 py-3 border-b border-white/5 flex justify-between items-center bg-black/20">
                                        <div className="flex items-center gap-3">
                                            <TerminalIcon className="h-3.5 w-3.5 text-slate-500" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Primary_Log_Stream</span>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500/20 border border-blue-500/40" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-slate-500/20 border border-slate-500/40" />
                                        </div>
                                    </div>
                                    <div className="p-1">
                                        <WebTerminal title="SYSTEM_KERNEL" height={220} />
                                    </div>
                                </div>
                            </BlurReveal>
                        </div>

                        {/* RIGHT: QUICK EXECUTION & PERFORMANCE */}
                        <div className="col-span-12 xl:col-span-4 space-y-8">

                            {/* QUICK ACTIONS */}
                            <BlurReveal delay={0.4}>
                                <div className="bg-white/[0.02] border border-white/5 rounded-sm p-6 space-y-6">
                                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] border-b border-white/5 pb-4 flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-stardust-violet" /> Quick_Execution
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                                        {[
                                            { label: "Operator_Matrix", icon: Users, color: "text-emerald-500", href: "/admin/users" },
                                            { label: "Node_Inventory", icon: Cpu, color: "text-blue-400", href: "/admin/inventory" },
                                            { label: "IPAM_Controller", icon: Layers, color: "text-indigo-400", href: "/admin/ipam" },
                                            { label: "Incident_Stream", icon: AlertTriangle, color: "text-red-500", href: "/admin/tickets" },
                                            { label: "Service_Market", icon: Package, iconColor: "text-amber-500", href: "/admin/hotspot" },
                                            { label: "Neural_Nexus", icon: Activity, color: "text-stardust-violet", href: "/admin/nexus" },
                                            { label: "Topo_Analyzer", icon: MapIcon, color: "text-sky-400", href: "/admin/topology" },
                                            { label: "Seller_Queue", icon: Shield, color: "text-earth-green", href: "/admin/sellers" },
                                            { label: "System_Config", icon: Settings, color: "text-slate-500", href: "/admin/settings" }
                                        ].map((act, i) => (
                                            <Link href={act.href} key={i}>
                                                <Button variant="outline" className="w-full justify-start h-14 bg-white/[0.03] border-white/5 hover:bg-white/10 hover:border-white/10 text-[10px] font-black uppercase tracking-widest gap-4 group transition-all" style={{ borderRadius: '2px' }}>
                                                    <div className={cn("p-2 rounded-sm bg-white/5", act.color || act.iconColor)}>
                                                        <act.icon className="h-4 w-4" />
                                                    </div>
                                                    <span className="truncate">{act.label}</span>
                                                    <ChevronRight className="ml-auto h-4 w-4 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                                </Button>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </BlurReveal>

                            {/* PERFORMANCE METRICS */}
                            <BlurReveal delay={0.5}>
                                <div className="bg-white/[0.02] border border-white/5 rounded-sm p-6">
                                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] border-b border-white/5 pb-4 mb-6 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-blue-400" /> Telemetry_X
                                        </div>
                                        <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-sm">OPTIMIZED</span>
                                    </h3>

                                    <div className="space-y-6">
                                        <div className="h-32">
                                            <SparklineGrid />
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            {[
                                                { label: "Kernel_Load", val: 24, color: "bg-blue-500" },
                                                { label: "Memory_Heap", val: 68, color: "bg-stardust-violet" },
                                                { label: "Active_Sockets", val: 12, color: "bg-alien-green" }
                                            ].map((m, i) => (
                                                <div key={i} className="space-y-2">
                                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        <span>{m.label}</span>
                                                        <span className="text-white font-mono">{m.val}%</span>
                                                    </div>
                                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full transition-all duration-1000", m.color)}
                                                            style={{ width: `${m.val}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </BlurReveal>

                            {/* SYSTEM VERSIONING */}
                            <BlurReveal delay={0.6}>
                                <div className="bg-black/40 border border-white/5 rounded-sm p-6 text-center">
                                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">
                                        Unauthorized Access Restricted
                                    </div>
                                    <div className="flex items-center justify-center gap-6">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xl font-black italic tracking-tighter">API</span>
                                            <span className="text-[8px] font-bold text-slate-700">v4.0.0</span>
                                        </div>
                                        <div className="w-[1px] h-8 bg-white/5" />
                                        <div className="flex flex-col items-center">
                                            <span className="text-xl font-black italic tracking-tighter text-stardust-violet">GQL</span>
                                            <span className="text-[8px] font-bold text-slate-700">ACTIVE</span>
                                        </div>
                                        <div className="w-[1px] h-8 bg-white/5" />
                                        <div className="flex flex-col items-center">
                                            <span className="text-xl font-black italic tracking-tighter">WS_</span>
                                            <span className="text-[8px] font-bold text-slate-700">STREAMING</span>
                                        </div>
                                    </div>
                                </div>
                            </BlurReveal>

                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="pt-12 pb-8 flex flex-col items-center gap-4 opacity-30 group hover:opacity-100 transition-opacity">
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] text-center">
                            Alien_Net_Infrastructure &middot; Deep_Space_Network_Division &middot; 2026_All_Rights_Reserved
                        </p>
                    </div>

                </div>
            </div>
        </Layout>
    );
}
