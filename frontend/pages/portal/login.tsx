import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPhone, FiWifi, FiShield, FiCheckCircle, FiLoader, FiZap, FiBriefcase, FiGlobe, FiCpu, FiTag } from 'react-icons/fi';
import { ContributionWidget } from '@/components/portal/widgets/ContributionWidget';
import { AttendanceWidget } from '@/components/portal/widgets/AttendanceWidget';
import { CanteenWidget } from '@/components/portal/widgets/CanteenWidget';

const glass = "bg-white/10 backdrop-blur-xl border border-white/20";
const primaryGradient = "bg-gradient-to-br from-indigo-700 via-violet-800 to-fuchsia-900";

const PortalLogin = () => {
    const router = useRouter();
    const { mac, target } = router.query;

    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [voucherCode, setVoucherCode] = useState('');
    const [selectedPackage, setSelectedPackage] = useState<any>(null);
    const [activeTier, setActiveTier] = useState('hotspot');
    const [step, setStep] = useState('select');
    const [error, setError] = useState('');
    const [aura, setAura] = useState<any>(null);

    const tiers = [
        { id: 'hotspot', name: 'Hotspot', icon: <FiWifi /> },
        { id: 'pppoe', name: 'Fixed/PPPoE', icon: <FiGlobe /> },
        { id: 'qos', name: 'QoS Custom', icon: <FiCpu /> },
        { id: 'business', name: 'Business', icon: <FiBriefcase /> },
        { id: 'enterprise', name: 'Enterprise', icon: <FiZap /> },
    ];

    useEffect(() => {
        fetchPackages(activeTier);
        fetchPortalInfo();
    }, [activeTier]);

    const fetchPortalInfo = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/portal/info`);
            const data = await res.json();
            setAura(data);
        } catch (err) {
            console.error("Portal Info Error", err);
        }
    };

    const fetchPackages = async (type: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/hotspot/packages?type=${type}`);
            const data = await res.json();
            setPackages(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleInitiatePayment = async () => {
        if (!phoneNumber || !selectedPackage) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/hotspot/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone_number: phoneNumber,
                    package_id: selectedPackage.id,
                    mac_address: mac || '00:00:00:00:00:00'
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Payment initiation failed');

            setStep('status');
            startPolling(data.checkout_request_id);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleRedeemVoucher = async () => {
        if (!voucherCode) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/hotspot/voucher/redeem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: voucherCode,
                    mac_address: mac || '00:00:00:00:00:00'
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Voucher redemption failed');

            setStep('success');
            setTimeout(() => {
                if (target) window.location.href = target as string;
            }, 3000);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const startPolling = (id: string) => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/hotspot/status/${id}`);
                const data = await res.json();
                if (data.status === 'completed') {
                    clearInterval(interval);
                    setStep('success');
                    setTimeout(() => {
                        if (target) window.location.href = target as string;
                    }, 3000);
                } else if (data.status === 'failed') {
                    clearInterval(interval);
                    setError('Payment was not successful. Please try again.');
                    setStep('select');
                }
            } catch (err) {
                console.error(err);
            }
        }, 3000);
    };

    return (
        <div className={`min-h-screen ${primaryGradient} text-white flex flex-col items-center justify-center p-4 font-sans`}>
            <Head>
                <title>{aura?.display_name || 'Premium Service Portal'} | SuperWiFi</title>
            </Head>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`w-full max-w-lg ${glass} rounded-[2rem] p-6 md:p-10 shadow-3xl relative overflow-hidden`}
            >
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-fuchsia-500/20 blur-[100px] rounded-full" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full" />

                <div className="relative z-10">
                    <header className="text-center mb-6">
                        <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic">{aura?.display_name || 'SuperWiFi'}</h1>
                        <p className="text-white/50 text-xs md:text-sm">{aura?.portal_config?.welcome_msg || 'Select Your High-Perfomance Connection Service'}</p>
                    </header>

                    {/* Aura-Specific Widgets */}
                    <AnimatePresence>
                        {aura && aura.type !== 'default' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8 space-y-4"
                            >
                                {aura.widgets?.includes('offering_box') && <ContributionWidget />}
                                {aura.widgets?.includes('student_tap') && <AttendanceWidget />}
                                {aura.widgets?.includes('canteen_pay') && <CanteenWidget />}

                                {aura.type !== 'security' && (
                                    <div className="relative flex items-center">
                                        <div className="flex-grow border-t border-white/10"></div>
                                        <span className="mx-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Standard Network Services</span>
                                        <div className="flex-grow border-t border-white/10"></div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {step === 'select' && (
                            <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {/* Tiers Tabs */}
                                <div className="flex overflow-x-auto pb-4 mb-6 gap-2 no-scrollbar">
                                    {tiers.map(tier => (
                                        <button
                                            key={tier.id}
                                            onClick={() => setActiveTier(tier.id)}
                                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium ${activeTier === tier.id
                                                ? 'bg-white text-indigo-900 shadow-xl'
                                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                }`}
                                        >
                                            {tier.icon} {tier.name}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 gap-3 mb-6">
                                    {loading ? (
                                        <div className="flex justify-center p-10"><FiLoader className="animate-spin text-3xl text-fuchsia-400" /></div>
                                    ) : packages.length > 0 ? (
                                        packages.map(pkg => (
                                            <button
                                                key={pkg.id}
                                                onClick={() => setSelectedPackage(pkg)}
                                                className={`group flex items-center justify-between p-4 rounded-2xl transition-all border ${selectedPackage?.id === pkg.id
                                                    ? 'bg-white border-white scale-[1.01] shadow-2xl'
                                                    : 'bg-white/5 border-white/10 hover:border-white/30'
                                                    }`}
                                            >
                                                <div className="text-left">
                                                    <p className={`font-bold ${selectedPackage?.id === pkg.id ? 'text-indigo-900' : 'text-white'}`}>{pkg.name}</p>
                                                    <p className={`text-[10px] md:text-xs ${selectedPackage?.id === pkg.id ? 'text-indigo-900/60' : 'text-white/40'}`}>{pkg.description}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-xl font-black ${selectedPackage?.id === pkg.id ? 'text-indigo-600' : 'text-white'}`}>KES {pkg.price}</p>
                                                    {pkg.download_speed > 0 && <p className={`text-[9px] uppercase font-bold tracking-widest ${selectedPackage?.id === pkg.id ? 'text-indigo-400' : 'text-fuchsia-400'}`}>{pkg.download_speed / 1024} Mbps</p>}
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center p-10 text-white/30 italic">No packages available for this tier</div>
                                    )}
                                </div>

                                {/* Entry Fields */}
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-fuchsia-400 transition-colors" />
                                        <input
                                            type="tel"
                                            placeholder="M-Pesa Number (e.g. 0712...)"
                                            value={phoneNumber}
                                            onChange={(e) => { setPhoneNumber(e.target.value); setVoucherCode(''); }}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-fuchsia-500/50 outline-none transition-all placeholder:text-white/20"
                                        />
                                    </div>

                                    <div className="relative flex items-center">
                                        <div className="flex-grow border-t border-white/10"></div>
                                        <span className="mx-4 text-[10px] uppercase tracking-widest text-white/20 font-bold">OR</span>
                                        <div className="flex-grow border-t border-white/10"></div>
                                    </div>

                                    <div className="relative group">
                                        <FiTag className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-fuchsia-400 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Voucher Access Code"
                                            value={voucherCode}
                                            onChange={(e) => { setVoucherCode(e.target.value); setPhoneNumber(''); }}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-fuchsia-500/50 outline-none transition-all placeholder:text-white/20 uppercase"
                                        />
                                    </div>
                                </div>

                                {error && <p className="text-red-400 text-xs mt-4 text-center font-medium bg-red-400/10 py-2 rounded-lg">{error}</p>}

                                {voucherCode ? (
                                    <button
                                        disabled={!voucherCode || loading}
                                        onClick={handleRedeemVoucher}
                                        className="w-full mt-6 py-4 rounded-2xl bg-fuchsia-500 text-white font-black uppercase tracking-widest hover:bg-fuchsia-400 transition-all shadow-lg shadow-fuchsia-900/40"
                                    >
                                        {loading ? <FiLoader className="animate-spin inline mr-2" /> : "Redeem Voucher"}
                                    </button>
                                ) : (
                                    <button
                                        disabled={!phoneNumber || !selectedPackage || loading}
                                        onClick={handleInitiatePayment}
                                        className="w-full mt-6 py-4 rounded-2xl bg-white text-indigo-900 font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-900/40"
                                    >
                                        {loading ? <FiLoader className="animate-spin inline mr-2" /> : "Purchase Selected Plan"}
                                    </button>
                                )}
                            </motion.div>
                        )}

                        {step === 'status' && (
                            <motion.div key="status" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-10">
                                <div className="w-24 h-24 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin mx-auto mb-6 flex items-center justify-center">
                                    <FiPhone className="text-3xl text-white animate-pulse" />
                                </div>
                                <h2 className="text-2xl font-bold">Awaiting Payment</h2>
                                <p className="text-white/60 mt-2">Please check your M-Pesa phone for the PIN prompt.</p>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-10">
                                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/40">
                                    <FiCheckCircle className="text-4xl text-white" />
                                </div>
                                <h2 className="text-2xl font-bold">Successfully Connected!</h2>
                                <p className="text-white/60 mt-2">Your high-speed session is active.</p>
                                <p className="text-fuchsia-400 text-[10px] mt-8 uppercase font-bold tracking-widest">Redirecting you now...</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <div className="mt-8 flex items-center gap-6 text-white/30 text-[10px] uppercase font-bold tracking-widest">
                <span className="flex items-center gap-1"><FiShield /> {aura?.type === 'security' ? 'Zero-Trust Protocol' : 'Secure Banking Grade'}</span>
                <span className="flex items-center gap-1"><FiZap /> {aura?.type === 'home' ? 'Home Shield Active' : 'Ultra-Low Latency Fiber Layer'}</span>
            </div>
        </div>
    );
};

export default PortalLogin;
