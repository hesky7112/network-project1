import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Head from 'next/head'
import Layout from '@/components/layout'
import { apiClient } from '@/lib/api'
import {
    Globe,
    Shield,
    Plus,
    MapPin,
    Download,
    Signal
} from 'lucide-react'

interface Site {
    id: number
    name: string
    location: string
    wan_ip: string
    lan_subnet: string
    status: string
    last_seen: string
}



export default function SDWAN() {
    const [isRegisterOpen, setIsRegisterOpen] = useState(false)
    const [newSite, setNewSite] = useState({ name: '', location: '', lan_subnet: '192.168.20.0/24' })

    const { data: sites, refetch } = useQuery<Site[]>({
        queryKey: ['sdwan-sites'],
        queryFn: async () => {
            const { data } = await apiClient.get('/sdwan/sites')
            return data || []
        }
    })

    const registerMutation = useMutation({
        mutationFn: async (site: typeof newSite) => {
            await apiClient.post('/sdwan/sites', site)
        },
        onSuccess: () => {
            setIsRegisterOpen(false)
            refetch()
            setNewSite({ name: '', location: '', lan_subnet: '192.168.20.0/24' })
        }
    })

    const downloadConfig = async (siteId: number, type: 'wireguard' | 'ipsec') => {
        try {
            const { data } = await apiClient.get(`/sdwan/sites/${siteId}/vpn?type=${type}`)
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `vpn-config-${siteId}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        } catch (e) {
            console.error(e)
            alert('Failed to generate VPN config')
        }
    }

    return (
        <Layout title="SD-WAN Manager">
            <Head>
                <title>SD-WAN | Alien Net</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <Globe className="w-8 h-8 text-blue-500" />
                            Global Overlay
                        </h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                            Secure Branch Interconnectivity
                        </p>
                    </div>
                    <div>
                        <button
                            onClick={() => setIsRegisterOpen(!isRegisterOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Provision Site
                        </button>
                    </div>
                </div>

                {/* Registration Form */}
                {isRegisterOpen && (
                    <div className="bg-slate-900/50 border border-blue-500/30 rounded-xl p-6 mb-6">
                        <h3 className="text-white font-bold mb-4">New Branch Provisioning</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <input
                                placeholder="Site Name (e.g. Nairobi HQ)"
                                className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                value={newSite.name}
                                onChange={e => setNewSite({ ...newSite, name: e.target.value })}
                            />
                            <input
                                placeholder="Location (e.g. Westlands)"
                                className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                value={newSite.location}
                                onChange={e => setNewSite({ ...newSite, location: e.target.value })}
                            />
                            <input
                                placeholder="LAN Subnet (e.g. 192.168.10.0/24)"
                                className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                value={newSite.lan_subnet}
                                onChange={e => setNewSite({ ...newSite, lan_subnet: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsRegisterOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
                            <button onClick={() => registerMutation.mutate(newSite)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded">Deploy</button>
                        </div>
                    </div>
                )}

                {/* World Map Mockup */}
                <div className="bg-slate-950 border border-white/10 rounded-xl p-1 relative min-h-[300px] overflow-hidden group">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />

                    <div className="relative z-10 p-6">
                        <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Live Map</h3>
                        {sites?.map((site) => (
                            <div key={site.id} className="inline-flex items-center gap-2 bg-black/60 border border-blue-500/30 px-3 py-1.5 rounded-full mr-2 mb-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-xs font-bold text-white uppercase">{site.location}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sites Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sites?.map(site => (
                        <div key={site.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition-colors group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{site.name}</h3>
                                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                        <MapPin className="w-3 h-3" /> {site.location}
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-black uppercase ${site.status === 'provisioned' ? 'bg-green-500/10 text-green-400' : 'bg-slate-800 text-slate-400'}`}>
                                    <Signal className="w-3 h-3" /> {site.status}
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">ID</span>
                                    <span className="text-slate-300 font-mono text-xs">{site.id}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Subnet</span>
                                    <span className="text-slate-300 font-mono text-xs">{site.lan_subnet}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Last Seen</span>
                                    <span className="text-slate-300 font-mono text-xs">{new Date(site.last_seen).toLocaleTimeString()}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => downloadConfig(site.id, 'wireguard')}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded transition-colors"
                                >
                                    <Download className="w-3 h-3" /> WireGuard
                                </button>
                                <button
                                    onClick={() => downloadConfig(site.id, 'ipsec')}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded transition-colors"
                                >
                                    <Shield className="w-3 h-3" /> IPSec
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    )
}
