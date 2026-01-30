import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '@/components/layout'
import { apiClient } from '@/lib/api'
import {
    TrendingUp,
    DollarSign,
    Activity,
    Users,
    Wallet,
    ArrowUpRight,
    PieChart
} from 'lucide-react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts'
import { BlurReveal, SoftLift, StaggerList, StaggerItem, CountUp } from '@/components/ui/motion-container';

interface FinancialOverview {
    total_revenue: number
    mrr: number
    marketplace_gtv: number
    wallet_liquidity: number
    active_subscribers: number
    arpu: number
}

export default function Finance() {
    const [timeRange, setTimeRange] = useState('30d')

    const { data: overview } = useQuery<FinancialOverview>({
        queryKey: ['financial-overview'],
        queryFn: async () => {
            const { data } = await apiClient.get('/treasury/overview')
            return data
        }
    })

    // Mock trend data for visualization (to be replaced with real endpoints later)
    const revenueData = [
        { name: 'Jan', revenue: 4000, market: 2400 },
        { name: 'Feb', revenue: 3000, market: 1398 },
        { name: 'Mar', revenue: 2000, market: 9800 },
        { name: 'Apr', revenue: 2780, market: 3908 },
        { name: 'May', revenue: 1890, market: 4800 },
        { name: 'Jun', revenue: 2390, market: 3800 },
    ]

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0
        }).format(value || 0)
    }

    return (
        <Layout title="Alien Treasury">
            <BlurReveal className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Treasury <span className="text-earth-green">Command</span></h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Global Financial Operating Picture</p>
                    </div>
                    <div className="flex items-center gap-2 bg-oled-black p-1 rounded-sm border border-white/10">
                        {['7d', '30d', '90d', '1y'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1.5 text-[10px] font-black rounded uppercase tracking-widest transition-all ${timeRange === range
                                    ? 'bg-stardust-violet text-black shadow-sm'
                                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StaggerItem>
                        <SoftLift className="bg-oled-black p-6 border border-white/5 relative overflow-hidden group" style={{ borderRadius: '2px' }}>
                            <div className="absolute top-0 right-0 w-24 h-24 bg-earth-green blur-[60px] opacity-10 pointer-events-none" />
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2 text-earth-green">
                                    <DollarSign className="w-5 h-5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Total Revenue</span>
                                </div>
                                <div className="text-2xl font-black text-white mb-1">
                                    <CountUp value={overview?.total_revenue || 0} formatter={formatCurrency} />
                                </div>
                                <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-earth-green">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    +12.5% vs last month
                                </div>
                            </div>
                        </SoftLift>
                    </StaggerItem>

                    <StaggerItem>
                        <SoftLift className="bg-oled-black p-6 border border-white/5 relative overflow-hidden group" style={{ borderRadius: '2px' }}>
                            <div className="absolute top-0 right-0 w-24 h-24 bg-stardust-violet blur-[60px] opacity-10 pointer-events-none" />
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2 text-stardust-violet">
                                    <Activity className="w-5 h-5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Active MRR</span>
                                </div>
                                <div className="text-2xl font-black text-white mb-1">
                                    <CountUp value={overview?.mrr || 0} formatter={formatCurrency} />
                                </div>
                                <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-stardust-violet">
                                    <Users className="w-3 h-3 mr-1" />
                                    <CountUp value={overview?.active_subscribers || 0} /> Subscribers
                                </div>
                            </div>
                        </SoftLift>
                    </StaggerItem>

                    <StaggerItem>
                        <SoftLift className="bg-oled-black p-6 border border-white/5 relative overflow-hidden group" style={{ borderRadius: '2px' }}>
                            <div className="absolute top-0 right-0 w-24 h-24 bg-void-indigo blur-[60px] opacity-10 pointer-events-none" />
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2 text-void-indigo">
                                    <Wallet className="w-5 h-5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Marketplace Vol</span>
                                </div>
                                <div className="text-2xl font-black text-white mb-1">
                                    <CountUp value={overview?.marketplace_gtv || 0} formatter={formatCurrency} />
                                </div>
                                <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-void-indigo">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                    High Velocity
                                </div>
                            </div>
                        </SoftLift>
                    </StaggerItem>

                    <StaggerItem>
                        <SoftLift className="bg-oled-black p-6 border border-white/5 relative overflow-hidden group" style={{ borderRadius: '2px' }}>
                            <div className="absolute top-0 right-0 w-24 h-24 bg-cosmic-red blur-[60px] opacity-10 pointer-events-none" />
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2 text-cosmic-red">
                                    <PieChart className="w-5 h-5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Avg Rev / User</span>
                                </div>
                                <div className="text-2xl font-black text-white mb-1">
                                    <CountUp value={overview?.arpu || 0} formatter={formatCurrency} />
                                </div>
                                <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-cosmic-red">
                                    Optimal Level
                                </div>
                            </div>
                        </SoftLift>
                    </StaggerItem>
                </StaggerList>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Revenue Chart */}
                    <div className="lg:col-span-2 bg-oled-black p-6 border border-white/5" style={{ borderRadius: '2px' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-widest italic">Revenue_Velocity_v1.0</h3>
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-stardust-violet" />
                                    ISP_Stream
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-void-indigo" />
                                    Market_Flow
                                </div>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8A2BE2" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#8A2BE2" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorMkt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4B0082" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4B0082" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        labelStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#8A2BE2" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                                    <Area type="monotone" dataKey="market" stroke="#4B0082" strokeWidth={2} fillOpacity={1} fill="url(#colorMkt)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Revenue Distribution */}
                    <div className="bg-oled-black p-6 border border-white/5" style={{ borderRadius: '2px' }}>
                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest italic mb-6">Revenue_Mix_Dist</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Subscription', value: 65, color: '#8A2BE2' },
                                    { name: 'Hardware', value: 25, color: '#4B0082' },
                                    { name: 'Services', value: 10, color: '#FF4D00' },
                                ]} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#ffffff05" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#cbd5e1' }} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                        {[
                                            { name: 'Subscription', value: 65, color: '#8A2BE2' },
                                            { name: 'Hardware', value: 25, color: '#4B0082' },
                                            { name: 'Services', value: 10, color: '#FF4D00' },
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions Table Stub */}
                <div className="bg-oled-black border border-white/5 overflow-hidden" style={{ borderRadius: '2px' }}>
                    <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest italic">Recent_Global_Transmissions</h3>
                        <button className="text-[10px] font-black text-stardust-violet hover:underline uppercase tracking-widest">Connect_Ledger_API</button>
                    </div>
                    <div className="p-12 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] italic">
                        Transaction_log stream requires WebSocket_Relay active...
                    </div>
                </div>
            </BlurReveal>
        </Layout>
    )
}
