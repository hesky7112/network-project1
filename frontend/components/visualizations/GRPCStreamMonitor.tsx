'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProbeMetric {
    id: string;
    probeId: string;
    probeName: string;
    target: string;
    metric: string;
    value: number;
    timestamp: string;
    status: 'online' | 'degraded' | 'offline';
}

// Mock data generator for demo purposes (would be replaced by real gRPC stream)
const generateMockMetric = (probeId: string): ProbeMetric => ({
    id: Math.random().toString(36).substr(2, 9),
    probeId,
    probeName: `Probe-${probeId}`,
    target: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    metric: (['latency', 'packet_loss', 'jitter'][Math.floor(Math.random() * 3)] || 'latency') as string,
    value: Math.random() * 100,
    timestamp: new Date().toISOString(),
    status: Math.random() > 0.9 ? 'degraded' : 'online',
});

export default function GRPCStreamMonitor() {
    const [metrics, setMetrics] = useState<ProbeMetric[]>([]);
    const [probeCount] = useState(5);
    const [isStreaming, setIsStreaming] = useState(true);

    useEffect(() => {
        if (!isStreaming) return;

        // Simulate gRPC stream with polling (would be real WebSocket/gRPC-Web in production)
        const interval = setInterval(() => {
            const probeId = (Math.floor(Math.random() * probeCount) + 1).toString();
            const newMetric = generateMockMetric(probeId);

            setMetrics((prev) => {
                const updated = [newMetric, ...prev];
                return updated.slice(0, 50);
            });
        }, 500);

        return () => clearInterval(interval);
    }, [isStreaming, probeCount]);

    const getMetricColor = (metric: string) => {
        const colors: Record<string, string> = {
            latency: 'from-blue-500 to-cyan-500',
            packet_loss: 'from-red-500 to-orange-500',
            jitter: 'from-purple-500 to-pink-500',
        };
        return colors[metric] || 'from-gray-500 to-gray-600';
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            online: 'bg-green-500',
            degraded: 'bg-yellow-500',
            offline: 'bg-red-500',
        };
        return colors[status] || 'bg-gray-500';
    };

    return (
        <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <span className="text-xl">📡</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">gRPC Stream Monitor</h3>
                        <p className="text-xs text-gray-500">Real-time probe telemetry (King Tier 👑)</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-xs text-gray-500">
                        {probeCount} probes • {metrics.length} events
                    </div>
                    <button
                        onClick={() => setIsStreaming(!isStreaming)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isStreaming
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            }`}
                    >
                        {isStreaming ? '⏸ Pause' : '▶ Resume'}
                    </button>
                </div>
            </div>

            <div className="h-[350px] overflow-y-auto custom-scrollbar space-y-2">
                <AnimatePresence>
                    {metrics.map((metric) => (
                        <motion.div
                            key={metric.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ${getStatusColor(metric.status)}`} />
                                <div>
                                    <div className="text-sm text-white font-medium">{metric.probeName}</div>
                                    <div className="text-xs text-gray-500">→ {metric.target}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getMetricColor(metric.metric)} text-xs text-white font-medium`}>
                                    {metric.metric}
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-mono text-white">
                                        {metric.value.toFixed(2)}
                                        <span className="text-xs text-gray-500 ml-1">
                                            {metric.metric === 'latency' ? 'ms' : metric.metric === 'packet_loss' ? '%' : 'ms'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {new Date(metric.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
