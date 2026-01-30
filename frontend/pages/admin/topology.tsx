import React from 'react';
import Layout from '@/components/layout';
import { useAuth } from '@/hooks/use-auth';
import { NetworkTopology } from '@/components/visualizations/NetworkTopology';
import { Button } from '@/components/ui/button';
import {
    Activity,
    Shield,
    Zap,
    Server,
    Cpu,
    Globe,
    Terminal,
    Map as MapIcon,
    Radio,
    CircleDot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlurReveal, GlassWrapper, StaggerList, StaggerItem } from '@/components/ui/motion-container';
import { apiClient } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function TopologyPage() {
    useAuth();

    const { data: topologyData } = useQuery({
        queryKey: ['topology-analysis'],
        queryFn: () => apiClient.getLatestTopologyAnalysis(),
        refetchInterval: 5000
    });

    const { data: healthData } = useQuery({
        queryKey: ['health-analysis'],
        queryFn: () => apiClient.getLatestHealthAnalysis(),
        refetchInterval: 5000
    });

    const nodeCount = topologyData?.nodes?.length || 0;
    const latency = healthData?.network_health?.latency ? `${healthData.network_health.latency.toFixed(2)}ms` : '0.042ms';
    const firewallStatus = healthData?.security_health?.compliance_score ? `${healthData.security_health.compliance_score.toFixed(1)}%` : '99.9%';
    const linkStatus = healthData?.overall_status === 'healthy' ? 'Active' : 'Degraded';
    const syncStatus = healthData?.system_health?.uptime_percentage ? 'Stable' : 'Check';
    const pulseStatus = healthData?.overall_status === 'healthy' ? 'Normal' : 'Irregular';

    return (
        <Layout title="Topology_Matrix">
            <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-12 relative overflow-hidden">
                {/* Background Visual Flair */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-stardust-violet/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-earth-green/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />

                <BlurReveal>
                    <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                        {/* HUD Header Section */}
                        <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-32 h-[1px] bg-stardust-violet shadow-[0_0_15px_#6366f1]" />
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-stardust-violet/10 border border-stardust-violet/20 rounded-sm">
                                        <Globe className="h-8 w-8 text-stardust-violet" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                                            Topology_<span className="text-stardust-violet">Matrix</span>
                                        </h1>
                                        <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mt-2 italic">
                                            Real-time Infrastructure Mapping & Segment_Discovery
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 px-8 py-4 bg-white/[0.02] border border-white/5 rounded-sm">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">System_Latency</span>
                                        <span className="text-[11px] font-black text-earth-green uppercase tracking-widest italic">{latency}</span>
                                    </div>
                                    <div className="w-[1px] h-8 bg-white/5" />
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Active_Nodes</span>
                                        <span className="text-[11px] font-black text-stardust-violet uppercase tracking-widest italic">{nodeCount}</span>
                                    </div>
                                </div>
                            </div>
                        </GlassWrapper>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                            {/* Sidebar Stats */}
                            <StaggerList className="xl:col-span-1 space-y-8">
                                <StaggerItem>
                                    <GlassWrapper className="bg-[#0a0a0c] border-white/5 p-8 rounded-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 mb-10 italic border-b border-white/5 pb-4">
                                            NETWORK_VITALS
                                        </h3>

                                        <div className="space-y-6">
                                            <VitalItem icon={Activity} label="Pulse_Rate" value={pulseStatus} color="text-earth-green" />
                                            <VitalItem icon={Shield} label="Firewall_Integrity" value={firewallStatus} color="text-stardust-violet" />
                                            <VitalItem icon={Zap} label="Network_Links" value={linkStatus} color="text-cosmic-red" />
                                            <VitalItem icon={Cpu} label="Compute_Sync" value={syncStatus} color="text-blue-400" />
                                        </div>
                                    </GlassWrapper>
                                </StaggerItem>

                                <StaggerItem>
                                    <GlassWrapper className="bg-[#0a0a0c] border-white/5 p-8 rounded-sm relative overflow-hidden">
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 italic border-b border-white/5 pb-4">
                                            ADMIN_HANDSHAKE
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <OpButton icon={Terminal} label="Console" />
                                            <OpButton icon={MapIcon} label="GIS_Map" />
                                            <OpButton icon={Server} label="Inventory" />
                                            <OpButton icon={Activity} label="Diagnostics" />
                                        </div>
                                    </GlassWrapper>
                                </StaggerItem>

                                <StaggerItem>
                                    <GlassWrapper className="bg-stardust-violet/[0.03] border-stardust-violet/20 p-8 rounded-sm relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-12 h-[1px] bg-stardust-violet shadow-[0_0_10px_#8b5cf6]" />
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-stardust-violet mb-4 italic flex items-center gap-2">
                                            <Radio className="h-4 w-4 animate-pulse" />
                                            PATHFINDER_BETA
                                        </h3>
                                        <p className="text-[10px] text-slate-500 leading-relaxed font-black uppercase tracking-widest italic group-hover:text-slate-400 transition-colors">
                                            Select two nodes on the graph to calculate initial routing path between network segments.
                                        </p>
                                    </GlassWrapper>
                                </StaggerItem>
                            </StaggerList>

                            {/* Topology Map */}
                            <StaggerItem className="xl:col-span-3">
                                <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm p-4 relative overflow-hidden h-full">
                                    <div className="absolute top-4 left-4 z-10 flex items-center gap-4 bg-black/60 backdrop-blur-md px-5 py-3 border border-white/5 rounded-sm">
                                        <CircleDot className="h-3 w-3 text-earth-green animate-pulse" />
                                        <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] italic">TOPOLOGY_STREAM_ACTIVE</span>
                                    </div>
                                    <div className="relative z-0 h-[calc(100vh-350px)]">
                                        <NetworkTopology height="100%" />
                                    </div>
                                    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-4">
                                        <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/5 rounded-sm text-[8px] font-black text-slate-500 uppercase tracking-widest italic">
                                            NODE_VIS_SCALE: 1.0
                                        </div>
                                    </div>
                                </GlassWrapper>
                            </StaggerItem>
                        </div>
                    </div>
                </BlurReveal>
            </div>
        </Layout>
    );
}

function VitalItem({ icon: Icon, label, value, color }: any) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
                <Icon className="h-4 w-4 text-slate-700 group-hover:text-slate-400 transition-colors" />
                <span className="text-[10px] font-black text-slate-600 group-hover:text-slate-400 uppercase tracking-[0.2em] italic transition-colors">{label}</span>
            </div>
            <span className={cn("text-[10px] font-black uppercase italic tracking-widest", color)}>{value}</span>
        </div>
    );
}

function OpButton({ icon: Icon, label }: any) {
    return (
        <Button variant="outline" className="h-28 bg-white/[0.02] border-white/5 hover:border-stardust-violet/30 hover:bg-stardust-violet/10 flex flex-col gap-4 rounded-sm transition-all group p-4">
            <Icon className="h-6 w-6 text-slate-600 group-hover:text-stardust-violet transition-colors" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 group-hover:text-white transition-colors text-center">{label}</span>
        </Button>
    );
}

