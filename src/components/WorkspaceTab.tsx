import { FileCode2, Terminal, FolderClosed, Zap } from 'lucide-react'
import { VirtualFile } from '../types'

interface WorkspaceTabProps {
  virtualFiles: VirtualFile[]
  selectedFile: VirtualFile | null
  setSelectedFile: (file: VirtualFile | null) => void
  newArtifactIds: string[]
  setNewArtifactIds: (ids: string[]) => void
}

export default function WorkspaceTab({ virtualFiles, selectedFile, setSelectedFile, newArtifactIds, setNewArtifactIds }: WorkspaceTabProps) {
  
  const handleSelectFile = (file: VirtualFile) => {
    setSelectedFile(file)
    // Hapus tanda "NEW" saat file diklik
    if (newArtifactIds.includes(file.id)) {
      setNewArtifactIds(newArtifactIds.filter(id => id !== file.id))
    }
  }

  return (
    <div className="max-w-6xl mx-auto h-[80vh] flex gap-6 animate-in fade-in duration-500">
      {/* Sidebar V-Files */}
      <div className="w-80 flex flex-col bg-[#050505] border border-green-500/20 rounded-sm overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="p-4 border-b border-green-500/20 bg-green-500/5">
          <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-2">
            <FolderClosed className="w-5 h-5 text-green-500" />
            Artifacts
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {virtualFiles.map((file) => {
            const isNew = newArtifactIds.includes(file.id)
            return (
              <button
                key={file.id}
                onClick={() => handleSelectFile(file)}
                className={`w-full text-left px-3 py-3 rounded-sm flex items-center justify-between transition-colors ${
                  selectedFile?.id === file.id
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : isNew 
                       ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30 animate-pulse'
                       : 'text-zinc-400 hover:bg-green-500/10 border border-transparent hover:border-green-500/20'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode2 className={`w-4 h-4 shrink-0 ${isNew ? 'text-amber-500' : 'text-green-500'}`} />
                  <span className="text-xs font-mono truncate">{file.name}</span>
                </div>
                {/* LABLE NEW */}
                {isNew && <span className="text-[8px] font-black bg-amber-500 text-black px-1.5 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1"><Zap className="w-3 h-3"/> New</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main File Viewer */}
      <div className="flex-1 bg-[#050505] border border-green-500/20 rounded-sm flex flex-col overflow-hidden">
        {selectedFile ? (
          <>
            <div className="px-6 py-4 border-b border-green-500/20 bg-green-500/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-green-500" />
                <span className="font-mono text-sm text-green-400">{selectedFile.name}</span>
              </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-[#020202]">
              <pre className="font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {selectedFile.content}
              </pre>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <Terminal className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-mono text-sm uppercase tracking-widest">Select an artifact to view content</p>
          </div>
        )}
      </div>
    </div>
  )
}