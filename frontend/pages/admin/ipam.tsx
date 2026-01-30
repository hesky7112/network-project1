import { useAuth } from '@/hooks/use-auth';
import { useMounted } from '@/hooks/use-mounted';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
    Plus,
    Search,
    Filter,
    Layers,
    Loader2,
    Database,
    Globe,
    Trash2
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { GlassWrapper } from '@/components/ui/motion-container';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

type IPPool = {
    id: number;
    name: string;
    subnet: string;
    gateway: string;
    start_ip: string;
    end_ip: string;
    type: string;
};

export default function IPAMPage() {
    useAuth();
    const mounted = useMounted();
    const [pools, setPools] = useState<IPPool[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPool, setNewPool] = useState({
        name: '',
        subnet: '',
        gateway: '',
        start_ip: '',
        end_ip: '',
        type: 'dynamic'
    });

    const fetchPools = async () => {
        setLoading(true);
        try {
            const resp = await apiClient.getIPPools();
            setPools(resp);
        } catch (err) {
            toast.error("Failed to fetch address blocks");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) fetchPools();
    }, [mounted]);

    const handleCreatePool = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.createIPPool(newPool);
            toast.success("Address block partitioned successfully");
            setIsModalOpen(false);
            setNewPool({
                name: '',
                subnet: '',
                gateway: '',
                start_ip: '',
                end_ip: '',
                type: 'dynamic'
            });
            fetchPools();
        } catch (err) {
            toast.error("Partitioning failed");
        }
    };

    const columns: ColumnDef<IPPool>[] = [
        {
            accessorKey: 'name',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Block_ID</span>,
            cell: ({ row }) => (
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/5 text-indigo-400" style={{ borderRadius: '1px' }}>
                        <Layers className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="text-[11px] font-black text-white uppercase tracking-wider italic">{row.original.name}</div>
                        <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{row.original.type}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'subnet',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subnet_Range</span>,
            cell: ({ row }) => (
                <span className="text-[10px] font-bold text-slate-400 font-mono italic">{row.original.subnet}</span>
            ),
        },
        {
            accessorKey: 'gateway',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gateway</span>,
            cell: ({ row }) => (
                <span className="text-[10px] font-bold text-slate-500 font-mono italic">{row.original.gateway || 'N/A'}</span>
            ),
        },
        {
            id: 'allocation',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Allocation</span>,
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-600">
                        <span>Range: {row.original.start_ip} - {row.original.end_ip}</span>
                    </div>
                    <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-indigo-500/50" />
                    </div>
                </div>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 group"
                        onClick={() => toast.success(`Scanning leases for ${row.original.name}`)}
                    >
                        <Database className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400" />
                    </Button>
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 group"
                    >
                        <Trash2 className="h-3.5 w-3.5 text-slate-500 group-hover:text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    if (!mounted) return null;

    return (
        <Layout title="IPAM_Controller">
            <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-8 relative overflow-hidden">
                {/* Background Visual Flair */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-500/5 blur-[100px] rounded-full pointer-events-none" />

                {/* HUD Header */}
                <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-32 h-[1px] bg-indigo-500 shadow-[0_0_15px_#6366f1]" />
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-sm">
                                    <Database className="h-6 w-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">IPAM_Space</h1>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Logical_Address_Space_Management</p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest h-12 px-8 rounded-sm transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                        >
                            <Plus className="mr-3 h-4 w-4" />
                            PARTITION_NEW_BLOCK
                        </Button>
                    </div>

                    {/* Filters HUD */}
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-8 border-t border-white/5 gap-6">
                        <div className="relative w-full max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="search"
                                placeholder="PROBE_NETWORKS..."
                                className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-3 text-[11px] font-black text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/30 transition-all rounded-sm italic"
                            />
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <Button variant="outline" className="flex-1 sm:flex-none bg-white/5 border-white/10 text-slate-400 text-[9px] font-black uppercase tracking-widest h-11 px-6 hover:bg-white/10 hover:border-white/20 rounded-sm transition-all">
                                <Filter className="mr-2 h-3.5 w-3.5" />
                                TYPE_FILTER
                            </Button>
                            <div className="h-6 w-[1px] bg-white/10 hidden sm:block mx-2" />
                            <div className="flex items-center gap-3">
                                <Globe className="h-4 w-4 text-indigo-400" />
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Global_Allocation: <span className="text-white">Active</span></div>
                            </div>
                        </div>
                    </div>
                </GlassWrapper>

                {/* Data Matrix */}
                <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm overflow-hidden p-0 min-h-[400px] flex flex-col items-center justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Retrieving_Pool_Heuristics...</span>
                        </div>
                    ) : (
                        <div className="alien-net-table overflow-x-auto w-full">
                            <DataTable columns={columns} data={pools} />
                        </div>
                    )}
                </GlassWrapper>

                {/* Create Pool Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <div className="bg-[#0a0a0c] border border-white/10 w-full max-w-md p-8 rounded-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-indigo-500/30" />
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic italic">PARTITION_BLOCK</h2>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1 italic">Defining_Logical_Boundary</p>
                            </div>

                            <form onSubmit={handleCreatePool} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Block_Designation</label>
                                    <input
                                        required
                                        value={newPool.name}
                                        onChange={e => setNewPool({ ...newPool, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-indigo-500/30 transition-all rounded-sm italic"
                                        placeholder="WIFI_USERS_VLAN_10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Subnet_CIDR</label>
                                    <input
                                        required
                                        value={newPool.subnet}
                                        onChange={e => setNewPool({ ...newPool, subnet: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-indigo-500/30 transition-all rounded-sm italic"
                                        placeholder="192.168.10.0/24"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Start_IP</label>
                                        <input
                                            required
                                            value={newPool.start_ip}
                                            onChange={e => setNewPool({ ...newPool, start_ip: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-indigo-500/30 transition-all rounded-sm italic"
                                            placeholder="192.168.10.100"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">End_IP</label>
                                        <input
                                            required
                                            value={newPool.end_ip}
                                            onChange={e => setNewPool({ ...newPool, end_ip: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-indigo-500/30 transition-all rounded-sm italic"
                                            placeholder="192.168.10.250"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Gateway_Interface</label>
                                    <input
                                        value={newPool.gateway}
                                        onChange={e => setNewPool({ ...newPool, gateway: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-indigo-500/30 transition-all rounded-sm italic"
                                        placeholder="192.168.10.1"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 border border-white/5 text-[10px] font-black uppercase tracking-widest h-12 rounded-sm hover:bg-white/5"
                                    >
                                        ABORT
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest h-12 rounded-sm hover:bg-indigo-500 transition-all"
                                    >
                                        PARTITION
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
