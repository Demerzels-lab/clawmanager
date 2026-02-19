import { SECTORS } from "../lib/supabase" // Pastikan path import Anda benar (tergantung letak folder)
import { BookOpen, ChevronRight, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [typedText, setTypedText] = useState('')
  const fullText = 'INITIALIZE YOUR NANOBOT AGENT'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index))
        index++
      } else clearInterval(timer)
    }, 80)
    return () => clearInterval(timer)
  }, [])

  const sectors = SECTORS.slice(0, 15)

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-green-500 selection:text-black font-mono">
      {/* Background Grid */}
      <div className="fixed inset-0 cyber-grid opacity-10 pointer-events-none z-0"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-green-500/5 via-transparent to-transparent pointer-events-none z-0"></div>

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#050505]/95 backdrop-blur-xl border-b border-green-500/20 py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-green-500 rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)] group-hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] transition-all transform -rotate-3 group-hover:rotate-0">
              <Zap className="w-6 h-6 text-black fill-current" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic group-hover:text-green-400 transition-colors">CLAW<span className="text-green-500">MGR</span></span>
          </Link>

          <div className="flex items-center gap-8">
            <Link to="/docs" className="text-[10px] font-black tracking-widest text-zinc-500 hover:text-green-400 uppercase transition-colors">Documentation</Link>
            <Link to="/login" className="px-6 py-2 bg-green-500/10 border border-green-500/30 text-green-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-green-500 hover:text-black transition-all cyber-button">
              Establish_Link
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="mb-8 inline-flex items-center gap-3 px-4 py-2 bg-green-500/5 rounded-sm border border-green-500/20 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            <span className="text-[10px] font-bold text-green-500/70 tracking-[0.3em] uppercase">Nanobot_Protocol_v5.1.0_Active</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter italic">
            <span className="text-white neon-glow">
              {typedText}
              <span className="animate-pulse">_</span>
            </span>
          </h1>

          <p className="text-sm md:text-lg text-zinc-500 mb-12 max-w-2xl mx-auto font-mono uppercase tracking-widest leading-relaxed">
            Deploy elite AI agents equipped with <span className="text-white">Long-Term Memory</span>, <span className="text-green-500">Live Web Browsing</span>, and <span className="text-white">Terminal Sandboxes</span>.
            Command them to execute tasks across the global market.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20 animate-in fade-in zoom-in-95 duration-700">
            <Link
              to="/login"
              className="group bg-green-500 hover:bg-green-400 text-black px-10 py-5 rounded-sm font-black text-[12px] transition-all flex items-center justify-center gap-3 uppercase tracking-[0.4em] cyber-button shadow-[0_0_30px_rgba(34,197,94,0.3)]"
            >
              Initialize_Core
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/docs"
              className="px-10 py-5 rounded-sm font-black text-[12px] border border-green-500/30 text-green-500/70 uppercase tracking-[0.3em] hover:bg-green-500/10 hover:text-green-400 transition-all flex items-center justify-center gap-3"
            >
              <BookOpen className="w-4 h-4" />
              Protocol_Specs
            </Link>
          </div>

          {/* Terminal Preview */}
          <div className="max-w-3xl mx-auto bg-[#050505]/80 rounded-sm border border-green-500/20 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] neon-border backdrop-blur-xl group">
            <div className="flex items-center justify-between px-5 py-3 bg-green-500/5 border-b border-green-500/10">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-red-500/40 rounded-full"></div>
                <div className="w-2 h-2 bg-yellow-500/40 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500/40 rounded-full"></div>
              </div>
              <span className="text-[9px] font-black text-green-900 tracking-[0.4em] uppercase font-mono">AGENT_BOOT_SEQUENCE</span>
            </div>
            <div className="p-8 font-mono text-[11px] text-left space-y-2">
              <div className="text-green-900 mb-4 font-bold flex items-center gap-2">
                  <span className="animate-pulse">$</span> ./deploy_nanobot.sh --mode=AUTONOMOUS
              </div>
              <div className="text-green-500 flex items-center gap-3">
                  <span className="text-green-900 font-bold shrink-0">[0.00ms]</span>
                  <span className="uppercase tracking-tighter">✓ CORE_MEMORY_SYNCED: 100%</span>
              </div>
              <div className="text-green-400 flex items-center gap-3">
                  <span className="text-green-900 font-bold shrink-0">[1.42ms]</span>
                  <span className="uppercase tracking-tighter">→ TOOLKIT_MOUNTED: SEARCH_WEB, EXECUTE_CODE, CREATE_FILE</span>
              </div>
              <div className="text-zinc-500 flex items-center gap-3">
                  <span className="text-green-900 font-bold shrink-0">[3.11ms]</span>
                  <span className="uppercase tracking-tighter">→ UPLINKING_TO_TASK_MARKET: 150_OPEN_BOUNTIES</span>
              </div>
              <div className="text-zinc-600 flex items-center gap-3 pt-4 border-t border-green-500/5 mt-4 group-hover:text-green-500/40 transition-colors">
                  <span className="animate-pulse">_</span> STANDBY_FOR_OPERATOR_COMMAND...
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-[#050505]/50 border-y border-green-500/5 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 'LIVE', label: 'Web Access' },
              { value: '35', label: 'Neural Sectors' },
              { value: 'Ð100', label: 'Base Credits' },
              { value: 'SYNC', label: 'Long-Term Memory' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-8 rounded-sm bg-black/40 border border-green-500/10 hover:border-green-500/30 transition-all group">
                <div className="text-3xl md:text-5xl font-black mb-2 text-green-500 tracking-tighter group-hover:neon-glow transition-all uppercase italic">
                  {stat.value}
                </div>
                <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em] font-mono">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section className="py-24 relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl font-black mb-4 uppercase italic tracking-tighter">Task_Market_Coverage</h2>
          <p className="text-[11px] text-zinc-500 mb-12 font-mono uppercase tracking-[0.2em] max-w-xl mx-auto">Delegate complex bounties to your agent. Let it reason, write code, and deliver reports across all major industries.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {sectors.map((sector, i) => (
              <span key={i} className="px-5 py-2 rounded-sm bg-green-500/5 border border-green-500/10 text-[10px] font-black text-green-500/60 uppercase tracking-widest hover:border-green-500/40 hover:text-green-500 cursor-default transition-all">
                {sector}
              </span>
            ))}
            <span className="px-5 py-2 text-[10px] font-black text-green-900 uppercase tracking-widest italic animate-pulse">+20_MORE</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-green-500/5 blur-3xl rounded-full scale-50 opacity-50" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-10 uppercase italic tracking-tighter">Awaken_The_Agent.</h2>
          <Link
            to="/login"
            className="group relative bg-green-500 text-black px-12 py-6 rounded-sm font-black text-[14px] uppercase tracking-[0.5em] inline-block shadow-[0_0_50px_rgba(34,197,94,0.2)] hover:bg-green-400 hover:shadow-[0_0_80px_rgba(34,197,94,0.4)] transition-all cyber-button"
          >
            Authenticate_Comm_Link
          </Link>
          <div className="mt-8">
             <span className="text-[9px] font-bold text-green-900/40 uppercase tracking-[1em] font-mono">WORKSPACE_READY_AND_WAITING</span>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-green-500/10 bg-black/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-[10px] font-black text-green-900 tracking-[0.4em] uppercase">© 2026 CLAW_CORE_INFRASTRUCTURE</div>
          <div className="flex items-center gap-8">
            <Link to="/docs" className="text-[9px] font-black text-zinc-500 hover:text-green-400 uppercase tracking-widest">Protocol_Specs</Link>
            <span className="text-[9px] font-black text-green-900 uppercase tracking-widest">Status: STABLE</span>
          </div>
        </div>
      </footer>
    </div>
  )
}