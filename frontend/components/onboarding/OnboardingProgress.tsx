"use client"

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle, Circle, Trophy, Terminal, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassWrapper } from '@/components/ui/motion-container';
import { cn } from '@/lib/utils';

interface Task {
    id: string;
    label: string;
    completed: boolean;
    action?: () => void;
}

interface OnboardingProgressProps {
    progress: number; // 0 to 100
    tasks: Task[];
    className?: string;
}

export function OnboardingProgress({ progress, tasks, className = '' }: OnboardingProgressProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <GlassWrapper className={`bg-[#0a0a0c] border-white/5 overflow-hidden rounded-sm transition-all duration-500 ${isExpanded ? 'shadow-2xl shadow-emerald-500/5' : ''} ${className}`}>
            {/* Header / Summary */}
            <div
                className="p-6 flex items-center justify-between cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition-all border-b border-white/5"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-6 flex-1">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="text-white/[0.03]"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                            <path
                                className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-1000 ease-out"
                                strokeDasharray={`${progress}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute text-[11px] font-black text-white italic tracking-tighter">{progress}%</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Terminal className="w-3 h-3 text-slate-600" />
                            <h4 className="text-white font-black uppercase text-[12px] tracking-[0.3em] italic">Setup_Progress</h4>
                        </div>
                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] ml-5">
                            {progress === 100 ? 'Core_Synchronicity_Reached' : 'Finalize_Environments'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:block h-8 w-[1px] bg-white/5" />
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-white hover:bg-white/5 h-10 w-10 p-0 rounded-sm">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Task List */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "circOut" }}
                    >
                        <div className="p-8 space-y-5 bg-black/20 relative overflow-hidden">
                            {/* Visual Detail: Connection Lines */}
                            <div className="absolute left-10 top-0 bottom-0 w-[1px] bg-white/5 z-0" />

                            {tasks.map((task, idx) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center justify-between group relative z-10"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "w-9 h-9 flex items-center justify-center rounded-sm border transition-all duration-500",
                                            task.completed
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                                : 'bg-white/[0.02] border-white/10 text-slate-700'
                                        )}>
                                            {task.completed ? (
                                                <CheckCircle className="w-4 h-4" />
                                            ) : (
                                                <Circle className="w-3 h-3" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <span className={cn(
                                                "text-[11px] font-black uppercase tracking-widest block transition-colors",
                                                task.completed ? 'text-slate-600' : 'text-slate-200'
                                            )}>
                                                {task.label}
                                            </span>
                                            {task.completed && (
                                                <div className="text-[7px] font-black text-emerald-500/60 uppercase tracking-widest">VALIDATED_OK</div>
                                            )}
                                        </div>
                                    </div>
                                    {!task.completed && task.action && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-10 px-6 text-[10px] font-black uppercase tracking-[0.2em] border-stardust-violet/20 text-stardust-violet hover:bg-stardust-violet hover:text-black hover:border-stardust-violet transition-all rounded-sm flex items-center gap-2 group/btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                task.action?.();
                                            }}
                                        >
                                            <Zap className="w-3 h-3 transition-transform group-hover/btn:scale-125" />
                                            Execute
                                        </Button>
                                    )}
                                </motion.div>
                            ))}

                            {progress === 100 && (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="mt-8 p-6 bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center gap-4 rounded-sm"
                                >
                                    <Trophy className="w-6 h-6 text-emerald-500 animate-bounce" />
                                    <div className="text-center">
                                        <div className="text-[12px] text-emerald-500 font-black uppercase tracking-[0.3em] italic">All_Systems_Nominal</div>
                                        <div className="text-[8px] text-emerald-500/40 font-black uppercase tracking-[0.4em] mt-1">Core_Infrastructure_Secure</div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </GlassWrapper>
    );
}

