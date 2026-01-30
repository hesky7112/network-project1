import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Layout from '@/components/layout'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Server,
  Network,
  RefreshCw,
  PlayCircle,
  FileText,
  Activity,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Heart,
  Monitor
} from 'lucide-react'
import { DependencyTree } from '@/components/visualizations/DependencyTree'
import { BlurReveal, GlassWrapper, StaggerList, StaggerItem, CountUp, SoftLift } from '@/components/ui/motion-container'
import { cn } from '@/lib/utils'

interface HealthIssue {
  id: number
  severity: string
  category: string
  title: string
  description: string
  device_name: string
  metric: string
  current_value: number
  threshold_value: number
  impact: string
  detected_at: string
  auto_fixable: boolean
}

interface QuickFix {
  id: number
  issue_id: number
  title: string
  description: string
  fix_type: string
  estimated_time: number
  risk_level: string
  applied_at?: string
  success: boolean
}

export default function HealthDashboard() {
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null)

  // Fetch latest health analysis
  const { data: analysis, refetch: refetchAnalysis } = useQuery({
    queryKey: ['health-analysis'],
    queryFn: () => apiClient.get('/health/analysis/latest'),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Fetch health issues
  const { data: issues } = useQuery({
    queryKey: ['health-issues', analysis?.id],
    queryFn: () => apiClient.get(`/health/analysis/${analysis?.id}/issues`),
    enabled: !!analysis?.id,
  })

  // Fetch quick fixes
  const { data: quickFixes } = useQuery({
    queryKey: ['quick-fixes', selectedIssue],
    queryFn: () => apiClient.get(`/health/issues/${selectedIssue}/fixes`),
    enabled: !!selectedIssue,
  })

  // Run new analysis mutation
  const runAnalysis = useMutation({
    mutationFn: () => apiClient.post('/health/analysis/run', {}),
    onSuccess: () => {
      refetchAnalysis()
      alert('Health analysis completed!')
    },
  })

  // Apply quick fix mutation
  const applyFix = useMutation({
    mutationFn: (fixId: number) => apiClient.post(`/health/fixes/${fixId}/apply`, {}),
    onSuccess: () => {
      refetchAnalysis()
      alert('Quick fix applied successfully!')
    },
  })

  return (
    <Layout title="Bio-Net_Integrity_Diagnostic">
      <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-12 relative overflow-hidden font-sans">
        {/* Background Visual Flair */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cosmic-red/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-earth-green/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:40px_40px]" />

        <BlurReveal>
          <div className="max-w-7xl mx-auto space-y-12 relative z-10">
            {/* HUD Header */}
            <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 w-32 h-[1px] bg-cosmic-red shadow-[0_0_15px_#ef4444]" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-cosmic-red/10 border border-cosmic-red/20 rounded-sm">
                    <Heart className="h-8 w-8 text-cosmic-red animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                      Health_<span className="text-cosmic-red">Diagnostics</span>
                    </h1>
                    <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mt-2 italic">
                      System integrity monitor & automated recovery_matrix
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => runAnalysis.mutate()}
                  disabled={runAnalysis.isPending}
                  className="bg-white/5 border-white/10 hover:border-cosmic-red/30 text-[10px] font-black uppercase tracking-widest h-12 px-8 rounded-sm transition-all italic underline-offset-4 hover:underline"
                >
                  <RefreshCw className={cn("mr-3 h-4 w-4", runAnalysis.isPending ? 'animate-spin' : '')} />
                  INIT_SYSTEM_PROBE
                </Button>
              </div>
            </GlassWrapper>

            {analysis && (
              <StaggerList className="space-y-12">
                {/* Overall Health HUD */}
                <StaggerItem>
                  <GlassWrapper className={cn(
                    "p-8 rounded-sm border-2 relative overflow-hidden transition-all duration-500",
                    analysis.overall_status === 'healthy' ? 'border-earth-green/20 bg-earth-green/[0.02]' :
                      analysis.overall_status === 'degraded' ? 'border-amber-500/20 bg-amber-500/[0.02]' : 'border-cosmic-red/20 bg-cosmic-red/[0.02]'
                  )}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                      <div className="flex items-center gap-8 lg:col-span-2">
                        <div className={cn(
                          "w-32 h-32 rounded-full border-4 flex items-center justify-center relative",
                          analysis.overall_status === 'healthy' ? 'border-earth-green/40 shadow-[0_0_30px_rgba(0,255,65,0.15)]' :
                            analysis.overall_status === 'degraded' ? 'border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'border-cosmic-red/40 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
                        )}>
                          {analysis.overall_status === 'healthy' ? (
                            <CheckCircle className="h-16 w-16 text-earth-green" />
                          ) : analysis.overall_status === 'degraded' ? (
                            <AlertTriangle className="h-16 w-16 text-amber-500" />
                          ) : (
                            <XCircle className="h-16 w-16 text-cosmic-red" />
                          )}
                          <div className="absolute inset-[-8px] border border-white/5 rounded-full animate-[spin_10s_linear_infinite]" />
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                            {analysis.overall_status}_CORE
                          </h3>
                          <div className="flex flex-wrap gap-8">
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">RISK_LEVEL</p>
                              <p className={cn(
                                "text-[11px] font-black uppercase tracking-widest italic",
                                analysis.risk_level === 'critical' ? 'text-cosmic-red' :
                                  analysis.risk_level === 'high' ? 'text-orange-500' :
                                    analysis.risk_level === 'medium' ? 'text-amber-500' : 'text-earth-green'
                              )}>
                                {analysis.risk_level}_ALPHA
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">AFFECTED_NODES</p>
                              <p className="text-[11px] font-black text-white italic">{analysis.affected_devices} UNSTABLE</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">SYNC_TIMESTAMP</p>
                              <p className="text-[11px] font-black text-slate-400 italic uppercase">{new Date(analysis.timestamp).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-center bg-white/[0.03] border border-white/5 p-8 rounded-sm relative group overflow-hidden">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 italic">AGGREGATE_INTEGRITY</div>
                        <div className={cn(
                          "text-7xl font-black italic tracking-tighter leading-none",
                          analysis.health_score >= 90 ? 'text-earth-green' :
                            analysis.health_score >= 70 ? 'text-amber-500' :
                              analysis.health_score >= 50 ? 'text-orange-500' : 'text-cosmic-red'
                        )}>
                          <CountUp value={analysis.health_score} decimals={1} />
                        </div>
                        <div className="mt-8 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${analysis.health_score}%` }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className={cn(
                              "h-full rounded-full shadow-[0_0_10px_currentColor]",
                              analysis.health_score >= 90 ? 'bg-earth-green' :
                                analysis.health_score >= 70 ? 'bg-amber-500' :
                                  analysis.health_score >= 50 ? 'bg-orange-500' : 'bg-cosmic-red'
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </GlassWrapper>
                </StaggerItem>

                {/* Service Dependency Map */}
                <StaggerItem>
                  <GlassWrapper className="bg-[#0a0a0c] border-white/5 p-8 rounded-sm relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-stardust-violet/5 blur-[60px] pointer-events-none" />
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                      <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic flex items-center gap-3">
                        <Activity className="h-4 w-4 text-stardust-violet" /> SERVICE_CASCADE_TOPOLOGY
                      </h3>
                      <div className="flex gap-6 text-[9px] font-black uppercase tracking-widest italic text-slate-600">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-stardust-violet rounded-full"></div> CORE_SERVICE</div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-earth-green rounded-full"></div> NOMINAL_LINK</div>
                      </div>
                    </div>
                    <div className="h-[500px] border border-white/5 rounded-sm bg-black/40 p-4 overflow-hidden relative">
                      <DependencyTree height={460} />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#6366f105_0,transparent_100%)] pointer-events-none" />
                    </div>
                    <p className="mt-6 text-[9px] text-slate-600 italic uppercase tracking-widest font-black">
                      * Analyzing cascading impact of failures across bio-net infrastructure protocols.
                    </p>
                  </GlassWrapper>
                </StaggerItem>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  {/* System Health */}
                  <StaggerItem>
                    <GlassWrapper className="p-8 border-white/5 bg-[#0a0a0c] rounded-sm h-full flex flex-col group hover:border-stardust-violet/20 transition-all">
                      <div className="flex items-center gap-3 mb-10 pb-4 border-b border-white/5">
                        <Server className="h-5 w-5 text-stardust-violet" />
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">SYSTEM_VITALS</h3>
                      </div>
                      <div className="space-y-8 flex-1">
                        {[
                          { label: 'CPU_PROBABILITY', val: analysis?.system_health?.cpu_usage_avg ?? 0, color: 'text-stardust-violet' },
                          { label: 'MEMORY_SATURATION', val: analysis?.system_health?.memory_usage_avg ?? 0, color: 'text-earth-green' },
                          { label: 'DISK_DECOHESION', val: analysis?.system_health?.disk_usage_avg ?? 0, color: 'text-amber-500' },
                        ].map((m) => (
                          <div key={m.label}>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3 italic">
                              <span className="text-slate-500">{m.label}</span>
                              <span className="text-white">{m.val.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1 relative">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${m.val}%` }}
                                className={cn(
                                  "h-full rounded-full shadow-[0_0_8px_currentColor]",
                                  m.val > 80 ? 'bg-cosmic-red' : m.val > 60 ? 'bg-amber-500' : 'bg-stardust-violet'
                                )}
                              />
                            </div>
                          </div>
                        ))}

                        <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/5">
                          <div>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">ACTIVE_NODES</p>
                            <p className="text-2xl font-black text-earth-green italic">{analysis?.system_health?.active_devices ?? 0}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">FAIL_COUNT</p>
                            <p className="text-2xl font-black text-cosmic-red italic underline decoration-cosmic-red/30 underline-offset-4">{analysis?.system_health?.failed_devices ?? 0}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">UPTIME_SYNTHESIS</p>
                            <div className="flex items-end gap-2">
                              <span className="text-3xl font-black text-white italic">{(analysis?.system_health?.uptime_percentage ?? 0).toFixed(2)}</span>
                              <span className="text-[9px] font-mono text-slate-500 mb-1.5 uppercase">%_STABLE</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </GlassWrapper>
                  </StaggerItem>

                  {/* Network Health */}
                  <StaggerItem>
                    <GlassWrapper className="p-8 border-white/5 bg-[#0a0a0c] rounded-sm h-full flex flex-col group hover:border-earth-green/20 transition-all">
                      <div className="flex items-center gap-3 mb-10 pb-4 border-b border-white/5">
                        <Network className="h-5 w-5 text-earth-green" />
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">PACKET_DYNAMICS</h3>
                      </div>
                      <div className="space-y-8 flex-1">
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">PACKET_LOSS</p>
                            <p className={cn(
                              "text-3xl font-black italic",
                              (analysis?.network_health?.packet_loss ?? 0) > 1 ? 'text-cosmic-red' : 'text-earth-green'
                            )}>
                              {(analysis?.network_health?.packet_loss ?? 0).toFixed(2)}<span className="text-[10px] ml-1 not-italic font-mono">%</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">LATENCY_PHASE</p>
                            <p className={cn(
                              "text-3xl font-black italic",
                              (analysis?.network_health?.latency ?? 0) > 100 ? 'text-cosmic-red' : 'text-earth-green'
                            )}>
                              {(analysis?.network_health?.latency ?? 0).toFixed(0)}<span className="text-[10px] ml-1 not-italic font-mono">MS</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">JITTER_SIG</p>
                            <p className="text-3xl font-black text-stardust-violet italic">{(analysis?.network_health?.jitter ?? 0).toFixed(1)}<span className="text-[10px] ml-1 not-italic font-mono">MS</span></p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">CONN_LOAD</p>
                            <p className="text-3xl font-black text-white italic">{analysis?.network_health?.active_connections ?? 0}</p>
                          </div>
                        </div>

                        <div className="pt-8 border-t border-white/5">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3 italic">
                            <span className="text-slate-500">THROUGHPUT_SATURATION</span>
                            <span className="text-white">{(analysis?.network_health?.throughput_utilization ?? 0).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1 relative">
                            <motion.div
                              animate={{ width: `${analysis?.network_health?.throughput_utilization ?? 0}%` }}
                              className={cn(
                                "h-full rounded-full shadow-[0_0_8px_currentColor]",
                                (analysis?.network_health?.throughput_utilization ?? 0) > 90 ? 'bg-cosmic-red' : 'bg-earth-green'
                              )}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/5">
                          <div>
                            <p className="text-[9px] font-black text-slate-600 mb-1 uppercase italic tracking-widest">DROPPED_UNITS</p>
                            <p className="text-lg font-black text-cosmic-red italic">{(analysis?.network_health?.dropped_packets ?? 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-600 mb-1 uppercase italic tracking-widest">ERROR_DELTA</p>
                            <p className="text-lg font-black text-orange-500 italic">{(analysis?.network_health?.error_packets ?? 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </GlassWrapper>
                  </StaggerItem>

                  {/* Security Health */}
                  <StaggerItem>
                    <GlassWrapper className="p-8 border-white/5 bg-[#0a0a0c] rounded-sm h-full flex flex-col group hover:border-cosmic-red/20 transition-all">
                      <div className="flex items-center gap-3 mb-10 pb-4 border-b border-white/5">
                        <ShieldCheck className="h-5 w-5 text-cosmic-red" />
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">FIREWALL_ENTROPY</h3>
                      </div>
                      <div className="space-y-8 flex-1">
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">CVE_BREACHES</p>
                            <p className={cn(
                              "text-3xl font-black italic",
                              (analysis?.security_health?.open_vulnerabilities ?? 0) > 0 ? 'text-cosmic-red animate-pulse' : 'text-earth-green'
                            )}>
                              {analysis?.security_health?.open_vulnerabilities ?? 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">FAILED_LOG_IN</p>
                            <p className="text-3xl font-black text-white italic">{analysis?.security_health?.failed_logins ?? 0}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">SUS_ACTIVITY</p>
                            <p className="text-3xl font-black text-orange-500 italic">{analysis?.security_health?.suspicious_activity ?? 0}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">RULE_VIOLATIONS</p>
                            <p className="text-3xl font-black text-cosmic-red italic">{analysis?.security_health?.firewall_rule_violations ?? 0}</p>
                          </div>
                        </div>

                        <div className="pt-8 border-t border-white/5">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3 italic">
                            <span className="text-slate-500">COMPLIANCE_ALGORITHM</span>
                            <span className="text-white">{(analysis?.security_health?.compliance_score ?? 0).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1 relative">
                            <motion.div
                              animate={{ width: `${analysis?.security_health?.compliance_score ?? 0}%` }}
                              className={cn(
                                "h-full rounded-full shadow-[0_0_8px_currentColor]",
                                (analysis?.security_health?.compliance_score ?? 0) >= 90 ? 'bg-earth-green' : 'bg-cosmic-red'
                              )}
                            />
                          </div>
                        </div>

                        <div className="pt-8 border-t border-white/5">
                          <p className="text-[9px] font-black text-slate-600 mb-2 uppercase italic tracking-widest">LAST_ENTROPY_SCAN</p>
                          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-sm flex items-center gap-3">
                            <Cpu className="h-4 w-4 text-slate-700" />
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">
                              {analysis?.security_health?.last_security_scan ? new Date(analysis.security_health.last_security_scan).toLocaleString() : 'PENDING'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </GlassWrapper>
                  </StaggerItem>
                </div>

                {/* Diagnostics Hub */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  {/* Issues Matrix */}
                  <StaggerItem>
                    <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm relative overflow-hidden flex flex-col h-[700px]">
                      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic flex items-center gap-3">
                          <AlertTriangle className="h-4 w-4 text-orange-500" /> INTEGRITY_ANOMALIES_({issues?.length || 0})
                        </h3>
                        <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Live_Capture</div>
                      </div>
                      <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                        {issues?.map((issue: HealthIssue) => (
                          <SoftLift key={issue.id}>
                            <div
                              onClick={() => setSelectedIssue(issue.id)}
                              className={cn(
                                "p-6 border rounded-sm cursor-pointer transition-all duration-300 relative group overflow-hidden",
                                selectedIssue === issue.id
                                  ? 'border-stardust-violet/40 bg-stardust-violet/[0.05] shadow-[0_0_25px_rgba(99,102,241,0.08)]'
                                  : 'border-white/5 bg-white/[0.01] hover:border-white/20'
                              )}
                            >
                              <div className="flex items-start justify-between gap-6 relative z-10">
                                <div className="flex-1 space-y-4">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <span className={cn(
                                      "px-2 py-0.5 text-[8px] font-black rounded-sm border uppercase tracking-widest",
                                      issue.severity === 'critical' ? 'border-cosmic-red/30 bg-cosmic-red/10 text-cosmic-red' :
                                        issue.severity === 'high' ? 'border-orange-500/30 bg-orange-500/10 text-orange-500' :
                                          'border-amber-500/30 bg-amber-500/10 text-amber-500'
                                    )}>
                                      {issue.severity}_PRIORITY
                                    </span>
                                    <span className="text-[8px] bg-white/5 border border-white/10 text-slate-500 px-2 py-0.5 rounded-sm uppercase font-black tracking-widest">
                                      {issue.category}
                                    </span>
                                    {issue.auto_fixable && (
                                      <span className="text-[8px] bg-earth-green/10 border border-earth-green/20 text-earth-green px-2 py-0.5 rounded-sm flex items-center gap-1.5 font-black uppercase tracking-widest animate-pulse">
                                        <Zap className="h-2.5 w-2.5" /> AUTO_RECOVERY_AVAIL
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="text-[13px] font-black text-white uppercase tracking-wider italic leading-relaxed group-hover:text-stardust-violet transition-colors">{issue.title}</h4>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed mt-2 border-l border-white/10 pl-4">{issue.description}</p>
                                  </div>
                                  {issue.device_name && (
                                    <div className="flex items-center gap-2 text-[8px] font-mono text-slate-600 uppercase tracking-[0.2em] italic">
                                      <Monitor className="h-3 w-3" /> NODE_ADDRESS: {issue.device_name}
                                    </div>
                                  )}
                                </div>
                                <ChevronRight className={cn("h-4 w-4 transition-transform", selectedIssue === issue.id ? "text-stardust-violet translate-x-1" : "text-slate-800")} />
                              </div>
                              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[8px] font-mono uppercase tracking-widest">
                                <span className="text-slate-600">Metric Output: <span className="text-white">{issue.current_value.toFixed(1)} / {issue.threshold_value}</span></span>
                                <span className="text-slate-700">{new Date(issue.detected_at).toLocaleTimeString()}_Z</span>
                              </div>
                              <div className="absolute top-0 right-0 w-16 h-[1px] bg-gradient-to-l from-stardust-violet/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </SoftLift>
                        ))}
                      </div>
                    </GlassWrapper>
                  </StaggerItem>

                  {/* Fix Matrix */}
                  <StaggerItem>
                    <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm relative overflow-hidden flex flex-col h-[700px]">
                      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic flex items-center gap-3">
                          <Zap className="h-4 w-4 text-stardust-violet" /> AUTOMATED_RECOVERY_SCRIPTS
                        </h3>
                        <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Handshake_Ready</div>
                      </div>
                      <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                        {selectedIssue ? (
                          <div className="space-y-6">
                            {quickFixes?.map((fix: QuickFix) => (
                              <StaggerItem key={fix.id}>
                                <GlassWrapper className="border-white/5 bg-white/[0.01] p-6 rounded-sm relative group overflow-hidden">
                                  <div className="flex items-start justify-between gap-6 mb-8">
                                    <div className="flex-1 space-y-4">
                                      <h4 className="text-[13px] font-black text-white uppercase tracking-wider italic leading-relaxed group-hover:text-earth-green transition-colors">{fix.title}</h4>
                                      <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed italic border-l border-white/10 pl-4">{fix.description}</p>
                                    </div>
                                    {!fix.applied_at && (
                                      <Button
                                        onClick={() => applyFix.mutate(fix.id)}
                                        disabled={applyFix.isPending}
                                        className="bg-earth-green/80 hover:bg-earth-green text-black font-black uppercase text-[9px] tracking-[0.2em] italic h-10 px-6 rounded-sm transition-all shadow-[0_0_15px_rgba(0,255,65,0.2)]"
                                      >
                                        <PlayCircle className="h-3.5 w-3.5 mr-2" /> EXECUTE_FIX
                                      </Button>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-3 gap-6 text-[9px] font-black uppercase tracking-[0.2em] italic border-t border-white/5 pt-6">
                                    <div>
                                      <p className="text-slate-600 mb-1">SCRIPT_TYPE</p>
                                      <p className="text-white">{fix.fix_type}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-600 mb-1">PROG_TIME</p>
                                      <p className="text-white">{fix.estimated_time}s_DELTA</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-600 mb-1">ENTROPY_RISK</p>
                                      <p className={cn(
                                        "capitalize",
                                        fix.risk_level === 'high' ? 'text-cosmic-red underline' :
                                          fix.risk_level === 'medium' ? 'text-amber-500' : 'text-earth-green'
                                      )}>
                                        {fix.risk_level}_ALPHA
                                      </p>
                                    </div>
                                  </div>

                                  {fix.applied_at && (
                                    <div className={cn(
                                      "mt-8 p-4 rounded-sm border relative overflow-hidden",
                                      fix.success ? 'bg-earth-green/5 border-earth-green/20 text-earth-green' : 'bg-cosmic-red/5 border-cosmic-red/20 text-cosmic-red'
                                    )}>
                                      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest italic relative z-10">
                                        {fix.success ? (
                                          <CheckCircle className="h-4 w-4" />
                                        ) : (
                                          <XCircle className="h-4 w-4" />
                                        )}
                                        <span>Script_Execution: {fix.success ? 'NOMINAL' : 'FAILURE_RESPONSE'}</span>
                                        <span className="ml-auto text-[8px] font-mono text-slate-600">
                                          {new Date(fix.applied_at).toLocaleTimeString()}
                                        </span>
                                      </div>
                                      <div className={cn(
                                        "absolute inset-0 opacity-10",
                                        fix.success ? 'bg-earth-green' : 'bg-cosmic-red'
                                      )} />
                                    </div>
                                  )}
                                </GlassWrapper>
                              </StaggerItem>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center px-12 group">
                            <div className="p-8 bg-white/5 border border-dashed border-white/10 rounded-full mb-8 group-hover:scale-110 transition-transform">
                              <FileText className="h-12 w-12 text-slate-800 group-hover:text-stardust-violet" />
                            </div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">Select_An_Anomaly_For_Response_Decryption</p>
                            <div className="mt-8 flex gap-4">
                              <div className="w-12 h-[1px] bg-white/5" />
                              <div className="w-1.5 h-1.5 rounded-full bg-stardust-violet/20" />
                              <div className="w-12 h-[1px] bg-white/5" />
                            </div>
                          </div>
                        )}
                      </div>
                    </GlassWrapper>
                  </StaggerItem>
                </div>
              </StaggerList>
            )}
          </div>
        </BlurReveal>

        {/* Global HUD Decorations */}
        <div className="fixed bottom-8 left-8 z-50 pointer-events-none">
          <div className="flex flex-col items-start gap-2 pl-4 border-l-2 border-cosmic-red/20">
            <span className="text-[8px] font-black text-slate-700 uppercase tracking-[0.5em] italic">Integrity_Link</span>
            <span className="text-[10px] font-black text-cosmic-red uppercase tracking-widest italic">HEARTBEAT_STABLE_0.8s</span>
          </div>
        </div>
      </div>
    </Layout>
  )
}

