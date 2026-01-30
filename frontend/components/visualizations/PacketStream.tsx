'use client';

import React, { useEffect, useState, useRef } from 'react';

interface PacketData {
    timestamp: string;
    src_ip: string;
    dst_ip: string;
    protocol: string;
    length: number;
    info: string;
}

interface PacketStreamProps {
    interfaceName?: string;
    maxPackets?: number;
}

export default function PacketStream({
    interfaceName = '\\Device\\NPF_Loopback',
    maxPackets = 100
}: PacketStreamProps) {
    const [packets, setPackets] = useState<PacketData[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const wsUrl = `ws://localhost:8080/api/v1/sniff/live?iface=${encodeURIComponent(interfaceName)}`;

        const connect = () => {
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                setIsConnected(true);
                setError(null);
            };

            wsRef.current.onmessage = (event) => {
                const packet: PacketData = JSON.parse(event.data);
                setPackets((prev) => {
                    const updated = [packet, ...prev];
                    return updated.slice(0, maxPackets);
                });
            };

            wsRef.current.onclose = () => {
                setIsConnected(false);
            };

            wsRef.current.onerror = () => {
                setError('Connection failed. Ensure Npcap is installed.');
                setIsConnected(false);
            };
        };

        connect();

        return () => {
            wsRef.current?.close();
        };
    }, [interfaceName, maxPackets]);

    const getProtocolColor = (protocol: string) => {
        const colors: Record<string, string> = {
            'TCP': 'bg-blue-500/20 text-blue-400',
            'UDP': 'bg-green-500/20 text-green-400',
            'ICMP': 'bg-yellow-500/20 text-yellow-400',
            'UNKNOWN': 'bg-gray-500/20 text-gray-400',
        };
        return colors[protocol] || colors['UNKNOWN'];
    };

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">👑 King Tier: Live Packet Stream</h3>
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                </div>
                <span className="text-xs text-gray-500">{packets.length} packets captured</span>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-900">
                        <tr className="text-gray-500 text-left">
                            <th className="py-2 px-2">Time</th>
                            <th className="py-2 px-2">Source</th>
                            <th className="py-2 px-2">Destination</th>
                            <th className="py-2 px-2">Protocol</th>
                            <th className="py-2 px-2">Length</th>
                            <th className="py-2 px-2">Info</th>
                        </tr>
                    </thead>
                    <tbody>
                        {packets.map((pkt, idx) => (
                            <tr
                                key={idx}
                                className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                            >
                                <td className="py-1.5 px-2 text-gray-400 font-mono text-xs">{pkt.timestamp}</td>
                                <td className="py-1.5 px-2 text-cyan-400 font-mono text-xs">{pkt.src_ip}</td>
                                <td className="py-1.5 px-2 text-purple-400 font-mono text-xs">{pkt.dst_ip}</td>
                                <td className="py-1.5 px-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getProtocolColor(pkt.protocol)}`}>
                                        {pkt.protocol}
                                    </span>
                                </td>
                                <td className="py-1.5 px-2 text-gray-400 text-xs">{pkt.length}B</td>
                                <td className="py-1.5 px-2 text-gray-500 text-xs truncate max-w-[200px]">{pkt.info}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
