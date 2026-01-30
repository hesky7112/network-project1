"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Database, RefreshCw, HardDrive, Activity, Clock } from 'lucide-react';

interface BackupHistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    deviceID: number;
    deviceName: string;
}

const BackupHistoryDrawer: React.FC<BackupHistoryDrawerProps> = ({ isOpen, onClose, deviceID, deviceName }) => {
    const [backups, setBackups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchBackups();
        }
    }, [isOpen]);

    const fetchBackups = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/devices/${deviceID}/backups`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setBackups(await res.json());
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleRestore = async (backupID: number) => {
        if (!confirm("Are you sure you want to restore this configuration? This will reboot the device.")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/configs/restore/${backupID}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) alert("Restore initiated successfully.");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-md h-full bg-[#0d0d0d] border-l border-white/10 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black italic tracking-tighter">CONFIG<span className="text-indigo-500">VAULT</span></h3>
                                <button onClick={onClose} className="p-3 rounded-xl hover:bg-white/5 transition-colors"><X /></button>
                            </div>
                            <div>
                                <h4 className="font-bold text-white/80">{deviceName}</h4>
                                <p className="text-white/40 text-xs">Configuration Version Control & Recovery</p>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-grow overflow-y-auto p-6 space-y-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-white/20 italic">
                                    <RefreshCw className="animate-spin text-3xl" />
                                    <span>Scanning Vault...</span>
                                </div>
                            ) : backups.length > 0 ? (
                                backups.map((backup) => (
                                    <div key={backup.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
                                                    <Database />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">v{backup.version || '1.0'}</p>
                                                    <p className="text-[10px] text-white/30 uppercase font-black">{new Date(backup.created_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRestore(backup.id)}
                                                className="px-3 py-1 rounded-lg bg-indigo-600 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Restore
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] text-white/20 font-mono">
                                            <span className="flex items-center gap-1"><Clock /> {backup.tags || 'baseline'}</span>
                                            <span className="flex items-center gap-1"><Activity /> {Math.round(backup.config?.length / 1024 || 0)} KB</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-white/20 italic border-2 border-dashed border-white/5 rounded-3xl m-4">
                                    <HardDrive className="text-4xl" />
                                    <span>No restore points found.</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-8 border-t border-white/5">
                            <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-transform">
                                CREATE INSTANT SNAPSHOT
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BackupHistoryDrawer;
