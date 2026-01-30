import { useAuth } from '@/hooks/use-auth';
import { useMounted } from '@/hooks/use-mounted';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
    Plus,
    Search,
    Activity,
    Loader2,
    User,
    Clock,
    AlertTriangle,
    CheckCircle2,
    ExternalLink
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { GlassWrapper } from '@/components/ui/motion-container';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

type Ticket = {
    id: number;
    title: string;
    description: string;
    type: string;
    priority: string;
    status: string;
    reporter_name: string;
    assignee_name: string;
    created_at: string;
};

type TicketStats = {
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    avg_resolution_time_minutes: number;
    active_dispatches: number;
};

export default function TicketsPage() {
    useAuth();
    const mounted = useMounted();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState<TicketStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const [ticketsResp, statsResp] = await Promise.all([
                apiClient.get<Ticket[]>('/tickets'),
                apiClient.get<TicketStats>('/tickets/stats')
            ]);
            setTickets(ticketsResp);
            setStats(statsResp);
        } catch (err) {
            toast.error("Failed to load incident stream");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) fetchTickets();
    }, [mounted]);

    const handleResolve = async (id: number) => {
        try {
            await apiClient.post(`/tickets/${id}/resolve`, { resolution: "Resolved via Admin Console" });
            toast.success("Incident neutralized");
            fetchTickets();
        } catch (err) {
            toast.error("Neutralization failed");
        }
    };

    // ... (columns definition omitted for brevity) ...

    const columns: ColumnDef<Ticket>[] = [
        {
            accessorKey: 'id',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">ID</span>,
            cell: ({ row }) => <span className="text-[10px] font-mono text-slate-500">#{row.original.id}</span>,
        },
        {
            accessorKey: 'title',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Headline</span>,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-[11px] font-black text-white uppercase tracking-wider italic">{row.original.title}</span>
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest truncate max-w-[200px]">{row.original.description}</span>
                </div>
            ),
        },
        {
            accessorKey: 'priority',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Threat_Level</span>,
            cell: ({ row }) => {
                const priority = row.original.priority?.toLowerCase();
                return (
                    <span className={cn(
                        "px-2 py-0.5 border text-[8px] font-black uppercase tracking-widest",
                        priority === 'critical' ? "border-red-500/30 bg-red-500/10 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" :
                            priority === 'high' ? "border-orange-500/30 bg-orange-500/10 text-orange-500" :
                                priority === 'medium' ? "border-blue-500/30 bg-blue-500/10 text-blue-500" :
                                    "border-slate-500/30 bg-slate-500/10 text-slate-500"
                    )} style={{ borderRadius: '1px' }}>
                        {row.original.priority}
                    </span>
                );
            },
        },
        {
            accessorKey: 'status',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Protocol_Status</span>,
            cell: ({ row }) => {
                const status = row.original.status?.toLowerCase();
                return (
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            status === 'open' ? "bg-red-500 animate-pulse" :
                                status === 'resolved' ? "bg-earth-green" :
                                    "bg-blue-400 animate-pulse"
                        )} />
                        <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border border-white/5 bg-white/5",
                            status === 'open' ? "text-red-500" :
                                status === 'resolved' ? "text-earth-green" :
                                    "text-blue-400"
                        )}>
                            {row.original.status}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'assignee_name',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Technician</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {row.original.assignee_name || 'UNASSIGNED'}
                    </span>
                </div>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {row.original.status !== 'resolved' && (
                        <Button
                            variant="ghost"
                            className="h-8 px-3 border border-earth-green/20 hover:bg-earth-green/10 text-earth-green text-[9px] font-black uppercase tracking-widest"
                            onClick={() => handleResolve(row.original.id)}
                        >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                            NEUTRALIZE
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 border border-white/5 hover:bg-white/5 text-slate-500"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ),
        },
    ];

    if (!mounted) return null;

    return (
        <Layout title="Incident_Control">
            <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-8 relative overflow-hidden">
                {/* Background Visual Flair */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-stardust-violet/5 blur-[100px] rounded-full pointer-events-none" />

                {/* HUD Header */}
                <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-32 h-[1px] bg-red-600 shadow-[0_0_15px_#dc2626]" />
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-600/10 border border-red-600/20 rounded-sm">
                                    <AlertTriangle className="h-6 w-6 text-red-500" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Incident_Control</h1>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Critical_System_Alert_Log</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="px-6 py-3 bg-black/40 border border-white/5 rounded-sm">
                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Open_Indicents</div>
                                <div className="text-xl font-black italic text-red-500 tracking-tighter">
                                    {tickets.filter(t => t.status !== 'resolved').length}
                                </div>
                            </div>
                            <Button
                                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest h-12 px-8 rounded-sm"
                            >
                                <Plus className="mr-3 h-4 w-4" />
                                NEW_ADVISORY
                            </Button>
                        </div>
                    </div>

                    {/* Filters HUD */}
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-8 border-t border-white/5 gap-6">
                        <div className="relative w-full max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-red-500 transition-colors" />
                            <input
                                type="search"
                                placeholder="PROBE_INCIDENTS..."
                                className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-3 text-[11px] font-black text-white placeholder:text-slate-700 focus:outline-none focus:border-red-600/30 transition-all rounded-sm italic"
                            />
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-blue-400" />
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">MTTR: <span className="text-white">{stats?.avg_resolution_time_minutes?.toFixed(0) || 0}m</span></div>
                            </div>
                            <div className="h-6 w-[1px] bg-white/10 mx-4" />
                            <div className="flex items-center gap-3">
                                <Activity className="h-4 w-4 text-earth-green" />
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Active_Dispatch: <span className="text-white">{stats?.active_dispatches || 0}</span></div>
                            </div>
                        </div>
                    </div>
                </GlassWrapper>

                {/* Data Matrix */}
                <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm overflow-hidden p-0 min-h-[400px] flex flex-col items-center justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Retrieving_Incident_Stream...</span>
                        </div>
                    ) : (
                        <div className="alien-net-table overflow-x-auto w-full">
                            <DataTable columns={columns} data={tickets} />
                        </div>
                    )}
                </GlassWrapper>
            </div>
        </Layout>
    );
}
