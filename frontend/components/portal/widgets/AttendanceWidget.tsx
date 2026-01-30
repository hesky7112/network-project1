import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUserCheck, FiShield, FiAlertTriangle } from 'react-icons/fi';

export const AttendanceWidget: React.FC = () => {
    const [status, setStatus] = useState<'pending' | 'verified' | 'denied'>('pending');
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    const simulateTap = () => {
        setStatus('verified');
        setTimeout(() => setStatus('pending'), 5000);
    };

    return (
        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <FiUserCheck className="text-earth-green text-lg" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/60">Attendance_Status</h4>
                </div>
                <div className="text-[10px] font-mono text-earth-green bg-earth-green/10 px-2 py-0.5 rounded border border-earth-green/20">
                    {currentTime}
                </div>
            </div>

            <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <motion.div
                    animate={status === 'verified' ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                    className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${status === 'verified' ? 'bg-green-500/20 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]' :
                            status === 'denied' ? 'bg-red-500/20 border-red-500' : 'bg-white/5 border-white/10'
                        }`}
                >
                    {status === 'verified' ? (
                        <FiUserCheck className="text-3xl text-green-500" />
                    ) : status === 'denied' ? (
                        <FiAlertTriangle className="text-3xl text-red-500" />
                    ) : (
                        <FiShield className="text-3xl text-white/20 animate-pulse" />
                    )}
                </motion.div>

                <div className="text-center">
                    <p className="text-sm font-black uppercase tracking-tighter">
                        {status === 'verified' ? 'Access_Granted' : status === 'denied' ? 'Access_Denied' : 'Awaiting_Synapse'}
                    </p>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest mt-1">
                        {status === 'verified' ? 'Identity Verified: S-1204' : status === 'denied' ? 'Unknown Fragment Detected' : 'Tap NFC or Scan Biometric'}
                    </p>
                </div>
            </div>

            <button
                onClick={simulateTap}
                className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:border-white/30 transition-all"
            >
                Simulate_Hardware_Tap
            </button>
        </div>
    );
};
