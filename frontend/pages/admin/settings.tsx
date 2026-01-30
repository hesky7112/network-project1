import React, { useState } from 'react';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Save, X, Cpu, Globe, ShieldCheck, AlertCircle, Activity, Shield, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassWrapper, SoftLift, StaggerList, StaggerItem, BlurReveal } from '@/components/ui/motion-container';

import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';

export default function SystemSettings() {
  const [formData, setFormData] = useState<any>({});
  // const [loading, setLoading] = useState(true); 
  // actually, let's just use it or remove it.
  // It is used in fetchSettings?
  // "Type error: 'loading' is declared but its value is never read." 
  // fetchSettings sets it, but the render doesn't use it.
  // I will check if the JSX uses loading. if not, I'll add a loader or just remove the state.
  // Let me view settings.tsx first to do it right.

  const fetchSettings = async () => {
    // setLoading(true);
    try {
      const data = await apiClient.getSettings();
      setFormData(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load registry");
    } finally {
      // setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.updateSettings(formData);
      toast.success("System parameters committed to core");
    } catch (e) {
      toast.error("Commit failed");
    }
  };

  return (
    <Layout title="System_Authority_Config">
      <div className="min-h-screen bg-[#050505] text-slate-300 p-4 sm:p-8 space-y-12 relative overflow-hidden">
        {/* Background Visual Flair */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-stardust-violet/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-earth-green/5 blur-[100px] rounded-full pointer-events-none" />

        <BlurReveal>
          <div className="max-w-7xl mx-auto space-y-12 relative z-10">
            {/* HUD Header */}
            <GlassWrapper className="bg-oled-black/60 border-white/5 p-8 rounded-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-32 h-[1px] bg-stardust-violet shadow-[0_0_15px_#6366f1]" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-stardust-violet/10 border border-stardust-violet/20 rounded-sm">
                    <Server className="h-8 w-8 text-stardust-violet" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                      System_<span className="text-stardust-violet">Authority</span>_Config
                    </h1>
                    <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mt-2 italic">
                      Core_Infrastructure_Governance & Registry_Parameters
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" className="h-14 px-10 border border-white/5 text-[11px] font-black uppercase tracking-widest hover:bg-white/5 hover:border-white/10 rounded-sm italic transition-all">
                    <X className="mr-3 h-4 w-4" />
                    DISCARD_ Handshake
                  </Button>
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

            <Tabs defaultValue="general" className="space-y-12">
              <div className="border-b border-white/5 overflow-x-auto">
                <TabsList className="bg-transparent h-auto p-0 flex gap-12">
                  {[
                    { id: 'general', label: 'GLOBAL_REGISTRY', icon: Globe },
                    { id: 'security', label: 'PROTECTION_VAULT', icon: Shield },
                    { id: 'relay', label: 'COMM_RELAY', icon: Activity },
                    { id: 'neural', label: 'ADV_NEURAL', icon: Zap }
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="data-[state=active]:bg-transparent data-[state=active]:text-stardust-violet data-[state=active]:border-stardust-violet border-b-2 border-transparent px-0 py-5 text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 rounded-none transition-all flex items-center gap-3 group/tab italic"
                    >
                      <tab.icon className="h-4 w-4 group-data-[state=active]/tab:text-stardust-violet transition-colors" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="general" className="mt-0 outline-none">
                <div className="grid gap-12 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-8">
                    <GlassWrapper className="bg-[#0a0a0c] border-white/5 p-10 rounded-sm" >
                      <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                        <Globe className="h-5 w-5 text-earth-green" />
                        <h2 className="text-[12px] font-black text-white uppercase tracking-[0.3em] italic">GLOBAL_STREAM_IDENTIFIERS</h2>
                      </div>
                      <StaggerList className="grid gap-10 md:grid-cols-2">
                        <StaggerItem className="space-y-3">
                          <Label htmlFor="siteName" className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-1">Site_Codename</Label>
                          <Input
                            id="siteName"
                            name="siteName"
                            value={formData.siteName}
                            onChange={handleInputChange}
                            className="bg-[#050505] border-white/10 text-[11px] font-black text-white uppercase h-14 focus:border-stardust-violet/40 rounded-sm italic tracking-widest px-5"
                          />
                        </StaggerItem>
                        <StaggerItem className="space-y-3">
                          <Label htmlFor="siteDescription" className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-1">Heuristic_Description</Label>
                          <Input
                            id="siteDescription"
                            name="siteDescription"
                            value={formData.siteDescription}
                            onChange={handleInputChange}
                            className="bg-[#050505] border-white/10 text-[11px] font-black text-white uppercase h-14 focus:border-stardust-violet/40 rounded-sm italic tracking-widest px-5"
                          />
                        </StaggerItem>
                        <StaggerItem className="space-y-3">
                          <Label htmlFor="timezone" className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-1">Temporal_Zone</Label>
                          <select
                            id="timezone"
                            name="timezone"
                            value={formData.timezone}
                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                            className="flex h-14 w-full bg-[#050505] border border-white/10 px-5 text-[11px] font-black text-white uppercase focus:outline-none focus:border-stardust-violet/40 rounded-sm italic tracking-widest"
                          >
                            <option value="UTC">UTC/GMT+0 (STABLE)</option>
                            <option value="EAT">Nairobi (GMT+3)</option>
                            <option value="EST">New York (EST)</option>
                            <option value="GMT">London (GMT)</option>
                          </select>
                        </StaggerItem>
                        <StaggerItem className="space-y-3">
                          <Label htmlFor="timeFormat" className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-1">Time_Cycle_Format</Label>
                          <div className="flex bg-[#050505] p-1.5 border border-white/10 rounded-sm h-14">
                            <button
                              className={cn("flex-1 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm italic", formData.timeFormat === '24h' ? "bg-stardust-violet text-white shadow-[0_0_15px_rgba(139,92,246,0.2)]" : "text-slate-600 hover:text-slate-400")}
                              onClick={() => setFormData({ ...formData, timeFormat: '24h' })}
                            >24H_Handshake</button>
                            <button
                              className={cn("flex-1 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm italic", formData.timeFormat === '12h' ? "bg-stardust-violet text-white shadow-[0_0_15px_rgba(139,92,246,0.2)]" : "text-slate-600 hover:text-slate-400")}
                              onClick={() => setFormData({ ...formData, timeFormat: '12h' })}
                            >12H_Handshake</button>
                          </div>
                        </StaggerItem>
                      </StaggerList>
                    </GlassWrapper>

                    <GlassWrapper className="bg-[#0a0a0c] border-white/5 p-10 rounded-sm" >
                      <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                        <ShieldCheck className="h-5 w-5 text-stardust-violet" />
                        <h2 className="text-[12px] font-black text-white uppercase tracking-[0.3em] italic">ACCESS_Handshake_LEVELS</h2>
                      </div>
                      <div className="space-y-8">
                        <div className="flex items-center justify-between group">
                          <div className="space-y-1">
                            <Label htmlFor="allowRegistrations" className="text-[11px] font-black text-white uppercase tracking-widest italic">USER_NODE_PROVISIONING</Label>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Allow autonomous user registration streams</p>
                          </div>
                          <Switch
                            id="allowRegistrations"
                            checked={formData.allowRegistrations}
                            onCheckedChange={(checked) => setFormData({ ...formData, allowRegistrations: checked })}
                            className="data-[state=checked]:bg-earth-green"
                          />
                        </div>
                        <div className="h-[1px] bg-white/[0.03]" />
                        <div className="flex items-center justify-between group">
                          <div className="space-y-1">
                            <Label htmlFor="requireEmailVerification" className="text-[11px] font-black text-white uppercase tracking-widest italic">IDENTITY_HANDSHAKE_REQ</Label>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Require verified multi-factor email confirmation</p>
                          </div>
                          <Switch
                            id="requireEmailVerification"
                            checked={formData.requireEmailVerification}
                            onCheckedChange={(checked) => setFormData({ ...formData, requireEmailVerification: checked })}
                            className="data-[state=checked]:bg-earth-green"
                          />
                        </div>
                      </div>
                    </GlassWrapper>
                  </div>

                  <div className="space-y-8">
                    <SoftLift>
                      <GlassWrapper className="bg-[#0a0a0c] border-stardust-violet/20 p-10 relative overflow-hidden group rounded-sm">
                        <div className="absolute top-0 right-0 w-24 h-[1px] bg-stardust-violet shadow-[0_0_15px_#6366f1]" />
                        <div className="flex items-center gap-4 mb-8">
                          <Cpu className="h-5 w-5 text-stardust-violet" />
                          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] italic">SYSTEM_HANDSHAKE</h3>
                        </div>
                        <div className="space-y-8">
                          <div className="text-center py-10 bg-white/[0.02] border border-white/5 rounded-sm relative overflow-hidden group/box">
                            <div className="absolute inset-0 bg-stardust-violet/[0.03] opacity-0 group-hover/box:opacity-100 transition-opacity" />
                            <div className="inline-block p-5 bg-stardust-violet/10 border border-stardust-violet/20 text-stardust-violet mb-6 rounded-sm relative z-10 transition-transform group-hover/box:scale-110">
                              <Zap className="h-10 w-10" />
                            </div>
                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-2 relative z-10 italic">System_Core_v4.2</h4>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest relative z-10 italic">Enterprise_Standard_Active</p>
                          </div>
                          <Button variant="outline" className="w-full h-12 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 hover:border-white/20 rounded-sm italic transition-all">
                            PROBE_FOR_UPDATES
                          </Button>
                        </div>
                      </GlassWrapper>
                    </SoftLift>

                    <GlassWrapper className="bg-[#0a0a0c] border-cosmic-red/20 p-10 relative overflow-hidden rounded-sm">
                      <div className="absolute inset-0 bg-cosmic-red/[0.01] pointer-events-none" />
                      <div className="flex items-center gap-4 mb-6">
                        <AlertCircle className="h-5 w-5 text-cosmic-red animate-pulse" />
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] text-cosmic-red italic">VOID_DANGER_Handshake</h3>
                      </div>
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-8 leading-relaxed italic">
                        CRITICAL: Modifications to core logic parameters may result in recursive system destabilization.
                      </p>
                      <Button variant="ghost" className="w-full h-12 border border-cosmic-red/30 text-[10px] font-black uppercase tracking-widest text-cosmic-red hover:bg-cosmic-red/10 rounded-sm italic transition-all">
                        PURGE_DATABASE_INSTANCE
                      </Button>
                    </GlassWrapper>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </BlurReveal>
      </div>
    </Layout>
  );
}

