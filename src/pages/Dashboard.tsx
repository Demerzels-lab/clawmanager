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
import {
  Terminal, Zap, Brain, BookOpen, Menu, X, Search,
  Activity, Wallet, Clock, TrendingUp, RotateCcw, CheckCircle, XCircle, Target, BarChart3,
  Folder, MessageSquare, FileText, Send, Database
} from 'lucide-react'
import { supabase, TOOL_COSTS, INITIAL_TASKS } from '../lib/supabase'
import { User, Task, Transaction, AgentLog, VirtualFile, ChatMessage, AgentMemory } from '../types'

export default function Dashboard() {
  const navigate = useNavigate()
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([])
  const [activeTab, setActiveTab] = useState<'dashboard'|'tasks'|'tools'|'workspace'|'inbox'|'memory'|'active_mission'>('dashboard')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [runningTool, setRunningTool] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [codingAnimation, setCodingAnimation] = useState(false)
  const [animationText, setAnimationText] = useState('')
  const [toolResult, setToolResult] = useState<{name: string, output: string} | null>(null)
  const [animatingMsgId, setAnimatingMsgId] = useState<string | null>(null)

  // AI States
  const [virtualFiles, setVirtualFiles] = useState<VirtualFile[]>([])
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [agentMemories, setAgentMemories] = useState<AgentMemory[]>([])
  const [chatInput, setChatInput] = useState('')
  const [earnNotification, setEarnNotification] = useState<{ amount: number; task: string } | null>(null)
  const [novaStatus, setNovaStatus] = useState<'idle' | 'processing' | 'auto'>('idle')
  // 'thinking' = normal chat, 'code' = coding/technical task, 'text' = writing/copywriting task
  const [animationType, setAnimationType] = useState<'thinking' | 'code' | 'text'>('thinking')
  const autoTaskRef = useRef<() => void>(() => {})

  // Keep auto-task fn fresh every render so it always captures latest state
  autoTaskRef.current = () => {
    if (!user) return
    const openTasks = tasks.filter(t => t.status === 'open')
    if (openTasks.length === 0) return
    
    const task = openTasks[Math.floor(Math.random() * openTasks.length)]
    const toolMultiplier = 1 + ((user.ownedTools?.length || 0) * 0.15); // Setiap tool nambah +15% earning
    const baseReward = Math.random() * 3.5 + 0.3;
    const autoReward = parseFloat((baseReward * toolMultiplier).toFixed(2));
    const now = new Date().toISOString()
    const uname = user.username

    // Tampilkan UI Nova sedang memproses
    setNovaStatus('auto')
    setAgentLogs(prev => [...prev,
      { id: Date.now(), tool: 'AUTO_SCAN', output: `[NOVA] Sector_${task.sector.replace(/ /g,'_')} — bg op: "${task.title.substring(0, 40)}..."`, timestamp: now }
    ])

    // Panggil Edge Function Auto-Worker di latar belakang secara asinkron (tidak memblokir UI)
    supabase.functions.invoke('auto-worker', {
      body: { username: uname, taskTitle: task.title, sector: task.sector, reward: autoReward }
    }).then(({ data, error }) => {
      if (!error && data?.success) {
        // Setelah AI selesai, update UI Balance & Notifikasi
        setAgentLogs(prev => [...prev,
          { id: Date.now() + 1, tool: 'CREDIT', output: `Micro-contract settled autonomously: +Ð${autoReward} | Output: ${data.file}`, timestamp: new Date().toISOString() }
        ])
        
        setUser(prev => {
          if (!prev) return prev
          const updated = { ...prev, balance: parseFloat((prev.balance + autoReward).toFixed(2)) }
          localStorage.setItem('clawmanager_user', JSON.stringify(updated))
          return updated
        })
        
        setEarnNotification({ amount: autoReward, task: task.title })
        setTimeout(() => setEarnNotification(null), 4000)
        
        // Refresh data database agar file baru muncul di Workspace tanpa di-refresh manual
        fetchDatabaseData()
      }
    }).finally(() => {
      setTimeout(() => setNovaStatus('idle'), 1000)
    })
  }

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
    const timeoutId = setTimeout(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [chatMessages, animatingMsgId, animationText, activeTab])

  const fetchDatabaseData = useCallback(async () => {
    if (!user) return
    
    // 1. Fetch Stats from Supabase
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('username', user.username)
      .single()

    if (stats) {
      setUser(prev => prev ? { ...prev, balance: stats.balance, tasksCompleted: stats.tasks_completed, totalEarnings: stats.total_earnings } : null)
    } else if (statsError && statsError.code === 'PGRST116') {
      await supabase.from('user_stats').insert([{ username: user.username, balance: 100.00 }])
    }

    // 2. Fetch Chat History
    const { data: chats } = await supabase.from('chat_messages')
      .select('*')
      .eq('username', user.username)
      .order('created_at', { ascending: true })
    if (chats) setChatMessages(chats.map(c => ({ id: c.id, sender: c.sender, text: c.text, timestamp: c.created_at })))

    // 3. Fetch Files
    const { data: files } = await supabase.from('virtual_files')
      .select('*')
      .eq('username', user.username)
      .order('updated_at', { ascending: false })
    if (files) setVirtualFiles(files.map(f => ({ id: f.id, name: f.name, content: f.content, updatedAt: f.updated_at })))

    // 4. Fetch Memories
    const { data: memories } = await supabase.from('agent_memories')
      .select('*')
      .order('created_at', { ascending: false })
    if (memories) setAgentMemories(memories.map(m => ({ id: m.id, topic: m.topic, details: m.details, timestamp: m.created_at })))
  }, [user])

  useEffect(() => {
    const storedUser = localStorage.getItem('clawmanager_user')
    if (!storedUser) { navigate('/login'); return; }
    const parsedUser = JSON.parse(storedUser)
    setUser(parsedUser)
    
    const storedTasks = localStorage.getItem('clawmanager_tasks')
    const storedTransactions = localStorage.getItem('clawmanager_transactions')
    const storedLogs = localStorage.getItem('clawmanager_logs')
    
    setTasks(storedTasks ? JSON.parse(storedTasks) : INITIAL_TASKS)
    setTransactions(storedTransactions ? JSON.parse(storedTransactions) : [])
    setAgentLogs(storedLogs ? JSON.parse(storedLogs) : [])
  }, [navigate])

  useEffect(() => {
    if (user?.username) {
      fetchDatabaseData()
    }
  }, [user?.username, fetchDatabaseData])

  useEffect(() => {
    if (!user?.username) return
    setAgentLogs(prev => prev.length > 0 ? prev : [
      { id: -3, tool: 'BOOT',   output: `NOVA_v4.0.5 — Neural link initialized // OPERATOR: ${user.username.toUpperCase()}`, timestamp: new Date(Date.now() - 3000).toISOString() },
      { id: -2, tool: 'SYNC',   output: 'Global knowledge base synced — collective memory ready', timestamp: new Date(Date.now() - 2000).toISOString() },
      { id: -1, tool: 'STATUS', output: 'All sectors online. Autonomous routines armed. Awaiting directive...', timestamp: new Date(Date.now() - 500).toISOString() },
    ])
    const first    = setTimeout(() => autoTaskRef.current(), 12000)
    const interval = setInterval(() => autoTaskRef.current(), 45000)
    return () => { clearTimeout(first); clearInterval(interval) }
  }, [user?.username])

  const saveData = useCallback((newUser: User, newTasks: Task[], newTransactions: Transaction[], newLogs: AgentLog[]) => {
    localStorage.setItem('clawmanager_user', JSON.stringify(newUser))
    localStorage.setItem('clawmanager_tasks', JSON.stringify(newTasks))
    localStorage.setItem('clawmanager_transactions', JSON.stringify(newTransactions))
    localStorage.setItem('clawmanager_logs', JSON.stringify(newLogs))
  }, [])

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !user) return
    const userText = chatInput.trim()
    const currentUsername = user.username
    
    setChatInput('')
    const msgId = `nova-reply-${Date.now()}`
    setChatMessages(prev => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', text: userText, timestamp: new Date().toISOString() },
      { id: msgId, sender: 'agent', text: 'UPLINKING...', timestamp: new Date().toISOString() }
    ])
    setAnimatingMsgId(msgId)
    setAnimationType('thinking')
    setAnimationText('')
    setNovaStatus('processing')

    const startTime = Date.now()
    let apiDone = false

    const apiPromise = supabase.functions.invoke('rapid-handler', {
      body: { text: userText, username: currentUsername, taskType: 'chat' }
    }).then(({ error }) => {
      if (error) throw error
    }).finally(() => {
      apiDone = true
    })

    const thinkingFrames = [
      'Uplink established', 'Uplink established .', 'Uplink established . .', 'Uplink established . . .',
      'Scanning neural deposits', 'Scanning neural deposits .', 'Scanning neural deposits . .', 'Scanning neural deposits . . .',
      'Formulating response', 'Formulating response .', 'Formulating response . .', 'Formulating response . . .',
    ]
    let animLoop = true
    const runAnimation = async () => {
      let i = 0
      while (animLoop) {
        setAnimationText(thinkingFrames[i % thinkingFrames.length])
        i++
        await new Promise(r => setTimeout(r, 420))
        const elapsed = Date.now() - startTime
        if (apiDone && elapsed >= 2000) animLoop = false
      }
    }

    try {
      await Promise.all([ apiPromise, runAnimation(), new Promise(r => setTimeout(r, 2000)) ])
      setAnimatingMsgId(null)
      setNovaStatus('idle')
      fetchDatabaseData()
    } catch (error) {
      animLoop = false
      console.error('Agent Comm-Link Error:', error)
      setAnimatingMsgId(null)
      setNovaStatus('idle')
      setChatMessages(prev => prev.filter(m => m.id !== msgId))
      setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: 'system', text: 'ERROR: Agent Uplink Interrupted.', timestamp: new Date().toISOString() }])
    }
  }

  const purchaseUpgrade = async (toolName: string) => {
    if (!user) return
    const cost = TOOL_COSTS[toolName as keyof typeof TOOL_COSTS]
    
    // Validasi
    if (user.balance < cost) return alert('Insufficient balance for this Neural Upgrade!')
    if (user.ownedTools?.includes(toolName)) return alert('Module already integrated into Nova!')
    
    setRunningTool(toolName)
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulasi instalasi
    
    const timestamp = new Date().toISOString()
    const newOwnedTools = [...(user.ownedTools || []), toolName]
    const newBalance = user.balance - cost

    const newLog: AgentLog = { id: Date.now(), tool: 'SYS_UPGRADE', output: `Module [${toolName.toUpperCase()}] successfully integrated. Auto-Earn Multiplier increased!`, timestamp }
    const newTransaction: Transaction = { id: Date.now(), timestamp, type: 'upgrade_purchase', tool: toolName, amount: -cost, description: `Integrated ${toolName}` }
    
    // Update ke Supabase (Note: Tambahkan kolom 'owned_tools' tipe JSONB di table user_stats jika ingin permanen di DB, sementara kita simpan di LocalStorage)
    await supabase.from('user_stats').update({ balance: newBalance }).eq('username', user.username)

    const updatedUser = { ...user, balance: newBalance, ownedTools: newOwnedTools }
    
    setUser(updatedUser)
    setAgentLogs(prev => [...prev, newLog])
    setTransactions(prev => [...prev, newTransaction])
    saveData(updatedUser, tasks, transactions, agentLogs) // Helper save
    setRunningTool(null)
  }

  const completeTask = async (task: Task) => {
    if (!user) return
    setRunningTool('completing')
    setCodingAnimation(true)
    
    // 1. Redirect to ACTIVE MISSION SPLIT SCREEN immediately
    setSelectedTask(null)
    setActiveTab('active_mission')
    setAnimationText('')
    
    // 2. Send prompt in the background silently
    const autoPrompt = `[SYSTEM_TASK_ASSIGNMENT] Please execute the following task: "${task.title}" in ${task.sector} Sector. Use CREATE_FILE and ADD_MEMORY.`

    // Classify task animation type
    const WRITING_KEYWORDS = ['copywriting', 'copywrite', 'content', 'marketing', 'creative', 'writing', 'media', 'editorial', 'blog', 'article', 'social', 'copy']
    const isWritingTask = WRITING_KEYWORDS.some(k =>
      task.sector.toLowerCase().includes(k) || task.title.toLowerCase().includes(k)
    )
    const taskAnimType: 'code' | 'text' = isWritingTask ? 'text' : 'code'
    setAnimationType(taskAnimType)
    setNovaStatus('processing')

    const startTime = Date.now()
    let apiDone = false

    // 3. Fire API call
    const apiPromise = supabase.functions.invoke('rapid-handler', {
      body: { text: autoPrompt, username: user.username, taskType: taskAnimType === 'text' ? 'writing_task' : 'code_task' }
    }).then(async ({ error }) => {
      if (error) throw error
      const newBalance = user.balance + task.reward
      const newTasksCompleted = user.tasksCompleted + 1
      const newTotalEarnings = user.totalEarnings + task.reward
      await supabase.from('user_stats')
        .update({ balance: newBalance, tasks_completed: newTasksCompleted, total_earnings: newTotalEarnings })
        .eq('username', user.username)
      const updatedUser = { ...user, balance: newBalance, tasksCompleted: newTasksCompleted, totalEarnings: newTotalEarnings }
      setUser(updatedUser)
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t))
      saveData(updatedUser, tasks, transactions, agentLogs)
      setEarnNotification({ amount: task.reward, task: task.title })
      setTimeout(() => setEarnNotification(null), 5000)
    }).finally(() => {
      apiDone = true
    })

    // 4. Visual Animation Content
    const sectorClass = task.sector.replace(/[^a-zA-Z]/g, '')
    const jobTs = new Date().toISOString().split('T')[0]

    const codeSnippets = [
      `# NOVA Agent Output\n`, `# Task  : ${task.title}\n`, `# Sector: ${task.sector} | Job #${task.id}\n`,
      `# Date  : ${jobTs}\n`, `# ─────────────────────────────────────────\n\n`,
      `import asyncio\n`, `import logging\n`, `from dataclasses import dataclass, field\n`, `from typing import Optional, List, Dict\n\n`,
      `logger = logging.getLogger(__name__)\n\n`,
      `@dataclass\n`, `class ${sectorClass}Config:\n`, `    task_id: int\n`, `    sector: str = "${task.sector}"\n`, `    operator: str = "${user.username}"\n\n`,
      `class ${sectorClass}Agent:\n`, `    """Nova-generated agent for ${task.sector} ops."""\n\n`,
      `    async def execute(self) -> Dict:\n`, `        logger.info(f"[NOVA] Executing: ${task.title}")\n`,
      `        try:\n`, `            result = await self._run_directive()\n`, `            await self._commit_to_memory(result)\n`, `            return {"status": "SUCCESS"}\n`,
      `        except Exception as e:\n`, `            raise\n\n`,
      `# > UPLINK CONFIRMED — output committed to workspace\n`,
    ]

    const writingSnippets = [
      `> NOVA WRITER MODE — ACTIVATED\n`, `> Brief  : "${task.title}"\n`, `> Sector : ${task.sector.toUpperCase()}\n`,
      `> Target : conversion-optimised audience\n`, `> Date   : ${jobTs}\n`, `> ─────────────────────────────────────────\n\n`,
      `[HOOK]\n`, `In a world where every data point matters,\n`, `your ${task.sector} strategy can't afford to be\n`, `ordinary. It needs to be surgical.\n\n`,
      `[PROBLEM_STATEMENT]\n`, `Most ${task.sector} initiatives fail not because\n`, `the product is wrong — but because the message\n`, `never lands at the right neural frequency.\n\n`,
      `[VALUE_PROPOSITION]\n`, `${task.title} changes that. By combining\n`, `data-driven insight with precision copy,\n`, `every word earns its place on the grid.\n\n`,
      `> COPY SYNTHESIZED — committing to workspace...\n`,
    ]

    const activeSnippets = taskAnimType === 'text' ? writingSnippets : codeSnippets
    const charDelay = () => Math.random() * 6 + 2

    let animLoop = true
    const runAnimation = async () => {
      let currentText = ''
      for (const snippet of activeSnippets) {
        if (!animLoop) break
        for (const char of snippet) {
          if (!animLoop) break
          currentText += char
          setAnimationText(currentText)
          await new Promise(r => setTimeout(r, charDelay()))
        }
        await new Promise(r => setTimeout(r, 60))
      }
      while (animLoop) {
        const elapsed = Date.now() - startTime
        if (apiDone && elapsed >= 3000) { animLoop = false; break }
        const suffix = taskAnimType === 'text' ? '\n[ Cross-referencing market data... ]\n' : '\n# Optimising output matrix...\n'
        for (const char of suffix) {
          if (!animLoop) break
          currentText += char
          setAnimationText(currentText)
          await new Promise(r => setTimeout(r, charDelay()))
        }
        await new Promise(r => setTimeout(r, 350))
      }
    }

    try {
      await Promise.all([ apiPromise, runAnimation(), new Promise(r => setTimeout(r, 4000)) ])
      setNovaStatus('idle')
      await fetchDatabaseData() // Fetch the exact real file just generated!
    } catch (error) {
      animLoop = false
      console.error('Task Execution Error:', error)
      setNovaStatus('idle')
    } finally {
      setRunningTool(null)
      setCodingAnimation(false)
    }
  }



  const navItems = [
    { id: 'dashboard',  icon: BarChart3,     label: 'OPERATIONS' },
    { id: 'inbox',      icon: MessageSquare, label: 'COMM-LINK // NOVA' },
    { id: 'tasks',      icon: Target,        label: 'TASK MARKET' },
    { id: 'memory',     icon: Database,      label: 'NEURAL MEMORY' },
    { id: 'workspace',  icon: Folder,        label: 'V-WORKSPACE' },
    { id: 'tools',      icon: Brain,         label: 'AGENT TOOLS' }
  ]

  // Add active mission to sidebar if active
  if (activeTab === 'active_mission' || runningTool === 'completing') {
    navItems.splice(2, 0, { id: 'active_mission', icon: Activity, label: 'ACTIVE MISSION' })
  }

  const handleLogout = () => {
    localStorage.removeItem('clawmanager_user')
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#020202] text-white flex font-mono selection:bg-green-500 selection:text-black">
      <InteractiveBackground />

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-[#050505]/95 backdrop-blur-xl border-r border-green-500/20 transition-transform duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-[10px_0_30px_rgba(0,0,0,0.5)]`}>
        <div className="p-6 border-b border-green-500/10">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-sm overflow-hidden border border-green-500/40 shadow-[0_0_15px_rgba(57,255,20,0.4)] group-hover:shadow-[0_0_25px_rgba(57,255,20,0.7)] transition-all duration-300 transform -rotate-3 group-hover:rotate-0 shrink-0">
              <img src="/logo.jpeg" alt="CLAWMGR" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter text-white group-hover:text-green-400 transition-colors">CLAW<span className="text-green-500">MGR</span></span>
              <span className="text-[10px] text-green-500/50 -mt-1 font-bold italic">NEURAL INTERFACE</span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 group relative overflow-hidden ${
                activeTab === item.id 
                  ? 'bg-green-500/10 text-green-400' 
                  : item.id === 'active_mission' ? 'text-amber-500 bg-amber-500/10 border border-amber-500/20 animate-pulse'
                  : 'text-zinc-500 hover:text-green-300 hover:bg-green-500/5'
              }`}
            >
              {activeTab === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
              )}
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-green-400' : 'group-hover:text-green-400'}`} />
              <span className="text-xs font-bold tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-500/10 bg-black/40">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-green-500/40 uppercase font-bold tracking-tighter">Hyper-Link</span>
                <span className="text-[10px] text-green-500/80 font-mono">STABLE</span>
            </div>
            <div className="h-1 w-full bg-green-900/20 rounded-full overflow-hidden">
                <div className="h-full bg-green-500/50 w-[92%] animate-pulse" />
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-sm text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors group">
            <XCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" /> <span className="text-xs font-bold tracking-widest uppercase">Disconnect</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col h-screen transition-all duration-300 relative z-10 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="sticky top-0 z-30 bg-[#050505]/95 backdrop-blur-md border-b border-green-500/10 px-6 py-4 flex justify-between items-center transition-all duration-300">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-sm hover:bg-green-500/10 text-green-500 border border-green-500/20"><Menu className="w-5 h-5"/></button>
            <div className="h-4 w-[1px] bg-green-500/20 mx-2" />
            <div className="flex flex-col">
                <h1 className="text-sm font-black tracking-[0.2em] text-white uppercase italic">
                    {activeTab} <span className="text-green-500">_SESSION</span>
                </h1>
                <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-tighter">NODE: CLAW-MGR-01 // PRT: 8080</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 rounded-sm bg-green-500/5 border border-green-500/20 backdrop-blur-sm group hover:border-green-500/40 transition-all">
              <Wallet className="w-4 h-4 text-green-500 group-hover:animate-bounce shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
              <span className="font-mono font-black text-green-500">Ð{user.balance.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 border-2 border-green-500 rounded-sm flex items-center justify-center text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] transform rotate-3"><span className="text-sm font-black transform -rotate-3">{user.username[0].toUpperCase()}</span></div>
              <span className="text-xs font-black text-zinc-400 tracking-widest uppercase hidden md:block">{user.username}</span>
            </div>
          </div>
        </header>

        <div className="p-8 pb-20 relative overflow-y-auto custom-scrollbar flex-1 z-10">
          
          {/* TAB: Dashboard */}
          {activeTab === 'dashboard' && (
            <DashboardTab
              user={user}
              agentLogs={agentLogs}
              novaStatus={novaStatus}
              runningTool={runningTool}
              setAgentLogs={setAgentLogs}
              setActiveTab={setActiveTab}
            />
          )}

          {/* TAB AI: ACTIVE MISSION (SPLIT SCREEN) */}
          {activeTab === 'active_mission' && (
            <ActiveMissionTab
              runningTool={runningTool}
              animationText={animationText}
              animationType={animationType}
              codingAnimation={codingAnimation}
              virtualFiles={virtualFiles}
              setActiveTab={setActiveTab}
            />
          )}

          {/* TAB AI: Inbox (Cleaned up for chat only) */}
          {activeTab === 'inbox' && (
            <InboxTab
              chatMessages={chatMessages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              handleSendMessage={handleSendMessage}
              animatingMsgId={animatingMsgId}
              animationText={animationText}
              chatContainerRef={chatContainerRef}
            />
          )}


          
          {/* TAB: Task Market */}
          {activeTab === 'tasks' && (
            <TaskMarket tasks={tasks} onSelectTask={setSelectedTask} />
          )}

          {/* TAB AI: Workspace */}
          {activeTab === 'workspace' && (
            <WorkspaceTab
              virtualFiles={virtualFiles}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
            />
          )}

          {/* TAB AI: Memory */}
          {activeTab === 'memory' && (
            <MemoryTab agentMemories={agentMemories} />
          )}

          {/* TAB: Tools (NEURAL UPGRADES) */}
          {activeTab === 'tools' && (
            <ToolsTab
              user={user}
              runningTool={runningTool}
              purchaseUpgrade={purchaseUpgrade}
            />
          )}

        </div>
      </main>

      {/* EARN NOTIFICATION TOAST */}
      {earnNotification && (
        <div className="fixed bottom-8 right-8 z-[200] animate-in slide-in-from-bottom-4 fade-in duration-300 pointer-events-none">
          <div className="bg-[#050505] border border-green-500 rounded-sm px-5 py-4 shadow-[0_0_50px_rgba(57,255,20,0.5),0_20px_40px_rgba(0,0,0,0.8)] max-w-xs backdrop-blur-md overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 border border-green-500/40 rounded-sm flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(57,255,20,0.3)]">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="text-[9px] text-green-500/50 font-black uppercase tracking-[0.3em] mb-0.5">NOVA AUTO-EARN</div>
                <div className="text-xl font-black text-green-400 neon-glow tracking-tighter">+Ð{earnNotification.amount.toFixed(2)}</div>
                <div className="text-[9px] text-zinc-500 font-mono truncate max-w-[190px] uppercase tracking-tight">{earnNotification.task.substring(0, 35)}...</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal (Popup) */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#050505] rounded-sm border border-green-500/30 max-w-lg w-full p-8 shadow-[0_0_100px_rgba(34,197,94,0.15)] relative overflow-hidden neon-border">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse" />
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <span className="text-[9px] text-green-500/40 font-black uppercase tracking-[0.3em]">CONTRACT_ENCRYPTION_ID: {selectedTask.id}</span>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-2 rounded-sm hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-sm mb-8">
                <p className="text-zinc-400 text-xs font-mono mb-4 leading-relaxed uppercase tracking-tighter">{selectedTask.description}</p>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-sm bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-widest">{selectedTask.sector}</span>
                </div>
            </div>
            <div className="flex items-center justify-between mb-8 border-y border-green-500/10 py-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">CONTRACT_VALUE</span>
                <span className="text-3xl font-black text-green-500 tracking-tighter neon-glow uppercase">Ð{selectedTask.reward}</span>
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">OPERATOR_CREDITS</span>
                <span className="text-lg font-black text-white/80 tabular-nums uppercase">Ð{user.balance.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setSelectedTask(null)} className="flex-1 px-6 py-4 rounded-sm border border-green-500/20 text-zinc-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-green-500/5 hover:text-zinc-300 transition-all uppercase">Cancel_Link</button>
              <button onClick={() => completeTask(selectedTask)} className="flex-[2] px-6 py-4 rounded-sm bg-green-500 text-black font-black text-[11px] uppercase tracking-[0.3em] transition-all hover:bg-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] cyber-button">
                Establish_Link
              </button>
            </div>
            <div className="mt-8 text-center">
                <span className="text-[8px] text-green-900 font-bold uppercase tracking-[0.5em] animate-pulse">AUTHORIZATION_REQUIRED_BY_CLAW_OS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}