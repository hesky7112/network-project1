import React from 'react';

interface LatencyHeatmapProps {
    data?: any[];
}

const LatencyHeatmap: React.FC<LatencyHeatmapProps> = ({ data = [] }) => {
    console.log("Heatmap data active:", data.length);
    // Mock geographic points for visualization
    const points = [
        { x: '20%', y: '30%', latency: 15 },
        { x: '45%', y: '60%', latency: 85 },
        { x: '70%', y: '25%', latency: 42 },
        { x: '15%', y: '75%', latency: 220 },
        { x: '80%', y: '80%', latency: 12 },
    ];

    const getHeatColor = (latency: number) => {
        if (latency < 30) return 'bg-green-500 shadow-[0_0_15px_#22c55e]';
        if (latency < 100) return 'bg-yellow-500 shadow-[0_0_15px_#eab308]';
        return 'bg-red-500 animate-pulse shadow-[0_0_15px_#ef4444]';
    };

    return (
        <div className="w-full h-[400px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative">
            {/* Abstract Map Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
                    <path d="M100 150Q150 100 200 150T300 150T400 100T500 150T600 100T700 150" fill="none" stroke="#1e293b" strokeWidth="2" />
                    <path d="M50 250Q100 200 150 250T250 250T350 200T450 250T550 200T650 250" fill="none" stroke="#1e293b" strokeWidth="2" />
                </svg>
            </div>

            <div className="absolute top-6 left-6 z-10">
                <h3 className="text-xl font-black text-white italic tracking-tighter">Latent Pulse</h3>
                <p className="text-slate-500 text-xs text-uppercase tracking-widest">Global Node Latency Heatmap</p>
            </div>

            {/* Heatmap Points */}
            {points.map((p, i) => (
                <div
                    key={i}
                    style={{ left: p.x, top: p.y }}
                    className="absolute group cursor-help z-20"
                >
                    <div className={`w-6 h-6 rounded-full ${getHeatColor(p.latency)} transition-all duration-500 group-hover:scale-150`}></div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] p-2 rounded border border-slate-700 whitespace-nowrap">
                        NODE_{i + 1}: {p.latency}ms
                    </div>
                </div>
            ))}

            {/* Legend */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2 p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-[10px] text-slate-400">{'< 30ms (Excellent)'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-[10px] text-slate-400">{'30-100ms (Average)'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-[10px] text-slate-400">{'> 100ms (Critical)'}</span>
                </div>
            </div>
        </div>
    );
};

export default LatencyHeatmap;
