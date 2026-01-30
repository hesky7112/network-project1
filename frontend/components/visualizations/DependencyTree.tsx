import React from 'react';
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    MarkerType,
    ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';
// import { Server, Database, Globe, Cloud, Shield } from 'lucide-react'; // Unused

const initialNodes: Node[] = [
    {
        id: 'root',
        type: 'default',
        data: { label: 'Core Service' },
        position: { x: 250, y: 0 },
        style: { background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', width: 150 }
    },
    {
        id: 'db',
        type: 'default',
        data: { label: 'Primary DB' },
        position: { x: 100, y: 100 },
        style: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', width: 150 }
    },
    {
        id: 'cache',
        type: 'default',
        data: { label: 'Redis Cache' },
        position: { x: 400, y: 100 },
        style: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', width: 150 }
    },
    {
        id: 'api',
        type: 'default',
        data: { label: 'API Gateway' },
        position: { x: 250, y: 200 },
        style: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', width: 150 }
    },
    {
        id: 'client',
        type: 'default',
        data: { label: 'Web Client' },
        position: { x: 250, y: 300 },
        style: { background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', width: 150 }
    },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: 'root', target: 'db', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e1-3', source: 'root', target: 'cache', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e2-4', source: 'db', target: 'api', animated: false, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e3-4', source: 'cache', target: 'api', animated: false, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e4-5', source: 'api', target: 'client', animated: true, style: { stroke: '#10b981' }, markerEnd: { type: MarkerType.ArrowClosed } },
];

export const DependencyTree = ({ height = 400 }: { height?: number }) => {
    const [isMounted, setIsMounted] = React.useState(false);
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, , onEdgesChange] = useEdgesState(initialEdges);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div style={{ height }} className="border border-gray-200 rounded-lg bg-slate-50 animate-pulse" />;
    }

    return (
        <div style={{ height }} className="border border-gray-200 rounded-lg overflow-hidden shadow-inner bg-slate-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                panOnScroll={false}
                panOnDrag={false}
                preventScrolling={false}
                connectionMode={ConnectionMode.Loose}
            >
                <Background gap={16} size={1} color="#e5e7eb" />
                <Controls />
            </ReactFlow>
        </div>
    );
};
