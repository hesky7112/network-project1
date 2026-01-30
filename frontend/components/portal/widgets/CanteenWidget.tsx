import React, { useState } from 'react';
import { FiShoppingBag, FiCheckCircle, FiLoader, FiPlus } from 'react-icons/fi';

const items = [
    { id: '1', name: 'Student Lunch', price: 150, category: 'Food' },
    { id: '2', name: 'Exercise Book', price: 80, category: 'Stationery' },
    { id: '3', name: 'Mineral Water', price: 50, category: 'Drinks' },
];

export const CanteenWidget: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handlePurchase = (id: string) => {
        setSelected(id);
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            setTimeout(() => { setSuccess(false); setSelected(null); }, 3000);
        }, 1500);
    };

    return (
        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
                <FiShoppingBag className="text-fuchsia-400" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/60">Canteen_Nexus</h4>
            </div>

            <div className="grid grid-cols-1 gap-2">
                {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
                        <div>
                            <p className="text-xs font-bold text-white">{item.name}</p>
                            <p className="text-[9px] text-white/40 uppercase tracking-tighter">{item.category} • KES {item.price}</p>
                        </div>
                        <button
                            onClick={() => handlePurchase(item.id)}
                            className="w-8 h-8 rounded-full bg-fuchsia-500 flex items-center justify-center text-white hover:bg-fuchsia-400 transition-all"
                        >
                            {loading && selected === item.id ? <FiLoader className="animate-spin text-xs" /> :
                                success && selected === item.id ? <FiCheckCircle className="text-xs" /> : <FiPlus />}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
