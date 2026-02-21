import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { InteractiveBackground } from '../components/InteractiveBackground'
import DashboardTab from '../components/DashboardTab'
import ActiveMissionTab from '../components/ActiveMissionTab'
import InboxTab from '../components/InboxTab'
import TaskMarket from '../components/TaskMarket'
import WorkspaceTab from '../components/WorkspaceTab'
import MemoryTab from '../components/MemoryTab'
import ToolsTab from '../components/ToolsTab'
import MedeaTab from '../components/MedeaTab'
import LocalDeployTab from '../components/LocalDeployTab'
import { Menu, Wallet, Activity, Brain, Target, Folder, Database, Server, XCircle, BarChart3 } from 'lucide-react'
import { supabase, INITIAL_TASKS } from '../lib/supabase'
import { User, Task, Transaction, AgentLog, VirtualFile, ChatMessage, AgentMemory } from '../types'

export default function Dashboard() {
  const navigate = useNavigate()
  
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([])
  
  const [activeTab, setActiveTab] = useState<'dashboard'|'medea'|'tools'|'tasks'|'workspace'|'memory'|'local_deploy'|'inbox'|'active_mission'>('dashboard')
  
  const [trainingStep, setTrainingStep] = useState<0 | 1 | 2>(0)
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]) 
  const [newArtifactIds, setNewArtifactIds] = useState<string[]>([])

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [runningTool, setRunningTool] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [virtualFiles, setVirtualFiles] = useState<VirtualFile[]>([])
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [agentMemories, setAgentMemories] = useState<AgentMemory[]>([])
  const [medeaStatus, setMedeaStatus] = useState<'idle' | 'processing' | 'auto'>('idle')

  const fetchDatabaseData = useCallback(async () => {
    if (!user) return
    const { data: stats } = await supabase.from('user_stats').select('*').eq('username', user.username).single()
    if (stats) setUser(prev => prev ? { ...prev, balance: stats.balance, tasksCompleted: stats.tasks_completed, totalEarnings: stats.total_earnings } : null)
    
    const { data: chats } = await supabase.from('chat_messages').select('*').eq('username', user.username).order('created_at', { ascending: true })
    if (chats) setChatMessages(chats.map(c => ({ id: c.id, sender: c.sender, text: c.text, timestamp: c.created_at })))
    
    const { data: files } = await supabase.from('virtual_files').select('*').eq('username', user.username).order('updated_at', { ascending: false })
    if (files) setVirtualFiles(files.map(f => ({ id: f.id, name: f.name, content: f.content, updatedAt: f.updated_at })))
    
    const { data: memories } = await supabase.from('agent_memories').select('*').order('created_at', { ascending: false })
    if (memories) setAgentMemories(memories.map(m => ({ id: m.id, topic: m.topic, details: m.details, timestamp: m.created_at })))
  }, [user])

  useEffect(() => {
    const storedUser = localStorage.getItem('clawmanager_user')
    if (!storedUser) { navigate('/login'); return; }
    setUser(JSON.parse(storedUser))
    const storedTasks = localStorage.getItem('clawmanager_tasks')
    setTasks(storedTasks ? JSON.parse(storedTasks) : INITIAL_TASKS)
  }, [navigate])

  useEffect(() => { if (user?.username) fetchDatabaseData() }, [user?.username, fetchDatabaseData])

  const handleLogout = () => {
    localStorage.removeItem('clawmanager_user')
    navigate('/login')
  }

  if (!user) return null

  const navItems = [
    { id: 'dashboard',  icon: BarChart3,     label: 'OPERATIONS' },
    { id: 'medea',      icon: Activity,      label: 'MEDEA' },
    { id: 'tools',      icon: Brain,         label: 'AGENT TOOLS' },
    { id: 'tasks',      icon: Target,        label: 'TASK MARKET' },
    { id: 'workspace',  icon: Folder,        label: 'V-WORKSPACE' },
    { id: 'memory',     icon: Database,      label: 'NEURAL MEMORY' },
  ]

  return (
    <div className="min-h-screen bg-[#020202] text-white flex font-mono selection:bg-green-500 selection:text-black">
      <InteractiveBackground />
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-[#050505]/95 backdrop-blur-xl border-r border-green-500/20 transition-transform duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-[10px_0_30px_rgba(0,0,0,0.5)] flex flex-col`}>
        <div className="p-6 border-b border-green-500/10 shrink-0">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-sm overflow-hidden border border-green-500/40 shadow-[0_0_15px_rgba(57,255,20,0.4)] transition-all duration-300 transform -rotate-3 shrink-0">
              <img src="/logo.jpeg" alt="CLAW MGR" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter text-white">CLAW<span className="text-green-500">MGR</span></span>
              <span className="text-[10px] text-green-500/50 -mt-1 font-bold italic">NEURAL INTERFACE</span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1 mt-4 flex-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 group relative overflow-hidden ${activeTab === item.id ? 'bg-green-500/10 text-green-400' : 'text-zinc-500 hover:text-green-300 hover:bg-green-500/5'}`}>
              {activeTab === item.id && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" />}
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-green-400' : 'group-hover:text-green-400'}`} />
              <span className="text-xs font-bold tracking-widest">{item.label}</span>
            </button>
          ))}
          <div className="my-6 h-[1px] w-full bg-green-500/10" />
          <button onClick={() => setActiveTab('local_deploy')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 group border border-dashed ${activeTab === 'local_deploy' ? 'bg-green-500/10 text-green-400 border-green-500/50' : 'border-green-500/20 text-zinc-400 hover:text-green-300 hover:bg-green-500/5'}`}>
            <Server className="w-5 h-5" /> <span className="text-xs font-bold tracking-widest uppercase">Local Deploy</span>
          </button>
        </nav>
        
        <div className="shrink-0 p-4 border-t border-green-500/10 bg-black/40">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-sm text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors">
            <XCircle className="w-5 h-5" /> <span className="text-xs font-bold tracking-widest uppercase">Disconnect</span>
          </button>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col h-screen transition-all duration-300 relative z-10 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="sticky top-0 z-30 bg-[#050505]/95 backdrop-blur-md border-b border-green-500/10 px-6 py-4 flex justify-between items-center transition-all duration-300">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-sm hover:bg-green-500/10 text-green-500 border border-green-500/20"><Menu className="w-5 h-5"/></button>
            <h1 className="text-sm font-black tracking-[0.2em] text-white uppercase italic">{activeTab} <span className="text-green-500">_SESSION</span></h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 rounded-sm bg-green-500/5 border border-green-500/20 backdrop-blur-sm group">
              <Wallet className="w-4 h-4 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
              <span className="font-mono font-black text-green-500">Ð{user.balance.toFixed(2)}</span>
            </div>
          </div>
        </header>

        <div className="p-8 pb-20 relative overflow-y-auto custom-scrollbar flex-1 z-10">
          {activeTab === 'dashboard' && <DashboardTab user={user} agentLogs={agentLogs} novaStatus={medeaStatus} runningTool={runningTool} setAgentLogs={setAgentLogs} setActiveTab={setActiveTab} />}
          
          {activeTab === 'medea' && (
            <MedeaTab user={user} setActiveTab={setActiveTab} setTrainingStep={setTrainingStep} newArtifactIds={newArtifactIds} />
          )}

          {activeTab === 'tools' && (
            <ToolsTab user={user} runningTool={runningTool} purchaseUpgrade={() => {}} setActiveTab={setActiveTab} trainingStep={trainingStep} setTrainingStep={setTrainingStep} selectedSkillIds={selectedSkillIds} setSelectedSkillIds={setSelectedSkillIds} />
          )}

          {activeTab === 'tasks' && (
            <TaskMarket 
              tasks={tasks} 
              user={user} 
              setActiveTab={setActiveTab} 
              trainingStep={trainingStep}
              selectedSkillIds={selectedSkillIds}
              onCompleteTraining={async (completedTasks, totalReward) => {
                 
                 await new Promise(r => setTimeout(r, 2000));

                 // MENGGUNAKAN updated_at UNTUK MEMPERBAIKI ERROR 400
                 const { data: latestFiles } = await supabase
                    .from('virtual_files')
                    .select('id')
                    .eq('username', user.username)
                    .order('updated_at', { ascending: false })
                    .limit(completedTasks.length);

                 if (latestFiles) {
                     setNewArtifactIds(latestFiles.map(f => f.id));
                 }

                 await fetchDatabaseData();
                 
                 const newBalance = user.balance + totalReward;
                 const newTasksCompleted = user.tasksCompleted + completedTasks.length;
                 const newTotalEarnings = user.totalEarnings + totalReward;
                 
                 const updatedUser = { ...user, balance: newBalance, tasksCompleted: newTasksCompleted, totalEarnings: newTotalEarnings };
                 setUser(updatedUser);
                 localStorage.setItem('clawmanager_user', JSON.stringify(updatedUser));
                 
                 await supabase.from('user_stats').update({ 
                    balance: newBalance, tasks_completed: newTasksCompleted, total_earnings: newTotalEarnings 
                 }).eq('username', user.username);
                 
                 const newTasks = tasks.map(t => completedTasks.find(c => c.id === t.id) ? { ...t, status: 'completed' } : t);
                 setTasks(newTasks);
                 localStorage.setItem('clawmanager_tasks', JSON.stringify(newTasks));
                 
                 setTrainingStep(0);
                 setSelectedSkillIds([]);
                 
                 setActiveTab('medea');
              }}
            />
          )}

          {activeTab === 'workspace' && <WorkspaceTab virtualFiles={virtualFiles} selectedFile={selectedFile} setSelectedFile={setSelectedFile} newArtifactIds={newArtifactIds} setNewArtifactIds={setNewArtifactIds} />}
          {activeTab === 'memory' && <MemoryTab agentMemories={agentMemories} />}
          {activeTab === 'local_deploy' && <LocalDeployTab user={user} />}
        </div>
      </main>
    </div>
  )
}