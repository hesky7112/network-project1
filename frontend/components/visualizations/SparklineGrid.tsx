"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'

const generateData = () => {
    return Array.from({ length: 20 }, () => ({
        value: Math.floor(Math.random() * 100)
    }))
}

interface SparklineProps {
    label: string
    color: string
}

const Sparkline = ({ label, color }: SparklineProps) => {
    const [data, setData] = useState(generateData())

    useEffect(() => {
        const interval = setInterval(() => {
            setData(prev => {
                const newData = [...prev.slice(1), { value: Math.floor(Math.random() * 100) }]
                return newData
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="flex flex-col border border-gray-100 p-2 rounded-md bg-white shadow-sm">
            <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
            <div className="h-12 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <Tooltip
                            contentStyle={{ background: '#333', border: 'none', borderRadius: '4px', fontSize: '10px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ display: 'none' }}
                            cursor={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="text-right text-xs font-bold text-gray-900 mt-1">
                {data[data.length - 1]?.value ?? 0}%
            </div>
        </div>
    )
}

export function SparklineGrid() {
    const metrics = [
        { label: 'CPU Core 0', color: '#3b82f6' },
        { label: 'CPU Core 1', color: '#3b82f6' },
        { label: 'CPU Core 2', color: '#3b82f6' },
        { label: 'CPU Core 3', color: '#3b82f6' },
        { label: 'Memory', color: '#8b5cf6' },
        { label: 'Disk I/O', color: '#10b981' },
        { label: 'Net RX', color: '#f59e0b' },
        { label: 'Net TX', color: '#ef4444' },
    ]

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm">Real-Time Resources</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {metrics.map((m) => (
                        <Sparkline key={m.label} {...m} />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
