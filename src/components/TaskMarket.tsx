import { useState, useEffect, useRef } from 'react'
import { Target, CheckSquare, Square, ShoppingCart, X, Play, Lock, ChevronLeft, ChevronRight, Filter, Activity, TerminalSquare } from 'lucide-react'
import { Task, User } from '../types'
import { AVAILABLE_SKILLS } from './ToolsTab'
import { supabase } from '../lib/supabase'

interface TaskMarketProps {
  tasks: Task[]
  user: User
  setActiveTab: (tab: any) => void
  onCompleteTraining: (completedTasks: Task[], totalReward: number) => void
  trainingStep: 0 | 1 | 2
  selectedSkillIds: number[]
}

export default function TaskMarket({ tasks, user, setActiveTab, onCompleteTraining, trainingStep, selectedSkillIds }: TaskMarketProps) {
  const [selectedTasks, setSelectedTasks] = useState<number[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isTraining, setIsTraining] = useState(false)
  const [animText, setAnimText] = useState<{text: string, color: string}[]>([])
  const terminalEndRef = useRef<HTMLDivElement>(null)

  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const availableTasks = tasks.filter(t => t.status === 'open')
  const categories = ['All', ...Array.from(new Set(availableTasks.map(t => t.sector)))]
  const filteredTasks = availableTasks.filter(t => selectedCategory === 'All' || t.sector === selectedCategory)
  
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)
  const currentTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => { setCurrentPage(1) }, [selectedCategory])
  useEffect(() => { if (terminalEndRef.current) terminalEndRef.current.scrollIntoView({ behavior: 'smooth' }) }, [animText])

  if (trainingStep < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in zoom-in-95">
         <div className="relative mb-6"><Lock className="w-20 h-20 text-red-500/20 absolute -inset-2 animate-ping" /><Lock className="w-16 h-16 text-zinc-700 relative z-10" /></div>
         <h2 className="text-2xl font-black text-red-500 uppercase tracking-widest mb-2 neon-glow-red">ACCESS DENIED</h2>
         <p className="text-zinc-500 font-mono text-xs mb-8">You must complete Phase 1: Skill Injection before selecting combat targets.</p>
         <button onClick={() => setActiveTab('tools')} className="px-6 py-3 border border-green-500 text-green-500 font-black uppercase tracking-widest rounded-sm hover:bg-green-500 hover:text-black transition-all">Return to Phase 1</button>
      </div>
    )
  }

  const toggleTask = (taskId: number) => setSelectedTasks(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId])
  const selectedTasksData = tasks.filter(t => selectedTasks.includes(t.id))
  const totalPotentialReward = selectedTasksData.reduce((sum, t) => sum + t.reward, 0)

  // --- HELPER UNTUK ANIMASI TERMINAL ---
  const addLog = (text: string, color: string = 'text-green-500') => {
      setAnimText(prev => [...prev, { text, color }])
  }
  
  const updateLastLog = (text: string, color: string = 'text-green-500') => {
      setAnimText(prev => [...prev.slice(0, -1), { text, color }])
  }

  const generateHexStream = () => {
     const chars = '0123456789ABCDEF!@#$%^&*'
     return Array.from({length: 40}).map(() => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  const getProgressBar = (percent: number) => {
      const totalBlocks = 30;
      const filled = Math.floor((percent / 100) * totalBlocks);
      return '[' + '█'.repeat(filled) + '░'.repeat(totalBlocks - filled) + `] ${percent.toString().padStart(3, '0')}%`;
  }

  // --- LOGIKA UTAMA TRAINING (API PANGGILAN) ---
  const startTrainingSequence = async () => {
    setIsCartOpen(false)
    setIsTraining(true)
    
    // 1. Initial Boot Sequence
    addLog('> INITIATING MEDEA NEURAL LINK...', 'text-green-500')
    await new Promise(r => setTimeout(r, 600))
    addLog('> ALLOCATING CLOUD COMPUTE RESOURCES...', 'text-zinc-400')
    await new Promise(r => setTimeout(r, 800))
    
    const activeSkills = AVAILABLE_SKILLS.filter(s => selectedSkillIds.includes(s.id)).map(s => s.name).join(', ')
    addLog(`> INJECTING MODULES: [${activeSkills}]`, 'text-amber-500')
    
    // Fake Module Loading Bar
    addLog('> MOUNTING...', 'text-green-400')
    for(let i=0; i<=100; i+=20) {
        updateLastLog(`> MOUNTING MODULES: ${getProgressBar(i)}`, 'text-amber-500')
        await new Promise(r => setTimeout(r, 200))
    }
    await new Promise(r => setTimeout(r, 500))

    // 2. Loop per Task
    for (const task of selectedTasksData) {
       addLog(`\n==================================================`, 'text-zinc-600')
       addLog(`> TARGET ACQUIRED: [${task.title.toUpperCase()}]`, 'text-green-400 font-bold')
       addLog(`> SECTOR: ${task.sector.toUpperCase()}`, 'text-zinc-400')
       await new Promise(r => setTimeout(r, 800))
       
       addLog(`> BYPASSING FIREWALLS...`, 'text-zinc-500')
       await new Promise(r => setTimeout(r, 600))
       updateLastLog(`> BYPASSING FIREWALLS... [ACCESS GRANTED]`, 'text-green-500')
       
       addLog(`> ENGAGING OPENROUTER AI CORE (Gemini 2.0 Flash)...`, 'text-amber-500')
       
       // ANIMASI LOADING MATRIX SAMBIL NUNGGU API
       addLog(`> SYNTHESIZING...`, 'text-green-900') 
       let isApiDone = false;
       let matrixInterval = setInterval(() => {
          if(!isApiDone) updateLastLog(`> DECORTICATING: ${generateHexStream()}`, 'text-green-700/80')
       }, 80) // Matrix ganti sangat cepat

       try {
           // PANGGIL EDGE FUNCTION
           const prompt = `Task: ${task.title}. Sector: ${task.sector}. Assigned Neural Skills: ${activeSkills}. 
           You are MEDEA. Generate a highly detailed artifact resolving this task. If it's a tech/web task, output realistic CODE. If it's content, output realistic COPY.`
           
           const taskType = task.sector.toLowerCase().includes('web') || task.sector.toLowerCase().includes('data') ? 'code_task' : 'writing_task';

           // API CALL
           const { error } = await supabase.functions.invoke('rapid-handler', {
               body: { text: prompt, username: user.username, taskType }
           })

           isApiDone = true;
           clearInterval(matrixInterval)

           if (error) throw error

           updateLastLog(`> SYNTHESIS COMPLETE. ARTIFACT COMPILED.`, 'text-green-400 font-bold')
           addLog(`> REWARD CLAIMED: +Ð${task.reward.toFixed(2)}`, 'text-amber-500 font-black text-lg')
           
       } catch (err) {
           isApiDone = true;
           clearInterval(matrixInterval)
           updateLastLog(`> ERROR: NEURAL LINK INTERRUPTED.`, 'text-red-500 font-bold')
       }
       await new Promise(r => setTimeout(r, 1200))
    }
    
    // 3. Finalization
    addLog('\n==================================================', 'text-zinc-600')
    addLog('> ENCRYPTING SESSION DATA...', 'text-zinc-500')
    await new Promise(r => setTimeout(r, 800))
    addLog('> PUSHING ARTIFACTS TO V-WORKSPACE...', 'text-amber-500')
    await new Promise(r => setTimeout(r, 1500))
    addLog('> CONNECTION SEVERED. RETURNING TO COMMAND CORE.', 'text-green-500 font-bold')
    await new Promise(r => setTimeout(r, 1500)) // Jeda sebelum redirect
    
    // Selesai Animasi, eksekusi callback untuk fetch DB & Redirect
    onCompleteTraining(selectedTasksData, totalPotentialReward)
  }

  if (isTraining) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#020202] text-green-500 font-mono p-8 flex flex-col justify-center animate-in fade-in duration-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.15)_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto w-full relative z-10">
          <div className="flex items-center gap-4 mb-6 border-b border-green-500/30 pb-4">
             <Activity className="w-10 h-10 animate-pulse text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
             <h2 className="text-3xl font-black tracking-[0.3em] uppercase italic text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">MEDEA // COMBAT_ENGAGEMENT</h2>
          </div>
          <div className="bg-[#050505] border border-green-500/50 p-8 rounded-sm shadow-[0_0_50px_rgba(34,197,94,0.15)] h-[60vh] overflow-y-auto custom-scrollbar relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-[pulse_2s_ease-in-out_infinite]" />
             {animText.map((line, idx) => (
                <div key={idx} className={`mb-2 text-sm leading-relaxed tracking-wider ${line.color} drop-shadow-md`}>
                   {line.text}
                </div>
             ))}
             <div ref={terminalEndRef} />
             <div className="mt-4 w-4 h-6 bg-green-500 animate-[pulse_0.8s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in pb-32">
      <div className="sticky top-0 z-20 bg-[#020202]/95 backdrop-blur-md pt-4 pb-6 border-b border-green-500/20 mb-8 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black px-2 py-0.5 bg-green-500/20 text-green-500 tracking-widest uppercase animate-pulse">Phase 2: Target Lock</span>
          <h2 className="text-3xl font-black text-white uppercase italic flex items-center gap-3 mt-2"><Target className="w-8 h-8 text-green-500" /> Target <span className="text-green-500">Market</span></h2>
        </div>
        <button onClick={() => setIsCartOpen(true)} className="relative flex items-center gap-3 px-6 py-3 bg-green-500 text-black rounded-sm hover:bg-green-400 transition-all font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.3)] cyber-button">
          <ShoppingCart className="w-5 h-5" /> View Targets
          {selectedTasks.length > 0 && <span className="absolute -top-2 -right-2 bg-amber-500 text-black w-6 h-6 flex items-center justify-center rounded-full text-xs animate-bounce border-2 border-[#020202]">{selectedTasks.length}</span>}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 custom-scrollbar">
         <div className="flex items-center gap-2 mr-4 text-zinc-500"><Filter className="w-4 h-4"/> <span className="text-xs uppercase font-bold tracking-widest">Filter:</span></div>
         {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-sm whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-[#050505] text-zinc-500 border-green-500/10 hover:border-green-500/30'}`}>{cat}</button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {currentTasks.map((task) => {
          const isSelected = selectedTasks.includes(task.id)
          return (
            <div key={task.id} onClick={() => toggleTask(task.id)} className={`p-6 rounded-sm border transition-all cursor-pointer group ${isSelected ? 'bg-green-500/10 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]' : 'bg-[#050505] border-green-500/10 hover:border-green-500/30 hover:bg-green-500/5'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="mt-1">{isSelected ? <CheckSquare className="w-5 h-5 text-green-500" /> : <Square className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400" />}</div>
                  <div className="flex flex-col"><span className="text-[9px] text-green-500/60 uppercase font-bold tracking-widest mb-1">{task.sector}</span><h3 className={`text-sm font-black uppercase tracking-tight ${isSelected ? 'text-green-400' : 'text-zinc-300'}`}>{task.title}</h3></div>
                </div>
                <div className="text-right shrink-0 ml-4"><span className="text-lg font-black text-amber-500 tracking-tighter">Ð{task.reward}</span></div>
              </div>
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
         <div className="flex items-center justify-center gap-4 border-t border-green-500/10 pt-8">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border border-green-500/20 text-green-500 disabled:opacity-30 hover:bg-green-500/10"><ChevronLeft className="w-5 h-5"/></button>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border border-green-500/20 text-green-500 disabled:opacity-30 hover:bg-green-500/10"><ChevronRight className="w-5 h-5"/></button>
         </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#050505] border border-green-500/50 rounded-sm w-full max-w-lg p-8 relative shadow-[0_0_80px_rgba(34,197,94,0.2)]">
            <button onClick={() => setIsCartOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-red-500"><X className="w-5 h-5" /></button>
            <h3 className="text-2xl font-black text-white uppercase italic mb-8 flex items-center gap-3"><TerminalSquare className="w-6 h-6 text-green-500" /> Pre-Flight Summary</h3>
            
            {selectedTasks.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 font-mono text-sm border border-dashed border-zinc-800">NO TARGETS ACQUIRED</div>
            ) : (
               <>
                  <div className="space-y-3 mb-8 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                     {selectedTasksData.map(t => (
                        <div key={t.id} className="flex justify-between items-center bg-green-500/5 p-3 border border-green-500/20 rounded-sm">
                           <span className="text-xs text-zinc-300 font-mono truncate max-w-[250px]">{t.title}</span>
                           <span className="text-sm font-black text-amber-500">Ð{t.reward}</span>
                        </div>
                     ))}
                  </div>
                  <div className="flex justify-between items-end border-t border-green-500/20 pt-4 mb-8">
                     <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Est. Gross Yield</span>
                     <span className="text-4xl font-black text-green-400 tracking-tighter drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">Ð{totalPotentialReward.toFixed(2)}</span>
                  </div>
                  <button onClick={startTrainingSequence} className="w-full py-5 bg-green-500 text-black font-black uppercase tracking-[0.2em] cyber-button hover:bg-green-400 hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] transition-all">
                     <Play className="w-5 h-5 inline mr-3"/> ENGAGE TRAINING
                  </button>
               </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}