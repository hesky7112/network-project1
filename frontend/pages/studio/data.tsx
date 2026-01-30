import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Cpu, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FileUploader } from '@/components/studio/FileUploader';

export default function DataForge() {
    const router = useRouter();
    const [marimoUrl, setMarimoUrl] = useState<string | null>(null);
    const [isIngesting, setIsIngesting] = useState(false);

    useEffect(() => {
        setMarimoUrl("http://localhost:2718");
    }, []);

    const handleUpload = (_files: File[]) => {
        setIsIngesting(true);
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Initializing Super Engine for dataset...',
                success: 'Dataset loaded into Polars context!',
                error: 'Failed to ingest dataset',
            }
        ).finally(() => setIsIngesting(false));
    };

    return (
        <Layout title="Data Forge | Intelligence Engine">
            <div className="h-screen flex flex-col bg-[#0A0A0A]">
                {/* Forge Toolbar */}
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Back to Studio</span>
                        </Button>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                <Cpu className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="font-black text-white tracking-tighter uppercase text-sm italic">Data_Forge_v1.0</h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest leading-none">Polars Engine Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest">
                            <Save className="h-4 w-4 mr-2" />
                            Commit
                        </Button>
                        <Button className="bg-cyan-500 hover:bg-white hover:text-black text-black font-black uppercase tracking-widest h-10 px-6 transition-all border-none">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Compute insights
                        </Button>
                    </div>
                </header>

                {/* Main Workspace */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar / Ingestion Zone */}
                    <aside className="w-80 border-r border-white/5 bg-black/40 p-6 flex flex-col gap-6 overflow-y-auto">
                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Ingestion</h2>
                            <FileUploader
                                onUpload={handleUpload}
                                className="scale-90 origin-top"
                            />
                        </section>

                        <div className="mt-auto p-4 rounded-xl bg-white/5 border border-white/10">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Performance Stats</h3>
                            <div className="space-y-2 mt-3">
                                <div className="flex justify-between text-[9px]">
                                    <span className="text-slate-500 font-bold uppercase">Load Speed</span>
                                    <span className="text-cyan-400 font-mono">0.04s</span>
                                </div>
                                <div className="flex justify-between text-[9px]">
                                    <span className="text-slate-500 font-bold uppercase">Peak RAM</span>
                                    <span className="text-cyan-400 font-mono">1.2GB</span>
                                </div>
                                <div className="flex justify-between text-[9px]">
                                    <span className="text-slate-500 font-bold uppercase">Threads</span>
                                    <span className="text-cyan-400 font-mono">16 Core</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Marimo Frame */}
                    <main className="flex-1 relative bg-[#0F1117]">
                        {marimoUrl ? (
                            <iframe
                                src={marimoUrl}
                                className="w-full h-full border-none"
                                title="Marimo Notebook"
                                allow="clipboard-read; clipboard-write"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <Loader2 className="h-10 w-10 animate-spin text-cyan-500 mb-6" />
                                <p className="text-xs uppercase font-black tracking-[0.3em] animate-pulse">Initializing Super Engine Runtime...</p>
                            </div>
                        )}

                        {isIngesting && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full mb-6"
                                />
                                <p className="text-xs font-black text-white uppercase tracking-[0.2em]">Synchronizing Polars Context...</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </Layout>
    );
}
