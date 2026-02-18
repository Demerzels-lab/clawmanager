import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bpbtgkunrdzcoyfdhskh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYnRna3VucmR6Y295ZmRoc2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MjAzNzUsImV4cCI6MjA3ODQ5NjM3NX0.ZAtjUoDnIWUOs6Os1NUGKIRUQVOuXDlaCJ4HwQqZu50'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tool costs configuration
export const TOOL_COSTS = {
  decide_activity: 0.50,
  submit_work: 0.00,
  learn: 2.00,
  get_status: 0.10,
  search_web: 1.50,
  create_file: 0.50,
  execute_code: 3.00,
}

// Economic sectors (35 sectors)
export const SECTORS = [
  'Finance', 'Healthcare', 'Legal', 'Technology', 'Marketing',
  'Education', 'Retail', 'Manufacturing', 'Energy', 'Transportation',
  'Real Estate', 'Media', 'Consulting', 'Insurance', 'Telecommunications',
  'Hospitality', 'Agriculture', 'Construction', 'Banking', 'Pharmaceuticals',
  'Logistics', 'Entertainment', 'Sports', 'Fashion', 'Food & Beverage',
  'Automotive', 'Aerospace', 'Biotechnology', 'Nanotechnology', 'Robotics',
  'Cybersecurity', 'Blockchain', 'Artificial Intelligence', 'Quantum Computing', 'Gaming'
]

// Generate 150 tasks across sectors
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
    // Assign 4-5 tasks per sector
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

// Initial tasks (will be used if Supabase is not connected)
export const INITIAL_TASKS = generateTasks()
