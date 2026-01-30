"use client"

import { ComposableMap, Geographies, Geography, Marker as MapMarker } from "react-simple-maps"
import { GlassWrapper } from '@/components/ui/motion-container'
import { Globe } from 'lucide-react'

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

interface GeoMapProps {
    markers?: { name: string; coordinates: [number, number]; status: 'up' | 'down' | 'warning' }[]
    height?: number | string
}

const defaultMarkers: any[] = [
    { name: "New York", coordinates: [-74.006, 40.7128], status: 'up' },
    { name: "London", coordinates: [-0.1278, 51.5074], status: 'warning' },
    { name: "Tokyo", coordinates: [139.6917, 35.6895], status: 'up' },
    { name: "Sydney", coordinates: [151.2093, -33.8688], status: 'down' },
    { name: "Cape Town", coordinates: [18.4241, -33.9249], status: 'up' },
]

export function GeoMap({ markers = defaultMarkers }: GeoMapProps) {
    return (
        <GlassWrapper className="w-full bg-[#0a0a0c] border-white/5 overflow-hidden rounded-sm">
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-sm">
                        <Globe className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Global Network Status</h3>
                        <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Asset_Spatial_Intelligence</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Active_Regions</div>
                            <div className="text-[10px] font-mono text-white font-bold tracking-tighter">05/05</div>
                        </div>
                        <div className="w-[1px] h-6 bg-white/5" />
                        <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Synchronized
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative">
                {/* Background Flair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-500/5 blur-[100px] pointer-events-none rounded-full" />

                <ComposableMap
                    projectionConfig={{ scale: 200 }}
                    style={{ width: "100%", height: "auto" }}
                    height={400}
                    width={800}
                >
                    <Geographies geography={geoUrl}>
                        {({ geographies }: any) =>
                            geographies.map((geo: any) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="#111115"
                                    stroke="#ffffff08"
                                    strokeWidth={0.5}
                                    style={{
                                        default: { outline: "none" },
                                        hover: { fill: "#1a1a20", outline: "none", transition: 'all 0.3s' },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            ))
                        }
                    </Geographies>
                    {markers.map(({ name, coordinates, status }) => (
                        <MapMarker key={name} coordinates={coordinates}>
                            <g className="group cursor-pointer">
                                {/* Invisible larger impact area for better hover */}
                                <circle r={12} fill="transparent" />

                                {/* Pulse Effect */}
                                <circle
                                    r={4}
                                    fill={status === 'up' ? '#10b981' : status === 'down' ? '#ef4444' : '#f59e0b'}
                                    className="animate-ping opacity-40"
                                />

                                {/* Core Dot */}
                                <circle
                                    r={3.5}
                                    fill={status === 'up' ? '#10b981' : status === 'down' ? '#ef4444' : '#f59e0b'}
                                    stroke="#000"
                                    strokeWidth={1}
                                    className="relative z-10"
                                />

                                {/* Label with premium technical styling */}
                                <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <rect
                                        x={-30}
                                        y={-28}
                                        width={60}
                                        height={16}
                                        fill="#050505"
                                        stroke="#ffffff10"
                                        rx={1}
                                    />
                                    <text
                                        textAnchor="middle"
                                        y={-17}
                                        className="text-[8px] font-black uppercase tracking-widest fill-white"
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        {name}
                                    </text>
                                </g>

                                {/* Normal Static Label */}
                                <text
                                    textAnchor="middle"
                                    y={14}
                                    className="text-[7px] font-mono font-bold uppercase tracking-widest fill-slate-500 group-hover:fill-white transition-colors"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {name}
                                </text>
                            </g>
                        </MapMarker>
                    ))}
                </ComposableMap>
            </div>
        </GlassWrapper>
    )
}

