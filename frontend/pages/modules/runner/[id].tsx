import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    ShieldCheck,
    RefreshCcw,
    ExternalLink,
    Loader2,
    Settings,
    FileText,
    BarChart,
    MessageSquare
} from 'lucide-react';
import apiClient from '@/lib/api';
import { Module } from '@/types';
import { toast } from 'react-hot-toast';
import DynamicForm from '@/components/modules/DynamicForm';

export default function ModuleRunner() {
    const router = useRouter();
    const { id } = router.query;
    const [module, setModule] = useState<Module | null>(null);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState(false);
    const [output, setOutput] = useState<any>(null);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                const res = await apiClient.get(`/modules/${id}`);
                setModule(res);
            } catch (err) {
                toast.error('Failed to load module details');
                router.push('/marketplace');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleRun = async (inputs: any) => {
        if (!module) return;

        try {
            setExecuting(true);
            setOutput(null); // Clear previous output

            const res = await apiClient.post(`/modules/${module.id}/execute`, {
                inputs: inputs,
                execution_mode: 'server'
            });

            setOutput(res);
            toast.success('Module execution complete!');
        } catch (err) {
            toast.error('Execution failed. Backend engine might be offline.');
        } finally {
            setExecuting(false);
        }
    };

    if (loading) {
        return (
            <Layout title="Initializing Runner">
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <RefreshCcw className="h-10 w-10 text-stardust-violet animate-spin" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Booting_Neural_Runtime...</span>
                </div>
            </Layout>
        );
    }

    if (!module) return null;

    const uiSchema = module.ui_schema as any;
    const formFields = uiSchema?.form_fields || [];
    const outputType = uiSchema?.output_type || 'dashboard';

    return (
        <Layout title={`Running: ${module.name}`}>
            <div className="flex flex-col gap-8 max-w-6xl mx-auto">
                {/* Runner Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="h-10 w-10 border border-white/5 bg-oled-black text-white hover:border-stardust-violet/30"
                            style={{ borderRadius: '2px' }}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">
                                {module.name} <span className="text-stardust-violet not-italic text-sm">v{module.version}</span>
                            </h2>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                                Active_Execution_Session // ID: {module.id}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="px-4 py-2 bg-oled-black border border-white/5 flex flex-col justify-center" style={{ borderRadius: '2px' }}>
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Pricing_Model</span>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{module.license_type}</span>
                        </div>
                    </div>
                </div>

                {/* Main Runner Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Parameter Form Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-8 bg-oled-black border border-white/5 relative overflow-hidden" style={{ borderRadius: '4px' }}>
                            <div className="absolute top-0 right-0 w-24 h-24 bg-stardust-violet/5 blur-3xl" />

                            <h4 className="text-[12px] font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                                <Settings className="h-4 w-4 text-stardust-violet" />
                                Execution_Parameters
                            </h4>

                            {formFields.length > 0 ? (
                                <DynamicForm
                                    fields={formFields}
                                    onSubmit={handleRun}
                                    executing={executing}
                                    submitLabel="Verify_and_Run"
                                />
                            ) : (
                                <div className="py-10 text-center border border-dashed border-white/10" style={{ borderRadius: '2px' }}>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No_Parameters_Required</p>
                                    <Button
                                        onClick={() => handleRun({})}
                                        disabled={executing}
                                        className="mt-6 bg-stardust-violet text-black font-black uppercase tracking-widest text-[10px]"
                                        style={{ borderRadius: '2px' }}
                                    >
                                        Run_Module
                                    </Button>
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Hardware_Link</span>
                                    <div className="flex gap-1.5">
                                        {module.requires_hal && <div className="w-2 h-2 bg-cyber-blue" style={{ borderRadius: '50%' }} title="HAL Needed" />}
                                        {module.requires_gpu && <div className="w-2 h-2 bg-earth-green" style={{ borderRadius: '50%' }} title="GPU Needed" />}
                                        {!module.requires_hal && !module.requires_gpu && <div className="w-2 h-2 bg-slate-700" style={{ borderRadius: '50%' }} />}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Encryption</span>
                                    <ShieldCheck className="h-3 w-3 text-earth-green" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Output / Results Area */}
                    <div className="lg:col-span-2 bg-oled-black border border-white/10 min-h-[600px] flex flex-col relative" style={{ borderRadius: '4px' }}>
                        {/* Interactive UI Header */}
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                            <div className="flex items-center gap-3">
                                {outputType === 'dashboard' && <BarChart className="h-4 w-4 text-stardust-violet" />}
                                {outputType === 'download' && <FileText className="h-4 w-4 text-cyber-blue" />}
                                {outputType === 'chat' && <MessageSquare className="h-4 w-4 text-earth-green" />}
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Neural_Output_Surface</span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-600">
                                <span className="text-[8px] font-bold uppercase tracking-widest">Live_Link</span>
                                <ExternalLink className="h-3 w-3" />
                            </div>
                        </div>

                        {/* Surface Content */}
                        <div className="flex-1 p-8 flex flex-col relative overflow-hidden">
                            {!output && !executing && (
                                <div className="m-auto text-center z-10">
                                    <div className="p-6 bg-stardust-violet/5 border border-stardust-violet/10 mb-6 inline-block" style={{ borderRadius: '50%' }}>
                                        <ShieldCheck className="h-10 w-10 text-stardust-violet opacity-40" />
                                    </div>
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Awaiting_Input_Parameters</h3>
                                    <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest max-w-xs mx-auto leading-relaxed italic">
                                        Encryption tunnel established. Provide parameters to start session.
                                    </p>
                                </div>
                            )}

                            {executing && (
                                <div className="m-auto text-center z-10 flex flex-col items-center gap-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-stardust-violet/30 blur-2xl animate-pulse" />
                                        <Loader2 className="h-16 w-16 text-stardust-violet animate-spin relative z-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black text-stardust-violet uppercase tracking-[0.4em] block">Executing_Primitive_Chain</span>
                                        <div className="flex gap-1 justify-center">
                                            {module.primitives.map((_, i) => (
                                                <div key={i} className="h-1 w-4 bg-stardust-violet/20" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {output && (
                                <div className="w-full flex-1 flex flex-col gap-6 animate-in fade-in duration-700">
                                    {/* Real execution results would be rendered here based on outputType */}
                                    <div className="p-4 bg-earth-green/5 border border-earth-green/10 flex items-center justify-between" style={{ borderRadius: '2px' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 bg-earth-green rounded-full shadow-[0_0_8px_#10B981]" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Execution_Success</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 font-mono tracking-tighter">
                                            {output.duration_ms}ms
                                        </span>
                                    </div>

                                    <div className="flex-1 bg-black/40 border border-white/5 p-6 font-mono overflow-auto relative group" style={{ borderRadius: '2px' }}>
                                        <div className="absolute top-4 right-4 text-[8px] font-black text-slate-700 uppercase tracking-widest group-hover:text-slate-500 transition-colors">Raw_Output_Log</div>
                                        <pre className="text-[11px] leading-relaxed whitespace-pre-wrap text-emerald-500/80">
                                            {JSON.stringify(output.output, null, 2)}
                                        </pre>
                                    </div>

                                    {output.output_file && (
                                        <Button
                                            variant="outline"
                                            className="h-12 border-stardust-violet/20 text-stardust-violet hover:bg-stardust-violet hover:text-black font-black uppercase tracking-widest text-[10px]"
                                            style={{ borderRadius: '2px' }}
                                        >
                                            <FileText className="h-4 w-4 mr-2" />
                                            Download_Result_Artifact
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Background Grid Pattern */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                style={{ backgroundImage: 'radial-gradient(circle, #8B5CF6 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
