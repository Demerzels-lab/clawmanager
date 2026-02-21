import { Activity, Brain, BookOpen, Target, Search, Terminal } from 'lucide-react'
import { User } from '../types'

interface Tool {
  name: string
  desc: string
  cost: number
  icon: any
}

interface ToolsTabProps {
  user: User
  runningTool: string | null
  purchaseUpgrade: (toolName: string) => void
}

const tools: Tool[] = [
  { name: 'decide_activity', desc: 'Strategic work/learn decision', cost: 25.00, icon: Brain },
  { name: 'submit_work', desc: 'Submit completed work', cost: 15.00, icon: BookOpen },
  { name: 'learn', desc: 'Improve agent capabilities', cost: 30.00, icon: Activity },
  { name: 'get_status', desc: 'Check current status', cost: 10.00, icon: Target },
  { name: 'search_web', desc: 'Search for information', cost: 20.00, icon: Search },
  { name: 'create_file', desc: 'Create and manage files', cost: 35.00, icon: Terminal },
  { name: 'execute_code', desc: 'Run code in sandbox', cost: 40.00, icon: Terminal },
]

export default function ToolsTab({ user, runningTool, purchaseUpgrade }: ToolsTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex flex-col border-l-4 border-green-500 pl-4 py-2">
        <h2 className="text-2xl font-black text-white tracking-tighter italic">Neural_Upgrades</h2>
        <p className="text-[10px] text-green-500/50 font-mono tracking-[0.2em] uppercase">Install modules to increase Nova's base efficiency (+15% Multiplier per Module)</p>
      </div>

      {/* Tampilkan Multiplier Saat Ini */}
      <div className="bg-[#050505]/80 rounded-sm border border-green-500/30 p-4 flex items-center gap-4 neon-border">
        <Activity className="w-8 h-8 text-green-500 animate-pulse" />
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Current Yield Multiplier</div>
          <div className="text-xl font-black text-green-400">
            x{(1 + ((user.ownedTools?.length || 0) * 0.15)).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map(tool => {
          const isOwned = user.ownedTools?.includes(tool.name)
          return (
          <div key={tool.name} className={`bg-[#050505]/80 rounded-sm border ${isOwned ? 'border-amber-500/30' : 'border-green-500/10'} p-6 relative group overflow-hidden transition-all`}>
            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-sm bg-green-500/5 border ${isOwned ? 'border-amber-500' : 'border-green-500/20'} flex items-center justify-center`}>
                    <tool.icon className={`w-7 h-7 ${isOwned ? 'text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]'}`} />
                </div>
                <div>
                    <h3 className={`font-black tracking-widest uppercase italic ${isOwned ? 'text-amber-400' : 'text-white'}`}>{tool.name}</h3>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter mt-1">{tool.desc}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between relative z-10 mt-4 pt-4 border-t border-green-500/5">
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-600 font-bold uppercase">INSTALLATION_COST</span>
                <span className="text-green-500/80 font-black text-sm tabular-nums">Ð{tool.cost.toFixed(2)}</span>
              </div>

              {isOwned ? (
                 <button disabled className="px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] bg-amber-500/10 text-amber-500 border border-amber-500/30 cursor-not-allowed">
                   INTEGRATED
                 </button>
              ) : (
                <button
                  onClick={() => purchaseUpgrade(tool.name)}
                  disabled={runningTool !== null || user.balance < tool.cost}
                  className="px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-black transition-all disabled:opacity-30 cyber-button"
                >
                  {runningTool === tool.name ? 'INSTALLING...' : 'Acquire'}
                </button>
              )}
            </div>
          </div>
        )})}
      </div>
    </div>
  )
}