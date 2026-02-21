import { Terminal, Wallet, Target, TrendingUp, Activity, RotateCcw } from 'lucide-react'
import { User, AgentLog } from '../types'

interface DashboardTabProps {
  user: User
  agentLogs: AgentLog[]
  novaStatus: 'idle' | 'processing' | 'auto'
  runningTool: string | null
  setAgentLogs: (logs: AgentLog[]) => void
  setActiveTab: (tab: 'dashboard' | 'tasks' | 'tools' | 'workspace' | 'inbox' | 'memory' | 'active_mission') => void
}

export default function DashboardTab({
  user,
  agentLogs,
  novaStatus,
  runningTool,
  setAgentLogs,
  setActiveTab
}: DashboardTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* NOVA STATUS BANNER */}
      <div className="flex items-center gap-4 p-4 bg-[#050505]/80 border border-green-500/20 rounded-sm backdrop-blur-md relative overflow-hidden cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => runningTool === 'completing' ? setActiveTab('active_mission') : setActiveTab('inbox')}>
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent pointer-events-none" />
        <div className="w-14 h-14 rounded-sm overflow-hidden border-2 border-green-500 shadow-[0_0_20px_rgba(57,255,20,0.4)] shrink-0 relative">
          <img src="/logo.jpeg" alt="Nova" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-black text-white tracking-[0.2em] uppercase italic">NOVA</span>
            <span className={`text-[9px] px-2 py-0.5 rounded-sm font-black uppercase tracking-widest transition-all duration-300 ${
              novaStatus === 'auto' || runningTool === 'completing' ? 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-[0_0_8px_rgba(57,255,20,0.4)] animate-pulse' :
              novaStatus === 'processing' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
              'bg-zinc-900 text-zinc-500 border border-zinc-800'
            }`}>
              {novaStatus === 'auto' ? '● EXECUTING' : runningTool === 'completing' ? '● MISSION ACTIVE' : novaStatus === 'processing' ? '● PROCESSING' : '● STANDBY'}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter truncate">
            Neural Agent v4.0.5 — Autonomous mode active // Operator: <span className="text-green-500/60">{user.username}</span>
          </p>
        </div>
        <div className="text-right shrink-0 mr-4">
          <div className="text-[9px] text-green-500/40 uppercase font-bold tracking-widest mb-0.5">Knowledge</div>
          <div className="text-2xl font-black text-green-500 neon-glow tabular-nums">0</div>
          <div className="text-[9px] text-zinc-600 uppercase font-bold">deposits</div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setActiveTab(runningTool === 'completing' ? 'active_mission' : 'inbox'); }}
          className="px-4 py-2 bg-green-500 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-sm hover:bg-green-400 transition-all cyber-button shadow-[0_0_15px_rgba(57,255,20,0.3)] shrink-0"
        >
          {runningTool === 'completing' ? 'View_Mission →' : 'Talk_to_Nova →'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Neural Balance', value: `Ð${user.balance.toFixed(2)}`, icon: Wallet, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
          { label: 'Nodes Completed', value: user.tasksCompleted, icon: Target, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30' },
          { label: 'Total Earnings', value: `Ð${user.totalEarnings.toFixed(2)}`, icon: TrendingUp, color: 'text-green-300', bg: 'bg-green-300/10', border: 'border-green-300/30' },
          { label: 'System Efficiency', value: `${user.tasksCompleted > 0 ? Math.min(100, Math.round((user.totalEarnings / (user.tasksCompleted * 25)) * 100)) : 0}%`, icon: Activity, color: 'text-green-500', bg: 'bg-green-500/20', border: 'border-green-500/50' },
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-sm bg-[#0a0a0a]/60 border shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md group hover:border-green-500 transition-all duration-300 relative overflow-hidden ${stat.border}`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 -rotate-45 translate-x-8 -translate-y-8" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`p-3 rounded-sm ${stat.bg} shadow-inner`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map(j => <div key={j} className="w-1 h-3 bg-green-500/10 rounded-full group-hover:bg-green-500/30 transition-colors" />)}
              </div>
            </div>
            <div className="text-green-500/40 text-[10px] font-black uppercase tracking-[0.2em] mb-1 relative z-10">{stat.label}</div>
            <div className="text-2xl font-black text-white group-hover:text-green-400 transition-colors tracking-tighter tabular-nums relative z-10 uppercase">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#050505]/80 rounded-sm border border-green-500/20 overflow-hidden neon-border backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3 bg-green-500/5 border-b border-green-500/10">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-green-500 animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.2em] text-green-500/70 uppercase">AGENT_STREAMS</span>
          </div>
          <button onClick={() => { setAgentLogs([]); localStorage.setItem('clawmanager_logs', JSON.stringify([])); }} className="p-1 rounded hover:bg-green-500/10 text-green-500/40 hover:text-green-400 transition-colors">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
        <div className="p-4 h-64 overflow-y-auto font-mono text-[11px] space-y-1 custom-scrollbar bg-black/40">
          {agentLogs.length === 0 ? (
            <div className="text-green-900/40 italic flex items-center gap-2">
              <div className="w-1 h-1 bg-green-900/40 rounded-full animate-ping" />
              Listening for neural signals...
            </div>
          ) : agentLogs.slice().reverse().map(log => (
            <div key={log.id} className="flex items-start gap-3 group py-1 border-b border-green-500/5 hover:bg-green-500/5 transition-colors">
              <span className="text-green-900 font-bold shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span className="text-green-500/60 font-black shrink-0 uppercase tracking-tighter">{log.tool}:</span>
              <span className="text-zinc-400 group-hover:text-green-100 transition-colors">{log.output}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}