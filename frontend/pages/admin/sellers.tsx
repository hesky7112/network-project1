import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
    ShieldCheck,
    ShieldAlert,
    CheckCircle2,
    MoreHorizontal,
    Award,
    Activity,
    ChevronRight,
    Search as SearchIcon,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlurReveal, GlassWrapper, StaggerList, StaggerItem, CountUp, SoftLift } from '@/components/ui/motion-container';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

type Merchant = {
    id: string;
    username: string;
    email: string;
    role: string;
    created_at: string;
};

export default function SellerVerification() {
    const [queue, setQueue] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchMerchants = async () => {
        setLoading(true);
        try {
            const resp = await apiClient.get<Merchant[]>('/rbac/admin/merchants');
            setQueue(resp);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMerchants();
    }, []);

    const handleVerify = async (id: string, verify: boolean) => {
        try {
            if (verify) {
                await apiClient.post(`/rbac/admin/merchants/${id}/verify`);
                toast.success("Merchant authorized in matrix");
            } else {
                await apiClient.post(`/rbac/admin/merchants/${id}/deny`);
                toast.success("Merchant access denied");
            }
            fetchMerchants();
        } catch (e) {
            toast.error("Handshake failed");
        }
    };

    const filteredQueue = queue.filter(item =>
        item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Layout title="Merchant_Authority_Hub">
            <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-12 relative overflow-hidden">
                {/* Background Visual Flair */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-stardust-violet/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-earth-green/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />

                <BlurReveal>
                    <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                        {/* HUD Header */}
                        <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-32 h-[1px] bg-earth-green shadow-[0_0_15px_#22d3ee]" />
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-earth-green/10 border border-earth-green/20 rounded-sm">
                                        <ShieldCheck className="h-8 w-8 text-earth-green" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                                            Merchant_<span className="text-earth-green">Authority</span>_Hub
                                        </h1>
                                        <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mt-2 italic">
                                            Vetting terminal for marketplace vendors and certified_agents
                                        </p>
                                    </div>
                                </div>

                                <div className="relative group min-w-[300px]">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-earth-green transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Identify_Vendor_ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-white/[0.02] border border-white/5 pl-12 pr-6 py-4 text-[10px] font-black text-white uppercase tracking-widest focus:outline-none focus:border-earth-green/30 w-full rounded-sm placeholder:text-slate-700 italic"
                                    />
                                </div>
                            </div>
                        </GlassWrapper>

                        {/* Summary Metrics */}
                        <StaggerList className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                            <StaggerItem>
                                <SoftLift>
                                    <GlassWrapper className="bg-[#0a0a0c] border-white/5 p-8 rounded-sm relative overflow-hidden group hover:border-amber-500/30 transition-all">
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 italic">Active_Merchants</h4>
                                        <div className="flex items-end justify-between">
                                            <div className="text-5xl font-black text-white italic tracking-tighter">
                                                <CountUp value={queue.length} />
                                            </div>
                                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic flex items-center gap-2 mb-2 bg-amber-500/10 px-3 py-1 border border-amber-500/20 rounded-sm">
                                                <ShieldAlert className="h-3 w-3" /> Live_Nodes
                                            </span>
                                        </div>
                                    </GlassWrapper>
                                </SoftLift>
                            </StaggerItem>

                            <StaggerItem>
                                <SoftLift>
                                    <GlassWrapper className="bg-[#0a0a0c] border-white/5 p-8 rounded-sm relative overflow-hidden group hover:border-earth-green/30 transition-all">
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-earth-green/20 to-transparent" />
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 italic">Approved_Tier</h4>
                                        <div className="flex items-end justify-between">
                                            <div className="text-5xl font-black text-white italic tracking-tighter">
                                                <CountUp value={queue.filter(i => i.role === 'merchant').length} />
                                            </div>
                                            <span className="text-[10px] font-black text-earth-green uppercase tracking-widest italic flex items-center gap-2 mb-2 bg-earth-green/10 px-3 py-1 border border-earth-green/20 rounded-sm">
                                                <CheckCircle2 className="h-3 w-3" /> Verified
                                            </span>
                                        </div>
                                    </GlassWrapper>
                                </SoftLift>
                            </StaggerItem>

                            <StaggerItem>
                                <SoftLift>
                                    <GlassWrapper className="bg-[#0a0a0c] border-white/5 p-8 rounded-sm relative overflow-hidden group hover:border-stardust-violet/30 transition-all">
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-stardust-violet/20 to-transparent" />
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 italic">Community_Trust</h4>
                                        <div className="flex items-end justify-between">
                                            <div className="text-5xl font-black text-white italic tracking-tighter">98.4%</div>
                                            <span className="text-[10px] font-black text-stardust-violet uppercase tracking-widest italic flex items-center gap-2 mb-2 bg-stardust-violet/10 px-3 py-1 border border-stardust-violet/20 rounded-sm">
                                                <Award className="h-3 w-3" /> Excellence_Level
                                            </span>
                                        </div>
                                    </GlassWrapper>
                                </SoftLift>
                            </StaggerItem>
                        </StaggerList>

                        {/* Main Queue Terminal */}
                        <StaggerItem>
                            <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm overflow-hidden relative min-h-[400px]">
                                <div className="px-8 py-6 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic">VERIFICATION_PROTOCOL_QUEUE</h3>
                                    <div className="flex gap-2">
                                        <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_#22d3ee]", loading ? "bg-amber-500 animate-pulse" : "bg-earth-green")} />
                                        <div className="w-2 h-2 rounded-full bg-slate-800" />
                                        <div className="w-2 h-2 rounded-full bg-slate-800" />
                                    </div>
                                </div>
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                                        <Loader2 className="h-8 w-8 text-earth-green animate-spin" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Probing_Merchant_Matrix...</span>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-white/5 bg-white/[0.01]">
                                                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Agent_Entity</th>
                                                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Email_Node</th>
                                                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Access_Level</th>
                                                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-right">Verification_Auth</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {filteredQueue.map((item) => (
                                                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn(
                                                                    "h-1.5 w-1.5 rounded-full shadow-[0_0_10px_currentColor]",
                                                                    item.role === 'merchant' ? "text-earth-green bg-earth-green" : "text-amber-500 bg-amber-500 animate-pulse"
                                                                )} />
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest italic group-hover:text-earth-green transition-colors">{item.username}</span>
                                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">{item.role === 'merchant' ? 'VERIFIED' : 'PENDING'}_MODE</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic font-mono group-hover:text-slate-400 transition-colors">{item.email}</span>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic border border-white/5 px-3 py-1 bg-white/[0.02] rounded-sm">{item.role}</span>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center justify-end gap-3">
                                                                {item.role !== 'merchant' && (
                                                                    <>
                                                                        <Button
                                                                            onClick={() => handleVerify(item.id, true)}
                                                                            className="h-8 px-6 bg-earth-green text-black text-[9px] font-black uppercase tracking-widest italic hover:bg-earth-green/90 rounded-sm shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                                                                        >
                                                                            Verify_Agent
                                                                        </Button>
                                                                        <Button
                                                                            onClick={() => handleVerify(item.id, false)}
                                                                            variant="ghost"
                                                                            className="h-8 px-6 text-cosmic-red hover:bg-cosmic-red/10 text-[9px] font-black uppercase tracking-widest italic rounded-sm border border-transparent hover:border-cosmic-red/30"
                                                                        >
                                                                            Deny_Access
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                {item.role === 'merchant' && (
                                                                    <button className="p-2 text-slate-600 hover:text-white transition-all hover:bg-white/5 rounded-sm">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredQueue.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="p-20 text-center">
                                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic">No_Agents_Detected_In_Sector</span>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </GlassWrapper>
                        </StaggerItem>

                        {/* Footer Operational Insight */}
                        <StaggerItem>
                            <GlassWrapper className="flex items-center gap-6 p-8 bg-stardust-violet/[0.02] border border-stardust-violet/20 rounded-sm relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-12 h-[1px] bg-stardust-violet shadow-[0_0_10px_#8b5cf6]" />
                                <div className="p-3 bg-stardust-violet/10 border border-stardust-violet/20 rounded-sm">
                                    <Activity className="h-5 w-5 text-stardust-violet" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] italic">System_Operational_Intelligence</span>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic leading-relaxed group-hover:text-slate-400 transition-colors">
                                        Protocol_Alpha: Approved sellers gain immediate access to Inventory_Unit and Sales_Waveform dashboards for decentralized distribution.
                                    </p>
                                </div>
                                <ChevronRight className="ml-auto h-5 w-5 text-slate-800 group-hover:text-stardust-violet transition-colors" />
                            </GlassWrapper>
                        </StaggerItem>
                    </div>
                </BlurReveal>
            </div>
        </Layout>
    );
}

