import React from 'react';

interface TrafficPulseProps {
    nodes?: any[];
}

const TrafficPulse: React.FC<TrafficPulseProps> = ({ nodes = [] }) => {
    console.log("Nodes active:", nodes.length);
    // Simplified flow visualization
    return (
        <div className="w-full h-[400px] bg-[#000000] border border-white/5 overflow-hidden relative p-8" style={{ borderRadius: '2px' }}>
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-[10px] font-black text-earth-green tracking-[0.4em] uppercase italic">Traffic Volume</h3>
                    <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest mt-1">Enterprise_Data_Insights</p>
                </div>
                <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-earth-green rounded-full shadow-[0_0_8px_rgba(45,90,39,0.5)]"></div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Normal</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-cosmic-red rounded-full shadow-[0_0_8px_rgba(255,77,0,0.5)]"></div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Congested</span>
                    </div>
                </div>
            </div>

            <div className="relative h-48 flex items-center justify-between px-10">
                {/* Source: Core Gateway */}
                <div className="z-10 bg-oled-black p-5 border border-white/5 shadow-2xl" style={{ borderRadius: '1.5px' }}>
                    <div className="w-12 h-12 bg-earth-green flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(45,90,39,0.2)]" style={{ borderRadius: '1.5px' }}>
                        <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12l4-4m-4 4l4 4" />
                        </svg>
                    </div>
                    <p className="text-[9px] text-center text-slate-500 font-black uppercase tracking-widest">CORE_GATEWAY</p>
                </div>

                {/* Pulse Lines */}
                <div className="absolute inset-x-32 top-1/2 -translate-y-1/2 h-[1px] bg-white/5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-transparent via-earth-green/50 to-transparent w-40 animate-slide-infinite"></div>
                </div>

                {/* Targets: Infrastructure Nodes */}
                <div className="flex flex-col gap-4 z-10">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-oled-black p-3 border border-white/5 flex items-center gap-4 hover:border-earth-green/30 transition-all cursor-pointer group" style={{ borderRadius: '1.5px' }}>
                            <div className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/5" style={{ borderRadius: '1.5px' }}>
                                <div className={`w-1.5 h-1.5 rounded-full ${i === 2 ? 'bg-stardust-violet animate-pulse shadow-[0_0_8px_rgba(138,43,226,0.6)]' : 'bg-earth-green shadow-[0_0_8px_rgba(45,90,39,0.4)]'}`}></div>
                            </div>
                            <div>
                                <p className="text-[9px] text-white font-black uppercase tracking-widest italic">NODE_00{i}</p>
                                <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">Throughput: {i * 15 + 10} Gbps</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
        @keyframes slide {
          0% { left: -20%; }
          100% { left: 120%; }
        }
        .animate-slide-infinite {
          position: absolute;
          animation: slide 2s linear infinite;
        }
      `}</style>
        </div>
    );
};

export default TrafficPulse;
