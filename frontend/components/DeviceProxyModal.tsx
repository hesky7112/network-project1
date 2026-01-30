"use client"

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Globe, Maximize2 } from 'lucide-react';

interface DeviceProxyModalProps {
    isOpen: boolean;
    onClose: () => void;
    deviceName: string;
    deviceIP: string;
    deviceID: number;
}

const DeviceProxyModal: React.FC<DeviceProxyModalProps> = ({ isOpen, onClose, deviceName, deviceIP, deviceID }) => {
    const proxyUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/devices/${deviceID}/proxy/`;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full h-full bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl shadow-indigo-500/20"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/5 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                    <Shield className="text-2xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        Secure Tunnel: {deviceName}
                                        <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] uppercase font-black tracking-widest border border-green-500/20">Connected</span>
                                    </h3>
                                    <p className="text-white/40 text-sm font-mono">{deviceIP}:80 (Proxied via Alien Core)</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <button className="p-3 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all">
                                    <Maximize2 />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-3 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all border border-white/10"
                                >
                                    <X className="text-xl" />
                                </button>
                            </div>
                        </div>

                        {/* Iframe Container */}
                        <div className="flex-grow relative bg-white">
                            <iframe
                                src={proxyUrl}
                                className="w-full h-full border-none"
                                title={`Proxy to ${deviceName}`}
                                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                            />

                            {/* Overlay for loading/error states if needed */}
                        </div>

                        {/* Footer Info */}
                        <div className="px-8 py-4 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] font-black text-white/20">
                            <div className="flex items-center gap-6">
                                <span className="flex items-center gap-2"><Globe className="text-indigo-500" /> Layer 7 Proxy Active</span>
                                <span className="flex items-center gap-2 text-green-500/50">SSL Decrypted & Re-encrypted</span>
                            </div>
                            <div className="flex items-center gap-2">
                                Protected by Antigravity <Shield />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DeviceProxyModal;
