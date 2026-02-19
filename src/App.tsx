import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { User } from './types'

// Import Halaman yang sudah dipecah
import LandingPage from './pages/Landing'
import DocsPage from './pages/Docs'
import LoginPage from './pages/Login'
import Dashboard from './pages/Dashboard'
import { TerminalSplash } from './components/TerminalSplash'

import './App.css'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('clawmanager_user')
    if (stored) {
      setUser(JSON.parse(stored))
    }

    const hasSeenSplash = sessionStorage.getItem('clawmanager_splash_seen')
    if (!hasSeenSplash) {
      setShowSplash(true)
    }
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
    sessionStorage.setItem('clawmanager_splash_seen', 'true')
  }

  if (showSplash) {
    return <TerminalSplash onComplete={handleSplashComplete} />
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/login" element={<LoginPage onLogin={setUser} />} />
        <Route path="/app" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}