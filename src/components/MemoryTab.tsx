import { Database } from 'lucide-react'
import { AgentMemory } from '../types'

interface MemoryTabProps {
  agentMemories: AgentMemory[]
}

export default function MemoryTab({ agentMemories }: MemoryTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 border-b border-green-500/20 pb-4">
        <Database className="w-6 h-6 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"/>
        <h2 className="text-xl font-black text-white italic tracking-tighter">NEURAL_DEPOSITS</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agentMemories.map(m => (
          <div key={m.id} className="bg-[#050505]/80 rounded-sm border border-green-500/10 p-5 neon-border group hover:border-green-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-[11px] text-green-400 tracking-widest uppercase">{m.topic}</h3>
                <div className="w-2 h-2 rounded-full bg-green-500/40 animate-pulse" />
            </div>
            <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-tighter leading-snug">{m.details}</p>
          </div>
        ))}
      </div>
    </div>
  )
}