import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import {
  Zap, Shield, Activity, Terminal, Globe,
  LineChart, Lock, FileText, ShieldCheck
} from '@/components/icons'

// --- Live Widget Components ---

const TopologyWidget = () => (
  <div className="bg-[#050505] border border-white/5 p-4 h-full relative" style={{ borderRadius: '2px' }}>
    <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-4">Network_Topology_Map</div>
    <div className="relative h-24 w-full">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-10 h-10 border border-void-indigo/30 bg-void-indigo/5 flex items-center justify-center rotate-45">
          <Globe className="w-5 h-5 text-void-indigo -rotate-45" />
        </div>
        {/* Connecting Lines */}
        <div className="absolute top-1/2 left-full w-12 h-[1px] bg-gradient-to-r from-stardust-violet/50 to-transparent" />
        <div className="absolute top-1/2 right-full w-12 h-[1px] bg-gradient-to-l from-stardust-violet/50 to-transparent" />
        <div className="absolute bottom-full left-1/2 w-[1px] h-12 bg-gradient-to-t from-cosmic-red/50 to-transparent" />
      </div>
      <div className="absolute top-0 right-4 w-6 h-6 border border-white/10 bg-white/5" style={{ borderRadius: '1.5px' }} />
      <div className="absolute bottom-0 left-4 w-6 h-6 border border-white/10 bg-white/5" style={{ borderRadius: '1.5px' }} />
    </div>
    <div className="absolute bottom-4 right-4 text-[9px] font-mono text-emerald-500 tracking-tighter">ROUTING_ACTIVE</div>
  </div>
)

const DataScienceWidget = () => (
  <div className="bg-[#050505] border border-white/5 p-4 space-y-3 h-full overflow-hidden" style={{ borderRadius: '2px' }}>
    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-500">
      <div className="flex items-center gap-2">
        <Activity className="w-3 h-3 text-stardust-violet" />
        <span>SuperCompute_Engine // Polars_Core</span>
      </div>
      <span className="text-stardust-violet font-mono">⚡ 12.4M rows/s</span>
    </div>
    <div className="grid grid-cols-4 gap-1 h-20">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            backgroundColor: [
              'rgba(138, 43, 226, 0.05)',
              'rgba(138, 43, 226, 0.2)',
              'rgba(138, 43, 226, 0.05)'
            ]
          }}
          transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
          className="border border-white/5 flex items-center justify-center font-mono text-[7px]"
        >
          {Math.floor(Math.random() * 999)}
        </motion.div>
      ))}
    </div>
    <div className="flex justify-between items-center text-[10px] font-black italic">
      <span className="text-white uppercase tracking-tighter">Neural_Aggregator</span>
      <span className="text-stardust-violet underline tracking-[0.2em]">SYNCHRONIZED</span>
    </div>
  </div>
)

const InsightOscillator = () => (
  <div className="bg-[#050505] border border-white/5 p-4 space-y-4 h-full relative" style={{ borderRadius: '2px' }}>
    <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">Predictive_Matrix // Anomaly_Flux</div>
    <div className="h-24 flex items-center justify-center">
      <svg viewBox="0 0 200 60" className="w-full h-full opacity-60">
        <motion.path
          d="M 0 30 Q 50 0 100 30 T 200 30"
          fill="none"
          stroke="rgba(255, 77, 0, 0.5)"
          strokeWidth="1"
          animate={{
            d: [
              "M 0 30 Q 50 10 100 30 T 200 30",
              "M 0 30 Q 50 50 100 30 T 200 30",
              "M 0 30 Q 50 10 100 30 T 200 30"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.path
          d="M 0 30 Q 50 50 100 30 T 200 30"
          fill="none"
          stroke="rgba(0, 184, 212, 0.5)"
          strokeWidth="1"
          animate={{
            d: [
              "M 0 30 Q 50 40 100 30 T 200 30",
              "M 0 30 Q 50 10 100 30 T 200 30",
              "M 0 30 Q 50 40 100 30 T 200 30"
            ]
          }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        />
      </svg>
    </div>
    <div className="absolute bottom-4 left-4 flex gap-3">
      <div className="text-[10px] font-black">
        <div className="text-slate-600 text-[8px] uppercase">Conf_Score</div>
        <div className="text-white tracking-widest">0.992</div>
      </div>
      <div className="text-[10px] font-black">
        <div className="text-slate-600 text-[8px] uppercase">Trend_Dir</div>
        <div className="text-alien-green tracking-widest">BULLISH</div>
      </div>
    </div>
  </div>
)

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000000]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="h-10 w-10 border-2 border-alien-green/20 border-t-alien-green mx-auto mb-4"
            style={{ borderRadius: '2px' }}
          />
          <p className="text-alien-green font-mono tracking-widest text-[10px] uppercase">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-oled-black text-slate-400 selection:bg-cosmic-red/30 selection:text-cosmic-red overflow-x-hidden font-sans">
      <Head>
        <title>Alien Net | Professional Network Solutions</title>
        <meta name="description" content="Enterprise-grade network management. Advanced AI Diagnostics, Network Mapping, and Traffic Inspection for administrators." />
      </Head>

      {/* Technical Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-cosmic-red/5 via-void-indigo/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-oled-black to-oled-black" />
      </div>

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-oled-black/80 backdrop-blur-md">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
            <div className="w-8 h-8 bg-gradient-to-br from-cosmic-red to-orange-500 flex items-center justify-center shadow-[0_0_15px_rgba(255,77,0,0.3)]" style={{ borderRadius: '2px' }}>
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white uppercase italic">Alien Net</span>
          </div>

          <a href="#features" className="hover:text-cosmic-red transition-colors">Key_Features</a>
          <a href="/marketplace" className="hover:text-stardust-violet transition-colors font-black text-stardust-violet">Marketplace</a>
          <a href="/community" className="hover:text-earth-green transition-colors">Community</a>
          <a href="/pricing" className="hover:text-void-indigo transition-colors">Pricing</a>
          <a href="/docs" className="hover:text-slate-400 transition-colors">Documentation</a>
          <a href="/tech" className="hover:text-slate-400 transition-colors">Tech_Stack</a>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/login')}
              className="text-[11px] font-black uppercase tracking-widest hover:text-white"
            >
              Login
            </Button>
            <Button
              onClick={() => router.push('/register')}
              className="bg-alien-green text-black hover:bg-[#00dd38] text-[11px] font-black uppercase tracking-widest px-8 h-10"
              style={{ borderRadius: '1px' }}
            >
              Get Started
            </Button>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto pt-48 pb-32 px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 border-l-2 border-earth-green bg-earth-green/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.4em] text-earth-green mt-4"
            >
              <Activity className="w-3 h-3" />
              Professional Management System // Localized
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl lg:text-7xl font-black leading-[0.85] tracking-tighter text-white uppercase"
            >
              Alien Net <br />
              <span className="bg-gradient-to-r from-stardust-violet via-cosmic-red to-stardust-violet bg-clip-text text-transparent italic">SuperCompute Hub.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg text-slate-500 max-w-xl leading-relaxed font-bold uppercase tracking-tight"
            >
              Enterprise-grade data science & network intelligence. Deploy ultra-high performance analytics engines powered by Polars, Apache Arrow, and Neural Workflows.
            </motion.p>

            <div className="flex flex-col sm:flex-row gap-6">
              <Button
                size="lg"
                onClick={() => router.push('/studio/dashboard')}
                className="bg-gradient-to-r from-stardust-violet to-void-indigo text-white hover:opacity-90 h-16 px-12 font-black text-xs uppercase tracking-[0.2em]"
                style={{ borderRadius: '1.5px' }}
              >
                Launch Studio
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/10 hover:bg-white/5 h-16 px-12 text-xs font-black uppercase tracking-[0.2em]"
                style={{ borderRadius: '1.5px' }}
              >
                Analytics Demo
              </Button>
            </div>
          </div>

          {/* Premium UI Mockup Rendering */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative lg:ml-10"
          >
            <div className="absolute -inset-20 bg-stardust-violet/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="relative bg-[#050505] border border-white/10 p-2 shadow-2xl" style={{ borderRadius: '3px' }}>
              {/* Simulated Dashboard Header */}
              <div className="bg-[#000000] border-b border-white/5 px-6 py-4 flex justify-between items-center mb-1">
                <div className="flex gap-2 text-[9px] font-black uppercase tracking-widest">
                  <span className="text-white">Forge:</span>
                  <span className="text-stardust-violet underline italic">SUPERCOMPUTE_ENGINE_v4</span>
                </div>
                <div className="flex gap-4">
                  <div className="h-1.5 w-1.5 bg-stardust-violet rounded-full shadow-[0_0_8px_rgba(138,43,226,0.5)]" />
                  <div className="h-1.5 w-1.5 bg-earth-green rounded-full shadow-[0_0_8px_rgba(45,90,39,0.5)]" />
                </div>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-2 gap-1 bg-[#000000] p-4 min-h-[450px]">
                <div className="col-span-2">
                  <DataScienceWidget />
                </div>
                <div>
                  <InsightOscillator />
                </div>
                <div>
                  <TopologyWidget />
                </div>
                <div className="col-span-2 bg-[#050505] border border-white/5 p-4 relative overflow-hidden h-32">
                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2">Neural_Insight_Engine</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-600 italic">Predictive_Power</span>
                      <span className="text-stardust-violet">Super_Charged</span>
                    </div>
                    <div className="text-xs text-white opacity-90 font-mono tracking-tighter">
                      Ingesting 800k events/sec via Go-Ingest. <br />
                      <span className="text-earth-green">Status: Processing_Optimized_via_Apache_Arrow</span>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-24 h-full bg-stardust-violet/10 blur-2xl" />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* NEW: SuperCompute & Data Science Showcase - Prominent Advertisement */}
        <section className="relative py-40 overflow-hidden bg-[#020202] border-y border-white/5">
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-20">
            <div className="w-[800px] h-[800px] bg-stardust-violet/10 rounded-full blur-[160px] animate-pulse" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-stardust-violet/10 border border-stardust-violet/20 text-stardust-violet text-[10px] font-black uppercase tracking-[0.5em]">
                <Zap className="w-4 h-4" /> The_Super_Engine
              </div>
              <h2 className="text-6xl lg:text-8xl font-black text-white uppercase tracking-tighter italic leading-[0.85]">
                SuperCompute <br />
                <span className="underline decoration-stardust-violet underline-offset-8">Intelligence.</span>
              </h2>
              <p className="text-lg text-slate-500 font-bold leading-relaxed max-w-xl italic uppercase tracking-tight">
                Stop waiting for slow queries. Our backend leverages Polars, the fastest DataFrame engine in the world, coupled with Go's high-concurrency ingestion. Transform billions of rows into insights in milliseconds.
              </p>

              <div className="grid grid-cols-2 gap-6 pt-6">
                {[
                  { label: 'Data_Throughput', val: '40GB/s', sub: 'Polars Native' },
                  { label: 'Neural_Memory', val: '80% Less', sub: 'Apache Arrow' },
                ].map((stat, i) => (
                  <div key={i} className="p-6 border border-white/5 bg-[#08080a] space-y-2">
                    <div className="text-[10px] font-black uppercase text-slate-600 tracking-widest">{stat.label}</div>
                    <div className="text-3xl font-black text-white italic">{stat.val}</div>
                    <div className="text-[9px] font-mono text-stardust-violet">{stat.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-10 bg-stardust-violet/5 blur-[80px]" />
              <div className="relative border border-white/5 bg-[#050505] p-1 shadow-2xl overflow-hidden" style={{ borderRadius: '2px' }}>
                <div className="bg-[#000000] border-b border-white/10 px-6 py-4 flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">POLARS_STREAM_#SUPER_COMPUTE</span>
                  <div className="flex gap-2">
                    <span className="text-[8px] font-black text-stardust-violet">PARQUET_INGEST_READY</span>
                    <div className="h-1.5 w-1.5 bg-stardust-violet rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="p-10 space-y-6 bg-[#020203]">
                  {/* Premium Creative Visual: Data Forge Visualization */}
                  <div className="flex items-end justify-between gap-1 h-32">
                    {[...Array(32)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          height: [
                            `${20 + Math.random() * 40}%`,
                            `${40 + Math.random() * 60}%`,
                            `${10 + Math.random() * 30}%`
                          ]
                        }}
                        transition={{ repeat: Infinity, duration: 1 + Math.random(), delay: i * 0.02 }}
                        className="flex-1 bg-gradient-to-t from-stardust-violet/40 to-stardust-violet border-t border-stardust-violet/50"
                      />
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2">
                      <span>Neural_Prediction_Matrix</span>
                      <span className="text-stardust-violet">Confidence: 0.998</span>
                    </div>
                    <div className="text-xs text-slate-400 font-bold italic">
                      "Predictive analysis identifies high-value network flows and protects against churn patterns using sub-ms anomaly detection."
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Detail Matrix */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-40">
          <div className="grid lg:grid-cols-4 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-[12px] font-black uppercase tracking-[0.5em] text-cosmic-red">Key_Feature_Set</h2>
              <p className="text-5xl font-black text-white uppercase tracking-tighter italic leading-none">Reliable <br /> Management.</p>
              <p className="text-slate-500 font-medium leading-relaxed max-w-md italic">Our architecture is built on raw performance. No middleware. No latency. Just absolute precision across your entire network.</p>
            </div>

            {[
              {
                icon: Zap,
                title: 'Neural_SNMP',
                desc: 'Real-time trap processing with intelligent MIB parsing for instant fault detection.',
                color: 'text-earth-green'
              },
              {
                icon: Terminal,
                title: 'Secure_Access',
                desc: 'High-concurrency secure access management capable of handling thousands of sessions reliably.',
                color: 'text-void-indigo'
              },
              {
                icon: Activity,
                title: 'Deep_Flow_Analytics',
                desc: 'Aggregated NetFlow/IPFIX analysis for precise application-layer traffic inspection.',
                color: 'text-stardust-violet'
              },
              {
                icon: LineChart,
                title: 'AI_Diagnostics',
                desc: 'Custom diagnostic engine identifying performance patterns and system risks in real-time.',
                color: 'text-cosmic-red'
              },
              {
                icon: Shield,
                title: 'Enterprise_Security',
                desc: 'Industry-standard encrypted tunneling and automated access management for complete protection.',
                color: 'text-cosmic-red'
              },
              {
                icon: FileText,
                title: 'Compliance_Guard',
                desc: 'Automated configuration auditing with drift detection against Golden Master baselines.',
                color: 'text-orange-500'
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 border border-white/5 bg-[#050505] space-y-4 group hover:border-white/10 transition-all"
                style={{ borderRadius: '2px' }}
              >
                <f.icon className={`h-8 w-8 ${f.color} mb-4`} />
                <h3 className="text-lg font-black uppercase tracking-tighter text-white">{f.title}</h3>
                <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section >

        {/* Dashboard Preview Section (Advertise UI) */}
        < section id="showcase" className="bg-white/5 py-40 overflow-hidden" >
          <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
            <div className="space-y-4">
              <h2 className="text-[10px] font-black uppercase text-blue-400 tracking-[0.6em]">System_Interface</h2>
              <p className="text-6xl font-black text-white uppercase tracking-tighter italic">Unified_Dashboard.</p>
              <p className="text-slate-500 max-w-2xl mx-auto font-medium">A glimpse into the management center. Our UI is designed for data-dense environments where speed and clarity are paramount.</p>
            </div>

            <div className="relative group cursor-zoom-in">
              <div className="absolute -inset-20 bg-blue-500/5 blur-[120px]" />
              <div className="relative border border-white/10 bg-[#000000] p-1 shadow-2xl overflow-hidden" style={{ borderRadius: '4px' }}>
                <div className="bg-[#050505] border-b border-white/10 flex justify-between px-6 py-3">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-3 h-3 bg-red-500/20 border border-red-500/40" style={{ borderRadius: '1.5px' }} />
                    <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/40" style={{ borderRadius: '1.5px' }} />
                    <div className="w-3 h-3 bg-green-500/20 border border-green-500/40" style={{ borderRadius: '1.5px' }} />
                  </div>
                  <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest italic font-black">X-Terminal.exe // Live Metrics Output</span>
                </div>
                {/* Simulated Full Dashboard Component Rendering */}
                <div className="p-8 grid grid-cols-12 gap-6 min-h-[600px] bg-[#020204]">
                  <div className="col-span-12 lg:col-span-8 space-y-6">
                    <div className="h-64 border border-white/5 bg-[#08080a] p-6 relative">
                      <div className="flex justify-between items-center mb-10">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Global_Traffic_Dist</span>
                        <div className="flex gap-2 text-[10px] font-black text-earth-green">
                          <span className="opacity-50 tracking-tighter">LIVE_STATUS:</span>
                          <span>OPERATIONAL</span>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-40 overflow-hidden">
                        <svg viewBox="0 0 1000 100" className="w-full h-full preserve-3d">
                          <motion.path
                            d="M0 50 Q 250 10 500 50 T 1000 50"
                            fill="none"
                            stroke="#2D5A27"
                            strokeWidth="2"
                            animate={{
                              d: [
                                "M0 50 Q 250 80 500 50 T 1000 50",
                                "M0 50 Q 250 20 500 50 T 1000 50",
                                "M0 50 Q 250 80 500 50 T 1000 50"
                              ]
                            }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            style={{ filter: 'drop-shadow(0 0 8px #00ff41)' }}
                          />
                          <motion.path
                            d="M0 60 Q 250 90 500 60 T 1000 60"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="1"
                            animate={{
                              d: [
                                "M0 60 Q 250 30 500 60 T 1000 60",
                                "M0 60 Q 250 90 500 60 T 1000 60",
                                "M0 60 Q 250 30 500 60 T 1000 60"
                              ]
                            }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            style={{ opacity: 0.3 }}
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 h-64">
                      <div className="bg-[#08080a] border border-white/5 p-6 space-y-4">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Threat_Matrix</span>
                        <div className="space-y-3">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-white">Active_Attacks</span>
                            <span className="text-red-500">0</span>
                          </div>
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-white">Filtered_Packets</span>
                            <span className="text-alien-green">1.2M</span>
                          </div>
                          <div className="h-1 bg-white/5 w-full mt-4">
                            <div className="h-full bg-alien-green w-[85%]" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#08080a] border border-white/5 p-6 relative overflow-hidden">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">System_Health</span>
                        <div className="mt-8 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black text-white italic">99.9%</span>
                          <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest mt-1">Enterprise_Stability</span>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-alien-green/5 blur-3xl" />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-4 bg-[#08080a] border border-white/5 p-6 space-y-6">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Command_Log</span>
                    <div className="space-y-4 font-mono text-[10px] leading-tight">
                      {[
                        { time: '18:21:04', cmd: 'INIT_SYSTEM_PROBE', status: 'OK' },
                        { time: '18:21:12', cmd: 'SYNC_UPSTREAM_LINK', status: 'PENDING' },
                        { time: '18:21:15', cmd: 'APPLY_EBPF_FILTER', status: 'OK' },
                        { time: '18:21:42', cmd: 'AI_DIAGNOSTICS_INIT', status: 'OK' },
                        { time: '18:22:01', cmd: 'GENERATE_NETWORK_MAP', status: 'OK' },
                      ].map((l, i) => (
                        <div key={i} className="flex gap-4 border-b border-white/5 pb-2">
                          <span className="text-slate-600">{l.time}</span>
                          <span className="text-white flex-1">{l.cmd}</span>
                          <span className={l.status === 'OK' ? 'text-earth-green' : 'text-orange-500'}>[{l.status}]</span>
                        </div>
                      ))}
                      <div className="animate-pulse underline ml-1">█</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section >

        {/* Deep Dive: Logic_Topology -> Neural_SNMP */}
        < section id="topology" className="py-40 bg-[#000000] overflow-hidden" >
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute -inset-10 bg-alien-green/5 blur-[100px]" />
              <div className="relative border border-white/5 bg-[#050505] p-8 space-y-8" style={{ borderRadius: '2px' }}>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>SNMP_Trap_Receiver</span>
                  <span className="text-earth-green">MIB_Translation: ACTIVE</span>
                </div>
                <div className="relative h-80 w-full border border-white/5 bg-oled-black overflow-hidden p-4 font-mono text-[9px]">
                  <div className="space-y-3">
                    {[
                      { time: '10:42:01', oid: 'linkDown (1.3.6.1.6.3.1.1.5.3)', msg: 'Interface eth0 state changed to down', severity: 'CRITICAL', color: 'text-cosmic-red' },
                      { time: '10:42:05', oid: 'coldStart (1.3.6.1.6.3.1.1.5.1)', msg: 'Device restart detected', severity: 'WARNING', color: 'text-orange-500' },
                      { time: '10:42:05', oid: 'linkUp (1.3.6.1.6.3.1.1.5.4)', msg: 'Interface eth0 state changed to up', severity: 'INFO', color: 'text-earth-green' },
                    ].map((trap, i) => (
                      <div key={i} className="border-b border-white/5 pb-2">
                        <div className="flex justify-between text-slate-500 mb-1">
                          <span>{trap.time}</span>
                          <span className={trap.color}>{trap.severity}</span>
                        </div>
                        <div className="text-slate-300">{trap.oid}</div>
                        <div className="text-slate-500 italic">{trap.msg}</div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-4 right-4 text-[9px] font-mono text-slate-500">PROCESSING_TRAPS: 124/sec</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-oled-black p-4 space-y-1">
                    <span className="text-[8px] font-black uppercase text-slate-600">MIB_Database</span>
                    <p className="text-xl font-black text-white">42,000 OIDs</p>
                  </div>
                  <div className="bg-oled-black p-4 space-y-1">
                    <span className="text-[8px] font-black uppercase text-slate-600">Rule_Engine</span>
                    <p className="text-xl font-black text-earth-green">Auto_Triage</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-8">
              <div className="inline-flex items-center gap-2 text-alien-green text-[10px] font-black uppercase tracking-[0.4em]">
                <Zap className="h-4 w-4" /> Neural_SNMP
              </div>
              <h2 className="text-5xl lg:text-7xl font-black text-white uppercase tracking-tighter italic leading-tight">Intelligent <br /> <span className="text-earth-green">Fault Detection.</span></h2>
              <p className="text-lg text-slate-500 font-bold leading-relaxed max-w-xl italic">
                Forget raw, cryptic OIDs. Our Neural SNMP engine instantly translates traps into human-readable alerts using a vast MIB registry. An integrated Rule Engine automatically triages severity, so you only see what matters.
              </p>
              <ul className="space-y-4 pt-4">
                {[
                  'Real-time Trap Translation',
                  'Custom Severity Rules',
                  'Instant Alert Correlation'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-white">
                    <div className="h-1 w-4 bg-earth-green" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section >

        {/* Deep Dive: Infrastructure_SSH (Keep as is, but maybe brief tweaks if needed, skipping for now) */}

        {/* Deep Dive: Deep_Packet_Pulse -> NetFlow_Intelligence */}
        <section id="deep-packet" className="py-40 bg-[#000000] overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute -inset-10 bg-indigo-500/5 blur-[100px]" />
              <div className="relative border border-white/5 bg-[#050505] p-8 space-y-6" style={{ borderRadius: '2px' }}>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>NetFlow_Aggregator_v5</span>
                  <span className="text-stardust-violet">Flow_Ingest: ACTIVE</span>
                </div>
                <div className="space-y-2 font-mono text-[10px]">
                  {[
                    { type: 'APP_RECOGNITION', port: '443', action: 'IDENTIFIED: HTTPS_Browsing', color: 'text-blue-500' },
                    { type: 'APP_RECOGNITION', port: '22', action: 'IDENTIFIED: SSH_Transfer', color: 'text-purple-500' },
                    { type: 'FLOW_STATS', port: 'Aggregated', action: 'Saved to TrafficStats DB', color: 'text-alien-green' },
                  ].map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4 border-b border-white/5 pb-2"
                    >
                      <span className={p.color}>[{p.type}]</span>
                      <span className="text-white ml-auto">[{p.action}]</span>
                    </motion.div>
                  ))}
                </div>
                {/* Visualizer */}
                <div className="relative h-24 w-full bg-[#000000] border border-white/5 flex items-end p-2 gap-1">
                  {/* ... keep visualizer animation ... */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-black uppercase text-white tracking-[0.2em] bg-oled-black/80 px-4 py-1 border border-white/10">AGGREGATING_FLOWS</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-8">
              <div className="inline-flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">
                <Activity className="h-4 w-4" /> Deep_Flow_Intelligence
              </div>
              <h2 className="text-5xl lg:text-7xl font-black text-white uppercase tracking-tighter italic leading-tight">Application <br /> Visibility.</h2>
              <p className="text-lg text-slate-500 font-bold leading-relaxed max-w-xl">
                Raw packets are noise. Our NetFlow aggregator buckets traffic by Application, IP, and Time Window. Identify top bandwidth consumers instantly—whether it's legitimate business traffic or a rogue data exfiltration.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-white font-black uppercase text-xs mb-2">Smart Aggregation</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-bold">Reduces DB load by 90% while retaining critical granular stats.</p>
                </div>
                <div>
                  <h4 className="text-white font-black uppercase text-xs mb-2">App Recognition</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-bold">Automatically maps ports to recognizable applications (HTTP, DNS, SSH).</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Dive: Neural_AIOps */}
        <section id="aiops" className="py-40 bg-[#050505] border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 text-stardust-violet text-[10px] font-black uppercase tracking-[0.4em]">
                <LineChart className="h-4 w-4" /> AI_Diagnostics Engine
              </div>
              <h2 className="text-5xl lg:text-7xl font-black text-white uppercase tracking-tighter italic leading-tight">Predictive <br /> <span className="text-stardust-violet">Diagnostic.</span></h2>
              <p className="text-lg text-slate-500 font-bold leading-relaxed max-w-xl">
                Leverage custom machine learning models to identify patterns and predict performance issues before they happen. Our diagnostic engine transforms raw data into actionable intelligence for network administrators.
              </p>
              <div className="space-y-4">
                <div className="p-4 border border-white/5 bg-[#000000] relative overflow-hidden group">
                  <div className="flex justify-between items-center relative z-10">
                    <span className="text-[10px] font-black uppercase text-slate-500">Churn_Prediction_Confidence</span>
                    <span className="text-stardust-violet font-black">98.4%</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-stardust-violet/10 to-transparent w-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-4 border border-white/5 bg-oled-black relative overflow-hidden group">
                  <div className="flex justify-between items-center relative z-10">
                    <span className="text-[10px] font-black uppercase text-slate-500">Anomaly_Detection_Latency</span>
                    <span className="text-white font-black">&lt;15ms</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-10 bg-purple-500/5 blur-[100px]" />
              <div className="relative border border-white/5 bg-[#000000] p-8 space-y-8" style={{ borderRadius: '2px' }}>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>Neural_Processor_L7</span>
                  <span className="text-stardust-violet">Learning_Matrix: STABLE</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(16)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.2, 0.8, 0.2] }}
                      transition={{ repeat: Infinity, duration: 2, delay: i * 0.1 }}
                      className="aspect-square bg-stardust-violet/20 border border-stardust-violet/10"
                    />
                  ))}
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-slate-600">INPUT_FLOW: AGGREGATED_TELEMETRY</span>
                    <span className="text-white">PROCESSING...</span>
                  </div>
                  <div className="bg-oled-black p-3 border border-white/5">
                    <p className="text-[9px] font-mono text-stardust-violet">DEVIATION_DETECTED: SEGMENT_04_BANDWIDTH</p>
                    <p className="text-[9px] font-mono text-slate-500 mt-1">Confidence: 0.992 | Root_Cause: Link_Congestion</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Dive: Cryptic_Security */}
        <section id="security" className="py-40 bg-[#000000] overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute -inset-10 bg-cosmic-red/5 blur-[100px]" />
              <div className="relative border border-white/5 bg-oled-black p-10 space-y-8" style={{ borderRadius: '2px' }}>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>Security_Vault_v2</span>
                  <span className="text-cosmic-red">AES-256-GCM: ACTIVE</span>
                </div>
                <div className="space-y-6">
                  {[
                    { label: 'Network_Isolation', status: 'TOTAL', icon: Shield },
                    { label: 'RBAC_Enforcement', status: 'STRICT', icon: Lock },
                    { label: 'Identity_Validation', status: 'VERIFIED', icon: Activity },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-6 p-4 border border-white/5 bg-oled-black">
                      <s.icon className="h-6 w-6 text-cosmic-red" />
                      <div className="flex-1">
                        <div className="text-[10px] font-black uppercase text-slate-500">{s.label}</div>
                        <div className="text-sm font-black text-white">{s.status}</div>
                      </div>
                      <div className="h-2 w-2 bg-cosmic-red rounded-full shadow-[0_0_8px_rgba(255,77,0,0.5)]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-8">
              <div className="inline-flex items-center gap-2 text-cosmic-red text-[10px] font-black uppercase tracking-[0.4em]">
                <Shield className="h-4 w-4" /> Advanced_Security Vault
              </div>
              <h2 className="text-5xl lg:text-7xl font-black text-white uppercase tracking-tighter italic leading-tight">Total <br /> <span className="text-cosmic-red">Protection.</span></h2>
              <p className="text-lg text-slate-500 font-bold leading-relaxed max-w-xl">
                Deploy infrastructure with total confidence. Our security stack integrates industry-standard encryption with automated access management, ensuring your network is protected for critical data and operations.
              </p>
              <div className="flex gap-4">
                <span className="px-4 py-2 bg-cosmic-red/10 border border-cosmic-red/20 text-cosmic-red text-[9px] font-black uppercase tracking-widest">Zero_Trust</span>
                <span className="px-4 py-2 bg-cosmic-red/10 border border-cosmic-red/20 text-cosmic-red text-[9px] font-black uppercase tracking-widest">End_to_End_Enc</span>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Dive: Compliance_Guard (Replaces GIS) */}
        <section id="compliance" className="py-40 bg-[#050505] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 text-orange-400 text-[10px] font-black uppercase tracking-[0.4em]">
                <FileText className="h-4 w-4" /> Compliance_Guard
              </div>
              <h2 className="text-5xl lg:text-7xl font-black text-white uppercase tracking-tighter italic leading-tight">Zero-Drift <br /> <span className="text-orange-400">Policy.</span></h2>
              <p className="text-lg text-slate-500 font-bold leading-relaxed max-w-xl">
                Configuration drift is the #1 cause of outages. Our system automatically audits every device against your Golden Master configurations. Detect unauthorized changes, visualize diffs, and rollback instantly.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 border border-white/5 bg-oled-black">
                  <p className="text-2xl font-black text-white">100%</p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Audit_Coverage</p>
                </div>
                <div className="p-4 border border-white/5 bg-oled-black">
                  <p className="text-2xl font-black text-orange-400">AUTO</p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Drift_Detection</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-10 bg-yellow-500/5 blur-[100px]" />
              <div className="relative border border-white/5 bg-[#000000] p-1 shadow-2xl overflow-hidden" style={{ borderRadius: '2px' }}>
                <div className="bg-oled-black border-b border-white/5 px-6 py-4 flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">DIFF_VIEWER_v1.0 // AUDIT_LOG_#8492</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-[8px] font-black text-cosmic-red uppercase">DRIFT_DETECTED</span>
                    <div className="h-1.5 w-1.5 bg-cosmic-red rounded-full animate-pulse shadow-[0_0_8px_rgba(255,77,0,0.5)]" />
                  </div>
                </div>
                <div className="relative h-80 bg-[#020202] p-6 font-mono text-[10px] overflow-hidden">
                  <div className="space-y-1">
                    <div className="text-slate-500 mb-4 pb-2 border-b border-white/5">Comparing: Running_Config vs Golden_Master_v4</div>
                    <div className="flex gap-4 opacity-50"><span className="text-slate-600">102</span> <span className="text-slate-400">interface GigabitEthernet0/1</span></div>
                    <div className="flex gap-4 opacity-50"><span className="text-slate-600">103</span> <span className="text-slate-400"> description Uplink_Core</span></div>

                    {/* Diff Visualization */}
                    <div className="bg-red-500/10 border-l-2 border-red-500 flex gap-4 mt-2">
                      <span className="text-red-500 pl-2">-</span>
                      <span className="text-red-400">ip address 10.0.0.1 255.255.255.0</span>
                    </div>
                    <div className="bg-green-500/10 border-l-2 border-green-500 flex gap-4">
                      <span className="text-green-500 pl-2">+</span>
                      <span className="text-green-400">ip address 192.168.1.1 255.255.255.0</span>
                    </div>

                    <div className="flex gap-4 opacity-50 mt-2"><span className="text-slate-600">105</span> <span className="text-slate-400"> no shutdown</span></div>
                    <div className="flex gap-4 opacity-50"><span className="text-slate-600">106</span> <span className="text-slate-400"> negotiation auto</span></div>
                  </div>

                  <div className="absolute bottom-6 right-6">
                    <div className="bg-gradient-to-r from-earth-green to-emerald-700 text-black px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_10px_rgba(45,90,39,0.3)]" style={{ borderRadius: '1px' }}>
                      <ShieldCheck className="w-3 h-3" /> Restore_Golden
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA with high contrast */}
        <section className="max-w-7xl mx-auto px-6 py-48 text-center bg-gradient-to-b from-transparent to-oled-black">
          <div className="space-y-12">
            <h2 className="text-7xl lg:text-9xl font-black text-white uppercase tracking-tighter italic leading-none">Complete <br /> <span className="bg-gradient-to-r from-cosmic-red to-orange-500 bg-clip-text text-transparent">Control.</span></h2>
            <p className="text-slate-500 text-lg font-bold max-w-2xl mx-auto uppercase tracking-tight">The network environment waits for no one. Claim complete control over your infrastructure today.</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Button
                size="lg"
                onClick={() => router.push('/register')}
                className="bg-gradient-to-r from-cosmic-red to-orange-600 text-black hover:opacity-90 h-20 px-16 font-black text-sm uppercase tracking-[0.3em]"
                style={{ borderRadius: '1px' }}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/10 hover:bg-white/5 h-20 px-16 text-sm font-black uppercase tracking-[0.3em]"
                style={{ borderRadius: '1.5px' }}
              >
                System Consulting
              </Button>
            </div>
          </div>
        </section>

        {/* Tech Footer */}
        <footer className="border-t border-white/5 pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-20">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cosmic-red to-orange-500 flex items-center justify-center -rotate-12 shadow-[0_0_15px_rgba(255,77,0,0.3)]" style={{ borderRadius: '1.5px' }}>
                  <Zap className="w-5 h-5 text-black" />
                </div>
                <span className="text-xl font-bold tracking-tighter text-white uppercase italic">Alien Net</span>
              </div>
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] leading-relaxed">
                Advanced networking infrastructure for enterprise administrators. Scaled for speed, deployed today.
              </p>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">System</h4>
              <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <li><a href="#" className="hover:text-cosmic-red transition-colors">Direct_Link</a></li>
                <li><a href="/pricing" className="hover:text-cosmic-red transition-colors font-black text-cosmic-red">Pricing_Citadel</a></li>
                <li><a href="#topology" className="hover:text-earth-green transition-colors">Neural_SNMP</a></li>
                <li><a href="#deep-packet" className="hover:text-stardust-violet transition-colors">Flow_Intelligence</a></li>
                <li><a href="#compliance" className="hover:text-orange-500 transition-colors">Compliance_Guard</a></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Resources</h4>
              <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <li><a href="/docs" className="hover:text-alien-green transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-alien-green transition-colors">Security_Core</a></li>
                <li><a href="#" className="hover:text-alien-green transition-colors">Management_Portal</a></li>
                <li><a href="#" className="hover:text-alien-green transition-colors">Developer_API</a></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Terminal</h4>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 bg-alien-green rounded-full shadow-[0_0_10px_#00ff41]" />
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Global_Status: Online</span>
              </div>
              <p className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">Network_Status: 100% Stability</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-32 pt-10 border-t border-white/5 flex justify-between items-center">
            <span className="text-[9px] font-mono text-slate-800 uppercase tracking-[0.6em]">© 2026 ALIEN_NET_CORE</span>
            <div className="flex gap-8 text-slate-800 grayscale opacity-30">
              <Globe className="w-5 h-5" />
              <Terminal className="w-5 h-5" />
              <Lock className="w-5 h-5" />
            </div>
          </div>
        </footer>
      </main >
    </div >
  )
}
