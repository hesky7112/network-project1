import React, { useState } from 'react';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
    LayoutDashboard,
    Package,
    Plus,
    TrendingUp,
    Users,
    ShieldAlert,
    MoreHorizontal,
    Edit,
    Trash2,
    Activity
} from '@/components/icons';
import { cn } from '@/lib/utils';
import TokenMeter from '@/components/billing/TokenMeter';

export default function SellerDashboard() {
    const [view, setView] = useState<'inventory' | 'stats'>('inventory');

    const { data: stats, isLoading } = useQuery({
        queryKey: ['seller-stats'],
        queryFn: () => apiClient.getSellerStats(),
        refetchInterval: 10000 // Every 10 seconds
    });

    const sellerStats = {
        totalSales: stats?.total_sales || 0,
        activeProducts: stats?.active_products || 0,
        rating: stats?.rating || 0,
        isVerified: stats?.is_verified || false,
        revenue: stats?.revenue || 0
    };

    const myProducts = stats?.products || [];

    if (isLoading) {
        return <Layout title="Seller_Hub"><div className="flex items-center justify-center min-h-[400px] text-indigo-400 font-mono text-xs animate-pulse">Establishing_Secure_Link...</div></Layout>;
    }

    return (
        <Layout title="Seller_Hub">
            <div className="flex flex-col gap-8">
                {/* Verification Notice */}
                {!sellerStats.isVerified && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderRadius: '4px' }}>
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="h-5 w-5 text-amber-500" />
                            <div>
                                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Verification_Pending</h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    Your account is currently under review by Super Admins. Features are limited.
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" className="h-8 px-4 text-[9px] font-black uppercase tracking-widest border-amber-500/20 text-amber-500 hover:bg-amber-500/10">
                            Check_Status
                        </Button>
                    </div>
                )}

                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-2 text-indigo-400">
                            <LayoutDashboard className="h-6 w-6" />
                            Vendor_Unit_01
                        </h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                            Management terminal for verified marketplace sellers
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest h-9"
                            style={{ borderRadius: '2px' }}
                        >
                            <Plus className="mr-2 h-3.5 w-3.5" /> List_New_Asset
                        </Button>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <TokenMeter
                        value={sellerStats.isVerified ? 100 : 45}
                        label="Store_Health_Index"
                        unit="%"
                        color="#818CF8"
                        subLabel={sellerStats.isVerified ? "Verified_Merchant" : "Unverified"}
                    />

                    <div className="bg-[#050505] border border-white/5 p-6 flex flex-col justify-between" style={{ borderRadius: '4px' }}>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total_Asset_Revenue</h4>
                            <div className="text-3xl font-black text-white tracking-tighter italic">KES {sellerStats.revenue.toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-1.5 text-green-500 text-[9px] font-black uppercase tracking-widest mt-4">
                            <TrendingUp className="h-3 w-3" /> Growth_Stable
                        </div>
                    </div>

                    <div className="bg-[#050505] border border-white/5 p-6 flex flex-col justify-between" style={{ borderRadius: '4px' }}>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total_Sales</h4>
                            <div className="text-3xl font-black text-white tracking-tighter italic">{sellerStats.totalSales}</div>
                        </div>
                        <div className="flex items-center gap-1.5 text-indigo-400 text-[9px] font-black uppercase tracking-widest mt-4">
                            <Users className="h-3 w-3" /> Active_Subscriptions
                        </div>
                    </div>

                    <div className="bg-[#050505] border border-white/5 p-6 flex flex-col justify-between" style={{ borderRadius: '4px' }}>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Peer_Rating</h4>
                            <div className="text-3xl font-black text-white tracking-tighter italic">{sellerStats.rating.toFixed(1)}</div>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-black uppercase tracking-widest mt-4">
                            <Activity className="h-3 w-3" /> Performance_Nominal
                        </div>
                    </div>
                </div>

                {/* Sub-Navigation */}
                <div className="flex border-b border-white/5 gap-8">
                    <button
                        onClick={() => setView('inventory')}
                        className={cn(
                            "pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                            view === 'inventory' ? "text-indigo-400" : "text-slate-500 hover:text-white"
                        )}
                    >
                        Active_Inventory
                        {view === 'inventory' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" />}
                    </button>
                    <button
                        onClick={() => setView('stats')}
                        className={cn(
                            "pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                            view === 'stats' ? "text-indigo-400" : "text-slate-500 hover:text-white"
                        )}
                    >
                        Sales_Waveform
                        {view === 'stats' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" />}
                    </button>
                </div>

                {/* Inventory Table */}
                {view === 'inventory' && (
                    <div className="bg-[#050505] border border-white/5 overflow-hidden" style={{ borderRadius: '4px' }}>
                        <table className="w-full text-left">
                            <thead className="bg-[#080808] border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Asset_Identifier</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Pricing</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Supply_Index</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Tactical</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {myProducts.map((product: any) => (
                                    <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center" style={{ borderRadius: '1.5px' }}>
                                                    <Package className="h-4 w-4 text-indigo-400" />
                                                </div>
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{product.category}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[11px] font-black text-white italic">{product.price} T</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold text-slate-400">{product.stock} units</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 px-2 py-0.5 bg-green-500/10 border border-green-500/20 w-fit" style={{ borderRadius: '1.5px' }}>
                                                <div className="h-1 w-1 bg-green-500 rounded-full animate-pulse" />
                                                <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">{product.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5" style={{ borderRadius: '1.5px' }}><Edit className="h-3.5 w-3.5" /></button>
                                                <button className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/5" style={{ borderRadius: '1.5px' }}><Trash2 className="h-3.5 w-3.5" /></button>
                                                <button className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-400/5" style={{ borderRadius: '1.5px' }}><MoreHorizontal className="h-3.5 w-3.5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Sales Waveform (Placeholder) */}
                {view === 'stats' && (
                    <div className="h-96 bg-[#050505] border border-white/5 flex flex-col items-center justify-center p-12 text-center" style={{ borderRadius: '4px' }}>
                        <div className="p-6 bg-indigo-500/10 mb-6" style={{ borderRadius: '50%' }}>
                            <TrendingUp className="h-12 w-12 text-indigo-400" />
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">Advanced_Analytics_Offline</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-sm mb-8">
                            Detailed sales visualizations require verified vendor status level 2. Continue selling to unlock.
                        </p>
                        <Button variant="outline" className="text-[10px] font-black uppercase tracking-widest border-white/10 hover:border-indigo-400 hover:text-indigo-400">
                            Upgrade_Access_Unit
                        </Button>
                    </div>
                )}
            </div>
        </Layout>
    );
}
