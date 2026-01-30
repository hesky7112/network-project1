import { useAuth } from '@/hooks/use-auth';
import { useMounted } from '@/hooks/use-mounted';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
    Plus,
    Search,
    Filter,
    Cpu,
    Activity,
    Loader2,
    Terminal,
    Trash2
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { GlassWrapper } from '@/components/ui/motion-container';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

type Device = {
    id: number;
    ip_address: string;
    mac_address: string;
    hostname: string;
    vendor: string;
    device_type: string;
    status: string;
    location: string;
};

export default function InventoryPage() {
    useAuth();
    const mounted = useMounted();
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDevice, setNewDevice] = useState({
        hostname: '',
        ip_address: '',
        device_type: 'router',
        vendor: 'Ubiquiti',
        location: '',
        status: 'online'
    });

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const resp = await apiClient.getDevices();
            setDevices(resp);
        } catch (err) {
            toast.error("Failed to fetch device matrix");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) fetchDevices();
    }, [mounted]);

    const handleCreateDevice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/devices', newDevice);
            toast.success("New node initialized in domain");
            setIsModalOpen(false);
            setNewDevice({
                hostname: '',
                ip_address: '',
                device_type: 'router',
                vendor: 'Ubiquiti',
                location: '',
                status: 'online'
            });
            fetchDevices();
        } catch (err) {
            toast.error("Initialization failed");
        }
    };

    const handleDeleteDevice = async (id: number) => {
        if (!confirm("Decommission this node from active service?")) return;
        try {
            await apiClient.deleteDevice(id);
            toast.success("Node decommissioned");
            fetchDevices();
        } catch (err) {
            toast.error("Decommissioning failed");
        }
    };

    const columns: ColumnDef<Device>[] = [
        {
            accessorKey: 'hostname',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Node_ID</span>,
            cell: ({ row }) => (
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/5 text-blue-400" style={{ borderRadius: '1px' }}>
                        <Cpu className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="text-[11px] font-black text-white uppercase tracking-wider italic">{row.original.hostname}</div>
                        <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{row.original.vendor}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'ip_address',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Spatial_Addr</span>,
            cell: ({ row }) => (
                <span className="text-[10px] font-bold text-slate-400 font-mono italic">{row.original.ip_address}</span>
            ),
        },
        {
            accessorKey: 'device_type',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Class</span>,
            cell: ({ row }) => (
                <span className="px-2 py-0.5 border border-white/5 bg-white/5 text-[8px] font-black uppercase tracking-widest text-slate-500">
                    {row.original.device_type}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vitals</span>,
            cell: ({ row }) => {
                const status = row.original.status?.toLowerCase() || 'offline';
                const isOnline = status === 'online' || status === 'active';
                return (
                    <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-earth-green animate-pulse" : "bg-red-500")} />
                        <span className={cn("text-[8px] font-black uppercase tracking-widest", isOnline ? "text-earth-green" : "text-red-500")}>
                            {status}
                        </span>
                    </div>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 border border-white/5 hover:border-earth-green/30 hover:bg-earth-green/5 group"
                        onClick={() => toast.success(`Initializing terminal proxy for ${row.original.hostname}`)}
                    >
                        <Terminal className="h-3.5 w-3.5 text-slate-500 group-hover:text-earth-green" />
                    </Button>
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 group"
                        onClick={() => handleDeleteDevice(row.original.id)}
                    >
                        <Trash2 className="h-3.5 w-3.5 text-slate-500 group-hover:text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    if (!mounted) return null;

    return (
        <Layout title="Inventory_Index">
            <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-8 relative overflow-hidden">
                {/* Background Visual Flair */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-stardust-violet/5 blur-[100px] rounded-full pointer-events-none" />

                {/* HUD Header */}
                <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-32 h-[1px] bg-blue-500 shadow-[0_0_15px_#3b82f6]" />
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-sm">
                                    <Cpu className="h-6 w-6 text-blue-400" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Node_Inventory</h1>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Active_Critical_Infrastructure_Log</p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest h-12 px-8 rounded-sm transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        >
                            <Plus className="mr-3 h-4 w-4" />
                            ADD_NETWORK_NODE
                        </Button>
                    </div>

                    {/* Filters HUD */}
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-8 border-t border-white/5 gap-6">
                        <div className="relative w-full max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="search"
                                placeholder="PROBE_INFRASTRUCTURE..."
                                className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-3 text-[11px] font-black text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500/30 transition-all rounded-sm italic"
                            />
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <Button variant="outline" className="flex-1 sm:flex-none bg-white/5 border-white/10 text-slate-400 text-[9px] font-black uppercase tracking-widest h-11 px-6 hover:bg-white/10 hover:border-white/20 rounded-sm transition-all">
                                <Filter className="mr-2 h-3.5 w-3.5" />
                                CLASS_FILTER
                            </Button>
                            <div className="h-6 w-[1px] bg-white/10 hidden sm:block mx-2" />
                            <div className="flex items-center gap-3">
                                <Activity className="h-4 w-4 text-emerald-500" />
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Inventory_State: <span className="text-white">{loading ? 'SYNCING...' : 'NORMALIZED'}</span></div>
                            </div>
                        </div>
                    </div>
                </GlassWrapper>

                {/* Data Matrix */}
                <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm overflow-hidden p-0 min-h-[400px] flex flex-col items-center justify-center relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
                    {loading ? (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Retrieving_Device_Log...</span>
                        </div>
                    ) : (
                        <div className="alien-net-table overflow-x-auto w-full relative z-10">
                            <DataTable columns={columns} data={devices} />
                        </div>
                    )}
                </GlassWrapper>

                {/* Create Device Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <div className="bg-[#0a0a0c] border border-white/10 w-full max-w-md p-8 rounded-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/30" />
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic italic">INITIALIZE_NODE</h2>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1 italic">Registering_Spatial_Entity</p>
                            </div>

                            <form onSubmit={handleCreateDevice} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Hostname_Reference</label>
                                    <input
                                        required
                                        value={newDevice.hostname}
                                        onChange={e => setNewDevice({ ...newDevice, hostname: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-blue-500/30 transition-all rounded-sm italic"
                                        placeholder="NODE_ALPHA"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">IPv4_Address</label>
                                    <input
                                        required
                                        value={newDevice.ip_address}
                                        onChange={e => setNewDevice({ ...newDevice, ip_address: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-blue-500/30 transition-all rounded-sm italic"
                                        placeholder="10.0.0.1"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Entity_Class</label>
                                        <select
                                            value={newDevice.device_type}
                                            onChange={e => setNewDevice({ ...newDevice, device_type: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-blue-500/30 transition-all rounded-sm italic"
                                        >
                                            <option value="router" className="bg-[#0a0a0c]">ROUTER</option>
                                            <option value="switch" className="bg-[#0a0a0c]">SWITCH</option>
                                            <option value="ap" className="bg-[#0a0a0c]">ACCESS_PT</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Vendor_Origin</label>
                                        <select
                                            value={newDevice.vendor}
                                            onChange={e => setNewDevice({ ...newDevice, vendor: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-blue-500/30 transition-all rounded-sm italic"
                                        >
                                            <option value="Ubiquiti" className="bg-[#0a0a0c]">UBIQUITI</option>
                                            <option value="MikroTik" className="bg-[#0a0a0c]">MIKROTIK</option>
                                            <option value="Cisco" className="bg-[#0a0a0c]">CISCO</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Spatial_Coordinate</label>
                                    <input
                                        value={newDevice.location}
                                        onChange={e => setNewDevice({ ...newDevice, location: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-blue-500/30 transition-all rounded-sm italic"
                                        placeholder="Sector_7_Building_A"
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
                                        className="flex-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest h-12 rounded-sm hover:bg-blue-500 transition-all"
                                    >
                                        INITIALIZE
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
