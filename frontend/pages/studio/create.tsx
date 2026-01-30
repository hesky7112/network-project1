
import { useState } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import {
    Cpu,
    Zap,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Loader2,
    Package,
    Code,
    Palette,
    Monitor
} from 'lucide-react';
import Layout from '@/components/layout';
import { GlassWrapper, SoftLift } from '@/components/ui/motion-container';
import { cn } from '@/lib/utils';

// Mock list of primitives available to the user
const AVAILABLE_PRIMITIVES = [
    { id: 'chatbot', name: 'Neural Chatbot (LLM)', description: 'Conversational AI interface' },
    { id: 'data-ingestion', name: 'Data Ingestion', description: 'Process structured data streams' },
    { id: 'visualization', name: 'Advanced Vis', description: 'D3/WebGL charting engine' },
    { id: 'geo-spatial', name: 'Geo-Spatial', description: 'Map and location services' },
    { id: 'payments', name: 'Payment Gateway', description: 'M-PESA / Stripe integration' },
];

const CATEGORIES = [
    { id: 'education', name: 'Education', icon: '🎓' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'business', name: 'Business', icon: '🏢' },
    { id: 'retail', name: 'Retail', icon: '🛒' },
    { id: 'other', name: 'Other', icon: '📦' },
];

export default function CreateModuleWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'business',
        primitives: [] as string[],
        version: '0.1.0',
        template: 'branded' // Default to branded
    });

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const togglePrimitive = (id: string) => {
        setFormData(prev => ({
            ...prev,
            primitives: prev.primitives.includes(id)
                ? prev.primitives.filter(p => p !== id)
                : [...prev.primitives, id]
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.description) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            // Construct payload matching backend Module struct
            const payload = {
                name: formData.name,
                description: formData.description,
                category: formData.category,
                version: formData.version,
                primitives: formData.primitives.map(p => ({ module: p })), // Backend expects list of objects
                price: 0, // Free by default as per new policy
                ui_schema: {}, // Empty schema for now
                ui_template: formData.template === 'branded' ? 'modules/branded.py' : '', // Map selection to file path
                execution_mode: 'browser' // Default to browser/client-side for basic modules
            };

            await apiClient.post('/modules', payload);
            toast.success("Module Created Successfully! Launching Editor...");
            // Redirect to the Editor for live coding
            router.push(`/studio/editor?id=${encodeURIComponent(formData.name)}`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to create module");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Module Studio">
            <div className="max-w-4xl mx-auto py-10 space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-stardust-violet/10 border border-stardust-violet/30 rounded-lg">
                        <Code className="h-8 w-8 text-stardust-violet" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Module_Studio</h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Create & Deploy Custom Primitives
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={cn(
                            "h-1 flex-1 transition-all duration-500 rounded-full",
                            s <= step ? "bg-stardust-violet" : "bg-white/10"
                        )} />
                    ))}
                </div>

                <GlassWrapper className="bg-black/40 border-white/10 min-h-[400px] relative overflow-hidden p-8">

                    {/* Step 1: Metadata */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-10 fade-in duration-300">
                            <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Package className="h-5 w-5 text-stardust-violet" />
                                Module_Details
                            </h2>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Module Name</label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Inventory Tracker"
                                        className="bg-white/5 border-white/10 text-white font-mono"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe what your module does..."
                                        className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-white text-sm focus:outline-none focus:border-stardust-violet/50 min-h-[100px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setFormData({ ...formData, category: cat.id })}
                                                className={cn(
                                                    "px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest border transition-all rounded-sm flex items-center gap-2",
                                                    formData.category === cat.id
                                                        ? "bg-stardust-violet text-black border-stardust-violet"
                                                        : "bg-transparent text-slate-500 border-white/10 hover:border-white/30"
                                                )}
                                            >
                                                <span>{cat.icon}</span> {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Primitives */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-10 fade-in duration-300">
                            <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Cpu className="h-5 w-5 text-stardust-violet" />
                                Select_Primitives
                            </h2>
                            <p className="text-xs text-slate-500">Choose the AI and Data capabilities your module requires.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {AVAILABLE_PRIMITIVES.map(p => (
                                    <SoftLift key={p.id}>
                                        <div
                                            onClick={() => togglePrimitive(p.id)}
                                            className={cn(
                                                "p-4 border rounded-md cursor-pointer transition-all flex items-start gap-3",
                                                formData.primitives.includes(p.id)
                                                    ? "bg-stardust-violet/10 border-stardust-violet"
                                                    : "bg-white/5 border-white/10 hover:border-white/20"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 mt-1 border rounded-sm flex items-center justify-center transition-colors",
                                                formData.primitives.includes(p.id) ? "bg-stardust-violet border-stardust-violet" : "border-slate-600"
                                            )}>
                                                {formData.primitives.includes(p.id) && <CheckCircle className="h-3 w-3 text-black" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{p.name}</div>
                                                <div className="text-[10px] text-slate-500 mt-1">{p.description}</div>
                                            </div>
                                        </div>
                                    </SoftLift>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Styling / Template */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-10 fade-in duration-300">
                            <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Palette className="h-5 w-5 text-stardust-violet" />
                                Select_Theme
                            </h2>
                            <p className="text-xs text-slate-500">Choose the starting look and feel for your app.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SoftLift>
                                    <div
                                        onClick={() => setFormData({ ...formData, template: 'branded' })}
                                        className={cn(
                                            "p-6 border rounded-md cursor-pointer transition-all space-y-3",
                                            formData.template === 'branded' ? "bg-stardust-violet/10 border-stardust-violet" : "bg-white/5 border-white/10 hover:border-white/20"
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-stardust-violet to-void-indigo flex items-center justify-center">
                                                <Zap className="h-5 w-5 text-white" />
                                            </div>
                                            {formData.template === 'branded' && <CheckCircle className="h-5 w-5 text-stardust-violet" />}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold uppercase tracking-wider">Alien Branded</h3>
                                            <p className="text-xs text-slate-400 mt-1">Pre-configured with Neural Net Dark Mode, Tailwind, and custom standard components.</p>
                                        </div>
                                    </div>
                                </SoftLift>

                                <SoftLift>
                                    <div
                                        onClick={() => setFormData({ ...formData, template: 'blank' })}
                                        className={cn(
                                            "p-6 border rounded-md cursor-pointer transition-all space-y-3",
                                            formData.template === 'blank' ? "bg-white/10 border-white" : "bg-white/5 border-white/10 hover:border-white/20"
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
                                                <Monitor className="h-5 w-5 text-slate-400" />
                                            </div>
                                            {formData.template === 'blank' && <CheckCircle className="h-5 w-5 text-white" />}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold uppercase tracking-wider">Blank Canvas</h3>
                                            <p className="text-xs text-slate-400 mt-1">Start from scratch. No pre-loaded styles or layouts.</p>
                                        </div>
                                    </div>
                                </SoftLift>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-right-10 fade-in duration-300">
                            <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Zap className="h-5 w-5 text-stardust-violet" />
                                Finalize_Deployment
                            </h2>

                            <div className="bg-white/5 border border-white/10 p-6 rounded-md space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Name</div>
                                        <div className="text-lg font-bold text-white">{formData.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Category</div>
                                        <div className="text-lg font-bold text-white capitalize">{formData.category}</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Primitives</div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.primitives.length > 0 ? formData.primitives.map(p => (
                                            <span key={p} className="px-2 py-1 bg-stardust-violet/20 text-stardust-violet border border-stardust-violet/30 text-[9px] font-black uppercase tracking-widest rounded-sm">
                                                {p}
                                            </span>
                                        )) : <span className="text-slate-500 text-sm italic">None selected</span>}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Theme</div>
                                    <div className="mt-1 text-sm font-bold text-white flex items-center gap-2">
                                        {formData.template === 'branded' ? (
                                            <>
                                                <Zap className="h-4 w-4 text-stardust-violet" /> Alien Branded
                                            </>
                                        ) : (
                                            <>
                                                <Monitor className="h-4 w-4 text-slate-400" /> Blank Canvas
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <div className="flex justify-between items-center bg-blue-500/10 border border-blue-500/30 p-3 rounded-md">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Estimated Cost</span>
                                        <span className="text-lg font-black text-blue-400">FREE</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </GlassWrapper>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-4">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={step === 1 || loading}
                        className="text-slate-500 hover:text-white"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>

                    {step < 4 ? (
                        <Button
                            onClick={handleNext}
                            className="bg-stardust-violet text-black font-black uppercase tracking-widest"
                            disabled={!formData.name}
                        >
                            Next <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-stardust-violet hover:bg-white hover:text-black text-black font-black uppercase tracking-widest min-w-[150px]"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Deploy Module"}
                        </Button>
                    )}
                </div>
            </div>
        </Layout>
    );
}
