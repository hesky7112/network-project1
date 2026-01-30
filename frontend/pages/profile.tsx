import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Button } from '@/components/ui/button'
import {
  Zap,
  Users,
  Shield,
  GitBranch,
  Activity,
  Lock,
} from '@/components/icons'
import { useAuth } from '@/hooks/use-auth'

export default function Profile() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('Identity_Matrix')

  return (
    <div className="min-h-screen bg-[#000000] text-slate-400 font-sans uppercase">
      <Head>
        <title>Sovereign Profile | Alien Net</title>
      </Head>

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#000000]/80 backdrop-blur-md">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
            <div className="w-8 h-8 bg-alien-green flex items-center justify-center shadow-[0_0_15px_rgba(0,255,65,0.3)]" style={{ borderRadius: '2px' }}>
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white uppercase italic">Alien Net</span>
            <span className="text-[10px] font-black text-slate-600 ml-2 tracking-[0.3em] hidden sm:inline">// PROFILE_Sovereignty</span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-transparent border border-white/10 text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest px-6 h-10"
              style={{ borderRadius: '1px' }}
            >
              Control_Center
            </Button>
            <Button
              onClick={logout}
              className="bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 text-[10px] font-black uppercase tracking-widest px-6 h-10"
              style={{ borderRadius: '1px' }}
            >
              Sever_Session
            </Button>
          </div>
        </nav>
      </header>

      <main className="pt-32 pb-40 max-w-7xl mx-auto px-6 grid lg:grid-cols-4 gap-12">
        <aside className="space-y-8">
          <div className="p-8 border border-white/5 bg-[#050505] text-center space-y-6" style={{ borderRadius: '2px' }}>
            <div className="w-24 h-24 mx-auto bg-white/5 border border-white/10 flex items-center justify-center relative group" style={{ borderRadius: '1px' }}>
              <Users className="w-12 h-12 text-slate-700 group-hover:text-alien-green transition-colors" />
              <div className="absolute inset-0 border border-alien-green opacity-0 group-hover:opacity-30 transition-opacity" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">{user?.name || 'Operator_Admin'}</h2>
              <p className="text-[9px] font-mono text-alien-green">{user?.email || 'admin@networking.local'}</p>
            </div>
            <div className="pt-4 border-t border-white/5 flex justify-center gap-8">
              <div className="text-center">
                <div className="text-[14px] font-black text-white">14.2k</div>
                <div className="text-[8px] font-black text-slate-700 uppercase">Reputation</div>
              </div>
              <div className="text-center">
                <div className="text-[14px] font-black text-white">Citadel</div>
                <div className="text-[8px] font-black text-slate-700 uppercase">Access_Tier</div>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {['Identity_Matrix', 'Security_Certs', 'Node_Registry', 'Billing_Transmissions'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-alien-green bg-alien-green/5 border-l-2 border-alien-green' : 'text-slate-500 hover:text-white border-l-2 border-transparent hover:bg-white/5 shadow-none'
                  }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </aside>

        <section className="lg:col-span-3 space-y-8">
          <div className="p-10 border border-white/5 bg-[#050505] space-y-10" style={{ borderRadius: '2px' }}>
            <div className="flex justify-between items-center border-b border-white/5 pb-6">
              <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{activeTab.replace('_', ' ')}</h3>
              <Button variant="ghost" className="text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-widest">Download_Specs_JSON</Button>
            </div>

            {activeTab === 'Identity_Matrix' && (
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Public_Alias</label>
                    <input defaultValue={user?.name} className="w-full bg-[#000000] border border-white/10 h-12 px-4 text-[12px] font-bold text-white focus:outline-none focus:border-alien-green/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Comm_Relay (Email)</label>
                    <input defaultValue={user?.email} className="w-full bg-[#000000] border border-white/10 h-12 px-4 text-[12px] font-bold text-white focus:outline-none focus:border-alien-green/30" />
                  </div>
                  <Button className="h-14 bg-alien-green text-black hover:bg-[#00dd38] text-[10px] font-black uppercase tracking-[0.3em] w-full" style={{ borderRadius: '2px' }}>
                    Commit_Identity_Changes
                  </Button>
                </div>
                <div className="p-8 bg-[#000000] border border-white/5 space-y-6">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Technical_Achievements</h4>
                  <div className="space-y-4">
                    {[
                      { icon: GitBranch, title: "Dijkstra Master", desc: "Resolved 50+ topological deadlocks." },
                      { icon: Activity, title: "Packet Sniffer", desc: "Analyzed 1TB+ of flow telemetry." },
                      { icon: Shield, title: "Vault Guardian", desc: "Zero security breaches in 365 days." }
                    ].map((award, i) => (
                      <div key={i} className="flex gap-4">
                        <award.icon className="w-5 h-5 text-alien-green shrink-0" />
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-black text-white uppercase">{award.title}</div>
                          <div className="text-[9px] text-slate-600 lowercase italic">{award.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Security_Certs' && (
              <div className="space-y-8">
                <div className="p-6 border border-red-500/20 bg-red-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Lock className="w-6 h-6 text-red-500" />
                    <div className="space-y-1">
                      <div className="text-[12px] font-black text-white uppercase tracking-widest">Root_Access_Key_Rotation</div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Last rotated: 42 minutes ago</p>
                    </div>
                  </div>
                  <Button className="bg-red-500 text-white hover:bg-red-600 text-[9px] font-black uppercase px-6">Force_Rotate</Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { title: "AES-256-GCM", status: "Active", level: "Citadel" },
                    { title: "MFA_Biometric", status: "Offline", level: "Sovereign" }
                  ].map(cert => (
                    <div key={cert.title} className="p-6 border border-white/5 bg-[#000000] space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[11px] font-black text-white uppercase tracking-widest">{cert.title}</h4>
                        <span className={`text-[8px] font-black px-2 py-0.5 ${cert.status === 'Active' ? 'bg-alien-green text-black' : 'bg-slate-800 text-slate-500'}`}>{cert.status}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">Security_Tier: {cert.level}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <div className="fixed inset-0 pointer-events-none z-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>
    </div>
  )
}
