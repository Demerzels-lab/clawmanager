import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { User } from '../types'
import { INITIAL_TASKS } from '../lib/supabase'

export default function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!username.trim()) { setError('FIELD_NULL: ID_REQUIRED'); return; }
    setLoading(true); setError('');

    const newUser: User = { id: crypto.randomUUID(), username: username.trim(), balance: 100, tasksCompleted: 0, totalEarnings: 0, ownedTools: [] }
    localStorage.setItem('clawmanager_user', JSON.stringify(newUser))
    localStorage.setItem('clawmanager_transactions', JSON.stringify([]))
    localStorage.setItem('clawmanager_tasks', JSON.stringify(INITIAL_TASKS))
    localStorage.setItem('clawmanager_logs', JSON.stringify([]))

    setTimeout(() => {
      onLogin(newUser)
      setLoading(false)
      navigate('/app')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-[#020202] text-white flex items-center justify-center p-6 font-mono selection:bg-green-500 selection:text-black relative overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-500 rounded-sm flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)] transform -rotate-6">
            <Zap className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white neon-glow">CLAW<span className="text-green-500">MGR</span>_OS</h1>
          <p className="text-[10px] text-green-900 font-bold uppercase tracking-[0.5em] mt-2">Neural_Workforce_Interface</p>
        </div>

        <div className="bg-[#050505]/80 rounded-sm border border-green-500/30 p-8 shadow-[0_40px_100px_rgba(0,0,0,0.8)] neon-border backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
          
          <div className="flex items-center gap-2 mb-8 border-b border-green-500/10 pb-4">
              <div className="w-1 h-3 bg-green-500" />
              <h2 className="text-[11px] font-black text-green-500/70 uppercase tracking-[0.3em]">AUTHENTICATE_OPERATOR</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[9px] font-black text-green-900 uppercase tracking-widest mb-2">ID_STRING</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="PROMPT_ID..." 
                className="w-full bg-black/50 border border-green-500/20 rounded-sm px-4 py-4 text-[12px] text-green-400 placeholder-green-900 focus:outline-none focus:border-green-500/60 focus:bg-green-500/5 transition-all uppercase tracking-widest" 
                onKeyDown={(e) => e.key === "Enter" && handleLogin()} 
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold uppercase tracking-tighter flex items-center gap-2 animate-pulse">
                <div className="w-1 h-1 bg-red-500 rounded-full animate-ping" />
                {error}
              </div>
            )}

            <button 
                onClick={handleLogin} 
                disabled={loading} 
                className="group w-full bg-green-500 hover:bg-green-400 disabled:opacity-30 px-6 py-4 rounded-sm font-black text-black text-[12px] uppercase tracking-[0.4em] transition-all cyber-button shadow-[0_0_20px_rgba(34,197,94,0.2)]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                    <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
                    <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
                </div>
              ) : "Establish_Link"}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-green-500/5 flex justify-between items-center text-[8px] text-green-900 font-bold uppercase font-mono">
              <span className="tracking-[0.2em]">Ready_To_Uplink</span>
              <span className="tracking-widest">v4.0.2</span>
          </div>
        </div>
        
        <div className="mt-8 text-center">
            <Link to="/" className="text-[9px] font-bold text-green-900/40 hover:text-green-500 uppercase tracking-[0.2em] transition-colors">ABORT_SEQUENCE</Link>
        </div>
      </div>
    </div>
  )
}
