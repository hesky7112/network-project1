import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import Layout from '@/components/layout'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Network,
  Wifi,
  Shield,
  Activity,
  Router,
  Search,
  RefreshCw,
  GitBranch,
} from 'lucide-react'
import { NetworkTopology } from '@/components/visualizations/NetworkTopology'
import { GlassWrapper, SoftLift, StaggerList, StaggerItem } from '@/components/ui/motion-container'
import { cn } from '@/lib/utils'

export default function Discovery() {
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'topology' | 'vlans' | 'wireless' | 'firewall'>('topology')

  // Fetch devices
  const { data: devices, refetch: refetchDevices } = useQuery({
    queryKey: ['devices'],
    queryFn: () => apiClient.getDevices(),
  })

  // Discovery mutation
  const startDiscovery = useMutation({
    mutationFn: (range: string) => apiClient.post('/discovery/start', { ip_range: range }),
    onSuccess: () => {
      refetchDevices()
      alert('Discovery started successfully!')
    },
  })

  const { data: vlans, refetch: fetchVLANs } = useQuery({
    queryKey: ['vlans', selectedDevice],
    queryFn: () => apiClient.get(`/discovery/vlans/${selectedDevice}`),
    enabled: !!selectedDevice,
  })

  // Wireless discovery
  const { data: wireless, refetch: fetchWireless } = useQuery({
    queryKey: ['wireless', selectedDevice],
    queryFn: () => apiClient.get(`/discovery/wireless/${selectedDevice}`),
    enabled: !!selectedDevice,
  })

  // Firewall discovery
  const { data: firewall, refetch: fetchFirewall } = useQuery({
    queryKey: ['firewall', selectedDevice],
    queryFn: () => apiClient.get(`/discovery/firewall/${selectedDevice}`),
    enabled: !!selectedDevice,
  })

  const handleStartDiscovery = () => {
    const range = prompt('Enter IP range (e.g., 192.168.1.0/24):')
    if (range) {
      startDiscovery.mutate(range)
    }
  }

  return (
    <Layout title="Neural_Discovery_Terminal">
      <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-8 relative overflow-hidden">
        {/* Background Visual Flair */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-stardust-violet/5 blur-[100px] rounded-full pointer-events-none" />
        {/* HUD Header */}
        <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-32 h-[1px] bg-indigo-500 shadow-[0_0_15px_#6366f1]" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-sm">
                  <Search className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Neural_Discovery_Terminal</h1>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Active_Heuristic_Network_Enumeration</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleStartDiscovery}
                className="bg-indigo-600/80 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest h-11 px-6 rounded-sm transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
              >
                <Search className="mr-2 h-4 w-4" />
                INITIATE_PROBE_SCAN
              </Button>
              <Button
                variant="outline"
                onClick={() => refetchDevices()}
                className="bg-white/5 border-white/10 hover:border-white/20 text-slate-400 text-[10px] font-black uppercase tracking-widest h-11 px-6 rounded-sm transition-all"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                RESYNC_INDICES
              </Button>
            </div>
          </div>
        </GlassWrapper>

        {/* Node Matrix */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center">
              <div className="w-1 h-1 bg-indigo-500 rounded-full mr-3" />
              IDENTIFY_NODE_TARGET
            </h3>
            <span className="text-[9px] font-mono text-slate-600">SCAN_READY:_{devices?.length || 0}_NODES</span>
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
                        ? 'border-indigo-500/40 bg-indigo-500/[0.02] shadow-[0_0_20px_rgba(99,102,241,0.05)]'
                        : 'border-white/5 bg-[#0a0a0c] hover:border-white/20'
                    )}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={cn(
                        "p-2 border rounded-sm transition-colors",
                        selectedDevice === device.id ? "bg-indigo-500/10 border-indigo-500/20" : "bg-white/5 border-white/10"
                      )}>
                        <Router className={cn("h-5 w-5", selectedDevice === device.id ? "text-indigo-400" : "text-slate-500")} />
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

        {/* Discovery Ops Terminal */}
        {selectedDevice && (
          <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm overflow-hidden">
            <div className="border-b border-white/5 bg-white/[0.02] px-6">
              <nav className="flex space-x-8" aria-label="Tabs">
                {[
                  { id: 'topology', label: 'NEURAL_TOPOLOGY', icon: GitBranch },
                  { id: 'vlans', label: 'VLAN_SYNAPSE', icon: Network },
                  { id: 'wireless', label: 'WAVE_EMISSIONS', icon: Wifi },
                  { id: 'firewall', label: 'SHIELD_PROTOCOL', icon: Shield },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "py-5 px-1 flex items-center gap-2 border-b-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all",
                      activeTab === tab.id
                        ? 'border-indigo-500 text-white bg-indigo-500/[0.02]'
                        : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-white/20'
                    )}
                  >
                    <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-indigo-400" : "text-slate-600")} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {/* Topology Tab */}
              {activeTab === 'topology' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">CDP_LLDP_RECONNAISSANCE</h3>
                    <Button
                      onClick={() => fetchVLANs()}
                      className="bg-indigo-600/80 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest h-8 px-4 rounded-sm transition-all"
                    >
                      <Activity className="mr-2 h-3.5 w-3.5" />
                      MAP_CONNECTIONS
                    </Button>
                  </div>
                  <GlassWrapper className="bg-black/40 border-white/5 rounded-sm h-[600px] overflow-hidden relative">
                    <div className="absolute inset-0 bg-indigo-500/[0.01] pointer-events-none" />
                    <NetworkTopology />
                  </GlassWrapper>
                </div>
              )}

              {/* VLANs Tab */}
              {activeTab === 'vlans' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">LOGICAL_VLAN_SEGMENTATION</h3>
                    <Button
                      onClick={() => fetchVLANs()}
                      className="bg-earth-green/80 hover:bg-earth-green text-black text-[9px] font-black uppercase tracking-widest h-8 px-4 rounded-sm transition-all shadow-[0_0_10px_#00ff4133]"
                    >
                      <Network className="mr-2 h-3.5 w-3.5" />
                      ENUMERATE_SEGMENTS
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.01]">
                          <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">VLAN_ID</th>
                          <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Designation</th>
                          <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Status_Sig</th>
                          <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Logic_Ports</th>
                          <th className="px-6 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Operations</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-[#0a0a0c]">
                        {vlans?.vlans?.map((vlan: any) => (
                          <tr key={vlan.vlan_id} className="hover:bg-white/[0.02] transition-colors group/row">
                            <td className="px-6 py-4 whitespace-nowrap text-[11px] font-mono text-indigo-400">
                              {vlan.vlan_id.toString().padStart(4, '0')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-white uppercase tracking-wider italic">
                              {vlan.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="bg-earth-green/10 border border-earth-green/20 text-earth-green px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest">
                                {vlan.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-[10px] font-mono text-slate-400">
                              {vlan.interfaces?.length || 0}_ACTIVE_GATING
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right space-x-3">
                              <button className="text-[9px] font-black text-slate-500 hover:text-earth-green uppercase tracking-[0.2em] transition-colors">MODIFY</button>
                              <button className="text-[9px] font-black text-slate-500 hover:text-cosmic-red uppercase tracking-[0.2em] transition-colors">PURGE</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Wireless Tab */}
              {activeTab === 'wireless' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">WAVE_EMISSION_ANALYSIS</h3>
                    <Button
                      onClick={() => fetchWireless()}
                      className="bg-stardust-violet/80 hover:bg-stardust-violet text-white text-[9px] font-black uppercase tracking-widest h-8 px-4 rounded-sm transition-all"
                    >
                      <Wifi className="mr-2 h-3.5 w-3.5" />
                      MONITOR_SPECTRUM
                    </Button>
                  </div>
                  <StaggerList className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {wireless?.networks?.map((network: any, idx: number) => (
                      <StaggerItem key={idx}>
                        <SoftLift>
                          <GlassWrapper className="bg-white/[0.02] border-white/5 p-6 rounded-sm relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-[11px] font-black text-white uppercase tracking-wider italic">{network.ssid}</h4>
                              <Wifi className="h-5 w-5 text-indigo-400 opacity-50" />
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Protocol</span>
                                <span className="text-[9px] font-mono text-slate-400">{network.security_type}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Spectrum</span>
                                <span className="text-[9px] font-mono text-slate-400">{network.frequency} // CH_{network.channel}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Clients</span>
                                <span className="text-[9px] font-mono text-slate-400">{network.client_count}/{network.max_clients}</span>
                              </div>
                              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="text-[10px] font-black text-earth-green italic">
                                  {network.power}_dBm
                                </div>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map(b => (
                                    <div key={b} className={cn(
                                      "w-1 h-3 rounded-full",
                                      b <= (Math.abs(network.power) < 60 ? 5 : 3) ? "bg-earth-green/60" : "bg-white/5"
                                    )} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </GlassWrapper>
                        </SoftLift>
                      </StaggerItem>
                    ))}
                  </StaggerList>
                </div>
              )}

              {/* Firewall Tab */}
              {activeTab === 'firewall' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">ACTIVE_SHIELD_PROTOCOLS</h3>
                    <Button
                      onClick={() => fetchFirewall()}
                      className="bg-cosmic-red/80 hover:bg-cosmic-red text-white text-[9px] font-black uppercase tracking-widest h-8 px-4 rounded-sm transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                    >
                      <Shield className="mr-2 h-3.5 w-3.5" />
                      AUDIT_POLICIES
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.01]">
                          <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Policy_ID</th>
                          <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Source_Matrix</th>
                          <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Dest_Matrix</th>
                          <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Vetting</th>
                          <th className="px-6 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Index</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-[#0a0a0c]">
                        {firewall?.policies?.map((policy: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/[0.02] transition-colors group/row">
                            <td className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-white uppercase tracking-wider italic">
                              {policy.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-[9px] font-mono text-slate-500">
                              {policy.source_addrs?.join(', ')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-[9px] font-mono text-slate-500">
                              {policy.dest_addrs?.join(', ')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={cn(
                                "px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border",
                                policy.action === 'allow' ? "bg-earth-green/10 border-earth-green/20 text-earth-green" : "bg-cosmic-red/10 border-cosmic-red/20 text-cosmic-red"
                              )}>
                                {policy.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-[10px] font-mono text-slate-600">
                              PRIORITY_{policy.priority.toString().padStart(3, '0')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </GlassWrapper>
        )}
      </div>
    </Layout>
  )
}
