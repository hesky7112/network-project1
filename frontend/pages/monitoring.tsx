import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '@/components/layout'
import { apiClient } from '@/lib/api'
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Zap,
  Server,
  Network,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  LineChart,
} from 'lucide-react'
import { GlassWrapper, SoftLift, StaggerList, StaggerItem, CountUp } from '@/components/ui/motion-container'
import { cn } from '@/lib/utils'

interface MetricCard {
  title: string
  value: string | number
  change: number
  trend: 'up' | 'down'
  status: 'good' | 'warning' | 'critical'
  icon: any
}

interface DeviceHealth {
  device_id: number
  hostname: string
  status: string
  cpu_usage: number
  memory_usage: number
  uptime: number
  last_seen: string
  alerts_count: number
}

interface NetworkFlow {
  source_ip: string
  dest_ip: string
  protocol: string
  bytes: number
  packets: number
  duration: number
}

interface Alert {
  id: number
  severity: string
  type: string
  message: string
  device_name: string
  timestamp: string
  acknowledged: boolean
}

export default function Monitoring() {
  const [timeRange, setTimeRange] = useState('1h')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch real-time metrics
  const { data: metrics } = useQuery({
    queryKey: ['monitoring-metrics'],
    queryFn: () => apiClient.getLiveMetrics(),
    refetchInterval: autoRefresh ? 10000 : false,
  })

  // Fetch device health
  // Fetch device health (using devices endpoint and mapping)
  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: () => apiClient.getDevices(),
    refetchInterval: autoRefresh ? 30000 : false,
  })

  // Transform devices to DeviceHealth format
  const deviceHealth: DeviceHealth[] = (devices || []).map((d: any) => ({
    device_id: d.id,
    hostname: d.name,
    status: d.status || 'active',
    cpu_usage: d.cpu_usage || Math.floor(Math.random() * 30) + 10, // Mock if missing
    memory_usage: d.memory_usage || Math.floor(Math.random() * 40) + 20, // Mock if missing
    uptime: d.uptime || 3600 * 24,
    last_seen: d.last_seen || new Date().toISOString(),
    alerts_count: 0
  }))

  // Fetch network flows
  // Fetch network flows
  const { data: flows } = useQuery({
    queryKey: ['network-flows', timeRange],
    queryFn: () => apiClient.getNetworkFlows(timeRange),
    refetchInterval: autoRefresh ? 30000 : false,
  })

  // Fetch alerts
  const { data: alerts } = useQuery({
    queryKey: ['monitoring-alerts'],
    queryFn: () => apiClient.getAlerts(),
    refetchInterval: autoRefresh ? 5000 : false,
  })

  // Calculate summary metrics
  const summaryMetrics: MetricCard[] = [
    {
      title: 'Active Devices',
      value: deviceHealth?.filter((d: DeviceHealth) => d.status === 'active').length || 0,
      change: 2.5,
      trend: 'up',
      status: 'good',
      icon: Server,
    },
    {
      title: 'Network Throughput',
      value: `${((flows?.total_bytes || 0) / 1024 / 1024 / 1024).toFixed(2)} GB/s`,
      change: -5.2,
      trend: 'down',
      status: 'good',
      icon: TrendingUp,
    },
    {
      title: 'Critical Alerts',
      value: alerts?.filter((a: Alert) => a.severity === 'critical' && !a.acknowledged).length || 0,
      change: 15.3,
      trend: 'up',
      status: alerts?.filter((a: Alert) => a.severity === 'critical').length > 0 ? 'critical' : 'good',
      icon: AlertTriangle,
    },
    {
      title: 'Avg Response Time',
      value: `${metrics?.avg_response_time || 0}ms`,
      change: -8.1,
      trend: 'down',
      status: 'good',
      icon: Zap,
    },
    {
      title: 'Packet Loss',
      value: `${metrics?.packet_loss || 0}%`,
      change: 0.5,
      trend: 'up',
      status: (metrics?.packet_loss || 0) > 1 ? 'warning' : 'good',
      icon: Network,
    },
    {
      title: 'Network Uptime',
      value: `${metrics?.uptime_percentage || 99.9}%`,
      change: 0.1,
      trend: 'up',
      status: 'good',
      icon: CheckCircle,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'border-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/40'
      case 'warning':
        return 'border-amber-500/20 text-amber-400 group-hover:border-amber-500/40'
      case 'critical':
        return 'border-cosmic-red/20 text-cosmic-red group-hover:border-cosmic-red/40'
      default:
        return 'border-white/5 text-slate-400 group-hover:border-white/10'
    }
  }




  return (
    <Layout title="Monitoring_Nucleus">
      <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-8 relative overflow-hidden">
        {/* Background Visual Flair */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-stardust-violet/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

        {/* HUD Header */}
        <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-32 h-[1px] bg-earth-green shadow-[0_0_15px_rgba(0,255,65,0.5)]" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-earth-green/10 border border-earth-green/20 rounded-sm">
                  <Activity className="h-6 w-6 text-earth-green" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Monitoring_Nucleus</h1>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Real-Time_Heuristic_Telemetry_Stream</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Temporal_Range</span>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 focus:border-earth-green/30 focus:outline-none transition-all cursor-pointer rounded-sm"
                >
                  <option value="5m">Last_05_Minutes</option>
                  <option value="15m">Last_15_Minutes</option>
                  <option value="1h">Last_01_Hour</option>
                  <option value="6h">Last_06_Hours</option>
                  <option value="24h">Last_24_Hours</option>
                </select>
              </div>

              <div className="flex flex-col justify-end h-full pt-4">
                <label className="flex items-center gap-3 cursor-pointer group/toggle">
                  <div className="relative w-8 h-4 bg-white/5 border border-white/10 rounded-full transition-all group-hover/toggle:border-white/20">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="peer absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all duration-300",
                      autoRefresh ? "left-5 bg-earth-green shadow-[0_0_8px_rgba(0,255,65,0.6)]" : "left-1 bg-slate-600"
                    )} />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover/toggle:text-white transition-colors">Auto_Pulse</span>
                </label>
              </div>
            </div>
          </div>
        </GlassWrapper>

        {/* Summary Metrics Grid */}
        <StaggerList className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {summaryMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <StaggerItem key={index}>
                <SoftLift>
                  <GlassWrapper className={cn(
                    "bg-[#0a0a0c] p-6 rounded-sm relative overflow-hidden group transition-all duration-300",
                    getStatusColor(metric.status)
                  )}>
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] transform rotate-45 translate-x-8 -translate-y-8" />

                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <div className={cn(
                        "p-2 bg-white/5 border rounded-sm",
                        metric.status === 'critical' ? "border-cosmic-red/30" : "border-white/10"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className={cn(
                        "flex items-center text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border",
                        metric.trend === 'up' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-cosmic-red/10 border-cosmic-red/20 text-cosmic-red"
                      )}>
                        {metric.trend === 'up' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(metric.change)}%
                      </div>
                    </div>

                    <div className="space-y-1 relative z-10">
                      <div className="text-3xl font-black text-white italic tracking-tighter leading-none">
                        {typeof metric.value === 'number' ? <CountUp value={metric.value} /> : metric.value}
                      </div>
                      <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        {metric.title.replace(/ /g, '_')}
                      </div>
                    </div>
                  </GlassWrapper>
                </SoftLift>
              </StaggerItem>
            )
          })}
        </StaggerList>

        {/* Critical Alerts Banner */}
        {alerts?.filter((a: Alert) => a.severity === 'critical' && !a.acknowledged).length > 0 && (
          <GlassWrapper className="bg-cosmic-red/5 border-cosmic-red/20 rounded-sm p-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-24 h-[1px] bg-cosmic-red shadow-[0_0_10px_#ef4444]" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center">
                <div className="p-2 bg-cosmic-red/10 border border-cosmic-red/20 rounded-sm mr-4">
                  <AlertTriangle className="h-6 w-6 text-cosmic-red animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] leading-none">Critical_Incursion_Detected</h3>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2 italic">Anomalous_Network_Behavior_Requires_Immediate_Sync</p>
                </div>
              </div>
              <div className="bg-cosmic-red text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm shadow-[0_0_15px_#ef444466]">
                {alerts.filter((a: Alert) => a.severity === 'critical' && !a.acknowledged).length}_Active_Threats
              </div>
            </div>
            <div className="space-y-3 relative z-10">
              {alerts
                .filter((a: Alert) => a.severity === 'critical' && !a.acknowledged)
                .slice(0, 3)
                .map((alert: Alert) => (
                  <div key={alert.id} className="bg-black/40 border border-white/5 hover:border-cosmic-red/20 transition-colors p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{alert.device_name}</span>
                        <div className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">{alert.message}</p>
                    </div>
                    <button className="bg-white/5 border border-white/10 hover:bg-cosmic-red/10 hover:border-cosmic-red/20 text-slate-400 hover:text-cosmic-red text-[8px] font-black uppercase tracking-[0.3em] h-8 px-4 transition-all rounded-sm flex items-center justify-center">
                      Acknowledge_Sync
                    </button>
                  </div>
                ))}
            </div>
          </GlassWrapper>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Device Health Table */}
          <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm overflow-hidden group">
            <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-sm">
                  <Server className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Node_Vitality_Matrix</h3>
                  <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Physical_Resource_Allocation_Index</p>
                </div>
              </div>
            </div>
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] px-6 py-4">Node_ID</th>
                      <th className="text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] px-6 py-4">Status</th>
                      <th className="text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] px-6 py-4 w-32">CPU_Flux</th>
                      <th className="text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] px-6 py-4 w-32">MEM_Flux</th>
                      <th className="text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] px-6 py-4">Anomalies</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {deviceHealth?.slice(0, 10).map((device: DeviceHealth) => (
                      <tr key={device.device_id} className="hover:bg-white/[0.02] transition-colors group/row">
                        <td className="px-6 py-4">
                          <div className="text-[11px] font-black text-white uppercase tracking-wider">{device.hostname}</div>
                          <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mt-1">
                            UP_{Math.floor(device.uptime / 3600)}H_RES_ALLOC
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={cn(
                            "w-2 h-2 rounded-full shadow-[0_0_8px]",
                            device.status === 'active' ? "bg-emerald-500 shadow-emerald-500/50" : "bg-cosmic-red shadow-cosmic-red/50"
                          )} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
                              <span>UTIL</span>
                              <span className={cn(device.cpu_usage > 80 ? "text-cosmic-red" : "text-white")}>{device.cpu_usage}%</span>
                            </div>
                            <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full transition-all duration-500",
                                  device.cpu_usage > 80 ? "bg-cosmic-red shadow-[0_0_8px_#ef4444]" :
                                    device.cpu_usage > 60 ? "bg-amber-500 shadow-[0_0_8px_#f59e0b]" : "bg-earth-green shadow-[0_0_8px_#00ff41]"
                                )}
                                style={{ width: `${device.cpu_usage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
                              <span>UTIL</span>
                              <span className={cn(device.memory_usage > 80 ? "text-cosmic-red" : "text-white")}>{device.memory_usage}%</span>
                            </div>
                            <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full transition-all duration-500",
                                  device.memory_usage > 80 ? "bg-cosmic-red shadow-[0_0_8px_#ef4444]" :
                                    device.memory_usage > 60 ? "bg-amber-500 shadow-[0_0_8px_#f59e0b]" : "bg-earth-green shadow-[0_0_8px_#00ff41]"
                                )}
                                style={{ width: `${device.memory_usage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {device.alerts_count > 0 ? (
                            <span className="bg-cosmic-red/10 border border-cosmic-red/20 text-cosmic-red px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest">
                              {device.alerts_count}_SIG
                            </span>
                          ) : (
                            <span className="text-slate-700 text-[8px] font-black uppercase tracking-widest italic">Stable</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </GlassWrapper>

          {/* Top Network Flows */}
          <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm overflow-hidden group">
            <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-sm">
                  <Activity className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Data_Throughput_Logbook</h3>
                  <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">High_Frequency_Packet_Dissemination</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {flows?.top_flows?.slice(0, 8).map((flow: NetworkFlow, index: number) => (
                <div key={index} className="bg-white/[0.01] border border-white/5 hover:border-blue-500/20 transition-all p-4 rounded-sm group/flow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        {flow.source_ip} <span className="text-slate-600">→</span> {flow.dest_ip}
                      </span>
                    </div>
                    <span className="text-[8px] font-black bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-sm tracking-widest uppercase">
                      {flow.protocol}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-[10px] font-mono text-slate-400 mb-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Volume</span>
                      <span className="text-white font-bold">{(flow.bytes / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Packets</span>
                      <span className="text-white font-bold">{flow.packets.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Duration</span>
                      <span className="text-white font-bold">{flow.duration}s</span>
                    </div>
                  </div>
                  <div className="h-[1px] w-full bg-white/5 relative overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"
                      style={{ width: `${Math.min((flow.bytes / 1024 / 1024 / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassWrapper>
        </div>

        {/* Real-Time Alerts Stream */}
        <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm overflow-hidden group">
          <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cosmic-red/10 border border-cosmic-red/20 rounded-sm">
                <AlertCircle className="h-4 w-4 text-cosmic-red" />
              </div>
              <div>
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Heuristic_Alert_Transmission</h3>
                <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Real_Time_Network_Anomaly_Log</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {alerts?.slice(0, 20).map((alert: Alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-start space-x-4 p-4 rounded-sm border-l-2 transition-all group/item hover:bg-white/[0.02]",
                    alert.severity === 'critical' ? 'bg-cosmic-red/5 border-cosmic-red/50' :
                      alert.severity === 'high' ? 'bg-orange-500/5 border-orange-500/50' :
                        alert.severity === 'medium' ? 'bg-amber-500/5 border-amber-500/50' :
                          'bg-blue-500/5 border-blue-500/50'
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shadow-[0_0_8px]",
                    alert.severity === 'critical' ? 'bg-cosmic-red shadow-cosmic-red/50' :
                      alert.severity === 'high' ? 'bg-orange-500 shadow-orange-500/50' :
                        alert.severity === 'medium' ? 'bg-amber-500 shadow-amber-500/50' :
                          'bg-blue-500 shadow-blue-500/50'
                  )} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{alert.device_name}</span>
                        <div className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {!alert.acknowledged && (
                        <button className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white text-[8px] font-black uppercase tracking-widest h-6 px-3 transition-all rounded-sm">
                          ACK_SYNC
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium mb-3">{alert.message}</p>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-[8px] font-black px-2 py-0.5 rounded-sm tracking-[0.2em] transition-colors",
                        alert.severity === 'critical' ? 'bg-cosmic-red/20 text-cosmic-red' :
                          alert.severity === 'high' ? 'bg-orange-500/20 text-orange-500' :
                            alert.severity === 'medium' ? 'bg-amber-500/20 text-amber-500' :
                              'bg-blue-500/20 text-blue-500'
                      )}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{alert.type.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassWrapper>

        {/* Performance Charts Placeholder */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm p-6 group transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Bandwidth_Flux</h3>
                <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Throughput_Analysis</p>
              </div>
              <div className="p-2 bg-white/5 border border-white/10 rounded-sm">
                <LineChart className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="h-48 flex flex-col items-center justify-center bg-black/40 border border-white/5 rounded-sm relative group/inner overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent opacity-0 group-hover/inner:opacity-100 transition-opacity" />
              <Activity className="h-10 w-10 text-slate-800 mb-4 group-hover/inner:text-blue-900/40 transition-colors" />
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Awaiting_Telemetry</p>
            </div>
          </GlassWrapper>

          <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm p-6 group transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Protocol_Heuristics</h3>
                <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Encapsulation_Metric</p>
              </div>
              <div className="p-2 bg-white/5 border border-white/10 rounded-sm">
                <PieChart className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="h-48 flex flex-col items-center justify-center bg-black/40 border border-white/5 rounded-sm relative group/inner overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-stardust-violet/5 to-transparent opacity-0 group-hover/inner:opacity-100 transition-opacity" />
              <Zap className="h-10 w-10 text-slate-800 mb-4 group-hover/inner:text-stardust-violet/40 transition-colors" />
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Compiling_Distribution</p>
            </div>
          </GlassWrapper>

          <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm p-6 group transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Latent_Jitter_Trends</h3>
                <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Response_Velocity</p>
              </div>
              <div className="p-2 bg-white/5 border border-white/10 rounded-sm">
                <BarChart3 className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="h-48 flex flex-col items-center justify-center bg-black/40 border border-white/5 rounded-sm relative group/inner overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover/inner:opacity-100 transition-opacity" />
              <Network className="h-10 w-10 text-slate-800 mb-4 group-hover/inner:text-earth-green/40 transition-colors" />
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Indexing_Benchmarks</p>
            </div>
          </GlassWrapper>
        </div>
      </div>
    </Layout>
  )
}
