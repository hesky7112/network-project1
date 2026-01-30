import { useState, useEffect } from 'react';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Zap, Shield, Globe, Cpu, ArrowRight, Wifi, Book, Building, Briefcase } from '@/components/icons';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

const packageTemplates = [
    {
        id: 'isp',
        name: 'ISP / Fibre / Ethernet',
        icon: Globe,
        color: 'text-alien-green',
        bg: 'bg-alien-green/10',
        border: 'border-alien-green/20',
    },
    {
        id: 'hotspot',
        name: 'WISP / Hotspot',
        icon: Wifi,
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/20',
    },
    {
        id: 'enterprise',
        name: 'Enterprise / Business',
        icon: Building,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
    },
    {
        id: 'education',
        name: 'Education / Schools',
        icon: Book,
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
    }
];

export default function PricingPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await apiClient.getPricingPackages();
            const mapped = res.data.map((p: any) => {
                const template = packageTemplates.find(t => t.id === p.type) || packageTemplates[1];
                return {
                    ...template,
                    id: p.id,
                    type: p.type,
                    name: p.name,
                    description: p.description,
                    price: p.price_label || `KES ${p.price}`,
                    features: JSON.parse(p.features || "[]")
                };
            });
            setPlans(mapped);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Pricing & Packages | Alien Net">
            <div className="min-h-screen bg-[#000000] text-white py-12 px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="max-w-7xl mx-auto text-center mb-20">
                    <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter italic mb-6">
                        Access_Tier_Matrix
                    </h1>
                    <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] max-w-2xl mx-auto">
                        Comprehensive infrastructure packages designed for every connectivity tenant
                    </p>
                </div>

                {/* Pricing Grid */}
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                    {loading ? (
                        <div className="col-span-full text-center py-20 text-slate-500 uppercase tracking-widest text-xs font-black italic">
                            Scanning_Pricing_Matrix...
                        </div>
                    ) : plans.map((pkg: any) => (
                        <div
                            key={pkg.id}
                            className={cn(
                                "group relative bg-[#050505] border p-8 transition-all hover:translate-y-[-4px]",
                                pkg.border
                            )}
                            style={{ borderRadius: '4.5px' }}
                        >
                            {/* Decorative Corner */}
                            <div className={cn("absolute top-0 right-0 w-16 h-[1px] shadow-[0_0_10px_currentColor]", pkg.color)} />

                            <div className="flex items-start justify-between mb-8">
                                <div className={cn("p-4 border", pkg.bg, pkg.border)} style={{ borderRadius: '2px' }}>
                                    <pkg.icon className={cn("h-8 w-8", pkg.color)} />
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Service_Type</div>
                                    <div className={cn("text-xs font-black uppercase tracking-widest", pkg.color)}>{pkg.price}</div>
                                </div>
                            </div>

                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">{pkg.name}</h3>
                            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-loose mb-8 h-10 overflow-hidden">
                                {pkg.description}
                            </p>

                            <div className="space-y-4 mb-10">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
                                    <Zap className="h-3 w-3 text-alien-green" />
                                    Core_Inclusion_Set
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                    {pkg.features.map((feature: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <div className={cn("w-1 h-1 rounded-full", pkg.bg.replace('/10', ''))} />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button
                                className={cn(
                                    "w-full h-12 text-[11px] font-black uppercase tracking-[0.2em] transition-all",
                                    pkg.type === 'isp' ? "bg-alien-green text-black hover:bg-alien-green/90" : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                                )}
                                style={{ borderRadius: '2.5px' }}
                            >
                                PROVISION_RESOURCES <ArrowRight className="ml-3 h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Global Features Section */}
                <div className="max-w-7xl mx-auto bg-[#050505] border border-white/5 p-12 relative overflow-hidden" style={{ borderRadius: '4px' }}>
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-alien-green text-alien-green to-transparent opacity-20" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                        <div className="lg:col-span-1 space-y-6">
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Standard_Core_Architect</h2>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-loose">
                                Every package includes our base management layer, providing unified control across all infrastructure nodes.
                            </p>
                        </div>

                        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-8">
                            {[
                                { label: 'Real-time Telemetry', icon: Cpu },
                                { label: 'Management Dashboard', icon: Briefcase },
                                { label: 'Security Firewall', icon: Shield },
                                { label: 'Cloud Backups', icon: Globe },
                                { label: 'API Access', icon: Zap },
                                { label: '24/7 Monitoring', icon: Wifi }
                            ].map((item, idx) => (
                                <div key={idx} className="space-y-3">
                                    <item.icon className="h-5 w-5 text-alien-green" />
                                    <div className="text-[9px] font-black uppercase tracking-widest text-white">{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
