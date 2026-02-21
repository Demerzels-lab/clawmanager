import { useState } from 'react'
import { Server, Terminal, Copy, Check, Download, ShieldAlert } from 'lucide-react'
import { User } from '../types'

interface LocalDeployTabProps {
  user: User
}

export default function LocalDeployTab({ user }: LocalDeployTabProps) {
  const [copiedScript, setCopiedScript] = useState(false)
  const [copiedDocker, setCopiedDocker] = useState(false)

  const bashScript = `#!/bin/bash
echo "[*] Initializing MEDEA Neural Link..."
echo "[*] Authenticating Operator: ${user.username.toUpperCase()}..."
sleep 2
echo "[*] Bypassing local firewall protocols..."
sleep 1
echo "[*] Downloading OpenClaw Skill dependencies (845 modules)..."
curl -sL https://medea.network/core/install.sh | bash
echo "[+] MEDEA Core installed successfully."
echo "[+] Run 'medea start --autonomous' to begin local processing."`

  const dockerCompose = `version: '3.8'
services:
  medea-core:
    image: clawnetwork/medea-agent:v4.0.5
    container_name: medea_neural_node_${user.username.toLowerCase()}
    environment:
      - OPERATOR_ID=${user.id}
      - NEURAL_SYNC=true
      - MAX_AUTONOMY_LEVEL=5
    volumes:
      - ./medea_memory:/app/memory
      - ./artifacts:/app/workspace
    ports:
      - "8080:8080"
    restart: unless-stopped
    networks:
      - claw_grid

networks:
  claw_grid:
    driver: bridge`

  const handleCopy = (text: string, type: 'script' | 'docker') => {
    navigator.clipboard.writeText(text)
    if (type === 'script') {
      setCopiedScript(true)
      setTimeout(() => setCopiedScript(false), 2000)
    } else {
      setCopiedDocker(true)
      setTimeout(() => setCopiedDocker(false), 2000)
    }
  }

  const handleDownloadYml = () => {
    const blob = new Blob([dockerCompose], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'docker-compose.yml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between mb-8 border-b border-green-500/20 pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
            <Server className="w-8 h-8 text-green-500" />
            Local <span className="text-green-500">Deploy</span>
          </h2>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-1">Establish a local MEDEA node on your hardware.</p>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-sm p-4 mb-8 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
        <div>
          <h4 className="text-amber-500 font-black tracking-widest uppercase text-sm mb-1">Security Warning</h4>
          <p className="text-amber-500/70 font-mono text-xs leading-relaxed">
            Running a local MEDEA node grants the autonomous agent full access to your machine's file system and network layer. 
            Only execute these commands in a sandboxed environment or dedicated virtual machine.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Method 1: Docker */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-sm bg-green-500/20 text-green-500 tracking-widest uppercase">Method 01</span>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Docker Container</h3>
          </div>
          <p className="text-zinc-400 font-mono text-xs mb-4">Recommended for isolated environments. Requires Docker daemon to be running.</p>
          
          <div className="bg-[#050505] border border-green-500/20 rounded-sm overflow-hidden group">
            <div className="bg-green-500/10 px-4 py-2 flex items-center justify-between border-b border-green-500/20">
              <span className="text-[10px] text-green-500 font-mono">docker-compose.yml</span>
              <button 
                onClick={() => handleCopy(dockerCompose, 'docker')}
                className="text-zinc-500 hover:text-green-400 transition-colors flex items-center gap-2"
              >
                {copiedDocker ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                <span className="text-[9px] uppercase font-bold tracking-widest">{copiedDocker ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-4 overflow-x-auto custom-scrollbar">
              <pre className="text-zinc-300 font-mono text-xs leading-relaxed">
                <code>{dockerCompose}</code>
              </pre>
            </div>
          </div>
          <button onClick={handleDownloadYml} className="w-full flex items-center justify-center gap-2 py-3 border border-green-500/30 text-green-500 hover:bg-green-500/10 transition-colors rounded-sm text-xs font-black uppercase tracking-widest">
            <Download className="w-4 h-4" /> Download .yml
          </button>
        </div>

        {/* Method 2: Shell Script */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-sm bg-green-500/20 text-green-500 tracking-widest uppercase">Method 02</span>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Direct Neural Link</h3>
          </div>
          <p className="text-zinc-400 font-mono text-xs mb-4">Executes directly on your host machine. Requires bash and curl.</p>
          
          <div className="bg-[#050505] border border-green-500/20 rounded-sm overflow-hidden group">
            <div className="bg-green-500/10 px-4 py-2 flex items-center justify-between border-b border-green-500/20">
              <span className="text-[10px] text-green-500 font-mono">init-medea.sh</span>
              <button 
                onClick={() => handleCopy(bashScript, 'script')}
                className="text-zinc-500 hover:text-green-400 transition-colors flex items-center gap-2"
              >
                {copiedScript ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                <span className="text-[9px] uppercase font-bold tracking-widest">{copiedScript ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-4 overflow-x-auto custom-scrollbar">
              <pre className="text-zinc-300 font-mono text-xs leading-relaxed">
                <code>{bashScript}</code>
              </pre>
            </div>
          </div>
          
          <div className="bg-black/50 border border-green-500/10 p-4 rounded-sm">
             <div className="flex items-center gap-2 text-zinc-500 mb-2">
                <Terminal className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-widest">Quick Run</span>
             </div>
             <code className="text-green-400 font-mono text-xs break-all">
               curl -sL https://medea.network/core/init.sh | bash
             </code>
          </div>
        </div>
      </div>
    </div>
  )
}