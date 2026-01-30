import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Layout from '@/components/layout'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Download,
  Save,
  FileText,
  Settings,
  CheckCircle,
  XCircle,
  Plus,
} from 'lucide-react'
import { ConfigDiffViewer } from '@/components/visualizations/ConfigDiffViewer'
import { GlassWrapper, SoftLift, StaggerList, StaggerItem, CountUp } from '@/components/ui/motion-container'
import { cn } from '@/lib/utils'

const MOCK_ORIGINAL = `
hostname router-core-01
!
interface GigabitEthernet0/0
 description WAN Link
 ip address 192.168.1.1 255.255.255.0
!
router ospf 1
 network 192.168.1.0 0.0.0.255 area 0
!
`;

const MOCK_MODIFIED = `
hostname router-core-01
!
interface GigabitEthernet0/0
 description UPDATED WAN Link
 ip address 10.0.0.1 255.255.255.0
 speed 1000
!
interface GigabitEthernet0/1
 description LAN Link
 ip address 192.168.2.1 255.255.255.0
!
router ospf 1
 network 10.0.0.0 0.0.0.255 area 0
!
`;

export default function Configuration() {
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'backups' | 'templates' | 'compliance'>('backups')
  const [showDiff, setShowDiff] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<any>(null)

  // Fetch devices
  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: () => apiClient.getDevices(),
  })

  // Fetch backups
  const { data: backups, refetch: refetchBackups } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const { data } = await apiClient.get('/configs')
      return data || []
    },
  })

  // Create backup mutation
  const createBackup = useMutation({
    mutationFn: (deviceID: number) =>
      apiClient.post('/configs/backup', { device_id: deviceID }),
    onSuccess: () => {
      alert('Backup created successfully!')
      refetchBackups()
    },
  })

  // Restore config mutation
  const restoreConfig = useMutation({
    mutationFn: (data: { deviceID: number; backupID: number }) =>
      apiClient.post(`/configs/restore/${data.deviceID}`, { backup_id: data.backupID }),
    onSuccess: () => {
      alert('Configuration restored successfully!')
    },
  })

  const handleCreateBackup = () => {
    if (selectedDevice) {
      createBackup.mutate(selectedDevice)
    } else {
      alert('Please select a device first')
    }
  }

  return (
    <Layout title="Config_Nexus_Prime">
      <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-8 relative overflow-hidden">
        {/* Background Visual Flair */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-stardust-violet/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-earth-green/5 blur-[100px] rounded-full pointer-events-none" />
        {/* HUD Header */}
        <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-32 h-[1px] bg-earth-green shadow-[0_0_15px_#00ff41]" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-earth-green/10 border border-earth-green/20 rounded-sm">
                  <Settings className="h-6 w-6 text-earth-green" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Config_Nexus_Prime</h1>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Core_Heuristic_Parameter_Synchronization</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreateBackup}
                disabled={!selectedDevice}
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest h-11 px-6 rounded-sm transition-all",
                  selectedDevice ? "bg-earth-green/80 hover:bg-earth-green text-black shadow-[0_0_15px_rgba(0,255,65,0.2)]" : "bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed"
                )}
              >
                <Save className="mr-2 h-4 w-4" />
                COMMIT_CURRENT_STATE
              </Button>
            </div>
          </div>
        </GlassWrapper>

        {/* Device Matrix */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center">
              <div className="w-1 h-1 bg-earth-green rounded-full mr-3" />
              SELECT_NODE_TARGET
            </h3>
            <span className="text-[9px] font-mono text-slate-600">TOTAL_DISCOVERED:_{devices?.length || 0}</span>
          </div>

          <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {devices?.map((device: any) => (
              <StaggerItem key={device.id}>
                <SoftLift>
                  <GlassWrapper
                    onClick={() => setSelectedDevice(device.id)}
                    className={cn(
                      "cursor-pointer border p-5 rounded-sm transition-all duration-300 group relative overflow-hidden",
                      selectedDevice === device.id
                        ? 'border-earth-green/40 bg-earth-green/[0.02] shadow-[0_0_20px_rgba(0,255,65,0.05)]'
                        : 'border-white/5 bg-[#0a0a0c] hover:border-white/20'
                    )}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={cn(
                        "p-2 border rounded-sm transition-colors",
                        selectedDevice === device.id ? "bg-earth-green/10 border-earth-green/20" : "bg-white/5 border-white/10"
                      )}>
                        <Settings className={cn("h-5 w-5", selectedDevice === device.id ? "text-earth-green" : "text-slate-500")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-white uppercase tracking-wider truncate italic">
                          {device.hostname || device.ip_address}
                        </p>
                        <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mt-1 truncate">
                          {device.device_type}_ARCHITECTURE
                        </p>
                      </div>
                    </div>
                  </GlassWrapper>
                </SoftLift>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>

        {/* Config Ops Terminal */}
        <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm overflow-hidden">
          <div className="border-b border-white/5 bg-white/[0.02] px-6">
            <nav className="flex space-x-8" aria-label="Tabs">
              {[
                { id: 'backups', label: 'BACKUP_SYNC', icon: Download },
                { id: 'templates', label: 'BLUEPRINT_REPOS', icon: FileText },
                { id: 'compliance', label: 'PROTO_COMPLIANCE', icon: CheckCircle },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "py-5 px-1 flex items-center gap-2 border-b-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all",
                    activeTab === tab.id
                      ? 'border-earth-green text-white bg-earth-green/[0.02]'
                      : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-white/20'
                  )}
                >
                  <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-earth-green" : "text-slate-600")} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {/* Comparison Overlay */}
            {/* ... Modal stays mostly same but with premium classes ... */}
            {showDiff && (
              <div className="fixed inset-0 z-50 bg-[#050505]/80 backdrop-blur-md flex items-center justify-center p-4">
                <GlassWrapper className="bg-[#0a0a0c] border-white/10 w-full max-w-6xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] rounded-sm relative">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-earth-green/50 to-transparent" />
                  <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-earth-green rounded-full animate-pulse" />
                        CONFIGURATION_SYNC_ANALYSIS
                      </h3>
                      <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-2">BACKUP_ID:_{selectedBackup?.id} // DELTA_VERIFICATION_STREAM</p>
                    </div>
                    <button
                      onClick={() => setShowDiff(false)}
                      className="p-2 hover:bg-white/5 rounded-sm transition-colors text-slate-500 hover:text-white"
                    >
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-6 bg-black/40">
                    <ConfigDiffViewer
                      original={MOCK_ORIGINAL}
                      modified={MOCK_MODIFIED}
                      height="60vh"
                    />
                  </div>
                  <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3">
                    <Button
                      onClick={() => setShowDiff(false)}
                      variant="outline"
                      className="bg-white/5 border-white/10 hover:border-white/20 text-slate-400 text-[9px] font-black uppercase tracking-widest h-10 px-6 rounded-sm transition-all"
                    >
                      ABORT_ANALYSIS
                    </Button>
                    <Button className="bg-earth-green/80 hover:bg-earth-green text-black text-[9px] font-black uppercase tracking-widest h-10 px-6 rounded-sm transition-all shadow-[0_0_15px_rgba(0,255,65,0.2)]">
                      <Save className="mr-2 h-4 w-4" />
                      SYNCHRONIZE_NEW_BASELINE
                    </Button>
                  </div>
                </GlassWrapper>
              </div>
            )}

            {/* Backups Tab */}
            {activeTab === 'backups' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">LOCAL_STORAGE_INDEX</h3>
                  <Button
                    variant="outline"
                    className="bg-white/5 border-white/10 hover:border-white/20 text-slate-400 text-[8px] font-black uppercase tracking-widest h-8 px-4 rounded-sm transition-all"
                    onClick={() => refetchBackups()}
                  >
                    <Download className="mr-2 h-3.5 w-3.5" />
                    RESYNC_STORAGE
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.01]">
                        <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Node_Target</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Sync_Timestamp</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Data_Load</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Health_Sig</th>
                        <th className="px-6 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-[#0a0a0c]">
                      {backups?.map((backup: any) => (
                        <tr key={backup.id} className="hover:bg-white/[0.02] transition-colors group/row">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-[11px] font-black text-white uppercase tracking-wider italic">
                              {backup.device?.hostname || backup.device?.ip_address}
                            </div>
                            <div className="text-[7px] font-mono text-slate-600 uppercase tracking-widest mt-1">NODE_ID:_{backup.device_id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                              {new Date(backup.created_at).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-slate-400">
                            {((backup.config_data?.length || 0) / 1024).toFixed(2)}_KB
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="bg-earth-green/10 border border-earth-green/20 text-earth-green px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest">
                              VERIFIED
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right space-x-3">
                            <button className="text-[9px] font-black text-slate-500 hover:text-earth-green uppercase tracking-[0.2em] transition-colors">VIEW</button>
                            <button
                              onClick={() => restoreConfig.mutate({
                                deviceID: backup.device_id,
                                backupID: backup.id
                              })}
                              className="text-[9px] font-black text-slate-500 hover:text-blue-400 uppercase tracking-[0.2em] transition-colors"
                            >
                              SYNC
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowDiff(true);
                              }}
                              className="text-[9px] font-black text-slate-500 hover:text-stardust-violet uppercase tracking-[0.2em] transition-colors"
                            >
                              DIFF
                            </button>
                            <button className="text-[9px] font-black text-slate-500 hover:text-cosmic-red uppercase tracking-[0.2em] transition-colors">PURGE</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">BLUEPRINT_REPOSITORY</h3>
                  <Button className="bg-stardust-violet/80 hover:bg-stardust-violet text-white text-[9px] font-black uppercase tracking-widest h-9 px-6 rounded-sm transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                    <Plus className="mr-2 h-4 w-4" />
                    REGISTER_NEW_BLUEPRINT
                  </Button>
                </div>

                <StaggerList className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { title: 'Basic Router Config', desc: 'Standard router configuration template with OSPF', icon: FileText, color: 'text-blue-400' },
                    { title: 'Switch VLAN Template', desc: 'Multi-VLAN switch configuration with trunking', icon: FileText, color: 'text-earth-green' },
                    { title: 'Firewall Security', desc: 'Firewall template with ACLs and security policies', icon: FileText, color: 'text-cosmic-red' },
                  ].map((tpl, i) => (
                    <StaggerItem key={i}>
                      <SoftLift>
                        <GlassWrapper className="bg-white/[0.02] border-white/5 p-6 rounded-sm hover:border-white/20 transition-all cursor-pointer group">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[11px] font-black text-white uppercase tracking-wider italic">{tpl.title.replace(/ /g, '_')}</h4>
                            <tpl.icon className={cn("h-5 w-5 opacity-50", tpl.color)} />
                          </div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-relaxed mb-6 italic">
                            {tpl.desc}
                          </p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 bg-white/5 border-white/10 hover:border-white/20 text-[8px] font-black uppercase tracking-[0.2em] h-8 rounded-sm">EDIT_CODE</Button>
                            <Button size="sm" className="flex-1 bg-white/10 border border-white/20 hover:bg-white/20 text-white text-[8px] font-black uppercase tracking-[0.2em] h-8 rounded-sm">DEPLOY_OPS</Button>
                          </div>
                        </GlassWrapper>
                      </SoftLift>
                    </StaggerItem>
                  ))}
                </StaggerList>
              </div>
            )}

            {/* Compliance Tab */}
            {activeTab === 'compliance' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">SECURITY_PROTOCOL_AUDIT</h3>
                  <Button className="bg-earth-green/80 hover:bg-earth-green text-black text-[9px] font-black uppercase tracking-widest h-9 px-6 rounded-sm transition-all shadow-[0_0_15px_rgba(0,255,65,0.2)]">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    TRIGGER_FULL_AUDIT
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <GlassWrapper className="bg-earth-green/5 border-earth-green/20 rounded-sm p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-earth-green/10 transform rotate-45 translate-x-8 -translate-y-8" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <h4 className="text-[11px] font-black text-earth-green uppercase tracking-[0.2em]">Compliant_Nodes</h4>
                      <CheckCircle className="h-6 w-6 text-earth-green" />
                    </div>
                    <div className="text-4xl font-black text-white italic tracking-tighter leading-none mb-2">
                      <CountUp value={24} />
                    </div>
                    <p className="text-[9px] font-black text-earth-green/60 uppercase tracking-widest">85%_OPERATIONAL_BASELINE</p>
                  </GlassWrapper>

                  <GlassWrapper className="bg-cosmic-red/5 border-cosmic-red/20 rounded-sm p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-cosmic-red/10 transform rotate-45 translate-x-8 -translate-y-8" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <h4 className="text-[11px] font-black text-cosmic-red uppercase tracking-[0.2em]">Incursion_Risks</h4>
                      <XCircle className="h-6 w-6 text-cosmic-red animate-pulse" />
                    </div>
                    <div className="text-4xl font-black text-white italic tracking-tighter leading-none mb-2">
                      <CountUp value={4} />
                    </div>
                    <p className="text-[9px] font-black text-cosmic-red/60 uppercase tracking-widest">15%_NODE_ANOMALIES</p>
                  </GlassWrapper>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">ACTIVE_COMPLIANCE_ALERTS</h4>
                  <div className="space-y-3">
                    {[
                      { title: 'Weak SSH Configuration', device: 'router-01.example.com', desc: 'SSH version 1 is enabled. Upgrade to version 2.', type: 'critical' },
                      { title: 'Missing NTP Configuration', device: 'switch-05.example.com', desc: 'NTP server not configured. Time synchronization required.', type: 'warning' },
                      { title: 'Default Credentials Detected', device: 'firewall-02.example.com', desc: 'Default admin password in use. Change immediately!', type: 'critical' },
                    ].map((issue, i) => (
                      <div key={i} className={cn(
                        "bg-white/[0.01] border p-4 rounded-sm flex items-start gap-4 group hover:bg-white/[0.03] transition-all",
                        issue.type === 'critical' ? "border-cosmic-red/20" : "border-amber-500/20"
                      )}>
                        <div className={cn(
                          "p-2 border rounded-sm",
                          issue.type === 'critical' ? "bg-cosmic-red/10 border-cosmic-red/20" : "bg-amber-500/10 border-amber-500/20"
                        )}>
                          <XCircle className={cn("h-4 w-4", issue.type === 'critical' ? "text-cosmic-red" : "text-amber-400")} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[11px] font-black text-white uppercase tracking-wider">{issue.title.replace(/ /g, '_')}</p>
                            <span className="text-[8px] font-mono text-slate-700 uppercase">{issue.type}</span>
                          </div>
                          <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">NODE_TARGET:_{issue.device}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-2 leading-relaxed">{issue.desc}</p>
                        </div>
                        <Button className="opacity-0 group-hover:opacity-100 bg-white/5 border border-white/10 hover:border-white/20 text-[8px] font-black uppercase tracking-widest h-8 px-4 rounded-sm transition-all">RESOLVE_SIG</Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </GlassWrapper>
      </div>
    </Layout>
  )
}
