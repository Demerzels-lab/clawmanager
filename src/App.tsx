import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { User } from './types'

import LandingPage from './pages/Landing'
import DocsPage from './pages/Docs'
import LoginPage from './pages/Login'
import Dashboard from './pages/Dashboard'
import { TerminalSplash } from './components/TerminalSplash'

import './App.css'

// Wraps every page with a smooth fade+slide-up on enter
function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })
    return () => cancelAnimationFrame(t)
  }, [location.pathname])

  return (
    <div
      style={{
        transition: 'opacity 0.45s ease, transform 0.45s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
      }}
    >
      {children}
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [showSplash, setShowSplash] = useState(false)
  const [appVisible, setAppVisible] = useState(false)
  const didInit = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    const stored = localStorage.getItem('clawmanager_user')
    if (stored) setUser(JSON.parse(stored))

    const hasSeenSplash = sessionStorage.getItem('clawmanager_splash_seen')
    if (!hasSeenSplash) {
      setShowSplash(true)
    } else {
      // No splash: fade the app in
      requestAnimationFrame(() => requestAnimationFrame(() => setAppVisible(true)))
    }
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
    sessionStorage.setItem('clawmanager_splash_seen', 'true')
    requestAnimationFrame(() => requestAnimationFrame(() => setAppVisible(true)))
  }

  if (showSplash) {
    return <TerminalSplash onComplete={handleSplashComplete} />
  }

  return (
    <div
      style={{
        transition: 'opacity 0.5s ease',
        opacity: appVisible ? 1 : 0,
      }}
    >
      <Router>
        <PageTransition>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/login" element={<LoginPage onLogin={setUser} />} />
            <Route path="/app" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          </Routes>
        </PageTransition>
      </Router>
    </div>
  )
}