import React from 'react';
import {
    ResponsiveContainer,
    RadialBarChart,
    RadialBar
} from 'recharts';
import { cn } from '@/lib/utils';
import { Zap, AlertTriangle } from 'lucide-react';
import { GlassWrapper } from '@/components/ui/motion-container';

interface TokenMeterProps {
    value: number; // 0 to 100
    label: string;
    subLabel?: string;
    unit: string;
    color?: string;
    className?: string;
}

export default function TokenMeter({
    value,
    label,
    subLabel,
    unit,
    color = "#8A2BE2",
    className
}: TokenMeterProps) {
    const data = [
        {
            name: 'Consumption',
            value: value,
            fill: color,
        },
    ];

    const isLow = value < 20;

    return (
        <GlassWrapper className={cn("bg-[#0a0a0c] border-white/5 p-6 relative overflow-hidden rounded-sm", className)}>
            {/* Visual Flair: Glow */}
            <div
                className="absolute -top-12 -right-12 w-32 h-32 blur-[80px] opacity-20 pointer-events-none rounded-full"
                style={{ backgroundColor: color }}
            />

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1.5 italic transition-colors group-hover:text-white">{label}</h4>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-white tracking-tighter italic leading-none">{value}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{unit}</span>
                    </div>
                </div>
                {isLow && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-cosmic-red/10 border border-cosmic-red/20 rounded-sm">
                        <AlertTriangle className="h-3 w-3 text-cosmic-red animate-pulse" />
                        <span className="text-[8px] font-black text-cosmic-red uppercase tracking-widest">Crit_Low</span>
                    </div>
                )}
            </div>

            <div className="h-44 relative mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="100%"
                        barSize={8}
                        data={data}
                        startAngle={180}
                        endAngle={-180}
                    >
                        <RadialBar
                            background={{ fill: '#ffffff03' }}
                            dataKey="value"
                            cornerRadius={0}
                            fill={color}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>

                {/* Center Content: Impactful Icon */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className={cn(
                        "p-3 rounded-full bg-white/[0.02] border border-white/5 shadow-xl",
                        isLow ? "text-cosmic-red border-cosmic-red/20 shadow-cosmic-red/5" : "text-white/80"
                    )}>
                        <Zap className="h-6 w-6" />
                    </div>
                    {subLabel && (
                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] text-center mt-3 max-w-[100px] leading-relaxed">
                            {subLabel}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] relative z-10">
                <span className="text-slate-600 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    Live_Refill_Available
                </span>
                <button className="text-stardust-violet hover:text-white transition-colors flex items-center gap-1 group">
                    Provision_Tokens
                    <div className="w-0 group-hover:w-3 h-[1px] bg-stardust-violet transition-all duration-300" />
                </button>
            </div>
        </GlassWrapper>
    );
}

