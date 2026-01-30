import { motion } from "framer-motion"
import { Zap } from "lucide-react"

export function Loader({ text = "Initializing..." }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] w-full p-12">
            <div className="relative">
                {/* Rotating Rings */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-t-2 border-r-2 border-stardust-violet blur-[1px] opacity-70 w-16 h-16"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1 left-1 rounded-full border-b-2 border-l-2 border-emerald-400 blur-[1px] opacity-70 w-14 h-14"
                />

                {/* Center Icon */}
                <div className="w-16 h-16 flex items-center justify-center relative z-10">
                    <Zap className="w-6 h-6 text-white animate-pulse" />
                </div>
            </div>

            {/* Text */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-slate-500"
            >
                {text}
            </motion.p>
        </div>
    )
}
