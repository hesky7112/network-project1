import { LucideIcon, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    icon: Icon = HardDrive,
    title,
    description,
    actionLabel,
    onAction,
    className = ''
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/5 bg-oled-black/40 ${className}`}
            style={{ borderRadius: '4px' }}
        >
            <div className="relative mb-6 group">
                <div className="absolute inset-0 bg-stardust-violet/20 blur-xl rounded-full group-hover:bg-stardust-violet/30 transition-all duration-500" />
                <div className="relative w-16 h-16 bg-oled-black rounded-full flex items-center justify-center border border-white/10 group-hover:border-stardust-violet/50 transition-colors">
                    <Icon className="w-8 h-8 text-slate-500 group-hover:text-stardust-violet transition-colors" />
                </div>
            </div>

            <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-2 italic">{title}</h3>
            <p className="text-slate-500 max-w-sm mb-8 text-[11px] font-bold uppercase tracking-wide leading-relaxed">{description}</p>

            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    className="bg-white/5 text-white border border-white/10 hover:bg-stardust-violet hover:text-black hover:border-stardust-violet font-black uppercase text-[10px] tracking-widest min-w-[140px]"
                    style={{ borderRadius: '1.5px' }}
                >
                    {actionLabel}
                </Button>
            )}
        </motion.div>
    );
}
