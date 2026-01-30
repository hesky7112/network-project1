
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
    Search,
    Zap,
    Cpu,
    FileText,
    Workflow,
    Plus,
    ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const ACTIONS = [
        { id: 'data', name: 'Launch Data Forge', icon: Cpu, color: 'text-cyan-400', path: '/studio/data' },
        { id: 'pdf', name: 'Launch PDF Forge', icon: FileText, color: 'text-emerald-400', path: '/studio/pdf' },
        { id: 'flow', name: 'Launch Flow Forge', icon: Workflow, color: 'text-amber-400', path: '/studio/flow' },
        { id: 'create', name: 'Create New Module', icon: Plus, color: 'text-stardust-violet', path: '/studio/create' },
    ];

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
                onClick={() => setOpen(false)}
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="w-full max-w-xl bg-[#0D0D0D] border border-white/10 rounded-xl overflow-hidden shadow-2xl pointer-events-auto"
            >
                <div className="flex items-center px-4 py-4 border-b border-white/5 bg-white/5">
                    <Search className="h-4 w-4 text-slate-500 mr-3" />
                    <input
                        autoFocus
                        placeholder="Search forges, modules, or actions..."
                        className="bg-transparent border-none outline-none text-white text-sm w-full font-medium placeholder:text-slate-600"
                    />
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-500 font-mono">ESC</kbd>
                </div>

                <div className="p-2 py-4">
                    <h2 className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Quick Actions</h2>
                    <div className="space-y-1">
                        {ACTIONS.map(action => (
                            <button
                                key={action.id}
                                onClick={() => {
                                    router.push(action.path);
                                    setOpen(false);
                                }}
                                className="w-full h-12 px-4 flex items-center justify-between group hover:bg-white/5 rounded-lg transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-1.5 rounded-md bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors", action.color)}>
                                        <action.icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{action.name}</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-700 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-4 py-3 border-t border-white/5 bg-black/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Zap className="h-3 w-3 text-stardust-violet" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Studio intelligence active</span>
                    </div>
                    <span className="text-[9px] text-slate-700 font-mono italic">Studio_OS // Nexus v1.0</span>
                </div>
            </motion.div>
        </div>
    );
}
