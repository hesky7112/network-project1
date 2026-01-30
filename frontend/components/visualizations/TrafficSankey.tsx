"use client"

import { ResponsiveSankey } from '@nivo/sankey'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const mockData = {
    nodes: [
        { id: "Internet", nodeColor: "hsl(0, 0%, 50%)" },
        { id: "Core Router", nodeColor: "hsl(211, 100%, 50%)" },
        { id: "Firewall", nodeColor: "hsl(350, 100%, 50%)" },
        { id: "DMZ", nodeColor: "hsl(40, 100%, 50%)" },
        { id: "Internal", nodeColor: "hsl(140, 100%, 50%)" },
        { id: "Fileserver", nodeColor: "hsl(280, 100%, 50%)" },
        { id: "Users", nodeColor: "hsl(180, 100%, 50%)" }
    ],
    links: [
        { source: "Internet", target: "Core Router", value: 100 },
        { source: "Core Router", target: "Firewall", value: 80 },
        { source: "Core Router", target: "DMZ", value: 20 },
        { source: "Firewall", target: "Internal", value: 60 },
        { source: "Internal", target: "Fileserver", value: 30 },
        { source: "Internal", target: "Users", value: 30 },
    ]
}

export function TrafficSankey({ height = 400 }) {
    return (
        <Card className="w-full h-full">
            <CardHeader>
                <CardTitle>Network Traffic Flow</CardTitle>
            </CardHeader>
            <CardContent style={{ height }}>
                <ResponsiveSankey
                    data={mockData}
                    margin={{ top: 40, right: 160, bottom: 40, left: 50 }}
                    align="justify"
                    colors={{ scheme: 'category10' }}
                    nodeOpacity={1}
                    nodeHoverOthersOpacity={0.35}
                    nodeThickness={18}
                    nodeSpacing={24}
                    nodeBorderWidth={0}
                    nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
                    linkOpacity={0.5}
                    linkHoverOthersOpacity={0.1}
                    linkContract={3}
                    enableLinkGradient={true}
                    labelPosition="outside"
                    labelOrientation="vertical"
                    labelPadding={16}
                    labelTextColor={{ from: 'color', modifiers: [['darker', 1]] }}
                    animate={true}
                />
            </CardContent>
        </Card>
    )
}
