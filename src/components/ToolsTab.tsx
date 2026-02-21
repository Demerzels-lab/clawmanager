import { Brain, CheckSquare, Square, Cpu, ArrowRight, Wallet, Lock } from 'lucide-react'
import { User, Skill } from '../types'

interface ToolsTabProps {
  user: User
  runningTool: string | null
  purchaseUpgrade: (toolName: string) => void
  setActiveTab: (tab: any) => void
  trainingStep: 0 | 1 | 2
  setTrainingStep: (step: 0 | 1 | 2) => void
  selectedSkillIds: number[]
  setSelectedSkillIds: React.Dispatch<React.SetStateAction<number[]>>
}

export const AVAILABLE_SKILLS: Skill[] = [
  { id: 1, name: "artifacts-builder", slug: "artifacts-builder", description: "Suite of tools for creating elaborate HTML artifacts.", category: "Web & Frontend", author: "seanphan", install_command: "npx clawhub install artifacts-builder", price: 15.00 },
  { id: 2, name: "claw-shell", slug: "claw-shell", description: "Execute advanced terminal commands & container management.", category: "DevOps", author: "imaginelogo", install_command: "npx clawhub install claw-shell", price: 20.50 },
  { id: 3, name: "exa-search", slug: "exa-search", description: "Deep neural web search bypassing standard API limits.", category: "Recon & Search", author: "demerzel", install_command: "npx clawhub install exa-search", price: 10.00 },
  { id: 4, name: "github-pr", slug: "github-pr", description: "Autonomous code review and PR merging protocol.", category: "DevOps", author: "git-bot", install_command: "npx clawhub install github-pr", price: 25.00 },
]

export default function ToolsTab({ setActiveTab, trainingStep, setTrainingStep, selectedSkillIds, setSelectedSkillIds }: ToolsTabProps) {

  if (trainingStep < 1) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in zoom-in-95">
         <div className="relative mb-6">
            <Lock className="w-20 h-20 text-green-500/20 absolute -inset-2 animate-ping" />
            <Lock className="w-16 h-16 text-zinc-700 relative z-10" />
         </div>
         <h2 className="text-2xl font-black text-red-500 uppercase tracking-widest mb-2 neon-glow-red">ACCESS DENIED</h2>
         <p className="text-zinc-500 font-mono text-xs mb-8 max-w-md leading-relaxed">Security protocol activated. You must initiate a formal Training Sequence from the MEDEA Command Core to access Neural Skills.</p>
         <button onClick={() => setActiveTab('medea')} className="px-8 py-4 border border-green-500 text-green-500 font-black uppercase tracking-[0.2em] rounded-sm hover:bg-green-500 hover:text-black transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)]">
           Return to Command Core
         </button>
      </div>
    )
  }

  const toggleSkill = (skillId: number) => {
    setSelectedSkillIds(prev => prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId])
  }

  const totalComputeCost = selectedSkillIds.reduce((total, id) => {
    const skill = AVAILABLE_SKILLS.find(s => s.id === id)
    return total + (skill ? skill.price : 0)
  }, 0)

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-32">
      <div className="mb-8 border-b border-green-500/20 pb-6">
        <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-sm bg-green-500/20 text-green-500 tracking-widest uppercase animate-pulse">Phase 1: Loadout</span>
        </div>
        <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
          <Brain className="w-8 h-8 text-green-500" /> Neural <span className="text-green-500">Skills</span>
        </h2>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-2">Inject external modules into MEDEA's temporary memory for this operation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AVAILABLE_SKILLS.map((skill) => {
          const isSelected = selectedSkillIds.includes(skill.id)
          return (
            <div key={skill.id} onClick={() => toggleSkill(skill.id)} className={`p-6 rounded-sm border transition-all cursor-pointer group ${isSelected ? 'bg-green-500/10 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.15)]' : 'bg-[#050505] border-green-500/10 hover:border-green-500/30'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="mt-1">{isSelected ? <CheckSquare className="w-5 h-5 text-green-500" /> : <Square className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400" />}</div>
                  <div>
                     <h3 className={`text-lg font-black uppercase tracking-tighter ${isSelected ? 'text-green-400' : 'text-zinc-300'}`}>{skill.name}</h3>
                     <div className="flex items-center gap-2 mt-1">
                        <Cpu className="w-3 h-3 text-zinc-600" />
                        <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">{skill.category}</span>
                     </div>
                  </div>
                </div>
                <div className="text-right"><span className="text-sm font-black text-amber-500">Ð{skill.price.toFixed(2)}</span></div>
              </div>
              <p className="text-xs text-zinc-500 font-mono pl-8">{skill.description}</p>
            </div>
          )
        })}
      </div>

      <div className="fixed bottom-0 left-64 right-0 p-6 bg-gradient-to-t from-black via-[#050505] to-transparent pointer-events-none z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between bg-[#0a0a0a] border border-green-500/30 p-4 rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.9)] pointer-events-auto backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block">Est. Deployment Cost</span>
              <span className="text-xl font-black text-amber-500 flex items-center gap-2"><Wallet className="w-4 h-4" /> Ð{totalComputeCost.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (selectedSkillIds.length === 0) return alert("Select at least 1 module to proceed!")
              setTrainingStep(2); setActiveTab('tasks')
            }}
            disabled={selectedSkillIds.length === 0}
            className={`flex items-center gap-3 px-8 py-4 font-black uppercase tracking-[0.2em] rounded-sm transition-all cyber-button ${selectedSkillIds.length > 0 ? 'bg-green-500 text-black hover:bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'}`}
          >
            Next: Select Targets <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}