import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
    Layers,
    Maximize2,
    Filter,
    Download,
    Globe,
    Navigation,
    Radio
} from 'lucide-react';
import { BlurReveal, GlassWrapper, StaggerList, StaggerItem } from '@/components/ui/motion-container';
import { cn } from '@/lib/utils';
import Layout from '@/components/layout';
import { apiClient } from '@/lib/api';

// Dynamically import the Map component as Leaflet requires 'window'
const NetworkMap = dynamic(() => import('../../components/visualizations/NetworkMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-neutral-900 animate-pulse flex items-center justify-center text-white/20">Loading_Map_Geometry...</div>
});

const GISAdmin = () => {
    const [devices, setDevices] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [layers, setLayers] = useState({
        infrastructure: true,
        fiber: false,
        users: true,
        signal: false
    });

    useEffect(() => {
        fetchMapData();
    }, []);

    const fetchMapData = async () => {
        try {
            const [devicesData, usersData] = await Promise.all([
                apiClient.get<any[]>('/inventory/devices'),
                apiClient.get<any[]>('/rbac/admin/users')
            ]);

            setDevices(devicesData || []);
            // Map real users to include visualization props if missing
            setUsers((usersData || []).map(u => ({
                ...u,
                service_type: u.role || 'standard_uplink', // Fallback for display
                lat: u.lat, // Preserve if exists, NetworkMap handles fallback
                lng: u.lng
            })));
        } catch (err) {
            console.error("GIS Sync Error:", err);
            // Fallback for safety if API fails
            setDevices([]);
            setUsers([]);
        }
    };

    const toggleLayer = (key: keyof typeof layers) => {
        setLayers(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <Layout title="Geo_Intelligence">
            <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-12 relative overflow-hidden">
                {/* Background Visual Flair */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-stardust-violet/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-earth-green/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />

                <BlurReveal>
                    <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                        {/* HUD Header */}
                        <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-32 h-[1px] bg-stardust-violet shadow-[0_0_15px_#6366f1]" />
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-stardust-violet/10 border border-stardust-violet/20 rounded-sm">
                                        <Navigation className="h-8 w-8 text-stardust-violet" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                                            Geo_<span className="text-stardust-violet">Intelligence</span>
                                        </h1>
                                        <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mt-2 italic">
                                            Visualizing coverage, signal propagation, and asset density_matrix
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button className="p-4 bg-white/[0.02] border border-white/5 rounded-sm hover:bg-white/[0.05] hover:border-stardust-violet/30 transition-all text-slate-500 hover:text-white">
                                        <Filter className="h-5 w-5" />
                                    </button>
                                    <button className="p-4 bg-white/[0.02] border border-white/5 rounded-sm hover:bg-white/[0.05] hover:border-stardust-violet/30 transition-all text-slate-500 hover:text-white">
                                        <Layers className="h-5 w-5" />
                                    </button>
                                    <button className="px-8 py-4 bg-stardust-violet text-white text-[11px] font-black uppercase tracking-widest italic rounded-sm flex items-center gap-3 hover:bg-stardust-violet/90 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                                        <Download className="h-4 w-4" /> EXPORT_GIS_MATRIX
                                    </button>
                                </div>
                            </div>
                        </GlassWrapper>

                        <div className="grid grid-cols-12 gap-8 min-h-[700px]">
                            {/* Map Sidebar */}
                            <StaggerList className="col-span-12 lg:col-span-3 space-y-8">
                                <StaggerItem>
                                    <GlassWrapper className="bg-[#0a0a0c] border-white/5 p-8 rounded-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-stardust-violet/20 to-transparent" />
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 italic border-b border-white/5 pb-4 flex items-center gap-3">
                                            <Layers className="h-4 w-4 text-stardust-violet" /> LAYER_CONTROLS
                                        </h3>
                                        <div className="space-y-6">
                                            <LayerToggle label="Infrastructure_Nodes" active={layers.infrastructure} onClick={() => toggleLayer('infrastructure')} count={devices.length} color="bg-stardust-violet" />
                                            <LayerToggle label="Fiber_Routing" active={layers.fiber} onClick={() => toggleLayer('fiber')} count={0} color="bg-cosmic-red" />
                                            <LayerToggle label="Active_Handsets" active={layers.users} onClick={() => toggleLayer('users')} count={users.length} color="bg-earth-green" />
                                            <LayerToggle label="Signal_Flux_Map" active={layers.signal} onClick={() => toggleLayer('signal')} count={0} color="bg-amber-500" />
                                        </div>
                                    </GlassWrapper>
                                </StaggerItem>

                                <StaggerItem className="flex-grow flex">
                                    <GlassWrapper className="bg-[#0a0a0c] border-white/5 p-8 rounded-sm relative overflow-hidden flex flex-col w-full">
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 italic border-b border-white/5 pb-4 flex items-center gap-3">
                                            <Globe className="h-4 w-4 text-earth-green" /> SITE_INVENTORY
                                        </h3>
                                        <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar flex-grow">
                                            {devices.map(d => (
                                                <div key={d.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-sm hover:border-earth-green/30 hover:bg-earth-green/5 transition-all cursor-pointer group">
                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest italic group-hover:text-earth-green">{d.name}</p>
                                                    <p className="text-[9px] text-slate-600 font-mono tracking-tighter uppercase mt-1">{d.ip_address}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </GlassWrapper>
                                </StaggerItem>
                            </StaggerList>

                            {/* Map Main */}
                            <StaggerItem className="col-span-12 lg:col-span-9">
                                <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm relative overflow-hidden h-full flex flex-col group">
                                    <div className="absolute top-6 left-6 z-10 flex items-center gap-4 bg-black/60 backdrop-blur-md px-6 py-4 border border-white/5 rounded-sm">
                                        <Radio className="h-4 w-4 text-earth-green animate-pulse" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic">GEOSPATIAL_STREAM_ACTIVE</span>
                                    </div>
                                    <div className="flex-grow relative z-0">
                                        <NetworkMap
                                            devices={layers.infrastructure ? devices : []}
                                            users={layers.users ? users : []}
                                        />
                                    </div>
                                    <button className="absolute bottom-8 right-8 z-[1000] p-5 bg-stardust-violet text-white rounded-sm shadow-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(139,92,246,0.4)] border border-stardust-violet/50 hover:bg-stardust-violet/90">
                                        <Maximize2 className="h-5 w-5" />
                                    </button>

                                    {/* Map Telemetry Overlay */}
                                    <div className="absolute bottom-8 left-8 z-10 flex gap-4">
                                        <div className="px-6 py-4 bg-black/60 backdrop-blur-md border border-white/5 rounded-sm flex flex-col items-start gap-1">
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic leading-none">Map_Coordination</span>
                                            <span className="text-[11px] font-black text-white uppercase tracking-widest italic font-mono">-1.2921, 36.8219</span>
                                        </div>
                                        <div className="px-6 py-4 bg-black/60 backdrop-blur-md border border-white/5 rounded-sm flex flex-col items-start gap-1">
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic leading-none">Zoom_Index</span>
                                            <span className="text-[11px] font-black text-earth-green uppercase tracking-widest italic font-mono">1.0X</span>
                                        </div>
                                    </div>
                                </GlassWrapper>
                            </StaggerItem>
                        </div>
                    </div>
                </BlurReveal>
            </div>
        </Layout>
    );
};

const LayerToggle = ({ label, active, count, color, onClick }: any) => (
    <div onClick={onClick} className="flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-sm hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-4">
            <div className={cn(
                "w-2 h-2 rounded-full transition-all duration-500",
                color,
                active ? "opacity-100 shadow-[0_0_10px_currentColor]" : "opacity-20 blur-[1px]"
            )} />
            <span className={cn(
                "text-[10px] font-black uppercase tracking-widest italic transition-colors",
                active ? "text-white" : "text-slate-600 group-hover:text-slate-400"
            )}>{label}</span>
        </div>
        <span className="text-[9px] font-black text-slate-600 bg-white/[0.03] px-3 py-1 border border-white/5 rounded-sm group-hover:text-white transition-colors">{count}</span>
    </div>
);

export default GISAdmin;

