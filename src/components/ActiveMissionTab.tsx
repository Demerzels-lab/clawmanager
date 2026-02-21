import { Activity, Terminal, Folder, CheckCircle } from 'lucide-react'
import { VirtualFile } from '../types'

interface ActiveMissionTabProps {
  runningTool: string | null
  animationText: string
  animationType: 'thinking' | 'code' | 'text'
  codingAnimation: boolean
  virtualFiles: VirtualFile[]
  setActiveTab: (tab: 'dashboard' | 'tasks' | 'tools' | 'workspace' | 'inbox' | 'memory' | 'active_mission') => void
}

export default function ActiveMissionTab({
  runningTool,
  animationText,
  animationType,
  codingAnimation,
  virtualFiles,
  setActiveTab
}: ActiveMissionTabProps) {
  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-green-500/20 pb-4">
         <div className="flex items-center gap-3">
           <Activity className={`w-6 h-6 ${runningTool === 'completing' ? 'text-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`} />
           <h2 className={`text-xl font-black italic tracking-tighter ${runningTool === 'completing' ? 'text-amber-400' : 'text-white'}`}>
             ACTIVE_MISSION // {runningTool === 'completing' ? 'EXECUTING' : 'COMPLETED'}
           </h2>
         </div>
         {runningTool !== 'completing' && (
           <button onClick={() => setActiveTab('workspace')} className="px-4 py-2 bg-green-500/10 text-green-500 border border-green-500/30 rounded-sm text-[10px] font-black uppercase hover:bg-green-500 hover:text-black transition-all">
             Go to Workspace →
           </button>
         )}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[500px]">

        {/* LEFT: Agent Thought Process (Terminal) */}
        <div className="flex-1 lg:w-1/2 bg-[#050505]/80 rounded-sm border border-green-500/10 p-5 flex flex-col neon-border relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
          <div className="text-[10px] text-green-500/40 font-black uppercase tracking-widest border-b border-green-500/10 pb-3 mb-4 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Terminal className="w-3 h-3" />
               <span>Agent_Logic_Stream</span>
             </div>
             {runningTool === 'completing' ? <span className="text-amber-500 animate-pulse">● LIVE UPLINK</span> : <span className="text-green-500">● IDLE</span>}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[11px] leading-relaxed relative">
            {runningTool === 'completing' || codingAnimation ? (
                <div className="text-green-400 bg-black/50 p-4 rounded-sm border border-green-500/10 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)] min-h-full">
                    {animationType === 'code' ? (
                        <pre className="whitespace-pre-wrap">{animationText}<span className="inline-block w-2 h-4 bg-green-500 animate-pulse align-middle ml-0.5">_</span></pre>
                    ) : (
                        <div className="whitespace-pre-wrap text-zinc-300">{animationText}<span className="inline-block w-1.5 h-3.5 bg-amber-400/80 animate-pulse align-middle ml-0.5" /></div>
                    )}
                </div>
            ) : (
                <div className="text-green-500 flex flex-col items-center justify-center h-full opacity-60 space-y-4">
                    <CheckCircle className="w-12 h-12 mb-2 shadow-[0_0_15px_rgba(34,197,94,0.4)] rounded-full" />
                    <div className="text-center">
                       <div className="uppercase tracking-[0.3em] font-black text-sm mb-1">Mission Accomplished</div>
                       <div className="text-zinc-500 text-[10px]">Contract settled and output committed to workspace.</div>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* RIGHT: Live Workspace Preview */}
        <div className="flex-1 lg:w-1/2 bg-[#050505]/80 rounded-sm border border-green-500/10 p-5 flex flex-col neon-border bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:20px_20px]">
          <div className="text-[10px] text-green-500/40 font-black uppercase tracking-widest border-b border-green-500/10 pb-3 mb-4 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Folder className="w-3 h-3" />
               <span>Live_Output_Preview</span>
             </div>
             {runningTool !== 'completing' && virtualFiles.length > 0 && (
               <span className="text-green-600 font-mono italic truncate max-w-[150px]">{virtualFiles[0].name}</span>
             )}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[11px] text-green-100/90 whitespace-pre-wrap bg-black/40 p-4 border border-green-500/10 rounded-sm">
            {runningTool === 'completing' || codingAnimation ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-70">
                    <div className="relative">
                      <Activity className="w-10 h-10 text-amber-500 animate-pulse" />
                      <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
                    </div>
                    <span className="text-amber-500/70 uppercase tracking-[0.4em] font-black animate-pulse">Synthesizing Node...</span>
                </div>
            ) : virtualFiles.length > 0 ? (
                <pre style={{ tabSize: 4 }} className="whitespace-pre-wrap selection:bg-green-500/30">{virtualFiles[0].content}</pre>
            ) : (
                <div className="h-full flex items-center justify-center">
                   <span className="text-zinc-600 italic uppercase tracking-[0.2em] text-[10px]">Awaiting Synthesis</span>
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}