import React, { useState } from 'react';
import { FiDollarSign, FiHeart, FiCheckCircle, FiLoader } from 'react-icons/fi';

interface ContributionWidgetProps {
    onComplete?: () => void;
}

export const ContributionWidget: React.FC<ContributionWidgetProps> = ({ onComplete }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleGive = async () => {
        setLoading(true);
        // Simulate STK Push
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            if (onComplete) onComplete();
        }, 2000);
    };

    if (success) {
        return (
            <div className="text-center p-6 bg-green-500/10 rounded-3xl border border-green-500/20">
                <FiCheckCircle className="text-4xl text-green-500 mx-auto mb-2" />
                <p className="text-sm font-bold uppercase tracking-widest text-green-400">Blessing Received</p>
                <p className="text-[10px] text-white/60">Your contribution has been synchronized.</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400">
                    <FiHeart className="text-xl" />
                </div>
                <div>
                    <h4 className="text-sm font-black uppercase tracking-tighter">Sacred Offering</h4>
                    <p className="text-[10px] text-white/40">Direct M-Pesa Synapse</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map(val => (
                    <button
                        key={val}
                        onClick={() => setAmount(val.toString())}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${amount === val.toString() ? 'bg-fuchsia-500 border-fuchsia-500 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'}`}
                    >
                        KES {val}
                    </button>
                ))}
            </div>

            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">KES</span>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Custom Amount"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm outline-none focus:border-fuchsia-500/50 transition-all"
                />
            </div>

            <button
                disabled={!amount || loading}
                onClick={handleGive}
                className="w-full py-3 bg-white text-indigo-900 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-neutral-100 transition-all flex items-center justify-center gap-2"
            >
                {loading ? <FiLoader className="animate-spin" /> : <><FiDollarSign /> Initiate_Giving</>}
            </button>
        </div>
    );
};
