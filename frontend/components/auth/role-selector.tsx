import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, HardHat, Eye, Fingerprint, Check, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

// Branding matrix for premium roles
const BRAND_MAP: Record<string, { icon: React.ElementType, color: string, codename: string, description: string }> = {
    'Super Admin': {
        icon: Shield,
        color: 'text-red-500',
        codename: 'ADMIN_ACCESS',
        description: 'Full system management and security control.',
    },
    'Network Admin': {
        icon: HardHat,
        color: 'text-blue-500',
        codename: 'NETWORK_MGMT',
        description: 'Infrastructure design and network configuration.',
    },
    'Technician': {
        icon: Fingerprint,
        color: 'text-amber-500',
        codename: 'AUDIT_ACCESS',
        description: 'Real-time monitoring and security auditing.',
    },
    'Viewer': {
        icon: Eye,
        color: 'text-slate-400',
        codename: 'VIEWER_ACCESS',
        description: 'View only access to dashboard and reports.',
    },
    // Aliases for professional display names
    'Administrator': { icon: Shield, color: 'text-red-500', codename: 'ADMIN_ACCESS', description: 'Full system management and security control.' },
    'Engineer': { icon: HardHat, color: 'text-blue-500', codename: 'NETWORK_MGMT', description: 'Infrastructure design and network configuration.' },
    'Auditor': { icon: Fingerprint, color: 'text-amber-500', codename: 'AUDIT_ACCESS', description: 'Real-time monitoring and security auditing.' },
};

const DEFAULT_BRAND = {
    icon: Zap,
    color: 'text-alien-green',
    codename: 'CUSTOM_ACCESS',
    description: 'Dynamic role provisioned by administrator.',
};

interface RoleOption {
    id: number;
    name: string;
    description: string;
}

interface RoleSelectorProps {
    selectedRole: string; // Now uses the name string for dynamic matching
    onChange: (roleName: string) => void;
}

export function RoleSelector({ selectedRole, onChange }: RoleSelectorProps) {
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const data = await apiClient.getPublicRoles();
                setRoles(data);
                // If nothing is selected, select the last one (usually Viewer) if level ordered
                if (!selectedRole && data.length > 0) {
                    onChange(data[data.length - 1].name);
                }
            } catch (err) {
                console.error("Failed to sync role matrix:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRoles();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 text-alien-green animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 animate-pulse">
                    Syncing roles...
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 block">
                Select Access Level
            </label>
            <div className="grid grid-cols-1 gap-3">
                {roles.map((role) => {
                    const brand = BRAND_MAP[role.name] || DEFAULT_BRAND;
                    const isSelected = selectedRole === role.name;
                    const Icon = brand.icon;

                    return (
                        <motion.button
                            key={role.id}
                            type="button"
                            onClick={() => onChange(role.name)}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                                "relative flex items-start gap-4 p-4 text-left border transition-all duration-300 overflow-hidden group",
                                isSelected
                                    ? "bg-white/[0.03] border-alien-green/50 shadow-[0_0_20px_rgba(0,255,65,0.05)]"
                                    : "bg-transparent border-white/5 hover:border-white/10"
                            )}
                            style={{ borderRadius: '2px' }}
                        >
                            <div className={cn(
                                "p-2 rounded-sm border transition-colors",
                                isSelected ? "bg-alien-green/20 border-alien-green/30" : "bg-white/5 border-white/5"
                            )}>
                                <Icon className={cn("w-5 h-5", isSelected ? "text-alien-green" : "text-slate-500")} />
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "text-xs font-black uppercase tracking-widest transition-colors",
                                        isSelected ? "text-white" : "text-slate-400 group-hover:text-slate-300"
                                    )}>
                                        {role.name}
                                    </span>
                                    <span className="text-[8px] font-mono text-slate-600 tracking-tighter uppercase opacity-50">
                                        {brand.codename}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed max-w-[200px]">
                                    {role.description || brand.description}
                                </p>
                            </div>

                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="absolute top-2 right-2"
                                    >
                                        <div className="w-4 h-4 rounded-full bg-alien-green flex items-center justify-center">
                                            <Check className="w-2.5 h-2.5 text-black stroke-[4px]" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Decorative glitch effect line on selection */}
                            {isSelected && (
                                <motion.div
                                    layoutId="glitch-line"
                                    className="absolute left-0 top-0 bottom-0 w-[2px] bg-alien-green"
                                    initial={{ height: 0 }}
                                    animate={{ height: '100%' }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
