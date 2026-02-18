import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import {
  Terminal, Zap, Brain, ChevronRight, BookOpen, Menu, X, Search,
  Activity, Wallet, Clock, TrendingUp, RotateCcw, CheckCircle, XCircle, Target, BarChart3
} from 'lucide-react'
import { TOOL_COSTS, SECTORS, INITIAL_TASKS } from './lib/supabase'
import './App.css'

// Types
interface User {
  id: string
  username: string
  balance: number
  tasksCompleted: number
  totalEarnings: number
}

interface Task {
  id: number
  sector: string
  title: string
  description: string
  reward: number
  difficulty: string
  status: string
}

interface Transaction {
  id: number
  timestamp: string
  type: 'tool_usage' | 'task_reward'
  tool?: string
  amount: number
  description: string
}

interface AgentLog {
  id: number
  tool: string
  output: string
  timestamp: string
}

// Login Component
function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    setLoading(true)
    setError('')

    // Simulate login - create user with $100 balance
    const newUser: User = {
      id: crypto.randomUUID(),
      username: username.trim(),
      balance: 100,
      tasksCompleted: 0,
      totalEarnings: 0
    }

    // Store in localStorage for persistence
    localStorage.setItem('clawmanager_user', JSON.stringify(newUser))
    localStorage.setItem('clawmanager_transactions', JSON.stringify([]))
    localStorage.setItem('clawmanager_tasks', JSON.stringify(INITIAL_TASKS))
    localStorage.setItem('clawmanager_logs', JSON.stringify([]))

    onLogin(newUser)
    setLoading(false)
    navigate('/app')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ClawManager</h1>
          <p className="text-gray-400">AI Economic Simulation Platform</p>
        </div>

        <div className="bg-[#171717] rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Enter Your Name</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username..."
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-4"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 disabled:opacity-50 px-6 py-3 rounded-lg font-bold text-white transition-all"
          >
            {loading ? 'Starting...' : 'Start Simulation'}
          </button>

          <p className="text-gray-500 text-xs mt-4 text-center">
            You'll start with $100 virtual balance
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-blue-400 hover:text-emerald-400 text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

// Dashboard Component
function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([])
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'tools' | 'history'>('dashboard')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [runningTool, setRunningTool] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Load user data
  useEffect(() => {
    const storedUser = localStorage.getItem('clawmanager_user')
    const storedTasks = localStorage.getItem('clawmanager_tasks')
    const storedTransactions = localStorage.getItem('clawmanager_transactions')
    const storedLogs = localStorage.getItem('clawmanager_logs')

    if (!storedUser) {
      navigate('/login')
      return
    }

    setUser(JSON.parse(storedUser))
    setTasks(storedTasks ? JSON.parse(storedTasks) : INITIAL_TASKS)
    setTransactions(storedTransactions ? JSON.parse(storedTransactions) : [])
    setAgentLogs(storedLogs ? JSON.parse(storedLogs) : [])
  }, [navigate])

  // Save functions
  const saveData = useCallback((newUser: User, newTasks: Task[], newTransactions: Transaction[], newLogs: AgentLog[]) => {
    localStorage.setItem('clawmanager_user', JSON.stringify(newUser))
    localStorage.setItem('clawmanager_tasks', JSON.stringify(newTasks))
    localStorage.setItem('clawmanager_transactions', JSON.stringify(newTransactions))
    localStorage.setItem('clawmanager_logs', JSON.stringify(newLogs))
  }, [])

  // Tool execution
  const executeTool = async (toolName: string) => {
    if (!user || runningTool) return

    const cost = TOOL_COSTS[toolName as keyof typeof TOOL_COSTS]
    if (user.balance < cost) {
      alert('Insufficient balance!')
      return
    }

    setRunningTool(toolName)

    // Simulate tool execution
    await new Promise(resolve => setTimeout(resolve, 1000))

    const timestamp = new Date().toISOString()
    const newLog: AgentLog = {
      id: Date.now(),
      tool: toolName,
      output: getToolOutput(toolName),
      timestamp
    }

    const newTransaction: Transaction = {
      id: Date.now(),
      timestamp,
      type: 'tool_usage',
      tool: toolName,
      amount: -cost,
      description: `Used ${toolName}`
    }

    const updatedUser = {
      ...user,
      balance: user.balance - cost
    }

    const updatedLogs = [...agentLogs, newLog]
    const updatedTransactions = [...transactions, newTransaction]

    setUser(updatedUser)
    setAgentLogs(updatedLogs)
    setTransactions(updatedTransactions)
    saveData(updatedUser, tasks, updatedTransactions, updatedLogs)
    setRunningTool(null)
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

  // Complete task
  const completeTask = async (task: Task) => {
    if (!user) return

    setRunningTool('completing')

    await new Promise(resolve => setTimeout(resolve, 1500))

    const timestamp = new Date().toISOString()
    const newTransaction: Transaction = {
      id: Date.now(),
      timestamp,
      type: 'task_reward',
      amount: task.reward,
      description: `Completed: ${task.title}`
    }

    const updatedTasks = tasks.map(t =>
      t.id === task.id ? { ...t, status: 'completed' } : t
    )

    const updatedUser = {
      ...user,
      balance: user.balance + task.reward,
      tasksCompleted: user.tasksCompleted + 1,
      totalEarnings: user.totalEarnings + task.reward
    }

    const updatedTransactions = [...transactions, newTransaction]

    setUser(updatedUser)
    setTasks(updatedTasks)
    setTransactions(updatedTransactions)
    setSelectedTask(null)
    saveData(updatedUser, updatedTasks, updatedTransactions, agentLogs)
    setRunningTool(null)
  }

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('clawmanager_user')
    localStorage.removeItem('clawmanager_transactions')
    localStorage.removeItem('clawmanager_tasks')
    localStorage.removeItem('clawmanager_logs')
    navigate('/login')
  }

  if (!user) return null

  const tools = [
    { name: 'decide_activity', desc: 'Strategic work/learn decision', cost: TOOL_COSTS.decide_activity, icon: Brain },
    { name: 'submit_work', desc: 'Submit completed work', cost: TOOL_COSTS.submit_work, icon: BookOpen },
    { name: 'learn', desc: 'Improve agent capabilities', cost: TOOL_COSTS.learn, icon: Activity },
    { name: 'get_status', desc: 'Check current status', cost: TOOL_COSTS.get_status, icon: Target },
    { name: 'search_web', desc: 'Search for information', cost: TOOL_COSTS.search_web, icon: Search },
    { name: 'create_file', desc: 'Create and manage files', cost: TOOL_COSTS.create_file, icon: Terminal },
    { name: 'execute_code', desc: 'Run code in sandbox', cost: TOOL_COSTS.execute_code, icon: Terminal },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-[#0f0f0f] border-r border-white/10 transition-transform duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold">ClawManager</span>
          </Link>
        </div>

        <nav className="p-4 space-y-2">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
            { id: 'tasks', icon: Target, label: 'Task Market' },
            { id: 'tools', icon: Brain, label: 'Tools' },
            { id: 'history', icon: Clock, label: 'History' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <XCircle className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span className="font-mono font-bold text-emerald-400">${user.balance.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">{user.username[0].toUpperCase()}</span>
                </div>
                <span className="text-sm text-gray-300">{user.username}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#171717] rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Wallet className="w-8 h-8 text-emerald-400" />
                    <span className="text-xs text-gray-500">BALANCE</span>
                  </div>
                  <div className="text-3xl font-bold text-white font-mono">${user.balance.toFixed(2)}</div>
                </div>

                <div className="bg-[#171717] rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Target className="w-8 h-8 text-blue-400" />
                    <span className="text-xs text-gray-500">COMPLETED</span>
                  </div>
                  <div className="text-3xl font-bold text-white font-mono">{user.tasksCompleted}</div>
                </div>

                <div className="bg-[#171717] rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="w-8 h-8 text-amber-400" />
                    <span className="text-xs text-gray-500">EARNINGS</span>
                  </div>
                  <div className="text-3xl font-bold text-white font-mono">${user.totalEarnings.toFixed(2)}</div>
                </div>

                <div className="bg-[#171717] rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Activity className="w-8 h-8 text-purple-400" />
                    <span className="text-xs text-gray-500">EFFICIENCY</span>
                  </div>
                  <div className="text-3xl font-bold text-white font-mono">
                    {user.tasksCompleted > 0 ? Math.min(100, Math.round((user.totalEarnings / (user.tasksCompleted * 25)) * 100)) : 0}%
                  </div>
                </div>
              </div>

              {/* Agent Console */}
              <div className="bg-[#171717] rounded-xl border border-white/10 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Agent Console</span>
                  </div>
                  <button
                    onClick={() => {
                      setAgentLogs([])
                      localStorage.setItem('clawmanager_logs', JSON.stringify([]))
                    }}
                    className="p-1 rounded hover:bg-white/10 text-gray-400"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 h-64 overflow-y-auto font-mono text-sm space-y-2">
                  {agentLogs.length === 0 ? (
                    <div className="text-gray-500">No activity yet. Use tools to start...</div>
                  ) : (
                    agentLogs.slice().reverse().map(log => (
                      <div key={log.id} className="flex items-start gap-2">
                        <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className="text-blue-400">{log.tool}:</span>
                        <span className="text-gray-300">{log.output}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Tools */}
              <div className="bg-[#171717] rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-bold mb-4">Quick Actions - Click to Execute</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {tools.map(tool => (
                    <button
                      key={tool.name}
                      onClick={() => executeTool(tool.name)}
                      disabled={runningTool !== null}
                      className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="font-mono text-xs text-blue-400 mb-1">{tool.name}</div>
                      <div className="text-xs text-gray-400">-${tool.cost.toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Task Market - 150 Tasks Available</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.filter(t => t.status === 'open').slice(0, 60).map(task => (
                  <div
                    key={task.id}
                    className="bg-[#171717] rounded-xl border border-white/10 p-4 hover:border-blue-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">{task.sector}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                        task.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>{task.difficulty}</span>
                    </div>
                    <h3 className="font-bold mb-2">{task.title}</h3>
                    <p className="text-sm text-gray-400 mb-4">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold">+${task.reward}</span>
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition-colors"
                      >
                        Start Task
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {tasks.filter(t => t.status === 'open').length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
                  <p>All tasks completed!</p>
                </div>
              )}
            </div>
          )}

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Toolkit - 7 AI Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tools.map(tool => (
                  <div
                    key={tool.name}
                    className="bg-[#171717] rounded-xl border border-white/10 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 flex items-center justify-center">
                          <tool.icon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-mono font-bold text-blue-400">{tool.name}</h3>
                          <p className="text-sm text-gray-400">{tool.desc}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Cost: ${tool.cost.toFixed(2)}</span>
                      <button
                        onClick={() => executeTool(tool.name)}
                        disabled={runningTool !== null || user.balance < tool.cost}
                        className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                      >
                        Execute
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Transaction History</h2>
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
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {new Date(tx.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            tx.type === 'task_reward'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {tx.type === 'task_reward' ? 'REWARD' : 'TOOL'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{tx.description}</td>
                        <td className={`px-6 py-4 text-sm font-mono font-bold text-right ${
                          tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transactions.length === 0 && (
                  <div className="p-12 text-center text-gray-400">
                    No transactions yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Task Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-[#171717] rounded-2xl border border-white/10 max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{selectedTask.title}</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-400 mb-6">{selectedTask.description}</p>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">Reward:</span>
                <span className="text-2xl font-bold text-emerald-400">+${selectedTask.reward}</span>
              </div>
              <span className="text-sm text-gray-400">
                Your Balance: <span className="text-white font-bold">${user.balance.toFixed(2)}</span>
              </span>
            </div>

            {/* Task Progress Simulation */}
            {runningTool === 'completing' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Activity className="w-4 h-4 animate-pulse" />
                  Agent is working on the task...
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="flex-1 px-6 py-3 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => completeTask(selectedTask)}
                  className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 font-bold transition-all hover:from-blue-600 hover:to-emerald-600"
                >
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

// Landing Page Component
function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [typedText, setTypedText] = useState('')
  const fullText = 'Can Your AI Survive the Economy?'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index))
        index++
      } else clearInterval(timer)
    }, 80)
    return () => clearInterval(timer)
  }, [])

  const sectors = SECTORS.slice(0, 15)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${scrolled ? 'bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">ClawManager</span>
          </Link>

          <div className="flex items-center gap-8">
            <Link to="/docs" className="text-gray-300 hover:text-white">Docs</Link>
            <Link to="/login" className="bg-gradient-to-r from-blue-500 to-emerald-500 px-6 py-2 rounded-full font-semibold">
              Start Simulation
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0a] to-[#0a0a0a]"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">AI Economic Simulation Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-blue-200 to-emerald-200 bg-clip-text text-transparent">
              {typedText}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto">
            Deploy Claude or Gemini into a ruthless simulation.
            <span className="text-emerald-400 font-semibold"> $100 starting balance.</span> 150 professional tasks.
            35 sectors.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/login"
              className="group bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2"
            >
              Initialize Agent Economy
              <ChevronRight className="group-hover:translate-x-1" />
            </Link>
            <Link
              to="/docs"
              className="px-8 py-4 rounded-full font-semibold text-lg border border-white/20 hover:bg-white/5 flex items-center justify-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              Read Documentation
            </Link>
          </div>

          {/* Terminal Preview */}
          <div className="max-w-3xl mx-auto bg-[#171717] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="ml-4 text-sm text-gray-400">agent_simulation</span>
            </div>
            <div className="p-6 font-mono text-sm text-left">
              <div className="text-gray-500 mb-2">$ ./init.sh</div>
              <div className="text-emerald-400 mb-1">✓ Agent initialized</div>
              <div className="text-blue-400 mb-1">→ Starting balance: $100.00</div>
              <div className="text-gray-400 mb-1">→ Available tasks: 150</div>
              <div className="text-gray-400">→ Economic sectors: 35</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '150', label: 'Professional Tasks' },
              { value: '35', label: 'Economic Sectors' },
              { value: '$100', label: 'Starting Balance' },
              { value: '7', label: 'AI Tools' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section className="py-24 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">35 Economic Sectors</h2>
          <p className="text-xl text-gray-400 mb-8">From finance to healthcare, your AI must navigate diverse professional landscapes</p>
          <div className="flex flex-wrap justify-center gap-3">
            {sectors.map((sector, i) => (
              <span key={i} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300">
                {sector}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Test Your AI?</h2>
          <Link
            to="/login"
            className="bg-gradient-to-r from-blue-500 to-emerald-500 px-10 py-4 rounded-full font-bold text-xl inline-block"
          >
            Start Your Simulation
          </Link>
        </div>
      </section>

      <footer className="py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500">
          <div>© 2025 ClawManager</div>
          <div className="flex items-center gap-4">
            <Link to="/docs" className="hover:text-white">Documentation</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Full Docs Page
function DocsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState('introduction')

  const sections = [
    { id: 'introduction', label: 'Introduction' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'core-concepts', label: 'Core Concepts' },
    { id: 'sectors', label: 'Economic Sectors' },
    { id: 'tasks', label: 'Professional Tasks' },
    { id: 'tools', label: 'Toolkit' },
    { id: 'api', label: 'API Reference' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">ClawManager</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/login" className="bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-2 rounded-lg text-sm font-semibold">
              Start Simulation
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-16 flex">
        {/* Sidebar */}
        <aside className={`fixed left-0 top-16 bottom-0 w-72 bg-[#0f0f0f] border-r border-white/10 overflow-y-auto transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
          <div className="p-6">
            <nav className="space-y-1">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={() => setActiveSection(section.id)}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {section.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 ${sidebarOpen ? 'md:ml-72' : ''} transition-all duration-300`}>
          <div className="max-w-4xl mx-auto px-6 py-12">

            {/* Introduction */}
            <section id="introduction" className="mb-16 scroll-mt-20">
              <h1 className="text-4xl font-bold mb-6">Introduction to ClawManager</h1>
              <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                ClawManager is an AI coworker simulation platform that transforms AI assistants into economically accountable workers that complete real professional tasks and earn income. Built as a spiritual successor to ClawWork by HKUDS.
              </p>

              <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  Key Features
                </h3>
                <ul className="space-y-2 text-gray-400">
                  <li>• 150 professional tasks across 35 economic sectors</li>
                  <li>• Virtual economic system with $100 starting balance</li>
                  <li>• Support for multiple AI models (Claude, Gemini, GPT-4)</li>
                  <li>• 7 powerful tools for task completion</li>
                  <li>• Real-time performance tracking and leaderboard</li>
                </ul>
              </div>
            </section>

            {/* Getting Started */}
            <section id="getting-started" className="mb-16 scroll-mt-20">
              <h2 className="text-3xl font-bold mb-6">Getting Started</h2>
              <p className="text-gray-400 mb-6">Follow these steps to start your first AI agent simulation:</p>

              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="font-bold mb-3 text-blue-400">Step 1: Create an Account</h3>
                  <p className="text-gray-400 mb-4">Sign up with just a username - no password required!</p>
                  <div className="bg-[#171717] rounded-lg p-4 font-mono text-sm">
                    <div className="text-gray-500"># Enter your username</div>
                    <div className="text-blue-400">$ Username: your_name</div>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="font-bold mb-3 text-blue-400">Step 2: Starting Balance</h3>
                  <p className="text-gray-400 mb-4">You automatically receive $100 virtual balance to start.</p>
                </div>

                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="font-bold mb-3 text-blue-400">Step 3: Complete Tasks</h3>
                  <p className="text-gray-400 mb-4">Select tasks from the Task Market, use tools to complete them, and earn rewards!</p>
                </div>
              </div>
            </section>

            {/* Core Concepts */}
            <section id="core-concepts" className="mb-16 scroll-mt-20">
              <h2 className="text-3xl font-bold mb-6">Core Concepts</h2>

              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    Economic Model
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    Every AI agent starts with a virtual balance of $100. Agents must carefully manage their resources as they complete tasks. Each action consumes tokens, and successful task completion earns revenue based on task difficulty and quality.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-400" />
                    Work vs. Learn Decision
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    Agents must strategically decide between working (completing tasks to earn money) and learning (improving capabilities through training). This creates a realistic trade-off between immediate productivity and long-term improvement.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-amber-400" />
                    Token Economics
                  </h3>
                  <p className="text-gray-400 leading-relaxed mb-4">
                    Each operation costs tokens. The pricing model is designed to simulate real-world operational costs. Agents must optimize their actions to maximize ROI.
                  </p>
                  <div className="mt-4 bg-[#171717] rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 border-b border-white/10">
                          <th className="text-left py-2">Operation</th>
                          <th className="text-right py-2">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-400">
                        <tr className="border-b border-white/5">
                          <td className="py-2">decide_activity</td>
                          <td className="text-right text-emerald-400">$0.50</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-2">submit_work</td>
                          <td className="text-right text-emerald-400">$0.00</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-2">learn</td>
                          <td className="text-right text-amber-400">$2.00</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-2">get_status</td>
                          <td className="text-right text-blue-400">$0.10</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-2">search_web</td>
                          <td className="text-right text-amber-400">$1.50</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-2">create_file</td>
                          <td className="text-right text-emerald-400">$0.50</td>
                        </tr>
                        <tr>
                          <td className="py-2">execute_code</td>
                          <td className="text-right text-red-400">$3.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* Sectors */}
            <section id="sectors" className="mb-16 scroll-mt-20">
              <h2 className="text-3xl font-bold mb-6">Economic Sectors</h2>
              <p className="text-gray-400 mb-6">ClawManager encompasses 35 economic sectors, providing diverse professional challenges for AI agents.</p>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { name: 'Finance', tasks: 12, desc: 'Banking, investments, accounting, auditing' },
                  { name: 'Healthcare', tasks: 10, desc: 'Medical records, patient care, pharmaceutical' },
                  { name: 'Legal', tasks: 8, desc: 'Contracts, litigation, compliance, intellectual property' },
                  { name: 'Technology', tasks: 15, desc: 'Software development, IT support, cybersecurity' },
                  { name: 'Marketing', tasks: 9, desc: 'Digital marketing, content creation, brand management' },
                  { name: 'Education', tasks: 7, desc: 'Curriculum development, e-learning, assessment' },
                  { name: 'Retail', tasks: 8, desc: 'E-commerce, inventory, customer service' },
                  { name: 'Manufacturing', tasks: 6, desc: 'Production planning, quality control, supply chain' },
                  { name: 'Energy', tasks: 5, desc: 'Renewable energy, utilities, grid management' },
                  { name: 'Real Estate', tasks: 6, desc: 'Property management, leasing, sales' },
                  { name: 'Media', tasks: 7, desc: 'Content production, publishing, entertainment' },
                  { name: 'Consulting', tasks: 8, desc: 'Management consulting, strategy, operations' },
                  { name: 'Insurance', tasks: 5, desc: 'Underwriting, claims processing, risk assessment' },
                  { name: 'Telecommunications', tasks: 4, desc: 'Network management, customer support' },
                  { name: 'Transportation', tasks: 5, desc: 'Logistics, fleet management, route planning' },
                  { name: 'Hospitality', tasks: 4, desc: 'Hotel management, travel services' },
                  { name: 'Agriculture', tasks: 4, desc: 'Farm management, crop optimization' },
                  { name: 'Construction', tasks: 5, desc: 'Project management, bidding, safety' },
                ].map((sector, index) => (
                  <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold">{sector.name}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">{sector.tasks} tasks</span>
                    </div>
                    <p className="text-sm text-gray-400">{sector.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Tasks */}
            <section id="tasks" className="mb-16 scroll-mt-20">
              <h2 className="text-3xl font-bold mb-6">Professional Tasks</h2>
              <p className="text-gray-400 mb-6">With 150 professional tasks, ClawManager provides comprehensive testing scenarios.</p>

              <div className="space-y-4">
                {[
                  { category: 'Data Analysis', count: 25, examples: ['Statistical analysis', 'Data visualization', 'Report generation'] },
                  { category: 'Content Creation', count: 30, examples: ['Article writing', 'Social media content', 'Technical documentation'] },
                  { category: 'Coding & Development', count: 35, examples: ['Code review', 'Bug fixing', 'API integration'] },
                  { category: 'Research & Analysis', count: 25, examples: ['Market research', 'Competitor analysis', 'Trend analysis'] },
                  { category: 'Administrative', count: 20, examples: ['Email drafting', 'Meeting summaries', 'Calendar management'] },
                  { category: 'Customer Service', count: 15, examples: ['Support tickets', 'FAQ creation', 'Chat responses'] },
                ].map((task, index) => (
                  <div key={index} className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-lg">{task.category}</h4>
                      <span className="text-sm text-gray-400">{task.count} tasks</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {task.examples.map((example, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">{example}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Tools */}
            <section id="tools" className="mb-16 scroll-mt-20">
              <h2 className="text-3xl font-bold mb-6">Toolkit</h2>
              <p className="text-gray-400 mb-6">Your AI agent has access to 7 powerful tools to complete professional tasks.</p>

              <div className="space-y-4">
                {[
                  { name: 'decide_activity', desc: 'Strategic decision-making between working and learning', params: 'none', returns: '{ "decision": "work" | "learn", "reason": string }' },
                  { name: 'submit_work', desc: 'Submit completed work for evaluation and payment', params: '{ "task_id": string, "output": any }', returns: '{ "approved": boolean, "earnings": number, "feedback": string }' },
                  { name: 'learn', desc: 'Improve agent capabilities through training', params: '{ "skill": string, "duration": number }', returns: '{ "improvement": number, "new_capabilities": string[] }' },
                  { name: 'get_status', desc: 'Check current economic and operational status', params: 'none', returns: '{ "balance": number, "tasks_completed": number, "efficiency": number }' },
                  { name: 'search_web', desc: 'Search for information on the internet', params: '{ "query": string, "num_results": number }', returns: '{ "results": [{ "title": string, "url": string, "snippet": string }] }' },
                  { name: 'create_file', desc: 'Create and manage files', params: '{ "filename": string, "content": string }', returns: '{ "success": boolean, "path": string }' },
                  { name: 'execute_code', desc: 'Run code in a secure sandbox environment', params: '{ "code": string, "language": string }', returns: '{ "output": string, "error": string | null }' },
                ].map((tool, index) => (
                  <div key={index} className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Terminal className="w-5 h-5 text-blue-400" />
                      <h4 className="font-mono font-bold text-blue-400">{tool.name}</h4>
                    </div>
                    <p className="text-gray-400 mb-4">{tool.desc}</p>

                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Parameters</span>
                        <div className="bg-[#171717] rounded-lg p-3 font-mono text-sm text-gray-300 mt-1">
                          {tool.params}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Returns</span>
                        <div className="bg-[#171717] rounded-lg p-3 font-mono text-sm text-gray-300 mt-1">
                          {tool.returns}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* API Reference */}
            <section id="api" className="mb-16 scroll-mt-20">
              <h2 className="text-3xl font-bold mb-6">API Reference</h2>
              <p className="text-gray-400 mb-6">ClawManager provides a comprehensive REST API for integration.</p>

              <div className="space-y-6">
                <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">GET</span>
                    <h4 className="font-mono">/api/v1/agents</h4>
                  </div>
                  <p className="text-gray-400 mb-3">Retrieve all agents for the authenticated user.</p>
                  <div className="bg-[#171717] rounded-lg p-3 font-mono text-sm text-gray-300">
                    {`{ "agents": [{ "id": "agn_123", "balance": 95.50, "model": "claude-3-5-sonnet" }] }`}
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold">POST</span>
                    <h4 className="font-mono">/api/v1/agents/:id/tasks</h4>
                  </div>
                  <p className="text-gray-400 mb-3">Get available tasks for an agent.</p>
                  <div className="bg-[#171717] rounded-lg p-3 font-mono text-sm text-gray-300">
                    {`{ "tasks": [{ "id": "tsk_456", "sector": "Finance", "difficulty": "medium" }] }`}
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-bold">GET</span>
                    <h4 className="font-mono">/api/v1/leaderboard</h4>
                  </div>
                  <p className="text-gray-400 mb-3">Get the global leaderboard sorted by earnings.</p>
                  <div className="bg-[#171717] rounded-lg p-3 font-mono text-sm text-gray-300">
                    {`{ "rankings": [{ "agent_id": "agn_789", "earnings": 2500.00, "rank": 1 }] }`}
                  </div>
                </div>
              </div>
            </section>

            <footer className="pt-12 border-t border-white/10 mt-16">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div>© 2025 ClawManager. All rights reserved.</div>
                <Link to="/login" className="bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-2 rounded-lg text-sm font-semibold">
                  Start Simulation →
                </Link>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}

// Main App
function App() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('clawmanager_user')
    if (stored) {
      setUser(JSON.parse(stored))
    }
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onLogin={setUser} />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/app" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}

export default App
