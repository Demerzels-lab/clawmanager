import { Brain, CheckSquare, Square, Cpu, ArrowRight, Wallet, Lock } from 'lucide-react'
import { User, Skill } from '../types'

interface ToolsTabProps {
  user: User
  runningTool: string | null
  purchaseUpgrade: (toolName: string) => void
  setActiveTab: (tab: any) => void
  trainingStep: 0 | 1 | 2
  setTrainingStep: (step: 0 | 1 | 2) => void
  selectedSkillIds: number[]
  setSelectedSkillIds: React.Dispatch<React.SetStateAction<number[]>>
}

// 21 REAL OPENCLAW SKILLS (Sesuai skills.json & OpenClaw Ecosystem)
export const AVAILABLE_SKILLS: Skill[] = [
  { id: 1, name: "artifacts-builder", slug: "artifacts-builder", description: "Suite of tools for creating elaborate HTML artifacts.", category: "Web Development", author: "seanphan", install_command: "npx clawhub install artifacts-builder", price: 15.00 },
  { id: 2, name: "claw-shell", slug: "claw-shell", description: "Execute advanced terminal commands & container management.", category: "DevOps", author: "imaginelogo", install_command: "npx clawhub install claw-shell", price: 20.50 },
  { id: 3, name: "exa-search", slug: "exa-search", description: "Deep neural web search bypassing standard API limits.", category: "Search", author: "demerzel", install_command: "npx clawhub install exa-search", price: 10.00 },
  { id: 4, name: "deep-research", slug: "deep-research", description: "Multi-agent internet research protocol for exhaustive data mining.", category: "Research", author: "openclaw-core", install_command: "npx clawhub install deep-research", price: 35.00 },
  { id: 5, name: "browser-use", slug: "browser-use", description: "Full headless browser automation for deep web scraping.", category: "Automation", author: "web-runner", install_command: "npx clawhub install browser-use", price: 30.00 },
  { id: 6, name: "comfyui-gen", slug: "comfyui-gen", description: "Node-based stable diffusion image and video generation pipeline.", category: "Media Gen", author: "synthweaver", install_command: "npx clawhub install comfyui-gen", price: 45.00 },
  { id: 7, name: "tavily-research", slug: "tavily-research", description: "Aggregated AI search engine tailored for rapid reconnaissance.", category: "Search", author: "tavily", install_command: "npx clawhub install tavily-research", price: 12.50 },
  { id: 8, name: "aws-infra", slug: "aws-infra", description: "Automated AWS infrastructure provisioning via Terraform hooks.", category: "Cloud", author: "cloud-architect", install_command: "npx clawhub install aws-infra", price: 50.00 },
  { id: 9, name: "playwright-cli", slug: "playwright-cli", description: "End-to-end testing and synthetic user monitoring toolkit.", category: "Automation", author: "qa-bot", install_command: "npx clawhub install playwright-cli", price: 22.00 },
  { id: 10, name: "moltbook-interact", slug: "moltbook-interact", description: "Social engineering toolkit for automated network interactions.", category: "Social", author: "ghost-net", install_command: "npx clawhub install moltbook-interact", price: 28.00 },
  { id: 11, name: "sql-map", slug: "sql-map", description: "Automated database vulnerability scanning and exploitation.", category: "Security", author: "sec-ops", install_command: "npx clawhub install sql-map", price: 40.00 },
  { id: 12, name: "crypto-tracker", slug: "crypto-tracker", description: "Real-time blockchain ledger analysis and wallet tracking.", category: "Finance", author: "chain-node", install_command: "npx clawhub install crypto-tracker", price: 35.00 },
  { id: 13, name: "github-pr", slug: "github-pr", description: "Autonomous code review and PR merging protocol.", category: "DevOps", author: "git-bot", install_command: "npx clawhub install github-pr", price: 25.00 },
  { id: 14, name: "clawdbot-zoho", slug: "clawdbot-zoho", description: "Complete Zoho Mail integration with OAuth2 & REST API.", category: "Communication", author: "openclaw-team", install_command: "npx clawhub install clawdbot-zoho-email", price: 18.00 },
  { id: 15, name: "linear-manager", slug: "linear-manager", description: "Agile sprint automation and issue tracking integration.", category: "Productivity", author: "task-runner", install_command: "npx clawhub install linear-manager", price: 15.00 },
  { id: 16, name: "notion-sync", slug: "notion-sync", description: "Bi-directional database synchronization for PKM.", category: "Notes & PKM", author: "knowledge-base", install_command: "npx clawhub install notion-sync", price: 12.00 },
  { id: 17, name: "smart-contract-auditor", slug: "smart-contract-auditor", description: "Static analysis tool for finding vulnerabilities in Solidity.", category: "Security", author: "web3-guard", install_command: "npx clawhub install contract-auditor", price: 55.00 },
  { id: 18, name: "seo-optimizer", slug: "seo-optimizer", description: "On-page and technical SEO auditing with AI recommendations.", category: "Marketing", author: "growth-hacker", install_command: "npx clawhub install seo-optimizer", price: 20.00 },
  { id: 19, name: "data-scraper-pro", slug: "data-scraper-pro", description: "High-volume proxy-rotated data extraction tool.", category: "Data", author: "data-miner", install_command: "npx clawhub install data-scraper", price: 38.00 },
  { id: 20, name: "youtube-transcript", slug: "youtube-transcript", description: "Fetch and summarize long-form video content rapidly.", category: "Media Gen", author: "tube-bot", install_command: "npx clawhub install yt-transcript", price: 14.00 },
  { id: 21, name: "discord-raid", slug: "discord-raid", description: "Community management and automated moderation bot.", category: "Social", author: "mod-father", install_command: "npx clawhub install discord-raid", price: 24.00 }
]

export default function ToolsTab({ setActiveTab, trainingStep, setTrainingStep, selectedSkillIds, setSelectedSkillIds }: ToolsTabProps) {

  if (trainingStep < 1) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in zoom-in-95">
         <div className="relative mb-6">
            <Lock className="w-20 h-20 text-green-500/20 absolute -inset-2 animate-ping" />
            <Lock className="w-16 h-16 text-zinc-700 relative z-10" />
         </div>
         <h2 className="text-2xl font-black text-red-500 uppercase tracking-widest mb-2 neon-glow-red">ACCESS DENIED</h2>
         <p className="text-zinc-500 font-mono text-xs mb-8 max-w-md leading-relaxed">Security protocol activated. You must initiate a formal Training Sequence from the MEDEA Command Core to access the OpenClaw Skill Registry.</p>
         <button onClick={() => setActiveTab('medea')} className="px-8 py-4 border border-green-500 text-green-500 font-black uppercase tracking-[0.2em] rounded-sm hover:bg-green-500 hover:text-black transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)]">
           Return to Command Core
         </button>
      </div>
    )
  }

  const toggleSkill = (skillId: number) => setSelectedSkillIds(prev => prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId])
  const totalComputeCost = selectedSkillIds.reduce((total, id) => total + (AVAILABLE_SKILLS.find(s => s.id === id)?.price || 0), 0)

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-32">
      <div className="mb-8 border-b border-green-500/20 pb-6">
        <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-sm bg-green-500/20 text-green-500 tracking-widest uppercase animate-pulse">Phase 1: OpenClaw Loadout</span>
        </div>
        <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
          <Brain className="w-8 h-8 text-green-500" /> Neural <span className="text-green-500">Skills</span>
        </h2>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-2">Inject official OpenClaw modules into MEDEA's temporary memory.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {AVAILABLE_SKILLS.map((skill) => {
          const isSelected = selectedSkillIds.includes(skill.id)
          return (
            <div key={skill.id} onClick={() => toggleSkill(skill.id)} className={`p-5 rounded-sm border transition-all cursor-pointer group flex flex-col justify-between ${isSelected ? 'bg-green-500/10 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.15)]' : 'bg-[#050505] border-green-500/10 hover:border-green-500/30'}`}>
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{isSelected ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />}</div>
                    <div>
                      <h3 className={`text-base font-black uppercase tracking-tighter ${isSelected ? 'text-green-400' : 'text-zinc-300'}`}>{skill.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                          <Cpu className="w-3 h-3 text-zinc-600" />
                          <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest truncate max-w-[120px]">{skill.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono pl-7 mb-4 line-clamp-3 leading-relaxed">{skill.description}</p>
              </div>
              <div className="text-right border-t border-green-500/10 pt-3">
                <span className="text-sm font-black text-amber-500">Ð{skill.price.toFixed(2)}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="fixed bottom-0 left-64 right-0 p-6 bg-gradient-to-t from-black via-[#050505] to-transparent pointer-events-none z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between bg-[#0a0a0a] border border-green-500/30 p-4 rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.9)] pointer-events-auto backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block">Est. Deployment Cost</span>
              <span className="text-xl font-black text-amber-500 flex items-center gap-2"><Wallet className="w-4 h-4" /> Ð{totalComputeCost.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (selectedSkillIds.length === 0) return alert("Select at least 1 module to proceed!")
              setTrainingStep(2); setActiveTab('tasks')
            }}
            disabled={selectedSkillIds.length === 0}
            className={`flex items-center gap-3 px-8 py-4 font-black uppercase tracking-[0.2em] rounded-sm transition-all cyber-button ${selectedSkillIds.length > 0 ? 'bg-green-500 text-black hover:bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'}`}
          >
            Next: Select Targets <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}