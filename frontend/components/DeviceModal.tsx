import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Server, Shield, Cpu, MapPin, Zap, Activity } from 'lucide-react'
import { Device } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DeviceModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (device: Partial<Device>) => Promise<void>
    device?: Device | null
}

export default function DeviceModal({ isOpen, onClose, onSave, device }: DeviceModalProps) {
    const [formData, setFormData] = useState<Partial<Device>>({
        hostname: '',
        ip_address: '',
        device_type: 'Router',
        vendor: '',
        os: '',
        location: '',
        status: 'active'
    })
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (device) {
            setFormData(device)
        } else {
            setFormData({
                hostname: '',
                ip_address: '',
                device_type: 'Router',
                vendor: '',
                os: '',
                location: '',
                status: 'active'
            })
        }
    }, [device, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            await onSave(formData)
            onClose()
        } catch (err) {
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-[#0a0a0c] border border-white/10 rounded-sm overflow-hidden flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-sm bg-stardust-violet/20 flex items-center justify-center text-stardust-violet border border-stardust-violet/20">
                                    <Server className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tighter italic text-white flex items-center gap-2">
                                        {device ? 'EDIT_NODE_SIGNATURE' : 'REGISTER_NEW_NODE'}
                                    </h3>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Hardware_Matrix_Provisioning</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-sm hover:bg-white/5 text-slate-500 hover:text-white transition-all"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="hostname" className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <Zap className="h-3 w-3" /> Hostname
                                    </Label>
                                    <Input
                                        id="hostname"
                                        value={formData.hostname}
                                        onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                                        className="bg-black/40 border-white/10 rounded-sm text-[11px] uppercase tracking-widest focus:ring-stardust-violet/50 h-11"
                                        placeholder="CORE-R01"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ip_address" className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <Activity className="h-3 w-3" /> IP_Address
                                    </Label>
                                    <Input
                                        id="ip_address"
                                        value={formData.ip_address}
                                        onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                                        className="bg-black/40 border-white/10 rounded-sm text-[11px] uppercase tracking-widest focus:ring-stardust-violet/50 h-11"
                                        placeholder="10.0.0.1"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="device_type" className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <Cpu className="h-3 w-3" /> Architecture
                                    </Label>
                                    <select
                                        id="device_type"
                                        value={formData.device_type}
                                        onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                                        className="w-full h-11 px-3 bg-black/40 border border-white/10 rounded-sm text-[11px] font-black uppercase tracking-widest text-white outline-none focus:ring-1 focus:ring-stardust-violet/50 appearance-none cursor-pointer"
                                    >
                                        <option value="Router" className="bg-[#0a0a0c]">ROUTER</option>
                                        <option value="Switch" className="bg-[#0a0a0c]">SWITCH</option>
                                        <option value="Server" className="bg-[#0a0a0c]">SERVER</option>
                                        <option value="Firewall" className="bg-[#0a0a0c]">FIREWALL</option>
                                        <option value="Access Point" className="bg-[#0a0a0c]">ACCESS_POINT</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vendor" className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <Shield className="h-3 w-3" /> Vendor_Alias
                                    </Label>
                                    <Input
                                        id="vendor"
                                        value={formData.vendor}
                                        onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                        className="bg-black/40 border-white/10 rounded-sm text-[11px] uppercase tracking-widest focus:ring-stardust-violet/50 h-11"
                                        placeholder="CISCO / JUNIPER"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="os" className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <Cpu className="h-3 w-3" /> Kernel_OS
                                    </Label>
                                    <Input
                                        id="os"
                                        value={formData.os}
                                        onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                                        className="bg-black/40 border-white/10 rounded-sm text-[11px] uppercase tracking-widest focus:ring-stardust-violet/50 h-11"
                                        placeholder="IOS-XE / UBUNTU"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <MapPin className="h-3 w-3" /> Geolocation
                                    </Label>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="bg-black/40 border-white/10 rounded-sm text-[11px] uppercase tracking-widest focus:ring-stardust-violet/50 h-11"
                                        placeholder="NAIROBI-DC-01"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest h-12 rounded-sm transition-all"
                                >
                                    ABORT_PROCESS
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 bg-stardust-violet hover:bg-stardust-violet/90 text-[10px] font-black uppercase tracking-widest h-12 rounded-sm shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all"
                                >
                                    {isSaving ? 'RECOGNIZING...' : 'COMMIT_SIGNATURE'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
