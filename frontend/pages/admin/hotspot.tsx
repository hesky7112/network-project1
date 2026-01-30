import { useAuth } from '@/hooks/use-auth';
import { useMounted } from '@/hooks/use-mounted';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
    Plus,
    Search,
    Zap,
    Activity,
    Loader2,
    Package,
    CreditCard,
    Wifi,
    Trash2,
    Edit2,
    Copy,
    RefreshCw
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { GlassWrapper } from '@/components/ui/motion-container';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

type PricingPackage = {
    id: number;
    name: string;
    type: string;
    price: number;
    duration: number;
    data_limit: number;
    download_speed: number;
    upload_speed: number;
    is_active: boolean;
};

export default function HotspotAdminPage() {
    useAuth();
    const mounted = useMounted();
    const [packages, setPackages] = useState<PricingPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [selectedPackageId, setSelectedPackageId] = useState<string>('');
    const [generatedVoucher, setGeneratedVoucher] = useState<{ code: string; expiry: string } | null>(null);
    const [newPackage, setNewPackage] = useState({
        name: '',
        type: 'hotspot',
        price: 0,
        duration: 1440,
        data_limit: 0,
        download_speed: 5000,
        upload_speed: 2000,
        is_active: true
    });

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const resp = await apiClient.get<PricingPackage[]>('/hotspot/packages');
            setPackages(resp);
        } catch (err) {
            toast.error("Failed to load service packages");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) fetchPackages();
    }, [mounted]);

    const handleCreatePackage = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/hotspot/packages', newPackage);
            toast.success("New service protocol deployed");
            setIsModalOpen(false);
            fetchPackages();
        } catch (err) {
            toast.error("Deployment failed");
        }
    };

    const handleGenerateVoucher = async () => {
        if (!selectedPackageId) {
            toast.error("Select a protocol first");
            return;
        }

        const code = Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();

        try {
            await apiClient.post('/hotspot/vouchers', {
                code: code,
                package_id: parseInt(selectedPackageId)
            });
            setGeneratedVoucher({
                code: code,
                expiry: "Valid until used" // Backend handles actual expiry calculation on redemption
            });
            toast.success("Access token generated");
        } catch (err) {
            toast.error("Generation failed");
            console.error(err);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to buffer");
    };

    const columns: ColumnDef<PricingPackage>[] = [
        {
            accessorKey: 'name',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Protocol_Name</span>,
            cell: ({ row }) => (
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/5 text-amber-500" style={{ borderRadius: '1px' }}>
                        <Zap className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="text-[11px] font-black text-white uppercase tracking-wider italic">{row.original.name}</div>
                        <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{row.original.type}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'price',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Credit_Value</span>,
            cell: ({ row }) => (
                <span className="text-[11px] font-black text-amber-500 italic">KES {row.original.price}</span>
            ),
        },
        {
            accessorKey: 'download_speed',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bandwidth</span>,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white italic">D: {row.original.download_speed / 1000} Mbps</span>
                    <span className="text-[9px] font-bold text-slate-600 italic">U: {row.original.upload_speed / 1000} Mbps</span>
                </div>
            ),
        },
        {
            accessorKey: 'is_active',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</span>,
            cell: ({ row }) => (
                <span className={cn(
                    "px-2 py-0.5 border text-[8px] font-black uppercase tracking-widest",
                    row.original.is_active ? "border-earth-green/30 bg-earth-green/10 text-earth-green" : "border-red-500/30 bg-red-500/10 text-red-500"
                )} style={{ borderRadius: '1px' }}>
                    {row.original.is_active ? 'DEPLOYED' : 'DEACTIVATED'}
                </span>
            ),
        },
        {
            id: 'actions',
            cell: () => (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" className="h-8 w-8 p-0 border border-white/5 hover:bg-white/5">
                        <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                    </Button>
                    <Button variant="ghost" className="h-8 w-8 p-0 border border-white/5 hover:bg-red-500/10 group">
                        <Trash2 className="h-3.5 w-3.5 text-slate-500 group-hover:text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    if (!mounted) return null;

    return (
        <Layout title="Service_Protocol_Manager">
            <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-8 relative overflow-hidden">
                {/* Background Visual Flair */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-600/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-600/5 blur-[100px] rounded-full pointer-events-none" />

                {/* HUD Header */}
                <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-32 h-[1px] bg-amber-500 shadow-[0_0_15px_#f59e0b]" />
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-sm">
                                    <Package className="h-6 w-6 text-amber-500" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Service_Marketplace</h1>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Provisioning_Protocol_Definition</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setGeneratedVoucher(null);
                                    setIsVoucherModalOpen(true);
                                }}
                                className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest h-12 px-8 rounded-sm"
                            >
                                <CreditCard className="mr-3 h-4 w-4" />
                                VOUCHER_GEN
                            </Button>
                            <Button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-amber-600 hover:bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest h-12 px-8 rounded-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                            >
                                <Plus className="mr-3 h-4 w-4" />
                                DEPLOY_NEW_PROTOCOL
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-8 border-t border-white/5 gap-6">
                        <div className="relative w-full max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                            <input
                                type="search"
                                placeholder="PROBE_PACKAGES..."
                                className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-3 text-[11px] font-black text-white placeholder:text-slate-700 focus:outline-none focus:border-amber-600/30 transition-all rounded-sm italic"
                            />
                        </div>
                        <div className="flex items-center gap-8 w-full sm:w-auto">
                            <div className="flex items-center gap-3">
                                <Wifi className="h-4 w-4 text-blue-400" />
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Signal: <span className="text-white">Active</span></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Activity className="h-4 w-4 text-earth-green" />
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Sync: <span className="text-white">100%</span></div>
                            </div>
                        </div>
                    </div>
                </GlassWrapper>

                {/* Data Matrix */}
                <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm overflow-hidden p-0 min-h-[400px] flex flex-col items-center justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Retrieving_Service_Index...</span>
                        </div>
                    ) : (
                        <div className="alien-net-table overflow-x-auto w-full">
                            <DataTable columns={columns} data={packages} />
                        </div>
                    )}
                </GlassWrapper>

                {/* Create Package Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <div className="bg-[#0a0a0c] border border-white/10 w-full max-w-lg p-8 rounded-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-amber-500/30" />
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic italic">DEFINE_PROTOCOL</h2>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1 italic">Deploying_New_Package_Logic</p>
                            </div>

                            <form onSubmit={handleCreatePackage} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Protocol_ID</label>
                                        <input
                                            required
                                            value={newPackage.name}
                                            onChange={e => setNewPackage({ ...newPackage, name: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-amber-500/30 transition-all rounded-sm italic"
                                            placeholder="ULTRA_FAST_24H"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Credit_Cost (KES)</label>
                                        <input
                                            required
                                            type="number"
                                            value={newPackage.price}
                                            onChange={e => setNewPackage({ ...newPackage, price: parseFloat(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-amber-500/30 transition-all rounded-sm italic"
                                            placeholder="100"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Downlink_Limit (Kbps)</label>
                                        <input
                                            required
                                            type="number"
                                            value={newPackage.download_speed}
                                            onChange={e => setNewPackage({ ...newPackage, download_speed: parseInt(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-amber-500/30 transition-all rounded-sm italic"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Uplink_Limit (Kbps)</label>
                                        <input
                                            required
                                            type="number"
                                            value={newPackage.upload_speed}
                                            onChange={e => setNewPackage({ ...newPackage, upload_speed: parseInt(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-amber-500/30 transition-all rounded-sm italic"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Duration (Min)</label>
                                        <input
                                            required
                                            type="number"
                                            value={newPackage.duration}
                                            onChange={e => setNewPackage({ ...newPackage, duration: parseInt(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-amber-500/30 transition-all rounded-sm italic"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Service_Class</label>
                                        <select
                                            value={newPackage.type}
                                            onChange={e => setNewPackage({ ...newPackage, type: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-amber-500/30 transition-all rounded-sm italic"
                                        >
                                            <option value="hotspot" className="bg-[#0a0a0c]">HOTSPOT</option>
                                            <option value="pppoe" className="bg-[#0a0a0c]">PPPOE</option>
                                            <option value="enterprise" className="bg-[#0a0a0c]">ENTERPRISE</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 border border-white/5 text-[10px] font-black uppercase tracking-widest h-12 rounded-sm hover:bg-white/5"
                                    >
                                        ABORT_SYNC
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-amber-600 text-black text-[10px] font-black uppercase tracking-widest h-12 rounded-sm hover:bg-amber-500 transition-all"
                                    >
                                        DEPLOY_PROTOCOL
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Voucher Generator Modal */}
                {isVoucherModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <div className="bg-[#0a0a0c] border border-white/10 w-full max-w-lg p-8 rounded-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-amber-500/30" />
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic italic">GENERATE_ACCESS_TOKEN</h2>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1 italic">Single_Use_Authentication_Key</p>
                            </div>

                            {!generatedVoucher ? (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Select_Service_Protocol</label>
                                        <select
                                            value={selectedPackageId}
                                            onChange={e => setSelectedPackageId(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-amber-500/30 transition-all rounded-sm italic"
                                        >
                                            <option value="" className="bg-[#0a0a0c]">SELECT_PROTOCOL</option>
                                            {packages.filter(p => p.is_active).map(pkg => (
                                                <option key={pkg.id} value={pkg.id} className="bg-[#0a0a0c]">
                                                    {pkg.name} ({pkg.duration} MIN / {pkg.price} KES)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setIsVoucherModalOpen(false)}
                                            className="flex-1 border border-white/5 text-[10px] font-black uppercase tracking-widest h-12 rounded-sm hover:bg-white/5"
                                        >
                                            ABORT
                                        </Button>
                                        <Button
                                            onClick={handleGenerateVoucher}
                                            className="flex-1 bg-amber-600 text-black text-[10px] font-black uppercase tracking-widest h-12 rounded-sm hover:bg-amber-500 transition-all"
                                        >
                                            GENERATE_KEY
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center">
                                        <RefreshCw className="h-8 w-8 text-amber-500" />
                                    </div>

                                    <div className="space-y-2 w-full">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Access_Token_Generated</span>
                                        <div
                                            onClick={() => copyToClipboard(generatedVoucher.code)}
                                            className="w-full bg-white/5 border border-white/10 p-6 rounded-sm cursor-pointer hover:bg-white/10 hover:border-amber-500/50 transition-all group relative"
                                        >
                                            <h3 className="text-3xl font-mono font-black text-white tracking-widest">{generatedVoucher.code}</h3>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Copy className="h-4 w-4 text-slate-400" />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => {
                                            setGeneratedVoucher(null);
                                            // Optional: setIsVoucherModalOpen(false);
                                        }}
                                        className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest h-12 rounded-sm"
                                    >
                                        GENERATE_ANOTHER
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
