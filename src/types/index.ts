export interface User { id: string; username: string; balance: number; tasksCompleted: number; totalEarnings: number; }
export interface Task { id: number; sector: string; title: string; description: string; reward: number; difficulty: string; status: string; }
export interface Transaction { id: number; timestamp: string; type: 'tool_usage' | 'task_reward'; tool?: string; amount: number; description: string; }
export interface AgentLog { id: number; tool: string; output: string; timestamp: string; }

// AI Integration Types
export interface VirtualFile { id: string; name: string; content: string; updatedAt: string; }
export interface clawmanager_tasksChatMessage { id: string; sender: 'user' | 'agent' | 'system'; text: string; timestamp: string; }
export interface AgentMemory { id: string; topic: string; details: string; timestamp: string; }