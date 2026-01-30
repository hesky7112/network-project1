import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    LayoutTemplate,
    FileText,
    Workflow,
    Plus,
    Clock,
    MoreVertical,
    AppWindow,
    Cpu,
    Zap,
    Loader2
} from 'lucide-react';
import Layout from '@/components/layout';
import { SoftLift } from '@/components/ui/motion-container';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { VirtualList } from '@/components/studio/VirtualList';
import { CommandPalette } from '@/components/studio/CommandPalette';
import { motion } from 'framer-motion';

interface Project {
    id: string;
    name: string;
    description: string;
    category: string;
    updated_at: string;
    is_published: boolean;
    type?: 'app' | 'pdf' | 'flow'; // Inferred from metadata or tags
}

export default function StudioDashboard() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'app' | 'pdf' | 'flow'>('all');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const { data } = await apiClient.get('/modules');
            // Mock type inference for now (everything is an 'app' until we add metadata)
            const typedData = data.map((p: any) => ({
                ...p,
                type: p.category === 'document' ? 'pdf' : (p.category === 'automation' ? 'flow' : 'app')
            }));
            setProjects(typedData);
        } catch (err) {
            toast.error("Failed to load projects");
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async (id: string, published: boolean) => {
        try {
            await apiClient.post(`/modules/${id}/publish`, { published });
            toast.success(published ? "Project published to Marketplace" : "Project unpublished");
            fetchProjects();
        } catch (err) {
            toast.error("Failed to update project status");
        }
    };

    const FORGES = [
        {
            id: 'app',
            name: 'App Forge',
            desc: 'Build mini-apps & dashboards',
            icon: AppWindow,
            color: 'text-stardust-violet',
            bg: 'bg-stardust-violet/10',
            border: 'border-stardust-violet/30',
            action: () => router.push('/studio/create')
        },
        {
            id: 'pdf',
            name: 'PDF Forge',
            desc: 'Chat & extract data from docs',
            icon: FileText,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/30',
            action: () => router.push('/studio/pdf') // Placeholder
        },
        {
            id: 'flow',
            name: 'Flow Forge',
            desc: 'Visual automation builder',
            icon: Workflow,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/30',
            action: () => router.push('/studio/flow') // Placeholder
        },
        {
            id: 'data',
            name: 'Data Forge',
            desc: 'Deep Marimo Data Science',
            icon: Cpu,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/30',
            action: () => router.push('/studio/data')
        }
    ];

    const renderProjectItem = (p: Project) => (
        <div
            key={p.id}
            onClick={() => router.push(`/studio/editor?id=${encodeURIComponent(p.name)}`)}
            className="p-4 hover:bg-white/5 cursor-pointer transition-all flex items-center justify-between group border-b border-white/[0.03]"
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center border shadow-lg",
                    p.type === 'pdf' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                        p.type === 'flow' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                            "bg-stardust-violet/10 border-stardust-violet/20 text-stardust-violet"
                )}>
                    {p.type === 'pdf' ? <FileText className="h-5 w-5" /> :
                        p.type === 'flow' ? <Workflow className="h-5 w-5" /> :
                            <AppWindow className="h-5 w-5" />}
                </div>
                <div>
                    <h4 className="text-white font-black text-sm uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{p.name}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest line-clamp-1 mt-0.5">{p.description}</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="text-right hidden md:block">
                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Status</div>
                    <div className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        p.is_published ? "text-emerald-400" : "text-amber-400"
                    )}>
                        {p.is_published ? 'Published' : 'Draft'}
                    </div>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Deployment</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePublish(p.id, !p.is_published);
                    }}
                    className={cn(
                        "h-8 text-[9px] font-black uppercase tracking-widest px-4 border shadow-sm",
                        p.is_published ? "border-white/10 text-slate-400 hover:text-white" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                    )}
                >
                    {p.is_published ? 'Unpublish' : 'Ship to Marketplace'}
                </Button>

                <Button variant="ghost" size="icon" className="text-slate-600 hover:text-white hover:bg-white/5">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );

    return (
        <Layout title="Universal Studio | Intelligence Engine">
            <CommandPalette />
            <div className="max-w-7xl mx-auto py-10 space-y-10 px-6">

                {/* Header */}
                <header className="flex justify-between items-end border-b border-white/5 pb-8" role="banner">
                    <div>
                        <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Studio_OS</h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] flex items-center gap-4 mt-3">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                <span className="text-emerald-500/90">Mainframe Online</span>
                            </span>
                            <span className="w-px h-3 bg-white/10" />
                            <span className="flex items-center gap-2">
                                <Zap className="h-3 w-3 text-amber-500" />
                                <span>Super Engine v2.4</span>
                            </span>
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="hidden lg:flex flex-col items-end mr-6 pointer-events-none">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Quick Command</span>
                            <span className="text-xs font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 mt-1">CTRL+K</span>
                        </div>
                        <Button className="bg-white text-black font-black uppercase tracking-[0.2em] h-12 px-8 hover:bg-cyan-500 hover:text-white transition-all">
                            New Project
                        </Button>
                    </div>
                </header>

                {/* Forges Launchpad */}
                <section
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    aria-label="Forges Launchpad"
                >
                    {FORGES.map(forge => (
                        <SoftLift key={forge.id}>
                            <button
                                onClick={forge.action}
                                className={cn(
                                    "p-6 border rounded-2xl transition-all group relative overflow-hidden bg-gradient-to-br from-black/60 to-black/20 backdrop-blur-xl text-left w-full",
                                    forge.border,
                                    "hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-[0.98]"
                                )}
                                aria-label={`Launch ${forge.name}`}
                            >
                                <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500", forge.bg)} />

                                <div className="flex justify-between items-start mb-8">
                                    <div className={cn("p-4 rounded-xl border-2 shadow-2xl", forge.bg, forge.border)}>
                                        <forge.icon className={cn("h-6 w-6", forge.color)} />
                                    </div>
                                    <div className="bg-white/5 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                        <Plus className="h-4 w-4 text-white" />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">{forge.name}</h3>
                                    <p className="text-[11px] font-bold text-slate-500 mt-3 uppercase tracking-widest leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
                                        {forge.desc}
                                    </p>
                                </div>
                            </button>
                        </SoftLift>
                    ))}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-6">
                    {/* Recent Projects (Virtualized) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                                <Clock className="h-4 w-4 text-slate-500" />
                                Recent Project Streams
                            </h2>
                            <div className="flex gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
                                {['all', 'app', 'pdf', 'flow'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f as any)}
                                        className={cn(
                                            "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
                                            filter === f
                                                ? "bg-white text-black"
                                                : "text-slate-500 hover:text-white"
                                        )}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden min-h-[500px]">
                            {loading ? (
                                <div className="h-[500px] flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-stardust-violet" />
                                </div>
                            ) : projects.length === 0 ? (
                                <div className="p-20 text-center">
                                    <LayoutTemplate className="h-16 w-16 text-slate-800 mx-auto mb-6 opacity-20" />
                                    <p className="text-slate-500 text-sm font-black uppercase tracking-widest">Primary workspace is empty</p>
                                </div>
                            ) : (
                                <VirtualList
                                    items={projects.filter(p => filter === 'all' || p.type === filter)}
                                    itemSize={80}
                                    renderItem={(item) => renderProjectItem(item)}
                                />
                            )}
                        </div>
                    </div>

                    {/* Stats & Activity (Vercel Style) */}
                    <div className="space-y-10">
                        <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Engine Utilization</h3>
                            <div className="space-y-6">
                                {[
                                    { label: 'Compute Power', value: 84, color: 'bg-emerald-500' },
                                    { label: 'Nexus Throughput', value: 32, color: 'bg-stardust-violet' },
                                    { label: 'Flow Latency', value: 12, color: 'bg-amber-500' }
                                ].map(stat => (
                                    <div key={stat.label} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-400">{stat.label}</span>
                                            <span className="text-white">{stat.value}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${stat.value}%` }}
                                                className={cn("h-full", stat.color)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl border border-white/5 bg-black/20">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Nexus Activity</h3>
                            <div className="space-y-4">
                                {[
                                    "Project 'AuditSys' integrated via gRPC",
                                    "New CSV stream detected in Data Forge",
                                    "PDF OCR completed: 124 pages",
                                    "Anomaly detected in Edge Hub #4"
                                ].map((log, i) => (
                                    <div key={i} className="flex gap-4 items-start pb-4 border-b border-white/[0.03] last:border-0 last:pb-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1.5 shrink-0" />
                                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wide">{log}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
