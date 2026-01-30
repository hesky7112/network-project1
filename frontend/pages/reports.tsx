import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Layout from '@/components/layout'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Download,
  Share2,
  Eye,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Shield,
  Activity,
  Search,
  Plus,
} from 'lucide-react'
import { ReportBuilder } from '@/components/visualizations/ReportBuilder'
import { GlassWrapper, SoftLift, StaggerList, StaggerItem, CountUp } from '@/components/ui/motion-container'
import { cn } from '@/lib/utils'

interface Report {
  id: number
  title: string
  type: string
  category: string
  creator_name: string
  created_at: string
  status: string
  priority: string
  summary: string
  view_count: number
}

export default function Reports() {
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showBuilder, setShowBuilder] = useState(false)

  // Fetch reports
  const { data: reports, refetch } = useQuery({
    queryKey: ['reports', selectedType],
    queryFn: () =>
      selectedType === 'all'
        ? apiClient.get('/reports')
        : apiClient.get(`/reports/type/${selectedType}`),
  })

  // Generate report mutations
  const generateIncidentReport = useMutation({
    mutationFn: () => apiClient.post('/reports/generate/incident', { time_range: 'last_day' }),
    onSuccess: () => {
      refetch()
      alert('Incident report generated!')
    },
  })

  const generatePerformanceReport = useMutation({
    mutationFn: () => apiClient.post('/reports/generate/performance', { time_range: 'last_week' }),
    onSuccess: () => {
      refetch()
      alert('Performance report generated!')
    },
  })

  const generateSecurityReport = useMutation({
    mutationFn: () => apiClient.post('/reports/generate/security', { time_range: 'last_month' }),
    onSuccess: () => {
      refetch()
      alert('Security report generated!')
    },
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incident':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'performance':
        return <TrendingUp className="h-5 w-5 text-blue-500" />
      case 'security':
        return <Shield className="h-5 w-5 text-purple-500" />
      case 'compliance':
        return <FileText className="h-5 w-5 text-green-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }



  const filteredReports = reports?.filter((report: Report) =>
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.summary.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Layout title="Reports_Nucleus">
      <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-8 relative overflow-hidden">
        {/* Background Visual Flair */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-stardust-violet/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-earth-green/5 blur-[100px] rounded-full pointer-events-none" />
        {/* HUD Header */}
        <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-32 h-[1px] bg-stardust-violet shadow-[0_0_15px_#6366f1]" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-stardust-violet/10 border border-stardust-violet/20 rounded-sm">
                  <FileText className="h-6 w-6 text-stardust-violet" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Reports_Nucleus</h1>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Historical_Heuristic_Data_Repository</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => generateIncidentReport.mutate()}
                className="bg-cosmic-red/10 border border-cosmic-red/20 hover:bg-cosmic-red/20 text-cosmic-red text-[9px] font-black uppercase tracking-widest h-10 px-4 rounded-sm transition-all"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                GENERATE_INCIDENT_STREAM
              </Button>
              <Button
                onClick={() => generatePerformanceReport.mutate()}
                className="bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest h-10 px-4 rounded-sm transition-all"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                COMPILE_PERF_METRICS
              </Button>
              <Button
                onClick={() => generateSecurityReport.mutate()}
                className="bg-stardust-violet/10 border border-stardust-violet/20 hover:bg-stardust-violet/20 text-stardust-violet text-[9px] font-black uppercase tracking-widest h-10 px-4 rounded-sm transition-all"
              >
                <Shield className="mr-2 h-4 w-4" />
                SCRUB_SEC_PROTOCOLS
              </Button>
              <Button
                variant={showBuilder ? "destructive" : "secondary"}
                onClick={() => setShowBuilder(!showBuilder)}
                className={cn(
                  "text-[9px] font-black uppercase tracking-widest h-10 px-4 rounded-sm transition-all",
                  showBuilder ? "bg-cosmic-red/80 text-white" : "bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400"
                )}
              >
                <Plus className="mr-2 h-4 w-4" />
                {showBuilder ? "EXIT_BUILDER" : "CUSTOM_STREAM_ARCHITECT"}
              </Button>
            </div>
          </div>

          {!showBuilder && (
            /* Filters */
            <div className="flex items-center gap-4 mt-8 pt-8 border-t border-white/5">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-stardust-violet transition-colors" />
                <input
                  type="text"
                  placeholder="Query_Database_Index..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest focus:border-stardust-violet/30 focus:outline-none transition-all rounded-sm placeholder:text-slate-700"
                />
              </div>
              <div className="flex flex-col min-w-[180px]">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Classification_Filter</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 focus:border-stardust-violet/30 focus:outline-none transition-all cursor-pointer rounded-sm"
                >
                  <option value="all">ALL_CLASSIFICATIONS</option>
                  <option value="incident">INCIDENT_LOGS</option>
                  <option value="performance">PERF_TELEMETRY</option>
                  <option value="security">SEC_OVERWATCH</option>
                  <option value="compliance">COMPLIANCE_SYNC</option>
                </select>
              </div>
            </div>
          )}
        </GlassWrapper>

        {showBuilder ? (
          <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm overflow-hidden">
            <ReportBuilder />
          </GlassWrapper>
        ) : (
          <>
            {/* Quick Stats */}
            <StaggerList className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total_Streams', value: reports?.length || 0, icon: FileText, color: 'text-blue-400' },
                { label: 'Temporal_Sync_Week', value: reports?.filter((r: Report) => new Date(r.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length || 0, icon: Calendar, color: 'text-earth-green' },
                { label: 'Critical_Incursions', value: reports?.filter((r: Report) => r.priority === 'critical').length || 0, icon: AlertTriangle, color: 'text-cosmic-red' },
                { label: 'Total_Index_Hits', value: reports?.reduce((sum: number, r: Report) => sum + r.view_count, 0) || 0, icon: Eye, color: 'text-stardust-violet' },
              ].map((stat, index) => (
                <StaggerItem key={index}>
                  <SoftLift>
                    <GlassWrapper className="bg-[#0a0a0c] p-6 rounded-sm border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] transform rotate-45 translate-x-8 -translate-y-8" />
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className={cn("p-2 bg-white/5 border border-white/10 rounded-sm", stat.color)}>
                          <stat.icon className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="space-y-1 relative z-10">
                        <div className="text-3xl font-black text-white italic tracking-tighter leading-none">
                          <CountUp value={stat.value} />
                        </div>
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</div>
                      </div>
                    </GlassWrapper>
                  </SoftLift>
                </StaggerItem>
              ))}
            </StaggerList>

            {/* Reports Grid */}
            <StaggerList className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {filteredReports?.map((report: Report) => (
                <StaggerItem key={report.id}>
                  <SoftLift>
                    <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm overflow-hidden group transition-all duration-300 hover:border-stardust-violet/30">
                      {/* Card Header */}
                      <div className="bg-white/[0.02] px-6 py-4 border-b border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-16 h-[1px] bg-stardust-violet/50" />
                        <div className="flex items-start justify-between relative z-10">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 border border-white/10 rounded-sm">
                              {getTypeIcon(report.type)}
                            </div>
                            <div>
                              <h3 className="text-[11px] font-black text-white uppercase tracking-wider line-clamp-1 italic">{report.title}</h3>
                              <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-1">{report.category}</p>
                            </div>
                          </div>
                          <span className={cn(
                            "px-2 py-0.5 text-[8px] font-black rounded-sm border uppercase tracking-widest",
                            report.priority === 'critical' ? "bg-cosmic-red/10 border-cosmic-red/20 text-cosmic-red" :
                              report.priority === 'high' ? "bg-orange-500/10 border-orange-500/20 text-orange-500" :
                                report.priority === 'medium' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                  "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          )}>
                            {report.priority}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="px-6 py-5 space-y-4">
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic line-clamp-3">
                          {report.summary.replace(/ /g, '_')}
                        </p>

                        <div className="flex items-center justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1.5 text-slate-600" />
                              {new Date(report.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Eye className="h-3 w-3 mr-1.5 text-slate-600" />
                              {report.view_count}_VIEWS
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-700">SIG_ID:</span> {report.id}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest mb-1 italic">Authorized_By</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{report.creator_name}</span>
                          </div>
                          <div className={cn(
                            "px-2 py-0.5 text-[8px] font-black rounded-sm uppercase tracking-widest flex items-center gap-1.5",
                            report.status === 'published' ? "text-earth-green" : "text-amber-500"
                          )}>
                            <div className={cn("w-1 h-1 rounded-full", report.status === 'published' ? "bg-earth-green" : "bg-amber-500")} />
                            {report.status}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="bg-white/[0.01] px-6 py-3 flex items-center justify-between border-t border-white/5 group-hover:bg-white/[0.03] transition-colors">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white/5 border-white/10 hover:border-stardust-violet/40 hover:text-white text-[8px] font-black uppercase tracking-[0.2em] h-7 px-3 rounded-sm transition-all"
                        >
                          <Eye className="h-3.3 w-3.3 mr-1.5" />
                          ACCESS_INTEL
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-white hover:bg-white/5 rounded-sm">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-white hover:bg-white/5 rounded-sm">
                            <Share2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </GlassWrapper>
                  </SoftLift>
                </StaggerItem>
              ))}
            </StaggerList>

            {/* Empty State */}
            {filteredReports && filteredReports.length === 0 && (
              <GlassWrapper className="bg-[#0a0a0c] border border-white/5 p-16 rounded-sm text-center relative overflow-hidden group">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-stardust-violet/5 blur-[80px] rounded-full pointer-events-none" />
                <div className="relative z-10">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-sm w-fit mx-auto mb-6">
                    <FileText className="h-10 w-10 text-slate-700 group-hover:text-stardust-violet transition-colors duration-500" />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.4em] mb-3 italic">Index_Void_Detected</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest max-w-sm mx-auto leading-relaxed mb-8">
                    Historical_Data_Reconstruction_Required // No_Intel_Streams_Match_Current_Heuristic
                  </p>
                  <Button
                    onClick={() => generateIncidentReport.mutate()}
                    className="bg-stardust-violet/80 hover:bg-stardust-violet text-white text-[10px] font-black uppercase tracking-widest h-11 px-8 rounded-sm transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                  >
                    TRIGGER_INCIDENT_STREAM_GEN
                  </Button>
                </div>
              </GlassWrapper>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
