"use client"

import { useMemo } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { GlassWrapper } from '@/components/ui/motion-container'
import { Zap } from 'lucide-react'

interface PortHeatmapProps {
    ports?: number
    device?: string
}

export function PortHeatmap({ ports = 48, device = "Switch-Core-01" }: PortHeatmapProps) {
    const portData = useMemo(() => {
        return Array.from({ length: ports }, (_, i) => {
            const id = i + 1
            const isUp = Math.random() > 0.3
            const isError = isUp && Math.random() > 0.9
            const speed = Math.random() > 0.5 ? '1G' : '10G'

            return {
                id,
                status: isError ? 'error' : isUp ? 'up' : 'down',
                speed,
                poe: Math.random() > 0.7 ? '30W' : '0W'
            }
        })
    }, [ports])

    return (
        <GlassWrapper className="w-full bg-[#0a0a0c] border-white/5 overflow-hidden rounded-sm">
            <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-stardust-violet/10 border border-stardust-violet/20 rounded-sm">
                        <Zap className="h-4 w-4 text-stardust-violet" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{device}_Interface_Matrix</h3>
                        <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Physical_Layer_Port_Synchronicity</p>
                    </div>
                </div>
                <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div> Up</span>
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-cosmic-red rounded-full shadow-[0_0_8px_#ef4444]"></div> Error</span>
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-white/10 rounded-full"></div> Down</span>
                </div>
            </div>

            <div className="p-8">
                <div className="bg-black/40 p-6 rounded-sm border border-white/5 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] pointer-events-none" />

                    <div className="grid grid-cols-12 md:grid-cols-24 gap-2">
                        {portData.map(port => (
                            <PortIndicator key={port.id} port={port} />
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex justify-between items-center px-2">
                    <div className="flex items-center gap-6">
                        <div className="space-y-1">
                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Backplane_Load</div>
                            <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full w-[42%] bg-indigo-500" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Aggregate_Throughput</div>
                            <div className="text-[10px] font-mono text-emerald-500 font-bold">142.8 Gbps</div>
                        </div>
                    </div>
                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] italic">
                        Node_Active_Sync
                    </div>
                </div>
            </div>
        </GlassWrapper>
    )
}

const PortIndicator = ({ port }: { port: any }) => {
    const statusColor =
        port.status === 'error' ? 'bg-cosmic-red border-cosmic-red/40' :
            port.status === 'up' ? 'bg-emerald-500/80 border-emerald-500/40' :
                'bg-white/5 border-white/10'

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-1.5 group cursor-crosshair">
                        <div className={cn(
                            "w-full aspect-square sm:aspect-auto sm:h-8 rounded-sm border transition-all duration-300 relative overflow-hidden",
                            statusColor,
                            port.status === 'up' && "hover:bg-emerald-400 group-hover:shadow-[0_0_12px_#10b98144]",
                            port.status === 'error' && "animate-pulse"
                        )}>
                            {/* Technical Detail: LED */}
                            {port.status === 'up' && (
                                <div className="absolute top-1 right-1 w-1 h-1 bg-yellow-400 rounded-full animate-pulse" />
                            )}
                            {/* Visual texture */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                        </div>
                        <div className="text-[8px] text-slate-600 font-mono font-bold group-hover:text-white transition-colors">{port.id}</div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-[#050505] border-white/10 text-white rounded-sm p-3">
                    <div className="space-y-2 min-w-[120px]">
                        <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest">Interface_{port.id}</span>
                            <div className={cn("w-1.5 h-1.5 rounded-full", port.status === 'up' ? "bg-emerald-500" : "bg-cosmic-red")} />
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <span className="text-[9px] text-slate-500 uppercase font-bold">Status:</span>
                            <span className={cn("text-[9px] font-black uppercase", port.status === 'up' ? "text-emerald-500" : "text-cosmic-red")}>{port.status}</span>
                            <span className="text-[9px] text-slate-500 uppercase font-bold">Protocol:</span>
                            <span className="text-[9px] font-mono text-white">{port.speed}BASE-T</span>
                            <span className="text-[9px] text-slate-500 uppercase font-bold">Power:</span>
                            <span className="text-[9px] font-mono text-white">{port.poe}</span>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

