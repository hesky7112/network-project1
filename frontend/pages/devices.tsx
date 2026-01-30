import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '@/components/layout'
import { apiClient } from '@/lib/api'
import { Device } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Server,
  Network,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  RefreshCw,
  Database,
  Terminal,
  Activity,
  Cpu,
  Shield,
  MapPin,
  Clock
} from 'lucide-react'
import DeviceProxyModal from '@/components/DeviceProxyModal'
import BackupHistoryDrawer from '@/components/BackupHistoryDrawer'
import DeviceModal from '@/components/DeviceModal'
import { BlurReveal, GlassWrapper, StaggerList, StaggerItem, CountUp, SoftLift } from '@/components/ui/motion-container'
import { cn } from '@/lib/utils'

export default function DevicesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [proxyOpen, setProxyOpen] = useState(false)
  const [backupOpen, setBackupOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [isSyncing, setIsSyncing] = useState<number | null>(null)

  // Fetch devices
  const { data: devices, isLoading, refetch } = useQuery({
    queryKey: ['devices'],
    queryFn: () => apiClient.getDevices(),
    refetchInterval: 30000,
  })

  const filteredDevices = devices?.filter((device: Device) => {
    const matchesSearch = device.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.device_type?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  const handleSyncHardware = async (deviceID: number) => {
    setIsSyncing(deviceID)
    try {
      const res = await apiClient.post(`/v1/provision/sync/1/${deviceID}`, {})
      if (res.ok) {
        alert("Hardware synchronization successful! 🚀")
      }
    } catch (err) {
      console.error(err)
    }
    setIsSyncing(null)
  }

  const handleSaveDevice = async (deviceData: Partial<Device>) => {
    try {
      if (selectedDevice?.id) {
        await apiClient.updateDevice(selectedDevice.id, deviceData)
      } else {
        await apiClient.createDevice(deviceData)
      }
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteDevice = async (id: number) => {
    if (!confirm("Are you sure you want to decommission this node?")) return
    try {
      await apiClient.deleteDevice(id)
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const openProxy = (device: Device) => {
    setSelectedDevice(device)
    setProxyOpen(true)
  }

  const openBackup = (device: Device) => {
    setSelectedDevice(device)
    setBackupOpen(true)
  }

  const handleEditNode = (device: Device) => {
    setSelectedDevice(device)
    setModalOpen(true)
  }

  const handleRegisterNode = () => {
    setSelectedDevice(null)
    setModalOpen(true)
  }

  return (
    <Layout title="Network_Node_Inventory">
      <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-12 relative overflow-hidden font-sans">
        {/* Background Visual Flair */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-stardust-violet/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-earth-green/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:40px_40px]" />

        <BlurReveal>
          <div className="max-w-7xl mx-auto space-y-12 relative z-10">
            {/* HUD Header */}
            <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 w-32 h-[1px] bg-stardust-violet shadow-[0_0_15px_#6366f1]" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-stardust-violet/10 border border-stardust-violet/20 rounded-sm">
                    <Server className="h-8 w-8 text-stardust-violet" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                      Node_<span className="text-stardust-violet">Inventory</span>
                    </h1>
                    <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mt-2 italic">
                      Hardware_Matrix & automated logic_provisioning
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => refetch()}
                    className="bg-white/5 border-white/10 hover:border-white/30 text-[10px] font-black uppercase tracking-widest h-12 px-6 rounded-sm transition-all italic underline-offset-4 hover:underline"
                  >
                    <RefreshCw className={cn("mr-3 h-4 w-4", isLoading ? 'animate-spin' : '')} />
                    REFRESH_MATRIX
                  </Button>
                  <Button
                    className="bg-stardust-violet hover:bg-stardust-violet-600 text-white text-[10px] font-black uppercase tracking-widest h-12 px-8 rounded-sm transition-all italic shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                    onClick={handleRegisterNode}
                  >
                    <Plus className="mr-3 h-4 w-4" />
                    REGISTER_NODE
                  </Button>
                </div>
              </div>
            </GlassWrapper>

            {/* Filters and Search - Sleek HUD Bar */}
            <GlassWrapper className="bg-white/[0.02] border-white/5 p-6 rounded-sm">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-stardust-violet transition-colors" />
                  <input
                    type="text"
                    placeholder="SCAN_FOR_HOSTNAME, IP, OR ARCHITECTURE..."
                    className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-sm focus:ring-1 focus:ring-stardust-violet/50 focus:border-stardust-violet/50 text-[11px] font-black uppercase tracking-widest text-white placeholder:text-slate-600 outline-none transition-all italic"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-sm px-4 py-2">
                  <Filter className="h-4 w-4 text-slate-600" />
                  <select
                    className="bg-transparent border-none focus:ring-0 text-[11px] font-black uppercase tracking-widest text-white outline-none italic cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all" className="bg-[#050505]">ALL_STATUS_PHASES</option>
                    <option value="active" className="bg-[#050505]">NOMINAL_ACTIVE</option>
                    <option value="inactive" className="bg-[#050505]">INERT_INACTIVE</option>
                    <option value="unknown" className="bg-[#050505]">UNKNOWN_SIGNATURE</option>
                    <option value="discovered" className="bg-[#050505]">DISCOVERED_BROADCAST</option>
                  </select>
                </div>
              </div>
            </GlassWrapper>

            {/* Node Grid */}
            <StaggerList className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <GlassWrapper key={i} className="h-80 bg-white/[0.01] border-white/5 rounded-sm animate-pulse" />
                ))
              ) : filteredDevices.length > 0 ? (
                filteredDevices.map((device: Device) => (
                  <StaggerItem key={device.id}>
                    <SoftLift>
                      <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm hover:border-stardust-violet/30 transition-all duration-500 group overflow-hidden flex flex-col h-full">
                        <div className="p-8 space-y-8 flex-1">
                          {/* Card Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-5">
                              <div className={cn(
                                "p-4 rounded-sm border transition-all duration-500",
                                device.status === 'active' ? 'bg-earth-green/10 border-earth-green/20 text-earth-green' :
                                  'bg-white/5 border-white/10 text-slate-600'
                              )}>
                                {device.device_type?.includes('Router') || device.device_type?.includes('Switch') ? (
                                  <Network className="h-6 w-6" />
                                ) : (
                                  <Server className="h-6 w-6" />
                                )}
                              </div>
                              <div>
                                <h3 className="text-lg font-black text-white italic truncate tracking-tighter uppercase leading-none group-hover:text-stardust-violet transition-colors">
                                  {device.hostname || device.ip_address}
                                </h3>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-2 italic">
                                  {device.device_type || 'STANDARD_NODE'}_ARCH
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                device.status === 'active' ? 'bg-earth-green shadow-[0_0_10px_#00ff41]' :
                                  device.status === 'inactive' ? 'bg-cosmic-red shadow-[0_0_10px_#ef4444]' : 'bg-amber-500'
                              )} />
                              <MoreHorizontal className="h-4 w-4 text-slate-800" />
                            </div>
                          </div>

                          {/* Data Matrix */}
                          <div className="space-y-4">
                            {[
                              { label: 'NODE_IP', val: device.ip_address, icon: Activity },
                              { label: 'VENDOR_SIG', val: device.vendor, icon: Shield },
                              { label: 'OS_KERNEL', val: device.os, icon: Cpu },
                              { label: 'GEOLOCATION', val: device.location || 'NULL_SET', icon: MapPin },
                            ].map((item) => (
                              <div key={item.label} className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest italic group-hover:translate-x-1 transition-transform">
                                <span className="text-slate-500 flex items-center gap-2">
                                  <item.icon className="h-3 w-3 text-slate-700" /> {item.label}:
                                </span>
                                <span className="text-white border-b border-white/5 pb-0.5">{item.val}</span>
                              </div>
                            ))}
                          </div>

                          {/* Action Strip */}
                          <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-8">
                            {[
                              { label: 'Proxy', icon: Terminal, color: 'text-stardust-violet', bg: 'hover:bg-stardust-violet/10', action: () => openProxy(device) },
                              { label: 'Vault', icon: Database, color: 'text-earth-green', bg: 'hover:bg-earth-green/10', action: () => openBackup(device) },
                              { label: isSyncing === device.id ? 'Syncing' : 'Sync', icon: RefreshCw, color: 'text-amber-500', bg: 'hover:bg-amber-500/10', action: () => handleSyncHardware(device.id), spin: isSyncing === device.id },
                            ].map((btn) => (
                              <button
                                key={btn.label}
                                onClick={(e) => { e.stopPropagation(); btn.action() }}
                                className={cn(
                                  "flex flex-col items-center justify-center p-4 rounded-sm border border-transparent transition-all group/btn",
                                  btn.bg
                                )}
                              >
                                <btn.icon className={cn("h-5 w-5 mb-2 transition-transform group-hover/btn:scale-110", btn.color, btn.spin ? 'animate-spin' : '')} />
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover/btn:text-white">{btn.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="px-8 py-4 bg-white/[0.01] border-t border-white/5 flex items-center justify-between gap-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1 text-[9px] font-black uppercase tracking-widest italic text-slate-500 hover:text-white hover:bg-white/5 h-8"
                            onClick={() => handleEditNode(device)}
                          >
                            <Edit className="h-3.5 w-3.5 mr-2" /> EDIT_NODE
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[9px] font-black uppercase tracking-widest italic text-cosmic-red/60 hover:text-cosmic-red hover:bg-cosmic-red/5 h-8 px-3"
                            onClick={() => handleDeleteDevice(device.id)}
                          >
                            DECOMMISSION
                          </Button>
                        </div>
                      </GlassWrapper>
                    </SoftLift>
                  </StaggerItem>
                ))
              ) : (
                <div className="col-span-full h-96 flex flex-col items-center justify-center bg-white/[0.01] border border-dashed border-white/10 rounded-sm text-center px-12 group hover:border-stardust-violet/30 transition-all">
                  <div className="p-8 bg-white/5 border border-white/10 rounded-full mb-8 group-hover:scale-110 transition-transform">
                    <Server className="h-12 w-12 text-slate-800 group-hover:text-stardust-violet" />
                  </div>
                  <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-4">NO_NODES_DISCOVERED</h3>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic mb-10 max-w-md">The infrastructure search yielded zero results. Verify node broadcasts or initiate manual registration.</p>
                  <Button
                    className="bg-stardust-violet hover:bg-stardust-violet-600 text-white text-[10px] font-black uppercase tracking-widest h-12 px-10 rounded-sm transition-all italic"
                    onClick={handleRegisterNode}
                  >
                    <Plus className="mr-3 h-4 w-4" /> REGISTER_FIRST_NODE
                  </Button>
                </div>
              )}
            </StaggerList>

            {/* Summary Stats - HUD Units */}
            {!isLoading && devices && (
              <GlassWrapper className="bg-[#0a0a0c] border-white/5 p-10 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-stardust-violet/5 blur-[80px] pointer-events-none" />
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-12 italic flex items-center gap-3">
                  <Activity className="h-4 w-4 text-stardust-violet" /> AGGREGATE_NETWORK_THROUGHPUT
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                  {[
                    { label: 'TOTAL_NODES', val: devices.length, color: 'text-white' },
                    { label: 'NOMINAL_ACTIVE', val: devices.filter((d: Device) => d.status === 'active').length, color: 'text-earth-green' },
                    { label: 'INERT_INACTIVE', val: devices.filter((d: Device) => d.status === 'inactive').length, color: 'text-cosmic-red' },
                    { label: 'UNKNOWN_STATE', val: devices.filter((d: Device) => d.status === 'unknown').length, color: 'text-amber-500' },
                  ].map((stat) => (
                    <div key={stat.label} className="space-y-4">
                      <div className={cn("text-6xl font-black italic tracking-tighter italic leading-none", stat.color)}>
                        <CountUp value={stat.val} />
                      </div>
                      <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic">{stat.label}</div>
                      <div className="w-12 h-1 bg-white/5 rounded-full" />
                    </div>
                  ))}
                </div>
              </GlassWrapper>
            )}

            {/* Premium Modals */}
            <DeviceModal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              onSave={handleSaveDevice}
              device={selectedDevice}
            />

            {selectedDevice && (
              <>
                <DeviceProxyModal
                  isOpen={proxyOpen}
                  onClose={() => setProxyOpen(false)}
                  deviceName={selectedDevice.hostname || selectedDevice.ip_address}
                  deviceIP={selectedDevice.ip_address}
                  deviceID={selectedDevice.id}
                />
                <BackupHistoryDrawer
                  isOpen={backupOpen}
                  onClose={() => setBackupOpen(false)}
                  deviceID={selectedDevice.id}
                  deviceName={selectedDevice.hostname || selectedDevice.ip_address}
                />
              </>
            )}
          </div>
        </BlurReveal>

        {/* Global HUD Decoration */}
        <div className="fixed bottom-8 left-8 z-50 pointer-events-none">
          <div className="flex flex-col items-start gap-2 pl-4 border-l-2 border-stardust-violet/20">
            <span className="text-[8px] font-black text-slate-700 uppercase tracking-[0.5em] italic">Node_Matrix_Sync</span>
            <span className="text-[10px] font-black text-stardust-violet uppercase tracking-widest italic flex items-center gap-2">
              <Clock className="h-3 w-3" /> LATENCY:_0.002ms
            </span>
          </div>
        </div>
      </div>
    </Layout>
  )
}
