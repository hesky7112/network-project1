import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'
import {
    Zap,
    Terminal,
    Shield,
    Activity,
    Globe,
    Cpu,
    GitBranch,
    Book,
    Code,
    FileText
} from 'lucide-react'
import { Loader } from '@/components/ui/loader'

// Icon map for dynamic icons
const ICON_MAP: any = { Zap, Terminal, Shield, Activity, Globe, Cpu, GitBranch, Code, FileText }

export default function Docs() {
    const router = useRouter()
    const [categories, setCategories] = useState([])
    const [activePage, setActivePage] = useState<any>(null)
    const [pageContent, setPageContent] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStructure()
    }, [])

    useEffect(() => {
        if (activePage) fetchPage(activePage)
    }, [activePage])

    const fetchStructure = async () => {
        try {
            const res = await apiClient.get('/modules/docs')
            const cats = res.data || []
            setCategories(cats)
            // Default select first page of first category
            if (cats.length > 0 && cats[0].pages?.length > 0) {
                setActivePage(cats[0].pages[0].id)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const fetchPage = async (id: string) => {
        setLoading(true)
        try {
            const res = await apiClient.get(`/modules/docs/${id}`)
            setPageContent(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Simple markdown renderer (since we lack dependency)
    const renderMarkdown = (text: string) => {
        if (!text) return null
        return text.split('\n').map((line, i) => {
            if (line.startsWith('# ')) return <h1 key={i} className="text-4xl font-black text-white uppercase tracking-tighter mb-8">{line.replace('# ', '')}</h1>
            if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-black text-alien-green uppercase tracking-widest mt-6 mb-4">{line.replace('## ', '')}</h2>
            if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-black text-blue-400 uppercase tracking-widest mt-4 mb-2">{line.replace('### ', '')}</h3>
            if (line.startsWith('**')) return <p key={i} className="text-slate-300 font-bold mb-2">{line.replaceAll('**', '')}</p>
            if (line.startsWith('- ')) return <li key={i} className="ml-4 text-slate-400 font-mono text-xs">{line.replace('- ', '')}</li>
            if (line.startsWith('```')) return null // Skip code fences for simple render
            if (line.startsWith('curl')) return <div key={i} className="bg-[#050505] p-3 border border-white/5 font-mono text-xs text-white mb-2">{line}</div>
            return <p key={i} className="text-slate-400 font-medium leading-relaxed mb-2 text-xs">{line}</p>
        })
    }

    return (
        <div className="min-h-screen bg-[#000000] text-slate-400 selection:bg-alien-green/30 selection:text-alien-green overflow-hidden font-sans uppercase">
            <Head>
                <title>Knowledge Relay | Alien Net Documentation</title>
            </Head>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#000000]/80 backdrop-blur-md">
                <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
                        <div className="w-8 h-8 bg-alien-green flex items-center justify-center shadow-[0_0_15px_rgba(0,255,65,0.3)]">
                            <Zap className="w-5 h-5 text-black" />
                        </div>
                        <span className="text-xl font-bold tracking-tighter text-white uppercase">Alien Net</span>
                        <span className="text-[10px] font-black text-slate-600 ml-2 tracking-[0.3em] hidden sm:inline"> // Docs</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => router.push('/dashboard')}
                            className="bg-alien-green text-black hover:bg-[#00dd38] text-[10px] font-black uppercase tracking-widest px-6 h-10"
                        >
                            Open Hub
                        </Button>
                    </div>
                </nav>
            </header>

            <div className="pt-[73px] flex h-screen">
                {/* Sidebar */}
                <aside className="w-80 border-r border-white/5 bg-[#050505] p-8 hidden lg:block overflow-y-auto">
                    <div className="space-y-10">
                        {categories.map((cat: any) => (
                            <div key={cat.id} className="space-y-4">
                                <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.6em]">{cat.title}</h3>
                                <div className="space-y-1">
                                    {cat.pages?.map((page: any) => {
                                        const Icon = ICON_MAP[page.icon] || FileText
                                        return (
                                            <button
                                                key={page.id}
                                                onClick={() => setActivePage(page.id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all group ${activePage === page.id ? 'text-alien-green bg-alien-green/5' : 'text-slate-500 hover:text-white'
                                                    }`}
                                            >
                                                <Icon className={`w-3.5 h-3.5 transition-colors ${activePage === page.id ? 'text-alien-green' : 'text-slate-700 group-hover:text-slate-500'}`} />
                                                {page.title}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Content */}
                <main className="flex-1 overflow-y-auto bg-[#000000] relative">
                    <div className="max-w-3xl mx-auto px-8 py-20 pb-40">
                        {loading ? (
                            <div className="flex justify-center h-full items-center">
                                <Loader text="Loading Docs..." />
                            </div>
                        ) : pageContent ? (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={pageContent.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-4"
                                >
                                    {renderMarkdown(pageContent.content)}
                                </motion.div>
                            </AnimatePresence>
                        ) : (
                            <div className="text-center py-20 text-xs font-mono text-slate-600">Select a page to view.</div>
                        )}

                        <div className="mt-20 pt-10 border-t border-white/5 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.4em] text-slate-800">
                            <div className="flex items-center gap-2">
                                <Book className="w-3 h-3" />
                                <span>Updated: 2026.01.27</span>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
