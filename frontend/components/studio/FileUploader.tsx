
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploaderProps {
    onUpload: (files: File[]) => void;
    acceptedTypes?: Record<string, string[]>;
    maxFiles?: number;
    className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
    onUpload,
    acceptedTypes = {
        'application/pdf': ['.pdf'],
        'application/x-parquet': ['.parquet'],
        'text/csv': ['.csv'],
        'text/plain': ['.log', '.txt'],
        'application/vnd.tcpdump.pcap': ['.pcap']
    },
    maxFiles = 5,
    className
}) => {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles].slice(0, maxFiles));
    }, [maxFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: acceptedTypes,
        maxFiles
    });

    const removeFile = (name: string) => {
        setFiles(prev => prev.filter(f => f.name !== name));
    };

    const handleStartUpload = () => {
        if (files.length === 0) return;
        setUploading(true);
        // Simulate high-speed processing
        setTimeout(() => {
            onUpload(files);
            setUploading(false);
            setFiles([]);
        }, 1500);
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div
                {...getRootProps()}
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[200px]",
                    isDragActive ? "border-cyan-500 bg-cyan-500/5" : "border-white/10 bg-white/5 hover:border-white/20",
                    "focus:outline-none focus:ring-2 focus:ring-stardust-violet/50"
                )}
                aria-label="File Uploader"
                role="button"
            >
                <input {...getInputProps()} />

                <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: isDragActive ? 1.1 : 1 }}
                    className="p-4 rounded-full bg-white/5 mb-4"
                >
                    <Upload className={cn("h-8 w-8", isDragActive ? "text-cyan-400" : "text-slate-400")} />
                </motion.div>

                <div className="text-center">
                    <p className="text-sm font-bold text-white uppercase tracking-tight">
                        {isDragActive ? "Drop files here" : "Drag & Drop Datasets"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">
                        Supports PDF, Parquet, CSV, Log, PCAP (Max {maxFiles} files)
                    </p>
                </div>

                {isDragActive && (
                    <motion.div
                        layoutId="glow"
                        className="absolute inset-0 bg-cyan-500/10 blur-xl -z-10"
                    />
                )}
            </div>

            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="space-y-2"
                    >
                        {files.map((file) => (
                            <div
                                key={file.name}
                                className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-cyan-500/10 text-cyan-400">
                                        <File className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white truncate max-w-[200px]">{file.name}</p>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">
                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFile(file.name)}
                                    className="p-1 hover:bg-red-500/20 hover:text-red-400 text-slate-500 rounded transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}

                        <Button
                            onClick={handleStartUpload}
                            disabled={uploading}
                            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-black uppercase tracking-widest mt-4 h-12"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Processing High-Scale Data...
                                </>
                            ) : (
                                "Ingest into Super Engine"
                            )}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
