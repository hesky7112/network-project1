import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowDown, ArrowUp } from "lucide-react"

interface StatsCardProps {
    title: string
    value: string | number
    description?: string
    trend?: "up" | "down" | "neutral"
    trendValue?: string
    icon?: React.ReactNode
    className?: string
}

export function StatsCard({
    title,
    value,
    description,
    trend,
    trendValue,
    icon,
    className,
}: StatsCardProps) {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon && <div className="text-muted-foreground">{icon}</div>}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(description || trend) && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        {trend === "up" && <ArrowUp className="h-3 w-3 text-green-500" />}
                        {trend === "down" && <ArrowDown className="h-3 w-3 text-red-500" />}
                        {trendValue && <span className={cn(
                            trend === "up" && "text-green-500",
                            trend === "down" && "text-red-500",
                            "font-medium"
                        )}>{trendValue}</span>}
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
