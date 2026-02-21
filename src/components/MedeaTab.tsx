import { useState } from 'react'
import { Activity, Play, Zap, FileText, Fingerprint, Network, ShieldCheck, TerminalSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { User } from '../types'
import { AVAILABLE_SKILLS } from './ToolsTab'
import { NewArtifactSummary } from '../pages/Dashboard'

interface MedeaTabProps {
  user: User
  setActiveTab: (tab: any) => void
  setTrainingStep: (step: 0 | 1 | 2) => void
  newArtifacts: NewArtifactSummary[]
}

export default function MedeaTab({ user, setActiveTab, setTrainingStep, newArtifacts }: MedeaTabProps) {
  // PAGINATION LOGIC
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6 // Menghasilkan 2 baris x 3 kolom
  const totalPages = Math.ceil(AVAILABLE_SKILLS.length / itemsPerPage)
  
  // Mengambil skill khusus untuk halaman saat ini
  const currentSkills = AVAILABLE_SKILLS.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  )

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-green-500/20 pb-6 relative">
        <div className="absolute top-0 right-0 w-64 h-1 bg-gradient-to-r from-transparent to-green-500/50 blur-sm" />
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic flex items-center gap-4">
            <Activity className="w-10 h-10 text-green-500 animate-pulse drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
            MEDEA <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-700">COMMAND CORE</span>
          </h2>
          <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
             <Fingerprint className="w-3 h-3 text-green-500"/> Powered by OpenClaw Engine // v4.0.5_QUANTUM
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] text-green-500/50 font-bold uppercase tracking-widest mb-1">Grid Status</span>
            <div className="flex items-center gap-2 border border-green-500/20 bg-green-500/5 px-3 py-1 rounded-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <span className="text-green-500 text-xs font-black uppercase tracking-widest">SYNCHRONIZED</span>
            </div>
        </div>
      </div>

      {/* NOTIFIKASI ARTIFACT BARU - PAYLOAD MANIFEST */}
      {newArtifacts.length > 0 && (
        <div className="mb-10 bg-gradient-to-r from-green-500/10 to-transparent border-l-4 border-green-500 rounded-r-sm p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between shadow-[0_0_40px_rgba(34,197,94,0.15)] animate-in slide-in-from-top-4 fade-in duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(34,197,94,0.03)_50%,transparent_75%)] bg-[length:10px_10px]" />
          
          <div className="relative z-10 flex-1 md:pr-8">
            <h3 className="text-green-400 font-black uppercase tracking-widest text-xl flex items-center gap-2 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)] mb-2">
              <Zap className="w-6 h-6 fill-current" /> Economic Train Complete
            </h3>
            <p className="text-xs font-mono text-zinc-300 mb-4 md:mb-0">
              MEDEA has successfully extracted <span className="text-green-400 font-bold">{newArtifacts.length} new payload(s)</span>.
            </p>
          </div>

          <div className="relative z-10 w-full md:w-auto bg-black/60 border border-green-500/30 rounded-sm p-4 mb-6 md:mb-0 md:mr-6 flex-1 max-w-lg shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
             <span className="text-[9px] text-green-500/80 font-black tracking-[0.2em] uppercase mb-3 block border-b border-green-500/20 pb-2">Payload Manifest:</span>
             <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                 {newArtifacts.map((art, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-400 truncate w-1/2 pr-2" title={art.taskTitle}>{art.taskTitle}</span>
                        <span className="text-zinc-600 px-2">{"->"}</span>
                        <span className="text-green-400 truncate w-1/2 text-right" title={art.fileName}>{art.fileName}</span>
                    </div>
                 ))}
             </div>
          </div>

          <button onClick={() => setActiveTab('workspace')} className="relative z-10 flex items-center justify-center w-full md:w-auto gap-2 px-8 py-4 bg-green-500 text-black font-black uppercase tracking-[0.2em] rounded-sm hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.5)] cyber-button hover:scale-105 shrink-0">
            <FileText className="w-5 h-5" /> View Files
          </button>
        </div>
      )}

      {/* Main CTA Section */}
      <div className="bg-gradient-to-br from-[#050505] to-[#020202] border border-green-500/30 rounded-sm p-10 mb-12 relative overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-green-500/10 transition-colors duration-1000" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
             <div className="max-w-2xl">
                 <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4 flex items-center gap-3">
                    <TerminalSquare className="w-8 h-8 text-green-500" />
                    Engage Economic Training
                 </h3>
                 <p className="text-zinc-400 font-mono text-sm leading-relaxed mb-6">
                   Deploy MEDEA into the corporate Task Market. Equip her with verified OpenClaw skills—from Deep Research to Headless Browser Automation. Assign operational targets, and allow the AI engine to synthesize raw credits and artifacts.<br/><br/>
                   <span className="text-green-500 font-bold border-l-2 border-green-500 pl-3">Lethal execution. Powered by OpenClaw ecosystem.</span>
                 </p>
             </div>
             <button onClick={() => { setTrainingStep(1); setActiveTab('tools') }} className="w-full md:w-auto flex flex-col items-center justify-center gap-2 px-12 py-6 bg-green-500 text-black font-black uppercase tracking-[0.2em] rounded-sm hover:bg-green-400 hover:shadow-[0_0_50px_rgba(34,197,94,0.6)] transition-all cyber-button hover:scale-105 group/btn shrink-0">
               <div className="flex items-center gap-3 text-lg">
                  <Play className="w-6 h-6 fill-current group-hover/btn:animate-pulse" /> Initialize Link
               </div>
               <span className="text-[9px] font-mono font-bold text-black/60">ACCESS OPENCLAW REGISTRY</span>
             </button>
          </div>
      </div>

      {/* PAGINATION GRID: OPENCLAW ARSENAL */}
      <div className="mb-4 flex items-center gap-3">
         <Network className="w-6 h-6 text-green-500" />
         <h3 className="text-2xl font-black text-white uppercase tracking-tighter">OpenClaw Neural Arsenal</h3>
         <div className="h-[1px] flex-1 bg-gradient-to-r from-green-500/20 to-transparent ml-4" />
      </div>
      <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-6">Explore all {AVAILABLE_SKILLS.length} verified modules ready for deployment.</p>

      {/* Grid Container: 3 Columns (lg), 2 Rows = 6 Cards per page */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 min-h-[400px]">
        {currentSkills.map((skill, idx) => (
           <div key={idx} className="bg-[#050505] border border-green-500/20 rounded-sm p-6 relative overflow-hidden group hover:border-green-500/50 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] transition-all duration-300 flex flex-col justify-between">
              <div>
                  <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(transparent_50%,rgba(34,197,94,0.02)_50%)] bg-[length:100%_4px] pointer-events-none" />
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                     <ShieldCheck className="w-6 h-6 text-zinc-600 group-hover:text-green-500 transition-colors" />
                     <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border border-green-500/30 text-green-500 rounded-sm bg-green-500/5 group-hover:bg-green-500/20 transition-all">
                        READY
                     </span>
                  </div>
                  
                  <div className="relative z-10">
                     <h4 className="text-lg font-black text-white uppercase tracking-tight mb-1 group-hover:text-green-400 transition-colors truncate" title={skill.name}>{skill.name}</h4>
                     <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest truncate block" title={skill.category}>{skill.category}</span>
                  </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-green-500/10 relative z-10">
                 <p className="text-[11px] font-mono text-zinc-400 leading-relaxed line-clamp-2" title={skill.description}>
                    {skill.description}
                 </p>
              </div>
           </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
         <div className="flex items-center justify-center gap-4 pt-4">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)} 
              className="p-3 border border-green-500/20 text-green-500 disabled:opacity-30 disabled:hover:bg-transparent hover:bg-green-500/10 rounded-sm transition-colors"
            >
               <ChevronLeft className="w-5 h-5"/>
            </button>
            <div className="flex flex-col items-center justify-center">
               <span className="text-xs font-mono text-green-500 font-bold tracking-widest uppercase">Page {currentPage} of {totalPages}</span>
               <div className="flex gap-1 mt-2">
                 {Array.from({ length: totalPages }).map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all ${currentPage === i + 1 ? 'w-6 bg-green-500' : 'w-2 bg-green-500/20'}`} />
                 ))}
               </div>
            </div>
            <button 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(p => p + 1)} 
              className="p-3 border border-green-500/20 text-green-500 disabled:opacity-30 disabled:hover:bg-transparent hover:bg-green-500/10 rounded-sm transition-colors"
            >
               <ChevronRight className="w-5 h-5"/>
            </button>
         </div>
      )}

    </div>
  )
}