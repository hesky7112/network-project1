import React, { useState, useEffect } from 'react';
import Head from 'next/head';
// import { motion } from 'framer-motion';
import { FiUser, FiActivity, FiCreditCard, FiClock, FiSettings, FiLogOut, FiBarChart2, FiDatabase, FiZap } from 'react-icons/fi';

const glass = "bg-white/10 backdrop-blur-md border border-white/20";
const cardBg = "bg-white/5 border border-white/10 hover:border-white/30 transition-all";

const CustomerDashboard = () => {
    const [user, setUser] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [usage, setUsage] = useState({ throttled: false });
    const [boostActive, setBoostActive] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, we'd fetch from auth context
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Simulate auth for demo
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [userRes, invRes, fupRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/user/me`, { headers }), // Placeholder for actual "me" endpoint
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/billing/invoices`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/fup/status`, { headers })
            ]);

            if (userRes.ok) setUser(await userRes.json());
            if (invRes.ok) setInvoices(await invRes.json());
            if (fupRes.ok) setUsage(await fupRes.json());

            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleInitiateBoost = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/provision/boost`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: user?.id,
                    device_id: 1, // Default for demo
                    package_id: 3, // Premium package for boost
                    hours: 5
                })
            });
            if (res.ok) {
                setBoostActive(true);
                alert("Turbo Boost Activated! 🚀 Your connection speed is now maximized.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white"><FiActivity className="animate-spin text-4xl text-indigo-500" /></div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex">
            <Head>
                <title>Account Dashboard | SuperWiFi ISP</title>
            </Head>

            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 p-6 hidden lg:flex flex-col">
                <div className="mb-10 px-2">
                    <h1 className="text-xl font-black italic tracking-tighter">Super<span className="text-indigo-500">WiFi</span></h1>
                </div>
                <nav className="flex-grow space-y-2">
                    <NavItem icon={<FiUser />} label="Overview" active />
                    <NavItem icon={<FiBarChart2 />} label="Usage" />
                    <NavItem icon={<FiCreditCard />} label="Billing" />
                    <NavItem icon={<FiSettings />} label="Settings" />
                </nav>
                <button className="flex items-center gap-3 p-3 text-white/40 hover:text-red-400 transition-colors mt-auto">
                    <FiLogOut /> Log Out
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-grow p-6 lg:p-12 overflow-y-auto">
                <header className="mb-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold">Welcome back, {user?.username || 'Customer'}!</h2>
                        <p className="text-white/40">Manage your connection and billing details.</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full ${usage.throttled ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'} text-xs font-bold uppercase tracking-widest flex items-center gap-2`}>
                        <div className={`w-2 h-2 rounded-full ${usage.throttled ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                        {usage.throttled ? 'Throttled (FUP)' : 'High Speed Active'}
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <StatCard icon={<FiClock className="text-indigo-400" />} label="Expiry Date" value={user?.access_expires_at ? new Date(user.access_expires_at).toLocaleDateString() : 'N/A'} />
                    <StatCard icon={<FiDatabase className="text-fuchsia-400" />} label="Current IP" value={user?.ip_address || '10.10.x.x'} />
                    <StatCard icon={<FiZap className={boostActive ? "text-yellow-400 animate-pulse" : "text-white/20"} />} label="Turbo Boost" value={boostActive ? '5h Remaining' : 'Inactive'} />
                    <StatCard icon={<FiActivity className="text-green-400" />} label="Data Used (Today)" value="12.4 GB" />
                </div>

                {/* Hero Boost Section */}
                <section className="mb-10">
                    <div className="relative overflow-hidden rounded-[2.5rem] p-10 bg-gradient-to-br from-indigo-600 to-fuchsia-700 shadow-2xl shadow-indigo-500/20 group">
                        <div className="absolute top-0 right-0 p-10 opacity-10 scale-150 rotate-12 group-hover:scale-[2] transition-transform duration-700">
                            <FiZap className="text-9xl" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="max-w-md">
                                <h3 className="text-4xl font-black tracking-tight mb-2">Need more speed?</h3>
                                <p className="text-white/80 text-lg">Activate a 5-hour **Turbo Boost** to bypass FUP limits and enjoy maximum bandwidth instantly.</p>
                            </div>
                            <button
                                onClick={handleInitiateBoost}
                                disabled={boostActive}
                                className={`px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 ${boostActive ? 'bg-white/20 text-white/40 cursor-not-allowed' : 'bg-white text-indigo-600 shadow-xl'}`}
                            >
                                <FiZap /> {boostActive ? 'Boost Active' : 'Activate Boost'}
                            </button>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Usage Summary */}
                    <section className={`${glass} rounded-3xl p-8`}>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><FiBarChart2 /> Consumption Trends</h3>
                        <div className="h-64 flex items-end gap-3 px-4">
                            {[40, 70, 45, 90, 65, 30, 85].map((h, i) => (
                                <div key={i} className="flex-grow bg-indigo-500/20 rounded-t-lg relative group transition-all hover:bg-indigo-500/40" style={{ height: `${h}%` }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-indigo-950 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{(h * 0.5).toFixed(1)}GB</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 text-[10px] text-white/20 uppercase font-black px-4">
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>
                    </section>

                    {/* Invoices */}
                    <section className={`${glass} rounded-3xl p-8`}>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><FiCreditCard /> Recent Invoices</h3>
                        <div className="space-y-4">
                            {invoices.length > 0 ? invoices.map(inv => (
                                <div key={inv.id} className={`flex items-center justify-between p-4 rounded-2xl ${cardBg}`}>
                                    <div>
                                        <p className="font-bold">{inv.number}</p>
                                        <p className="text-xs text-white/40">{new Date(inv.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">KES {inv.total}</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                            {inv.status}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center p-10 text-white/20 italic">No invoices found.</div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

const NavItem = ({ icon, label, active = false }: any) => (
    <button className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
        {icon} <span className="font-medium">{label}</span>
    </button>
);

const StatCard = ({ icon, label, value }: any) => (
    <div className={`${glass} rounded-[2rem] p-6 flex items-center gap-6`}>
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl border border-white/5">
            {icon}
        </div>
        <div>
            <p className="text-[10px] uppercase tracking-widest font-black text-white/30">{label}</p>
            <p className="text-xl font-bold">{value}</p>
        </div>
    </div>
);

export default CustomerDashboard;
