import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft,
    Upload,
    Scan,
    MessageSquare,
    FileText,
    Loader2,
    Check,
    MousePointer2,
    ArrowRight,
    Scissors,
    Combine,
    Droplets,
    Wand2
} from 'lucide-react';
import Layout from '@/components/layout';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function PDFForge() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [viewMode, setViewMode] = useState<'extract' | 'chat' | 'forge'>('extract');
    const [extractedData, setExtractedData] = useState<any>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
    const [query, setQuery] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isForging, setIsForging] = useState(false);
    const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setExtractedData(null);

            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(selectedFile));

            await performExtraction(selectedFile);
        }
    };

    const performExtraction = async (fileToUpload: File) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', fileToUpload);
            const response = await apiClient.upload('/modules/pdf/extract', formData);

            if (response.success) {
                setExtractedData(response.output);
                toast.success("Intelligence Engine Processed PDF");
                setChatMessages([
                    { role: 'ai', content: `Neural link established with ${fileToUpload.name}. I have analyzed the document and identified it as a ${response.output.document_type || 'regular document'}. How can I assist you with this data?` }
                ]);
            } else {
                toast.error(response.error || "Extraction failed");
            }
        } catch (error: any) {
            console.error("Extraction error:", error);
            toast.error(error.response?.data?.error || "Connection to modules-engine failed");
        } finally {
            setIsUploading(false);
        }
    };

    const handleChat = async () => {
        if (!query.trim() || !file) return;

        const userMsg = query;
        setQuery('');

        const history = chatMessages.map(m => ({
            [m.role === 'user' ? 'user' : 'assistant']: m.content
        }));

        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsThinking(true);

        try {
            const response = await apiClient.post('/modules/pdf/chat', {
                query: userMsg,
                context: extractedData,
                history: history
            });

            if (response.success) {
                setChatMessages(prev => [...prev, { role: 'ai', content: response.output.answer }]);
            } else {
                toast.error(response.error || "AI Core synthesis failed");
            }
        } catch (error: any) {
            console.error("Chat error:", error);
            toast.error(error.response?.data?.error || "Neural bridge failed");
        } finally {
            setIsThinking(false);
        }
    };

    const handleForge = async (action: 'split' | 'watermark') => {
        if (!file) {
            toast.error("No Source Material");
            return;
        }

        setIsForging(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (action === 'watermark') {
                formData.append('text', watermarkText);
            }

            const endpoint = `/modules/pdf/${action}`;
            const timestamp = new Date().getTime();
            const filename = action === 'split' ? `split_pages_${timestamp}.zip` : `forged_${file.name}`;

            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                toast.success(`PDF ${action} complete!`);
            } else {
                const err = await res.json();
                toast.error(err.error || "Forge operation failed");
            }
        } catch (error) {
            toast.error("Forge failure: " + error);
        } finally {
            setIsForging(false);
        }
    };

    const handleExtract = () => {
        if (file) {
            performExtraction(file);
        } else {
            toast.error("Please upload a PDF first");
        }
    };

    return (
        <Layout title="PDF Forge | Studio">
            <div className="h-[calc(100vh-64px)] flex flex-col">
                <div className="h-16 border-b border-white/10 bg-black/40 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push('/studio/dashboard')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Studio
                        </Button>
                        <div className="h-6 w-[1px] bg-white/10" />
                        <h1 className="font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
                            <FileText className="h-5 w-5 text-emerald-400" />
                            PDF_Forge
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-white/5 rounded-lg p-1 flex">
                            <button
                                onClick={() => setViewMode('extract')}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all flex items-center gap-2",
                                    viewMode === 'extract' ? "bg-emerald-500 text-black" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Scan className="h-3 w-3" /> Extraction
                            </button>
                            <button
                                onClick={() => setViewMode('chat')}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all flex items-center gap-2",
                                    viewMode === 'chat' ? "bg-emerald-500 text-black" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <MessageSquare className="h-3 w-3" /> Chat
                            </button>
                            <button
                                onClick={() => setViewMode('forge')}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all flex items-center gap-2",
                                    viewMode === 'forge' ? "bg-emerald-500 text-black" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Wand2 className="h-3 w-3" /> Forge
                            </button>
                        </div>
                        <Button
                            className="bg-white text-black hover:bg-slate-200 uppercase font-black tracking-widest text-xs"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="mr-2 h-3 w-3" /> Upload PDF
                        </Button>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 bg-slate-900/50 relative flex items-center justify-center border-r border-white/10">
                        {isUploading && (
                            <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mb-4" />
                                <p className="text-emerald-400 font-black uppercase tracking-[0.3em] text-xs animate-pulse">
                                    Neural_OCR_Processing...
                                </p>
                            </div>
                        )}
                        {file ? (
                            <div className="w-[80%] h-[90%] bg-white shadow-2xl rounded-sm relative overflow-hidden group">
                                {previewUrl ? (
                                    <iframe
                                        src={previewUrl}
                                        className="w-full h-full border-none"
                                        title="PDF Preview"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                                        <div className="text-center">
                                            <FileText className="h-20 w-20 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500 font-bold">{file.name}</p>
                                            <p className="text-slate-400 text-xs uppercase tracking-widest mt-2">PREPARING_PREVIEW...</p>
                                        </div>
                                    </div>
                                )}
                                {viewMode === 'extract' && (
                                    <div className="absolute inset-0 bg-emerald-500/5 cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-xs font-bold pointer-events-none">
                                            <MousePointer2 className="h-3 w-3 inline-block mr-1" />
                                            Draw a box to extract data
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 border-dashed">
                                    <FileText className="h-8 w-8 text-slate-500" />
                                </div>
                                <h3 className="text-white font-bold text-lg">No Document Loaded</h3>
                                <p className="text-slate-500 text-sm mt-1">Upload a PDF to start extraction or chat.</p>
                            </div>
                        )}
                    </div>

                    <div className="w-96 bg-black/40 backdrop-blur-md p-6 overflow-y-auto">
                        {viewMode === 'extract' ? (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Intelligence Output</h3>
                                    <div className="space-y-2">
                                        <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex justify-between items-center group hover:border-emerald-500/50 transition-colors cursor-pointer" onClick={handleExtract}>
                                            <span className="text-xs font-bold text-slate-300">Document Type</span>
                                            {extractedData?.document_type ? (
                                                <span className="text-xs font-mono text-emerald-400 uppercase">{extractedData.document_type}</span>
                                            ) : (
                                                <Scan className="h-3 w-3 text-slate-600 group-hover:text-emerald-500" />
                                            )}
                                        </div>
                                        <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex justify-between items-center group hover:border-emerald-500/50 transition-colors cursor-pointer" onClick={handleExtract}>
                                            <span className="text-xs font-bold text-slate-300">Analysis Method</span>
                                            {extractedData?.method ? (
                                                <span className="text-xs font-mono text-emerald-400 capitalize">{extractedData.method.replace('_', ' ')}</span>
                                            ) : (
                                                <Scan className="h-3 w-3 text-slate-600 group-hover:text-emerald-500" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {extractedData && (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg animate-in fade-in zoom-in-95">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Check className="h-4 w-4 text-emerald-400" />
                                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Extraction Complete</span>
                                        </div>
                                        <pre className="text-[10px] text-emerald-200 font-mono overflow-x-auto">
                                            {JSON.stringify(extractedData, null, 2)}
                                        </pre>
                                        <Button className="w-full mt-4 bg-emerald-500 text-black font-black uppercase tracking-widest text-xs h-8">
                                            Export JSON
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : viewMode === 'chat' ? (
                            <div className="h-full flex flex-col">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Document Chat</h3>
                                <div className="flex-1 bg-white/5 rounded-lg border border-white/10 p-4 mb-4 overflow-y-auto space-y-4">
                                    {chatMessages.length > 0 ? (
                                        chatMessages.map((msg, i) => (
                                            <div key={i} className={cn(
                                                "p-3 rounded-lg text-xs",
                                                msg.role === 'ai' ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/20" : "bg-white/5 text-white border border-white/10 ml-8"
                                            )}>
                                                <div className="font-black uppercase tracking-tighter mb-1 opacity-50">
                                                    {msg.role === 'ai' ? "Intelligence" : "You"}
                                                </div>
                                                {msg.content}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-xs text-slate-500 text-center italic mt-10">
                                            AI is ready to answer questions about this document.
                                        </div>
                                    )}
                                    {isThinking && (
                                        <div className="flex items-center gap-2 text-emerald-400 animate-pulse">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Neural_Processing...</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Ask a question..."
                                        className="bg-white/5 border-white/10 text-xs"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                                    />
                                    <Button size="icon" className="bg-emerald-500 text-black" onClick={handleChat} disabled={isThinking}>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Forge Tools</h3>
                                <div className="space-y-4">
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-emerald-500/30 transition-all group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                                                <Scissors className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-widest leading-none">Atom_Split</h4>
                                                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">Deconstruct PDF into single pages</p>
                                            </div>
                                        </div>
                                        <Button
                                            className="w-full bg-white/5 border border-white/10 text-white hover:bg-emerald-500 hover:text-black hover:border-transparent text-[10px] font-black uppercase tracking-widest h-10 transition-all"
                                            onClick={() => handleForge('split')}
                                            disabled={isForging}
                                        >
                                            {isForging ? <Loader2 className="animate-spin h-3 w-3" /> : "Initiate Split"}
                                        </Button>
                                    </div>
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-emerald-500/30 transition-all group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                                                <Droplets className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-widest leading-none">Neural_Watermark</h4>
                                                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">Inscribe ownership patterns</p>
                                            </div>
                                        </div>
                                        <Input
                                            value={watermarkText}
                                            onChange={(e) => setWatermarkText(e.target.value)}
                                            className="bg-black/60 border-white/10 text-[11px] font-mono mb-3 h-8 text-emerald-400 focus:ring-emerald-500/50"
                                            placeholder="Watermark Text..."
                                        />
                                        <Button
                                            className="w-full bg-white/5 border border-white/10 text-white hover:bg-emerald-500 hover:text-black hover:border-transparent text-[10px] font-black uppercase tracking-widest h-10 transition-all"
                                            onClick={() => handleForge('watermark')}
                                            disabled={isForging}
                                        >
                                            {isForging ? <Loader2 className="animate-spin h-3 w-3" /> : "Apply Signature"}
                                        </Button>
                                    </div>
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-xl opacity-50 cursor-not-allowed">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="h-10 w-10 bg-white/5 rounded-lg flex items-center justify-center text-slate-600">
                                                <Combine className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-widest leading-none opacity-50">Fusion_Merge</h4>
                                                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">Merge multiple neural strands</p>
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-emerald-500/50 font-black uppercase tracking-widest text-center italic">Requires Multi-File Buffer [COMING_SOON]</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
