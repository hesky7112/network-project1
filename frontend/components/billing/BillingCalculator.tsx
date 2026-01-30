import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowRight, Layers } from 'lucide-react';
import { GlassWrapper, SoftLift } from '@/components/ui/motion-container';
import { cn } from '@/lib/utils';

interface BillingCalculatorProps {
    className?: string;
}

export default function BillingCalculator({ className }: BillingCalculatorProps) {
    const [bandwidth, setBandwidth] = useState(50); // Mbps
    const [duration, setDuration] = useState(30); // Days

    // Mock pricing logic
    const costPerMbpsDay = 0.5; // tokens
    const estimatedCost = (bandwidth * duration * costPerMbpsDay).toFixed(2);
    const fupThreshold = (bandwidth * 0.8 * duration * 24).toFixed(0); // Approximate GB

    return (
        <GlassWrapper className={cn("bg-[#0a0a0c] border-white/5 p-8 rounded-sm relative overflow-hidden", className)}>
            {/* Abstract Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-stardust-violet/5 blur-[100px] pointer-events-none rounded-full" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 blur-[80px] pointer-events-none rounded-full" />

            <div className="relative z-10 space-y-1 mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-stardust-violet/10 border border-stardust-violet/20 rounded-sm">
                        <Layers className="h-4 w-4 text-stardust-violet" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Package_Estimator</h3>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-11">
                    Calculate Token Requirements for Custom Nodes
                </p>
            </div>

            <div className="relative z-10 space-y-12">
                {/* Bandwidth Slider */}
                <div className="space-y-5">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Bandwidth_Volume</Label>
                            <div className="h-[1px] w-8 bg-stardust-violet/20" />
                        </div>
                        <div className="text-3xl font-black text-stardust-violet tracking-tighter italic leading-none">{bandwidth} <span className="text-xs not-italic text-slate-400">Mbps</span></div>
                    </div>
                    <div className="relative h-6 flex items-center">
                        <input
                            type="range"
                            min="10"
                            max="1000"
                            step="10"
                            value={bandwidth}
                            onChange={(e) => setBandwidth(parseInt(e.target.value))}
                            className="w-full h-[2px] bg-white/5 appearance-none cursor-pointer accent-stardust-violet relative z-20"
                        />
                        <div className="absolute inset-0 h-[2px] w-full bg-white/5 top-1/2 -translate-y-1/2" />
                        <div className="absolute h-[2px] bg-stardust-violet/40 top-1/2 -translate-y-1/2 left-0" style={{ width: `${(bandwidth / 1000) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">
                        <span>10_Mb</span>
                        <span>1_Gb</span>
                    </div>
                </div>

                {/* Duration Slider */}
                <div className="space-y-5">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Active_Timeline</Label>
                            <div className="h-[1px] w-8 bg-emerald-500/20" />
                        </div>
                        <div className="text-3xl font-black text-emerald-500 tracking-tighter italic leading-none">{duration} <span className="text-xs not-italic text-slate-400">Days</span></div>
                    </div>
                    <div className="relative h-6 flex items-center">
                        <input
                            type="range"
                            min="1"
                            max="365"
                            step="1"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            className="w-full h-[2px] bg-white/5 appearance-none cursor-pointer accent-earth-green relative z-20"
                        />
                        <div className="absolute inset-0 h-[2px] w-full bg-white/5 top-1/2 -translate-y-1/2" />
                        <div className="absolute h-[2px] bg-emerald-500/40 top-1/2 -translate-y-1/2 left-0" style={{ width: `${(duration / 365) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">
                        <span>1_D</span>
                        <span>365_D</span>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="bg-white/[0.01] border border-white/5 p-8 grid grid-cols-2 gap-12 rounded-sm group hover:border-white/10 transition-colors">
                    <div className="space-y-2">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-stardust-violet" />
                            Cost_Tokens
                        </div>
                        <div className="text-4xl font-black text-white tracking-tighter italic leading-none group-hover:text-stardust-violet transition-colors">{estimatedCost}</div>
                        <div className="text-[9px] font-bold text-slate-700 uppercase tracking-widest mt-1">Refill_Units</div>
                    </div>
                    <div className="space-y-2 border-l border-white/5 pl-12">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            FUP_Limit
                        </div>
                        <div className="text-4xl font-black text-white tracking-tighter italic leading-none group-hover:text-emerald-500 transition-colors">~{fupThreshold}</div>
                        <div className="text-[9px] font-bold text-slate-700 uppercase tracking-widest mt-1">Data_GB_Approx</div>
                    </div>
                </div>

                <SoftLift>
                    <Button className="w-full h-16 bg-white text-black hover:bg-slate-200 text-xs font-black uppercase tracking-[0.4em] rounded-sm flex items-center justify-center gap-4 transition-all">
                        GENERATE_QUOTATION
                        <div className="p-1 px-3 bg-black text-white rounded-sm text-[8px] tracking-widest">SECURE_LINK</div>
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </SoftLift>
            </div>
        </GlassWrapper>
    );
}

