import React, { useState } from 'react';
import Head from 'next/head';
// import { motion } from 'framer-motion';
import { FiTrendingUp, FiShoppingBag, FiUsers, FiDollarSign, FiPlus, FiDownload, FiCheckCircle } from 'react-icons/fi';

const glass = "bg-white/10 backdrop-blur-lg border border-white/20";

const ResellerPanel = () => {
    const [balance] = useState(15420);
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Simulation of voucher generation
    const generateVouchers = () => {
        setLoading(true);
        setTimeout(() => {
            const newVouchers = [
                { id: 1, code: 'XYZ-99-ABC', status: 'available', price: 10, type: '1 Hour' },
                { id: 2, code: 'LMN-44-DEF', status: 'available', price: 50, type: '24 Hours' },
            ];
            setVouchers([...newVouchers, ...vouchers]);
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#07070a] text-white p-6 lg:p-12">
            <Head>
                <title>Reseller Terminal | SuperWiFi</title>
            </Head>

            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Agent Terminal</h1>
                        <p className="text-white/40">Wholesale management & commission tracking</p>
                    </div>
                    <div className={`${glass} px-8 py-4 rounded-3xl flex items-center gap-4`}>
                        <div className="w-10 h-10 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
                            <FiDollarSign />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Available Credit</p>
                            <p className="text-xl font-bold">KES {balance.toLocaleString()}</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
                    <StatSmall label="Sales (Today)" value="KES 1,200" icon={<FiTrendingUp className="text-indigo-400" />} />
                    <StatSmall label="Active Vouchers" value="84 Units" icon={<FiShoppingBag className="text-fuchsia-400" />} />
                    <StatSmall label="Sub-Accounts" value="12 Users" icon={<FiUsers className="text-green-400" />} />
                    <StatSmall label="Profit/Margin" value="15%" icon={<FiCheckCircle className="text-blue-400" />} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 space-y-8">
                        {/* Voucher Inventory */}
                        <section className={`${glass} rounded-[2.5rem] p-8`}>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-bold italic underline decoration-indigo-500 underline-offset-8">Inventory</h2>
                                <button
                                    onClick={generateVouchers}
                                    disabled={loading}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/40"
                                >
                                    {loading ? 'Processing...' : <><FiPlus /> Bulk Generate</>}
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-white/20 text-[10px] uppercase tracking-widest border-b border-white/5">
                                            <th className="pb-4">Code</th>
                                            <th className="pb-4">Type</th>
                                            <th className="pb-4">Value</th>
                                            <th className="pb-4">Status</th>
                                            <th className="pb-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {vouchers.map(v => (
                                            <tr key={v.id} className="group hover:bg-white/5 transition-colors">
                                                <td className="py-4 font-mono text-indigo-400">{v.code}</td>
                                                <td className="py-4">{v.type}</td>
                                                <td className="py-4">KES {v.price}</td>
                                                <td className="py-4">
                                                    <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[9px] rounded-full uppercase font-bold">{v.status}</span>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <button className="p-2 hover:bg-white/10 rounded-lg"><FiDownload /></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {vouchers.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center text-white/10 italic">Your inventory is currently empty.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        {/* Promo/News */}
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                            <FiTrendingUp className="absolute -bottom-10 -right-10 text-[12rem] text-white/10 rotate-12" />
                            <h3 className="text-2xl font-black mb-4">Earn More!</h3>
                            <p className="text-white/70 text-sm mb-6">Upgrade to 'Super-Agent' status and get a 5% extra margin on all voucher sales this month.</p>
                            <button className="bg-white text-indigo-900 font-bold px-6 py-3 rounded-full text-sm">Learn More</button>
                        </div>

                        {/* Quick Reports */}
                        <section className={`${glass} rounded-[2.5rem] p-8`}>
                            <h3 className="text-lg font-bold mb-6">Agent Ranking</h3>
                            <div className="space-y-4">
                                <AgentRank name="Kirinyaga Road Shop" sales="KES 42k" rank={1} />
                                <AgentRank name="Tom Mboya Stall 04" sales="KES 12k" rank={2} />
                                <AgentRank name="Luthuli Ave Agent" sales="KES 8k" rank={3} />
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatSmall = ({ label, value, icon }: any) => (
    <div className={`${glass} p-6 rounded-3xl flex items-center gap-4`}>
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl">{icon}</div>
        <div>
            <p className="text-[10px] text-white/30 uppercase font-black">{label}</p>
            <p className="text-lg font-bold">{value}</p>
        </div>
    </div>
);

const AgentRank = ({ name, sales, rank }: any) => (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
        <div className="flex items-center gap-3">
            <span className="w-6 h-6 flex items-center justify-center bg-indigo-500 text-[10px] rounded-lg font-black">{rank}</span>
            <span className="text-xs font-medium">{name}</span>
        </div>
        <span className="text-[10px] font-bold text-white/40">{sales}</span>
    </div>
);

export default ResellerPanel;
