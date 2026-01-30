import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronRight, Check, Globe, Server, Activity, ShieldCheck } from 'lucide-react';

interface SetupWizardProps {
    onComplete: (data: any) => void;
    onCancel: () => void;
}

const STEPS = [
    { id: 'identity', title: 'Network Identity', icon: ShieldCheck },
    { id: 'topology', title: 'Topology Config', icon: Activity },
    { id: 'region', title: 'Regional Data', icon: Globe },
    { id: 'review', title: 'Final Review', icon: Server },
];

export function SetupWizard({ onComplete, onCancel }: SetupWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        networkName: '',
        organization: '',
        topology: '',
        region: '',
    });

    const updateData = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const nextStep = () => {
        if (currentStep < STEPS.length - 1) setCurrentStep(c => c + 1);
        else onComplete(formData);
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    const currentStepItem = STEPS[currentStep];
    if (!currentStepItem) return null;
    const StepIcon = currentStepItem.icon;

    return (
        <div className="w-full max-w-4xl mx-auto bg-oled-black border border-white/10 overflow-hidden flex flex-col md:flex-row min-h-[500px] shadow-2xl" style={{ borderRadius: '2px' }}>

            {/* Sidebar / Progress */}
            <div className="w-full md:w-1/3 bg-black/50 border-r border-white/5 p-8 flex flex-col">
                <div className="mb-10">
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">System Setup</h2>
                    <p className="text-earth-green text-[10px] font-black uppercase tracking-[0.3em] mt-1">Calibration_Wizard</p>
                </div>

                <div className="space-y-6 flex-1">
                    {STEPS.map((step, idx) => (
                        <div key={step.id} className="relative flex items-center gap-4">
                            {idx !== STEPS.length - 1 && (
                                <div className={`absolute left-4 top-8 w-0.5 h-6 ${idx < currentStep ? 'bg-earth-green' : 'bg-white/10'}`} />
                            )}

                            <div
                                className={`w-8 h-8 flex items-center justify-center border transition-all duration-300 ${idx === currentStep
                                    ? 'border-stardust-violet bg-stardust-violet/10 text-stardust-violet shadow-[0_0_10px_rgba(138,43,226,0.2)]'
                                    : idx < currentStep
                                        ? 'border-earth-green bg-earth-green text-black'
                                        : 'border-white/10 bg-transparent text-slate-600'
                                    }`}
                                style={{ borderRadius: '1.5px' }}
                            >
                                {idx < currentStep ? <Check className="w-4 h-4" /> : <span className="text-[10px] font-black">{idx + 1}</span>}
                            </div>

                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wider ${idx === currentStep ? 'text-white' : 'text-slate-500'}`}>
                                    {step.title}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto pt-8 border-t border-white/5">
                    <div className="flex items-center gap-2 text-slate-600">
                        <div className="w-2 h-2 rounded-full bg-earth-green animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Environment_Active</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8 md:p-12 flex flex-col relative overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

                <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-3 mb-8">
                        <StepIcon className="w-6 h-6 text-stardust-violet" />
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{currentStepItem.title}</h3>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {currentStep === 0 && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Network Name</Label>
                                        <Input
                                            placeholder="e.g. ALPHA_CENTAURI"
                                            value={formData.networkName}
                                            onChange={(e) => updateData('networkName', e.target.value)}
                                            className="bg-black border-white/10 h-10 text-white focus:border-stardust-violet/30 text-[11px] font-black uppercase"
                                            style={{ borderRadius: '1.5px' }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Organization Code</Label>
                                        <Input
                                            placeholder="e.g. ORG-0XF"
                                            value={formData.organization}
                                            onChange={(e) => updateData('organization', e.target.value)}
                                            className="bg-black border-white/10 h-10 text-white focus:border-stardust-violet/30 text-[11px] font-black uppercase"
                                            style={{ borderRadius: '1.5px' }}
                                        />
                                    </div>
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {['Star', 'Mesh', 'Ring', 'Hybrid'].map((type) => (
                                        <div
                                            key={type}
                                            onClick={() => updateData('topology', type)}
                                            className={`cursor-pointer p-4 border transition-all hover:bg-white/5 ${formData.topology === type
                                                ? 'border-stardust-violet bg-stardust-violet/5 shadow-[0_0_15px_rgba(138,43,226,0.1)]'
                                                : 'border-white/10 hover:border-white/30'
                                                }`}
                                            style={{ borderRadius: '1.5px' }}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-black text-[11px] text-white uppercase tracking-widest">{type}</span>
                                                {formData.topology === type && <Check className="w-4 h-4 text-stardust-violet" />}
                                            </div>
                                            <p className="text-xs text-slate-500">Optimized structure for {type.toLowerCase()} configurations.</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-slate-400">Primary Region</Label>
                                        <div className="relative">
                                            <select
                                                value={formData.region}
                                                onChange={(e) => updateData('region', e.target.value)}
                                                className="w-full bg-black border border-white/10 h-10 text-white px-3 text-[11px] font-black uppercase focus:border-stardust-violet/30 outline-none appearance-none cursor-pointer"
                                                style={{ borderRadius: '1.5px' }}
                                            >
                                                <option value="" disabled>Select Region</option>
                                                <option value="us-east">Region_US_EAST</option>
                                                <option value="eu-west">Region_EU_WEST</option>
                                                <option value="ap-south">Region_AP_SOUTH</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <ChevronRight className="w-4 h-4 text-slate-500 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="bg-white/5 p-6 rounded-sm border border-white/10 space-y-4">
                                    <h4 className="text-sm font-bold text-white uppercase border-b border-white/10 pb-2">Configuration Summary</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-500 text-xs uppercase">Network</p>
                                            <p className="text-white font-mono">{formData.networkName || 'Not Set'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs uppercase">Org Code</p>
                                            <p className="text-white font-mono">{formData.organization || 'Not Set'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Topology</p>
                                            <p className="text-earth-green font-black text-[11px] uppercase italic">{formData.topology || 'Not Set'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs uppercase">Region</p>
                                            <p className="text-white font-mono">{formData.region || 'Not Set'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-between pt-6 border-t border-white/5 relative z-10">
                    <Button
                        variant="ghost"
                        onClick={currentStep === 0 ? onCancel : prevStep}
                        className="text-slate-400 hover:text-white hover:bg-white/5"
                    >
                        {currentStep === 0 ? 'Cancel Setup' : 'Back'}
                    </Button>

                    <Button
                        onClick={nextStep}
                        className="bg-stardust-violet text-black hover:opacity-90 font-black uppercase tracking-widest min-w-[140px] h-11"
                        style={{ borderRadius: '1.5px' }}
                    >
                        {currentStep === STEPS.length - 1 ? 'Deploy_CNS' : 'Next_Phase'}
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>

            </div>
        </div>
    );
}
