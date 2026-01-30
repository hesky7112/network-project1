import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Plus, Shield, ShieldCheck, Trash2, Edit2, X, Check, Info, Zap, Activity, Users } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { BlurReveal, GlassWrapper, SoftLift, StaggerList, StaggerItem, CountUp } from '@/components/ui/motion-container';
import { apiClient } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type Role = {
    id: number;
    name: string;
    description: string;
    level: number;
    permissions: string; // JSON string
    created_at: string;
};

const RESOURCES = [
    "devices", "configs", "users", "roles", "reports",
    "health", "tickets", "chat", "topology", "onboarding",
    "audit", "treasury", "marketplace", "seo"
];

const ACTIONS = ["read", "write", "delete", "execute", "export", "assign"];

export default function RolesManagement() {
    const { isAuthenticated } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [roleName, setRoleName] = useState("");
    const [roleDesc, setRoleDesc] = useState("");
    const [rolePerms, setRolePerms] = useState<Record<string, string[]>>({});

    const queryClient = useQueryClient();

    const { data: roles = [] } = useQuery({
        queryKey: ['admin-roles'],
        queryFn: () => apiClient.getAdminRoles(),
        enabled: isAuthenticated
    });

    const createRoleMutation = useMutation({
        mutationFn: (payload: any) => apiClient.createRole(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
            setIsModalOpen(false);
            resetForm();
        }
    });

    const updateRoleMutation = useMutation({
        mutationFn: (payload: any) => apiClient.updateRole(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
            setIsModalOpen(false);
            resetForm();
        }
    });

    const deleteRoleMutation = useMutation({
        mutationFn: (id: number) => apiClient.deleteRole(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
        }
    });

    const handleTogglePermission = (resource: string, action: string) => {
        setRolePerms((prev: Record<string, string[]>) => {
            const current = prev[resource] || [];
            if (current.includes(action)) {
                return { ...prev, [resource]: current.filter((a: string) => a !== action) };
            } else {
                return { ...prev, [resource]: [...current, action] };
            }
        });
    };

    const handleSaveRole = () => {
        const payload = {
            id: editingRole?.id,
            name: roleName,
            description: roleDesc,
            permissions: JSON.stringify(rolePerms),
            level: editingRole?.level || 5
        };

        if (editingRole) {
            updateRoleMutation.mutate(payload);
        } else {
            createRoleMutation.mutate(payload);
        }
    };

    const handleDeleteRole = (id: number) => {
        if (!confirm("Are you sure? This will disconnect all users assigned to this role.")) return;
        deleteRoleMutation.mutate(id);
    };

    const resetForm = () => {
        setEditingRole(null);
        setRoleName("");
        setRoleDesc("");
        setRolePerms({});
    };

    const columns: ColumnDef<Role>[] = [
        {
            accessorKey: 'name',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tier_Identity</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-8 h-8 flex items-center justify-center border",
                        row.original.level <= 4 ? "border-earth-green/30 bg-earth-green/10 text-earth-green" : "border-stardust-violet/30 bg-stardust-violet/10 text-stardust-violet"
                    )} style={{ borderRadius: '1.5px' }}>
                        <Shield className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="text-[11px] font-black text-white uppercase tracking-wider italic">{row.original.name}</div>
                        <div className="text-[9px] font-medium text-slate-500 uppercase tracking-widest leading-none mt-1">{row.original.description}</div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'level',
            header: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Clearance</span>,
            cell: ({ row }) => (
                <span className="font-mono text-[10px] text-slate-400 italic font-black uppercase tracking-widest">L_0{row.original.level}</span>
            )
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 border border-white/5 hover:border-stardust-violet/30 hover:text-stardust-violet transition-all"
                        onClick={() => {
                            setEditingRole(row.original);
                            setRoleName(row.original.name);
                            setRoleDesc(row.original.description);
                            setRolePerms(JSON.parse(row.original.permissions || '{}'));
                            setIsModalOpen(true);
                        }}
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    {row.original.level > 4 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 border border-white/5 hover:border-cosmic-red/30 hover:text-cosmic-red transition-all"
                            onClick={() => handleDeleteRole(row.original.id)}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            )
        }
    ];

    const summaryStats = [
        { label: "Total_Tiers", value: roles.length, icon: Shield, color: "text-white" },
        { label: "Protected_Cores", value: 4, icon: Zap, color: "text-earth-green" },
        { label: "Custom_Synapses", value: roles.filter((r: Role) => r.level > 4).length, icon: Activity, color: "text-stardust-violet" }
    ];

    return (
        <Layout title="Role_Management">
            <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-12 relative overflow-hidden">
                {/* Background Visual Flair */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-stardust-violet/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-earth-green/5 blur-[100px] rounded-full pointer-events-none" />

                <BlurReveal>
                    <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                        {/* HUD Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/10 pb-10 relative overflow-hidden">
                            <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-stardust-violet shadow-[0_0_15px_#6366f1]" />
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-stardust-violet/10 border border-stardust-violet/20 rounded-sm">
                                    <ShieldCheck className="h-8 w-8 text-stardust-violet" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                                        Duty_<span className="text-stardust-violet">Delegation</span>
                                    </h1>
                                    <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mt-2 italic">
                                        RBAC Authority Control & Access Tier Management
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => { resetForm(); setIsModalOpen(true); }}
                                className="bg-stardust-violet/80 hover:bg-stardust-violet text-white font-black uppercase text-[11px] tracking-widest h-14 px-10 rounded-sm transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                            >
                                <Plus className="mr-3 h-5 w-5" />
                                Initialize_New_Tier
                            </Button>
                        </div>

                        {/* Summary Metrics */}
                        <StaggerList className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {summaryStats.map((stat, idx) => (
                                <StaggerItem key={idx}>
                                    <SoftLift>
                                        <GlassWrapper className="p-8 border-white/5 bg-[#0a0a0c] group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] transform rotate-45 translate-x-8 -translate-y-8" />
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="p-2 bg-white/5 border border-white/10 rounded-sm">
                                                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                                                </div>
                                                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic group-hover:text-slate-400 transition-colors">Tier_Metric_0{idx + 1}</div>
                                            </div>
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</div>
                                            <div className={cn("text-5xl font-black italic tracking-tighter", stat.color)}>
                                                <CountUp value={stat.value} />
                                            </div>
                                        </GlassWrapper>
                                    </SoftLift>
                                </StaggerItem>
                            ))}
                        </StaggerList>

                        {/* Authority Matrix */}
                        <GlassWrapper className="bg-[#0a0a0c] border-white/5 rounded-sm overflow-hidden p-0 relative">
                            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-3 italic">
                                    <Users className="w-5 h-5 text-earth-green" /> Authority_Registry
                                </h2>
                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Index_Verification: <span className="text-earth-green italic">STABLE</span></div>
                            </div>
                            <div className="alien-net-table overflow-x-auto">
                                <DataTable columns={columns} data={roles} />
                            </div>
                        </GlassWrapper>
                    </div>
                </BlurReveal>

                {/* Role Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#0a0a0c] border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative"
                            style={{ borderRadius: '2.5px' }}
                        >
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-stardust-violet/30" />
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">
                                        {editingRole ? 'Update_Clearance_Tier' : 'Forge_New_Authority'}
                                    </h3>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] italic mt-1">Configuring_Access_Vectors & Data_Sensitivities</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsModalOpen(false)}
                                    className="h-10 w-10 p-0 border border-white/5 hover:bg-white/5 hover:border-white/10 rounded-sm"
                                >
                                    <X className="h-5 w-5 text-slate-500" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                                <StaggerList className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <StaggerItem className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic ml-1">Role_Codename</label>
                                        <input
                                            value={roleName}
                                            onChange={e => setRoleName(e.target.value)}
                                            placeholder="e.g. Finance_Manager"
                                            className="w-full bg-[#050505] border border-white/10 p-5 text-[11px] font-black uppercase text-white tracking-widest focus:outline-none focus:border-stardust-violet/40 transition-all rounded-sm placeholder:text-slate-800 italic"
                                        />
                                    </StaggerItem>
                                    <StaggerItem className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic ml-1">Operational_Scope</label>
                                        <input
                                            value={roleDesc}
                                            onChange={e => setRoleDesc(e.target.value)}
                                            placeholder="Brief description of duties..."
                                            className="w-full bg-[#050505] border border-white/10 p-5 text-[11px] font-black uppercase text-white tracking-widest focus:outline-none focus:border-stardust-violet/40 transition-all rounded-sm placeholder:text-slate-800 italic"
                                        />
                                    </StaggerItem>
                                </StaggerList>

                                <StaggerList className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2 ml-1">
                                        <Info className="w-4 h-4 text-stardust-violet" />
                                        <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">Permission_Matrix</h4>
                                    </div>

                                    <div className="border border-white/5 overflow-hidden bg-[#050505]" style={{ borderRadius: '2px' }}>
                                        <table className="w-full text-left">
                                            <thead className="bg-white/[0.02] border-b border-white/5">
                                                <tr>
                                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Resource_Vector</th>
                                                    {ACTIONS.map(action => (
                                                        <th key={action} className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center italic">{action}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.03]">
                                                {RESOURCES.map(res => (
                                                    <tr key={res} className="hover:bg-white/[0.01] transition-colors group">
                                                        <td className="p-5 text-[11px] font-black text-slate-300 uppercase tracking-wider group-hover:text-stardust-violet transition-colors italic">{res.replace(/ /g, '_')}</td>
                                                        {ACTIONS.map(action => {
                                                            const isChecked = rolePerms[res]?.includes(action);
                                                            return (
                                                                <td key={action} className="p-2 text-center">
                                                                    <button
                                                                        onClick={() => handleTogglePermission(res, action)}
                                                                        className={cn(
                                                                            "w-8 h-8 mx-auto border flex items-center justify-center transition-all duration-300 group/btn",
                                                                            isChecked
                                                                                ? "bg-earth-green border-earth-green text-black shadow-[0_0_10px_rgba(0,255,65,0.3)]"
                                                                                : "bg-white/[0.02] border-white/10 text-transparent hover:border-white/20"
                                                                        )}
                                                                        style={{ borderRadius: '1.5px' }}
                                                                    >
                                                                        <Check className={cn("h-4 w-4 transition-transform", isChecked ? "scale-110" : "scale-50")} />
                                                                    </button>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </StaggerList>
                            </div>

                            <div className="p-8 border-t border-white/5 flex justify-end gap-5 bg-white/[0.02] relative z-10">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-[11px] font-black uppercase tracking-[0.2em] px-10 h-12 text-slate-500 hover:text-white transition-colors"
                                >
                                    ABORT_FORGE
                                </Button>
                                <Button
                                    onClick={handleSaveRole}
                                    className="bg-stardust-violet/80 hover:bg-stardust-violet text-white text-[11px] font-black uppercase tracking-[0.2em] px-12 h-12 rounded-sm transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                                >
                                    {editingRole ? 'RESYNC_TIER_LOGIC' : 'INITIATE_AUTHORITY_STREAM'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .DataTable_row:hover {
                    background-color: rgba(139, 92, 246, 0.03) !important;
                }
                .custom-scrollbar::-webkit-scrollbar {
                  width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: rgba(255, 255, 255, 0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(139, 92, 246, 0.2);
                  border-radius: 2px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(139, 92, 246, 0.4);
                }
            `}</style>
        </Layout>
    );
}

