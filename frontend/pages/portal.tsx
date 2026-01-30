import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'react-hot-toast';
import {
    Wifi,
    Ticket,
    Smartphone,
    Zap,
    CheckCircle,
    Loader2,
    Globe
} from 'lucide-react';
import { GlassWrapper, SoftLift, StaggerList, StaggerItem } from '@/components/ui/motion-container';
import { cn } from '@/lib/utils';

type PricingPackage = {
    id: number;
    name: string;
    type: string;
    price: number;
    duration: number;
    data_limit: number;
    download_speed: number;
    upload_speed: number;
    is_active: boolean;
};

export default function CaptivePortal() {
    const [activeTab, setActiveTab] = useState<'voucher' | 'bundles'>('bundles');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [voucherCode, setVoucherCode] = useState('');
    // Simulate MAC Address for browser testing
    const [macAddress, setMacAddress] = useState('00:00:00:00:00:00');
    const [selectedPackage, setSelectedPackage] = useState<PricingPackage | null>(null);
    const [processing, setProcessing] = useState(false);
    const [accessGranted, setAccessGranted] = useState(false);
    const [expiryTime, setExpiryTime] = useState<string | null>(null);
    const [monetizationEnabled, setMonetizationEnabled] = useState(false);

    useEffect(() => {
        // Generate a random mock MAC if not present
        if (typeof window !== 'undefined') {
            const storedMac = localStorage.getItem('mock_mac_address');
            if (storedMac) {
                setMacAddress(storedMac);
            } else {
                const newMac = Array(6).fill(0).map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':').toUpperCase();
                localStorage.setItem('mock_mac_address', newMac);
                setMacAddress(newMac);
            }
        }

        // Fetch monetization status
        apiClient.getSettings().then((settings: any) => {
            setMonetizationEnabled(settings.monetization_enabled === 'true' || settings.monetization_enabled === true);
        }).catch(() => {
            // Default to false if fail
            setMonetizationEnabled(false);
        });
    }, []);

    const { data: packages, isLoading: loadingPackages } = useQuery({
        queryKey: ['hotspot-packages'],
        queryFn: () => apiClient.get<PricingPackage[]>('/hotspot/packages')
    });

    const handleVoucherRedeem = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const res = await apiClient.post('/hotspot/vouchers/redeem', {
                code: voucherCode,
                mac_address: macAddress
            }) as any;
            toast.success("Access Granted");
            setAccessGranted(true);
            setExpiryTime(res.expiry);
        } catch (err) {
            toast.error("Invalid or Expired Voucher");
        } finally {
            setProcessing(false);
        }
    };

    const handlePayment = async () => {
        if (!selectedPackage || !phoneNumber) return;
        setProcessing(true);
        try {
            await apiClient.post('/hotspot/pay', {
                phone_number: phoneNumber,
                package_id: selectedPackage.id,
                mac_address: macAddress
            });
            toast.success("STK Push Sent. Check your phone.");
            // In a real app, we'd poll for payment status here
        } catch (err) {
            toast.error("Payment Initiation Failed");
        } finally {
            setProcessing(false);
        }
    };

    if (accessGranted) {
        return (
            <div className="min-h-screen bg-[#020202] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
                <div className="absolute inset-0 bg-cosmic-red/5 blur-[100px]" />
                <GlassWrapper className="bg-black/80 border-earth-green/30 p-12 max-w-md w-full text-center relative z-10 space-y-8">
                    <div className="w-24 h-24 mx-auto bg-earth-green/10 border border-earth-green/30 rounded-full flex items-center justify-center">
                        <Wifi className="h-12 w-12 text-earth-green animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter italic mb-2 text-earth-green">ACCESS_GRANTED</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Connection_Established</p>
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                        SESSION_EXPIRY: <br />
                        <span className="text-white text-base">{expiryTime ? new Date(expiryTime).toLocaleString() : 'Loading...'}</span>
                    </div>
                    <Button
                        onClick={() => window.location.href = 'https://google.com'}
                        className="w-full bg-earth-green text-black font-black uppercase tracking-widest h-14"
                    >
                        GO_TO_INTERNET
                    </Button>
                </GlassWrapper>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#020202] text-slate-300 font-sans relative overflow-x-hidden">
            <Head>
                <title>ALIEN_NET // PORTAL</title>
            </Head>
            <Toaster position="top-center" toastOptions={{
                style: { background: '#111', color: '#fff', border: '1px solid #333' }
            }} />

            {/* Background Effects */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cosmic-red/10 to-transparent pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 p-6 flex justify-between items-center border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cosmic-red/20 border border-cosmic-red/40 rounded-sm flex items-center justify-center">
                        <Globe className="h-6 w-6 text-cosmic-red" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white italic tracking-tighter leading-none">ALIEN_NET</h1>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Quantum_Link_Node</p>
                    </div>
                </div>
                <div className="text-[9px] font-mono text-slate-600 hidden sm:block">
                    MAC_ID: <span className="text-slate-400">{macAddress}</span>
                </div>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto p-4 sm:p-8 space-y-12">

                {/* Hero Section */}
                <div className="text-center space-y-4 py-8">
                    <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter italic">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">Initialize_Context</span>
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest max-w-lg mx-auto">
                        Select your preferred uplink protocol. Secure, high-velocity connectivity powered by neural networks.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white/5 p-1 rounded-sm border border-white/10 flex">
                        <button
                            onClick={() => setActiveTab('bundles')}
                            className={cn(
                                "px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all flex items-center gap-2",
                                activeTab === 'bundles' ? "bg-cosmic-red text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <Zap className="h-4 w-4" />
                            DATA_BUNDLES
                        </button>
                        <button
                            onClick={() => setActiveTab('voucher')}
                            className={cn(
                                "px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all flex items-center gap-2",
                                activeTab === 'voucher' ? "bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <Ticket className="h-4 w-4" />
                            VOUCHER_LOGIN
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                {activeTab === 'bundles' ? (
                    <div className="space-y-8">
                        {loadingPackages ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="h-10 w-10 text-cosmic-red animate-spin" />
                            </div>
                        ) : !monetizationEnabled ? (
                            <div className="text-center py-20 border border-dashed border-cosmic-red/30 bg-cosmic-red/5" style={{ borderRadius: '4px' }}>
                                <Loader2 className="h-10 w-10 text-cosmic-red mx-auto mb-4 animate-pulse" />
                                <h3 className="text-xs font-black text-cosmic-red uppercase tracking-widest">PAYMENT_UPLINK_OFFLINE</h3>
                                <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">
                                    System awaiting administrator initialization
                                </p>
                            </div>
                        ) : (
                            <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {packages?.filter(p => p.is_active && p.type === 'hotspot').map((pkg) => (
                                    <StaggerItem key={pkg.id}>
                                        <SoftLift>
                                            <GlassWrapper
                                                className={cn(
                                                    "p-6 cursor-pointer border-white/10 hover:border-cosmic-red/50 transition-all group relative overflow-hidden",
                                                    selectedPackage?.id === pkg.id ? "bg-cosmic-red/10 border-cosmic-red" : "bg-[#0a0a0c]"
                                                )}
                                                onClick={() => setSelectedPackage(pkg)}
                                            >
                                                {selectedPackage?.id === pkg.id && <div className="absolute top-0 right-0 w-20 h-[1px] bg-cosmic-red shadow-[0_0_15px_#ef4444]" />}

                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-black text-white italic">{pkg.name}</h3>
                                                        <span className="text-[9px] font-bold text-cosmic-red uppercase tracking-widest">{pkg.duration} MINS ACCESS</span>
                                                    </div>
                                                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-cosmic-red/20 transition-colors">
                                                        <Wifi className="h-5 w-5 text-slate-400 group-hover:text-white" />
                                                    </div>
                                                </div>

                                                <div className="space-y-2 mb-6">
                                                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                                                        <span>SPEED_DL</span>
                                                        <span className="text-white">{(pkg.download_speed / 1000).toFixed(1)} MBPS</span>
                                                    </div>
                                                    <div className="w-full h-[2px] bg-white/5 overflow-hidden">
                                                        <div className="h-full bg-slate-600 w-3/4 group-hover:bg-cosmic-red group-hover:w-full transition-all duration-700" />
                                                    </div>
                                                </div>

                                                <div className="flex items-end justify-between">
                                                    <div className="text-2xl font-black text-white">
                                                        <span className="text-xs text-slate-500 font-normal mr-1">KES</span>
                                                        {pkg.price}
                                                    </div>
                                                    {selectedPackage?.id === pkg.id ? (
                                                        <CheckCircle className="h-6 w-6 text-cosmic-red" />
                                                    ) : (
                                                        <div className="w-6 h-6 border border-white/20 rounded-full" />
                                                    )}
                                                </div>
                                            </GlassWrapper>
                                        </SoftLift>
                                    </StaggerItem>
                                ))}
                            </StaggerList>
                        )}

                        {selectedPackage && (
                            <GlassWrapper className="bg-black/80 border-t border-white/10 p-8 fixed bottom-0 left-0 w-full backdrop-blur-xl z-50 animate-in slide-in-from-bottom-10">
                                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-6 justify-between">
                                    <div className="text-center sm:text-left">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">SELECTED_PROTOCOL</div>
                                        <div className="text-xl font-black text-white italic">{selectedPackage.name} <span className="text-cosmic-red">//</span> KES {selectedPackage.price}</div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="relative flex-1 sm:w-64">
                                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <input
                                                value={phoneNumber}
                                                onChange={e => setPhoneNumber(e.target.value)}
                                                placeholder="2547..."
                                                className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-4 text-white font-mono text-sm focus:outline-none focus:border-cosmic-red transition-all rounded-sm"
                                            />
                                        </div>
                                        <Button
                                            onClick={handlePayment}
                                            disabled={processing || !phoneNumber}
                                            className="bg-cosmic-red hover:bg-red-600 text-white font-black uppercase tracking-widest h-14 px-8 rounded-sm shadow-[0_0_20px_rgba(239,68,68,0.3)] min-w-[160px]"
                                        >
                                            {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'INITIATE_LINK'}
                                        </Button>
                                    </div>
                                </div>
                            </GlassWrapper>
                        )}
                    </div>
                ) : (
                    <div className="max-w-md mx-auto">
                        <GlassWrapper className="bg-[#0a0a0c] border-white/10 p-8 space-y-8">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mb-6">
                                    <Ticket className="h-8 w-8 text-blue-500" />
                                </div>
                                <h3 className="text-2xl font-black text-white italic mb-2">VOUCHER_ENTRY</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enter your single-use access key below</p>
                            </div>

                            <form onSubmit={handleVoucherRedeem} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Access_Code</label>
                                    <input
                                        value={voucherCode}
                                        onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                                        placeholder="XXXX-XXXX"
                                        className="w-full bg-white/5 border border-white/10 p-4 text-center text-2xl font-mono font-black text-white focus:outline-none focus:border-blue-500 transition-all rounded-sm uppercase tracking-widest placeholder:text-white/10"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={processing || voucherCode.length < 3}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest h-14 rounded-sm shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                >
                                    {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'ESTABLISH_UPLINK'}
                                </Button>
                            </form>
                        </GlassWrapper>
                    </div>
                )}

            </main>
        </div>
    );
}
