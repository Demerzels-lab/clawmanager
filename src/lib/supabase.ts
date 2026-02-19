import { createClient } from '@supabase/supabase-js'

// Koneksi Supabase Asli (Tidak diubah)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase env variables!")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tool costs configuration (Tidak diubah)
export const TOOL_COSTS = {
  decide_activity: 0.50,
  submit_work: 0.00,
  learn: 2.00,
  get_status: 0.10,
  search_web: 1.50,
  create_file: 0.50,
  execute_code: 3.00,
}

// Economic sectors (35 sectors) (Tidak diubah)
export const SECTORS = [
  'Finance', 'Healthcare', 'Legal', 'Technology', 'Marketing',
  'Education', 'Retail', 'Manufacturing', 'Energy', 'Transportation',
  'Real Estate', 'Media', 'Consulting', 'Insurance', 'Telecommunications',
  'Hospitality', 'Agriculture', 'Construction', 'Banking', 'Pharmaceuticals',
  'Logistics', 'Entertainment', 'Sports', 'Fashion', 'Food & Beverage',
  'Automotive', 'Aerospace', 'Biotechnology', 'Nanotechnology', 'Robotics',
  'Cybersecurity', 'Blockchain', 'Artificial Intelligence', 'Quantum Computing', 'Gaming'
]

// Generate 150 tasks across sectors (Tidak diubah)
export const generateTasks = () => {
  const tasks = []
  const taskTypes = [
    { type: 'Data Analysis', reward: [15, 35] },
    { type: 'Content Creation', reward: [10, 25] },
    { type: 'Coding & Development', reward: [20, 50] },
    { type: 'Research & Analysis', reward: [15, 30] },
    { type: 'Administrative', reward: [8, 15] },
    { type: 'Customer Service', reward: [10, 20] },
  ]

  let taskId = 1
  SECTORS.forEach((sector, sectorIndex) => {
    const tasksPerSector = sectorIndex < 20 ? 5 : 4

    for (let i = 0; i < tasksPerSector; i++) {
      const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)]
      const reward = Math.floor(Math.random() * (taskType.reward[1] - taskType.reward[0]) + taskType.reward[0])

      tasks.push({
        id: taskId++,
        sector,
        title: `${taskType.type} - ${sector}`,
        description: `Complete ${taskType.type.toLowerCase()} task in ${sector} sector`,
        reward,
        difficulty: reward > 30 ? 'hard' : reward > 15 ? 'medium' : 'easy',
        status: 'open'
      })
    }
  })

  return tasks.slice(0, 150)
}

export const INITIAL_TASKS = generateTasks()

// ==========================================
// BAGIAN BARU: NANOBOT INTEGRATION MODULE
// ==========================================

// Tipe Data untuk Virtual Workspace (Filesystem Simulasi)
export interface VirtualFile {
  id: string
  name: string
  content: string
  updatedAt: string
}

// Tipe Data untuk Inbox (Komunikasi Simulasi)
export interface ChatMessage {
  id: string
  sender: 'user' | 'agent' | 'system'
  text: string
  timestamp: string
}

// Data Awal (Mock) untuk Virtual Workspace
export const INITIAL_FILES: VirtualFile[] = [
  {
    id: '1',
    name: 'agent_notes.txt',
    content: 'System Initialized. Awaiting tasks...\n- Model: OpenRouter (Simulation)\n- Status: Standby',
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'config.json',
    content: '{\n  "mode": "autonomous",\n  "max_budget": 100\n}',
    updatedAt: new Date().toISOString()
  }
]

// Data Awal (Mock) untuk Inbox
export const INITIAL_MESSAGES: ChatMessage[] = [
  { 
    id: '1', 
    sender: 'system', 
    text: 'Nanobot Comm-Link Established.', 
    timestamp: new Date().toISOString() 
  },
  { 
    id: '2', 
    sender: 'agent', 
    text: 'Hello! I am ready to process tasks or execute commands from this channel.', 
    timestamp: new Date().toISOString() 
  }
]

// Note: Fungsi-fungsi untuk Fetch/Insert ke tabel Supabase yang sebenarnya 
// (seperti getVirtualFiles, sendMessageToAgent) akan ditambahkan di sini 
// pada Langkah 3 setelah tabel Supabase dibuat.