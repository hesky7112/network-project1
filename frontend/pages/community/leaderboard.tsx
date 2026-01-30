import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'
import { Zap, ChevronLeft, Crown, Medal, Trophy } from 'lucide-react'
import { Loader } from '@/components/ui/loader'

export default function Leaderboard() {
    const router = useRouter()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLeaderboard()
    }, [])

    const fetchLeaderboard = async () => {
        try {
            const res = await apiClient.get('/modules/community/leaderboard?limit=50')
            setUsers(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-slate-400 font-sans uppercase">
            <Head>
                <title>Top Operators | Alien Net</title>
            </Head>

            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
                <nav className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/community')}>
                        <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-white" />
                        <span className="text-xs font-black tracking-widest text-slate-500 group-hover:text-white">Back</span>
                    </div>
                    <div className="text-xs font-black tracking-widest text-white">Leaderboard</div>
                </nav>
            </header>

            <main className="pt-32 pb-20 max-w-4xl mx-auto px-6 space-y-8">
                <div className="text-center space-y-2 mb-12">
                    <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Top Users</h1>
                    <p className="text-xs text-slate-500 font-bold tracking-tight uppercase">Community Contributors</p>
                </div>

                {loading ? (
                    <Loader text="Ranking Users..." />
                ) : (
                    <div className="grid gap-2">
                        {users.map((user: any, i) => (
                            <div key={user.user_id} className={`flex items-center p-4 border border-white/5 bg-[#0a0a0a] rounded-sm ${i < 3 ? 'border-stardust-violet/30 bg-stardust-violet/5' : ''}`}>
                                <div className="w-12 text-center font-black text-lg text-slate-500">
                                    {i + 1}
                                </div>
                                <div className="flex-1 flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5`}>
                                        {i === 0 ? <Crown className="w-5 h-5 text-yellow-400" /> :
                                            i === 1 ? <Medal className="w-5 h-5 text-slate-300" /> :
                                                i === 2 ? <Medal className="w-5 h-5 text-amber-600" /> :
                                                    <Zap className="w-4 h-4 text-slate-700" />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-white">User #{user.user_id}</div>
                                        <div className="text-[9px] font-mono text-slate-500">LEVEL {user.level} // {JSON.parse(user.badges || "[]").length} BADGES</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-emerald-400 font-mono">{user.reputation}</div>
                                    <div className="text-[8px] font-black text-slate-600 tracking-widest">POINTS</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
