import { useRef, useState, useEffect, useMemo } from 'react'

// Neon green cyberpunk palette
const NEON = '#39FF14'
const NEON_DIM = 'rgba(57,255,20,0.12)'

interface Particle {
  id: number
  top: number
  left: number
  delay: number
  duration: number
  size: 'sm' | 'md' | 'lg'
  type: 'dot' | 'line' | 'square' | 'cross'
  opacity: number
  rotate: number
  movementX: number
  movementY: number
}

function useParticles(count: number): Particle[] {
  return useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 7,
      size: Math.random() > 0.8 ? 'lg' : Math.random() > 0.5 ? 'md' : 'sm',
      type: Math.random() > 0.8 ? 'cross' : Math.random() > 0.5 ? 'line' : Math.random() > 0.3 ? 'square' : 'dot',
      opacity: 0.1 + Math.random() * 0.4,
      rotate: Math.random() * 360,
      movementX: (Math.random() - 0.5) * 50, // Slight horizontal drift
      movementY: (Math.random() - 0.5) * 50  // Slight vertical drift
    }))
  }, [count])
}

const sizeMap = { sm: '2px', md: '4px', lg: '6px' }

export function InteractiveBackground() {
  const divRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const particles = useParticles(60) // Reduced count for better performance but more complex rendering
  
  // Glitch effect state
  const [glitchActive, setGlitchActive] = useState(false)

  // Random glitch trigger
  useEffect(() => {
    const triggerGlitch = () => {
      setGlitchActive(true)
      setTimeout(() => setGlitchActive(false), 150 + Math.random() * 200)
      
      // Random next glitch time (2s to 8s)
      const nextTime = 2000 + Math.random() * 6000
      setTimeout(triggerGlitch, nextTime)
    }
    
    const initialTimer = setTimeout(triggerGlitch, 3000)
    return () => clearTimeout(initialTimer)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return
    const rect = divRef.current.getBoundingClientRect()
    setMousePos({ 
      x: ((e.clientX - rect.left) / rect.width) * 100, 
      y: ((e.clientY - rect.top) / rect.height) * 100 
    })
    setIsHovering(true)
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setIsHovering(false)}
      className="fixed inset-0 z-0 overflow-hidden bg-[#020202] perspective-1000"
    >
      {/* ── GLOBAL NOISE OVERLAY ───────────────────────────── */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-[1]" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />

      {/* ── LAYER 1: 3D GRID FLOOR ─────────────────────────── */}
      <div className="absolute inset-x-[-50%] bottom-[-40%] h-[80%] opacity-20 pointer-events-none"
           style={{
             transform: 'perspective(500px) rotateX(60deg)',
             background: `
               linear-gradient(transparent 0%, ${NEON} 2%, transparent 3%),
               linear-gradient(90deg, transparent 0%, ${NEON} 2%, transparent 3%)
             `,
             backgroundSize: '60px 60px',
             animation: 'grid-move 20s linear infinite',
             maskImage: 'linear-gradient(to top, black 0%, transparent 100%)'
           }}
      />

      {/* ── LAYER 2: AMBIENT GLOW SPOTS ───────────────────── */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-10 pointer-events-none transition-transform duration-100 ease-out"
        style={{
          background: NEON,
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
      
      {/* ── LAYER 3: SCANLINES & HUD ELEMENTS ──────────────── */}
      <div className={`absolute inset-0 pointer-events-none ${glitchActive ? 'translate-x-1 opacity-80' : 'opacity-100'} transition-all duration-75`}>
        {/* Vertical random scan lines */}
        <div className="absolute left-[10%] top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-green-500/20 to-transparent" />
        <div className="absolute left-[90%] top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-green-500/20 to-transparent" />
        
        {/* Animated Horizontal Scanline */}
        <div 
          className="absolute left-0 w-full h-[2px] bg-green-500/30 shadow-[0_0_10px_rgba(57,255,20,0.5)] z-10"
          style={{ animation: 'scanline 6s linear infinite' }}
        />
      </div>

      {/* ── LAYER 4: PARTICLES ─────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => {
          const baseSize = sizeMap[p.size]
          
          // Parallax effect based on mouse position
          const parallaxX = (mousePos.x - 50) * (p.size === 'lg' ? 0.05 : 0.02)
          const parallaxY = (mousePos.y - 50) * (p.size === 'lg' ? 0.05 : 0.02)

          return (
            <div
              key={p.id}
              className="absolute flex items-center justify-center transition-transform duration-700 ease-out"
              style={{
                top: `${p.top}%`,
                left: `${p.left}%`,
                opacity: glitchActive && Math.random() > 0.7 ? 0 : p.opacity, // Flicker during glitch
                transform: `rotate(${p.rotate}deg) translate(${parallaxX}px, ${parallaxY}px)`,
                animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`
              }}
            >
              {/* Render different particle shapes */}
              {p.type === 'dot' && (
                <div style={{ width: baseSize, height: baseSize, background: NEON, borderRadius: '50%', boxShadow: `0 0 4px ${NEON}` }} />
              )}
              {p.type === 'square' && (
                <div style={{ width: baseSize, height: baseSize, border: `1px solid ${NEON}`, boxShadow: `0 0 2px ${NEON}` }} />
              )}
              {p.type === 'line' && (
                <div style={{ width: '40px', height: '1px', background: `linear-gradient(90deg, transparent, ${NEON}, transparent)`, opacity: 0.7 }} />
              )}
              {p.type === 'cross' && (
                <div className="relative" style={{ width: '10px', height: '10px' }}>
                  <div className="absolute top-1/2 left-0 w-full h-[1px] bg-green-500/60" />
                  <div className="absolute left-1/2 top-0 h-full w-[1px] bg-green-500/60" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── GLITCH OVERLAY (Flash) ─────────────────────────── */}
      {glitchActive && (
        <div className="absolute inset-0 bg-green-500/5 z-50 pointer-events-none mix-blend-overlay" />
      )}
      
      <style>{`
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 0 60px; }
        }
        @keyframes scanline {
          0% { top: -10%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  )
}
