import { useEffect, useState } from "react"

interface TerminalSplashProps {
  onComplete: () => void;
}

export function TerminalSplash({ onComplete }: TerminalSplashProps) {
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [fading, setFading] = useState(false);

  const bootSequence = [
    "CLAWMGR OS v3.1.2 — INIT",
    "Connecting to Hyper-Net Neural Gateway...",
    "Securing encrypted P2P tunnel...",
    "Loading Agent Core: [NOVA]...",
    "Neural weights synchronization complete.",
    "System online. Welcome, Operator."
  ];

  useEffect(() => {
    if (currentLine < bootSequence.length) {
      const timer = setTimeout(() => {
        setBootLines(prev => [...prev, bootSequence[currentLine]]);
        setCurrentLine(prev => prev + 1);
      }, 250); 
      return () => clearTimeout(timer);
    } else {
      // Pause briefly, then start fade-out, then call onComplete
      const pauseTimer = setTimeout(() => {
        setFading(true);
        setTimeout(() => onComplete(), 600);
      }, 600);
      return () => clearTimeout(pauseTimer);
    }
  }, [currentLine, onComplete]);

  return (
    <div
      className="fixed inset-0 bg-[#020202] flex flex-col items-center justify-center z-[100] font-mono text-green-400 overflow-hidden"
      style={{
        transition: 'opacity 0.6s ease, transform 0.6s ease, filter 0.6s ease',
        opacity: fading ? 0 : 1,
        transform: fading ? 'scale(1.04)' : 'scale(1)',
        filter: fading ? 'blur(8px)' : 'blur(0px)',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none"></div>
      
      {/* NEON PARTICLES */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-500/60 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 1}s`
            }}
          />
        ))}
      </div>
      
      {/* LOGO & ANIMATION */}
      <div className="mb-8 relative z-10">
        <div className="relative">
          <div className="absolute inset-[-8px] rounded-full border-2 border-green-500/20 animate-[spin_8s_linear_infinite]"></div>
          <div className="absolute inset-[-16px] rounded-full border border-green-500/10 animate-[spin_12s_linear_infinite_reverse]"></div>
          <div className="w-32 h-32 rounded-lg border-2 border-green-500 p-1 relative z-10 shadow-[0_0_40px_rgba(34,197,94,0.3)] bg-black/80 backdrop-blur-md overflow-hidden transform rotate-3">
             <div className="absolute inset-0 bg-green-500/10 animate-pulse"></div>
            {/* Placeholder for Belle Agent Image */}
            <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center text-green-500 font-bold text-xs text-center p-2 opacity-80">
              [ SYSTEM_LINKED ]
            </div>
            <img src="/logo.jpeg" alt="ClawManager Logo" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen" />
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-500/40 to-transparent"></div>
          </div>
        </div>
        <div className="text-center mt-6">
          <div className="text-green-500 font-black text-xs tracking-[0.4em] uppercase animate-pulse">
            Establishing Link
          </div>
        </div>
      </div>

      {/* BOOT TERMINAL */}
      <div className="bg-black/95 border border-green-500/40 p-6 rounded-sm max-w-lg w-full relative z-10 shadow-[0_0_50px_rgba(34,197,94,0.15)] backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-4 border-b border-green-500/20 pb-2">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
            <div className="w-2 h-2 rounded-full bg-green-500/50" />
            <span className="text-[10px] text-green-500/50 ml-2 uppercase tracking-widest font-bold">Encrypted Connection</span>
        </div>
        <div className="space-y-2 text-xs md:text-sm min-h-[160px]">
          {bootLines.map((line, index) => (
            <div key={index} className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-green-500 font-bold shrink-0">{`>>`}</span>
              <span className="text-green-50 font-mono tracking-wide leading-relaxed">{line}</span>
            </div>
          ))}
          {currentLine < bootSequence.length && (
            <div className="flex items-center gap-3">
              <span className="text-green-500 font-bold shrink-0">{`>>`}</span>
              <span className="w-2 h-4 bg-green-500 animate-pulse" />
            </div>
          )}
        </div>
        
        {/* PROGRESS BAR */}
        <div className="mt-8">
          <div className="flex justify-between text-[10px] text-green-500/60 mb-1 uppercase font-bold tracking-tighter">
            <span>Syncing Neural Core</span>
            <span>{Math.floor((currentLine / bootSequence.length) * 100)}%</span>
          </div>
          <div className="w-full h-1 bg-green-900/30 border border-green-500/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.6)]"
              style={{ width: `${(currentLine / bootSequence.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
