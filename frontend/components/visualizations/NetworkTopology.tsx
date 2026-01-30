"use client"

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import ReactFlow, {
    Background,
    Controls,
    Node,
    Edge,
    useNodesState,
    useEdgesState,
    Panel,
    MarkerType,
    ReactFlowProvider,
    useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Cloud,
    Router,
    Server,
    Shield,
    Wifi,
    Zap,
    Box,
    Laptop,
    RefreshCw,
    Activity
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { motion } from 'framer-motion'

// --- Dijkstra Algorithm ---
const findShortestPath = (nodes: Node[], edges: Edge[], startNodeId: string, endNodeId: string) => {
    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: string | null } = {};
    const queue: string[] = [];

    nodes.forEach(node => {
        if (node.id) {
            distances[node.id] = Infinity;
            previous[node.id] = null;
            queue.push(node.id);
        }
    });

    if (startNodeId) distances[startNodeId] = 0;

    while (queue.length > 0) {
        queue.sort((a, b) => (distances[a] ?? Infinity) - (distances[b] ?? Infinity));
        const current = queue.shift();
        if (!current) break;

        if (current === endNodeId) break;
        if (distances[current] === Infinity) break;

        const neighbors = edges.filter(e => e.source === current || e.target === current);
        neighbors.forEach(edge => {
            const neighborId = edge.source === current ? edge.target : edge.source;
            if (!queue.includes(neighborId)) return;

            const alt = (distances[current] ?? Infinity) + 1;
            if (alt < (distances[neighborId] ?? Infinity)) {
                distances[neighborId] = alt;
                previous[neighborId] = current;
            }
        });
    }

    const path: string[] = [];
    let curr: string | null = endNodeId;
    while (curr) {
        path.unshift(curr);
        const prev: string | null = previous[curr] as string | null;
        curr = prev !== undefined ? prev : null;
    }

    return path.length > 1 && path[0] === startNodeId ? path : [];
};

// --- Custom Node Component ---
const NetworkNode = ({ data, selected }: { data: any, selected: boolean }) => {
    const Icon = useMemo(() => {
        switch (data.type?.toLowerCase()) {
            case 'router': case 'edge': return Router
            case 'switch': case 'access': case 'distribution': return Box
            case 'firewall': return Shield
            case 'server': return Server
            case 'cloud': return Cloud
            case 'ap': return Wifi
            case 'client': return Laptop
            default: return Zap
        }
    }, [data.type])

    const glowColor = useMemo(() => {
        if (data.status === 'down') return '0 0 15px #ef4444'
        if (data.status === 'warning') return '0 0 15px #f59e0b'
        return '0 0 15px #10b981'
    }, [data.status])

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`relative group px-4 py-3 rounded-xl border-2 transition-all duration-300 ${selected ? 'border-indigo-400 bg-indigo-900/40' : 'border-gray-800 bg-[#0a0a0c]'
                }`}
            style={{ boxShadow: selected ? `0 0 20px #6366f1` : 'none' }}
        >
            <div className={`absolute -inset-0.5 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200`}
                style={{ backgroundColor: data.status === 'down' ? '#ef4444' : '#10b981' }}
            ></div>

            <div className="relative flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${data.status === 'down' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                    }`} style={{ filter: `drop-shadow(${glowColor})` }}>
                    <Icon className="h-6 w-6" />
                </div>

                <div className="flex flex-col">
                    <span className="text-sm font-bold text-white tracking-tight">{data.label}</span>
                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{data.type}</span>
                    {data.ip && <span className="text-[10px] text-indigo-400 font-mono mt-0.5">{data.ip}</span>}
                </div>
            </div>

            {/* Status Pulse */}
            <div className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${data.status === 'down' ? 'bg-red-400' : 'bg-emerald-400'
                    }`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${data.status === 'down' ? 'bg-red-500' : 'bg-emerald-500'
                    }`}></span>
            </div>
        </motion.div>
    )
}

const nodeTypes = {
    networkNode: NetworkNode,
}

interface NetworkTopologyProps {
    initialNodes?: Node[]
    initialEdges?: Edge[]
    height?: number | string
}

export function NetworkTopology(props: NetworkTopologyProps) {
    return (
        <ReactFlowProvider>
            <TopologyInner {...props} />
        </ReactFlowProvider>
    )
}

function TopologyInner({ }: NetworkTopologyProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [isLoading, setIsLoading] = useState(true)
    const [pathfinding, setPathfinding] = useState<{ start: string | null; end: string | null }>({ start: null, end: null })
    const [highlightedPath, setHighlightedPath] = useState<string[]>([])
    const { fitView, getNodes } = useReactFlow()

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await apiClient.exportTopologyData()

            if (!data || !data.nodes) {
                console.warn("No topology data received")
                setNodes([])
                setEdges([])
                return
            }

            const apiNodes: Node[] = data.nodes.map((n: any) => ({
                id: String(n.id),
                type: 'networkNode',
                position: { x: n.coordinates.x, y: n.coordinates.y },
                data: {
                    label: n.hostname,
                    type: n.device_type,
                    status: 'up', // Assuming up for demo, logic can be added
                    ip: n.ip_address,
                    role: n.role
                }
            }))

            const apiEdges: Edge[] = data.links.map((l: any, idx: number) => ({
                id: `e-${idx}`,
                source: String(l.source),
                target: String(l.destination),
                animated: true,
                label: `${l.bandwidth}M`,
                style: { stroke: '#4b5563', strokeWidth: 2 },
                labelStyle: { fill: '#9ca3af', fontWeight: 700, fontSize: 10 },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#4b5563',
                },
            }))

            setNodes(apiNodes)
            setEdges(apiEdges)
        } catch (error) {
            console.error("Failed to fetch topology:", error)
        } finally {
            setIsLoading(false)
            // Use getNodes() to avoid closure issues and disable animation for initial fit
            setTimeout(() => {
                const currentNodes = getNodes()
                if (currentNodes.length > 0) {
                    try {
                        fitView({ padding: 0.2, duration: 0 }); // No duration to avoid selection.interrupt conflict on mount
                    } catch (e) {
                        console.warn("fitView failed:", e);
                    }
                }
            }, 500);
        }
    }, [setNodes, setEdges, fitView, getNodes])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const onNodeClick = (_: any, node: Node) => {
        if (!pathfinding.start) {
            setPathfinding({ ...pathfinding, start: node.id })
        } else if (!pathfinding.end && node.id !== pathfinding.start) {
            setPathfinding({ ...pathfinding, end: node.id })
            const path = findShortestPath(nodes, edges, pathfinding.start, node.id)
            setHighlightedPath(path)
        } else {
            setPathfinding({ start: node.id, end: null })
            setHighlightedPath([])
        }
    }

    // Effect to highlight edges in the path
    useEffect(() => {
        if (highlightedPath.length > 0) {
            setEdges(eds => eds.map(edge => {
                const isInPath = highlightedPath.some((id, idx) =>
                    (id === edge.source && highlightedPath[idx + 1] === edge.target) ||
                    (id === edge.target && highlightedPath[idx + 1] === edge.source)
                )
                return {
                    ...edge,
                    style: {
                        stroke: isInPath ? '#6366f1' : '#4b5563',
                        strokeWidth: isInPath ? 4 : 2,
                        filter: isInPath ? 'drop-shadow(0 0 8px #6366f1)' : 'none'
                    },
                    animated: isInPath
                }
            }))
        } else {
            setEdges(eds => eds.map(edge => ({
                ...edge,
                style: { stroke: '#4b5563', strokeWidth: 2 },
                animated: true
            })))
        }
    }, [highlightedPath, setEdges])

    const resetPath = () => {
        setPathfinding({ start: null, end: null })
        setHighlightedPath([])
    }

    return (
        <Card className="w-full bg-[#0a0a0c] border-gray-800 shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-800 flex flex-row items-center justify-between py-4">
                <div>
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                        <Activity className="h-5 w-5 text-indigo-500" />
                        Network Infrastructure Map
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-mono">Automated Discovery & Path Analysis</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800">
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Re-Scan
                    </Button>
                    {highlightedPath.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={resetPath} className="bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30">
                            Clear Path
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0 bg-[#060608] relative w-full overflow-hidden min-h-[500px]">
                <div style={{ height: '600px', width: '100%' }} className="w-full relative block">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={onNodeClick}
                        nodeTypes={nodeTypes}
                        className="bg-dot-white/[0.05]"
                    >
                        <Background color="#1f1f23" gap={20} />
                        <Controls className="bg-gray-900 border-gray-800 fill-white" />
                        {/* MiniMap causes d3 conflict crash on some versions */}
                        {/* <MiniMap
                            nodeStrokeColor={(n) => n.data.status === 'down' ? '#ef4444' : '#10b981'}
                            nodeColor={(n) => n.data.status === 'down' ? '#ef444422' : '#10b98122'}
                            maskColor="rgba(0, 0, 0, 0.7)"
                            style={{ backgroundColor: '#0a0a0c' }}
                        /> */}

                        <Panel position="top-left" className="bg-gray-900/80 backdrop-blur-md p-3 border border-gray-800 rounded-lg m-4 space-y-2">
                            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">Network Analysis</div>
                            <div className="flex items-center gap-2 text-xs text-white">
                                <div className={`h-2 w-2 rounded-full ${pathfinding.start ? 'bg-indigo-500 shadow-[0_0_8px_#6366f1]' : 'bg-gray-600'}`} />
                                Origin: <span className="text-indigo-400">{pathfinding.start ? (nodes.find(n => n.id === pathfinding.start)?.data.label) : 'Select Node'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white">
                                <div className={`h-2 w-2 rounded-full ${pathfinding.end ? 'bg-indigo-500 shadow-[0_0_8px_#6366f1]' : 'bg-gray-600'}`} />
                                Target: <span className="text-indigo-400">{pathfinding.end ? (nodes.find(n => n.id === pathfinding.end)?.data.label) : 'Select Node'}</span>
                            </div>
                            {highlightedPath.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-gray-800">
                                    <div className="text-[10px] text-emerald-400 font-mono animate-pulse">Optimal Path Calculated: {highlightedPath.length - 1} Hops</div>
                                </div>
                            )}
                        </Panel>

                        <Panel position="bottom-center" className="bg-gray-900/40 backdrop-blur-sm px-6 py-2 border border-white/5 rounded-full mb-8">
                            <div className="flex items-center gap-8 text-[10px] uppercase tracking-tighter text-gray-500 font-mono">
                                <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" /> Operational</div>
                                <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 bg-red-500 rounded-full" /> Failure</div>
                                <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 bg-indigo-500 rounded-full" /> Selected Path</div>
                            </div>
                        </Panel>
                    </ReactFlow>
                </div>
            </CardContent>
        </Card>
    )
}
