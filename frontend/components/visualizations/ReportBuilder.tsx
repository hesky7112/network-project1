import React, { useState } from 'react';
import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import {
    Move,
    Trash2,
    Type,
    BarChart as ChartIcon
} from 'lucide-react';

const data = [
    { name: 'Mon', uv: 4000, pv: 2400, amt: 2400 },
    { name: 'Tue', uv: 3000, pv: 1398, amt: 2210 },
    { name: 'Wed', uv: 2000, pv: 9800, amt: 2290 },
    { name: 'Thu', uv: 2780, pv: 3908, amt: 2000 },
    { name: 'Fri', uv: 1890, pv: 4800, amt: 2181 },
];

interface ReportItem {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    type: 'text' | 'chart' | 'image';
    content?: string;
}

export const ReportBuilder = () => {
    const [layout, setLayout] = useState<ReportItem[]>([
        { i: 'header', x: 0, y: 0, w: 12, h: 2, type: 'text', content: 'Network Performance Report' },
        { i: 'chart1', x: 0, y: 2, w: 6, h: 8, type: 'chart' },
        { i: 'text1', x: 6, y: 2, w: 6, h: 8, type: 'text', content: 'Analysis: Traffic spikes observed on Wednesday due to backup operations.' }
    ]);

    const [counter, setCounter] = useState(0);

    const addItem = (type: 'text' | 'chart' | 'image') => {
        const newItem: ReportItem = {
            i: `new-${counter}`,
            x: (layout.length * 2) % 12,
            y: Infinity,
            w: 4,
            h: 4,
            type
        };
        setLayout([...layout, newItem]);
        setCounter(counter + 1);
    };

    const removeItem = (id: string) => {
        setLayout(layout.filter(l => l.i !== id));
    }

    const renderItemContent = (item: ReportItem) => {
        switch (item.type) {
            case 'chart':
                return (
                    <div className="w-full h-full p-4 flex flex-col">
                        <h4 className="text-sm font-semibold mb-2 text-gray-700">Daily Traffic</h4>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="pv" fill="#8884d8" />
                                    <Bar dataKey="uv" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            case 'text':
                return (
                    <div className="w-full h-full p-6">
                        {item.i.includes('header') ? (
                            <h1 className="text-3xl font-bold text-gray-900 border-b pb-2">{item.content}</h1>
                        ) : (
                            <textarea
                                className="w-full h-full resize-none outline-none bg-transparent text-gray-600"
                                defaultValue={item.content || "Enter text here..."}
                            />
                        )}
                    </div>
                );
            default:
                return <div className="flex items-center justify-center h-full text-gray-400">Unknown Type</div>
        }
    }

    return (
        <div className="bg-gray-100 min-h-screen p-8">
            <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Report Composer</h2>
                <div className="flex gap-2">
                    <button onClick={() => addItem('text')} className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        <Type className="w-4 h-4 mr-2" /> Add Text
                    </button>
                    <button onClick={() => addItem('chart')} className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        <ChartIcon className="w-4 h-4 mr-2" /> Add Chart
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-lg rounded-xl overflow-hidden min-h-[800px] border border-gray-200 mx-auto max-w-5xl">
                {React.createElement(ReactGridLayout as any, {
                    className: "layout",
                    layout: layout,
                    cols: 12,
                    rowHeight: 30,
                    width: 1000,
                    onLayoutChange: (l: any) => setLayout(l),
                    draggableHandle: ".drag-handle"
                }, layout.map(item => (
                    <div key={item.i} className="bg-white border-2 border-transparent hover:border-blue-100 hover:shadow-sm group transition-all rounded-lg relative">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10 bg-white/80 backdrop-blur rounded p-1 shadow-sm">
                            <button className="drag-handle p-1 hover:bg-gray-100 rounded cursor-move text-gray-500">
                                <Move className="w-4 h-4" />
                            </button>
                            <button onClick={() => removeItem(item.i)} className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        {renderItemContent(item)}
                    </div>
                )))}
            </div>
        </div>
    );
};
