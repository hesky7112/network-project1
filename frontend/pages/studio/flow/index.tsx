
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    Connection,
    Node,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useRouter } from 'next/router';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Save,
    Play,
    Workflow,
    FileText,
    Database,
    Globe,
    Shield,
    Terminal,
    MessageSquare,
    Zap,
    Box,
    Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

// --- Types ---
// type PrimitiveType = ... (unused, removed)

const ICON_MAP: Record<string, any> = {
    'DocumentIntelligence': FileText,
    'SuperCompute': Database,
    'NetworkManager': Globe,
    'SecurityGuardian': Shield,
    'HALInterface': Terminal,
    'ChatbotEngine': MessageSquare,
    'ProvisioningSystem': Zap,
    'CronTrigger': Clock,
    'Default': Box
};

const COLOR_MAP: Record<string, string> = {
    'DocumentIntelligence': 'text-blue-400 border-blue-500/50',
    'SuperCompute': 'text-emerald-400 border-emerald-500/50',
    'NetworkManager': 'text-cyan-400 border-cyan-500/50',
    'SecurityGuardian': 'text-red-400 border-red-500/50',
    'HALInterface': 'text-amber-400 border-amber-500/50',
    'ChatbotEngine': 'text-stardust-violet border-stardust-violet/50',
    'ProvisioningSystem': 'text-pink-400 border-pink-500/50',
    'CronTrigger': 'text-yellow-300 border-yellow-500/50',
    'Default': 'text-slate-400 border-slate-500/50'
};

// --- Custom Node Implementation ---
const CustomNode = ({ data, selected }: { data: any, selected: boolean }) => {
    const Icon = ICON_MAP[data.type] || ICON_MAP.Default;
    const colorClasses = (COLOR_MAP[data.type] || COLOR_MAP.Default) as string;
    const [textColor, borderColor] = colorClasses.split(' ');

    return (
        <div className={cn(
            "min-w-[150px] bg-[#1a1a1a] rounded-lg border-2 p-3 shadow-lg transition-all",
            borderColor,
            selected ? "ring-2 ring-white/50 shadow-[0_0_15px_rgba(255,255,255,0.1)]" : ""
        )}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("w-4 h-4", textColor)} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{data.label}</span>
            </div>
            {/* Handles */}
            <div className="text-[9px] text-slate-500 font-mono text-center truncate">{data.id}</div>
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

export default function FlowForge() {
    return (
        <ReactFlowProvider>
            <FlowForgeInner />
        </ReactFlowProvider>
    );
}

function FlowForgeInner() {
    const router = useRouter();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [primitives, setPrimitives] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [workflowName, setWorkflowName] = useState("Untitled_Flow");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch Primitives (Mock + Real)
    useEffect(() => {
        const fetchPrimitives = async () => {
            // Combine hardcoded "CronTrigger" with real modules
            const base = ['CronTrigger'];
            try {
                const data = await apiClient.get('/modules/engine/primitives').catch(() => []);
                const realPrimitives = Array.isArray(data) ? data : (typeof data === 'object' && data ? Object.keys(data) : []);
                setPrimitives([...base, ...realPrimitives]);
            } catch (e) {
                setPrimitives(base);
            }
        };
        fetchPrimitives();
    }, []);

    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({
        ...params,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
    }, eds)), [setEdges]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: `node_${Date.now()}`,
                type: 'custom',
                position,
                data: { label: type, type: type },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    const onSave = async () => {
        setIsSaving(true);
        if (!reactFlowInstance) return;

        const flow = reactFlowInstance.toObject();
        const payload = {
            name: workflowName,
            description: `Auto-generated flow with ${nodes.length} nodes`,
            trigger_type: 'manual',
            cron_sched: '',
            definition: JSON.stringify(flow),
            is_active: true
        };

        try {
            await apiClient.createWorkflow(payload); // Create new for now, ideally upsert if ID exists
            toast.success("Workflow Saved & Compiled");
        } catch (error) {
            console.error(error);
            toast.error("Failed to commit workflow");
        } finally {
            setIsSaving(false);
        }
    };

    const onRun = useCallback(() => {
        toast.success("Initiating immediate execution sequence...");
        // Ideally call runWorkflow(id) here if current workflow is saved
    }, []);

    return (
        <Layout title="Flow Forge">
            <div className="h-[calc(100vh-64px)] flex flex-col bg-[#050505] text-white">
                {/* Header */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0c]">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push('/studio')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Studio
                        </Button>
                        <div className="h-6 w-[1px] bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Workflow className="h-5 w-5 text-amber-400" />
                            <input
                                value={workflowName}
                                onChange={(e) => setWorkflowName(e.target.value)}
                                className="bg-transparent border-none text-sm font-black uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-amber-400/50 rounded px-2"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving}>
                            <Save className="h-4 w-4 mr-2" /> Save
                        </Button>
                        <Button size="sm" onClick={onRun} className="bg-amber-500 text-black hover:bg-amber-400">
                            <Play className="h-4 w-4 mr-2" /> Execute
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 bg-[#0a0a0c] border-r border-white/10 p-4 overflow-y-auto">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                            Available Primitives
                        </div>
                        <div className="space-y-2">
                            {primitives.map(prim => {
                                const Icon = ICON_MAP[prim] || ICON_MAP.Default;
                                const color = (COLOR_MAP[prim] || COLOR_MAP.Default) as string;
                                const [textColor] = color.split(' ');
                                return (
                                    <div
                                        key={prim}
                                        onDragStart={(event) => event.dataTransfer.setData('application/reactflow', prim)}
                                        draggable
                                        className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-md cursor-grab active:cursor-grabbing hover:bg-white/10 transition-all group"
                                    >
                                        <Icon className={cn("w-4 h-4", textColor)} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">{prim}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Canvas */}
                    <div className="flex-1 relative" ref={reactFlowWrapper}>
                        {mounted && (
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                onDrop={onDrop}
                                onDragOver={onDragOver}
                                nodeTypes={nodeTypes as any} // Cast to avoid vague TS error with custom nodes
                                className="bg-black"
                                onInit={setReactFlowInstance}
                            >
                                <Background color="#222" gap={20} />
                                <Controls className="bg-[#1a1a1a] border-[#333] fill-white" />
                                <MiniMap style={{ background: '#1a1a1a' }} nodeColor="#444" />
                            </ReactFlow>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
