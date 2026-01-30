import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Layout from '@/components/layout'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Activity,
  BarChart3,
  FileText,
  Settings,
  TrendingUp,
  Zap,
  ChevronRight,
  Radio,
  Monitor,
  Terminal as TerminalIcon
} from 'lucide-react'
import { WebTerminal } from '@/components/visualizations/WebTerminal'
import { TrafficSankey } from '@/components/visualizations/TrafficSankey'
import { SparklineGrid } from '@/components/visualizations/SparklineGrid'
import { BlurReveal, GlassWrapper, StaggerList, StaggerItem, CountUp, SoftLift } from '@/components/ui/motion-container'
import { cn } from '@/lib/utils'

export default function Telemetry() {
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'live' | 'netflow' | 'syslog' | 'qos'>('live')

  // Fetch devices
  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: () => apiClient.getDevices(),
  })

  // Live metrics
  const { data: liveMetrics, refetch: refetchLive } = useQuery({
    queryKey: ['live-metrics'],
    queryFn: () => apiClient.getLiveMetrics(),
    refetchInterval: 10000,
  })

  // NetFlow analysis
  const { data: netflowAnalysis, refetch: fetchNetFlow } = useQuery({
    queryKey: ['netflow', selectedDevice],
    queryFn: () => apiClient.get(`/telemetry/analysis/${selectedDevice}?hours=24`),
    enabled: !!selectedDevice,
  })

  // Complete traffic analysis
  const { data: completeAnalysis } = useQuery({
    queryKey: ['complete-analysis', selectedDevice],
    queryFn: () => apiClient.get(`/telemetry/complete-analysis/${selectedDevice}?hours=24`),
    enabled: !!selectedDevice,
  })

  // QoS stats
  const { data: qosStats, refetch: fetchQoS } = useQuery({
    queryKey: ['qos', selectedDevice],
    queryFn: () => apiClient.get(`/telemetry/qos/${selectedDevice}`),
    enabled: !!selectedDevice,
  })

  // Start NetFlow collection mutation
  const startNetFlow = useMutation({
    mutationFn: (data: { deviceID: number; port: number }) =>
      apiClient.post(`/telemetry/netflow/start/${data.deviceID}`, { port: data.port }),
    onSuccess: () => {
      alert('NetFlow collection started!')
      fetchNetFlow()
    },
  })

  // Start Syslog collection mutation
  const startSyslog = useMutation({
    mutationFn: (data: { deviceID: number; port: number }) =>
      apiClient.post(`/telemetry/syslog/start/${data.deviceID}`, { port: data.port }),
    onSuccess: () => {
      alert('Syslog collection started!')
    },
  })

  const handleStartNetFlow = () => {
    if (selectedDevice) {
      const port = prompt('Enter NetFlow port (default: 2055):', '2055')
      if (port) {
        startNetFlow.mutate({ deviceID: selectedDevice, port: parseInt(port) })
      }
    }
  }

  const handleStartSyslog = () => {
    if (selectedDevice) {
      const port = prompt('Enter Syslog port (default: 514):', '514')
      if (port) {
        startSyslog.mutate({ deviceID: selectedDevice, port: parseInt(port) })
      }
    }
  }

  return (
    <Layout title="Signal_Propagation_Terminal">
      <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-12 relative overflow-hidden">
        {/* Background Visual Flair */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-stardust-violet/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-earth-green/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:40px_40px]" />

        <BlurReveal>
          <div className="max-w-7xl mx-auto space-y-12 relative z-10">
            {/* HUD Header */}
            <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-32 h-[1px] bg-stardust-violet shadow-[0_0_15px_#6366f1]" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-stardust-violet/10 border border-stardust-violet/20 rounded-sm">
                    <Radio className="h-8 w-8 text-stardust-violet" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                      Telemetry_<span className="text-stardust-violet">Terminal</span>
                    </h1>
                    <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mt-2 italic">
                      Real-time stream, NetFlow deltas, and QoS propagation_matrix
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => refetchLive()} className="bg-white/5 border-white/10 hover:border-stardust-violet/30 text-[10px] font-black uppercase tracking-widest h-11 px-6 rounded-sm transition-all italic underline-offset-4 hover:underline">
                    <Activity className="mr-3 h-4 w-4" /> REFRESH_STREAM
                  </Button>
                </div>
              </div>
            </GlassWrapper>

            {/* Node Selection Matrix */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                  <Monitor className="h-4 w-4 text-earth-green" /> SELECT_TARGET_NODE
                </h3>
                <span className="text-[9px] font-mono text-slate-600 tracking-tighter uppercase">DISCOVERED_CORES:_{devices?.length || 0}</span>
              </div>

              <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {devices?.map((device: any) => (
                  <StaggerItem key={device.id}>
                    <SoftLift>
                      <GlassWrapper
                        onClick={() => setSelectedDevice(device.id)}
                        className={cn(
                          "cursor-pointer border p-5 rounded-sm transition-all duration-300 group relative overflow-hidden",
                          selectedDevice === device.id
                            ? 'border-earth-green/40 bg-earth-green/[0.04] shadow-[0_0_30px_rgba(0,255,65,0.08)]'
                            : 'border-white/5 bg-[#0a0a0c] hover:border-white/20'
                        )}
                      >
                        <div className="flex items-center gap-4 relative z-10">
                          <div className={cn(
                            "p-2.5 border rounded-sm transition-colors",
                            selectedDevice === device.id ? "bg-earth-green/20 border-earth-green/30" : "bg-white/5 border-white/10"
                          )}>
                            <Activity className={cn("h-5 w-5", selectedDevice === device.id ? "text-earth-green" : "text-slate-600")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-white uppercase tracking-wider truncate italic group-hover:text-earth-green transition-colors">
                              {device.hostname || device.ip_address}
                            </p>
                            <p className="text-[8px] font-mono text-slate-600 uppercase tracking-[0.2em] mt-1 truncate">
                              {device.device_type}_ARCHITECTURE
                            </p>
                          </div>
                        </div>
                        {selectedDevice === device.id && (
                          <div className="absolute top-0 right-0 w-8 h-8 bg-earth-green/10 flex items-center justify-center">
                            <ChevronRight className="h-3 w-3 text-earth-green" />
                          </div>
                        )}
                      </GlassWrapper>
                    </SoftLift>
                  </StaggerItem>
                ))}
              </StaggerList>
            </div>

            {/* Telemetry Operations Hub */}
            {selectedDevice && (
              <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm overflow-hidden flex flex-col">
                {/* Tabbed Navigation HUD */}
                <div className="px-8 border-b border-white/5 bg-white/[0.01]">
                  <nav className="flex space-x-12" aria-label="Tabs">
                    {[
                      { id: 'live', label: 'LIVE_STREAM', icon: Activity },
                      { id: 'netflow', label: 'NETFLOW_DELTA', icon: TrendingUp },
                      { id: 'syslog', label: 'SYSLOG_DECODE', icon: FileText },
                      { id: 'qos', label: 'QOS_DYNAMICS', icon: Settings },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                          "py-6 px-1 flex items-center gap-3 border-b-2 font-black text-[10px] uppercase tracking-[0.25em] transition-all relative group",
                          activeTab === tab.id
                            ? 'border-stardust-violet text-white bg-stardust-violet/[0.02]'
                            : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-white/10'
                        )}
                      >
                        <tab.icon className={cn("h-4 w-4 transition-colors", activeTab === tab.id ? "text-stardust-violet" : "text-slate-700 group-hover:text-slate-500")} />
                        {tab.label}
                        {activeTab === tab.id && (
                          <div className="absolute inset-0 bg-stardust-violet/5 blur-xl pointer-events-none" />
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-8">
                  {/* Live Metrics Tab */}
                  {activeTab === 'live' && (
                    <StaggerList className="space-y-12">
                      <StaggerItem>
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic flex items-center gap-3">
                            <Activity className="h-4 w-4 text-stardust-violet animate-pulse" /> REAL_TIME_PROPAGATION
                          </h3>
                          <div className="text-[9px] font-mono text-slate-600 tracking-tighter uppercase">Hertz: 0.1Hz // Sync: Stable</div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                          {liveMetrics?.slice(0, 8).map((metric: any, idx: number) => (
                            <StaggerItem key={idx}>
                              <GlassWrapper className="bg-white/[0.01] border-white/5 p-6 rounded-sm group hover:border-stardust-violet/20 transition-all">
                                <div className="flex items-center justify-between mb-6">
                                  <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic leading-none group-hover:text-stardust-violet transition-colors">METRIC_0{idx + 1}</div>
                                  <div className="p-1 px-2 bg-white/5 border border-white/10 rounded-sm text-[8px] font-mono text-slate-500 group-hover:text-white transition-colors">
                                    {metric.unit}
                                  </div>
                                </div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{metric.metric.replace(/ /g, '_')}</div>
                                <div className="text-4xl font-black text-white italic tracking-tighter leading-none">
                                  <CountUp value={metric.value} decimals={2} />
                                </div>
                                <div className="mt-6 pt-4 border-t border-white/5 text-[8px] font-mono text-slate-700 uppercase tracking-widest flex justify-between">
                                  <span>LOG_CAPTURE</span>
                                  <span>{new Date(metric.timestamp).toLocaleTimeString()}</span>
                                </div>
                              </GlassWrapper>
                            </StaggerItem>
                          ))}
                        </div>
                      </StaggerItem>

                      <StaggerItem>
                        <GlassWrapper className="bg-white/[0.01] border-white/5 p-8 rounded-sm relative overflow-hidden">
                          <div className="flex items-center justify-between mb-8">
                            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                              <BarChart3 className="h-4 w-4 text-stardust-violet" /> METRIC_TIMELINE_PHASE
                            </h4>
                            <div className="px-4 py-1.5 bg-black/40 border border-white/5 rounded-sm text-[9px] font-black text-earth-green uppercase tracking-[0.2em] italic">Active_Decryption</div>
                          </div>
                          <div className="h-64 sm:h-80">
                            <SparklineGrid />
                          </div>
                        </GlassWrapper>
                      </StaggerItem>
                    </StaggerList>
                  )}

                  {/* NetFlow Tab */}
                  {activeTab === 'netflow' && (
                    <StaggerList className="space-y-12">
                      <StaggerItem className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-6 rounded-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 w-1 h-full bg-earth-green/60" />
                        <div>
                          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">TRAFFIC_DELTA_ANALYSIS</h3>
                          <p className="text-[9px] text-slate-600 font-mono tracking-tighter uppercase mt-1">Sourcing L2/L3 telemetry streams from target_node</p>
                        </div>
                        <Button onClick={handleStartNetFlow} className="bg-earth-green/80 hover:bg-earth-green text-black font-black uppercase text-[10px] tracking-widest italic h-12 px-8 rounded-sm transition-all shadow-[0_0_20px_rgba(0,255,65,0.2)]">
                          <Zap className="mr-3 h-4 w-4" /> INITIATE_STREAM_CAPTURE
                        </Button>
                      </StaggerItem>

                      {netflowAnalysis ? (
                        <div className="space-y-12">
                          <StaggerItem>
                            <GlassWrapper className="bg-white/[0.01] border-white/5 p-8 rounded-sm">
                              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 italic flex items-center gap-3">
                                <TrendingUp className="h-4 w-4 text-earth-green" /> FLOW_TOPOLOGY_MATRIX
                              </h4>
                              <div className="h-[400px] border border-white/5 rounded-sm bg-black/40 p-4 relative overflow-hidden">
                                <TrafficSankey height={360} />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#00ff4105_0,transparent_100%)] pointer-events-none" />
                              </div>
                            </GlassWrapper>
                          </StaggerItem>

                          <StaggerItem>
                            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                              <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">CRITICAL_NODES_&_TALKERS</h4>
                              <div className="text-[9px] text-slate-600 uppercase tracking-[0.2em] italic font-black">Filtered by: BYTE_VOLUME</div>
                            </div>
                            <div className="alien-net-table overflow-x-auto">
                              <table className="min-w-full divide-y divide-white/5 border border-white/5">
                                <thead className="bg-white/[0.02]">
                                  <tr>
                                    <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">SOURCE_ID</th>
                                    <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">TARGET_ID</th>
                                    <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">PROTOCOL</th>
                                    <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">DELTA_VOLUME</th>
                                    <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">PACKET_FLOW</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 bg-transparent">
                                  {netflowAnalysis?.top_talkers?.slice(0, 10).map((talker: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                      <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-slate-400 group-hover:text-white transition-colors italic">
                                        {talker.source_ip}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-slate-400 group-hover:text-white transition-colors italic">
                                        {talker.dest_ip}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/5 px-2 py-0.5 border border-emerald-500/10 rounded-sm">
                                          {talker.protocol}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-[11px] font-black text-white italic">
                                        {(talker.bytes / 1024 / 1024).toFixed(2)} <span className="text-slate-600 not-italic">MB_DELTA</span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-[10px] font-mono text-slate-500 italic">
                                        {talker.packets.toLocaleString()} units
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </StaggerItem>

                          {completeAnalysis?.recommendations && (
                            <StaggerItem>
                              <div className="bg-stardust-violet/5 border border-stardust-violet/20 rounded-sm p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-stardust-violet/10 blur-[60px] pointer-events-none" />
                                <h4 className="text-[11px] font-black text-stardust-violet uppercase tracking-[0.4em] mb-6 flex items-center gap-3 italic">
                                  <ChevronRight className="h-4 w-4" /> ANOMALY_HEURISTIC_FEEDBACK
                                </h4>
                                <ul className="space-y-4">
                                  {completeAnalysis.recommendations.map((rec: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-4">
                                      <div className="mt-1.5 w-1.5 h-1.5 bg-stardust-violet rounded-full shadow-[0_0_8px_currentColor]" />
                                      <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest leading-relaxed italic border-l border-white/5 pl-4">{rec}</p>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </StaggerItem>
                          )}
                        </div>
                      ) : (
                        <StaggerItem className="h-96 flex flex-col items-center justify-center bg-white/[0.01] border border-dashed border-white/10 rounded-sm text-center px-12 group hover:border-earth-green/30 transition-all">
                          <div className="p-6 bg-earth-green/5 border border-earth-green/10 rounded-full mb-6 group-hover:scale-110 transition-transform">
                            <TrendingUp className="h-12 w-12 text-slate-700 group-hover:text-earth-green" />
                          </div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic mb-8">Inactive_Delta_Stream // Waiting_for_Capture_Command</p>
                          <Button onClick={handleStartNetFlow} variant="outline" className="h-12 border-white/5 hover:border-earth-green/30 text-[9px] font-black uppercase tracking-widest italic group-hover:bg-earth-green/5">
                            INIT_TELEMETRY_HANDSHAKE
                          </Button>
                        </StaggerItem>
                      )}
                    </StaggerList>
                  )}

                  {/* Syslog Tab */}
                  {activeTab === 'syslog' && (
                    <StaggerList className="space-y-8">
                      <StaggerItem className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-6 rounded-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 w-1 h-full bg-stardust-violet/60" />
                        <div>
                          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">SYSLOG_DECODE_TERMINAL</h3>
                          <p className="text-[9px] text-slate-600 font-mono tracking-tighter uppercase mt-1">Direct kernel event log streaming from selected node address</p>
                        </div>
                        <Button onClick={handleStartSyslog} className="bg-stardust-violet/80 hover:bg-stardust-violet text-white font-black uppercase text-[10px] tracking-widest italic h-12 px-8 rounded-sm transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                          <TerminalIcon className="mr-3 h-4 w-4" /> BIND_SYSLOG_DAEMON
                        </Button>
                      </StaggerItem>

                      <StaggerItem>
                        <GlassWrapper className="bg-black/80 border-white/10 rounded-sm overflow-hidden border p-0 relative h-[600px] group">
                          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-stardust-violet/50 to-transparent" />
                          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 border border-white/10 rounded-sm">
                            <div className="w-2 h-2 rounded-full bg-earth-green animate-pulse" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest italic">STREAM_READY</span>
                          </div>
                          <WebTerminal height="100%" />
                        </GlassWrapper>
                      </StaggerItem>
                    </StaggerList>
                  )}

                  {/* QoS Tab */}
                  {activeTab === 'qos' && (
                    <StaggerList className="space-y-12">
                      <StaggerItem className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-6 rounded-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 w-1 h-full bg-stardust-violet/60" />
                        <div>
                          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">QOS_TRAFFIC_POLICING_STATS</h3>
                          <p className="text-[9px] text-slate-600 font-mono tracking-tighter uppercase mt-1">Analyzing per-class drop rates and packet propagation latencies</p>
                        </div>
                        <Button onClick={() => fetchQoS()} className="bg-stardust-violet/80 hover:bg-stardust-violet text-white font-black uppercase text-[10px] tracking-widest italic h-12 px-8 rounded-sm transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                          <Settings className="mr-3 h-4 w-4" /> RE-PROBE_QOS_KERNEL
                        </Button>
                      </StaggerItem>

                      {qosStats && qosStats.length > 0 ? (
                        <StaggerItem>
                          <div className="alien-net-table overflow-x-auto">
                            <table className="min-w-full divide-y divide-white/5 border border-white/5">
                              <thead className="bg-white/[0.02]">
                                <tr>
                                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">INT_ID</th>
                                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">POLICY_MAP</th>
                                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">CLASS_SIG</th>
                                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">PCKT_VOL</th>
                                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">BYTE_PROP</th>
                                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">DROP_INDX</th>
                                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">PHASE_HEALTH</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 bg-transparent">
                                {qosStats.map((stat: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-white uppercase tracking-widest italic group-hover:text-stardust-violet transition-colors">
                                      {stat.interface_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[10px] font-mono text-slate-500 uppercase">
                                      {stat.policy_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[10px] font-mono text-slate-500 uppercase">
                                      {stat.class_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[10px] font-mono text-white italic">
                                      {stat.packets.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[10px] font-mono text-white italic">
                                      {(stat.bytes / 1024 / 1024).toFixed(2)} MB
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[10px] font-mono text-cosmic-red italic">
                                      {stat.drops.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={cn(
                                        "px-2 py-0.5 text-[8px] font-black rounded-sm border uppercase tracking-widest",
                                        stat.drop_rate > 5
                                          ? 'border-cosmic-red/30 bg-cosmic-red/10 text-cosmic-red shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                                          : stat.drop_rate > 1
                                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                                            : 'border-earth-green/30 bg-earth-green/10 text-earth-green shadow-[0_0_8px_rgba(0,255,65,0.2)]'
                                      )}>
                                        {stat.drop_rate.toFixed(2)}%_ERR
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </StaggerItem>
                      ) : (
                        <StaggerItem className="h-96 flex flex-col items-center justify-center bg-white/[0.01] border border-dashed border-white/10 rounded-sm text-center px-12 group hover:border-stardust-violet/30 transition-all">
                          <div className="p-6 bg-stardust-violet/5 border border-stardust-violet/10 rounded-full mb-6 group-hover:scale-110 transition-transform">
                            <Settings className="h-12 w-12 text-slate-700 group-hover:text-stardust-violet" />
                          </div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic mb-8">No_QoS_Telemetry_Captured // Buffer_Empty</p>
                          <Button onClick={() => fetchQoS()} variant="outline" className="h-12 border-white/5 hover:border-stardust-violet/30 text-[9px] font-black uppercase tracking-widest italic group-hover:bg-stardust-violet/5">
                            PROBE_INTERFACE_POLICIES
                          </Button>
                        </StaggerItem>
                      )}
                    </StaggerList>
                  )}
                </div>
              </GlassWrapper>
            )}
          </div>
        </BlurReveal>

        {/* Global HUD Decorations */}
        <div className="fixed bottom-8 right-8 z-50 pointer-events-none">
          <div className="flex flex-col items-end gap-2 pr-4 border-r-2 border-stardust-violet/20">
            <span className="text-[8px] font-black text-slate-700 uppercase tracking-[0.5em] italic">Telemetry_Stream</span>
            <span className="text-[10px] font-black text-stardust-violet uppercase tracking-widest italic">ACTIVE_ENCRYPTION_L4</span>
          </div>
        </div>
      </div>
    </Layout>
  )
}
