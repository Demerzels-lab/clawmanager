import { Target } from 'lucide-react'
import { Task } from '../types'

interface TaskMarketProps {
  tasks: Task[]
  onSelectTask: (task: Task) => void
}

export default function TaskMarket({ tasks, onSelectTask }: TaskMarketProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between border-b border-green-500/20 pb-4">
        <div className="flex flex-col">
            <h2 className="text-xl font-black text-white italic tracking-tighter">Available_Contracts</h2>
            <span className="text-[10px] text-green-500/40 font-mono uppercase tracking-[0.2em]">{tasks.filter(t => t.status === 'open').length} ACTIVE NODES IN MARKET</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.filter(t => t.status === 'open').slice(0, 150).map(task => (
          <div key={task.id} className="bg-[#050505]/80 rounded-sm border border-green-500/10 p-5 hover:border-green-500/50 transition-all duration-300 group relative overflow-hidden neon-border">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                <Target className="w-8 h-8 text-green-500" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[9px] font-black px-2 py-0.5 rounded-sm bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-widest">{task.sector}</span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest ${task.difficulty === 'hard' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : task.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-green-500/10 text-green-400 border border-green-400/20'}`}>{task.difficulty}</span>
            </div>
            <h3 className="font-black text-white mb-2 tracking-tight group-hover:text-green-400 transition-colors uppercase italic">{task.title}</h3>
            <p className="text-[11px] text-zinc-500 mb-6 font-mono leading-relaxed line-clamp-2 uppercase tracking-tighter">{task.description}</p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-green-500/5">
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-600 font-bold uppercase">REWARD_CREDITS</span>
                <span className="text-green-500 font-black text-lg tracking-tighter">Ð{task.reward}</span>
              </div>
              <button onClick={() => onSelectTask(task)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-black transition-all cyber-button">Accept</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}