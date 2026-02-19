import { Brain, Terminal, Wallet, Zap } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

export default function DocsPage() {
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