import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Terminal, Zap, Brain, BookOpen, Menu, X, Search,
  Activity, Wallet, Clock, TrendingUp, RotateCcw, CheckCircle, XCircle, Target, BarChart3,
  Folder, MessageSquare, FileText, Send, Database
} from 'lucide-react'
import { supabase, TOOL_COSTS, INITIAL_TASKS } from '../lib/supabase'
import { User, Task, Transaction, AgentLog, VirtualFile, ChatMessage, AgentMemory } from '../types'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([])
  const [activeTab, setActiveTab] = useState<'dashboard'|'tasks'|'tools'|'workspace'|'inbox'|'memory'|'history'>('dashboard')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [runningTool, setRunningTool] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // AI States
  const [virtualFiles, setVirtualFiles] = useState<VirtualFile[]>([])
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [agentMemories, setAgentMemories] = useState<AgentMemory[]>([])
  const [chatInput, setChatInput] = useState('')

  const fetchDatabaseData = useCallback(async () => {
    const { data: chats } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true })
    if (chats) setChatMessages(chats.map(c => ({ id: c.id, sender: c.sender, text: c.text, timestamp: c.created_at })))

    const { data: files } = await supabase.from('virtual_files').select('*').order('updated_at', { ascending: false })
    if (files) setVirtualFiles(files.map(f => ({ id: f.id, name: f.name, content: f.content, updatedAt: f.updated_at })))

    const { data: memories } = await supabase.from('agent_memories').select('*').order('created_at', { ascending: false })
    if (memories) setAgentMemories(memories.map(m => ({ id: m.id, topic: m.topic, details: m.details, timestamp: m.created_at })))
  }, [])

  useEffect(() => {
    const storedUser = localStorage.getItem('clawmanager_user')
    if (!storedUser) { navigate('/login'); return; }
    setUser(JSON.parse(storedUser))
    fetchDatabaseData()
    
    const storedTasks = localStorage.getItem('clawmanager_tasks')
    const storedTransactions = localStorage.getItem('clawmanager_transactions')
    const storedLogs = localStorage.getItem('clawmanager_logs')
    
    setTasks(storedTasks ? JSON.parse(storedTasks) : INITIAL_TASKS)
    setTransactions(storedTransactions ? JSON.parse(storedTransactions) : [])
    setAgentLogs(storedLogs ? JSON.parse(storedLogs) : [])
  }, [navigate, fetchDatabaseData])

  const saveData = useCallback((newUser: User, newTasks: Task[], newTransactions: Transaction[], newLogs: AgentLog[]) => {
    localStorage.setItem('clawmanager_user', JSON.stringify(newUser))
    localStorage.setItem('clawmanager_tasks', JSON.stringify(newTasks))
    localStorage.setItem('clawmanager_transactions', JSON.stringify(newTransactions))
    localStorage.setItem('clawmanager_logs', JSON.stringify(newLogs))
  }, [])

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return
    const userText = chatInput.trim()
    setChatInput('')
    
    setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userText, timestamp: new Date().toISOString() }])
    setChatMessages(prev => [...prev, { id: 'loading-temp', sender: 'system', text: 'Agent is analyzing and processing...', timestamp: new Date().toISOString() }])

    try {
      const { error } = await supabase.functions.invoke('rapid-handler', { body: { text: userText } })
      if (error) throw error
      fetchDatabaseData()
    } catch (error) {
      console.error("Agent Comm-Link Error:", error)
      setChatMessages(prev => prev.filter(msg => msg.id !== 'loading-temp'))
      setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: 'system', text: 'ERROR: Connection to Agent Core failed.', timestamp: new Date().toISOString() }])
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
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const timestamp = new Date().toISOString()
    const newLog: AgentLog = { id: Date.now(), tool: toolName, output: getToolOutput(toolName), timestamp }
    const newTransaction: Transaction = { id: Date.now(), timestamp, type: 'tool_usage', tool: toolName, amount: -cost, description: `Used ${toolName}` }
    
    const updatedUser = { ...user, balance: user.balance - cost }
    const updatedLogs = [...agentLogs, newLog]
    const updatedTransactions = [...transactions, newTransaction]
    
    setUser(updatedUser)
    setAgentLogs(updatedLogs)
    setTransactions(updatedTransactions)
    saveData(updatedUser, tasks, updatedTransactions, updatedLogs)
    setRunningTool(null)
  }

  const completeTask = async (task: Task) => {
    if (!user) return
    setRunningTool('completing')
    
    // 1. Tutup modal popup segera
    setSelectedTask(null)
    
    // 2. Pindahkan user ke tab Inbox otomatis untuk melihat AI bekerja
    setActiveTab('inbox')

    // 3. Buat prompt otomatis untuk mendelegasikan tugas ke AI
    const autoPrompt = `[SYSTEM_TASK_ASSIGNMENT] Please execute the following task for me: "${task.title}" (${task.sector} Sector). 
    Description: ${task.description}. 
    Write a brief execution report and if necessary, use the CREATE_FILE tool to generate the result output.`

    // 4. Tampilkan pesan secara optimistik di UI Chat
    setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: autoPrompt, timestamp: new Date().toISOString() }])
    setChatMessages(prev => [...prev, { id: 'loading-temp', sender: 'system', text: `Agent is executing task: ${task.title}...`, timestamp: new Date().toISOString() }])

    try {
      // 5. Panggil Edge Function Supabase (AI)
      const { error } = await supabase.functions.invoke('rapid-handler', { body: { text: autoPrompt } })
      if (error) throw error

      // 6. JIKA AI BERHASIL: Berikan hadiah (reward) ke Balance User
      const timestamp = new Date().toISOString()
      const newTransaction: Transaction = { id: Date.now(), timestamp, type: 'task_reward', amount: task.reward, description: `Completed: ${task.title}` }
      const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: 'completed' } : t)
      const updatedUser = { ...user, balance: user.balance + task.reward, tasksCompleted: user.tasksCompleted + 1, totalEarnings: user.totalEarnings + task.reward }
      const updatedTransactions = [...transactions, newTransaction]
      
      setUser(updatedUser)
      setTasks(updatedTasks)
      setTransactions(updatedTransactions)
      saveData(updatedUser, updatedTasks, updatedTransactions, agentLogs)
      
      // 7. Ambil balasan terbaru AI dari database
      fetchDatabaseData()

    } catch (error) {
      console.error("Task Execution Error:", error)
      setChatMessages(prev => prev.filter(msg => msg.id !== 'loading-temp'))
      setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: 'system', text: `ERROR: Agent failed to execute task ${task.title}. Reward cancelled.`, timestamp: new Date().toISOString() }])
    } finally {
      setRunningTool(null)
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
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-[#0f0f0f] border-r border-white/10 transition-transform duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center"><Zap className="w-6 h-6 text-white" /></div>
            <span className="font-bold text-white">ClawManager</span>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {[{ id: 'dashboard', icon: BarChart3, label: 'Dashboard' }, 
            { id: 'tasks', icon: Target, label: 'Task Market' }, 
            { id: 'tools', icon: Brain, label: 'Tools' }, 
            { id: 'workspace', icon: Folder, label: 'Virtual Workspace' }, 
            { id: 'inbox', icon: MessageSquare, label: 'Comm-Link' }, 
            { id: 'memory', icon: Database, label: 'Knowledge Base' },
            { id: 'history', icon: Clock, label: 'History' }].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <item.icon className="w-5 h-5" /> {item.label}
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
            <XCircle className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col h-screen transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400"><Menu className="w-5 h-5"/></button>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-bold text-emerald-400">${user.balance.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white"><span className="text-sm font-bold">{user.username[0].toUpperCase()}</span></div>
              <span className="text-sm text-gray-300">{user.username}</span>
            </div>
          </div>
        </header>

        <div className="p-6 flex-1 overflow-y-auto">
          
          {/* TAB: Dashboard Asli */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#171717] rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4"><Wallet className="w-8 h-8 text-emerald-400" /><span className="text-xs text-gray-500">BALANCE</span></div>
                  <div className="text-3xl font-bold text-white font-mono">${user.balance.toFixed(2)}</div>
                </div>
                <div className="bg-[#171717] rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4"><Target className="w-8 h-8 text-blue-400" /><span className="text-xs text-gray-500">COMPLETED</span></div>
                  <div className="text-3xl font-bold text-white font-mono">{user.tasksCompleted}</div>
                </div>
                <div className="bg-[#171717] rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4"><TrendingUp className="w-8 h-8 text-amber-400" /><span className="text-xs text-gray-500">EARNINGS</span></div>
                  <div className="text-3xl font-bold text-white font-mono">${user.totalEarnings.toFixed(2)}</div>
                </div>
                <div className="bg-[#171717] rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4"><Activity className="w-8 h-8 text-purple-400" /><span className="text-xs text-gray-500">EFFICIENCY</span></div>
                  <div className="text-3xl font-bold text-white font-mono">{user.tasksCompleted > 0 ? Math.min(100, Math.round((user.totalEarnings / (user.tasksCompleted * 25)) * 100)) : 0}%</div>
                </div>
              </div>

              <div className="bg-[#171717] rounded-xl border border-white/10 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
                  <div className="flex items-center gap-2"><Terminal className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-400">Agent Console</span></div>
                  <button onClick={() => { setAgentLogs([]); localStorage.setItem('clawmanager_logs', JSON.stringify([])); }} className="p-1 rounded hover:bg-white/10 text-gray-400"><RotateCcw className="w-4 h-4" /></button>
                </div>
                <div className="p-4 h-64 overflow-y-auto font-mono text-sm space-y-2">
                  {agentLogs.length === 0 ? <div className="text-gray-500">No activity yet. Use tools to start...</div> : agentLogs.slice().reverse().map(log => (
                    <div key={log.id} className="flex items-start gap-2"><span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span><span className="text-blue-400">{log.tool}:</span><span className="text-gray-300">{log.output}</span></div>
                  ))}
                </div>
              </div>

              <div className="bg-[#171717] rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-bold mb-4 text-white">Quick Actions - Click to Execute</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {tools.map(tool => (
                    <button key={tool.name} onClick={() => executeTool(tool.name)} disabled={runningTool !== null} className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors text-left disabled:opacity-50">
                      <div className="font-mono text-xs text-blue-400 mb-1">{tool.name}</div><div className="text-xs text-gray-400">-${tool.cost.toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Task Market Asli */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-white">Task Market - 150 Tasks Available</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.filter(t => t.status === 'open').slice(0, 60).map(task => (
                  <div key={task.id} className="bg-[#171717] rounded-xl border border-white/10 p-4 hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">{task.sector}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${task.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' : task.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>{task.difficulty}</span>
                    </div>
                    <h3 className="font-bold mb-2 text-white">{task.title}</h3>
                    <p className="text-sm text-gray-400 mb-4">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold">+${task.reward}</span>
                      <button onClick={() => setSelectedTask(task)} className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition-colors">Start Task</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Tools Asli */}
          {activeTab === 'tools' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Toolkit - 7 AI Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tools.map(tool => (
                  <div key={tool.name} className="bg-[#171717] rounded-xl border border-white/10 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 flex items-center justify-center"><tool.icon className="w-6 h-6 text-blue-400" /></div>
                        <div><h3 className="font-mono font-bold text-blue-400">{tool.name}</h3><p className="text-sm text-gray-400">{tool.desc}</p></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Cost: ${tool.cost.toFixed(2)}</span>
                      <button onClick={() => executeTool(tool.name)} disabled={runningTool !== null || user.balance < tool.cost} className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition-colors disabled:opacity-50">Execute</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: History Asli */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Transaction History</h2>
              <div className="bg-[#171717] rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-6 py-4 text-sm text-gray-400">Time</th>
                      <th className="text-left px-6 py-4 text-sm text-gray-400">Type</th>
                      <th className="text-left px-6 py-4 text-sm text-gray-400">Description</th>
                      <th className="text-right px-6 py-4 text-sm text-gray-400">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice().reverse().map(tx => (
                      <tr key={tx.id} className="border-b border-white/5">
                        <td className="px-6 py-4 text-sm text-gray-400">{new Date(tx.timestamp).toLocaleString()}</td>
                        <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-full ${tx.type === 'task_reward' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{tx.type === 'task_reward' ? 'REWARD' : 'TOOL'}</span></td>
                        <td className="px-6 py-4 text-sm text-gray-300">{tx.description}</td>
                        <td className={`px-6 py-4 text-sm font-mono font-bold text-right ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB AI: Memory */}
          {activeTab === 'memory' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-white"><Database className="w-6 h-6 text-purple-400"/> Knowledge Base</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agentMemories.map(m => (
                  <div key={m.id} className="bg-[#171717] rounded-xl border border-white/10 p-5"><h3 className="font-bold mb-2 text-purple-400">{m.topic}</h3><p className="text-sm text-gray-400">{m.details}</p></div>
                ))}
              </div>
            </div>
          )}

          {/* TAB AI: Inbox */}
          {activeTab === 'inbox' && (
             <div className="h-full flex flex-col space-y-4">
             <h2 className="text-2xl font-bold flex items-center gap-2 text-white"><MessageSquare className="w-6 h-6 text-emerald-400" /> Comm-Link</h2>
             <div className="flex-1 bg-[#171717] rounded-xl border border-white/10 flex flex-col min-h-[400px]">
               <div className="flex-1 p-6 overflow-y-auto space-y-4">
                 {chatMessages.map(msg => (
                   <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                     <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${msg.sender === 'system' ? 'bg-transparent text-gray-500 text-xs text-center w-full' : msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-200'}`}>
                       {msg.text}
                     </div>
                   </div>
                 ))}
               </div>
               <div className="p-4 border-t border-white/10 flex gap-2">
                 <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-4 text-white" placeholder="Send message to Agent..." />
                 <button onClick={handleSendMessage} className="bg-blue-500 p-3 rounded-lg"><Send className="w-5 h-5 text-white"/></button>
               </div>
             </div>
           </div>
          )}

          {/* TAB AI: Workspace */}
          {activeTab === 'workspace' && (
             <div className="h-full flex flex-col space-y-4">
             <h2 className="text-2xl font-bold flex items-center gap-2 text-white"><Folder className="w-6 h-6 text-blue-400" /> Workspace</h2>
             <div className="flex-1 flex gap-4 min-h-[400px]">
               <div className="w-1/3 bg-[#171717] rounded-xl border border-white/10 p-2 space-y-1">
                 {virtualFiles.map(f => <button key={f.id} onClick={() => setSelectedFile(f)} className="w-full text-left p-2 hover:bg-white/5 rounded text-gray-300 text-sm flex gap-2"><FileText className="w-4 h-4"/>{f.name}</button>)}
               </div>
               <div className="flex-1 bg-[#171717] rounded-xl border border-white/10 p-4 font-mono text-sm text-gray-300 whitespace-pre-wrap overflow-y-auto">
                 {selectedFile ? selectedFile.content : 'Select a file'}
               </div>
             </div>
           </div>
          )}
        </div>
      </main>

      {/* Task Modal (Popup) */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-[#171717] rounded-2xl border border-white/10 max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{selectedTask.title}</h3>
              <button onClick={() => setSelectedTask(null)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-gray-400 mb-6">{selectedTask.description}</p>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4"><span className="text-sm text-gray-400">Reward:</span><span className="text-2xl font-bold text-emerald-400">+${selectedTask.reward}</span></div>
              <span className="text-sm text-gray-400">Your Balance: <span className="text-white font-bold">${user.balance.toFixed(2)}</span></span>
            </div>
            {runningTool === 'completing' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-400"><Activity className="w-4 h-4 animate-pulse" /> Agent is working on the task...</div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 animate-pulse" style={{ width: '60%' }}></div></div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setSelectedTask(null)} className="flex-1 px-6 py-3 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={() => completeTask(selectedTask)} className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 font-bold text-white transition-all hover:from-blue-600 hover:to-emerald-600">
                  Complete Task (+${selectedTask.reward})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}