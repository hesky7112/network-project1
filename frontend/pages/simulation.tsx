import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Head from 'next/head'
import Layout from '@/components/layout'
import { apiClient } from '@/lib/api'
import {
    Activity,
    Server,
    Zap,
    Cpu,
    Network,
    Play,
    AlertTriangle,
    RefreshCw
} from 'lucide-react'

// Types matching backend
interface VirtualNode {
    id: string
    name: string
    type: string
    status: string // "up", "down"
    metadata: Record<string, any>
    x?: number // For visualization
    y?: number
}

interface VirtualLink {
    id: string
    source: string
    target: string
    latency: number
    packet_loss: number
    status: string // "up", "down"
}

interface Topology {
    nodes: Record<string, VirtualNode>
    links: VirtualLink[]
}

export default function Simulation() {
    const [logs, setLogs] = useState<string[]>([])
    const [selectedNode, setSelectedNode] = useState<string | null>(null)

    // Fetch Topology
    const { data: topology, refetch } = useQuery<Topology>({
        queryKey: ['simulation-topology'],
        queryFn: async () => {
            const { data } = await apiClient.get('/simulation/topology')
            // Add mock coordinates for demo visualization if missing
            const nodesWithCoords = { ...data.nodes }
            const positions = [
                { x: 100, y: 150 }, { x: 400, y: 150 }, { x: 250, y: 300 },
                { x: 100, y: 450 }, { x: 400, y: 450 }
            ]
            let i = 0
            for (const key in nodesWithCoords) {
                const node = nodesWithCoords[key]
                if (node && !node.x) {
                    const pos = positions[i % 5];
                    if (pos) {
                        node.x = pos.x;
                        node.y = pos.y;
                    }
                    i++;
                }
            }
            return { ...data, nodes: nodesWithCoords }
        },
        refetchInterval: 5000 // Live updates
    })

    // Mutations
    const pingMutation = useMutation({
        mutationFn: async ({ source, target }: { source: string, target: string }) => {
            const { data } = await apiClient.post('/simulation/ping', { source_id: source, target_id: target })
            return data
        },
        onSuccess: (data) => {
            addLog(`Ping Result: ${data.latency_ms}ms (Path: ${data.path.join(' -> ')})`)
        },
        onError: (err: any) => {
            addLog(`Ping Failed: ${err.response?.data?.error || err.message}`)
        }
    })

    const failureMutation = useMutation({
        mutationFn: async ({ target, type }: { target: string, type: string }) => {
            await apiClient.post('/simulation/failure', { target_id: target, type })
        },
        onSuccess: (_, vars) => {
            addLog(`Injected ${vars.type} failure on ${vars.target}`)
            refetch()
        }
    })

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10))
    }

    // Helper to get coordinates
    const getCoords = (nodeId: string) => {
        const node = topology?.nodes[nodeId]
        return { x: node?.x || 0, y: node?.y || 0 }
    }

    return (
        <Layout title="Network Simulation">
            <Head>
                <title>Network Simulation | Alien Net</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <Cpu className="w-8 h-8 text-alien-green" />
                            Holodeck Simulation
                        </h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                            Virtual Network Digital Twin
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => refetch()}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" /> Sync State
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Topology Canvas */}
                    <div className="lg:col-span-2 bg-black/50 backdrop-blur border border-white/10 rounded-xl p-1 relative overflow-hidden min-h-[500px]">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

                        <div className="relative z-10 w-full h-full p-6">
                            <h3 className="absolute top-4 left-6 text-xs font-black text-alien-green uppercase tracking-widest flex items-center gap-2">
                                <Network className="w-4 h-4" /> Live Topology
                            </h3>

                            <svg className="w-full h-full min-h-[400px]">
                                {/* Links */}
                                {topology?.links.map(link => {
                                    const src = getCoords(link.source)
                                    const dst = getCoords(link.target)
                                    return (
                                        <g key={link.id}>
                                            <line
                                                x1={src.x + 24} y1={src.y + 24}
                                                x2={dst.x + 24} y2={dst.y + 24}
                                                stroke={link.status === 'up' ? '#4ade80' : '#ef4444'}
                                                strokeWidth="2"
                                                strokeOpacity="0.6"
                                                strokeDasharray={link.status === 'up' ? "0" : "5,5"}
                                            />
                                            {/* Latency Label */}
                                            <text
                                                x={(src.x + dst.x) / 2 + 24}
                                                y={(src.y + dst.y) / 2 + 15}
                                                fill="#94a3b8"
                                                fontSize="10"
                                                textAnchor="middle"
                                                className="font-mono"
                                            >
                                                {link.latency}ms
                                            </text>
                                        </g>
                                    )
                                })}

                                {/* Nodes - Rendered via ForeignObject for HTML content or just SVG groups */}
                            </svg>

                            {/* Nodes Overlay (Using absolute divs for interactivity) */}
                            {topology?.nodes && Object.values(topology.nodes).map(node => (
                                <div
                                    key={node.id}
                                    style={{ left: node.x, top: node.y }}
                                    onClick={() => setSelectedNode(node.id)}
                                    className={`absolute w-12 h-12 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-300 group
                                        ${selectedNode === node.id ? 'border-alien-green shadow-[0_0_15px_rgba(74,222,128,0.5)] bg-slate-900' : 'border-slate-700 bg-slate-950 hover:border-slate-500'}
                                    `}
                                >
                                    <Server className={`w-6 h-6 ${node.status === 'up' ? 'text-blue-400' : 'text-red-500'}`} />

                                    {/* Label */}
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-black/80 px-1 rounded">
                                            {node.name}
                                        </span>
                                    </div>

                                    {/* Type Badge */}
                                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 text-[8px] font-bold text-white">
                                        {node.type?.[0]?.toUpperCase() || '?'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Controls & Logs */}
                    <div className="space-y-6">
                        {/* Control Panel */}
                        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-6">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-purple-400" /> Operaions
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                        Target Node
                                    </label>
                                    <div className="p-3 bg-black/50 border border-white/10 rounded text-sm font-mono text-cyan-400">
                                        {selectedNode || "Select a node..."}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        disabled={!selectedNode}
                                        onClick={() => pingMutation.mutate({ source: 'router-core', target: selectedNode! })}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
                                    >
                                        <Play className="w-3 h-3" /> Ping Source
                                    </button>
                                    <button
                                        disabled={!selectedNode}
                                        onClick={() => failureMutation.mutate({ target: selectedNode!, type: 'down' })}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
                                    >
                                        <AlertTriangle className="w-3 h-3" /> Kill Node
                                    </button>
                                </div>
                                <button
                                    disabled={!selectedNode}
                                    onClick={() => failureMutation.mutate({ target: selectedNode!, type: 'cut' })}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
                                >
                                    <Zap className="w-3 h-3" /> Cut Links
                                </button>
                            </div>
                        </div>

                        {/* Event Log */}
                        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-6 flex-1 h-[300px] overflow-hidden flex flex-col">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Server className="w-4 h-4 text-green-400" /> Event Stream
                            </h3>
                            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar font-mono text-xs">
                                {logs.length === 0 && (
                                    <div className="text-slate-600 italic">No events recorded...</div>
                                )}
                                {logs.map((log, i) => (
                                    <div key={i} className="text-slate-300 border-l-2 border-slate-700 pl-2 py-1">
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
