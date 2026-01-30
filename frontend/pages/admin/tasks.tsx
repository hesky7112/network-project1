import { useState, useEffect } from 'react';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Play, Clock, AlertCircle, CheckCircle, Zap, Activity, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { GlassWrapper, SoftLift, StaggerList, StaggerItem, BlurReveal } from '@/components/ui/motion-container';

type Task = {
    name: string;
    type: string;
    interval: number; // nanoseconds usually from Go
    enabled: boolean;
};

type TaskLog = {
    id: number;
    task_name: string;
    status: string;
    duration: string;
    message: string;
    created_at: string;
};

import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function SchedulerIndex() {
    // Auth check for WebSocket
    // const { isAuthenticated } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [logs, setLogs] = useState<TaskLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tasksRes, logsRes] = await Promise.all([
                apiClient.get<Task[]>('/tasks/'),
                apiClient.get<TaskLog[]>('/tasks/logs?limit=50')
            ]);

            setTasks(tasksRes);
            setLogs(logsRes);
        } catch (error) {
            console.error("Failed to fetch scheduler data", error);
            toast.error("Scheduler sync failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleTrigger = async (name: string) => {
        setTriggering(name);
        try {
            await apiClient.post(`/tasks/${name}/trigger`);
            toast.success(`Protocol ${name} initiated`);
            // Refresh logs after a short delay
            setTimeout(fetchData, 1000);
        } catch (error) {
            console.error("Failed to trigger task", error);
            toast.error("Execution failed");
        } finally {
            setTriggering(null);
        }
    };

    return (
        <Layout title="Protocol_Scheduler">
            <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-12 relative overflow-hidden">
                {/* Background Visual Flair */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-stardust-violet/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-earth-green/5 blur-[100px] rounded-full pointer-events-none" />

                <BlurReveal>
                    <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                        {/* HUD Header */}
                        <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-32 h-[1px] bg-stardust-violet shadow-[0_0_15px_#6366f1]" />
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-stardust-violet/10 border border-stardust-violet/20 rounded-sm">
                                        <Activity className="h-8 w-8 text-stardust-violet" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                                            Protocol_<span className="text-stardust-violet">Scheduler</span>
                                        </h1>
                                        <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mt-2 italic">
                                            Automated System Maintenance & cron_job_matrix
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={fetchData}
                                    className="bg-white/5 text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest h-14 px-10 border border-white/10 rounded-sm transition-all"
                                >
                                    <RefreshCw className={cn("mr-3 h-4 w-4", loading && "animate-spin")} />
                                    SYNC_MATRIX
                                </Button>
                            </div>
                        </GlassWrapper>

                        {/* Tasks Grid */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-1">
                                <Zap className="w-5 h-5 text-earth-green" />
                                <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">Active_Operation_Nodes</h2>
                            </div>
                            <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {tasks.map((task) => (
                                    <StaggerItem key={task.name}>
                                        <SoftLift>
                                            <GlassWrapper className="p-6 border-white/5 bg-[#0a0a0c] group relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                    <Clock className="w-16 h-16 text-earth-green" />
                                                </div>

                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Task_Identifier</span>
                                                        <h3 className="text-lg font-black text-white font-mono italic uppercase">{task.name}</h3>
                                                    </div>
                                                    <span className={cn(
                                                        "px-2 py-0.5 border text-[8px] font-black uppercase tracking-widest italic",
                                                        task.enabled ? "border-earth-green/30 text-earth-green bg-earth-green/10" : "border-cosmic-red/30 text-cosmic-red bg-cosmic-red/10"
                                                    )} style={{ borderRadius: '1px' }}>
                                                        {task.enabled ? "ACTIVE" : "HALTED"}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-8">
                                                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-sm">
                                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1 italic">Type</span>
                                                        <span className="text-[10px] text-slate-300 font-mono uppercase italic">{task.type}</span>
                                                    </div>
                                                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-sm">
                                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1 italic">Freq</span>
                                                        <span className="text-[10px] text-slate-300 font-mono uppercase italic">{(task.interval / 1000000000)}s</span>
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={() => handleTrigger(task.name)}
                                                    disabled={triggering === task.name}
                                                    className="w-full bg-earth-green/10 hover:bg-earth-green text-earth-green hover:text-black border border-earth-green/30 text-[10px] font-black uppercase tracking-widest h-11 rounded-sm transition-all"
                                                >
                                                    <Play className="mr-3 h-3.5 w-3.5" />
                                                    {triggering === task.name ? "INITIALIZING..." : "EXECUTE_STREAM"}
                                                </Button>
                                            </GlassWrapper>
                                        </SoftLift>
                                    </StaggerItem>
                                ))}
                            </StaggerList>
                        </div>

                        {/* Execution Logs */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-1">
                                <Terminal className="w-5 h-5 text-stardust-violet" />
                                <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">Operation_Stream_History</h2>
                                <div className="h-[1px] flex-1 bg-white/5" />
                            </div>

                            <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm overflow-hidden p-0 relative">
                                <div className="alien-net-table overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-white/[0.02] border-b border-white/5">
                                            <tr>
                                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Temporal_Marker</th>
                                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Protocol</th>
                                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Auth_Status</th>
                                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Duration</th>
                                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Output_Log</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.03]">
                                            {logs.map((log) => (
                                                <tr key={log.id} className="hover:bg-white/[0.01] transition-colors group">
                                                    <td className="p-5 text-[10px] font-mono text-slate-500 italic">
                                                        {format(new Date(log.created_at), 'HH:mm:ss · dd MMM')}
                                                    </td>
                                                    <td className="p-5 text-[11px] font-black text-white uppercase tracking-wider italic">
                                                        {log.task_name}
                                                    </td>
                                                    <td className="p-5">
                                                        <span className={cn(
                                                            "flex items-center gap-2 text-[9px] font-black uppercase tracking-widest italic",
                                                            log.status === 'success' ? "text-earth-green" : "text-cosmic-red"
                                                        )}>
                                                            {log.status === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-[10px] font-mono text-slate-400 italic">
                                                        {log.duration}
                                                    </td>
                                                    <td className="p-5 text-[10px] font-mono text-slate-600 max-w-md truncate italic group-hover:text-slate-400 transition-colors">
                                                        {log.message}
                                                    </td>
                                                </tr>
                                            ))}
                                            {logs.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-16 text-center">
                                                        <div className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em] italic mb-2">No_Data_Streams_Detected</div>
                                                        <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Awaiting operation initiation...</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassWrapper>
                        </div>
                    </div>
                </BlurReveal>
            </div>
        </Layout>
    );
}

