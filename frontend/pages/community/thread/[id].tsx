import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'
import {
    Zap,
    ChevronLeft,
    Share2,
    MessageSquare,
    TrendingUp,
    Shield
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Loader } from '@/components/ui/loader'

export default function ThreadView() {
    const router = useRouter()
    const { id } = router.query
    const [thread, setThread] = useState<any>(null)
    const [replyContent, setReplyContent] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) fetchThread()
    }, [id])

    const fetchThread = async () => {
        setLoading(true)
        try {
            const res = await apiClient.get(`/modules/community/threads/${id}`)
            setThread(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const postReply = async () => {
        if (!replyContent.trim()) return
        try {
            await apiClient.post(`/modules/community/threads/${id}/reply`, { content: replyContent })
            setReplyContent('')
            fetchThread() // Refresh to see new post
        } catch (err) {
            console.error(err)
        }
    }

    // ...
    if (!thread && !loading) return <div className="min-h-screen bg-black text-white p-20 text-center uppercase font-mono">Not Found</div>

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader text="Loading Post..." />
        </div>
    )

    return (
        <div className="min-h-screen bg-black text-slate-400 font-sans uppercase">
            <Head>
                <title>{thread.title} | Alien Net</title>
            </Head>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
                <nav className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.back()}>
                        <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-white" />
                        <span className="text-xs font-black tracking-widest text-slate-500 group-hover:text-white">Back</span>
                    </div>
                </nav>
            </header>

            <main className="pt-32 pb-20 max-w-4xl mx-auto px-6 space-y-8">
                {/* Thread OP */}
                <div className="p-8 border border-white/5 bg-[#0a0a0a] space-y-6 rounded-sm">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 bg-stardust-violet/10 text-stardust-violet text-[10px] font-black uppercase tracking-widest rounded-sm border border-stardust-violet/20">
                                    {thread.category}
                                </span>
                                <span className="text-[10px] font-mono text-slate-600">
                                    ID: {thread.id} // {formatDistanceToNow(new Date(thread.created_at))} ago
                                </span>
                            </div>
                            <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
                                {thread.title}
                            </h1>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-400">
                                <TrendingUp className="w-4 h-4" />
                            </Button>
                            <span className="text-[10px] font-black text-white">{thread.upvotes}</span>
                        </div>
                    </div>

                    <div className="prose prose-invert prose-sm max-w-none text-slate-300 font-mono text-xs leading-relaxed border-l-2 border-white/10 pl-4">
                        {thread.content}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3 text-slate-600" />
                            <span className="text-[10px] font-black text-slate-500">USER #{thread.author_id}</span>
                        </div>
                        <Button variant="ghost" className="text-[9px] font-black uppercase tracking-widest gap-2 hover:bg-white/5">
                            <Share2 className="w-3 h-3" /> Share
                        </Button>
                    </div>
                </div>

                {/* Replies */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-2">Replies ({thread.Posts?.length || 0})</h3>

                    {thread.Posts?.map((post: any) => (
                        <div key={post.id} className="p-6 border-l border-white/10 ml-4 hover:border-stardust-violet/30 transition-colors">
                            <div className="flex justify-between mb-2">
                                <span className="text-[10px] font-black text-stardust-violet">User #{post.author_id}</span>
                                <span className="text-[9px] font-mono text-slate-600">{formatDistanceToNow(new Date(post.created_at))} ago</span>
                            </div>
                            <p className="text-xs font-mono text-slate-400 leading-relaxed">{post.content}</p>
                        </div>
                    ))}
                </div>

                {/* Reply Box */}
                <div className="pt-8 border-t border-white/10">
                    <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="w-full bg-[#050505] border border-white/10 p-4 text-xs font-mono text-white focus:outline-none focus:border-stardust-violet/50 h-32 mb-4 rounded-sm"
                    />
                    <div className="flex justify-end">
                        <Button
                            onClick={postReply}
                            disabled={!replyContent.trim()}
                            className="bg-white text-black hover:bg-stardust-violet font-black text-[10px] uppercase tracking-widest px-8 rounded-sm"
                        >
                            Post Reply <MessageSquare className="w-3 h-3 ml-2" />
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
}
