import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Shield, Eye, X, History, User, Globe, Monitor, CheckCircle, XCircle, Activity } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { BlurReveal, GlassWrapper } from '@/components/ui/motion-container';
import { apiClient } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

type AuditLog = {
    id: number;
    user_id: number;
    username: string;
    action: string;
    resource: string;
    resource_id: number;
    ip_address: string;
    user_agent: string;
    success: boolean;
    details: string;
    old_state: string;
    new_state: string;
    timestamp: string;
};

export default function AuditRegistry() {
    const { isAuthenticated } = useAuth();
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

    const { data: logs = [] } = useQuery({
        queryKey: ['admin-audit-logs'],
        queryFn: () => apiClient.getAuditLogs(),
        enabled: isAuthenticated,
        refetchInterval: 10000 // Refresh every 10s for real-time visibility
    });

    const columns: ColumnDef<AuditLog>[] = [
        {
            accessorKey: 'timestamp',
            header: 'Timestamp',
            cell: ({ row }) => (
                <div className="text-[10px] font-black text-slate-400 tabular-nums italic">
                    {format(new Date(row.original.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                </div>
            )
        },
        {
            accessorKey: 'username',
            header: 'Operator',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-stardust-violet" />
                    <span className="text-[11px] font-black text-white uppercase italic">{row.original.username}</span>
                </div>
            )
        },
        {
            accessorKey: 'action',
            header: 'Directive',
            cell: ({ row }) => (
                <div className={cn(
                    "px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest inline-block italic border",
                    row.original.action === 'login' ? "bg-earth-green/10 border-earth-green/20 text-earth-green" :
                        row.original.action === 'update' ? "bg-stardust-violet/10 border-stardust-violet/20 text-stardust-violet" :
                            row.original.action === 'delete' ? "bg-cosmic-red/10 border-cosmic-red/20 text-cosmic-red" :
                                "bg-white/5 border-white/10 text-slate-400"
                )}>
                    {row.original.action.toUpperCase()}
                </div>
            )
        },
        {
            accessorKey: 'resource',
            header: 'Resource',
            cell: ({ row }) => (
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider italic">
                    {row.original.resource}_{row.original.resource_id}
                </div>
            )
        },
        {
            accessorKey: 'success',
            header: 'Outcome',
            cell: ({ row }) => (
                row.original.success ?
                    <div className="flex items-center gap-1.5 text-earth-green italic font-black text-[9px] uppercase tracking-widest">
                        <CheckCircle className="w-3 h-3" /> SUCCESS
                    </div> :
                    <div className="flex items-center gap-1.5 text-cosmic-red italic font-black text-[9px] uppercase tracking-widest">
                        <XCircle className="w-3 h-3" /> DENIED
                    </div>
            )
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 border border-white/5 hover:border-earth-green/30 hover:text-earth-green transition-all"
                    onClick={() => {
                        setSelectedLog(row.original);
                        setIsDiffModalOpen(true);
                    }}
                >
                    <Eye className="h-4 w-4" />
                </Button>
            )
        }
    ];

    const renderDiff = (oldState: string, newState: string) => {
        try {
            const oldObj = JSON.parse(oldState || '{}');
            const newObj = JSON.parse(newState || '{}');

            // Simple key-based diff
            const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]))
                .filter(k => k !== 'updated_at' && k !== 'created_at');

            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-2 border-b border-white/5 pb-2">
                        <div>Previous_State</div>
                        <div>Modified_State</div>
                    </div>
                    {allKeys.map(key => {
                        const oldVal = JSON.stringify(oldObj[key]);
                        const newVal = JSON.stringify(newObj[key]);
                        const isChanged = oldVal !== newVal;

                        if (!isChanged) return null;

                        return (
                            <div key={key} className="grid grid-cols-2 gap-4 group">
                                <div className="p-3 bg-cosmic-red/5 border border-cosmic-red/10 rounded-sm overflow-hidden text-ellipsis whitespace-nowrap">
                                    <span className="text-[9px] text-slate-600 block mb-1 uppercase tracking-tighter">{key}</span>
                                    <code className="text-cosmic-red/70 text-[10px]">{oldVal}</code>
                                </div>
                                <div className="p-3 bg-earth-green/5 border border-earth-green/10 rounded-sm overflow-hidden text-ellipsis whitespace-nowrap">
                                    <span className="text-[9px] text-slate-600 block mb-1 uppercase tracking-tighter">{key}</span>
                                    <code className="text-earth-green text-[10px]">{newVal}</code>
                                </div>
                            </div>
                        );
                    })}
                    {allKeys.every(key => JSON.stringify(oldObj[key]) === JSON.stringify(newObj[key])) && (
                        <div className="text-slate-500 text-[11px] italic text-center py-10 uppercase tracking-[0.2em] font-black">
                            No_Configuration_Drift_Detected
                        </div>
                    )}
                </div>
            );
        } catch (e) {
            return <div className="text-cosmic-red text-[11px] italic uppercase font-black">Failed_To_Parse_State_Snapshots</div>;
        }
    };

    return (
        <Layout title="Audit_Registry">
            <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-earth-green/5 blur-[150px] rounded-full pointer-events-none" />

                <BlurReveal>
                    <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                        {/* HUD Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/10 pb-10 relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 w-32 h-[1px] bg-earth-green shadow-[0_0_15px_#10b981]" />
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-earth-green/10 border border-earth-green/20 rounded-sm">
                                    <History className="h-8 w-8 text-earth-green" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                                        Audit_<span className="text-earth-green">Registry</span>
                                    </h1>
                                    <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mt-2 italic">
                                        Subsurface Monitoring & High-Fidelity Change Attribution
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Audit Table */}
                        <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm overflow-hidden p-0 relative">
                            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-3 italic">
                                    <Shield className="w-5 h-5 text-stardust-violet" /> Synaptic_Logs
                                </h2>
                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sync_Status: <span className="text-earth-green italic">LIVE</span></div>
                            </div>
                            <div className="alien-net-table overflow-x-auto">
                                <DataTable columns={columns} data={logs} />
                            </div>
                        </GlassWrapper>
                    </div>
                </BlurReveal>

                {/* Diff Modal */}
                {isDiffModalOpen && selectedLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#0a0a0c] border border-white/10 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col relative"
                            style={{ borderRadius: '2.5px' }}
                        >
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-earth-green/40" />
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">
                                        Change_Attribution
                                    </h3>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] italic mt-1">
                                        Tracing_Nexus_Modifications: {selectedLog.resource}_{selectedLog.resource_id}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsDiffModalOpen(false)}
                                    className="h-10 w-10 p-0 border border-white/5 hover:bg-white/5 hover:border-white/10 rounded-sm"
                                >
                                    <X className="h-5 w-5 text-slate-500" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                                {/* Log Metadata */}
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest italic">
                                            <Globe className="w-3 h-3" /> Origin_IP
                                        </div>
                                        <div className="text-[11px] font-black text-slate-300 italic">{selectedLog.ip_address}</div>
                                    </div>
                                    <div className="space-y-1.5 text-right">
                                        <div className="flex items-center gap-2 justify-end text-[10px] font-black text-slate-600 uppercase tracking-widest italic">
                                            <Monitor className="w-3 h-3" /> Interface
                                        </div>
                                        <div className="text-[9px] font-black text-slate-500 italic max-w-xs ml-auto line-clamp-1">{selectedLog.user_agent}</div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-sm space-y-2">
                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Executive_Statement</div>
                                    <div className="text-[12px] font-black text-white italic">{selectedLog.details || "Automatic attribution logged by system overseer."}</div>
                                </div>

                                {/* State Diff */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Activity className="w-4 h-4 text-earth-green" />
                                        <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">Synaptic_Drift_Analysis</h4>
                                    </div>
                                    <div className="bg-[#050505] border border-white/10 p-6 rounded-sm">
                                        {renderDiff(selectedLog.old_state, selectedLog.new_state)}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
