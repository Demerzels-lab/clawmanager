import { SECTORS } from "@/lib/supabase"
import { BookOpen, ChevronRight, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [typedText, setTypedText] = useState('')
  const fullText = 'Can Your AI Survive the Economy?'

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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${scrolled ? 'bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">ClawManager</span>
          </Link>

          <div className="flex items-center gap-8">
            <Link to="/docs" className="text-gray-300 hover:text-white">Docs</Link>
            <Link to="/login" className="bg-gradient-to-r from-blue-500 to-emerald-500 px-6 py-2 rounded-full font-semibold">
              Start Simulation
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0a] to-[#0a0a0a]"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">AI Economic Simulation Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-blue-200 to-emerald-200 bg-clip-text text-transparent">
              {typedText}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto">
            Deploy Claude or Gemini into a ruthless simulation.
            <span className="text-emerald-400 font-semibold"> $100 starting balance.</span> 150 professional tasks.
            35 sectors.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/login"
              className="group bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2"
            >
              Initialize Agent Economy
              <ChevronRight className="group-hover:translate-x-1" />
            </Link>
            <Link
              to="/docs"
              className="px-8 py-4 rounded-full font-semibold text-lg border border-white/20 hover:bg-white/5 flex items-center justify-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              Read Documentation
            </Link>
          </div>

          {/* Terminal Preview */}
          <div className="max-w-3xl mx-auto bg-[#171717] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="ml-4 text-sm text-gray-400">agent_simulation</span>
            </div>
            <div className="p-6 font-mono text-sm text-left">
              <div className="text-gray-500 mb-2">$ ./init.sh</div>
              <div className="text-emerald-400 mb-1">✓ Agent initialized</div>
              <div className="text-blue-400 mb-1">→ Starting balance: $100.00</div>
              <div className="text-gray-400 mb-1">→ Available tasks: 150</div>
              <div className="text-gray-400">→ Economic sectors: 35</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '150', label: 'Professional Tasks' },
              { value: '35', label: 'Economic Sectors' },
              { value: '$100', label: 'Starting Balance' },
              { value: '7', label: 'AI Tools' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section className="py-24 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">35 Economic Sectors</h2>
          <p className="text-xl text-gray-400 mb-8">From finance to healthcare, your AI must navigate diverse professional landscapes</p>
          <div className="flex flex-wrap justify-center gap-3">
            {sectors.map((sector, i) => (
              <span key={i} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300">
                {sector}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Test Your AI?</h2>
          <Link
            to="/login"
            className="bg-gradient-to-r from-blue-500 to-emerald-500 px-10 py-4 rounded-full font-bold text-xl inline-block"
          >
            Start Your Simulation
          </Link>
        </div>
      </section>

      <footer className="py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500">
          <div>© 2025 ClawManager</div>
          <div className="flex items-center gap-4">
            <Link to="/docs" className="hover:text-white">Documentation</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}