import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Head from 'next/head'
import Layout from '@/components/layout'
import { apiClient } from '@/lib/api'
import {
    Wifi,
    Smartphone,
    Plus,
    Radio
} from 'lucide-react'

interface AccessPoint {
    id: number
    name: string
    mac_address: string
    ip_address: string
    status: string
    connected_clients: number
    model: string
}

export default function Wireless() {
    const [isProvisionOpen, setIsProvisionOpen] = useState(false)
    const [newAP, setNewAP] = useState({ name: '', mac_address: '', ip_address: '', model: 'Alien-AP-6' })

    const { data: aps, refetch } = useQuery<AccessPoint[]>({
        queryKey: ['wireless-aps'],
        queryFn: async () => {
            const { data } = await apiClient.get('/wireless/aps')
            return data || []
        },
        refetchInterval: 5000
    })

    const provisionMutation = useMutation({
        mutationFn: async (ap: typeof newAP) => {
            await apiClient.post('/wireless/aps', ap)
        },
        onSuccess: () => {
            setIsProvisionOpen(false)
            refetch()
            setNewAP({ name: '', mac_address: '', ip_address: '', model: 'Alien-AP-6' })
        }
    })

    return (
        <Layout title="Wireless Controller">
            <Head>
                <title>Wireless | Alien Net</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <Wifi className="w-8 h-8 text-purple-500" />
                            Airspace Command
                        </h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                            Enterprise Wi-Fi Management
                        </p>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500">
                            <Radio className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active APs</p>
                            <p className="text-2xl font-black text-white">{aps?.length || 0}</p>
                        </div>
                    </div>
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Connected Clients</p>
                            <p className="text-2xl font-black text-white">
                                {aps?.reduce((acc, ap) => acc + ap.connected_clients, 0) || 0}
                            </p>
                        </div>
                    </div>
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => setIsProvisionOpen(!isProvisionOpen)}>
                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                            <Plus className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Action</p>
                            <p className="text-lg font-bold text-white">Provision New AP</p>
                        </div>
                    </div>
                </div>

                {/* Provision Form */}
                {isProvisionOpen && (
                    <div className="bg-slate-900/50 border border-purple-500/30 rounded-xl p-6">
                        <h3 className="text-white font-bold mb-4">Provision Access Point</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <input
                                placeholder="AP Name"
                                className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                value={newAP.name}
                                onChange={e => setNewAP({ ...newAP, name: e.target.value })}
                            />
                            <input
                                placeholder="MAC Address"
                                className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                value={newAP.mac_address}
                                onChange={e => setNewAP({ ...newAP, mac_address: e.target.value })}
                            />
                            <input
                                placeholder="IP Address"
                                className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                value={newAP.ip_address}
                                onChange={e => setNewAP({ ...newAP, ip_address: e.target.value })}
                            />
                            <select
                                className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                value={newAP.model}
                                onChange={e => setNewAP({ ...newAP, model: e.target.value })}
                            >
                                <option value="Alien-AP-6">Alien AP 6 (Wi-Fi 6)</option>
                                <option value="Alien-AP-6E">Alien AP 6E (Tri-Band)</option>
                                <option value="Alien-AP-PRO">Alien AP Pro</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsProvisionOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
                            <button onClick={() => provisionMutation.mutate(newAP)} className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded">Join Network</button>
                        </div>
                    </div>
                )}

                {/* Grid */}
                <div className="bg-slate-950 border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white">Managed Devices</h3>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Device Name</th>
                                    <th className="px-6 py-3 font-medium">Model</th>
                                    <th className="px-6 py-3 font-medium">IP Address</th>
                                    <th className="px-6 py-3 font-medium">Clients</th>
                                    <th className="px-6 py-3 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {aps?.map(ap => (
                                    <tr key={ap.id} className="text-sm text-slate-300 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                Online
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">{ap.name}</td>
                                        <td className="px-6 py-4 text-xs font-mono text-slate-500">{ap.model}</td>
                                        <td className="px-6 py-4 font-mono text-xs">{ap.ip_address}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="w-4 h-4 text-blue-400" />
                                                {ap.connected_clients}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-xs font-bold text-purple-400 hover:text-purple-300">CONFIG</button>
                                        </td>
                                    </tr>
                                ))}
                                {aps?.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                                            No access points provisioned.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
