import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'
import { ChevronLeft, Send, Zap } from 'lucide-react'

export default function CreateThread() {
    const router = useRouter()
    const [form, setForm] = useState({ title: '', category: 'general', content: '', tags: '' })
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!form.title || !form.content) return
        setSubmitting(true)
        try {
            const payload = {
                ...form,
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
            }
            await apiClient.post('/modules/community/threads', payload)
            router.push('/community')
        } catch (err) {
            console.error(err)
            alert("Failed to transmit.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-slate-400 font-sans uppercase">
            <Head><title>New Transmission | Alien Net</title></Head>

            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
                <nav className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.back()}>
                        <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-white" />
                        <span className="text-xs font-black tracking-widest text-slate-500 group-hover:text-white">Cancel</span>
                    </div>
                </nav>
            </header>

            <main className="pt-32 pb-20 max-w-3xl mx-auto px-6 space-y-6">
                <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">New Post</h1>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Subject</label>
                        <input
                            className="w-full bg-[#0a0a0a] border border-white/10 h-12 px-4 text-sm font-bold text-white focus:outline-none focus:border-stardust-violet/50 rounded-sm"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="What's this about?"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Category</label>
                            <select
                                className="w-full bg-[#0a0a0a] border border-white/10 h-12 px-4 text-xs font-bold text-white focus:outline-none focus:border-stardust-violet/50 rounded-sm"
                                value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}
                            >
                                <option value="general">General</option>
                                <option value="solutions">Solution</option>
                                <option value="challenges">Challenge / Bug</option>
                                <option value="showcase">Showcase</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Tags (Comma Sep)</label>
                            <input
                                className="w-full bg-[#0a0a0a] border border-white/10 h-12 px-4 text-xs font-bold text-white focus:outline-none focus:border-stardust-violet/50 rounded-sm"
                                value={form.tags}
                                onChange={e => setForm({ ...form, tags: e.target.value })}
                                placeholder="e.g. help, bug, feature"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Message</label>
                        <textarea
                            className="w-full bg-[#0a0a0a] border border-white/10 p-4 text-xs font-mono text-white focus:outline-none focus:border-stardust-violet/50 h-64 rounded-sm leading-relaxed"
                            value={form.content}
                            onChange={e => setForm({ ...form, content: e.target.value })}
                            placeholder="Write your post here..."
                        />
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full bg-stardust-violet text-black hover:bg-white font-black text-xs uppercase tracking-[0.2em] h-14 rounded-sm mt-4"
                    >
                        {submitting ? 'Posting...' : 'Create Post'} <Send className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </main>
        </div>
    )
}
