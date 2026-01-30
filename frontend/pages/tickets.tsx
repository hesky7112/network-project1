import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import Layout from '@/components/layout'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Ticket,
  AlertTriangle,

  Clock,
  MapPin,
  User,
  Wrench,
  Navigation,
  MessageSquare,
  Layout as LayoutIcon,
  List,
  Plus,
  CheckCircle,
} from 'lucide-react'
import { TicketKanban } from '@/components/visualizations/TicketKanban'
import { GlassWrapper, SoftLift, StaggerList, StaggerItem } from '@/components/ui/motion-container'
import { cn } from '@/lib/utils'

interface TicketData {
  id: number
  title: string
  description: string
  type: string
  priority: string
  status: string
  device_name: string
  location: {
    site: string
    building: string
    floor: string
    latitude: number
    longitude: number
  }
  reporter_name: string
  assignee_name?: string
  created_at: string
  estimated_time: number
  actual_time?: number
  impacted_users: number
  chat_room_id: string
}

interface TechnicianDispatch {
  id: number
  ticket_id: number
  technician_name: string
  status: string
  distance: number
  travel_time: number
  estimated_arrival: string
}

export default function Tickets() {
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('kanban')
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assignTechnicianId, setAssignTechnicianId] = useState('')
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
  const [resolveNotes, setResolveNotes] = useState('')

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !assignTechnicianId) return
    try {
      await apiClient.post(`/tickets/${selectedTicket}/assign`, { technician_id: parseInt(assignTechnicianId) })
      toast.success("Unit deployed successfully")
      setIsAssignModalOpen(false)
      setAssignTechnicianId('')
      window.location.reload()
    } catch (err) {
      toast.error("Deployment failed")
    }
  }

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !resolveNotes) return
    try {
      await apiClient.post(`/tickets/${selectedTicket}/resolve`, { resolution: resolveNotes })
      toast.success("Signal cleared")
      setIsResolveModalOpen(false)
      setResolveNotes('')
      window.location.reload()
    } catch (err) {
      toast.error("Resolution failed")
    }
  }

  // Fetch tickets
  const { data: tickets } = useQuery({
    queryKey: ['tickets', filterStatus, filterPriority],
    queryFn: () => apiClient.get(`/tickets?status=${filterStatus}&priority=${filterPriority}`),
  })

  // Fetch active dispatches
  const { data: dispatches } = useQuery({
    queryKey: ['dispatches'],
    queryFn: () => apiClient.get('/dispatches/active'),
    refetchInterval: 10000,
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-cosmic-red/30 text-cosmic-red bg-cosmic-red/5'
      case 'high':
        return 'border-orange-500/30 text-orange-400 bg-orange-500/5'
      case 'medium':
        return 'border-amber-500/30 text-amber-400 bg-amber-500/5'
      case 'low':
        return 'border-blue-500/30 text-blue-400 bg-blue-500/5'
      default:
        return 'border-white/5 text-slate-500 bg-white/5'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-blue-400 border-blue-500/20'
      case 'assigned':
        return 'text-stardust-violet text-stardust-violet/80 border-stardust-violet/20'
      case 'in_progress':
        return 'text-amber-400 border-amber-500/20'
      case 'resolved':
      case 'closed':
        return 'text-earth-green border-earth-green/20'
      default:
        return 'text-slate-500 border-white/10'
    }
  }

  return (
    <Layout title="Incident_Ops_Terminal">
      <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-8 relative overflow-hidden">
        {/* Background Visual Flair */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cosmic-red/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
        {/* HUD Header & View Controls */}
        <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-32 h-[1px] bg-cosmic-red shadow-[0_0_15px_#ef4444]" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cosmic-red/10 border border-cosmic-red/20 rounded-sm">
                  <Ticket className="h-6 w-6 text-cosmic-red" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Incident_Ops_Terminal</h1>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Neural_Traffic_Anomaly_Rectification_Stream</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-white/5 p-1 border border-white/10 rounded-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all",
                    viewMode === 'grid' ? "bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.05)]" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <List className="w-4 h-4" />
                  List_Index
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all",
                    viewMode === 'kanban' ? "bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.05)]" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <LayoutIcon className="w-4 h-4" />
                  Neural_Board
                </button>
              </div>
              <Button className="bg-cosmic-red/80 hover:bg-cosmic-red text-white text-[10px] font-black uppercase tracking-widest h-11 px-6 rounded-sm shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <Plus className="mr-2 h-4 w-4" />
                INIT_INCIDENT_REPORT
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 mt-8 pt-8 border-t border-white/5">
            <div className="flex flex-col min-w-[200px]">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Status_Heuristics</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 focus:border-cosmic-red/30 focus:outline-none transition-all cursor-pointer rounded-sm"
              >
                <option value="all">ALL_STAGES</option>
                <option value="open">OPEN_SIGNALS</option>
                <option value="assigned">RECTIFIER_SYNCED</option>
                <option value="in_progress">FLUX_ACTIVE</option>
                <option value="resolved">ANOMALY_CLEARED</option>
              </select>
            </div>

            <div className="flex flex-col min-w-[200px]">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Threat_Level_Index</span>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 focus:border-cosmic-red/30 focus:outline-none transition-all cursor-pointer rounded-sm"
              >
                <option value="all">ALL_PRIORITIES</option>
                <option value="critical">CRITICAL_THREAT</option>
                <option value="high">HIGH_SEVERITY</option>
                <option value="medium">NOMINAL_DRIFT</option>
                <option value="low">LOW_IMPACT</option>
              </select>
            </div>

            <div className="flex-1 flex justify-end items-end h-[52px]">
              <div className="flex items-center gap-4 text-[10px] font-mono text-slate-600">
                <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-cosmic-red rounded-full" /> ACTIVE_THREATS: <span className="text-white font-black">{tickets?.filter((t: TicketData) => t.priority === 'critical').length || 0}</span></span>
                <div className="w-[1px] h-3 bg-white/5" />
                <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-earth-green rounded-full" /> PENDING_SYNC: <span className="text-white font-black">{tickets?.length || 0}</span></span>
              </div>
            </div>
          </div>
        </GlassWrapper>

        {/* Active Dispatches */}
        {dispatches && dispatches.length > 0 && (
          <GlassWrapper className="bg-blue-500/5 border-blue-500/20 rounded-sm p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-[1px] bg-blue-500 shadow-[0_0_15px_#3b82f6]" />
            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center">
              <Navigation className="mr-3 h-5 w-5 text-blue-400 animate-pulse" />
              ACTIVE_DISPATCH_MATRIX ({dispatches.length}_UNITS)
            </h3>
            <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dispatches.map((dispatch: TechnicianDispatch) => (
                <StaggerItem key={dispatch.id}>
                  <SoftLift>
                    <GlassWrapper className="bg-white/5 border-white/10 p-5 rounded-sm hover:border-blue-500/30 transition-all group/dispatch">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-white uppercase tracking-wider italic">{dispatch.technician_name}</span>
                          <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest mt-1">UNIT_ID:_{dispatch.id}</span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 text-[8px] font-black rounded-sm border uppercase tracking-widest",
                          dispatch.status === 'on_site' ? "bg-earth-green/10 border-earth-green/20 text-earth-green" :
                            dispatch.status === 'en_route' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                              "bg-blue-500/10 border-blue-500/20 text-blue-400"
                        )}>
                          {dispatch.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                        <div className="flex flex-col gap-1">
                          <span className="text-[7px] text-slate-700 italic">Distance_Buffer</span>
                          <div className="flex items-center text-white">
                            <MapPin className="h-3 w-3 mr-2 text-blue-400" />
                            {dispatch.distance.toFixed(1)}_KM
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[7px] text-slate-700 italic">Temporal_ETA</span>
                          <div className="flex items-center text-white">
                            <Clock className="h-3 w-3 mr-2 text-blue-400" />
                            {dispatch.travel_time}_MIN
                          </div>
                        </div>
                      </div>
                    </GlassWrapper>
                  </SoftLift>
                </StaggerItem>
              ))}
            </StaggerList>
          </GlassWrapper>
        )}

        {/* Tickets View Area */}
        {viewMode === 'kanban' ? (
          <div className="h-[calc(100vh-400px)] min-h-[500px] overflow-hidden rounded-sm border border-white/5">
            <TicketKanban initialTickets={tickets || []} />
          </div>
        ) : (
          <StaggerList className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {tickets?.map((ticket: TicketData) => (
              <StaggerItem key={ticket.id}>
                <SoftLift>
                  <GlassWrapper
                    onClick={() => setSelectedTicket(ticket.id)}
                    className={cn(
                      "bg-[#0a0a0c] border-white/5 p-6 cursor-pointer transition-all duration-300 group relative overflow-hidden",
                      selectedTicket === ticket.id ? "border-cosmic-red/40 bg-cosmic-red/[0.02]" : "hover:border-white/20"
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-slate-700 tracking-widest">SIG_ID:_{ticket.id}</span>
                          <span className={cn(
                            "px-2 py-0.5 text-[8px] font-black rounded-sm border uppercase tracking-widest",
                            getPriorityColor(ticket.priority)
                          )}>
                            {ticket.priority}_THREAT
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider line-clamp-2 italic leading-tight group-hover:text-cosmic-red transition-colors">
                          {ticket.title}
                        </h3>
                      </div>
                      {ticket.priority === 'critical' && (
                        <div className="p-2 bg-cosmic-red/10 border border-cosmic-red/20 rounded-sm">
                          <AlertTriangle className="h-5 w-5 text-cosmic-red animate-pulse" />
                        </div>
                      )}
                    </div>

                    {/* Status & Timestamp */}
                    <div className="flex items-center justify-between mb-6 relative z-10 pt-4 border-t border-white/5">
                      <div className={cn(
                        "px-2 py-1 text-[8px] font-black rounded-sm border uppercase tracking-widest flex items-center gap-1.5",
                        getStatusColor(ticket.status)
                      )}>
                        <div className={cn("w-1 h-1 rounded-full", ticket.status === 'open' ? "bg-blue-400" : ticket.status === 'resolved' ? "bg-earth-green" : "bg-amber-400")} />
                        {ticket.status.replace('_', ' ')}
                      </div>
                      <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">
                        {new Date(ticket.created_at).toLocaleString()}
                      </span>
                    </div>

                    {/* Meta Info */}
                    <div className="space-y-3 relative z-10 mb-6">
                      {ticket.location && (
                        <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <MapPin className="h-3 w-3 mr-2 text-slate-600" />
                          LOC: {ticket.location.site} // BLDG_{ticket.location.building} // FL_{ticket.location.floor}
                        </div>
                      )}

                      {ticket.device_name && (
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <span className="text-slate-600">NODE_TARGET:</span> {ticket.device_name}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <User className="h-3 w-3 mr-2 text-slate-600" />
                          {ticket.impacted_users}_NODES_AFFECTED
                        </div>
                        {ticket.estimated_time && (
                          <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <Clock className="h-3 w-3 mr-2 text-slate-600" />
                            ETA: {ticket.estimated_time}_M
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assignee */}
                    {ticket.assignee_name && (
                      <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-sm mb-6 relative z-10">
                        <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-sm">
                          <Wrench className="h-3 w-3 text-blue-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest italic">Authorized_Rectifier</span>
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{ticket.assignee_name}</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 relative z-10">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-white/5 border-white/10 hover:border-cosmic-red/30 hover:text-white text-[8px] font-black uppercase tracking-[0.2em] h-8 rounded-sm transition-all"
                      >
                        <MessageSquare className="h-3.5 w-3.5 mr-2" />
                        COMM_SYNC
                      </Button>
                      {ticket.status === 'open' && (
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket.id); setIsAssignModalOpen(true); }}
                          className="flex-1 bg-cosmic-red/80 hover:bg-cosmic-red text-white text-[8px] font-black uppercase tracking-[0.2em] h-8 rounded-sm transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                        >
                          <Wrench className="h-3.5 w-3.5 mr-2" />
                          DEPLOY_UNIT
                        </Button>
                      )}
                      {ticket.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket.id); setIsResolveModalOpen(true); }}
                          className="flex-1 bg-earth-green/80 hover:bg-earth-green text-black text-[8px] font-black uppercase tracking-[0.2em] h-8 rounded-sm transition-all shadow-[0_0_10px_rgba(0,255,65,0.2)]"
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-2" />
                          CLEAR_SIGNAL
                        </Button>
                      )}
                    </div>
                  </GlassWrapper>
                </SoftLift>
              </StaggerItem>
            ))}
          </StaggerList>
        )}

        {/* Empty State */}
        {tickets && tickets.length === 0 && (
          <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm p-24 text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cosmic-red/5 blur-[80px] rounded-full pointer-events-none" />
            <div className="relative z-10 space-y-6">
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(255,255,255,0.02)]">
                <Ticket className="h-8 w-8 text-slate-700" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-[0.3em] mb-3 italic">No_Active_Signals_Detected</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest max-w-xs mx-auto mb-8 italic">Neural_Network_Baseline_Stabilized. No_Incident_Buffers_Pending_Recitification.</p>
              </div>
              <Button className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 text-[9px] font-black uppercase tracking-widest h-11 px-8 rounded-sm transition-all">
                MANUAL_FAULT_TRIGGER
              </Button>
            </div>
          </GlassWrapper>
        )}
      </div>

      {/* Assign Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0a0a0c] border border-white/10 w-full max-w-md p-8 rounded-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-cosmic-red/30" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-1">DEPLOY_UNIT</h2>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] italic mb-6">Authorize_Technician_Dispatch</p>

            <form onSubmit={handleAssign} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Technician_ID_Key</label>
                <input
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-cosmic-red/30 transition-all rounded-sm italic"
                  placeholder="e.g. 1005"
                  value={assignTechnicianId}
                  onChange={e => setAssignTechnicianId(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)} className="flex-1 border border-white/5 text-[10px] font-black uppercase tracking-widest h-12 rounded-sm hover:bg-white/5">ABORT</Button>
                <Button type="submit" className="flex-1 bg-cosmic-red text-white text-[10px] font-black uppercase tracking-widest h-12 rounded-sm hover:bg-cosmic-red/80">AUTHORIZE</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0a0a0c] border border-white/10 w-full max-w-md p-8 rounded-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-earth-green/30" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-1">CLEAR_SIGNAL</h2>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] italic mb-6">Finalize_Incident_Rectification</p>

            <form onSubmit={handleResolve} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Resolution_Log</label>
                <textarea
                  autoFocus
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-black text-white focus:outline-none focus:border-earth-green/30 transition-all rounded-sm italic resize-none"
                  placeholder="Describe rectification steps..."
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="ghost" onClick={() => setIsResolveModalOpen(false)} className="flex-1 border border-white/5 text-[10px] font-black uppercase tracking-widest h-12 rounded-sm hover:bg-white/5">ABORT</Button>
                <Button type="submit" className="flex-1 bg-earth-green text-black text-[10px] font-black uppercase tracking-widest h-12 rounded-sm hover:bg-earth-green/80">CONFIRM_CLEAR</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
