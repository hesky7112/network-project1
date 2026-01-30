import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
    ShoppingCart,
    Search,
    Zap,
    Star,
    Package,
    ArrowRight,
    Loader2,
    Info,
    Code,
    Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api';
import { Module } from '@/types';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';

// Custom icons or generic ones if lucide doesn't have them
const CategoryIcons: Record<string, string> = {
    'church': '⛪',
    'school': '🎓',
    'healthcare': '🏥',
    'retail': '🛒',
    'business': '🏢',
    'security': '🔒',
    'analytics': '📊',
    'network': '🌐',
    'events': '🎫',
    'compliance': '✅',
};

export default function Marketplace() {
    const [modules, setModules] = useState<Module[]>([]);
    const [categories, setCategories] = useState<{ id: string, name: string, icon: string }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedModule, setSelectedModule] = useState<Module | null>(null);
    const [ownedModuleIds, setOwnedModuleIds] = useState<Set<string>>(new Set());
    const [monetizationEnabled, setMonetizationEnabled] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [modulesRes, categoriesRes, settingsRes] = await Promise.all([
                    apiClient.get('/modules'),
                    apiClient.get('/modules/categories'),
                    apiClient.getSettings()
                ]);

                // Response structure might be different based on handler.go
                setModules(modulesRes.modules || []);
                setCategories([{ id: 'All', name: 'All', icon: '🌐' }, ...categoriesRes]);

                // Handle monetization setting
                // Settings returns { monetization_enabled: "true", ... }
                const isMonetizationEnabled = settingsRes.monetization_enabled === 'true' || settingsRes.monetization_enabled === true;
                setMonetizationEnabled(isMonetizationEnabled);

                // Fetch licenses
                try {
                    const licensesRes = await apiClient.get('/modules/licenses');
                    if (Array.isArray(licensesRes)) {
                        setOwnedModuleIds(new Set(licensesRes.map((l: any) => l.module_id)));
                    }
                } catch (e) {
                    console.warn("Failed to fetch licenses", e);
                }
            } catch (err) {
                console.error('Failed to fetch marketplace data:', err);
                toast.error('Failed to load marketplace. Check if backend is running.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredModules = modules.filter(m => {
        const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handlePurchase = async (module: Module) => {
        try {
            await apiClient.post(`/modules/${module.id}/purchase`, {
                license_type: module.license_type === 'lease' ? 'lease' : 'purchase',
                transaction_id: 'MOCK_' + Math.random().toString(36).substring(7).toUpperCase()
            });
            toast.success(`Module ${module.name} licensed successfully!`);
            setOwnedModuleIds(prev => new Set(prev).add(module.id));
        } catch (err) {
            toast.error('Purchase failed. Insufficient tokens?');
        }
    };

    return (
        <Layout title="Module Marketplace">
            <div className="flex flex-col gap-8">
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                            <ShoppingCart className="h-7 w-7 text-stardust-violet" />
                            Alien_Module_Marketplace
                        </h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                            Deploy high-performance mini-apps using Master Primitives
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-stardust-violet transition-colors" />
                            <input
                                type="text"
                                placeholder="Search_Modules..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-oled-black border border-white/5 pl-10 pr-4 py-2 text-[10px] font-black text-white uppercase tracking-widest focus:outline-none focus:border-stardust-violet/30 w-full sm:w-64"
                                style={{ borderRadius: '2px' }}
                            />
                        </div>
                        <Button
                            onClick={() => router.push('/studio/create')}
                            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest"
                            style={{ borderRadius: '2px' }}
                        >
                            <Package className="mr-2 h-4 w-4 text-stardust-violet" /> Create_Module
                        </Button>
                    </div>
                </div>

                {/* Categories Scrollable Area */}
                <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar mask-fade-right">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                                selectedCategory === cat.id
                                    ? "bg-stardust-violet text-black border-stardust-violet"
                                    : "bg-oled-black text-slate-500 border-white/5 hover:border-white/10 hover:text-white"
                            )}
                            style={{ borderRadius: '2px' }}
                        >
                            <span className="text-sm">{cat.icon}</span>
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-8 w-8 text-stardust-violet animate-spin" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Synching_With_Neural_Registry...</span>
                    </div>
                ) : filteredModules.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/5" style={{ borderRadius: '4px' }}>
                        <Package className="h-10 w-10 text-slate-800 mx-auto mb-4" />
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">No_Modules_Found</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {filteredModules.map(module => (
                            <div
                                key={module.id}
                                className="bg-oled-black border border-white/5 group hover:border-stardust-violet/30 hover:bg-white/[0.01] transition-all duration-300 relative overflow-hidden"
                                style={{ borderRadius: '4px' }}
                            >
                                {/* Background Glow */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-stardust-violet/5 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                {/* Module Icons & Badge */}
                                <div className="h-32 bg-oled-black border-b border-white/5 relative flex items-center justify-center">
                                    <div className="absolute top-3 left-3 flex gap-1">
                                        {module.requires_hal && <div className="p-1 bg-cyber-blue/20 border border-cyber-blue/30" style={{ borderRadius: '2px' }} title="Requires HAL">
                                            <Zap className="h-3 w-3 text-cyber-blue" />
                                        </div>}
                                        {module.requires_gpu && <div className="p-1 bg-earth-green/20 border border-earth-green/30" style={{ borderRadius: '2px' }} title="Requires GPU">
                                            <Star className="h-3 w-3 text-earth-green" fill="currentColor" />
                                        </div>}
                                    </div>

                                    <div className="text-4xl group-hover:scale-110 transition-transform duration-500">
                                        {CategoryIcons[module.category] || '📦'}
                                    </div>

                                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 bg-black/60 border border-white/5 backdrop-blur-sm" style={{ borderRadius: '1.5px' }}>
                                        <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
                                        <span className="text-[9px] font-black text-white">{module.rating.toFixed(1)}</span>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{module.category}</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs font-black text-white tracking-widest">{module.price}</span>
                                            <span className="text-[8px] font-black text-stardust-violet uppercase tracking-widest">Tokens</span>
                                        </div>
                                    </div>

                                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1 group-hover:text-stardust-violet transition-colors">
                                        {module.name}
                                    </h3>
                                    <p className="text-[9px] font-bold text-slate-500 line-clamp-2 leading-relaxed mb-4 h-8">
                                        {module.description}
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedModule(module)}
                                            className="h-8 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5"
                                            style={{ borderRadius: '2px' }}
                                        >
                                            <Info className="h-3 w-3 mr-1.5 text-stardust-violet" />
                                            Details
                                        </Button>
                                        <Button
                                            onClick={() => ownedModuleIds.has(module.id) ? null : handlePurchase(module)}
                                            // Hide or Disable based on monetization
                                            // New Logic: If monetization OFF, allow install (free).
                                            disabled={ownedModuleIds.has(module.id)}
                                            className={cn(
                                                "h-8 text-[8px] font-black uppercase tracking-widest transition-colors flex-1",
                                                ownedModuleIds.has(module.id)
                                                    ? "bg-earth-green text-black opacity-80 cursor-default hover:bg-earth-green"
                                                    : !monetizationEnabled
                                                        ? "bg-blue-500 text-white hover:bg-blue-600" // Free mode style
                                                        : "bg-stardust-violet text-black hover:bg-stardust-violet/80"
                                            )}
                                            style={{ borderRadius: '2px' }}
                                        >
                                            {ownedModuleIds.has(module.id) ? 'INSTALLED' : (!monetizationEnabled ? 'Install (Free)' : (module.license_type === 'lease' ? 'Lease' : 'Purchase'))}
                                        </Button>

                                        {/* Edit Button (Visible if Owned or we want to allow editing freely in dev mode) */}
                                        {(ownedModuleIds.has(module.id) || !monetizationEnabled) && (
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.push(`/studio/editor?id=${module.id}`)}
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/5 border border-white/10"
                                                    title="Edit Code"
                                                    style={{ borderRadius: '2px' }}
                                                >
                                                    <Code className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const url = `${apiClient.getBaseURL()}/modules/${module.id}/wasm`;
                                                        window.open(url, '_blank');
                                                    }}
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/5 border border-white/10"
                                                    title="Download Standalone App (WASM)"
                                                    style={{ borderRadius: '2px' }}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
                }

                {/* Sell Section */}
                <div className="mt-8 p-6 border border-white/5 bg-oled-black flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden" style={{ borderRadius: '4px' }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-stardust-violet/5 to-transparent pointer-events-none" />
                    <div className="flex items-center gap-4 text-center md:text-left z-10">
                        <div className="p-3 bg-stardust-violet/10 border border-stardust-violet/20" style={{ borderRadius: '2px' }}>
                            <Package className="h-6 w-6 text-stardust-violet" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest italic">Become_An_Alien_Developer</h4>
                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">
                                Build modules using our Master Primitives and monetize your creation across Kenya.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="text-[10px] font-black uppercase tracking-widest text-stardust-violet hover:bg-stardust-violet/10 z-10"
                    >
                        Learn_More <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Simple Module Detail Overlay */}
            {selectedModule && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedModule(null)} />
                    <div className="bg-oled-black border border-white/10 w-full max-w-2xl relative z-10 flex flex-col sm:flex-row overflow-hidden shadow-2xl" style={{ borderRadius: '4px' }}>
                        <div className="w-full sm:w-1/2 p-8 flex flex-col items-center justify-center bg-white/[0.02] border-b sm:border-b-0 sm:border-r border-white/5">
                            <div className="text-8xl mb-6 drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                                {CategoryIcons[selectedModule.category] || '📦'}
                            </div>
                            <div className="flex gap-2">
                                {selectedModule.requires_hal && (
                                    <div className="px-2 py-1 bg-cyber-blue/10 border border-cyber-blue/30 text-[8px] font-black text-cyber-blue uppercase tracking-widest" style={{ borderRadius: '2px' }}>
                                        HAL_Required
                                    </div>
                                )}
                                {selectedModule.requires_gpu && (
                                    <div className="px-2 py-1 bg-earth-green/10 border border-earth-green/30 text-[8px] font-black text-earth-green uppercase tracking-widest" style={{ borderRadius: '2px' }}>
                                        GPU_Accelerated
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="w-full sm:w-1/2 p-8 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-[9px] font-black text-stardust-violet uppercase tracking-widest border-b border-stardust-violet/30 pb-1 mb-2 inline-block">
                                        Module_Details v{selectedModule.version}
                                    </span>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">
                                        {selectedModule.name}
                                    </h2>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-white tracking-widest leading-none">{selectedModule.price}</div>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Tokens</span>
                                </div>
                            </div>

                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-6">
                                {selectedModule.description}
                            </p>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <h4 className="text-[9px] font-black text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Zap className="h-3 w-3 text-stardust-violet" />
                                        Core_Primitives
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedModule.primitives.map((p, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-white/5 border border-white/10 text-[8px] font-bold text-slate-400 uppercase tracking-widest" style={{ borderRadius: '1.5px' }}>
                                                {p.module}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[9px] font-black text-white uppercase tracking-widest mb-2">
                                        License_Term
                                    </h4>
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                        {selectedModule.license_type === 'preview' ? '7-Day Free Trial' :
                                            selectedModule.license_type === 'lease' ? 'Monthly Recurrance' : 'Lifetime Access'}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto flex gap-3">
                                <Button
                                    onClick={() => handlePurchase(selectedModule)}
                                    className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest bg-stardust-violet text-black hover:bg-white transition-colors"
                                    style={{ borderRadius: '2px' }}
                                >
                                    {ownedModuleIds.has(selectedModule.id) ? 'INSTALLED_On_Node' : 'Confirm_License'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedModule(null)}
                                    className="h-10 px-4 border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white"
                                    style={{ borderRadius: '2px' }}
                                >
                                    Exit
                                </Button>
                            </div>
                            {!monetizationEnabled && (
                                <p className="text-[9px] text-blue-400 mt-2 text-center font-bold uppercase tracking-widest">
                                    DevMode: Free Installation Active
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
