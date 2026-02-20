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
    if (!username.trim()) { setError('Please enter a username'); return; }
    setLoading(true); setError('');

    const newUser: User = { id: crypto.randomUUID(), username: username.trim(), balance: 100, tasksCompleted: 0, totalEarnings: 0, ownedTools: [] }
    localStorage.setItem('clawmanager_user', JSON.stringify(newUser))
    localStorage.setItem('clawmanager_transactions', JSON.stringify([]))
    localStorage.setItem('clawmanager_tasks', JSON.stringify(INITIAL_TASKS))
    localStorage.setItem('clawmanager_logs', JSON.stringify([]))

    onLogin(newUser)
    setLoading(false)
    navigate('/app')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><Zap className="w-8 h-8 text-white" /></div>
          <h1 className="text-3xl font-bold text-white mb-2">ClawManager</h1>
          <p className="text-gray-400">AI Economic Simulation Platform</p>
        </div>
        <div className="bg-[#171717] rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Enter Your Name</h2>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username..." className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-4" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button onClick={handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 disabled:opacity-50 px-6 py-3 rounded-lg font-bold text-white transition-all">
            {loading ? 'Initializing...' : 'Start Simulation'}
          </button>
        </div>
      </div>
    </div>
  )
}