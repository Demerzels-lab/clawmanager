import { MessageSquare, Send } from 'lucide-react'
import { ChatMessage } from '../types'

interface InboxTabProps {
  chatMessages: ChatMessage[]
  chatInput: string
  setChatInput: (input: string) => void
  handleSendMessage: () => void
  animatingMsgId: string | null
  animationText: string
  chatContainerRef: React.RefObject<HTMLDivElement>
}

export default function InboxTab({
  chatMessages,
  chatInput,
  setChatInput,
  handleSendMessage,
  animatingMsgId,
  animationText,
  chatContainerRef
}: InboxTabProps) {
  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-green-500/20 pb-4">
         <MessageSquare className="w-6 h-6 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
         <h2 className="text-xl font-black text-white italic tracking-tighter">NEURAL_COMM_LINK</h2>
      </div>
      <div className="flex-1 bg-[#050505]/60 rounded-sm border border-green-500/10 flex flex-col min-h-[500px] neon-border overflow-hidden">
        <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar bg-black/40">
          {chatMessages.map((msg, msgIdx) => {
            const isAnimatingBubble = animatingMsgId !== null && msgIdx === chatMessages.length - 1 && msg.sender === 'agent'
            return (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              {msg.sender === 'system' && !isAnimatingBubble ? (
                 <div className="w-full flex justify-center py-2">
                     <span className="text-[9px] font-black text-green-900 uppercase tracking-[0.3em] font-mono animate-pulse">{msg.text}</span>
                 </div>
              ) : (
                 <div className={`max-w-[85%] rounded-sm px-4 py-3 border relative group ${
                     msg.sender === 'user'
                         ? 'bg-green-500/10 border-green-500/30 text-green-100 ml-12'
                         : 'bg-black/80 border-white/10 text-zinc-300 mr-12 shadow-[0_5px_15px_rgba(0,0,0,0.4)]'
                 }`}>
                   <div className="flex items-center gap-2 mb-1.5 border-b border-white/5 pb-1">
                     <div className={`w-1.5 h-1.5 rounded-full ${msg.sender === 'user' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                     <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
                       {msg.sender === 'user' ? 'Operator' : 'Nova_v4'}
                     </span>
                     <span className="text-[8px] opacity-20 ml-auto font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                   </div>

                   <div className="whitespace-pre-wrap text-[11px] font-mono tracking-tighter leading-relaxed">
                     {isAnimatingBubble ? (
                         <div className="flex items-center gap-3 py-2 px-1">
                           <div className="flex gap-1">
                             {[0,1,2].map(i => (
                               <div key={i} className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                             ))}
                           </div>
                           <span className="text-[10px] text-green-400/70 font-mono tracking-wide">{animationText || 'Uplink established . . .'}</span>
                         </div>
                     ) : (
                        msg.text.split('**').map((part, i) => i % 2 === 1 ? <b key={i} className="text-green-400 font-extrabold">{part}</b> : part)
                     )}
                   </div>
                 </div>
              )}
            </div>
          )
          })}
        </div>
        <div className="p-4 bg-[#050505] border-t border-green-500/10 flex gap-4">
          <input
             type="text"
             value={chatInput}
             onChange={(e) => setChatInput(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
             className="flex-1 bg-black/50 border border-green-500/20 rounded-sm px-4 py-3 text-[11px] font-mono text-green-400 placeholder:text-green-900 focus:outline-none focus:border-green-500/50 uppercase"
             placeholder="Enter command sequence..."
           />
          <button onClick={handleSendMessage} className="bg-green-500/10 border border-green-500/40 p-3 rounded-sm hover:bg-green-500 hover:text-black transition-all group cyber-button">
             <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/>
          </button>
        </div>
      </div>
    </div>
  )
}