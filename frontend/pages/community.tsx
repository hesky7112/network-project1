import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'
import {
    Zap,
    Activity,
    TrendingUp,
    Award
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Loader } from '@/components/ui/loader'

export default function Community() {
    const router = useRouter()
    const [activeFilter, setActiveFilter] = useState('all')
    const [sort, setSort] = useState('recent')
    const [threads, setThreads] = useState([])
    const [leaderboard, setLeaderboard] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [activeFilter, sort])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch Threads
            const threadsRes = await apiClient.get(`/modules/community/threads?category=${activeFilter}&sort=${sort}`)
            setThreads(threadsRes.threads || [])

            // Fetch Leaderboard (only once ideally, but simple here)
            const lbRes = await apiClient.get('/modules/community/leaderboard?limit=5')
            setLeaderboard(lbRes || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-slate-400 font-sans uppercase">
            <Head>
                <title>Community Nexus | Alien Net</title>
            </Head>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
                <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
                        <div className="w-8 h-8 bg-gradient-to-br from-stardust-violet to-void-indigo flex items-center justify-center rounded-sm">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tighter text-white uppercase italic">Alien Net</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => router.push('/community/create')}
                            className="bg-stardust-violet text-black hover:bg-white text-[10px] font-black uppercase tracking-widest px-6 h-10 rounded-sm"
                        >
                            New Post
                        </Button>
                    </div>
                </nav>
            </header>

            <main className="pt-32 pb-20 max-w-7xl mx-auto px-6 grid lg:grid-cols-4 gap-12">
                {/* Sidebar Nav */}
                <aside className="space-y-12">
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Filters</h4>
                        <div className="space-y-4">
                            {/* Category Filter */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase">Category</label>
                                {['all', 'solutions', 'challenges', 'showcase'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveFilter(filter)}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === filter ? 'text-stardust-violet border-l-2 border-stardust-violet bg-stardust-violet/5' : 'text-slate-500 hover:text-white border-l-2 border-transparent'
                                            }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>

                            {/* Sort Filter */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase">Sort By</label>
                                {['recent', 'hot', 'best', 'top'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSort(s)}
                                        className={`w-full flex items-center justify-between px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${sort === s ? 'text-emerald-400 border-l-2 border-emerald-400 bg-emerald-400/5' : 'text-slate-500 hover:text-white border-l-2 border-transparent'
                                            }`}
                                    >
                                        {s === 'hot' ? '🔥 Hot' : s === 'best' ? '🧠 Best' : s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <section className="p-6 border border-white/5 bg-white/5 rounded-sm space-y-6">
                        <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Top Users</h4>
                        </div>
                        <div className="space-y-4">
                            {leaderboard.map((op: any, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-400">User #{op.user_id}</span>
                                    <span className="text-[10px] font-mono text-emerald-400">{op.reputation} REP</span>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" onClick={() => router.push('/community/leaderboard')} className="w-full text-[9px] font-black border border-white/10 h-10 uppercase tracking-widest hover:bg-white/5">View Leaderboard</Button>
                    </section>
                </aside>

                {/* Content Feed */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Community Feed</h2>
                            <p className="text-xs text-slate-500 font-bold tracking-tight uppercase">Latest discussions and updates.</p>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {loading ? (
                            <Loader text="Scanning Feed..." />
                        ) : threads.length === 0 ? (
                            <div className="text-center py-20">
                                <Activity className="h-12 w-12 text-slate-800 mx-auto mb-4" />
                                <p className="text-slate-500 text-xs font-bold">No threads found in this sector.</p>
                            </div>
                        ) : (
                            threads.map((thread: any) => (
                                <motion.div
                                    key={thread.id}
                                    whileHover={{ x: 4 }}
                                    onClick={() => router.push(`/community/thread/${thread.id}`)}
                                    className="p-6 border border-white/5 bg-[#0a0a0a] space-y-4 group transition-colors hover:border-stardust-violet/30 cursor-pointer rounded-sm"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${thread.category === 'solutions' ? 'bg-emerald-400' :
                                                thread.category === 'challenges' ? 'bg-rose-500' : 'bg-stardust-violet'
                                                }`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{thread.category}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-700">{formatDistanceToNow(new Date(thread.created_at))} ago</span>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none group-hover:text-stardust-violet transition-colors">
                                            {thread.title}
                                        </h3>
                                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed line-clamp-2">
                                            {thread.content}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex gap-2">
                                            {JSON.parse(thread.tags || "[]").map((tag: string) => (
                                                <span key={tag} className="px-2 py-0.5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-slate-600">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500">
                                                <TrendingUp className="w-3 h-3" />
                                                {thread.upvotes}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500">
                                                <Activity className="w-3 h-3" />
                                                {thread.views}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
