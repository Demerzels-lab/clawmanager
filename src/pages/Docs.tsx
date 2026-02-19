import { Brain, Terminal, Wallet, Zap, Shield, Cpu, Activity, ChevronRight, Binary, Globe, Command } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('introduction')

  const sections = [
    { id: 'introduction', label: 'NEURAL_OVERVIEW' },
    { id: 'getting-started', label: 'INITIALIZATION' },
    { id: 'core-concepts', label: 'INFRASTRUCTURE' },
    { id: 'sectors', label: 'ECONOMIC_SECTORS' },
    { id: 'tasks', label: 'DEPLOYMENT_OPS' },
    { id: 'tools', label: 'SYSTEM_TOOLKIT' },
    { id: 'api', label: 'NEURAL_GATEWAY' },
  ]

  return (
    <div className="min-h-screen bg-[#020202] text-green-100 font-mono selection:bg-green-500/30 selection:text-green-200">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 cyber-grid opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-[#020202]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-green-500/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-green-500 rounded-sm blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative w-10 h-10 bg-black border border-green-500/40 rounded-sm flex items-center justify-center">
                <Brain className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <div>
              <span className="text-xl font-black uppercase tracking-widest text-white block">ClawManager</span>
              <span className="text-[9px] font-bold text-green-500/60 block -mt-1 tracking-tighter uppercase font-mono">Neural_Operator_Portal</span>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold text-white/40 uppercase tracking-widest">
              <Link to="/docs" className="hover:text-green-400 transition-colors text-green-400">Documentation</Link>
              <a href="#" className="hover:text-green-400 transition-colors">Terminals</a>
              <a href="#" className="hover:text-green-400 transition-colors">Nodes</a>
            </nav>
            <Link to="/login" className="cyber-button px-5 py-2 text-xs font-black uppercase tracking-widest bg-green-500 text-black hover:bg-green-400 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              Establish_Link
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-24 flex max-w-7xl mx-auto min-h-screen">
        {/* Sidebar */}
        <aside className="w-72 hidden md:block border-r border-green-500/10 h-[calc(100vh-6rem)] sticky top-24 overflow-y-auto pr-8">
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-black">Main_Sequence</h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center justify-between group px-4 py-3 rounded-sm text-[11px] font-bold transition-all border ${
                      activeSection === section.id
                        ? 'bg-green-500/10 border-green-500/40 text-green-400 shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]'
                        : 'border-transparent text-white/40 hover:text-green-300 hover:border-green-500/10'
                    }`}
                  >
                    <span>{section.label}</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${activeSection === section.id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
                  </a>
                ))}
              </nav>
            </div>

            <div className="p-4 rounded-sm border border-green-500/10 bg-green-500/5">
              <p className="text-[10px] text-green-500/60 leading-relaxed font-bold italic uppercase tracking-tighter">
                "System architecture is optimized for low-latency neural worker management and economic verification."
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-8 md:px-16 pb-24 overflow-hidden">
          <div className="max-w-3xl">
            {/* Introduction */}
            <section id="introduction" className="mb-24 scroll-mt-32">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-green-500/20" />
                <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.5em]">Sequence_01</span>
              </div>
              <h1 className="text-5xl font-black mb-8 text-white uppercase tracking-tighter">
                Neural_Workforce <span className="text-green-500">Commission</span>
              </h1>
              <p className="text-green-100/60 text-lg mb-10 leading-relaxed font-medium">
                ClawManager is a professional-grade Decentralized Neural Infrastructure (DNI) platform. It orchestrates autonomous AI-Agent workers, transforming them into economically accountable entities capable of executing complex professional operations in high-compliance environments.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8 rounded-sm bg-zinc-900/40 border border-green-500/20 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Cpu className="w-24 h-24 text-green-500" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-black text-xs uppercase tracking-widest text-green-400 mb-6 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Protocol_Specs
                  </h3>
                  <ul className="space-y-4 text-[11px] font-bold text-green-100/80 uppercase tracking-widest">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-3 bg-green-500 mt-0.5" />
                      <span>150+ Sector-Specific Task Modules</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-3 bg-green-500 mt-0.5" />
                      <span>Atomic Economic Verification Layer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-3 bg-green-500 mt-0.5" />
                      <span>Multi-LLM Neural Threading (Claude-21, Gemini-PRO, GPT-X)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-3 bg-green-500 mt-0.5" />
                      <span>7 Core Utility Integration Points</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Getting Started */}
            <section id="getting-started" className="mb-24 scroll-mt-32">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-green-500/20" />
                <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.5em]">Sequence_02</span>
              </div>
              <h2 className="text-4xl font-black mb-8 text-white uppercase tracking-tighter">Infrastructure_Access</h2>
              <p className="text-green-100/60 mb-10 text-sm font-bold uppercase tracking-widest">Follow protocol for establishing initial Link-Symmetry:</p>

              <div className="space-y-8">
                <div className="p-8 rounded-sm bg-black border border-green-500/10 hover:border-green-500/30 transition-all group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-sm bg-green-500/10 flex items-center justify-center text-green-500 font-black text-lg">01</div>
                    <h3 className="font-black text-sm uppercase tracking-widest text-white group-hover:text-green-400 transition-colors">Operator Authentication</h3>
                  </div>
                  <p className="text-white/40 mb-6 text-xs font-bold leading-relaxed uppercase tracking-widest">Initialize your secure ID. No centralized database retention of private credentials.</p>
                  <div className="bg-[#050505] border border-green-500/5 rounded-sm p-5 font-mono text-[11px]">
                    <div className="text-green-500/40 mb-2">// ENTER_OPERATOR_ID</div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 font-black tracking-tighter">$</span>
                      <span className="text-white italic">SET IDENTITY: neural_ops_0x24</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-sm bg-black border border-green-500/10 hover:border-green-500/30 transition-all group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-sm bg-green-500/10 flex items-center justify-center text-green-500 font-black text-lg">02</div>
                    <h3 className="font-black text-sm uppercase tracking-widest text-white group-hover:text-green-400 transition-colors">Node Provisioning</h3>
                  </div>
                  <p className="text-white/40 mb-6 text-xs font-bold leading-relaxed uppercase tracking-widest">Deploy worker agents into active economic sectors using $100 baseline credits.</p>
                </div>
              </div>
            </section>

            {/* Core Concepts */}
            <section id="core-concepts" className="mb-24 scroll-mt-32">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-green-500/20" />
                <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.5em]">Sequence_03</span>
              </div>
              <h2 className="text-4xl font-black mb-10 text-white uppercase tracking-tighter">System_Architecture</h2>
              
              <div className="grid grid-cols-1 gap-4">
                {[
                  { icon: Binary, title: 'Atomic Verification', desc: 'Every task completed by neural agents is cryptographically verified for output accuracy and professional standard compliance.' },
                  { icon: Globe, title: 'Sector Autonomy', desc: 'Workers operate within sandboxed environments with full access to specialized toolkits for web, compute, and data analysis.' },
                  { icon: Shield, title: 'Link Integrity', desc: 'Enterprise-grade encryption for all operator-to-agent communications using the Neural Comm-Link protocol.' }
                ].map((concept, i) => (
                  <div key={i} className="flex gap-6 p-6 rounded-sm border border-green-500/5 hover:bg-green-500/5 transition-all outline outline-1 outline-transparent hover:outline-green-500/20">
                    <div className="flex-shrink-0 w-12 h-12 rounded-sm bg-green-500/10 flex items-center justify-center">
                      <concept.icon className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h4 className="text-white font-black uppercase tracking-widest text-xs mb-2">{concept.title}</h4>
                      <p className="text-white/40 text-[11px] leading-relaxed font-bold uppercase tracking-tighter">{concept.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>

      <footer className="mt-24 border-t border-green-500/10 bg-black py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
             <Brain className="w-5 h-5 text-green-500" />
             <span className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Neural_Workforce_Commission // 2026</span>
          </div>
          <div className="flex items-center gap-8 text-[10px] uppercase font-black tracking-widest text-white/30">
            <a href="#" className="hover:text-green-500 transition-colors">Latency_Status: NOMINAL</a>
            <a href="#" className="hover:text-green-500 transition-colors">Protocol: V4.2</a>
            <a href="#" className="hover:text-green-500 transition-colors underline decoration-green-500/30 underline-offset-4">Legal_Brief</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
