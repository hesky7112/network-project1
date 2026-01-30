import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Terminal } from 'lucide-react';
import Image from 'next/image';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: () => void;
}

export function WelcomeModal({ isOpen, onClose, onStart }: WelcomeModalProps) {
    // Use a local state to handle the exit animation before actually unmounting if needed,
    // but AnimatePresence performs best when the parent controls the boolean.

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto h-full w-full flex items-center justify-center p-4"
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="relative w-full max-w-2xl bg-oled-black border border-white/10 shadow-[0_0_50px_rgba(45,90,39,0.1)] overflow-hidden"
                        >
                            {/* Scanline effect */}
                            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] z-10" />

                            {/* Decorative borders */}
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-earth-green/50 to-transparent" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-earth-green/50" />
                            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-earth-green/50" />

                            <div className="relative z-20 flex flex-col md:flex-row h-full">

                                {/* Left Side: Mascot / Visuals */}
                                <div className="w-full md:w-1/3 bg-black/50 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-earth-green/5 opacity-20 animate-pulse" />
                                    <div className="relative w-32 h-32 mb-4">
                                        {/* Placeholder for mascot, assuming path or using Next Image */}
                                        <div className="absolute inset-0 bg-stardust-violet/20 blur-3xl rounded-full" />
                                        <Image
                                            src="/alien_mascot.png"
                                            alt="System Mascot"
                                            width={128}
                                            height={128}
                                            className="relative z-10 drop-shadow-[0_0_15px_rgba(138,43,226,0.3)] grayscale hue-rotate-[280deg]"
                                        />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-earth-green font-black text-[10px] uppercase tracking-[0.3em] mb-1 italic">System_Calibrated</p>
                                        <p className="text-white/30 text-[9px] font-black tracking-widest italic">v.CNS-NATURE-OS</p>
                                    </div>
                                </div>

                                {/* Right Side: Content */}
                                <div className="w-full md:w-2/3 p-8 flex flex-col">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 italic">
                                                Welcome, <span className="text-stardust-violet">Operator</span>
                                            </h2>
                                            <p className="text-slate-400 text-sm leading-relaxed">
                                                Your neural link has been established. To begin network operations, we need to calibrate your local environment setup.
                                            </p>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="text-slate-500 hover:text-white transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex-1 space-y-4 mb-8">
                                        <div className="bg-white/5 border border-white/10 p-4" style={{ borderRadius: '2px' }}>
                                            <div className="flex items-start gap-3">
                                                <Terminal className="w-5 h-5 text-stardust-violet mt-1 shrink-0" />
                                                <div>
                                                    <h3 className="text-white text-[11px] font-black uppercase tracking-widest mb-1 italic">Initial Calibration</h3>
                                                    <p className="text-slate-400 text-xs">Configure topology, regions, and identity verify.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-auto">
                                        <Button
                                            onClick={onStart}
                                            className="flex-1 bg-stardust-violet text-black hover:opacity-90 font-black uppercase tracking-widest h-12 rounded-sm transition-all shadow-[0_0_20px_rgba(138,43,226,0.2)]"
                                        >
                                            Initialize System
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={onClose}
                                            className="px-6 border-white/20 text-slate-400 hover:text-white hover:bg-white/5 font-mono uppercase text-xs tracking-wider rounded-sm h-12"
                                        >
                                            Skip
                                        </Button>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
