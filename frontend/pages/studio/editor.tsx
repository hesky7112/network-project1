import { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Code } from 'lucide-react';
import Head from 'next/head';

export default function MarimoEditor() {
    const router = useRouter();
    const { id } = router.query;
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className="h-screen w-full bg-black flex flex-col overflow-hidden">
            <Head>
                <title>Module Studio Editor | Alien Net</title>
            </Head>

            {/* Editor Header */}
            <div className="h-14 border-b border-white/10 bg-oled-black/50 backdrop-blur-md flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/marketplace')}
                        className="text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Exit Studio
                    </Button>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-stardust-violet" />
                        <span className="text-xs font-black text-white uppercase tracking-widest">
                            Live_Editor {id ? `:: ${id}` : ''}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest animate-pulse">
                        ● Connected to Kernel (localhost:2718)
                    </div>
                </div>
            </div>

            {/* Iframe Container */}
            <div className="flex-1 relative bg-[#1C1C1C]">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        <div className="animate-spin h-8 w-8 border-2 border-stardust-violet/30 border-t-stardust-violet rounded-full" />
                    </div>
                )}

                {/* 
                    Direct iframe to local Marimo instance. 
                    Note: This assumes the user is running the backend locally or has port forwarding.
                */}
                <iframe
                    src="http://localhost:2718"
                    className="w-full h-full border-none relative z-10"
                    onLoad={() => setIsLoading(false)}
                    title="Marimo Editor"
                    allow="clipboard-read; clipboard-write"
                />
            </div>
        </div>
    );
}
