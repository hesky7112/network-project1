import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Wallet, Save, DollarSign, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { GlassWrapper, BlurReveal } from '@/components/ui/motion-container';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function MonetizationControl() {
    const [formData, setFormData] = useState<any>({});

    const fetchSettings = async () => {
        try {
            const data = await apiClient.getSettings();
            // Ensure booleans are parsed if they come as strings
            const parsedData = { ...data };
            if (typeof parsedData.monetization_enabled === 'string') {
                parsedData.monetization_enabled = parsedData.monetization_enabled === 'true';
            }
            setFormData(parsedData);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load monetization protocols");
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                // Convert boolean back to string for backend if needed, or if backend handles text
                monetization_enabled: String(formData.monetization_enabled)
            };
            await apiClient.updateSettings(payload);
            toast.success("Monetization vectors updated");
        } catch (e) {
            toast.error("Vector commit failed");
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    return (
        <Layout title="Monetization_Control">
            <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-12 relative overflow-hidden">
                {/* Background Visual Flair */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-earth-green/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-stardust-violet/5 blur-[100px] rounded-full pointer-events-none" />

                <BlurReveal>
                    <div className="max-w-4xl mx-auto space-y-12 relative z-10">
                        {/* Header */}
                        <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-32 h-[1px] bg-earth-green shadow-[0_0_15px_#22c55e]" />
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-earth-green/10 border border-earth-green/20 rounded-sm">
                                        <Wallet className="h-8 w-8 text-earth-green" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                                            Monetization_<span className="text-earth-green">Control</span>
                                        </h1>
                                        <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mt-2 italic">
                                            Revenue_Stream_Governance & Gateway_Parameters
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Button
                                        className="bg-earth-green/80 hover:bg-earth-green text-black text-[11px] font-black uppercase tracking-widest h-14 px-10 rounded-sm transition-all shadow-[0_0_20px_rgba(0,255,65,0.2)]"
                                        onClick={handleSubmit}
                                    >
                                        <Save className="mr-3 h-5 w-5" />
                                        COMMIT_CHANGES
                                    </Button>
                                </div>
                            </div>
                        </GlassWrapper>

                        {/* Master Control */}
                        <GlassWrapper className="bg-[#0a0a0c] border-white/5 p-10 rounded-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-[1px] bg-earth-green shadow-[0_0_15px_#22c55e]" />
                            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                                <ShieldCheck className="h-5 w-5 text-earth-green" />
                                <h2 className="text-[12px] font-black text-white uppercase tracking-[0.3em] italic">GLOBAL_REVENUE_STATUS</h2>
                            </div>

                            <div className="flex items-center justify-between group">
                                <div className="space-y-2">
                                    <Label className="text-[14px] font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-earth-green" />
                                        Commerce_Streams_Active
                                    </Label>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic max-w-md">
                                        Master switch for payment gateways.
                                        <br /><span className="text-blue-400">NOTE: When disabled, the Marketplace operates in "Free Mode", allowing all modules to be installed at no cost.</span>
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.monetization_enabled || false}
                                    onCheckedChange={(checked) => handleInputChange('monetization_enabled', checked)}
                                    className="data-[state=checked]:bg-earth-green scale-150 mr-4"
                                />
                            </div>
                        </GlassWrapper>

                        {/* Gateway Configuration */}
                        <GlassWrapper className={`bg-[#0a0a0c] border-white/5 p-10 rounded-sm relative overflow-hidden transition-opacity duration-500 ${!formData.monetization_enabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                                <CreditCard className="h-5 w-5 text-stardust-violet" />
                                <h2 className="text-[12px] font-black text-white uppercase tracking-[0.3em] italic">GATEWAY_PARAMETERS</h2>
                            </div>

                            <div className="grid gap-10 md:grid-cols-2">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-1">Payment_Gateway_Provider</Label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {['MPESA', 'STRIPE', 'PAYPAL'].map((gw) => (
                                            <button
                                                key={gw}
                                                onClick={() => handleInputChange('payment_gateway', gw)}
                                                className={`flex items-center justify-between p-4 border rounded-sm transition-all ${formData.payment_gateway === gw ? 'bg-stardust-violet/20 border-stardust-violet text-white shadow-[inset_0_0_20px_rgba(99,102,241,0.2)]' : 'bg-[#050505] border-white/10 text-slate-500 hover:border-white/30'}`}
                                            >
                                                <span className="text-[11px] font-black uppercase tracking-widest italic">{gw}_Network</span>
                                                {formData.payment_gateway === gw && <div className="w-2 h-2 bg-stardust-violet rounded-full shadow-[0_0_10px_#6366f1]" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-1">Currency_Root</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['KES', 'USD', 'EUR'].map((curr) => (
                                            <button
                                                key={curr}
                                                onClick={() => handleInputChange('currency', curr)}
                                                className={`h-14 border rounded-sm transition-all text-[11px] font-black uppercase tracking-widest italic ${formData.currency === curr ? 'bg-earth-green/20 border-earth-green text-white' : 'bg-[#050505] border-white/10 text-slate-500 hover:border-white/30'}`}
                                            >
                                                {curr}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-sm border border-white/5 mt-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Lock className="w-3 h-3 text-slate-500" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Security_Protocol</span>
                                        </div>
                                        <p className="text-[9px] text-slate-600 font-mono">
                                            ENCRYPTION: AES-256-GCM<br />
                                            TLS_VERSION: 1.3<br />
                                            PCI_COMPLIANCE: ACTIVE
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </GlassWrapper>

                    </div>
                </BlurReveal>
            </div>
        </Layout>
    );
}
