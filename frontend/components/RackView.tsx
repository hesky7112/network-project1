import React from 'react';

interface Device {
    Name: string;
    IPAddress: string;
    DeviceType: string;
}

interface RackViewProps {
    devices?: Device[];
}

const RackView: React.FC<RackViewProps> = ({ devices = [] }) => {
    return (
        <div className="perspective-1000 w-full h-[600px] flex items-center justify-center bg-slate-900 rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent opacity-50"></div>

            {/* 3D Rack Container */}
            <div className="relative w-96 h-[500px] transform-style-3d rotate-y-[-20deg] rotate-x-[10deg] transition-transform duration-700 hover:rotate-y-[-10deg]">

                {/* Rack Frame */}
                <div className="absolute inset-0 bg-slate-800 border-x-4 border-slate-700 shadow-2xl flex flex-col p-4 gap-2">

                    {/* LED Indicators on Frame */}
                    <div className="absolute left-[-10px] top-10 flex flex-col gap-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_green]"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_green]"></div>
                    </div>

                    {/* Unit Slots */}
                    {[...Array(12)].map((_, i) => {
                        const device = devices[i];
                        return (
                            <div
                                key={i}
                                className={`h-10 border border-slate-700/50 rounded flex items-center px-4 relative group transition-all duration-300
                  ${device ? 'bg-slate-700 shadow-lg border-blue-500/50' : 'bg-slate-800/30'}`}
                            >
                                {device ? (
                                    <>
                                        <div className="w-4 h-4 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></div>
                                        </div>
                                        <span className="text-xs font-mono text-slate-300 truncate">{device.Name || 'Managed Device'}</span>
                                        <div className="ml-auto flex gap-1">
                                            {[...Array(4)].map((_, j) => (
                                                <div key={j} className="w-1.5 h-1 bg-green-500/40 rounded-sm"></div>
                                            ))}
                                        </div>
                                        {/* Hover Detail Overlay */}
                                        <div className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-2xl pointer-events-none z-50 min-w-[200px]">
                                            <h4 className="text-blue-400 font-bold text-sm">Device: {device.Name}</h4>
                                            <p className="text-slate-400 text-[10px] mt-1">IP: {device.IPAddress}</p>
                                            <p className="text-slate-400 text-[10px] uppercase">{device.DeviceType}</p>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-[10px] text-slate-600 font-mono">1U EMPTY SLOT</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Depth Sides (CSS 3D) */}
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-slate-900 origin-right transform rotate-y-90 shadow-inner border-l border-slate-700"></div>
                <div className="absolute left-0 right-0 top-0 h-20 bg-slate-900 origin-top transform rotate-x-[-90deg] border-b border-slate-700"></div>
            </div>

            <div className="absolute bottom-8 left-8">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent italic">Alien Rack v1.0</h3>
                <p className="text-slate-500 text-xs">Real-time 3D Hardware Simulation</p>
            </div>
        </div>
    );
};

export default RackView;
