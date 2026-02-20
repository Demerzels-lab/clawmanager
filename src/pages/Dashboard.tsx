import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { InteractiveBackground } from '../components/InteractiveBackground'
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
  const [activeTab, setActiveTab] = useState<'dashboard'|'tasks'|'tools'|'workspace'|'inbox'|'memory'|'history'>('dashboard')
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
    const autoReward = parseFloat((Math.random() * 3.5 + 0.3).toFixed(2))
    const now = new Date().toISOString()
    const uname = user.username
    const currentBalance = user.balance
    setAgentLogs(prev => [...prev,
      { id: Date.now(),     tool: 'AUTO_SCAN', output: `[NOVA] Sector_${task.sector.replace(/ /g,'_')} — bg op: "${task.title.substring(0, 40)}..."`, timestamp: now },
      { id: Date.now() + 1, tool: 'CREDIT',    output: `Micro-contract settled autonomously: +Ð${autoReward}`, timestamp: now },
    ])
    setNovaStatus('auto')
    setTimeout(() => setNovaStatus('idle'), 2500)
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, balance: parseFloat((prev.balance + autoReward).toFixed(2)) }
      localStorage.setItem('clawmanager_user', JSON.stringify(updated))
      return updated
    })
    supabase.from('user_stats').update({ balance: parseFloat((currentBalance + autoReward).toFixed(2)) }).eq('username', uname)
    setEarnNotification({ amount: autoReward, task: task.title })
    setTimeout(() => setEarnNotification(null), 4000)
  }

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
    // Added a small timeout to ensure scroll happens after layout paint
    const timeoutId = setTimeout(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [chatMessages, animatingMsgId, animationText, activeTab])

  const fetchDatabaseData = useCallback(async () => {
    if (!user) return
    
    // 1. Ambil Stats dari Supabase (Balance, dll)
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('username', user.username)
      .single()

    if (stats) {
      setUser(prev => prev ? { ...prev, balance: stats.balance, tasksCompleted: stats.tasks_completed, totalEarnings: stats.total_earnings } : null)
    } else if (statsError && statsError.code === 'PGRST116') {
      // Jika user belum ada di DB, buatkan profil baru otomatis
      await supabase.from('user_stats').insert([{ username: user.username, balance: 100.00 }])
    }

    // 2. Ambil Chat
    const { data: chats } = await supabase.from('chat_messages')
      .select('*')
      .eq('username', user.username)
      .order('created_at', { ascending: true })
    if (chats) setChatMessages(chats.map(c => ({ id: c.id, sender: c.sender, text: c.text, timestamp: c.created_at })))

    const { data: files } = await supabase.from('virtual_files')
      .select('*')
      .eq('username', user.username)
      .order('updated_at', { ascending: false })
    if (files) setVirtualFiles(files.map(f => ({ id: f.id, name: f.name, content: f.content, updatedAt: f.updated_at })))

    const { data: memories } = await supabase.from('agent_memories')
      .select('*')
      // REMOVED: .eq('username', user.username) -> Global Collective Knowledge
      .order('created_at', { ascending: false })
    if (memories) setAgentMemories(memories.map(m => ({ id: m.id, topic: m.topic, details: m.details, timestamp: m.created_at })))
  }, [user])

  useEffect(() => {
    const storedUser = localStorage.getItem('clawmanager_user')
    if (!storedUser) { navigate('/login'); return; }
    const parsedUser = JSON.parse(storedUser)
    setUser(parsedUser)
    
    // Initial fetch of tasks, transactions, and logs from local storage
    const storedTasks = localStorage.getItem('clawmanager_tasks')
    const storedTransactions = localStorage.getItem('clawmanager_transactions')
    const storedLogs = localStorage.getItem('clawmanager_logs')
    
    setTasks(storedTasks ? JSON.parse(storedTasks) : INITIAL_TASKS)
    setTransactions(storedTransactions ? JSON.parse(storedTransactions) : [])
    setAgentLogs(storedLogs ? JSON.parse(storedLogs) : [])
  }, [navigate])

  // 2. Fetch data HANYA jika user sudah terdefinisi
  useEffect(() => {
    if (user?.username) {
      fetchDatabaseData()
    }
  }, [user?.username, fetchDatabaseData])

  // Boot AGENT_STREAMS entries + start Nova autonomous background loop
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

    // 1. Add user message AND Nova placeholder in a single state update to guarantee order
    const msgId = `nova-reply-${Date.now()}`
    setChatMessages(prev => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', text: userText, timestamp: new Date().toISOString() },
      { id: msgId, sender: 'agent', text: 'UPLINKING...', timestamp: new Date().toISOString() }
    ])
    setAnimatingMsgId(msgId)
    setAnimationType('thinking') // plain chat = minimal thinking UI, no code terminal
    setAnimationText('')
    setNovaStatus('processing')

    const startTime = Date.now()
    let apiDone = false

    // Fire the API call immediately in the background
    const apiPromise = supabase.functions.invoke('rapid-handler', {
      body: { text: userText, username: currentUsername, taskType: 'chat' }
    }).then(({ error }) => {
      if (error) throw error
    }).finally(() => {
      apiDone = true
    })

    // For plain chat: simple pulsing dot animation, min 2s only
    const thinkingFrames = [
      'Uplink established',
      'Uplink established .',
      'Uplink established . .',
      'Uplink established . . .',
      'Scanning neural deposits',
      'Scanning neural deposits .',
      'Scanning neural deposits . .',
      'Scanning neural deposits . . .',
      'Formulating response',
      'Formulating response .',
      'Formulating response . .',
      'Formulating response . . .',
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
      await Promise.all([
        apiPromise,
        runAnimation(),
        new Promise(r => setTimeout(r, 2000))
      ])
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

  const getToolOutput = (tool: string): string => {
    const outputs: Record<string, string> = {
      decide_activity: 'Decision: WORK - Proceeding with task completion',
      submit_work: 'Work submitted for evaluation',
      learn: 'Agent capabilities improved: +5% efficiency',
      get_status: `Balance: $${user?.balance.toFixed(2) || '0.00'} | Tasks: ${user?.tasksCompleted || 0}`,
      search_web: 'Search completed: Found 5 relevant results',
      create_file: 'File created successfully',
      execute_code: 'Code executed successfully in sandbox'
    }
    return outputs[tool] || 'Tool executed'
  }

  const executeTool = async (toolName: string) => {
    if (!user || runningTool) return
    const cost = TOOL_COSTS[toolName as keyof typeof TOOL_COSTS]
    if (user.balance < cost) return alert('Insufficient balance!')
    
    setRunningTool(toolName)
    setToolResult(null)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const timestamp = new Date().toISOString()
    const output = getToolOutput(toolName)
    const newLog: AgentLog = { id: Date.now(), tool: toolName, output, timestamp }
    const newTransaction: Transaction = { id: Date.now(), timestamp, type: 'tool_usage', tool: toolName, amount: -cost, description: `Used ${toolName}` }
    
    // REDUCE BALANCE IN SUPABASE
    const newBalance = user.balance - cost
    await supabase.from('user_stats').update({ balance: newBalance }).eq('username', user.username)

    // REAL EFFECT: If create_file, actually add a node
    if (toolName === 'create_file') {
      await supabase.from('virtual_files').insert([{ 
        name: `manual_node_${Date.now()}.sys`, 
        content: `// MANUALLY SYNTHESIZED BY OPERATOR: ${user.username.toUpperCase()}\n// SYNCED AT: ${timestamp}\nSTATUS: OPERATIONAL`,
        username: user.username
      }])
      fetchDatabaseData()
    }

    const updatedUser = { ...user, balance: newBalance }
    const updatedLogs = [...agentLogs, newLog]
    const updatedTransactions = [...transactions, newTransaction]
    
    setUser(updatedUser)
    setAgentLogs(updatedLogs)
    setTransactions(updatedTransactions)
    setToolResult({ name: toolName, output: output })
    saveData(updatedUser, tasks, updatedTransactions, updatedLogs)
    setRunningTool(null)
  }

  const completeTask = async (task: Task) => {
    if (!user) return
    setRunningTool('completing')
    setCodingAnimation(true)
    
    // 1. Redirect to COMM-LINK immediately
    setSelectedTask(null)
    setActiveTab('inbox')
    const msgId = `nova-sync-${Date.now()}`
    setAnimationText('')
    
    // 2. Add user prompt AND Nova placeholder in a single update to guarantee order
    const autoPrompt = `[SYSTEM_TASK_ASSIGNMENT] Please execute the following task: "${task.title}" in ${task.sector} Sector. Use CREATE_FILE and ADD_MEMORY.`
    setChatMessages(prev => [
      ...prev, 
      { id: Date.now().toString(), sender: 'user', text: autoPrompt, timestamp: new Date().toISOString() },
      { id: msgId, sender: 'agent', text: 'SYNCING...', timestamp: new Date().toISOString() }
    ])
    setAnimatingMsgId(msgId)

    // Classify task animation type based on sector / title keywords
    const WRITING_KEYWORDS = ['copywriting', 'copywrite', 'content', 'marketing', 'creative', 'writing', 'media', 'editorial', 'blog', 'article', 'social', 'copy']
    const isWritingTask = WRITING_KEYWORDS.some(k =>
      task.sector.toLowerCase().includes(k) || task.title.toLowerCase().includes(k)
    )
    const taskAnimType: 'code' | 'text' = isWritingTask ? 'text' : 'code'
    setAnimationType(taskAnimType)
    setNovaStatus('processing')

    const startTime = Date.now()
    let apiDone = false

    // 3. Fire API call immediately in the background
    const apiPromise = supabase.functions.invoke('rapid-handler', {
      body: { text: autoPrompt, username: user.username, taskType: taskAnimType === 'text' ? 'writing_task' : 'code_task' }
    }).then(async ({ error }) => {
      if (error) throw error
      // Update reward in parallel with animation finishing
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

    // 4. Context-aware animation — rich real-looking content that types for 3+ seconds
    const sectorClass = task.sector.replace(/[^a-zA-Z]/g, '')
    const jobTs = new Date().toISOString().split('T')[0]

    const codeSnippets = [
      `# NOVA Agent Output\n`,
      `# Task  : ${task.title}\n`,
      `# Sector: ${task.sector} | Job #${task.id}\n`,
      `# Date  : ${jobTs}\n`,
      `# ─────────────────────────────────────────\n\n`,
      `import asyncio\n`,
      `import logging\n`,
      `from dataclasses import dataclass, field\n`,
      `from typing import Optional, List, Dict\n\n`,
      `logger = logging.getLogger(__name__)\n\n`,
      `@dataclass\n`,
      `class ${sectorClass}Config:\n`,
      `    task_id: int\n`,
      `    sector: str = "${task.sector}"\n`,
      `    operator: str = "${user.username}"\n`,
      `    max_retries: int = 3\n`,
      `    timeout: float = 30.0\n\n`,
      `class ${sectorClass}Agent:\n`,
      `    """Nova-generated agent for ${task.sector} ops."""\n\n`,
      `    def __init__(self, config: ${sectorClass}Config):\n`,
      `        self.config = config\n`,
      `        self._session: Optional[object] = None\n`,
      `        self._results: List[Dict] = []\n\n`,
      `    async def execute(self) -> Dict:\n`,
      `        logger.info(f"[NOVA] Executing: ${task.title}")\n`,
      `        try:\n`,
      `            await self._initialize_uplink()\n`,
      `            result = await self._run_directive()\n`,
      `            await self._commit_to_memory(result)\n`,
      `            return {"status": "SUCCESS", "data": result}\n`,
      `        except Exception as e:\n`,
      `            logger.error(f"[NOVA] Uplink fault: {e}")\n`,
      `            raise\n\n`,
      `    async def _initialize_uplink(self):\n`,
      `        logger.debug("[NOVA] Neural uplink initializing...")\n`,
      `        await asyncio.sleep(0.1)\n`,
      `        self._session = {"active": True, "sector": self.config.sector}\n\n`,
      `    async def _run_directive(self) -> Dict:\n`,
      `        # Core execution logic for ${task.sector}\n`,
      `        output = await self._process_directive("${task.title}")\n`,
      `        self._results.append(output)\n`,
      `        return output\n\n`,
      `    async def _process_directive(self, directive: str) -> Dict:\n`,
      `        return {"directive": directive, "resolved": True}\n\n`,
      `    async def _commit_to_memory(self, result: Dict):\n`,
      `        logger.info("[NOVA] Committing result to neural grid...")\n\n`,
      `if __name__ == "__main__":\n`,
      `    cfg = ${sectorClass}Config(task_id=${task.id})\n`,
      `    agent = ${sectorClass}Agent(cfg)\n`,
      `    asyncio.run(agent.execute())\n`,
      `\n# > UPLINK CONFIRMED — output committed to workspace\n`,
    ]

    const writingSnippets = [
      `> NOVA WRITER MODE — ACTIVATED\n`,
      `> Brief  : "${task.title}"\n`,
      `> Sector : ${task.sector.toUpperCase()}\n`,
      `> Target : conversion-optimised audience\n`,
      `> Date   : ${jobTs}\n`,
      `> ─────────────────────────────────────────\n\n`,
      `[HOOK]\n`,
      `In a world where every data point matters,\n`,
      `your ${task.sector} strategy can't afford to be\n`,
      `ordinary. It needs to be surgical.\n\n`,
      `[PROBLEM_STATEMENT]\n`,
      `Most ${task.sector} initiatives fail not because\n`,
      `the product is wrong — but because the message\n`,
      `never lands at the right neural frequency.\n\n`,
      `[VALUE_PROPOSITION]\n`,
      `${task.title} changes that. By combining\n`,
      `data-driven insight with precision copy,\n`,
      `every word earns its place on the grid.\n\n`,
      `[BODY — FEATURE BREAKDOWN]\n`,
      `• Deep sector expertise in ${task.sector}\n`,
      `• Tone-matched for target demographics\n`,
      `• Conversion hooks embedded at key intervals\n`,
      `• Neural-tested for retention and recall\n\n`,
      `[SOCIAL_PROOF]\n`,
      `Operators who deployed this framework saw\n`,
      `a measurable uplift in engagement within\n`,
      `the first 72-hour uplink cycle.\n\n`,
      `[CALL_TO_ACTION]\n`,
      `Don't just enter the market. Own the signal.\n`,
      `Initialize your ${task.sector} protocol today.\n\n`,
      `> COPY SYNTHESIZED — committing to workspace...\n`,
    ]

    const activeSnippets = taskAnimType === 'text' ? writingSnippets : codeSnippets
    // Per-char speed: fast enough to feel live, slow enough to read
    const charDelay = () => Math.random() * 6 + 2   // 2–8 ms

    let animLoop = true
    const runAnimation = async () => {
      let currentText = ''
      // First pass — always runs fully for the live-typing feel
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
      // After first pass, loop a short suffix until API + 3s minimum both done
      while (animLoop) {
        const elapsed = Date.now() - startTime
        if (apiDone && elapsed >= 3000) { animLoop = false; break }
        const suffix = taskAnimType === 'text'
          ? '\n[ Cross-referencing market data... ]\n'
          : '\n# Optimising output matrix...\n'
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
      await Promise.all([
        apiPromise,
        runAnimation(),
        new Promise(r => setTimeout(r, 4000))
      ])
      setAnimatingMsgId(null)
      setNovaStatus('idle')
      fetchDatabaseData()
    } catch (error) {
      animLoop = false
      console.error('Task Execution Error:', error)
      setAnimatingMsgId(null)
      setNovaStatus('idle')
      setChatMessages(prev => prev.filter(msg => msg.id !== msgId))
      setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: 'system', text: `ERROR: Uplink failed for ${task.title}.`, timestamp: new Date().toISOString() }])
    } finally {
      setRunningTool(null)
      setCodingAnimation(false)
    }
  }

  const tools = [
    { name: 'decide_activity', desc: 'Strategic work/learn decision', cost: TOOL_COSTS.decide_activity, icon: Brain },
    { name: 'submit_work', desc: 'Submit completed work', cost: TOOL_COSTS.submit_work, icon: BookOpen },
    { name: 'learn', desc: 'Improve agent capabilities', cost: TOOL_COSTS.learn, icon: Activity },
    { name: 'get_status', desc: 'Check current status', cost: TOOL_COSTS.get_status, icon: Target },
    { name: 'search_web', desc: 'Search for information', cost: TOOL_COSTS.search_web, icon: Search },
    { name: 'create_file', desc: 'Create and manage files', cost: TOOL_COSTS.create_file, icon: Terminal },
    { name: 'execute_code', desc: 'Run code in sandbox', cost: TOOL_COSTS.execute_code, icon: Terminal },
  ]

  const handleLogout = () => {
    localStorage.removeItem('clawmanager_user')
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#020202] text-white flex font-mono selection:bg-green-500 selection:text-black">
      {/* INTERACTIVE BACKGROUND */}
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
          {[
            { id: 'dashboard',  icon: BarChart3,     label: 'OPERATIONS' },
            { id: 'inbox',      icon: MessageSquare,  label: 'COMM-LINK // NOVA' },
            { id: 'tasks',      icon: Target,         label: 'TASK MARKET' },
            { id: 'memory',     icon: Database,       label: 'NEURAL MEMORY' },
            { id: 'workspace',  icon: Folder,         label: 'V-WORKSPACE' },
            { id: 'tools',      icon: Brain,          label: 'AGENT TOOLS' },
            { id: 'history',    icon: Clock,          label: 'LOG HISTORY' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 group relative overflow-hidden ${
                activeTab === item.id 
                  ? 'bg-green-500/10 text-green-400' 
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
          
          {/* TAB: Dashboard Asli */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* ── NOVA STATUS BANNER ─────────────────────── */}
              <div className="flex items-center gap-4 p-4 bg-[#050505]/80 border border-green-500/20 rounded-sm backdrop-blur-md relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent pointer-events-none" />
                <div className="w-14 h-14 rounded-sm overflow-hidden border-2 border-green-500 shadow-[0_0_20px_rgba(57,255,20,0.4)] shrink-0 relative">
                  <img src="/logo.jpeg" alt="Nova" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-black text-white tracking-[0.2em] uppercase italic">NOVA</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-sm font-black uppercase tracking-widest transition-all duration-300 ${
                      novaStatus === 'auto'       ? 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-[0_0_8px_rgba(57,255,20,0.4)] animate-pulse' :
                      novaStatus === 'processing' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                      'bg-zinc-900 text-zinc-500 border border-zinc-800'
                    }`}>
                      {novaStatus === 'auto' ? '● EXECUTING' : novaStatus === 'processing' ? '● PROCESSING' : '● STANDBY'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter truncate">
                    Neural Agent v4.0.5 — Autonomous mode active // Operator: <span className="text-green-500/60">{user.username}</span>
                  </p>
                </div>
                <div className="text-right shrink-0 mr-4">
                  <div className="text-[9px] text-green-500/40 uppercase font-bold tracking-widest mb-0.5">Knowledge</div>
                  <div className="text-2xl font-black text-green-500 neon-glow tabular-nums">{agentMemories.length}</div>
                  <div className="text-[9px] text-zinc-600 uppercase font-bold">deposits</div>
                </div>
                <button
                  onClick={() => setActiveTab('inbox')}
                  className="px-4 py-2 bg-green-500 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-sm hover:bg-green-400 transition-all cyber-button shadow-[0_0_15px_rgba(57,255,20,0.3)] shrink-0"
                >
                  Talk_to_Nova →
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#050505]/60 rounded-sm border border-green-500/10 p-6 neon-border">
                  <h3 className="text-[10px] font-black mb-4 text-white tracking-[0.3em] uppercase italic flex items-center gap-2">
                     <Zap className="w-3 h-3 text-green-500" /> Quick_Execute
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {tools.slice(0, 4).map(tool => (
                      <button 
                        key={tool.name} 
                        onClick={() => executeTool(tool.name)} 
                        disabled={runningTool !== null} 
                        className="group relative p-3 rounded-sm bg-green-500/5 border border-green-500/10 hover:border-green-500/40 transition-all text-left disabled:opacity-30 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-green-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <div className="relative z-10 font-mono text-[10px] text-green-500/70 group-hover:text-green-400 mb-1 font-black uppercase tracking-tighter">{tool.name}</div>
                        <div className="relative z-10 text-[10px] text-zinc-600 group-hover:text-zinc-400 font-bold italic">-Ð{tool.cost.toFixed(2)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#050505]/60 rounded-sm border border-green-500/10 p-6 neon-border flex flex-col justify-center items-center text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-5 group-hover:opacity-10 transition-opacity duration-500" />
                    <Brain className="w-12 h-12 text-green-500/20 mb-4 animate-pulse relative z-10" />
                    <h4 className="text-[10px] font-black text-green-500/40 tracking-[0.4em] uppercase mb-2 relative z-10">Neural_Status</h4>
                    <p className="text-xs text-zinc-500 font-mono max-w-[200px] relative z-10">Level 4 Agent synchronized with Operator <span className="text-green-500/60">{user.username}</span></p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Task Market */}
          {activeTab === 'tasks' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between border-b border-green-500/20 pb-4">
                <div className="flex flex-col">
                    <h2 className="text-xl font-black text-white italic tracking-tighter">Available_Contracts</h2>
                    <span className="text-[10px] text-green-500/40 font-mono uppercase tracking-[0.2em]">{tasks.filter(t => t.status === 'open').length} ACTIVE NODES IN MARKET</span>
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3].map(i => <div key={i} className="w-8 h-[2px] bg-green-500/20" />)}
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
                      <button onClick={() => setSelectedTask(task)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-black transition-all cyber-button">Accept</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Tools */}
          {activeTab === 'tools' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex flex-col border-l-4 border-green-500 pl-4 py-2">
                <h2 className="text-2xl font-black text-white tracking-tighter italic">Neural_Toolkit</h2>
                <p className="text-[10px] text-green-500/50 font-mono tracking-[0.2em] uppercase">Advanced Agent Capabilities // v4.0.2</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tools.map(tool => (
                  <div key={tool.name} className="bg-[#050505]/80 rounded-sm border border-green-500/10 p-6 neon-border relative group overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all" />
                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-sm bg-green-500/5 border border-green-500/20 flex items-center justify-center group-hover:border-green-500/50 transition-colors shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]">
                            <tool.icon className="w-7 h-7 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]" />
                        </div>
                        <div>
                            <h3 className="font-black text-white tracking-widest uppercase italic group-hover:text-green-400 transition-colors">{tool.name}</h3>
                            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter mt-1">{tool.desc}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between relative z-10 mt-4 pt-4 border-t border-green-500/5">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-600 font-bold uppercase">EXECUTION_COST</span>
                        <span className="text-green-500/80 font-black text-sm tabular-nums">Ð{tool.cost.toFixed(2)}</span>
                      </div>
                      <button 
                        onClick={() => executeTool(tool.name)} 
                        disabled={runningTool !== null || user.balance < tool.cost} 
                        className="px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-black transition-all disabled:opacity-30 cyber-button"
                      >
                        {runningTool === tool.name ? 'EXECUTING...' : 'Execute'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* NEW TOOL TERMINAL OUTPUT */}
              {toolResult && (
                <div className="bg-black/90 border border-green-500/40 p-4 rounded-sm font-mono animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 mb-2 text-green-500/40 text-[9px] font-black uppercase tracking-widest border-b border-green-500/10 pb-2">
                        <Zap className="w-3 h-3 text-amber-500 animate-pulse" />
                        Terminal_Output_{toolResult.name}.log
                    </div>
                    <div className="text-[10px] text-green-400">
                        <span className="text-zinc-600">[{new Date().toLocaleTimeString()}]</span> <span className="text-white">NANOBOT@EXEC:</span> {toolResult.output}
                        {toolResult.name === 'create_file' && <div className="mt-1 text-amber-500 italic">{" >> New Node successfully synthesized in workspace!"}</div>}
                    </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: History */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-xl font-black text-white italic tracking-tighter border-b border-green-500/20 pb-4">NODE_TELEMETRY</h2>
              <div className="bg-[#050505]/80 rounded-sm border border-green-500/10 overflow-hidden neon-border">
                <table className="w-full font-mono text-[10px]">
                  <thead>
                    <tr className="bg-green-500/5 border-b border-green-500/10">
                      <th className="text-left px-6 py-4 text-green-500/40 uppercase tracking-widest font-black">Timestamp</th>
                      <th className="text-left px-6 py-4 text-green-500/40 uppercase tracking-widest font-black">Category</th>
                      <th className="text-left px-6 py-4 text-green-500/40 uppercase tracking-widest font-black">Operation</th>
                      <th className="text-right px-6 py-4 text-green-500/40 uppercase tracking-widest font-black">Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice().reverse().map(tx => (
                      <tr key={tx.id} className="border-b border-green-500/5 hover:bg-green-500/5 transition-colors group">
                        <td className="px-6 py-4 text-zinc-500 group-hover:text-zinc-300">{new Date(tx.timestamp).toLocaleString().toUpperCase()}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-sm font-black tracking-tighter ${tx.type === 'task_reward' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {tx.type === 'task_reward' ? 'INFLOW' : 'OUTFLOW'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-300 font-bold uppercase tracking-tighter">{tx.description}</td>
                        <td className={`px-6 py-4 font-black text-right tabular-nums text-sm ${tx.amount > 0 ? 'text-green-400 neon-glow' : 'text-red-400'}`}>
                            {tx.amount > 0 ? '+' : ''}Ð{tx.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB AI: Memory */}
          {activeTab === 'memory' && (
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
                    <div className="mt-4 pt-4 border-t border-green-500/5 text-right">
                        <span className="text-[8px] text-green-900 font-bold">{new Date(m.timestamp).toISOString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB AI: Inbox */}
          {activeTab === 'inbox' && (
             <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
             <div className="flex items-center gap-3 border-b border-green-500/20 pb-4">
                <MessageSquare className="w-6 h-6 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <h2 className="text-xl font-black text-white italic tracking-tighter">NEURAL_COMM_LINK</h2>
             </div>
             <div className="flex-1 bg-[#050505]/60 rounded-sm border border-green-500/10 flex flex-col min-h-[500px] neon-border overflow-hidden">
               <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar bg-black/40">
                 {chatMessages.map((msg, msgIdx) => {
                   // Animation anchors to the very last message in the array while animatingMsgId is active.
                   // This is robust against ID mismatches caused by fetchDatabaseData replacing local placeholders.
                   const isAnimatingBubble = animatingMsgId !== null && msgIdx === chatMessages.length - 1 && msg.sender === 'agent'
                   return (
                   <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                     {msg.sender === 'system' && !isAnimatingBubble ? (
                        <div className="w-full flex justify-center py-2">
                            <span className="text-[9px] font-black text-green-900 uppercase tracking-[0.3em] font-mono animate-pulse">{msg.text}</span>
                        </div>
                     ) : (
                        <div className={`max-w-[85%] rounded-sm px-4 py-3 border relative group ${
                            msg.sender === 'user' 
                                ? 'bg-green-500/10 border-green-500/30 text-green-100 ml-12' 
                                : 'bg-black/80 border-white/10 text-zinc-300 mr-12 shadow-[0_5px_15px_rgba(0,0,0,0.4)]'
                        }`}>
                          <div className="flex items-center gap-2 mb-1.5 border-b border-white/5 pb-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${msg.sender === 'user' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
                              {msg.sender === 'user' ? 'Operator' : 'Nova_v4'}
                            </span>
                            <span className="text-[8px] opacity-20 ml-auto font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          </div>
                          
                          <div className="whitespace-pre-wrap text-[11px] font-mono tracking-tighter leading-relaxed">
                            {isAnimatingBubble ? (
                              <>
                                {/* ── THINKING: plain chat ─────────────────── */}
                                {animationType === 'thinking' && (
                                  <div className="flex items-center gap-3 py-2 px-1">
                                    <div className="flex gap-1">
                                      {[0,1,2].map(i => (
                                        <div key={i} className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                                      ))}
                                    </div>
                                    <span className="text-[10px] text-green-400/70 font-mono tracking-wide">{animationText || 'Uplink established . . .'}</span>
                                  </div>
                                )}

                                {/* ── CODE TERMINAL: technical / code task ─── */}
                                {animationType === 'code' && (
                                  <div className="text-green-400 bg-black/80 p-4 border border-green-500/30 rounded shadow-[0_0_20px_rgba(34,197,94,0.1)] overflow-hidden relative">
                                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-green-500/20 animate-pulse" />
                                    <div className="flex items-center gap-2 mb-3 border-b border-green-500/10 pb-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                                      <span className="text-[7px] text-green-500/40 ml-2 font-black uppercase tracking-widest">NOVA_TASK_EXECUTION — CODE_MODE</span>
                                    </div>
                                    <pre className="font-mono text-[10px] text-green-300 whitespace-pre-wrap leading-relaxed">
                                      {animationText}
                                      <span className="inline-block w-2 h-4 bg-green-500 animate-pulse align-middle ml-0.5" />
                                    </pre>
                                    <div className="mt-3 flex items-center gap-2 opacity-40">
                                      <Activity className="w-2.5 h-2.5 animate-spin text-green-500" />
                                      <span className="text-[7px] text-green-500/50 uppercase italic font-bold">Compiling output nodes...</span>
                                    </div>
                                  </div>
                                )}

                                {/* ── DOCUMENT DRAFT: writing / copywriting task ── */}
                                {animationType === 'text' && (
                                  <div className="bg-[#0a0c0a]/90 border border-green-500/20 rounded overflow-hidden shadow-[0_0_15px_rgba(34,197,94,0.07)]">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/5 border-b border-green-500/10">
                                      <FileText className="w-3 h-3 text-green-500/60" />
                                      <span className="text-[7px] text-green-500/40 font-black uppercase tracking-widest">NOVA_COPYWRITER_MODE — DRAFTING</span>
                                      <span className="ml-auto animate-pulse text-[7px] text-amber-500/60 font-bold">● LIVE</span>
                                    </div>
                                    <div className="p-4 font-mono text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                      {animationText}
                                      <span className="inline-block w-1.5 h-3.5 bg-amber-400/80 animate-pulse align-middle ml-0.5" />
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                               msg.text.split('**').map((part, i) => i % 2 === 1 ? <b key={i} className="text-green-400 font-extrabold">{part}</b> : part)
                            )}
                          </div>

                          {/* Action Button if file created */}
                          {!animatingMsgId && msg.sender !== 'user' && (msg.text.includes('[CREATE_FILE]') || msg.text.includes('synthesis')) && (
                            <button 
                              onClick={() => {
                                setActiveTab('workspace');
                                // Scroll to top or find latest file
                              }}
                              className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full text-[9px] font-black text-green-400 hover:bg-green-500 hover:text-black transition-all"
                            >
                              <Folder className="w-3 h-3" />
                              VIEW_GENERATED_NODE
                            </button>
                          )}
                        </div>
                     )}
                   </div>
                 ) // end return
                 })} 
               </div>
               <div className="p-4 bg-[#050505] border-t border-green-500/10 flex gap-4">
                 <input 
                    type="text" 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                    className="flex-1 bg-black/50 border border-green-500/20 rounded-sm px-4 py-3 text-[11px] font-mono text-green-400 placeholder:text-green-900 focus:outline-none focus:border-green-500/50 uppercase" 
                    placeholder="Enter command sequence..." 
                  />
                 <button onClick={handleSendMessage} className="bg-green-500/10 border border-green-500/40 p-3 rounded-sm hover:bg-green-500 hover:text-black transition-all group cyber-button">
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/>
                 </button>
               </div>
             </div>
           </div>
          )}

          {/* TAB AI: Workspace */}
          {activeTab === 'workspace' && (
             <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
             <div className="flex items-center gap-3 border-b border-green-500/20 pb-4">
                <Folder className="w-6 h-6 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <h2 className="text-xl font-black text-white italic tracking-tighter">VIRTUAL_DATA_STORAGE</h2>
             </div>
             <div className="flex-1 flex gap-6 min-h-[500px]">
               <div className="w-1/3 bg-[#050505]/80 rounded-sm border border-green-500/10 p-3 space-y-1 neon-border custom-scrollbar overflow-y-auto">
                 {virtualFiles.map(f => (
                    <button 
                        key={f.id} 
                        onClick={() => setSelectedFile(f)} 
                        className={`w-full text-left p-3 rounded-sm text-[10px] font-mono uppercase tracking-tighter flex items-center justify-between group transition-all ${
                            selectedFile?.id === f.id ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-zinc-500 hover:bg-green-500/5 hover:text-zinc-300'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                           <FileText className={`w-3 h-3 ${selectedFile?.id === f.id ? 'text-green-400' : 'text-zinc-700'}`}/>
                           {f.name}
                        </div>
                        <div className="w-1 h-1 rounded-full bg-green-500/0 group-hover:bg-green-500/40 transition-all" />
                    </button>
                 ))}
               </div>
               <div className="flex-1 bg-[#050505]/80 rounded-sm border border-green-500/10 p-6 font-mono text-[11px] text-zinc-400 whitespace-pre-wrap overflow-y-auto custom-scrollbar neon-border bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:20px_20px]">
                 {codingAnimation ? (
                    <div className="animate-in fade-in duration-300">
                        <div className="pb-4 mb-4 border-b border-green-500/10 flex justify-between items-center">
                            <span className="text-amber-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <Activity className="w-3 h-3 animate-pulse" />
                                SYNTHESIZING_NODE...
                            </span>
                            <span className="text-green-900 text-[8px] animate-pulse">UPLINK_ACTIVE</span>
                        </div>
                        <pre className="whitespace-pre-wrap font-mono text-[11px] text-green-400/90 leading-relaxed">
                            {animationText}
                            <span className="animate-pulse">_</span>
                        </pre>
                    </div>
                 ) : selectedFile ? (
                    <div className="animate-in fade-in duration-300">
                        <div className="pb-4 mb-4 border-b border-green-500/10 flex justify-between items-center">
                            <span className="text-green-500/40 text-[9px] font-black uppercase tracking-[0.2em]">FILE://{selectedFile.name}</span>
                            <span className="text-green-900 text-[8px]">{new Date(selectedFile.updatedAt).toISOString()}</span>
                        </div>
                        <pre className="whitespace-pre-wrap font-mono text-[11px] text-green-100/90 leading-relaxed selection:bg-green-500/30" style={{ tabSize: 4 }}>
                            {selectedFile.content}
                        </pre>
                    </div>
                 ) : (
                    <div className="h-full flex items-center justify-center text-green-900/30 uppercase tracking-[0.4em] italic font-black">
                        NO_DATA_MOUNTED
                    </div>
                 )}
               </div>
             </div>
           </div>
          )}
        </div>
      </main>

      {/* ── EARN NOTIFICATION TOAST ─────────────────────── */}
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

            {runningTool === 'completing' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-[10px] font-black text-green-500/80 uppercase tracking-widest">
                    <div className="flex items-center gap-2 italic">
                        <Activity className="w-4 h-4 animate-spin" />
                        Initializing Neural Link...
                    </div>
                    <span>{Math.floor(Math.random() * 100)}%</span>
                </div>
                <div className="h-1 bg-green-900/20 rounded-full overflow-hidden border border-green-500/10">
                    <div className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)] animate-[pulse_1s_infinite]" style={{ width: '60%' }}></div>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                <button onClick={() => setSelectedTask(null)} className="flex-1 px-6 py-4 rounded-sm border border-green-500/20 text-zinc-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-green-500/5 hover:text-zinc-300 transition-all uppercase">Cancel_Link</button>
                <button onClick={() => completeTask(selectedTask)} className="flex-[2] px-6 py-4 rounded-sm bg-green-500 text-black font-black text-[11px] uppercase tracking-[0.3em] transition-all hover:bg-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] cyber-button">
                  Establish_Link
                </button>
              </div>
            )}
            
            <div className="mt-8 text-center">
                <span className="text-[8px] text-green-900 font-bold uppercase tracking-[0.5em] animate-pulse">AUTHORIZATION_REQUIRED_BY_CLAW_OS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
  }
