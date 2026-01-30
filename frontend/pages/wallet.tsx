import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'
import {
    Zap,
    Smartphone,
    RefreshCw,
    Plus,
    TrendingUp,
    TrendingDown
} from '@/components/icons'

// Interface for Transaction
interface Transaction {
    id: number;
    amount: number;
    type: string;
    description: string;
    reference: string;
    status: string;
    transaction_date: string;
}

// Interface for Wallet
interface WalletData {
    id: number;
    balance: number;
    currency: string;
}

export default function Wallet() {
    const router = useRouter()
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    // Top Up State
    const [amount, setAmount] = useState('');
    const [phone, setPhone] = useState('');
    const [processing, setProcessing] = useState(false);

    const formatPrice = (p: number) => `KES ${Math.abs(p).toLocaleString()}`

    const fetchData = async () => {
        setIsRefreshing(true);
        try {
            const [w, t] = await Promise.all([
                apiClient.getWallet(),
                apiClient.getWalletTransactions()
            ]);
            setWallet(w);
            setTransactions(t);
        } catch (error) {
            console.error("Wallet Fetch Error", error);
            toast.error("Failed to sync wallet with matrix");
        } finally {
            setIsRefreshing(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleTopUp = async () => {
        if (!amount || isNaN(Number(amount))) {
            toast.error("Invalid energy quantum (amount)");
            return;
        }
        setProcessing(true);
        try {
            await apiClient.topUpWallet(Number(amount), `MPESA-${Date.now()}`);
            toast.success("Credits injected successfully");
            setAmount('');
            fetchData();
        } catch (error) {
            toast.error("Injection failed");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-oled-black text-slate-400 font-sans uppercase">
            <Head>
                <title>Sovereign Wallet | Alien Net</title>
            </Head>

            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-oled-black/80 backdrop-blur-md">
                <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
                        <div className="w-8 h-8 bg-gradient-to-br from-cosmic-red to-orange-500 flex items-center justify-center shadow-[0_0_15px_rgba(255,77,0,0.3)]" style={{ borderRadius: '2px' }}>
                            <Zap className="w-5 h-5 text-black" />
                        </div>
                        <span className="text-xl font-bold tracking-tighter text-white uppercase italic">Alien Net</span>
                        <span className="text-[10px] font-black text-slate-600 ml-2 tracking-[0.3em] hidden sm:inline">// WALLET_RELAY</span>
                    </div>

                    <Button
                        onClick={() => router.push('/marketplace')}
                        className="bg-transparent border border-white/10 text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest px-6 h-10"
                        style={{ borderRadius: '1px' }}
                    >
                        Marketplace_Return
                    </Button>
                </nav>
            </header>

            <main className="pt-32 pb-40 max-w-5xl mx-auto px-6 space-y-12">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        {/* Balance Card */}
                        <div className="p-10 border border-white/5 bg-oled-black space-y-8 relative overflow-hidden" style={{ borderRadius: '2px' }}>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cosmic-red blur-[100px] opacity-10 pointer-events-none" />
                            <div className="flex justify-between items-start relative z-10">
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Liquid_Assets</h4>
                                    <div className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
                                        {wallet ? wallet.balance.toLocaleString() : '---'}.<span className="text-2xl text-slate-700">00</span>
                                        <span className="text-lg font-bold text-slate-500 ml-4">{wallet?.currency || 'KES'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={fetchData}
                                    className={`p-2 border border-white/10 hover:bg-white/5 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                                >
                                    <RefreshCw className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="h-14 bg-gradient-to-r from-cosmic-red to-orange-600 text-black hover:opacity-90 text-[10px] font-black uppercase tracking-[0.2em]" style={{ borderRadius: '1.5px' }}>
                                    <Plus className="w-4 h-4 mr-2" /> Top_Up_STK
                                </Button>
                                <Button variant="outline" className="h-14 border-white/10 text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-[0.2em]" style={{ borderRadius: '1.5px' }}>
                                    Withdraw_Vault
                                </Button>
                            </div>
                        </div>

                        {/* Transactions Log */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Transmission_Log (Transactions)</h4>
                            <div className="space-y-2">
                                {loading && <div className="text-center py-8 text-xs text-slate-600">Syncing Ledger...</div>}
                                {!loading && transactions.length === 0 && (
                                    <div className="text-center py-8 text-xs text-slate-600 italic">No transmissions recorded on the chain.</div>
                                )}
                                {transactions.map(trx => (
                                    <div key={trx.id} className="p-6 border border-white/5 bg-oled-black flex items-center justify-between group hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className={`w-10 h-10 flex items-center justify-center bg-white/5 ${trx.amount > 0 ? 'text-earth-green' : 'text-cosmic-red'}`}>
                                                {trx.amount > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[11px] font-black text-white uppercase tracking-widest">{trx.description}</div>
                                                <div className="text-[9px] font-mono text-slate-600">REF: {trx.reference} // {trx.type}</div>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <div className={`text-[14px] font-black tracking-tighter ${trx.amount > 0 ? 'text-earth-green' : 'text-white'}`}>
                                                {trx.amount > 0 ? '+' : ''}{formatPrice(trx.amount)}
                                            </div>
                                            <div className="text-[8px] font-mono text-slate-700">{new Date(trx.transaction_date).toLocaleString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-8">
                        <section className="p-8 border border-white/5 bg-oled-black space-y-6">
                            <div className="flex items-center gap-3">
                                <Smartphone className="w-4 h-4 text-stardust-violet" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Daraja_STK_Relay</h4>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">
                                Initiate immediate credit injection via Safaricom M-PESA. Transactions are verified on the Alien Net Kernel.
                            </p>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Phone_Number</label>
                                    <input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="254..."
                                        className="w-full bg-white/5 border border-white/10 h-12 px-4 text-[12px] font-mono text-white focus:outline-none focus:border-stardust-violet/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Credits_Amount</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-white/5 border border-white/10 h-12 px-4 text-[12px] font-mono text-white focus:outline-none focus:border-stardust-violet/30"
                                    />
                                </div>
                                <Button
                                    onClick={handleTopUp}
                                    disabled={processing}
                                    className="w-full h-12 bg-white/5 border border-white/10 text-white hover:bg-white/10 text-[9px] font-black uppercase tracking-widest disabled:opacity-50"
                                >
                                    {processing ? 'Handshake_In_Progress...' : 'Launch_Handshake'}
                                </Button>
                            </div>
                        </section>

                        <section className="p-8 border border-white/5 bg-oled-black space-y-4">
                            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Security_Notice</h4>
                            <p className="text-[9px] text-slate-500 font-bold leading-relaxed italic lowercase">
                                all transactions are logged on the immutable ledger. fraudulent transmissions result in immediate node revocation.
                            </p>
                        </section>
                    </aside>
                </div>
            </main>

            <div className="fixed inset-0 pointer-events-none z-0 opacity-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="absolute inset-0 bg-gradient-to-tr from-cosmic-red/5 via-void-indigo/5 to-transparent" />
            </div>
        </div>
    )
}
