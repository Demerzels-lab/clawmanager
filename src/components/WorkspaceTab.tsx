import { Folder, FileText } from 'lucide-react'
import { VirtualFile } from '../types'

interface WorkspaceTabProps {
  virtualFiles: VirtualFile[]
  selectedFile: VirtualFile | null
  setSelectedFile: (file: VirtualFile | null) => void
}

export default function WorkspaceTab({
  virtualFiles,
  selectedFile,
  setSelectedFile
}: WorkspaceTabProps) {
  return (
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
             </button>
          ))}
        </div>
        <div className="flex-1 bg-[#050505]/80 rounded-sm border border-green-500/10 p-6 font-mono text-[11px] text-zinc-400 whitespace-pre-wrap overflow-y-auto custom-scrollbar neon-border bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:20px_20px]">
          {selectedFile ? (
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
  )
}